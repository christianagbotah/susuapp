import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

// Base64 string cap ≈ 13.3MB of raw audio (~60s of 16-bit mono WAV at
// 16kHz is ≈ 1.9MB, so even full-rate 48kHz recordings stay far below this).
const MAX_BASE64_LENGTH = 14_000_000;

/**
 * POST /api/ai/transcribe
 * Body: { audioBase64: string }
 * Returns: { text } — speech-to-text for the Susu AI voice input (mic button).
 * The client records PCM via the Web Audio API and encodes a 16-bit mono WAV,
 * which the ASR service accepts natively on every browser.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const audioBase64: string = typeof body?.audioBase64 === 'string' ? body.audioBase64 : '';

    if (!audioBase64) {
      return Response.json({ error: 'audioBase64 is required' }, { status: 400 });
    }
    if (audioBase64.length > MAX_BASE64_LENGTH) {
      return Response.json(
        { error: 'Recording too long — keep voice notes under 60 seconds.' },
        { status: 413 },
      );
    }

    const zai = await ZAI.create();
    const response = await zai.audio.asr.create({ file_base64: audioBase64 });

    const text = response?.text?.trim();
    if (!text) {
      return Response.json({ error: 'No speech detected. Please try again.' }, { status: 422 });
    }
    return Response.json({ text });
  } catch (error) {
    console.error('AI transcribe error:', error);
    return Response.json({ error: 'Voice transcription is temporarily unavailable' }, { status: 500 });
  }
}
