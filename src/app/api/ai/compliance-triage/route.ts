import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, the morning triage brief for the Compliance Officer of iSusuPro Ghana (susu savings & microfinance, FIC-registered, supervised by Bank of Ghana).

You receive the live compliance position: open AML alerts (rule, severity, customer, amount, status, days since triggered), the STR pipeline, and Bank of Ghana regulatory returns with due dates and completion.

GHANA AML/CFT CONTEXT:
- Unreported suspicion is itself an offence: an investigated alert that concludes in suspicion MUST become an STR filed with the Financial Intelligence Centre (FIC) — an investigating alert with no STR on file is the top exposure.
- Sanctions name matches are handled with heightened caution — EDD before any onboarding.
- A BoG NBFRI return that is late, not started, or close to its due date with low completion is a supervisory finding; quote the due date.
- Aging matters: an alert untouched for days compounds risk; quote how old it is.
- Critical alerts outrank high, then medium; closed alerts are noise.

RULES:
- Base every statement ONLY on the data provided — never invent figures, names or dates.
- Quote amounts in GHS exactly as given and reference rules/returns by their real names.
- Most important items first: STR-decision alerts, sanctions, then BoG return deadlines, then aging medium alerts.
- Keep a professional, calm tone — this officer works under regulatory deadlines.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 40 words summarising the compliance position, quoting the key number(s)",
  "items": [
    { "title": "at most 6 words",
      "detail": "1-2 sentences quoting the actual figures",
      "tone": "positive" | "warning" | "risk" | "tip",
      "page": "aml-alerts" | "str-reports" | "bog-returns" }
  ]
}
Return 3-5 items. Each item must point to the page where the officer acts: "aml-alerts" for alert investigation/escalation, "str-reports" for the STR pipeline, "bog-returns" for regulatory filings.`;

const TONES = ['positive', 'warning', 'risk', 'tip'] as const;
const PAGES = ['aml-alerts', 'str-reports', 'bog-returns'] as const;
type Tone = (typeof TONES)[number];
/** Valid jump targets, or 'none' when the model returned something unrecognised. */
type Page = (typeof PAGES)[number] | 'none';

interface ItemOut {
  title: string;
  detail: string;
  tone: Tone;
  page: Page;
}

interface AlertIn {
  rule?: string;
  severity?: string;
  customerName?: string;
  amount?: number;
  status?: string;
  triggeredDate?: string;
  assignedTo?: string;
}

interface StrIn {
  subjectName?: string;
  status?: string;
  filedWith?: string;
  filedDate?: string;
  reference?: string;
  amountInvolved?: number;
}

interface ReturnIn {
  returnName?: string;
  period?: string;
  dueDate?: string;
  status?: string;
  completion?: number;
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
    const alerts: AlertIn[] = Array.isArray(body?.alerts)
      ? body.alerts.filter((a: AlertIn) => a && (typeof a.customerName === 'string' || typeof a.rule === 'string')).slice(0, 8)
      : [];
    const strs: StrIn[] = Array.isArray(body?.strs)
      ? body.strs.filter((s: StrIn) => s && typeof s.subjectName === 'string').slice(0, 6)
      : [];
    const returns: ReturnIn[] = Array.isArray(body?.returns)
      ? body.returns.filter((r: ReturnIn) => r && typeof r.returnName === 'string').slice(0, 6)
      : [];

    if (!alerts.length && !strs.length && !returns.length) {
      return Response.json({ error: 'No compliance data provided' }, { status: 400 });
    }

    const snapshot = {
      officerName: str(body?.officerName, 60),
      openAmlAlerts: alerts.map((a) => ({
        rule: str(a.rule, 90),
        severity: str(a.severity, 20),
        customerName: str(a.customerName, 60),
        amount: num(a.amount),
        status: str(a.status, 30),
        triggeredDate: str(a.triggeredDate, 20),
        assignedTo: str(a.assignedTo, 60),
      })),
      strPipeline: strs.map((s) => ({
        subjectName: s.subjectName,
        status: str(s.status, 20),
        filedWith: str(s.filedWith, 60),
        filedDate: str(s.filedDate, 20),
        reference: str(s.reference, 40),
        amountInvolved: num(s.amountInvolved),
      })),
      bogReturns: returns.map((r) => ({
        returnName: r.returnName,
        period: str(r.period, 30),
        dueDate: str(r.dueDate, 20),
        status: str(r.status, 20),
        completion: num(r.completion),
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
    console.error('AI compliance-triage error:', error);
    return Response.json({ error: 'Could not generate the compliance triage right now' }, { status: 500 });
  }
}
