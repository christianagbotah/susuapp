import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI's credit risk engine for iSusuPro Ghana, a microfinance & susu platform.

You assess one loan application like a pragmatic Ghanaian microfinance credit officer:
- Susu savings history and repayment behaviour matter more than formal income.
- Be fair to informal traders and market women — they are the core market.

WEIGH THE EVIDENCE IN THIS EXACT ORDER (most to least important):
1. Repayment history — repayments recorded on file, loans previously repaid, overdue installments on active loans.
2. Susu contribution consistency — paid susu contributions, missed/overdue contributions, payouts received and group membership prove discipline and steady cash flow.
3. Existing exposure — total outstanding across the applicant's other loans versus the new amount requested.
4. Loan purpose — productive purposes (restocking, equipment, school fees) are safer than consumption.
5. Credit score — a tiebreaker only (300-850 scale where 640+ is decent).

Return STRICT JSON only (no markdown fences, no commentary before or after):
{
  "grade": "A" | "B" | "C" | "D" | "E",
  "recommendation": "approve" | "approve_with_conditions" | "reduce" | "reject",
  "confidence": 0-100,
  "summary": "one clear paragraph of at most 60 words, quoting the applicant's actual numbers",
  "strengths": ["at most 3 short strengths"],
  "risks": ["at most 3 short risks"],
  "conditions": ["at most 3 short disbursement conditions; MUST be an empty array unless recommendation is approve_with_conditions"],
  "suggestedAmount": optional number — the cedi amount you would actually disburse; include it ONLY when recommendation is "reduce"
}

GRADE GUIDE: A strong — approve. B good — approve. C average — approve_with_conditions or reduce. D weak — reduce or reject. E high risk — reject.`;

const GRADES = ['A', 'B', 'C', 'D', 'E'] as const;
const RECOMMENDATIONS = ['approve', 'approve_with_conditions', 'reduce', 'reject'] as const;
const TERM_UNITS = ['days', 'weeks', 'months'] as const;

type Grade = (typeof GRADES)[number];
type Recommendation = (typeof RECOMMENDATIONS)[number] | 'review';

interface Assessment {
  grade: Grade;
  recommendation: Recommendation;
  confidence: number;
  summary: string;
  strengths: string[];
  risks: string[];
  conditions: string[];
  suggestedAmount?: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function toStringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, max);
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

    const context = body?.context && typeof body.context === 'object' && !Array.isArray(body.context)
      ? (body.context as Record<string, unknown>)
      : undefined;

    const application = {
      applicantName: String(body?.applicantName || 'Unknown'),
      loanType: String(body?.type || 'personal'),
      amount: Number(body?.amount || 0),
      term: {
        value: Number(body?.term ?? body?.termMonths ?? 0),
        unit: TERM_UNITS.includes(body?.termUnit) ? body.termUnit : 'months',
      },
      purpose: String(body?.purpose || '').slice(0, 200),
      creditScore: Number(body?.creditScore || 0),
      interestRate: body?.interestRate != null ? Number(body.interestRate) : undefined,
      ...(context ? { applicantContext: context } : {}),
    };

    if (!application.amount) {
      return Response.json({ error: 'amount is required' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(application) },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    let assessment: Assessment;
    try {
      const parsed = extractJsonObject(raw);

      const grade: Grade = GRADES.includes(parsed.grade as Grade) ? (parsed.grade as Grade) : 'C';
      const recommendation: Recommendation = RECOMMENDATIONS.includes(
        parsed.recommendation as (typeof RECOMMENDATIONS)[number],
      )
        ? (parsed.recommendation as Recommendation)
        : 'review';
      const confidence = Number(parsed.confidence);
      const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim().slice(0, 600)
        : raw.slice(0, 600);
      const suggestedAmount = Number(parsed.suggestedAmount);

      assessment = {
        grade,
        recommendation,
        confidence: Number.isFinite(confidence) ? clamp(Math.round(confidence), 0, 100) : 50,
        summary,
        strengths: toStringList(parsed.strengths, 3),
        risks: toStringList(parsed.risks, 3),
        conditions: recommendation === 'approve_with_conditions' ? toStringList(parsed.conditions, 3) : [],
        ...(Number.isFinite(suggestedAmount) && suggestedAmount > 0
          ? { suggestedAmount: Math.round(suggestedAmount * 100) / 100 }
          : {}),
      };
    } catch (parseError) {
      console.error('AI loan assessment parse fallback:', parseError);
      // Never break the UI — degrade to a neutral "manual review" card carrying the raw reply.
      assessment = {
        grade: 'C',
        recommendation: 'review',
        confidence: 50,
        summary: raw.slice(0, 600) || 'The AI reply could not be parsed into a structured assessment.',
        strengths: [],
        risks: [],
        conditions: [],
      };
    }

    return Response.json({ assessment });
  } catch (error) {
    console.error('AI loan assessment error:', error);
    return Response.json({ error: 'Could not assess this application right now' }, { status: 500 });
  }
}
