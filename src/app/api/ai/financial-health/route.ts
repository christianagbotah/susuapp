import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Financial Health scoring engine inside iSusuPro, a microfinance & susu savings platform for Ghana.

You receive a customer's live data snapshot: wallets, recent transactions, budgets, savings goals, loans, susu groups and payouts.
Compute an overall Financial Health Score (0-100) and explain it.

SCORING RUBRIC (total 100):
- Saving discipline (max 25): regular susu contributions/deposits, progress toward savings goals, auto-contribution habits.
- Liquidity buffer (max 20): main/savings wallet balances versus their typical spending; can they absorb a GHS 200 shock?
- Budget control (max 20): spent vs allocated across budget categories; overspending lowers this.
- Loan pressure (max 20): active loan remaining vs total savings; repayments due; any defaulted history. No active loans = strong score.
- Susu participation (max 15): active group memberships, regularity, payout position.

Return STRICT JSON only (no markdown fences, no commentary) with this exact shape:
{
  "score": <integer 0-100>,
  "grade": "Excellent" | "Good" | "Fair" | "Struggling",
  "summary": "exactly 2 sentences citing the customer's actual figures",
  "factors": [
    { "label": "Saving discipline", "status": "good|fair|poor", "detail": "1-2 sentences with their real numbers" },
    { "label": "Liquidity buffer", "status": "good|fair|poor", "detail": "..." },
    { "label": "Budget control", "status": "good|fair|poor", "detail": "..." },
    { "label": "Loan pressure", "status": "good|fair|poor", "detail": "..." },
    { "label": "Susu participation", "status": "good|fair|poor", "detail": "..." }
  ],
  "tips": ["2-3 short, specific, Ghana-relevant actions"]
}

RULES:
- Exactly 5 factors, in the order above, using those exact labels.
- status must be one of good/fair/poor and must be consistent with the points earned (>=75% good, 40-74% fair, <40% poor).
- grade: >=80 Excellent, 60-79 Good, 40-59 Fair, <40 Struggling.
- Never invent numbers that are not in the data. If a category has no data, give it half the maximum points and explain that in the detail.
- Currency is the Ghana Cedi (₵). Reference MoMo, susu rounds, market trading and school fees naturally.
- Be encouraging but honest — this is a coach, not a cheerleader.`;

const FACTOR_LABELS = ['Saving discipline', 'Liquidity buffer', 'Budget control', 'Loan pressure', 'Susu participation'] as const;
const STATUSES = ['good', 'fair', 'poor'] as const;
const GRADES = ['Excellent', 'Good', 'Fair', 'Struggling'] as const;

function clampScore(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
}

function gradeFor(score: number, raw: unknown): string {
  if (typeof raw === 'string' && (GRADES as readonly string[]).includes(raw)) return raw;
  return score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Struggling';
}

/** The model is told to return bare JSON but may wrap it in fences or prose — dig the object out. */
function extractJsonObject(raw: string): Record<string, unknown> {
  const stripped = raw.replace(/```json|```/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object found in AI response');
  return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
}

/**
 * POST /api/ai/financial-health
 * Body: { wallets, transactions, budgets, savingsGoals, loans, susuGroups, susuPayouts }
 * Returns: { score, grade, summary, factors[], tips[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'Request body is required' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(body) },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    let parsed: Record<string, unknown>;
    try {
      parsed = extractJsonObject(raw);
    } catch (parseError) {
      console.error('AI financial-health parse error:', parseError);
      return Response.json({ error: 'The health score could not be parsed' }, { status: 502 });
    }

    const score = clampScore(parsed.score);

    const rawFactors = Array.isArray(parsed.factors) ? parsed.factors : [];
    const factors = rawFactors
      .map((f, i) => {
        const item = (f && typeof f === 'object' && !Array.isArray(f) ? f : {}) as Record<string, unknown>;
        const status = STATUSES.includes(item.status as (typeof STATUSES)[number])
          ? (item.status as (typeof STATUSES)[number])
          : 'fair';
        return {
          label: typeof item.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 40) : FACTOR_LABELS[i] ?? 'Factor',
          status,
          detail: typeof item.detail === 'string' ? item.detail.trim().slice(0, 300) : '',
        };
      })
      .slice(0, 5);
    if (factors.length === 0) {
      return Response.json({ error: 'The health score could not be parsed' }, { status: 502 });
    }

    const tips = Array.isArray(parsed.tips)
      ? parsed.tips
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim().slice(0, 160))
          .slice(0, 4)
      : [];

    return Response.json({
      score,
      grade: gradeFor(score, parsed.grade),
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 500) : '',
      factors,
      tips,
    });
  } catch (error) {
    console.error('AI financial-health error:', error);
    return Response.json({ error: 'Financial health scoring is temporarily unavailable' }, { status: 500 });
  }
}
