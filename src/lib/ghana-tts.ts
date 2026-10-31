/**
 * Ghana-aware speech text preparation.
 *
 * The TTS voices we have read Latin-script text with English-leaning
 * pronunciation. Written Twi, Ga, Ewe and Hausa use special letters that
 * those voices either skip or mangle (ɛ ɔ ŋ ɖ ƒ ɣ ʋ ɓ ɗ ƙ …), and Twi has
 * palatalised digraphs (ky, gy, hy, tw, dw) whose sound is nothing like the
 * English reading of the same letters. Respelling the text before it reaches
 * the TTS engine makes spoken replies land much closer to how a Ghanaian
 * would say them — a big deal for low-literacy users who rely on the voice
 * features.
 *
 * Everything here is pure string work: no I/O, trivially unit-testable.
 */

/** Supported speech languages (matches the chat widget's language ids). */
export type SpeechLanguage = 'en' | 'twi' | 'ga' | 'ewe' | 'hausa' | 'pidgin';

/** Letters with a known English-friendly respelling, by language family. */
const LETTER_MAPS: Record<string, Record<string, string>> = {
  // Twi (Asante Twi) — ɛ ɔ ŋ plus tone marks on any vowel.
  twi: {
    ɛ: 'eh',
    ɔ: 'aw',
    ŋ: 'ng',
  },
  // Ga — same core set as Twi.
  ga: {
    ɛ: 'eh',
    ɔ: 'aw',
    ŋ: 'ng',
  },
  // Ewe — adds the retroflex/labiodental series to the Twi/Ga set.
  ewe: {
    ɛ: 'eh',
    ɔ: 'aw',
    ŋ: 'ng',
    ɖ: 'd',
    ƒ: 'f',
    ɣ: 'g',
    ʋ: 'v',
  },
  // Hausa — hooked consonants read as their plain counterparts.
  hausa: {
    ɓ: 'b',
    ɗ: 'd',
    ƙ: 'k',
    ƴ: 'y',
  },
};

/**
 * Twi palatalisation: word-initial ky/gy/hy/tw/dw sound nothing like their
 * English spellings. Mapping only at word start keeps English loanwords
 * inside a Twi reply (e.g. "bank", "class") untouched.
 */
const DIGRAPHS: Record<string, [RegExp, string][]> = {
  twi: [
    [/^ky/i, 'ch'],
    [/^gy/i, 'j'],
    [/^hy/i, 'sh'],
    [/^tw/i, 'chw'],
    [/^dw/i, 'j'],
  ],
  ga: [
    [/^gy/i, 'j'],
    [/^hy/i, 'sh'],
  ],
  ewe: [],
  hausa: [],
};

/** Tone / length diacritics: strip to the plain letter (á → a, é → e …). */
function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}

/** Emoji, symbols and invisible joiners a speech engine should not see. */
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{20E3}\u{2190}-\u{21FF}]/gu;

/** Markdown decorations that add nothing when spoken. */
function stripMarkdownAndEmoji(text: string): string {
  return text
    .replace(EMOJI_RE, ' ')
    .replace(/\*\*/g, '')
    .replace(/(^|\n)\s*#{1,6}\s+/g, '$1')
    .replace(/`{1,3}/g, '')
    .replace(/(^|\n)\s*[-*•]\s+/g, '$1');
}

/**
 * Money amounts: the cedi sign reads as nothing in English TTS voices.
 * "₵500" → "cedis 500" so the currency is actually spoken.
 */
function speakCurrency(text: string): string {
  return text
    .replace(/GH₵\s?/gi, 'cedis ')
    .replace(/GHS\s?/gi, 'cedis ')
    .replace(/₵\s?/g, 'cedis ');
}

/**
 * Rewritten-for-the-voice version of a reply.
 *
 * Order matters: markdown/emoji first (so bullets never become stray
 * words), then currency, then per-letter and word-initial digraph respells
 * on the cleaned text, and finally whitespace normalisation.
 */
export function respellForSpeech(rawText: string, language: string): string {
  const lang = language && language.toLowerCase();
  const letters = LETTER_MAPS[lang] ?? {};
  const digraphs = DIGRAPHS[lang] ?? [];

  let text = stripMarkdownAndEmoji(rawText ?? '');
  text = speakCurrency(text);
  text = stripDiacritics(text);

  if (lang === 'twi' || lang === 'ga' || lang === 'ewe' || lang === 'hausa') {
    // Word-initial digraphs (Twi palatalisation) — only where letters map.
    if (digraphs.length > 0) {
      text = text.replace(/[A-Za-z]+/g, (word) => {
        for (const [re, sub] of digraphs) {
          if (re.test(word)) {
            return word.replace(re, sub);
          }
        }
        return word;
      });
    }
    // Special letters — case-preserving for a natural-looking string.
    text = text.replace(/[ɛɔŋɖƒɣʋɓɗƙƴƐƆŊ]/g, (ch) => {
      const lower = ch.toLowerCase();
      const mapped = letters[lower];
      if (!mapped) return ch;
      return ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    });
  }

  // Line breaks become soft pauses; collapse whitespace.
  return text
    .replace(/\s*\n+\s*/g, ', ')
    .replace(/[ \t]+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();
}
