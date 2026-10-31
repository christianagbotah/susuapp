import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, giving the platform administrator of iSusuPro Ghana (susu savings & microfinance) a morning NETWORK PULSE — the whole operation in one glance.

You receive the live network position: platform KPIs (users, deposits, susu pool, disbursed loans, revenue, default rate, agent network), the loan approval queue sitting with the admin, the agent network (status, collections, ratings), all branches, unresolved compliance reports (KYC / AML / transaction limits / suspicious activity), unresolved customer disputes and KYC backlog counts.

GHANA MICROFINANCE CONTEXT:
- Bank of Ghana supervisory lens first: the default rate (portfolio quality) and KYC completion are regulatory exposure; a critical or high AML / suspicious-activity report is the single most urgent thing on the network.
- The agent network is the distribution backbone: suspended or inactive agents stop daily susu collections and erode customer trust in their area; acknowledge strong collectors too.
- Approval queue: the largest amounts and the weakest credit scores need the admin's eyes first; December trading-stock demand is normal and healthy in October.
- Open disputes (MoMo not received, double debits) burn trust fast — they should be resolved within days.
- Inactive branches and thin agent coverage in a region are growth gaps.
- Executives skim: lead with what needs a decision TODAY.

RULES:
- Base every statement ONLY on the data provided — never invent figures, names or history.
- Quote amounts in GHS and percentages exactly as given.
- Most important items first: regulatory/compliance risk, then approval queue, then agent/branch gaps, then growth wins.
- Keep an encouraging but factual tone.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 40 words summarising the network position, quoting the key number(s)",
  "items": [
    { "title": "at most 6 words",
      "detail": "1-2 sentences quoting the actual figures",
      "tone": "positive" | "warning" | "risk" | "tip",
      "page": "loans" | "agents" | "compliance" | "kyc-verification" | "susu-groups" | "analytics" }
  ]
}
Return 3-5 items. Each item must point to the page where the admin acts: "loans" for the approval queue, "agents" for the agent network, "compliance" for AML/KYC reports, "kyc-verification" for the KYC review backlog, "susu-groups" for group savings, "analytics" for revenue and growth.`;

const TONES = ['positive', 'warning', 'risk', 'tip'] as const;
const PAGES = ['loans', 'agents', 'compliance', 'kyc-verification', 'susu-groups', 'analytics'] as const;
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
  type?: string;
  amount: number;
  tenor?: string;
  creditScore?: number;
  purpose?: string;
}

interface AgentIn {
  name: string;
  branch?: string;
  status?: string;
  totalCollections?: number;
  totalCustomers?: number;
  rating?: number;
}

interface BranchIn {
  name: string;
  region?: string;
  manager?: string;
  totalCustomers?: number;
  totalAgents?: number;
  totalSusuGroups?: number;
  status?: string;
}

interface ComplianceIn {
  type?: string;
  title?: string;
  severity?: string;
  status?: string;
}

interface DisputeIn {
  type?: string;
  amount?: number;
  status?: string;
}

interface KycCounts {
  pending?: number;
  inReview?: number;
  rejected?: number;
  expired?: number;
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
    const approvals: ApprovalIn[] = Array.isArray(body?.approvals)
      ? body.approvals.filter((a: ApprovalIn) => a && typeof a.applicantName === 'string').slice(0, 8)
      : [];
    const agents: AgentIn[] = Array.isArray(body?.agents)
      ? body.agents.filter((a: AgentIn) => a && typeof a.name === 'string').slice(0, 30)
      : [];
    const branches: BranchIn[] = Array.isArray(body?.branches)
      ? body.branches.filter((b: BranchIn) => b && typeof b.name === 'string').slice(0, 12)
      : [];
    const compliance: ComplianceIn[] = Array.isArray(body?.compliance)
      ? body.compliance.filter((c: ComplianceIn) => c && typeof c.title === 'string').slice(0, 8)
      : [];
    const disputes: DisputeIn[] = Array.isArray(body?.disputes)
      ? body.disputes.filter((d: DisputeIn) => d && typeof d === 'object').slice(0, 8)
      : [];

    if (!approvals.length && !agents.length && !branches.length && !compliance.length && !disputes.length) {
      return Response.json({ error: 'No network data provided' }, { status: 400 });
    }

    const net = body?.network && typeof body.network === 'object' ? body.network : {};
    const kyc: KycCounts = body?.kyc && typeof body.kyc === 'object' ? body.kyc : {};

    const snapshot = {
      adminName: str(body?.adminName, 60),
      network: {
        totalUsers: num(net.totalUsers),
        activeUsers: num(net.activeUsers),
        monthlyGrowthPct: num(net.monthlyGrowth),
        totalDeposits: num(net.totalDeposits),
        totalSusuPool: num(net.totalSusuPool),
        totalLoansDisbursed: num(net.totalLoansDisbursed),
        monthlyRevenue: num(net.monthlyRevenue),
        defaultRatePct: num(net.defaultRate),
        agentsTotal: num(net.totalAgents),
        agentsActive: num(net.activeAgents),
        susuGroups: num(net.totalSusuGroups),
      },
      approvalQueue: approvals.map((a) => ({
        applicantName: a.applicantName,
        type: str(a.type, 30),
        amount: num(a.amount),
        tenor: str(a.tenor, 20),
        creditScore: a.creditScore == null ? undefined : num(a.creditScore),
        purpose: str(a.purpose, 80),
      })),
      agentNetwork: agents.map((a) => ({
        name: a.name,
        branch: str(a.branch, 40),
        status: str(a.status, 20),
        totalCollections: num(a.totalCollections),
        totalCustomers: num(a.totalCustomers),
        rating: a.rating == null ? undefined : num(a.rating),
      })),
      branches: branches.map((b) => ({
        name: b.name,
        region: str(b.region, 40),
        manager: str(b.manager, 60),
        totalCustomers: num(b.totalCustomers),
        totalAgents: num(b.totalAgents),
        totalSusuGroups: num(b.totalSusuGroups),
        status: str(b.status, 20),
      })),
      openComplianceReports: compliance.map((c) => ({
        type: str(c.type, 30),
        title: str(c.title, 80),
        severity: str(c.severity, 20),
        status: str(c.status, 20),
      })),
      openDisputes: disputes.map((d) => ({
        type: str(d.type, 30),
        amount: num(d.amount),
        status: str(d.status, 20),
      })),
      kycBacklog: {
        pendingReview: num(kyc.pending),
        inReview: num(kyc.inReview),
        rejected: num(kyc.rejected),
        expired: num(kyc.expired),
      },
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
    console.error('AI admin-pulse error:', error);
    return Response.json({ error: 'Could not generate the network pulse right now' }, { status: 500 });
  }
}
