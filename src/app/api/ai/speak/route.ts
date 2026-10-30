import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const MAX_CHARS = 1200;

/**
 * POST /api/ai/speak
 * Body: { text: string }
 * Returns: { audioBase64 } — WAV speech audio for reading Susu AI replies
 * aloud (text-to-speech for low-literacy users).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const text: string = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return Response.json({ error: 'text is required' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const response = await zai.audio.tts.create({
      input: text.slice(0, MAX_CHARS),
      voice: 'tongtong',
      speed: 1.0,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength < 1000) {
      return Response.json({ error: 'Speech generation failed' }, { status: 502 });
    }

    return Response.json({ audioBase64: Buffer.from(new Uint8Array(arrayBuffer)).toString('base64') });
  } catch (error) {
    console.error('AI speak error:', error);
    return Response.json({ error: 'Text-to-speech is temporarily unavailable' }, { status: 500 });
  }
}
