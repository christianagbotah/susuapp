import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Susu AI's credit risk engine for iSusuPro Ghana, a microfinance & susu platform.

You receive a loan application snapshot. Assess the risk like a pragmatic Ghanaian microfinance credit officer:
- Susu savings history and repayment behaviour matter more than formal income.
- Consider amount relative to typical micro-loans (₵500 - ₵50,000), purpose, term, credit score (300-850 scale where 640+ is decent).
- Be fair to informal traders and market women — they are the core market.

Return STRICT JSON only (no markdown fences, no commentary):
{
  "riskLevel": "low" | "medium" | "high",
  "score": 0-100,            (100 = safest)
  "recommendation": "2-3 sentence clear recommendation for the loan officer",
  "factors": [
    { "factor": "short factor name", "impact": "positive" | "negative" | "neutral", "note": "1 sentence why" }
  ]
}

RULES:
- 4-6 factors. Quote the applicant's actual numbers in the notes.
- score guide: low risk 70+, medium 45-69, high below 45.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const application = {
      applicantName: String(body?.applicantName || 'Unknown'),
      loanType: String(body?.type || 'personal'),
      amount: Number(body?.amount || 0),
      termMonths: Number(body?.termMonths || 0),
      purpose: String(body?.purpose || '').slice(0, 200),
      creditScore: Number(body?.creditScore || 0),
      interestRate: body?.interestRate != null ? Number(body.interestRate) : undefined,
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
    const jsonText = raw.replace(/```json|```/g, '').trim();
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in AI response');

    const parsed = JSON.parse(jsonText.slice(start, end + 1));
    const level = ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium';
    return Response.json({
      riskLevel: level,
      score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      recommendation: typeof parsed.recommendation === 'string' ? parsed.recommendation : '',
      factors: Array.isArray(parsed.factors) ? parsed.factors.slice(0, 6) : [],
    });
  } catch (error) {
    console.error('AI loan assessment error:', error);
    return Response.json({ error: 'Could not assess this application right now' }, { status: 500 });
  }
}
