import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const LANGUAGE_NAMES: Record<string, string> = {
  twi: 'Ghanaian Twi (Asante Twi)',
  ga: 'Ga, the language of the Greater Accra people',
  ewe: 'Ewe',
  hausa: 'Ghanaian Hausa (standard West African Hausa, boko script)',
  pidgin: 'Ghanaian Pidgin English',
};

const SYSTEM_PROMPT = `You are the localisation engine for iSusuPro, a microfinance & susu savings app in Ghana.

You receive a welcome greeting and a list of suggested chat prompts in English.
Translate them into the requested Ghanaian language for the app's AI assistant widget.

Return STRICT JSON only (no markdown fences, no commentary) with this exact shape:
{ "greeting": "translated greeting", "suggestions": ["translated prompt 1", "translated prompt 2", ...] }

RULES:
- The suggestions array must contain the SAME number of items as the input.
- Keep the 👋 emoji and any other emoji in the greeting.
- Keep widely-used English loanwords Ghanaians naturally mix in: susu, money, bank, loan, MoMo, school fees, KYC, PAR 30, AML, STR.
- Keep all amounts and product names exactly as written (₵, MTN MoMo).
- Use a warm, everyday spoken register — how a friendly Ghanaian would actually say it, not a literal word-for-word translation.
- Greeting must stay under 30 words; each suggestion under 12 words.`;

/**
 * POST /api/ai/localize
 * Body: { language: 'twi'|'ga'|'ewe'|'hausa'|'pidgin', greeting: string, suggestions: string[] }
 * Returns: { greeting, suggestions } — localized chat-widget strings.
 * The client caches results in localStorage so each language is translated once.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const language: string = typeof body?.language === 'string' ? body.language : '';
    const greeting: string = typeof body?.greeting === 'string' ? body.greeting : '';
    const suggestions: string[] = Array.isArray(body?.suggestions)
      ? body.suggestions.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
      : [];

    if (!LANGUAGE_NAMES[language] || !greeting.trim() || suggestions.length === 0) {
      return Response.json({ error: 'Valid language, greeting and suggestions are required' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: `${SYSTEM_PROMPT}\n\nTARGET LANGUAGE: ${LANGUAGE_NAMES[language]}` },
        { role: 'user', content: JSON.stringify({ greeting, suggestions }) },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const jsonText = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: 'Bad AI response' }, { status: 502 });
    }

    const parsed = JSON.parse(match[0]) as { greeting?: unknown; suggestions?: unknown };
    const outGreeting =
      typeof parsed.greeting === 'string' && parsed.greeting.trim() ? parsed.greeting.trim() : greeting;
    const outSuggestions =
      Array.isArray(parsed.suggestions) &&
      parsed.suggestions.length === suggestions.length &&
      parsed.suggestions.every((s) => typeof s === 'string' && s.trim())
        ? (parsed.suggestions as string[]).map((s) => s.trim())
        : suggestions;

    return Response.json({ greeting: outGreeting, suggestions: outSuggestions });
  } catch (error) {
    console.error('AI localize error:', error);
    return Response.json({ error: 'Localisation is temporarily unavailable' }, { status: 500 });
  }
}
