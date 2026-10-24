import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const PORTAL_CONTEXT: Record<string, string> = {
  customer: 'The user is a CUSTOMER of iSusuPro. They save in susu groups, use their wallet, take loans and pay bills.',
  agent: 'The user is a FIELD AGENT of iSusuPro. They collect daily susu contributions from customers on routes, verify KYC and earn commissions.',
  treasurer: 'The user is a GROUP TREASURER of iSusuPro. They manage susu group records, payout cycles and reconciliation.',
  admin: 'The user is an ADMIN of iSusuPro Ghana Ltd. They manage loans, agents, compliance, payroll, SSNIT and GRA tax filings.',
};

const SYSTEM_PROMPT = `You are Susu AI — the intelligent financial assistant inside iSusuPro, a microfinance & susu savings platform for Ghana.

ABOUT THE PLATFORM:
- Susu is a traditional Ghanaian rotating savings system: members contribute regularly (daily/weekly) into a group pot, and each round one member receives the full pot.
- Features: susu groups, wallets, mobile money (MTN MoMo, Telecel Cash, AT Money), loans (business, personal, education, emergency, susu-backed), bill payments, airtime, budgeting, referrals.
- Currency: Ghana Cedi (₵). Prices and amounts are in cedis.
- The platform serves 4 portals: customer, agent, treasurer, admin.

YOUR STYLE:
- Warm, encouraging, and practical — like a knowledgeable financial advisor at a Ghanaian market.
- Keep answers CONCISE (under 150 words unless asked for detail). Use short paragraphs or bullet lists.
- Use ₵ for money. Reference local realities (MoMo, market trading, school fees, susu rounds) naturally.
- Give actionable advice. If asked about something outside finance, briefly help then steer back to money matters.
- Never invent exact account balances or transaction data; speak generally or advise where to check in the app.

USER CONTEXT:`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body?.messages)
      ? body.messages.slice(-12)
      : [];
    const portal: string = typeof body?.portal === 'string' ? body.portal : 'customer';

    if (!messages.length) {
      return Response.json({ error: 'messages array is required' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: `${SYSTEM_PROMPT}\n${PORTAL_CONTEXT[portal] || PORTAL_CONTEXT.customer}` },
        ...messages,
      ],
      thinking: { type: 'disabled' },
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return Response.json({ error: 'Empty AI response' }, { status: 502 });
    }
    return Response.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return Response.json({ error: 'AI assistant is temporarily unavailable' }, { status: 500 });
  }
}
