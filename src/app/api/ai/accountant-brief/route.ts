import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, the books check for the Accountant of iSusuPro Ghana (susu savings & microfinance). Each morning you read the live general ledger, chart of accounts, statement pipeline and bank reconciliations, and return the items that need the accountant's pen today.

GHANA MICROFINANCE BOOKS CONTEXT:
- Unmatched bank items age badly: a reconciliation with open debit/credit mismatches becomes an audit finding — clear or explain them first; quote the difference between book and statement balances.
- Statements sitting in draft near month-end delay BoG reporting — nudge finalisation; a submitted/final statement is a win.
- Reversed journals are normal (corrections), but several reversals in one account hint at a posting habit worth fixing — mention the account.
- MoMo settlement accounts (MTN, Telecel, AT) and the susu float account drift most — flag balances that look off against recent activity only if the numbers you were given support it.
- Trial balance thinking: total debits should equal total credits in what you see — quote the totals if they are given.

RULES:
- Base every statement ONLY on the data provided — never invent figures, references or accounts.
- Quote amounts in GHS exactly as given, and references (JV-…, recon sources) verbatim.
- Most important first: open reconciliation variances, then draft statements, then reversal patterns, then a clean-books positive.
- Keep a precise, calm tone — an accountant trusts numbers, not adjectives.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 40 words summarising the books position, quoting the key number(s)",
  "items": [
    { "title": "at most 6 words",
      "detail": "1-2 sentences quoting the actual figures",
      "tone": "positive" | "warning" | "risk" | "tip",
      "page": "ledger" | "statements" | "reconciliation" }
  ]
}
Return 3-5 items. Each item must point to the page where the accountant acts: "ledger" for journals, "statements" for the statement pipeline, "reconciliation" for bank matching.`;

const TONES = ['positive', 'warning', 'risk', 'tip'] as const;
const PAGES = ['ledger', 'statements', 'reconciliation'] as const;
type Tone = (typeof TONES)[number];
/** Valid jump targets, or 'none' when the model returned something unrecognised. */
type Page = (typeof PAGES)[number] | 'none';

interface ItemOut {
  title: string;
  detail: string;
  tone: Tone;
  page: Page;
}

interface LedgerIn {
  date?: string;
  reference?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
  narration?: string;
  status?: string;
}

interface CoaIn {
  code?: string;
  name?: string;
  type?: string;
  balance?: number;
  momoChange?: number;
}

interface StatementIn {
  name?: string;
  period?: string;
  status?: string;
}

interface ReconIn {
  source?: string;
  period?: string;
  status?: string;
  bookBalance?: number;
  statementBalance?: number;
  unmatched?: { description?: string; amount?: number; type?: string }[];
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
    const ledger: LedgerIn[] = Array.isArray(body?.ledger)
      ? body.ledger.filter((l: LedgerIn) => l && (typeof l.reference === 'string' || typeof l.accountName === 'string')).slice(0, 12)
      : [];
    const coa: CoaIn[] = Array.isArray(body?.coa)
      ? body.coa.filter((c: CoaIn) => c && typeof c.name === 'string').slice(0, 12)
      : [];
    const statements: StatementIn[] = Array.isArray(body?.statements)
      ? body.statements.filter((s: StatementIn) => s && typeof s.name === 'string').slice(0, 4)
      : [];
    const reconciliations: ReconIn[] = Array.isArray(body?.reconciliations)
      ? body.reconciliations.filter((r: ReconIn) => r && typeof r.source === 'string').slice(0, 4)
      : [];

    if (!ledger.length && !coa.length && !statements.length && !reconciliations.length) {
      return Response.json({ error: 'No accounting data provided' }, { status: 400 });
    }

    const snapshot = {
      accountantName: str(body?.accountantName, 60),
      recentLedger: ledger.map((l) => ({
        date: str(l.date, 20),
        reference: str(l.reference, 20),
        accountName: str(l.accountName, 50),
        debit: num(l.debit),
        credit: num(l.credit),
        narration: str(l.narration, 70),
        status: str(l.status, 15),
      })),
      chartOfAccounts: coa.map((c) => ({
        code: str(c.code, 10),
        name: c.name,
        type: str(c.type, 15),
        balance: num(c.balance),
        momoChange: c.momoChange == null ? undefined : num(c.momoChange),
      })),
      statements: statements.map((s) => ({
        name: s.name,
        period: str(s.period, 30),
        status: str(s.status, 15),
      })),
      bankReconciliations: reconciliations.map((r) => ({
        source: str(r.source, 50),
        period: str(r.period, 30),
        status: str(r.status, 15),
        bookBalance: num(r.bookBalance),
        statementBalance: num(r.statementBalance),
        unmatchedItems: (Array.isArray(r.unmatched) ? r.unmatched : []).slice(0, 4).map((u) => ({
          description: str(u?.description, 60),
          amount: num(u?.amount),
          type: str(u?.type, 10),
        })),
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
    console.error('AI accountant-brief error:', error);
    return Response.json({ error: 'Could not generate the books check right now' }, { status: 500 });
  }
}
