const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');

async function main() {
  const zai = await ZAI.create();
  const res = await zai.audio.tts.create({
    input: 'What is my wallet balance and how do I grow my susu savings this month?',
    voice: 'tongtong',
    speed: 1.0,
    response_format: 'wav',
    stream: false,
  });
  const buf = await res.arrayBuffer();
  if (!buf || buf.byteLength < 1000) throw new Error('no audio: ' + buf.byteLength + ' bytes');
  fs.writeFileSync('/tmp/render/test-voice.wav', Buffer.from(new Uint8Array(buf)));
  console.log('wrote /tmp/render/test-voice.wav (' + buf.byteLength + ' bytes)');
}

main().catch((e) => { console.error('TTS failed:', e.message); process.exit(1); });
