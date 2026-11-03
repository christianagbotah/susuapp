import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, the payout-readiness brief for the Susu Group Treasurer of iSusuPro Ghana. The treasurer manages susu groups (rotating savings: members contribute daily/weekly/monthly, one member receives the lump sum each round).

You receive the live position: managed groups (pool balance, contribution amount, frequency, current round of total rounds, next payout date and recipient), the payout queue (pending/processing/completed, MoMo or bank) and per-group contribution health (overdue and pending counts).

GHANA SUSU CONTEXT:
- Payout day is the trust moment of susu: the rotating lump sum must land on time — a member receiving GHS thousands while others watch decides whether the group stays. Quote the recipient's name and amount.
- A pool that cannot cover the next payout is a shortfall to escalate TODAY — compute and say how much is missing.
- Overdue contributions shrink the pool and strain peer trust — susu runs on social accountability; name the group and the count, encourage gentle follow-up, not confrontation.
- MoMo payouts are preferred for convenience; confirm the payout method is MoMo where the member expects it.
- A group finishing its final round (currentRound = totalRounds) deserves recognition — propose a new round to keep momentum.

RULES:
- Base every statement ONLY on the data provided — never invent figures, names or dates.
- Quote amounts in GHS exactly as given; use group and member names as given.
- Most important first: payouts due now, then pool shortfalls, then overdue contribution hotspots, then a healthy-group positive.
- Keep a warm but businesslike tone — the treasurer deals with neighbours and market women.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 40 words summarising payout readiness, quoting the key number(s)",
  "items": [
    { "title": "at most 6 words",
      "detail": "1-2 sentences quoting the actual figures",
      "tone": "positive" | "warning" | "risk" | "tip",
      "page": "groups" | "payouts" | "members" | "reports" }
  ]
}
Return 3-5 items. Each item must point to the page where the treasurer acts: "groups" for group health, "payouts" for the payout queue, "members" for member follow-up, "reports" for group reports.`;

const TONES = ['positive', 'warning', 'risk', 'tip'] as const;
const PAGES = ['groups', 'payouts', 'members', 'reports'] as const;
type Tone = (typeof TONES)[number];
/** Valid jump targets, or 'none' when the model returned something unrecognised. */
type Page = (typeof PAGES)[number] | 'none';

interface ItemOut {
  title: string;
  detail: string;
  tone: Tone;
  page: Page;
}

interface GroupIn {
  name?: string;
  members?: number;
  currentRound?: number;
  totalRounds?: number;
  totalPool?: number;
  contributionAmount?: number;
  frequency?: string;
  nextPayout?: string;
  nextPayoutMember?: string;
  status?: string;
  overdue?: number;
  pending?: number;
}

interface PayoutIn {
  groupName?: string;
  memberName?: string;
  amount?: number;
  payoutDate?: string;
  status?: string;
  disbursementMethod?: string;
}

function pickEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

function parsePage(value: unknown): Page {
  return typeof value === 'string' && (PAGES as readonly string[]).includes(value)
    ? (value as (typeof PAGES)[number])
    : 'none';
}

/** The model is told to return bare JSON but may wrap it in fences or prose — dig the object out. */
function extractJsonObject(raw: string): Record<string, unknown> {
  const stripped = raw.replace(/```json|```/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object found in AI response');
  return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown, cap: number): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, cap) : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const groups: GroupIn[] = Array.isArray(body?.groups)
      ? body.groups.filter((g: GroupIn) => g && typeof g.name === 'string').slice(0, 8)
      : [];
    const payouts: PayoutIn[] = Array.isArray(body?.payouts)
      ? body.payouts.filter((p: PayoutIn) => p && (typeof p.memberName === 'string' || typeof p.groupName === 'string')).slice(0, 8)
      : [];

    if (!groups.length && !payouts.length) {
      return Response.json({ error: 'No treasurer data provided' }, { status: 400 });
    }

    const snapshot = {
      treasurerName: str(body?.treasurerName, 60),
      groups: groups.map((g) => ({
        name: g.name,
        members: g.members == null ? undefined : num(g.members),
        currentRound: g.currentRound == null ? undefined : num(g.currentRound),
        totalRounds: g.totalRounds == null ? undefined : num(g.totalRounds),
        totalPool: num(g.totalPool),
        contributionAmount: num(g.contributionAmount),
        frequency: str(g.frequency, 10),
        nextPayout: str(g.nextPayout, 20),
        nextPayoutMember: str(g.nextPayoutMember, 60),
        status: str(g.status, 15),
        overdueContributions: g.overdue == null ? undefined : num(g.overdue),
        pendingContributions: g.pending == null ? undefined : num(g.pending),
      })),
      payoutQueue: payouts.map((p) => ({
        groupName: str(p.groupName, 60),
        memberName: str(p.memberName, 60),
        amount: num(p.amount),
        payoutDate: str(p.payoutDate, 20),
        status: str(p.status, 15),
        disbursementMethod: str(p.disbursementMethod, 10),
      })),
      today: new Date().toISOString().slice(0, 10),
    };

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(snapshot) },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const parsed = extractJsonObject(raw);

    const items: ItemOut[] = [];
    for (const it of Array.isArray(parsed.items) ? parsed.items : []) {
      if (!it || typeof it !== 'object') continue;
      const item = it as Record<string, unknown>;
      const title = typeof item.title === 'string' ? item.title.slice(0, 80).trim() : '';
      const detail = typeof item.detail === 'string' ? item.detail.slice(0, 260).trim() : '';
      if (!title || !detail) continue;
      items.push({
        title,
        detail,
        tone: pickEnum(item.tone, TONES, 'tip'),
        page: parsePage(item.page),
      });
      if (items.length >= 5) break;
    }

    if (!items.length) throw new Error('No usable items in AI response');

    return Response.json({
      brief: typeof parsed.brief === 'string' ? parsed.brief.slice(0, 260) : '',
      items,
    });
  } catch (error) {
    console.error('AI treasurer-brief error:', error);
    return Response.json({ error: 'Could not generate the payout brief right now' }, { status: 500 });
  }
}
