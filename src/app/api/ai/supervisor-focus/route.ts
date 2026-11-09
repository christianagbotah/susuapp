import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, the morning focus brief for the Field Supervisor of iSusuPro Ghana (susu savings & microfinance). The supervisor manages susu collection agents working Accra's markets.

You receive the live field position: agents (status in_field/at_office/offline, today's collections vs expected, collection rate, float balance they carry, collections pending verification, last sync time), routes (daily target vs collected, pending/missed stops) and recent spot checks (rating, cash matched, issues found).

GHANA FIELD CONTEXT:
- Market traders leave their stalls by mid-afternoon — collection gaps on market day must be closed NOW, not tomorrow.
- An OFFLINE agent is carrying unverified customer cash (their float) with no live sync — that is a cash-in-transit risk; the supervisor should reach them or their collections first.
- Collections pending verification mean receipts not confirmed against cash — mismatches surface at spot checks.
- A missed stop needs a same-day revisit; a low collection-rate agent needs supportive coaching, not blame — Ghanaian agents respond to encouragement.
- Large float balances sitting with an agent at close of day are custody risk — push for bank/MoMo sweep.

RULES:
- Base every statement ONLY on the data provided — never invent figures, names or areas.
- Quote amounts in GHS and percentages exactly as given.
- Most important items first: offline/unsynced agents with cash, big collection shortfalls, missed stops, then pending verifications, then a genuine performer worth praising.
- Keep an encouraging, practical tone — the supervisor reads this once and acts.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 40 words summarising the field position, quoting the key number(s)",
  "items": [
    { "title": "at most 6 words",
      "detail": "1-2 sentences quoting the actual figures",
      "tone": "positive" | "warning" | "risk" | "tip",
      "page": "agents" | "routes" | "spot-checks" }
  ]
}
Return 3-5 items. Each item must point to the page where the supervisor acts: "agents" for reaching/coaching agents, "routes" for today's collection routes, "spot-checks" for verification checks.`;

const TONES = ['positive', 'warning', 'risk', 'tip'] as const;
const PAGES = ['agents', 'routes', 'spot-checks'] as const;
type Tone = (typeof TONES)[number];
/** Valid jump targets, or 'none' when the model returned something unrecognised. */
type Page = (typeof PAGES)[number] | 'none';

interface ItemOut {
  title: string;
  detail: string;
  tone: Tone;
  page: Page;
}

interface AgentIn {
  name?: string;
  area?: string;
  status?: string;
  todayCollections?: number;
  expectedToday?: number;
  collectionRate?: number;
  floatBalance?: number;
  pendingVerify?: number;
  lastSync?: string;
}

interface RouteIn {
  name?: string;
  area?: string;
  agentName?: string;
  dailyTarget?: number;
  collectedToday?: number;
  status?: string;
  stopsPending?: number;
  stopsMissed?: number;
}

interface CheckIn {
  agentName?: string;
  rating?: string;
  cashMatched?: boolean;
  issuesFound?: string[];
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
    const agents: AgentIn[] = Array.isArray(body?.agents)
      ? body.agents.filter((a: AgentIn) => a && typeof a.name === 'string').slice(0, 10)
      : [];
    const routes: RouteIn[] = Array.isArray(body?.routes)
      ? body.routes.filter((r: RouteIn) => r && typeof r.name === 'string').slice(0, 8)
      : [];
    const checks: CheckIn[] = Array.isArray(body?.spotChecks)
      ? body.spotChecks.filter((c: CheckIn) => c && typeof c.agentName === 'string').slice(0, 5)
      : [];

    if (!agents.length && !routes.length && !checks.length) {
      return Response.json({ error: 'No field data provided' }, { status: 400 });
    }

    const snapshot = {
      supervisorName: str(body?.supervisorName, 60),
      branch: str(body?.branch, 60),
      agents: agents.map((a) => ({
        name: a.name,
        area: str(a.area, 40),
        status: str(a.status, 20),
        todayCollections: num(a.todayCollections),
        expectedToday: num(a.expectedToday),
        collectionRatePct: a.collectionRate == null ? undefined : num(a.collectionRate),
        floatBalance: num(a.floatBalance),
        pendingVerify: a.pendingVerify == null ? undefined : num(a.pendingVerify),
        lastSync: str(a.lastSync, 20),
      })),
      routes: routes.map((r) => ({
        name: r.name,
        area: str(r.area, 60),
        agentName: str(r.agentName, 60),
        dailyTarget: num(r.dailyTarget),
        collectedToday: num(r.collectedToday),
        status: str(r.status, 20),
        stopsPending: r.stopsPending == null ? undefined : num(r.stopsPending),
        stopsMissed: r.stopsMissed == null ? undefined : num(r.stopsMissed),
      })),
      recentSpotChecks: checks.map((c) => ({
        agentName: c.agentName,
        rating: str(c.rating, 20),
        cashMatched: !!c.cashMatched,
        issuesFound: Array.isArray(c.issuesFound) ? c.issuesFound.slice(0, 3).map((i) => String(i).slice(0, 60)) : undefined,
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
    console.error('AI supervisor-focus error:', error);
    return Response.json({ error: 'Could not generate the field focus right now' }, { status: 500 });
  }
}
