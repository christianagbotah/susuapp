import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, the drawer check for the Teller of iSusuPro Ghana (susu savings & microfinance counter). You read the teller's live cash drawer, counter queue, vault transfers and end-of-day reconciliation lines, and return what needs attention before close of day.

You receive: the drawer (opening float, cash in/out, expected vs counted balance, variance, status), the counter queue (waiting/processing customers with type, amount, channel), pending vault transfers, and EOD reconciliation lines per channel (cash, MoMo MTN/Telecel/AT, cheque, float) with system vs counted totals.

GHANA TELLER CONTEXT:
- A drawer variance (counted ≠ expected) must be explained and resolved before close — cash custody rules under Bank of Ghana supervision; quote the exact variance. A balanced drawer is a win worth saying.
- Waiting customers are felt at the counter — midday is peak; quote how many and what they need (deposit, withdrawal, susu collection).
- A vault transfer stuck at 'requested' or 'in_transit' locks cash the counter may need for withdrawals — escalate; excess cash in the drawer should be swept to vault.
- MoMo settlement lines (MTN, Telecel, AT) drift from system totals most often — flag lines with a non-zero variance and name the channel.
- Large single transactions (above GHS 10,000) handled today may need extra verification paperwork.

RULES:
- Base every statement ONLY on the data provided — never invent figures, names or channels.
- Quote amounts in GHS exactly as given.
- Most important first: drawer variance, stuck vault transfers, EOD channel variances, then queue pressure, then a balanced/clean positive.
- Keep a brisk, practical tone — a teller between customers reads one glance.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 40 words summarising the counter position, quoting the key number(s)",
  "items": [
    { "title": "at most 6 words",
      "detail": "1-2 sentences quoting the actual figures",
      "tone": "positive" | "warning" | "risk" | "tip",
      "page": "counter" | "reconciliation" | "vault" }
  ]
}
Return 3-5 items. Each item must point to the page where the teller acts: "counter" for the customer queue, "reconciliation" for drawer/EOD matching, "vault" for cash movements.`;

const TONES = ['positive', 'warning', 'risk', 'tip'] as const;
const PAGES = ['counter', 'reconciliation', 'vault'] as const;
type Tone = (typeof TONES)[number];
/** Valid jump targets, or 'none' when the model returned something unrecognised. */
type Page = (typeof PAGES)[number] | 'none';

interface ItemOut {
  title: string;
  detail: string;
  tone: Tone;
  page: Page;
}

interface DrawerIn {
  openingFloat?: number;
  cashIn?: number;
  cashOut?: number;
  expectedBalance?: number;
  countedBalance?: number;
  variance?: number;
  status?: string;
}

interface QueueIn {
  queueNo?: number;
  type?: string;
  amount?: number;
  channel?: string;
  status?: string;
}

interface TransferIn {
  direction?: string;
  amount?: number;
  status?: string;
  requestedBy?: string;
}

interface EodIn {
  category?: string;
  systemTotal?: number;
  countedTotal?: number;
  variance?: number;
  txCount?: number;
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
    const drawer: DrawerIn = body?.drawer && typeof body.drawer === 'object' ? body.drawer : {};
    const queue: QueueIn[] = Array.isArray(body?.queue)
      ? body.queue.filter((q: QueueIn) => q && typeof q === 'object').slice(0, 8)
      : [];
    const transfers: TransferIn[] = Array.isArray(body?.transfers)
      ? body.transfers.filter((t: TransferIn) => t && typeof t === 'object').slice(0, 6)
      : [];
    const eodLines: EodIn[] = Array.isArray(body?.eodLines)
      ? body.eodLines.filter((e: EodIn) => e && typeof e.category === 'string').slice(0, 6)
      : [];

    const hasDrawer = Object.keys(drawer).length > 0;
    if (!hasDrawer && !queue.length && !transfers.length && !eodLines.length) {
      return Response.json({ error: 'No teller data provided' }, { status: 400 });
    }

    const snapshot = {
      tellerName: str(body?.tellerName, 60),
      drawer: {
        openingFloat: num(drawer.openingFloat),
        cashIn: num(drawer.cashIn),
        cashOut: num(drawer.cashOut),
        expectedBalance: num(drawer.expectedBalance),
        countedBalance: num(drawer.countedBalance),
        variance: num(drawer.variance),
        status: str(drawer.status, 20),
      },
      counterQueue: queue.map((q) => ({
        queueNo: q.queueNo == null ? undefined : num(q.queueNo),
        type: str(q.type, 25),
        amount: num(q.amount),
        channel: str(q.channel, 20),
        status: str(q.status, 15),
      })),
      vaultTransfers: transfers.map((t) => ({
        direction: str(t.direction, 15),
        amount: num(t.amount),
        status: str(t.status, 15),
        requestedBy: str(t.requestedBy, 60),
      })),
      eodLines: eodLines.map((e) => ({
        category: str(e.category, 15),
        systemTotal: num(e.systemTotal),
        countedTotal: num(e.countedTotal),
        variance: num(e.variance),
        txCount: e.txCount == null ? undefined : num(e.txCount),
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
    console.error('AI teller-brief error:', error);
    return Response.json({ error: 'Could not generate the drawer check right now' }, { status: 500 });
  }
}
