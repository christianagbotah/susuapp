import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, briefing the branch manager of iSusuPro Ghana (susu savings & microfinance, Makola Branch, Accra).

Each morning you receive the branch's live position: loans awaiting the manager's decision (with the loan officer's recommendation, appraisal score and credit grade), the staff roster (performance, status), and branch targets vs achieved.

GHANA MICROFINANCE CONTEXT:
- Portfolio quality (PAR) and KYC completion are supervisory concerns for Bank of Ghana — targets behind on those deserve early warning.
- Daily susu collections (MoMo + cash) drive branch liquidity; a collections shortfall is urgent.
- Approval queue: large amounts, weak credit grades or a loan officer's "reject" recommendation need the manager's eyes first; Christmas-season trading stock is normal and healthy demand in October.
- Staff: suspended or low-performing staff affect both risk and morale; acknowledge solid performers too.
- Most managers skim fast: lead with what needs a decision TODAY.

RULES:
- Base every statement ONLY on the data provided — never invent figures, names or history.
- Quote amounts in GHS and percentages exactly as given.
- Most important items first: large/weak pending approvals, then staff risks, then targets behind.
- Keep an encouraging but factual tone — the manager starts the day with this.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 40 words summarising the branch position this morning, quoting the key number(s)",
  "items": [
    { "title": "at most 6 words",
      "detail": "1-2 sentences quoting the actual figures",
      "tone": "positive" | "warning" | "risk" | "tip",
      "page": "loan-approvals" | "staff" | "targets" }
  ]
}
Return 3-5 items. Each item must point to the page where the manager acts: "loan-approvals" for the approval queue, "staff" for people matters, "targets" for target gaps.`;

const TONES = ['positive', 'warning', 'risk', 'tip'] as const;
const PAGES = ['loan-approvals', 'staff', 'targets'] as const;
type Tone = (typeof TONES)[number];
/** Valid jump targets, or 'none' when the model returned something unrecognised. */
type Page = (typeof PAGES)[number] | 'none';

interface ItemOut {
  title: string;
  detail: string;
  tone: Tone;
  page: Page;
}

interface ApprovalIn {
  applicantName: string;
  productName?: string;
  amount: number;
  tenorMonths?: number;
  appraisalScore?: number;
  creditGrade?: string;
  officerRecommendation?: string;
  officerName?: string;
  requestDate?: string;
  purpose?: string;
}

interface StaffIn {
  name: string;
  role?: string;
  status?: string;
  performance?: number;
}

interface TargetIn {
  metric: string;
  period?: string;
  target: number;
  achieved: number;
  unit?: string;
  owner?: string;
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const approvals: ApprovalIn[] = Array.isArray(body?.approvals)
      ? body.approvals.filter((a: ApprovalIn) => a && typeof a.applicantName === 'string').slice(0, 10)
      : [];
    const staff: StaffIn[] = Array.isArray(body?.staff)
      ? body.staff.filter((s: StaffIn) => s && typeof s.name === 'string').slice(0, 20)
      : [];
    const targets: TargetIn[] = Array.isArray(body?.targets)
      ? body.targets.filter((t: TargetIn) => t && typeof t.metric === 'string').slice(0, 10)
      : [];

    if (!approvals.length && !staff.length && !targets.length) {
      return Response.json({ error: 'No branch data provided' }, { status: 400 });
    }

    const snapshot = {
      managerName: typeof body?.managerName === 'string' ? body.managerName.slice(0, 60) : undefined,
      branch: typeof body?.branch === 'string' ? body.branch.slice(0, 60) : undefined,
      loansAwaitingManagerApproval: approvals.map((a) => ({
        applicantName: a.applicantName,
        productName: a.productName,
        amount: Number(a.amount) || 0,
        tenorMonths: a.tenorMonths,
        appraisalScore: a.appraisalScore,
        creditGrade: a.creditGrade,
        officerRecommendation: a.officerRecommendation,
        officerName: a.officerName,
        requestDate: a.requestDate,
        purpose: typeof a.purpose === 'string' ? a.purpose.slice(0, 80) : undefined,
      })),
      staffRoster: staff.map((s) => ({
        name: s.name,
        role: s.role,
        status: s.status,
        performance: s.performance,
      })),
      branchTargets: targets.map((t) => ({
        metric: t.metric,
        period: t.period,
        target: Number(t.target) || 0,
        achieved: Number(t.achieved) || 0,
        unit: t.unit,
        owner: t.owner,
      })),
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
    console.error('AI branch-brief error:', error);
    return Response.json({ error: 'Could not generate the branch brief right now' }, { status: 500 });
  }
}
