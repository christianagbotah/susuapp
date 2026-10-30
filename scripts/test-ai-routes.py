#!/usr/bin/env python3
"""Smoke-test the /api/ai/transcribe and /api/ai/localize routes."""
import base64
import json
import urllib.request

BASE = 'http://localhost:3000'

# 1) Transcribe: TTS-generated English question -> expect matching text
with open('/tmp/render/test-voice.wav', 'rb') as f:
    audio_b64 = base64.b64encode(f.read()).decode()

req = urllib.request.Request(
    f'{BASE}/api/ai/transcribe',
    data=json.dumps({'audioBase64': audio_b64}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
with urllib.request.urlopen(req, timeout=90) as r:
    transcribe = json.loads(r.read())
print('TRANSCRIBE:', json.dumps(transcribe, ensure_ascii=False))

# 2) Error path: empty body -> expect 400
req = urllib.request.Request(
    f'{BASE}/api/ai/transcribe',
    data=json.dumps({}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print('EMPTY-BODY (unexpected ok):', r.status)
except urllib.error.HTTPError as e:
    print('EMPTY-BODY:', e.code, json.loads(e.read()))

# 3) Localize: customer greeting + suggestions -> Twi
req = urllib.request.Request(
    f'{BASE}/api/ai/localize',
    data=json.dumps({
        'language': 'twi',
        'greeting': "Akwaaba! I'm Susu AI 👋 Your personal money assistant. Ask me anything about susu, saving, loans or budgeting.",
        'suggestions': ['How does susu work?', 'Help me budget better', 'Tips to save for school fees', 'Is a susu-backed loan right for me?'],
    }).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
with urllib.request.urlopen(req, timeout=90) as r:
    localize = json.loads(r.read())
print('LOCALIZE(twi):', json.dumps(localize, ensure_ascii=False, indent=1))
