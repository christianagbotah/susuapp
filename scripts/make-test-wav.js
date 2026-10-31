const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');

async function main() {
  const zai = await ZAI.create();
  const res = await zai.audio.textToSpeech({
    input: 'What is my wallet balance and how do I grow my susu savings this month?',
    voice: 'tongtong',
  });
  const b64 = typeof res === 'string' ? res : res.audio || res.data || (res.base64 ?? '');
  if (!b64) throw new Error('no audio in response: ' + JSON.stringify(Object.keys(res)));
  fs.writeFileSync('/tmp/render/test-voice.wav', Buffer.from(b64, 'base64'));
  console.log('wrote /tmp/render/test-voice.wav');
}

main().catch((e) => { console.error('TTS failed:', e.message); process.exit(1); });
