import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a seasoned Ghanaian microfinance credit officer running a 5C appraisal for iSusuPro Ghana, a susu & microfinance platform.

THE 5 Cs: character, capacity, capital, collateral, condition.

APPLICANT REALITIES:
- Most applicants work in the informal sector — market traders, artisans, food vendors. They have no payslips and no formal accounts, so judge real cash flow, not paperwork.
- Consistent susu contributions (daily/weekly group savings) are STRONG evidence of Character (discipline, community reputation) and Capacity (steady income).
- Susu payouts received and small loans fully repaid on the platform also strengthen Character and Capacity.
- Collateral for informal customers is usually a savings pledge or trusted guarantors rather than titled assets — score fairly on what they actually have.

SCORING RULES:
- Score each criterion 1-5 (1 = very weak, 3 = average, 5 = excellent).
- BE CONSERVATIVE: when in doubt, score lower. Never inflate.
- If the officer has already entered provisional scores, treat those as their own field judgment — only move a score when the evidence clearly justifies it.

Return STRICT JSON only (no markdown fences, no commentary before or after):
{
  "suggestedScores": { "character": 1-5, "capacity": 1-5, "capital": 1-5, "collateral": 1-5, "condition": 1-5 },
  "rationale": "at most 80 words explaining the scores, quoting the applicant's actual figures",
  "flags": ["at most 3 short concerns the officer should verify in the field; empty array if none"]
}`;

const DRAFT_NOTE_SPEC = `

DRAFT APPRAISAL NOTE (required this time):
The JSON must additionally include this field:
"draftNote": "a professional 120-180 word appraisal note written in the neutral voice of the loan officer for the credit file — summarize the applicant's business and request, the 5C findings quoting their actual figures, key risks from the flags, and end with one clear recommendation sentence matching the scores. Plain prose, no headings, no bullet points."`;

const SCORE_KEYS = ['character', 'capacity', 'capital', 'collateral', 'condition'] as const;
type ScoreKey = (typeof SCORE_KEYS)[number];

interface Suggestion {
  suggestedScores: Record<ScoreKey, number>;
  rationale: string;
  flags: string[];
}

const clampScore = (value: number) => Math.max(1, Math.min(5, Math.round(value)));

function sanitizeScore(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? clampScore(n) : 3;
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
    const applicant = body?.applicant && typeof body.applicant === 'object' && !Array.isArray(body.applicant)
      ? body.applicant
      : {};
    const includeDraftNote = body?.includeDraftNote === true;

    const amount = Number(applicant.amount || 0);
    if (!amount) {
      return Response.json({ error: 'applicant.amount is required' }, { status: 400 });
    }

    // Normalize existingLoans (array of aggregates or a single object) into one exposure summary.
    let existingLoans: { count: number; outstanding: number; arrearsDays?: number } | undefined;
    const rawExisting = applicant.existingLoans;
    if (Array.isArray(rawExisting)) {
      const entries = rawExisting.filter(
        (item) => item && typeof item === 'object' && !Array.isArray(item),
      );
      if (entries.length > 0) {
        const arrears = entries
          .map((item) => Number(item.arrearsDays))
          .filter((n) => Number.isFinite(n) && n > 0);
        existingLoans = {
          count: entries.reduce((sum, item) => sum + (Number(item.count) || 1), 0),
          outstanding:
            Math.round(entries.reduce((sum, item) => sum + (Number(item.outstanding) || 0), 0) * 100) / 100,
          ...(arrears.length > 0 ? { arrearsDays: Math.max(...arrears) } : {}),
        };
      }
    } else if (rawExisting && typeof rawExisting === 'object') {
      const arrears = Number(rawExisting.arrearsDays);
      existingLoans = {
        count: Number(rawExisting.count) || 1,
        outstanding: Math.round((Number(rawExisting.outstanding) || 0) * 100) / 100,
        ...(Number.isFinite(arrears) && arrears > 0 ? { arrearsDays: arrears } : {}),
      };
    }

    // The officer's current provisional scores, when present.
    const rawPartial = body?.partialScores;
    const partialScores: Partial<Record<ScoreKey, number>> = {};
    if (rawPartial && typeof rawPartial === 'object' && !Array.isArray(rawPartial)) {
      for (const key of SCORE_KEYS) {
        const value = Number((rawPartial as Record<string, unknown>)[key]);
        if (Number.isFinite(value) && value > 0) partialScores[key] = clampScore(value);
      }
    }

    const application = {
      businessType:
        typeof applicant.businessType === 'string' && applicant.businessType.trim()
          ? applicant.businessType.trim().slice(0, 100)
          : undefined,
      purpose: String(applicant.purpose || '').slice(0, 200),
      amount: Math.round(amount * 100) / 100,
      tenorMonths: Number(applicant.tenorMonths) > 0 ? Math.round(Number(applicant.tenorMonths)) : undefined,
      existingLoans,
      susuHistory:
        typeof applicant.susuHistory === 'string' && applicant.susuHistory.trim()
          ? applicant.susuHistory.trim().slice(0, 300)
          : undefined,
    };

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT + (includeDraftNote ? DRAFT_NOTE_SPEC : '') },
        {
          role: 'user',
          content: JSON.stringify({
            application,
            officerProvisionalScores:
              Object.keys(partialScores).length > 0 ? partialScores : undefined,
          }),
        },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    // Defensive parse: strip fences, dig out the object, clamp every score —
    // but never fabricate scores, so a hopeless parse becomes a 502 the UI can toast.
    let suggestion: Suggestion;
    let draftNote: string | undefined;
    try {
      const parsed = extractJsonObject(raw);
      const rawScores =
        parsed.suggestedScores && typeof parsed.suggestedScores === 'object' && !Array.isArray(parsed.suggestedScores)
          ? (parsed.suggestedScores as Record<string, unknown>)
          : {};
      suggestion = {
        suggestedScores: {
          character: sanitizeScore(rawScores.character),
          capacity: sanitizeScore(rawScores.capacity),
          capital: sanitizeScore(rawScores.capital),
          collateral: sanitizeScore(rawScores.collateral),
          condition: sanitizeScore(rawScores.condition),
        },
        rationale: typeof parsed.rationale === 'string' ? parsed.rationale.trim().slice(0, 600) : '',
        flags: Array.isArray(parsed.flags)
          ? parsed.flags
              .filter((flag): flag is string => typeof flag === 'string' && flag.trim().length > 0)
              .map((flag) => flag.trim())
              .slice(0, 3)
          : [],
      };
      if (includeDraftNote && typeof parsed.draftNote === 'string' && parsed.draftNote.trim()) {
        draftNote = parsed.draftNote.trim().slice(0, 2000);
      }
    } catch (parseError) {
      console.error('AI appraisal-assist parse error:', parseError);
      return Response.json({ error: 'The AI suggestion could not be parsed' }, { status: 502 });
    }

    return Response.json({
      ...suggestion,
      ...(draftNote ? { draftNote } : {}),
    });
  } catch (error) {
    console.error('AI appraisal-assist error:', error);
    return Response.json({ error: 'AI 5C assist is temporarily unavailable' }, { status: 500 });
  }
}
