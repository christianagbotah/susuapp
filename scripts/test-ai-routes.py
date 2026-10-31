#!/usr/bin/env python3
"""Smoke-test the AI routes: transcribe, localize, financial-health, speak, appraisal-assist(draftNote)."""
import base64
import json
import urllib.request

BASE = 'http://localhost:3000'


def post(path, payload, timeout=120):
    req = urllib.request.Request(
        f'{BASE}{path}',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# 1) Transcribe: TTS-generated English question -> expect matching text
with open('/tmp/render/test-voice.wav', 'rb') as f:
    audio_b64 = base64.b64encode(f.read()).decode()
status, data = post('/api/ai/transcribe', {'audioBase64': audio_b64})
print('1 TRANSCRIBE:', status, json.dumps(data, ensure_ascii=False)[:120])

# 2) Error path: empty body -> expect 400
status, data = post('/api/ai/transcribe', {})
print('2 TRANSCRIBE empty:', status, data)

# 3) Localize: customer greeting + suggestions -> Twi
status, data = post('/api/ai/localize', {
    'language': 'twi',
    'greeting': "Akwaaba! I'm Susu AI 👋 Your personal money assistant. Ask me anything about susu, saving, loans or budgeting.",
    'suggestions': ['How does susu work?', 'Help me budget better', 'Tips to save for school fees', 'Is a susu-backed loan right for me?'],
})
print('3 LOCALIZE(twi):', status, json.dumps(data, ensure_ascii=False)[:150])

# 4) Financial health: realistic customer snapshot
status, data = post('/api/ai/financial-health', {
    'wallets': [{'type': 'main', 'balance': 1240.5}, {'type': 'savings', 'balance': 3150}, {'type': 'susu', 'balance': 800}],
    'transactions': [
        {'type': 'susu_contribution', 'amount': 50, 'category': 'susu', 'date': '2026-10-30'},
        {'type': 'susu_contribution', 'amount': 50, 'category': 'susu', 'date': '2026-10-29'},
        {'type': 'deposit', 'amount': 500, 'category': 'income', 'date': '2026-10-28'},
        {'type': 'withdrawal', 'amount': 120, 'category': 'food', 'date': '2026-10-27'},
        {'type': 'loan_repayment', 'amount': 210, 'category': 'loan', 'date': '2026-10-26'},
        {'type': 'bill_payment', 'amount': 85, 'category': 'utilities', 'date': '2026-10-25'},
    ],
    'budgets': [
        {'category': 'food', 'allocatedAmount': 600, 'spentAmount': 540},
        {'category': 'transport', 'allocatedAmount': 200, 'spentAmount': 90},
        {'category': 'utilities', 'allocatedAmount': 150, 'spentAmount': 85},
    ],
    'savingsGoals': [
        {'name': 'Children School Fees', 'currentAmount': 1900, 'targetAmount': 3000},
        {'name': 'Emergency Fund', 'currentAmount': 800, 'targetAmount': 2000},
    ],
    'loans': [{'status': 'active', 'amount': 2500, 'remainingBalance': 1450}],
    'susuGroups': [{'name': 'Makola Traders Circle', 'contributionAmount': 50, 'frequency': 'daily', 'status': 'active'}],
    'susuPayouts': [{'groupName': 'Makola Traders Circle', 'amount': 1450, 'status': 'pending', 'payoutDate': '2026-11-15'}],
})
ok4 = status == 200 and 0 <= data.get('score', -1) <= 100 and len(data.get('factors', [])) == 5
print('4 FIN-HEALTH:', status, 'score=', data.get('score'), data.get('grade'), 'factors=', len(data.get('factors', [])), 'tips=', len(data.get('tips', [])), 'OK' if ok4 else 'CHECK')
print('  summary:', (data.get('summary') or '')[:160])

# 4b) Financial health in Twi: summary/factors/tips localised, grade stays English
payload_twi = {
    'language': 'twi',
    'wallets': [{'type': 'main', 'balance': 1240.5}, {'type': 'savings', 'balance': 3150}, {'type': 'susu', 'balance': 800}],
    'transactions': [
        {'type': 'susu_contribution', 'amount': 50, 'category': 'susu', 'date': '2026-10-30'},
        {'type': 'susu_contribution', 'amount': 50, 'category': 'susu', 'date': '2026-10-29'},
        {'type': 'deposit', 'amount': 500, 'category': 'income', 'date': '2026-10-28'},
        {'type': 'withdrawal', 'amount': 120, 'category': 'food', 'date': '2026-10-27'},
        {'type': 'loan_repayment', 'amount': 210, 'category': 'loan', 'date': '2026-10-26'},
        {'type': 'bill_payment', 'amount': 85, 'category': 'utilities', 'date': '2026-10-25'},
    ],
    'budgets': [
        {'category': 'food', 'allocatedAmount': 600, 'spentAmount': 540},
        {'category': 'transport', 'allocatedAmount': 200, 'spentAmount': 90},
        {'category': 'utilities', 'allocatedAmount': 150, 'spentAmount': 85},
    ],
    'savingsGoals': [
        {'name': 'Children School Fees', 'currentAmount': 1900, 'targetAmount': 3000},
        {'name': 'Emergency Fund', 'currentAmount': 800, 'targetAmount': 2000},
    ],
    'loans': [{'status': 'active', 'amount': 2500, 'remainingBalance': 1450}],
    'susuGroups': [{'name': 'Makola Traders Circle', 'contributionAmount': 50, 'frequency': 'daily', 'status': 'active'}],
    'susuPayouts': [{'groupName': 'Makola Traders Circle', 'amount': 1450, 'status': 'pending', 'payoutDate': '2026-11-15'}],
}
status, data = post('/api/ai/financial-health', payload_twi, timeout=180)
summary_twi = data.get('summary') or ''
labels_twi = [f.get('label', '') for f in data.get('factors', [])]
tips_twi = data.get('tips') or []
twi_markers = any(ch in (summary_twi + ' '.join(labels_twi) + ' '.join(tips_twi)) for ch in 'ɛɔŋ')
ok4b = (
    status == 200 and 0 <= data.get('score', -1) <= 100
    and len(data.get('factors', [])) == 5
    and data.get('grade') in ('Excellent', 'Good', 'Fair', 'Struggling')
    and twi_markers
)
print('4b FIN-HEALTH(twi):', status, 'score=', data.get('score'), 'grade=', data.get('grade'), 'twi chars=', twi_markers, 'OK' if ok4b else 'CHECK')
print('  twi summary:', summary_twi[:170])
print('  twi labels:', labels_twi)
print('  twi tips:', [t[:70] for t in tips_twi[:3]])

# 5) Speak: short text -> expect base64 WAV
status, data = post('/api/ai/speak', {'text': 'Your wallet balance is one thousand two hundred cedis.'})
audio_len = len(data.get('audioBase64', ''))
ok5 = status == 200 and audio_len > 50000
print('5 SPEAK:', status, 'audioBase64 chars =', audio_len, 'OK' if ok5 else 'CHECK')

# 7) Speak in Twi: special letters must be respelled for English-leaning TTS voices
#    (kyerɛ → chereh, ɔ → aw, ŋ → ng, ₵ → cedis, emoji stripped)
twi_text = 'Akwaaba! Wo sika boɔ yɛ ₵500. **Kyerɛ** me sika a wɔde awɔ nkyɛn. 😊'
status, data = post('/api/ai/speak', {'text': twi_text, 'language': 'twi'})
spoken = data.get('spokenText', '')
audio_len = len(data.get('audioBase64', ''))
ok7 = (
    status == 200 and audio_len > 50000
    and all(ch not in spoken for ch in 'ɛɔŋ')
    and 'eh' in spoken and 'cedis' in spoken
    and '**' not in spoken
)
print('7 SPEAK(twi):', status, 'audio chars =', audio_len, 'spoken =', repr(spoken), 'OK' if ok7 else 'CHECK')

# 8) Speak English with markdown/emoji/cedi sign -> cleaned spokenText
status, data = post('/api/ai/speak', {
    'text': '**Your balance**: ₵1,240.50 \n- Susu pot: ₵800\n- 💰 Keep saving!',
    'language': 'en',
})
spoken = data.get('spokenText', '')
ok8 = (
    status == 200
    and '₵' not in spoken and '**' not in spoken and '-' not in spoken
    and spoken.count('cedis') == 2
)
print('8 SPEAK(en clean):', status, 'spoken =', repr(spoken), 'OK' if ok8 else 'CHECK')

# 9) Speak long text: must stay under the engine's 1024-char input limit
long_text = ('Ama saves fifty cedis every market day with her susu group. ' * 40) + '₵2,000'
status, data = post('/api/ai/speak', {'text': long_text, 'language': 'en'})
spoken = data.get('spokenText', '')
ok9 = status == 200 and 0 < len(spoken) <= 1024
print('9 SPEAK(long capped):', status, 'spoken chars =', len(spoken), 'OK' if ok9 else 'CHECK')

# 6) Appraisal draft note: includeDraftNote=true -> expect scores + rationale + draftNote
status, data = post('/api/ai/appraisal-assist', {
    'applicant': {
        'businessType': 'Market trader (provisions)',
        'purpose': 'Restock provisions shop',
        'amount': 2500,
        'tenorMonths': 6,
        'susuHistory': 'Susu-linked daily savings of about GHS 50',
    },
    'partialScores': {'character': 4, 'capacity': 3, 'capital': 3, 'collateral': 2, 'condition': 4},
    'includeDraftNote': True,
})
note = data.get('draftNote', '')
ok6 = status == 200 and 'suggestedScores' in data and len(note) > 200
print('6 APPRAISAL+NOTE:', status, 'scores=', 'suggestedScores' in data, 'note chars =', len(note), 'OK' if ok6 else 'CHECK')
print('  note preview:', note[:180].replace('\n', ' '))

# 10) Agent smart visit order: rank pending/absent customers (never collected)
status, data = post('/api/ai/collections-prioritize', {
    'agentName': 'Kofi Boateng',
    'routes': [{
        'name': 'Makola Morning Route',
        'area': 'Makola Market, Accra',
        'customers': [
            {'customerId': 'cus-001', 'customerName': 'Akosua Mensah', 'susuGroupName': 'Makola Traders Circle', 'expectedAmount': 120, 'collectedAmount': 0, 'status': 'pending'},
            {'customerId': 'cus-002', 'customerName': 'Yaw Owusu', 'susuGroupName': 'Makola Traders Circle', 'expectedAmount': 80, 'collectedAmount': 0, 'status': 'absent', 'notes': 'Stall closed, neighbour says he travelled to Kumasi'},
            {'customerId': 'cus-003', 'customerName': 'Efua Darko', 'susuGroupName': 'Makola Traders Circle', 'expectedAmount': 50, 'collectedAmount': 20, 'status': 'pending', 'notes': 'Paid part, promises rest by afternoon'},
            {'customerId': 'cus-004', 'customerName': 'Ama Asantewaa', 'susuGroupName': 'Makola Traders Circle', 'expectedAmount': 200, 'collectedAmount': 0, 'status': 'pending'},
            {'customerId': 'cus-005', 'customerName': 'Kwabena Osei', 'susuGroupName': 'Makola Traders Circle', 'expectedAmount': 60, 'collectedAmount': 60, 'status': 'collected'},
        ],
    }],
})
visits = data.get('visits', [])
ids = {v.get('customerId') for v in visits}
ok10 = (
    status == 200
    and 3 <= len(visits) <= 12
    and all(v.get('urgency') in ('high', 'medium', 'low') for v in visits)
    and all(v.get('suggestion') in ('collect', 'revisit', 'call') for v in visits)
    and ids <= {'cus-001', 'cus-002', 'cus-003', 'cus-004'}
    and 'cus-005' not in ids
    and len(ids) == len(visits)
)
print('10 SMART-ROUTE:', status, 'brief =', (data.get('brief') or '')[:110])
for v in visits:
    print('   ', v.get('customerId'), '|', v.get('urgency'), '|', v.get('suggestion'), '|', (v.get('reason') or '')[:80])
print('    ', 'OK' if ok10 else 'CHECK')

# 10b) Error path: nothing actionable (all collected) -> 400
status, data = post('/api/ai/collections-prioritize', {
    'routes': [{'name': 'Done route', 'customers': [
        {'customerId': 'cus-009', 'customerName': 'X', 'expectedAmount': 10, 'collectedAmount': 10, 'status': 'collected'},
    ]}],
})
ok10b = status == 400
print('10b SMART-ROUTE(all collected):', status, data, 'OK' if ok10b else 'CHECK')

print('\nSUMMARY:', 'ALL OK' if all([ok4, ok4b, ok5, ok7, ok8, ok9, ok10, ok10b]) else 'SOME CHECKS FAILED')
