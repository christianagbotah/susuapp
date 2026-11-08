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

# 11) Branch manager morning brief: approvals + staff + targets
status, data = post('/api/ai/branch-brief', {
    'managerName': 'Nana Ampofo',
    'branch': 'Makola Branch, Accra',
    'approvals': [
        {'applicantName': 'Grace Tetteh', 'productName': 'Market Trader Loan', 'amount': 15000, 'tenorMonths': 6, 'appraisalScore': 86, 'creditGrade': 'A', 'officerRecommendation': 'approve', 'officerName': 'Kwabena Mensah', 'requestDate': '2026-10-24', 'purpose': 'Christmas clothing stock', 'aiFlags': ['Stock valuation self-reported — reverify before disbursement']},
        {'applicantName': 'Ibrahim Musah', 'productName': 'Susu-Linked Loan', 'amount': 8000, 'tenorMonths': 4, 'appraisalScore': 78, 'creditGrade': 'B', 'officerRecommendation': 'approve', 'officerName': 'Abena Owusu', 'requestDate': '2026-10-24'},
        {'applicantName': 'Comfort Aidoo', 'productName': 'School Fees Loan', 'amount': 4500, 'tenorMonths': 10, 'appraisalScore': 64, 'creditGrade': 'C', 'officerRecommendation': 'review', 'officerName': 'Kwabena Mensah', 'requestDate': '2026-10-23'},
        {'applicantName': 'Hawa Abdulai', 'productName': 'Market Trader Loan', 'amount': 25000, 'tenorMonths': 12, 'appraisalScore': 42, 'creditGrade': 'E', 'officerRecommendation': 'reject', 'officerName': 'Kwabena Mensah', 'requestDate': '2026-10-22', 'purpose': 'Cold store expansion'},
    ],
    'staff': [
        {'name': 'Kwabena Mensah', 'role': 'Loan Officer', 'status': 'active', 'performance': 92},
        {'name': 'Akua Sarpong', 'role': 'Teller', 'status': 'active', 'performance': 88},
        {'name': 'Abena Owusu', 'role': 'Loan Officer', 'status': 'on_leave', 'performance': 79},
        {'name': 'Adjoa Mensimah', 'role': 'Teller', 'status': 'suspended', 'performance': 61},
        {'name': 'Esi Nyarko', 'role': 'Accountant', 'status': 'active', 'performance': 97},
    ],
    'targets': [
        {'metric': 'New Susu Accounts Opened', 'period': 'October 2026', 'target': 150, 'achieved': 118, 'unit': 'count', 'owner': 'All Officers'},
        {'metric': 'Daily Collections (MoMo + Cash)', 'period': 'October 2026', 'target': 320000, 'achieved': 286400, 'unit': 'currency', 'owner': 'Field Supervisor'},
        {'metric': 'Loan Disbursement', 'period': 'October 2026', 'target': 450000, 'achieved': 341000, 'unit': 'currency', 'owner': 'Loan Officers'},
        {'metric': 'Portfolio At Risk (PAR 30)', 'period': 'October 2026', 'target': 5, 'achieved': 3.8, 'unit': 'percent', 'owner': 'Branch Manager'},
        {'metric': 'KYC Full Completion Rate', 'period': 'October 2026', 'target': 85, 'achieved': 72, 'unit': 'percent', 'owner': 'Agents'},
    ],
})
brief = data.get('brief') or ''
items = data.get('items', [])
ok11 = (
    status == 200
    and 3 <= len(items) <= 5
    and len(brief) > 0
    and all(i.get('tone') in ('positive', 'warning', 'risk', 'tip') for i in items)
    and all(i.get('page') in ('loan-approvals', 'staff', 'targets', 'none') for i in items)
    and all(i.get('title') and i.get('detail') for i in items)
)
print('11 BRANCH-BRIEF:', status, 'brief =', brief[:110])
for i in items:
    print('   ', i.get('tone'), '|', i.get('page'), '|', (i.get('title') or '')[:44], '|', (i.get('detail') or '')[:90])
all_text = (brief + ' ' + ' '.join((i.get('title') or '') + ' ' + (i.get('detail') or '') for i in items)).lower()
flag_seen = 'stock' in all_text or 'reverify' in all_text or 'verif' in all_text
print('     ai-flag surfaced in brief (informational — review dialog guarantees it):', flag_seen)
print('    ', 'OK' if ok11 else 'CHECK')

# 11b) Error path: no data -> 400
status, data = post('/api/ai/branch-brief', {})
ok11b = status == 400
print('11b BRANCH-BRIEF(empty):', status, data, 'OK' if ok11b else 'CHECK')

# 12) Admin network pulse: KPIs + approvals + agents + branches + compliance + disputes + KYC
status, data = post('/api/ai/admin-pulse', {
    'adminName': 'Daniel Tetteh',
    'network': {
        'totalUsers': 2847, 'activeUsers': 2156, 'monthlyGrowth': 12.5,
        'totalDeposits': 4250000, 'totalSusuPool': 3200000,
        'totalLoansDisbursed': 1850000, 'monthlyRevenue': 385000,
        'defaultRate': 2.3, 'totalAgents': 24, 'activeAgents': 20, 'totalSusuGroups': 89,
    },
    'approvals': [
        {'applicantName': 'Hawa Abdulai', 'type': 'business', 'amount': 25000, 'tenor': '12 months', 'creditScore': 480, 'purpose': 'Cold store expansion'},
        {'applicantName': 'Grace Tetteh', 'type': 'business', 'amount': 15000, 'tenor': '6 months', 'creditScore': 780, 'purpose': 'Christmas clothing stock'},
        {'applicantName': 'Ibrahim Musah', 'type': 'susu-backed', 'amount': 8000, 'tenor': '4 months', 'creditScore': 700},
    ],
    'agents': [
        {'name': 'Yaw Owusu', 'branch': 'Makola', 'status': 'suspended', 'totalCollections': 12000, 'totalCustomers': 40, 'rating': 2.8},
        {'name': 'Ama Serwaa', 'branch': 'Kaneshie', 'status': 'active', 'totalCollections': 84000, 'totalCustomers': 95, 'rating': 4.9},
        {'name': 'Kofi Boateng', 'branch': 'Kumasi', 'status': 'active', 'totalCollections': 61000, 'totalCustomers': 72, 'rating': 4.3},
    ],
    'branches': [
        {'name': 'Makola Branch', 'region': 'Greater Accra', 'manager': 'Nana Ampofo', 'totalCustomers': 820, 'totalAgents': 9, 'totalSusuGroups': 31, 'status': 'active'},
        {'name': 'Kumasi Branch', 'region': 'Ashanti', 'manager': 'Abena Owusu', 'totalCustomers': 640, 'totalAgents': 7, 'totalSusuGroups': 24, 'status': 'active'},
        {'name': 'Tamale Branch', 'region': 'Northern', 'manager': 'Unassigned', 'totalCustomers': 180, 'totalAgents': 2, 'totalSusuGroups': 6, 'status': 'inactive'},
    ],
    'compliance': [
        {'type': 'suspicious_activity', 'title': 'Rapid Successive Transfers', 'severity': 'critical', 'status': 'escalated'},
        {'type': 'aml', 'title': 'Large Cash Deposit Alert', 'severity': 'high', 'status': 'investigating'},
        {'type': 'kyc', 'title': 'Incomplete KYC - Batch 47', 'severity': 'high', 'status': 'open'},
        {'type': 'transaction_limit', 'title': 'Daily Limit Exceeded', 'severity': 'medium', 'status': 'open'},
    ],
    'disputes': [
        {'type': 'not_received', 'amount': 1000, 'status': 'open'},
        {'type': 'duplicate', 'amount': 500, 'status': 'investigating'},
    ],
    'kyc': {'pending': 1, 'inReview': 0, 'rejected': 1, 'expired': 0},
})
brief = data.get('brief') or ''
items = data.get('items', [])
PAGES_12 = ('loans', 'agents', 'compliance', 'kyc-verification', 'susu-groups', 'analytics', 'none')
ok12 = (
    status == 200
    and 3 <= len(items) <= 5
    and len(brief) > 0
    and all(i.get('tone') in ('positive', 'warning', 'risk', 'tip') for i in items)
    and all(i.get('page') in PAGES_12 for i in items)
    and all(i.get('title') and i.get('detail') for i in items)
)
print('12 ADMIN-PULSE:', status, 'brief =', brief[:110])
for i in items:
    print('   ', i.get('tone'), '|', i.get('page'), '|', (i.get('title') or '')[:44], '|', (i.get('detail') or '')[:90])
print('    ', 'OK' if ok12 else 'CHECK')

# 12b) Error path: no data -> 400
status, data = post('/api/ai/admin-pulse', {'adminName': 'Daniel Tetteh', 'network': {'totalUsers': 2847}})
ok12b = status == 400
print('12b ADMIN-PULSE(empty):', status, data, 'OK' if ok12b else 'CHECK')

# 13) Compliance officer triage: AML alerts + STR pipeline + BoG returns
status, data = post('/api/ai/compliance-triage', {
    'officerName': 'Gifty Owusu',
    'alerts': [
        {'rule': 'Structuring — multiple deposits below ₵5,000 threshold', 'severity': 'critical', 'customerName': 'Hawa Abdulai', 'amount': 44000, 'status': 'escalated', 'triggeredDate': '2026-10-25', 'assignedTo': 'Gifty Owusu'},
        {'rule': 'Sanctions name screening partial match', 'severity': 'critical', 'customerName': 'Yaw Owusu Ansah', 'amount': 0, 'status': 'investigating', 'triggeredDate': '2026-10-20'},
        {'rule': 'Rapid movement — deposit & immediate withdrawal', 'severity': 'high', 'customerName': 'John Nyeko', 'amount': 18000, 'status': 'investigating', 'triggeredDate': '2026-10-24'},
        {'rule': 'Geographic — collections from high-risk border zone', 'severity': 'medium', 'customerName': 'Adiza Fuseini', 'amount': 12400, 'status': 'open', 'triggeredDate': '2026-10-15'},
    ],
    'strs': [
        {'subjectName': 'Hawa Abdulai', 'status': 'filed', 'filedWith': 'Financial Intelligence Centre (FIC)', 'filedDate': '2026-10-25', 'reference': 'FIC/STR/2026/0912', 'amountInvolved': 44000},
    ],
    'returns': [
        {'returnName': 'AML/CFT Return', 'period': 'Q3 2026', 'dueDate': '2026-10-20', 'status': 'late', 'completion': 100},
        {'returnName': 'NBFRI 8 (Liquid Assets)', 'period': 'October 2026', 'dueDate': '2026-11-10', 'status': 'not_started', 'completion': 0},
        {'returnName': 'NBFRI 3 (Capital Adequacy)', 'period': 'October 2026', 'dueDate': '2026-11-10', 'status': 'in_progress', 'completion': 65},
    ],
})
brief = data.get('brief') or ''
items = data.get('items', [])
PAGES_13 = ('aml-alerts', 'str-reports', 'bog-returns', 'none')
ok13 = (
    status == 200
    and 3 <= len(items) <= 5
    and len(brief) > 0
    and all(i.get('tone') in ('positive', 'warning', 'risk', 'tip') for i in items)
    and all(i.get('page') in PAGES_13 for i in items)
    and all(i.get('title') and i.get('detail') for i in items)
)
print('13 COMPLIANCE-TRIAGE:', status, 'brief =', brief[:110])
for i in items:
    print('   ', i.get('tone'), '|', i.get('page'), '|', (i.get('title') or '')[:44], '|', (i.get('detail') or '')[:90])
print('    ', 'OK' if ok13 else 'CHECK')

# 13b) Error path: no data -> 400
status, data = post('/api/ai/compliance-triage', {'officerName': 'Gifty Owusu'})
ok13b = status == 400
print('13b COMPLIANCE-TRIAGE(empty):', status, data, 'OK' if ok13b else 'CHECK')

# 14) Field supervisor focus: agents + routes + spot checks
status, data = post('/api/ai/supervisor-focus', {
    'supervisorName': 'Abena Frimpong',
    'branch': 'Makola Branch, Accra',
    'agents': [
        {'name': 'Adiza Mohammed', 'area': 'Nima', 'status': 'offline', 'todayCollections': 3890, 'expectedToday': 4500, 'collectionRate': 86, 'floatBalance': 240, 'pendingVerify': 8, 'lastSync': '17:48 yesterday'},
        {'name': 'Esi Blankson', 'area': 'Madina Market', 'status': 'at_office', 'todayCollections': 4210, 'expectedToday': 6900, 'collectionRate': 61, 'floatBalance': 920, 'pendingVerify': 11, 'lastSync': '08:55'},
        {'name': 'Ama Serwaa', 'area': 'Tema Station', 'status': 'in_field', 'todayCollections': 7480, 'expectedToday': 8200, 'collectionRate': 91, 'floatBalance': 1850, 'pendingVerify': 2, 'lastSync': '09:44'},
        {'name': 'Kofi Adjei', 'area': 'Makola Market', 'status': 'in_field', 'todayCollections': 9820, 'expectedToday': 11400, 'collectionRate': 86, 'floatBalance': 3240, 'pendingVerify': 6, 'lastSync': '09:41'},
    ],
    'routes': [
        {'name': 'Madina Line 1', 'area': 'Madina Market — foodstuffs', 'agentName': 'Esi Blankson', 'dailyTarget': 5200, 'collectedToday': 4210, 'status': 'in_progress', 'stopsPending': 3, 'stopsMissed': 1},
        {'name': 'Makola Line A', 'area': 'Makola Market — fabrics', 'agentName': 'Kofi Adjei', 'dailyTarget': 4800, 'collectedToday': 4120, 'status': 'in_progress', 'stopsPending': 2, 'stopsMissed': 0},
        {'name': 'Tema Station Line 2', 'area': 'Tema Station — spare parts', 'agentName': 'Ama Serwaa', 'dailyTarget': 4200, 'collectedToday': 4200, 'status': 'completed', 'stopsPending': 0, 'stopsMissed': 0},
    ],
    'spotChecks': [
        {'agentName': 'Esi Blankson', 'rating': 'needs_improvement', 'cashMatched': False, 'issuesFound': ['2 receipts not issued', 'float declaration missing']},
    ],
})
brief = data.get('brief') or ''
items = data.get('items', [])
PAGES_14 = ('agents', 'routes', 'spot-checks', 'none')
ok14 = (
    status == 200
    and 3 <= len(items) <= 5
    and len(brief) > 0
    and all(i.get('tone') in ('positive', 'warning', 'risk', 'tip') for i in items)
    and all(i.get('page') in PAGES_14 for i in items)
    and all(i.get('title') and i.get('detail') for i in items)
)
print('14 SUPERVISOR-FOCUS:', status, 'brief =', brief[:110])
for i in items:
    print('   ', i.get('tone'), '|', i.get('page'), '|', (i.get('title') or '')[:44], '|', (i.get('detail') or '')[:90])
print('    ', 'OK' if ok14 else 'CHECK')

# 14b) Error path: no data -> 400
status, data = post('/api/ai/supervisor-focus', {'supervisorName': 'Abena Frimpong'})
ok14b = status == 400
print('14b SUPERVISOR-FOCUS(empty):', status, data, 'OK' if ok14b else 'CHECK')

# 15) Accountant books check: ledger + CoA + statements + reconciliations
status, data = post('/api/ai/accountant-brief', {
    'accountantName': 'Esi Nyarko',
    'ledger': [
        {'date': '2026-10-31', 'reference': 'JV-2026-041', 'accountName': 'MTN MoMo Settlement Account', 'debit': 12500, 'credit': 0, 'narration': 'Daily MoMo sweep to bank', 'status': 'posted'},
        {'date': '2026-10-31', 'reference': 'JV-2026-041', 'accountName': 'GCB Bank Operating Account', 'debit': 0, 'credit': 12500, 'narration': 'Daily MoMo sweep to bank', 'status': 'posted'},
        {'date': '2026-10-30', 'reference': 'JV-2026-039', 'accountName': 'Susu Payable — Members', 'debit': 0, 'credit': 8400, 'narration': 'October susu contributions', 'status': 'posted'},
        {'date': '2026-10-30', 'reference': 'JV-2026-038', 'accountName': 'Interest Income', 'debit': 0, 'credit': 3150, 'narration': 'Loan interest accrued', 'status': 'posted'},
        {'date': '2026-10-29', 'reference': 'JV-2026-036', 'accountName': 'Office Expenses', 'debit': 950, 'credit': 0, 'narration': 'Generator diesel', 'status': 'reversed'},
        {'date': '2026-10-29', 'reference': 'JV-2026-037', 'accountName': 'Office Expenses', 'debit': 950, 'credit': 0, 'narration': 'Generator diesel (re-posted)', 'status': 'posted'},
    ],
    'coa': [
        {'code': '1010', 'name': 'GCB Bank Operating Account', 'type': 'asset', 'balance': 486200, 'momoChange': 4.2},
        {'code': '1020', 'name': 'MTN MoMo Settlement Account', 'type': 'asset', 'balance': 62400, 'momoChange': -2.8},
        {'code': '2010', 'name': 'Susu Payable — Members', 'type': 'liability', 'balance': 1240800, 'momoChange': 6.1},
        {'code': '4010', 'name': 'Interest Income', 'type': 'income', 'balance': 286400},
        {'code': '5010', 'name': 'Office Expenses', 'type': 'expense', 'balance': 48300},
    ],
    'statements': [
        {'name': 'Statement of Financial Position', 'period': 'September 2026', 'status': 'final'},
        {'name': 'Income Statement', 'period': 'Jan–Sep 2026', 'status': 'final'},
        {'name': 'Trial Balance', 'period': 'October 2026 mid-month', 'status': 'draft'},
    ],
    'reconciliations': [
        {'source': 'GCB Bank — Operating', 'period': 'October 2026', 'status': 'in_progress', 'bookBalance': 486200, 'statementBalance': 485400, 'unmatched': [{'description': 'Bank charges not posted', 'amount': 180, 'type': 'debit'}, {'description': 'Unpresented cheque — Adjoa Prints', 'amount': 620, 'type': 'credit'}]},
        {'source': 'MTN MoMo Settlement', 'period': 'October 2026', 'status': 'variance', 'bookBalance': 62400, 'statementBalance': 62220, 'unmatched': [{'description': 'Settlement fee drift — 31 Oct batch', 'amount': 180, 'type': 'debit'}]},
        {'source': 'Fidelity Bank — Savings', 'period': 'September 2026', 'status': 'reconciled', 'bookBalance': 210000, 'statementBalance': 210000, 'unmatched': []},
    ],
})
brief = data.get('brief') or ''
items = data.get('items', [])
PAGES_15 = ('ledger', 'statements', 'reconciliation', 'none')
ok15 = (
    status == 200
    and 3 <= len(items) <= 5
    and len(brief) > 0
    and all(i.get('tone') in ('positive', 'warning', 'risk', 'tip') for i in items)
    and all(i.get('page') in PAGES_15 for i in items)
    and all(i.get('title') and i.get('detail') for i in items)
)
print('15 ACCOUNTANT-BRIEF:', status, 'brief =', brief[:110])
for i in items:
    print('   ', i.get('tone'), '|', i.get('page'), '|', (i.get('title') or '')[:44], '|', (i.get('detail') or '')[:90])
print('    ', 'OK' if ok15 else 'CHECK')

# 15b) Error path: no data -> 400
status, data = post('/api/ai/accountant-brief', {'accountantName': 'Esi Nyarko'})
ok15b = status == 400
print('15b ACCOUNTANT-BRIEF(empty):', status, data, 'OK' if ok15b else 'CHECK')

# 16) Teller drawer check: drawer + queue + transfers + EOD lines
status, data = post('/api/ai/teller-brief', {
    'tellerName': 'Akua Sarpong',
    'drawer': {'openingFloat': 5000, 'cashIn': 18420, 'cashOut': 3410, 'expectedBalance': 20010, 'countedBalance': 19960, 'variance': -50, 'status': 'variance_pending'},
    'queue': [
        {'queueNo': 14, 'type': 'withdrawal', 'amount': 1200, 'channel': 'cash', 'status': 'waiting'},
        {'queueNo': 15, 'type': 'susu_collection', 'amount': 450, 'channel': 'momo_mtn', 'status': 'waiting'},
        {'queueNo': 16, 'type': 'deposit', 'amount': 2600, 'channel': 'cash', 'status': 'processing'},
        {'queueNo': 13, 'type': 'loan_repayment', 'amount': 800, 'channel': 'cash', 'status': 'completed'},
    ],
    'transfers': [
        {'direction': 'to_bank', 'amount': 15000, 'status': 'requested', 'requestedBy': 'Akua Sarpong'},
        {'direction': 'from_vault', 'amount': 2000, 'status': 'in_transit', 'requestedBy': 'Nana Ampofo'},
    ],
    'eodLines': [
        {'category': 'momo_mtn', 'systemTotal': 41280, 'countedTotal': 41100, 'variance': -180, 'txCount': 156},
        {'category': 'cash', 'systemTotal': 18420, 'countedTotal': 18370, 'variance': -50, 'txCount': 84},
        {'category': 'momo_telecel', 'systemTotal': 8940, 'countedTotal': 8940, 'variance': 0, 'txCount': 38},
        {'category': 'cheque', 'systemTotal': 6200, 'countedTotal': 6200, 'variance': 0, 'txCount': 5},
    ],
})
brief = data.get('brief') or ''
items = data.get('items', [])
PAGES_16 = ('counter', 'reconciliation', 'vault', 'none')
ok16 = (
    status == 200
    and 3 <= len(items) <= 5
    and len(brief) > 0
    and all(i.get('tone') in ('positive', 'warning', 'risk', 'tip') for i in items)
    and all(i.get('page') in PAGES_16 for i in items)
    and all(i.get('title') and i.get('detail') for i in items)
)
print('16 TELLER-BRIEF:', status, 'brief =', brief[:110])
for i in items:
    print('   ', i.get('tone'), '|', i.get('page'), '|', (i.get('title') or '')[:44], '|', (i.get('detail') or '')[:90])
print('    ', 'OK' if ok16 else 'CHECK')

# 16b) Error path: no data -> 400
status, data = post('/api/ai/teller-brief', {'tellerName': 'Akua Sarpong'})
ok16b = status == 400
print('16b TELLER-BRIEF(empty):', status, data, 'OK' if ok16b else 'CHECK')

# 17) Treasurer payout readiness: groups + payout queue
status, data = post('/api/ai/treasurer-brief', {
    'treasurerName': 'Yaw Darko',
    'groups': [
        {'name': 'Makola Market Women', 'members': 12, 'currentRound': 3, 'totalRounds': 12, 'totalPool': 14400, 'contributionAmount': 100, 'frequency': 'daily', 'nextPayout': '2026-11-05', 'nextPayoutMember': 'Akosua Brewoo', 'status': 'active', 'overdue': 3, 'pending': 5},
        {'name': 'Kaneshie Traders Circle', 'members': 15, 'currentRound': 12, 'totalRounds': 12, 'totalPool': 22500, 'contributionAmount': 125, 'frequency': 'weekly', 'nextPayout': '2026-11-08', 'nextPayoutMember': 'Grace Tetteh', 'status': 'active', 'overdue': 0, 'pending': 2},
        {'name': 'Nima Foodstuffs Group', 'members': 10, 'currentRound': 7, 'totalRounds': 10, 'totalPool': 9800, 'contributionAmount': 100, 'frequency': 'daily', 'nextPayout': '2026-11-03', 'nextPayoutMember': 'Adiza Fuseini', 'status': 'active', 'overdue': 1, 'pending': 4},
    ],
    'payouts': [
        {'groupName': 'Nima Foodstuffs Group', 'memberName': 'Adiza Fuseini', 'amount': 9800, 'payoutDate': '2026-11-03', 'status': 'pending', 'disbursementMethod': 'momo'},
        {'groupName': 'Makola Market Women', 'memberName': 'Akosua Brewoo', 'amount': 14400, 'payoutDate': '2026-11-05', 'status': 'pending', 'disbursementMethod': 'momo'},
        {'groupName': 'Kaneshie Traders Circle', 'memberName': 'Grace Tetteh', 'amount': 22000, 'payoutDate': '2026-10-28', 'status': 'completed', 'disbursementMethod': 'bank'},
    ],
})
brief = data.get('brief') or ''
items = data.get('items', [])
PAGES_17 = ('groups', 'payouts', 'members', 'reports', 'none')
ok17 = (
    status == 200
    and 3 <= len(items) <= 5
    and len(brief) > 0
    and all(i.get('tone') in ('positive', 'warning', 'risk', 'tip') for i in items)
    and all(i.get('page') in PAGES_17 for i in items)
    and all(i.get('title') and i.get('detail') for i in items)
)
print('17 TREASURER-BRIEF:', status, 'brief =', brief[:110])
for i in items:
    print('   ', i.get('tone'), '|', i.get('page'), '|', (i.get('title') or '')[:44], '|', (i.get('detail') or '')[:90])
print('    ', 'OK' if ok17 else 'CHECK')

# 17b) Error path: no data -> 400
status, data = post('/api/ai/treasurer-brief', {'treasurerName': 'Yaw Darko'})
ok17b = status == 400
print('17b TREASURER-BRIEF(empty):', status, data, 'OK' if ok17b else 'CHECK')

print('\nSUMMARY:', 'ALL OK' if all([ok4, ok4b, ok5, ok7, ok8, ok9, ok10, ok10b, ok11, ok11b, ok12, ok12b, ok13, ok13b, ok14, ok14b, ok15, ok15b, ok16, ok16b, ok17, ok17b]) else 'SOME CHECKS FAILED')
