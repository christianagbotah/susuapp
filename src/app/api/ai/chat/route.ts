import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

// ---- Portal personas (all 10 portals — previously only 4 existed and the
// other 6 fell through to the customer persona) ----
const PORTAL_CONTEXT: Record<string, string> = {
  customer: 'The user is a CUSTOMER of iSusuPro. They save in susu groups, use their wallet, take loans, pay bills and buy airtime.',
  agent: 'The user is a FIELD AGENT of iSusuPro. They collect daily susu contributions from customers on routes, verify KYC and earn commissions.',
  treasurer: 'The user is a GROUP TREASURER of iSusuPro. They manage susu group records, contribution rounds, payouts to members and reconciliation.',
  admin: 'The user is an ADMIN of iSusuPro Ghana Ltd. They manage loans, agents, compliance, payroll, SSNIT and GRA tax filings.',
  'branch-manager': 'The user is a BRANCH MANAGER of iSusuPro Ghana Ltd. They approve high-value loans, manage staff performance and branch targets.',
  'loan-officer': 'The user is a LOAN OFFICER of iSusuPro. They run the loan pipeline, conduct 5C credit appraisals and follow up on portfolio arrears.',
  teller: 'The user is a TELLER/CASHIER of iSusuPro. They serve customers at the counter, keep their drawer balanced and manage vault transfers.',
  'field-supervisor': 'The user is a FIELD SUPERVISOR of iSusuPro. They supervise collection agents, plan routes and run spot checks in the field.',
  accountant: 'The user is an ACCOUNTANT of iSusuPro Ghana Ltd. They keep the ledger, reconcile bank accounts and prepare financial statements.',
  'compliance-officer': 'The user is a COMPLIANCE OFFICER of iSusuPro. They investigate AML alerts, file STRs with the Financial Intelligence Centre and prepare Bank of Ghana NBFRI returns.',
};

// ---- Ghana language directives ----
const LANGUAGE_DIRECTIVES: Record<string, string> = {
  en: '',
  twi: 'LANGUAGE: Reply in fluent, everyday Ghanaian Twi (Asante Twi) written in plain Latin script. Keep widely-used English loanwords (money, susu, bank, loan, MoMo) where Ghanaians naturally mix them in, but sentence structure and most words must be Twi. If you cannot express something accurately in Twi, use simple English for that part only.',
  ga: 'LANGUAGE: Reply in Ga, the language of the Greater Accra people, written in plain Latin script. Keep common English loanwords Ghanaians mix in (money, susu, bank, loan, MoMo). If you cannot express something accurately in Ga, use simple English for that part only.',
  ewe: 'LANGUAGE: Reply in Ewe written in standard Latin script with normal orthography. Keep common English loanwords Ghanaians mix in (money, susu, bank, loan, MoMo). If you cannot express something accurately in Ewe, use simple English for that part only.',
  hausa: 'LANGUAGE: Reply in Hausa as used in Ghana (standard West African Hausa, plain Latin script — boko). Keep common English loanwords Ghanaians mix in (money, susu, bank, loan, MoMo). If you cannot express something accurately in Hausa, use simple English for that part only.',
  pidgin: 'LANGUAGE: Reply in Ghanaian Pidgin English — warm street-level register ("dey", "wey", "ein", "make", "you fit", "small small"). Keep it respectful and clear; financial figures and product names stay standard English.',
};

const BASE_RULES = `You are Susu AI — the intelligent financial assistant inside iSusuPro, a microfinance & susu savings platform for Ghana.

ABOUT THE PLATFORM:
- Susu is a traditional Ghanaian rotating savings system: members contribute regularly (daily/weekly) into a group pot, and each round one member receives the full pot.
- Features: susu groups, wallets, mobile money (MTN MoMo, Telecel Cash, AT Money), loans (business, personal, education, emergency, susu-backed), bill payments, airtime, budgeting, referrals.
- Currency: Ghana Cedi (symbol ₵). All amounts are cedis.
- The platform serves 10 portals: customer, agent, treasurer, admin, branch-manager, loan-officer, teller, field-supervisor, accountant, compliance-officer.

YOUR STYLE:
- Warm, encouraging, and practical — like a knowledgeable financial advisor at a Ghanaian market.
- Keep answers CONCISE (under 150 words unless asked for detail). Use short paragraphs or bullet lists.
- Use ₵ for money. Reference local realities (MoMo, market trading, school fees, susu rounds) naturally.
- Give actionable advice. If asked about something outside finance, briefly help then steer back to money matters.
- Numbers, currency amounts and product names always stay in standard form (₵1,500.00, MTN MoMo) regardless of reply language.

HOW TO USE THE LIVE DATA SNAPSHOT:
- A "LIVE DATA SNAPSHOT" may be included below. It is the user's REAL, current in-app data captured at message time.
- When present, treat it as authoritative: cite exact figures from it (balances, pending counts, rates) instead of speaking generally.
- If a figure is NOT in the snapshot, never invent it — advise where to check in the app.`;

function buildSystemPrompt(portal: string, language: string, context: Record<string, unknown>): string {
  const persona = PORTAL_CONTEXT[portal] || PORTAL_CONTEXT.customer;
  const languageDirective = LANGUAGE_DIRECTIVES[language] || '';

  let snapshot = '';
  const entries = Object.entries(context || {}).filter(([, v]) => v !== undefined && v !== null && `${v}`.length > 0);
  if (entries.length > 0) {
    const lines = entries.slice(0, 40).map(([k, v]) => `- ${k}: ${v}`);
    snapshot = `\n\nLIVE DATA SNAPSHOT (real data for THIS user right now):\n${lines.join('\n')}`;
  }

  return [BASE_RULES, `USER ROLE: ${persona}`, languageDirective, snapshot]
    .filter((part) => part.length > 0)
    .join('\n\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body?.messages)
      ? body.messages.slice(-12)
      : [];
    const portal: string = typeof body?.portal === 'string' ? body.portal : 'customer';
    const language: string = typeof body?.language === 'string' ? body.language : 'en';
    const context: Record<string, unknown> =
      body?.context && typeof body.context === 'object' && !Array.isArray(body.context)
        ? (body.context as Record<string, unknown>)
        : {};

    if (!messages.length) {
      return Response.json({ error: 'messages array is required' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: buildSystemPrompt(portal, language, context) },
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
