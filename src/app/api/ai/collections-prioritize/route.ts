import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI, the collections co-pilot for a field agent of iSusuPro Ghana (susu & microfinance platform).

The agent walks market routes daily to collect susu contributions in cash. You receive today's routes and the customers still needing attention, and you propose the smartest visit order.

FIELD REALITIES (Ghana):
- Market traders, food vendors and artisans are usually at their stalls in the morning; many leave or close by mid-afternoon — visit fragile ones early.
- A customer marked "absent" earlier today or with worrying notes needs a prompt revisit or a polite phone call — relationships matter, never suggest pressure tactics.
- Mobile money (MoMo) is the standard fallback: if a customer is absent or far down the route late in the day, suggest calling them to send the contribution via MoMo.
- Larger expected amounts carry more collection risk for the agent's daily target; so do customers with a history of partial payment.
- Always stay respectful of customers — reasons are for the agent's eyes, written factually.

PRIORITIZATION RULES:
- Rank ONLY the customers provided (pending and absent ones — never collected).
- First: absent customers and large amounts. Then: partial payers and any flagged by notes. Last: routine pending collections.
- Base every reason ONLY on the data given. Quote real amounts in GHS. Never invent history.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "brief": "at most 35 words spoken to the agent, summarizing today's plan and total still to collect",
  "visits": [
    { "customerId": "the customerId exactly as given", "urgency": "high" | "medium" | "low",
      "reason": "at most 20 words, citing the customer's actual figures or notes",
      "suggestion": "collect" | "revisit" | "call" }
  ]
}
Return 3-12 visits, most urgent first. Use "revisit" for customers already marked absent today, "call" when phoning/MoMo beats another walk, "collect" for routine stops.`;

const URGENCY_LEVELS = ['high', 'medium', 'low'] as const;
const SUGGESTIONS = ['collect', 'revisit', 'call'] as const;
type Urgency = (typeof URGENCY_LEVELS)[number];
type Suggestion = (typeof SUGGESTIONS)[number];

interface VisitOut {
  customerId: string;
  urgency: Urgency;
  reason: string;
  suggestion: Suggestion;
}

interface CustomerIn {
  customerId: string;
  customerName: string;
  susuGroupName?: string;
  expectedAmount: number;
  collectedAmount?: number;
  status: 'collected' | 'pending' | 'absent';
  notes?: string;
}

interface RouteIn {
  name: string;
  area?: string;
  customers: CustomerIn[];
}

function pickEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback;
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
    const routes: RouteIn[] = Array.isArray(body?.routes) ? body.routes.slice(0, 5) : [];

    // Flatten the actionable customers (never collected), cap the payload size.
    const actionable = routes
      .flatMap((r) =>
        (Array.isArray(r.customers) ? r.customers : [])
          .filter((c) => c && typeof c.customerId === 'string' && c.status !== 'collected')
          .slice(0, 15)
          .map((c) => ({ ...c, routeName: typeof r.name === 'string' ? r.name : '' }))
      )
      .slice(0, 40);

    if (!actionable.length) {
      return Response.json({ error: 'No pending or absent customers to prioritize' }, { status: 400 });
    }

    const snapshot = {
      agentName: typeof body?.agentName === 'string' ? body.agentName.slice(0, 60) : undefined,
      todayStillToCollect: actionable.reduce((s, c) => s + (Number(c.expectedAmount) - (Number(c.collectedAmount) || 0)), 0),
      routes: routes.map((r) => ({
        name: r.name,
        area: typeof r.area === 'string' ? r.area : undefined,
        customers: (Array.isArray(r.customers) ? r.customers : [])
          .filter((c) => c && c.status !== 'collected' && typeof c.customerId === 'string')
          .slice(0, 15)
          .map((c) => ({
            customerId: c.customerId,
            customerName: c.customerName,
            susuGroupName: c.susuGroupName,
            expectedAmount: Number(c.expectedAmount) || 0,
            collectedSoFar: Number(c.collectedAmount) || 0,
            status: c.status,
            notes: typeof c.notes === 'string' ? c.notes.slice(0, 120) : undefined,
          })),
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

    // Resolve visits against the customers we actually sent — the UI keys on real IDs.
    const known = new Map(actionable.map((c) => [c.customerId, c]));
    const seen = new Set<string>();
    const visits: VisitOut[] = [];

    for (const v of Array.isArray(parsed.visits) ? parsed.visits : []) {
      if (!v || typeof v !== 'object') continue;
      const item = v as Record<string, unknown>;
      const id = typeof item.customerId === 'string' ? item.customerId : '';
      if (!id || !known.has(id) || seen.has(id)) continue;
      seen.add(id);
      visits.push({
        customerId: id,
        urgency: pickEnum(item.urgency, URGENCY_LEVELS, 'medium'),
        reason: typeof item.reason === 'string' ? item.reason.slice(0, 140) : '',
        suggestion: pickEnum(item.suggestion, SUGGESTIONS, 'collect'),
      });
      if (visits.length >= 12) break;
    }

    if (!visits.length) throw new Error('No usable visits in AI response');

    return Response.json({
      brief: typeof parsed.brief === 'string' ? parsed.brief.slice(0, 220) : '',
      visits,
    });
  } catch (error) {
    console.error('AI collections-prioritize error:', error);
    return Response.json({ error: 'Could not prioritize collections right now' }, { status: 500 });
  }
}
