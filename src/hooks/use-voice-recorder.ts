'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mic capture → 16-bit mono WAV (base64) for the ASR route.
 *
 * PCM is captured via ScriptProcessorNode (deprecated but universally
 * supported — including the WebViews inside the Capacitor/Tauri shells) and
 * wrapped in a hand-rolled WAV header, which the ASR service accepts natively
 * on every browser, unlike MediaRecorder's browser-specific containers
 * (webm/mp4/ogg).
 *
 * The hook powers two surfaces:
 *  - the Susu AI chat box mic (manual stop, transcript lands in the input), and
 *  - the hands-free Voice Mode overlay (optional silence auto-stop: the turn
 *    ends by itself once the user stops speaking, ChatGPT-style).
 */

export interface VoiceSegmentEvent {
  /** base64-encoded WAV, or null when nothing usable was captured */
  audioBase64: string | null;
  /** why the segment ended — user tap, trailing silence, or the hard cap */
  reason: 'user' | 'silence' | 'max-duration';
  /** whether speech-energy was detected (tuning aid; ASR stays the judge) */
  hadSpeech: boolean;
}

export interface VoiceRecorderStartOptions {
  /** fired exactly once when the segment completes (user stop, silence, cap) */
  onSegment: (event: VoiceSegmentEvent) => void;
  /** hard cap in ms (default 45s) */
  maxMs?: number;
  /**
   * Auto-finish after sustained silence following speech — the "just talk and
   * it knows" behaviour for voice mode. Off for the chat box mic on purpose:
   * market noise makes false positives annoying when the text is editable.
   */
  autoStopOnSilence?: boolean;
}

const DEFAULT_MAX_MS = 45_000;
/** ~-38 dBFS — above circuit noise, below soft speech. */
const SILENCE_RMS_THRESHOLD = 0.012;
/** speech must add up to at least this much energy before silence can stop it */
const SPEECH_CONFIRM_MS = 500;
/** this much trailing silence ends the turn */
const SILENCE_STOP_MS = 1500;
/** ignore the first moments while the mic settles */
const START_GRACE_MS = 400;

interface RecorderInternals {
  ctx: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
  stopTimer: ReturnType<typeof setTimeout>;
  onSegment: (event: VoiceSegmentEvent) => void;
  autoStop: boolean;
  startedAt: number;
  loudMs: number;
  quietMs: number;
  speechConfirmed: boolean;
  finished: boolean;
}

function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) view.setInt16(offset, samples[i], true);
  return buffer;
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const recRef = useRef<RecorderInternals | null>(null);
  const pcmRef = useRef<Int16Array[]>([]);
  const disposedRef = useRef(false);

  const teardown = (rec: RecorderInternals) => {
    clearTimeout(rec.stopTimer);
    try {
      rec.processor.disconnect();
      rec.source.disconnect();
    } catch {
      // graph already torn down
    }
    rec.stream.getTracks().forEach((t) => t.stop());
    void rec.ctx.close().catch(() => {});
  };

  const finish = useCallback((reason: 'user' | 'silence' | 'max-duration') => {
    const rec = recRef.current;
    if (!rec || rec.finished) return;
    rec.finished = true;
    recRef.current = null;
    setRecording(false);
    teardown(rec);
    const sampleRate = rec.ctx.sampleRate;
    const total = pcmRef.current.reduce((a, c) => a + c.length, 0);
    const merged = new Int16Array(total);
    let offset = 0;
    for (const chunk of pcmRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    pcmRef.current = [];
    const event: VoiceSegmentEvent = {
      audioBase64: total > 0 ? toBase64(encodeWav(merged, sampleRate)) : null,
      reason,
      hadSpeech: rec.speechConfirmed,
    };
    if (!disposedRef.current) rec.onSegment(event);
  }, []);

  const start = useCallback(
    async (opts: VoiceRecorderStartOptions): Promise<boolean> => {
      if (recRef.current) return true; // already recording
      let stream: MediaStream | null = null;
      let ctx: AudioContext | null = null;
      try {
        const AudioCtx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new AudioCtx();
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        const rec: RecorderInternals = {
          ctx,
          stream,
          source,
          processor,
          stopTimer: setTimeout(() => {}, 0) as unknown as ReturnType<typeof setTimeout>,
          onSegment: opts.onSegment,
          autoStop: opts.autoStopOnSilence === true,
          startedAt: Date.now(),
          loudMs: 0,
          quietMs: 0,
          speechConfirmed: false,
          finished: false,
        };
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const chunk = new Int16Array(input.length);
          let sumSquares = 0;
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            chunk[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            sumSquares += input[i] * input[i];
          }
          pcmRef.current.push(chunk);

          const cur = recRef.current;
          if (!cur || !cur.autoStop || cur.finished) return;
          const bufferMs = (input.length / cur.ctx.sampleRate) * 1000;
          const rms = Math.sqrt(sumSquares / input.length);
          const elapsed = Date.now() - cur.startedAt;
          if (rms >= SILENCE_RMS_THRESHOLD) {
            cur.loudMs += bufferMs;
            cur.quietMs = 0;
          } else {
            cur.quietMs += bufferMs;
          }
          if (cur.loudMs >= SPEECH_CONFIRM_MS) cur.speechConfirmed = true;
          if (
            cur.speechConfirmed &&
            cur.quietMs >= SILENCE_STOP_MS &&
            elapsed >= START_GRACE_MS + SPEECH_CONFIRM_MS
          ) {
            finish('silence');
          }
        };
        source.connect(processor);
        processor.connect(ctx.destination); // keeps the graph pulling on every browser
        rec.stopTimer = setTimeout(() => finish('max-duration'), opts.maxMs ?? DEFAULT_MAX_MS);
        recRef.current = rec;
        setRecording(true);
        return true;
      } catch {
        // getUserMedia denied/unavailable (or graph setup failed) — release
        // everything we opened so far, notably the AudioContext (mobile
        // Safari enforces a hard per-page limit on live contexts).
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (ctx) void ctx.close().catch(() => {});
        return false;
      }
    },
    [finish],
  );

  /** Stop the current segment; `onSegment` fires with whatever was captured. */
  const stop = useCallback(() => finish('user'), [finish]);

  // Hard cleanup on unmount: release the mic WITHOUT delivering a segment.
  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      const rec = recRef.current;
      if (rec && !rec.finished) {
        rec.finished = true;
        recRef.current = null;
        setRecording(false);
        teardown(rec);
      }
      pcmRef.current = [];
    };
  }, []);

  return { recording, start, stop };
}
