import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

interface TxnSummary {
  type: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

const SYSTEM_PROMPT = `You are Susu AI, a financial insights engine for iSusuPro Ghana (microfinance & susu savings platform).

You receive a snapshot of a customer's wallet balances, recent transactions and optional budgets.
Analyze the data and return PERSONALIZED financial insights for a Ghanaian consumer.

Return STRICT JSON only (no markdown fences, no commentary) with this exact shape:
{
  "summary": "one-sentence friendly overview of their financial position",
  "insights": [
    { "title": "short insight title (max 6 words)", "detail": "1-2 sentence actionable advice", "tone": "positive" | "warning" | "risk" | "tip" }
  ]
}

RULES:
- Produce 3-5 insights, most important first.
- Amounts in ₵. Reference susu contributions, MoMo, bills, airtime, loan repayments where relevant.
- base tone on meaning: positive=good habits/savings growth, warning=overspending trends, risk=balance concerns/loan pressure, tip=saving/budget opportunities.
- Be specific — quote actual numbers from the data, never invent amounts.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transactions: TxnSummary[] = Array.isArray(body?.transactions) ? body.transactions.slice(0, 20) : [];
    const wallets: { type: string; balance: number }[] = Array.isArray(body?.wallets) ? body.wallets : [];
    const budgets: { category: string; allocatedAmount: number; spentAmount: number }[] = Array.isArray(body?.budgets)
      ? body.budgets.slice(0, 8)
      : [];

    if (!transactions.length && !wallets.length) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    const snapshot = {
      wallets,
      budgets,
      recentTransactions: transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        description: t.description?.slice(0, 60),
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
    const jsonText = raw.replace(/```json|```/g, '').trim();
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in AI response');

    const parsed = JSON.parse(jsonText.slice(start, end + 1));
    return Response.json({
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis complete.',
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [],
    });
  } catch (error) {
    console.error('AI insights error:', error);
    return Response.json({ error: 'Could not generate insights right now' }, { status: 500 });
  }
}
