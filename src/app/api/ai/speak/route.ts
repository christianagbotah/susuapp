import ZAI from 'z-ai-web-dev-sdk';
import { respellForSpeech } from '@/lib/ghana-tts';

export const maxDuration = 60;

/**
 * The TTS engine accepts at most 1024 characters per request; respelling
 * (ɛ → eh …) also lengthens text, so cap the *input* well below the limit
 * and trim the respelled result to a safe final size.
 */
const MAX_INPUT_CHARS = 900;
const MAX_SPOKEN_CHARS = 1000;

/**
 * POST /api/ai/speak
 * Body: { text: string, language?: string }
 * Returns: { audioBase64, spokenText } — WAV speech audio for reading Susu AI
 * replies aloud (text-to-speech for low-literacy users).
 *
 * `language` triggers Ghana-aware phonetic respelling so Twi/Ga/Ewe/Hausa
 * text is pronounced closer to how a Ghanaian would say it. `spokenText` is
 * returned for transparency (and route tests) — the client only needs the
 * audio.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const text: string = typeof body?.text === 'string' ? body.text.trim() : '';
    const language: string = typeof body?.language === 'string' ? body.language : 'en';

    if (!text) {
      return Response.json({ error: 'text is required' }, { status: 400 });
    }

    const spokenText = respellForSpeech(text.slice(0, MAX_INPUT_CHARS), language);
    if (!spokenText) {
      return Response.json({ error: 'text is required' }, { status: 400 });
    }

    // The first TTS call after a cold start can fail once; one retry with a
    // short backoff masks that entirely from the user.
    let arrayBuffer: ArrayBuffer | null = null;
    for (let attempt = 0; attempt < 2 && !arrayBuffer; attempt++) {
      try {
        const zai = await ZAI.create();
        const response = await zai.audio.tts.create({
          input: spokenText.slice(0, MAX_SPOKEN_CHARS),
          voice: 'tongtong',
          speed: 1.0,
          response_format: 'wav',
          stream: false,
        });
        const buf = await response.arrayBuffer();
        if (buf && buf.byteLength >= 1000) arrayBuffer = buf;
      } catch (err) {
        if (attempt === 1) throw err;
        await new Promise((r) => setTimeout(r, 900));
      }
    }

    if (!arrayBuffer) {
      return Response.json({ error: 'Speech generation failed' }, { status: 502 });
    }

    return Response.json({
      audioBase64: Buffer.from(new Uint8Array(arrayBuffer)).toString('base64'),
      spokenText,
    });
  } catch (error) {
    console.error('AI speak error:', error);
    return Response.json({ error: 'Text-to-speech is temporarily unavailable' }, { status: 500 });
  }
}
