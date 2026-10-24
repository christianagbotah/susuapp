// ============================================
// iSusuPro Ghana — Staff Portal Mock Data
// Realistic Ghanaian susu/microfinance operations:
// Makola Market, Kejetia, Kaneshie, MoMo floats,
// GCB/Ecobank, FIC & BoG NBFRI returns.
// ============================================

import type {
  StaffMember, LoanApprovalRequest, BranchTarget,
  LoanApplication, LoanAppraisal, PortfolioLoan,
  TellerDrawer, CounterTransaction, VaultTransfer, EODReconciliationLine,
  SupervisedAgent, SupervisorRoute, SpotCheck,
  LedgerEntry, ChartOfAccount, FinancialStatement, BankReconciliation,
  AMLAlert, STRReport, BOGReturn, Notification,
} from './types';

const today = '2026-10-25';

// ================= BRANCH MANAGER =================
export const mockStaff: StaffMember[] = [
  { id: 'stm-001', name: 'Kwabena Mensah', role: 'Loan Officer', phone: '024 412 8890', email: 'kwabena.mensah@isusupro.com', branch: 'Makola Branch', status: 'active', joinedDate: '2023-03-14', avatarColor: 'bg-emerald-500', performance: 92, pendingApprovals: 4 },
  { id: 'stm-002', name: 'Akua Sarpong', role: 'Teller', phone: '055 210 4471', email: 'akua.sarpong@isusupro.com', branch: 'Makola Branch', status: 'active', joinedDate: '2024-01-09', avatarColor: 'bg-blue-500', performance: 88, pendingApprovals: 0 },
  { id: 'stm-003', name: 'Yaw Boateng', role: 'Field Supervisor', phone: '020 778 3320', email: 'yaw.boateng@isusupro.com', branch: 'Makola Branch', status: 'active', joinedDate: '2022-11-02', avatarColor: 'bg-amber-500', performance: 95, pendingApprovals: 2 },
  { id: 'stm-004', name: 'Abena Owusu', role: 'Loan Officer', phone: '024 909 1120', email: 'abena.owusu@isusupro.com', branch: 'Kaneshie Branch', status: 'on_leave', joinedDate: '2023-07-21', avatarColor: 'bg-purple-500', performance: 79, pendingApprovals: 0 },
  { id: 'stm-005', name: 'Kofi Adjei', role: 'Agent', phone: '054 335 9981', email: 'kofi.adjei@isusupro.com', branch: 'Makola Branch', status: 'active', joinedDate: '2024-06-30', avatarColor: 'bg-rose-500', performance: 84, pendingApprovals: 1 },
  { id: 'stm-006', name: 'Esi Nyarko', role: 'Accountant', phone: '026 501 7743', email: 'esi.nyarko@isusupro.com', branch: 'Head Office', status: 'active', joinedDate: '2022-02-18', avatarColor: 'bg-teal-500', performance: 97, pendingApprovals: 0 },
  { id: 'stm-007', name: 'Nii Ampofo', role: 'Compliance Officer', phone: '027 640 2258', email: 'nii.ampofo@isusupro.com', branch: 'Head Office', status: 'active', joinedDate: '2023-09-05', avatarColor: 'bg-indigo-500', performance: 91, pendingApprovals: 3 },
  { id: 'stm-008', name: 'Adjoa Mensimah', role: 'Teller', phone: '057 118 6634', email: 'adjoa.mensimah@isusupro.com', branch: 'Kaneshie Branch', status: 'suspended', joinedDate: '2024-04-12', avatarColor: 'bg-slate-500', performance: 61, pendingApprovals: 0 },
];

export const mockLoanApprovals: LoanApprovalRequest[] = [
  { id: 'apr-001', applicantName: 'Grace Tetteh', applicantId: 'usr-014', productName: 'Market Trader Loan', amount: 15000, tenorMonths: 6, interestRate: 4.5, officerRecommendation: 'approve', officerName: 'Kwabena Mensah', appraisalScore: 86, creditGrade: 'A', status: 'pending_bm', requestDate: '2026-10-24', purpose: 'Stock up second-hand clothing bales for Christmas season', monthlyDeduction: 2762 },
  { id: 'apr-002', applicantName: 'Ibrahim Musah', applicantId: 'usr-027', productName: 'Susu-Linked Loan', amount: 8000, tenorMonths: 4, interestRate: 3.8, officerRecommendation: 'approve', officerName: 'Abena Owusu', appraisalScore: 78, creditGrade: 'B', status: 'pending_bm', requestDate: '2026-10-24', purpose: 'Expand provisions shop at Tema Station', monthlyDeduction: 2057 },
  { id: 'apr-003', applicantName: 'Comfort Aidoo', applicantId: 'usr-031', productName: 'School Fees Loan', amount: 4500, tenorMonths: 10, interestRate: 3.5, officerRecommendation: 'review', officerName: 'Kwabena Mensah', appraisalScore: 64, creditGrade: 'C', status: 'pending_bm', requestDate: '2026-10-23', purpose: 'Children\'s second-term fees at Wesley Grammar', monthlyDeduction: 522 },
  { id: 'apr-004', applicantName: 'Samuel Ofori', applicantId: 'usr-042', productName: 'Emergency Loan', amount: 2000, tenorMonths: 3, interestRate: 5.0, officerRecommendation: 'approve', officerName: 'Abena Owusu', appraisalScore: 71, creditGrade: 'B', status: 'pending_bm', requestDate: '2026-10-23', purpose: 'Hospital bill at Korle Bu Teaching Hospital', monthlyDeduction: 707 },
  { id: 'apr-005', applicantName: 'Hawa Abdulai', applicantId: 'usr-038', productName: 'Market Trader Loan', amount: 25000, tenorMonths: 12, interestRate: 4.2, officerRecommendation: 'reject', officerName: 'Kwabena Mensah', appraisalScore: 42, creditGrade: 'E', status: 'pending_bm', requestDate: '2026-10-22', purpose: 'Cold store expansion at Agbogbloshie', monthlyDeduction: 2275 },
  { id: 'apr-006', applicantName: 'Yaw Darko', applicantId: 'usr-051', productName: 'Susu-Linked Loan', amount: 6000, tenorMonths: 6, interestRate: 3.8, officerRecommendation: 'approve', officerName: 'Abena Owusu', appraisalScore: 82, creditGrade: 'A', status: 'approved', requestDate: '2026-10-20', purpose: 'Purchase of tricycle (aboboyaa) for cartage business', monthlyDeduction: 1094 },
];

export const mockBranchTargets: BranchTarget[] = [
  { id: 'tgt-001', metric: 'New Susu Accounts Opened', period: 'October 2026', target: 150, achieved: 118, unit: 'count', owner: 'All Officers' },
  { id: 'tgt-002', metric: 'Daily Collections (MoMo + Cash)', period: 'October 2026', target: 320000, achieved: 286400, unit: 'currency', owner: 'Field Supervisor' },
  { id: 'tgt-003', metric: 'Loan Disbursement', period: 'October 2026', target: 450000, achieved: 341000, unit: 'currency', owner: 'Loan Officers' },
  { id: 'tgt-004', metric: 'Portfolio At Risk (PAR 30)', period: 'October 2026', target: 5, achieved: 3.8, unit: 'percent', owner: 'Branch Manager' },
  { id: 'tgt-005', metric: 'KYC Full Completion Rate', period: 'October 2026', target: 85, achieved: 72, unit: 'percent', owner: 'Agents' },
  { id: 'tgt-006', metric: 'Group Susu Formation', period: 'Q4 2026', target: 20, achieved: 9, unit: 'count', owner: 'Marketing' },
  { id: 'tgt-007', metric: 'Customer Retention Rate', period: 'Q4 2026', target: 90, achieved: 93, unit: 'percent', owner: 'Branch Manager' },
  { id: 'tgt-008', metric: 'Operating Cost Ratio', period: 'FY 2026', target: 45, achieved: 41, unit: 'percent', owner: 'Accountant' },
];

// ================= LOAN OFFICER =================
export const mockLoanApplications: LoanApplication[] = [
  { id: 'app-001', applicantName: 'Grace Tetteh', phone: '024 400 1290', productName: 'Market Trader Loan', amount: 15000, tenorMonths: 6, purpose: 'Christmas clothing stock', stage: 'recommended', submittedDate: '2026-10-24', branch: 'Makola Branch', dailyRate: 150 },
  { id: 'app-002', applicantName: 'Yaw Antwi', phone: '055 812 4432', productName: 'Susu-Linked Loan', amount: 5000, tenorMonths: 4, purpose: 'Barbering shop equipment', stage: 'field_visit', submittedDate: '2026-10-23', branch: 'Makola Branch', dailyRate: 50 },
  { id: 'app-003', applicantName: 'Fatima Yakubu', phone: '020 998 7756', productName: 'SME Boost Loan', amount: 30000, tenorMonths: 12, purpose: 'Tailoring workshop — 4 machines', stage: 'appraisal', submittedDate: '2026-10-22', branch: 'Makola Branch', dailyRate: 200 },
  { id: 'app-004', applicantName: 'Peter Quaye', phone: '024 116 3390', productName: 'Emergency Loan', amount: 1500, tenorMonths: 3, purpose: 'Family medical emergency', stage: 'new', submittedDate: '2026-10-25', branch: 'Makola Branch', dailyRate: 30 },
  { id: 'app-005', applicantName: 'Comfort Aidoo', phone: '057 662 1088', productName: 'School Fees Loan', amount: 4500, tenorMonths: 10, purpose: 'Wesley Grammar term 2 fees', stage: 'documents_pending', submittedDate: '2026-10-21', branch: 'Makola Branch', dailyRate: 40 },
  { id: 'app-006', applicantName: 'Kwesi Amoah', phone: '026 334 9912', productName: 'Market Trader Loan', amount: 10000, tenorMonths: 6, purpose: 'Provisions shop restock', stage: 'approved', submittedDate: '2026-10-18', branch: 'Makola Branch', dailyRate: 100 },
  { id: 'app-007', applicantName: 'Akosua Fremah', phone: '054 700 2245', productName: 'Susu-Linked Loan', amount: 3000, tenorMonths: 3, purpose: 'Chop box restocking at Madina Market', stage: 'rejected', submittedDate: '2026-10-15', branch: 'Makola Branch', dailyRate: 25 },
  { id: 'app-008', applicantName: 'Moses Tetteh', phone: '027 245 6671', productName: 'SME Boost Loan', amount: 20000, tenorMonths: 9, purpose: 'Poultry farm feed purchase — Ashaiman', stage: 'disbursed', submittedDate: '2026-10-05', branch: 'Makola Branch', dailyRate: 150 },
];

export const mockAppraisals: LoanAppraisal[] = [
  { id: 'vcg-001', applicationId: 'app-001', applicantName: 'Grace Tetteh', character: 5, capacity: 4, capital: 4, collateral: 4, conditions: 4, fieldVisitDate: '2026-10-23', businessLocation: 'Makola Market — Fabric Line C, Stall 22', notes: '12 years trading fabrics; daily susu savings consistent for 18 months (avg ₵150/day). Two registered guarantors (market queen + church elder). Stock valued at ₵28,000 during visit.', recommendation: 'approve', recommendedAmount: 15000, officerName: 'Kwabena Mensah' },
  { id: 'vcg-002', applicationId: 'app-002', applicantName: 'Yaw Antwi', character: 4, capacity: 3, capital: 3, collateral: 2, conditions: 4, fieldVisitDate: '2026-10-24', businessLocation: 'Kaneshie Market — Barbering row, Shop 7', notes: 'Rented shop with 1-year lease. Weekly turnover ₵1,800. No landed collateral but susu savings ₵3,200 pledged. Recommended amount capped.', recommendation: 'reduce_amount', recommendedAmount: 3500, officerName: 'Kwabena Mensah' },
  { id: 'vcg-003', applicationId: 'app-003', applicantName: 'Fatima Yakubu', character: 4, capacity: 5, capital: 4, collateral: 4, conditions: 4, fieldVisitDate: '2026-10-24', businessLocation: 'Nima — Tailoring workshop behind Mahmud Mosque', notes: 'Employed 3 apprentices. Confirmed orders from 2 schools for uniforms. Machines to purchase quoted from Societe Generale equipment supplier.', recommendation: 'approve', recommendedAmount: 30000, officerName: 'Abena Owusu' },
  { id: 'vcg-004', applicationId: 'app-005', applicantName: 'Comfort Aidoo', character: 3, capacity: 3, capital: 2, collateral: 1, conditions: 3, fieldVisitDate: '2026-10-25', businessLocation: 'Chorkor — Fish smoking business', notes: 'Seasonal income tied to fishing season. Husband a fisherman. Savings irregular (4 misses in 90 days). Pending: utility bill + school fee invoice.', recommendation: 'reduce_amount', recommendedAmount: 3000, officerName: 'Kwabena Mensah' },
];

export const mockPortfolio: PortfolioLoan[] = [
  { id: 'pl-001', customerName: 'Grace Tetteh', productName: 'Market Trader Loan', principal: 15000, outstanding: 9200, arrearsDays: 0, classification: 'current', lastPaymentDate: '2026-10-25', branch: 'Makola' },
  { id: 'pl-002', customerName: 'Yaw Antwi', productName: 'Susu-Linked Loan', principal: 5000, outstanding: 3100, arrearsDays: 0, classification: 'current', lastPaymentDate: '2026-10-25', branch: 'Makola' },
  { id: 'pl-003', customerName: 'Hawa Abdulai', productName: 'Market Trader Loan', principal: 25000, outstanding: 18400, arrearsDays: 47, classification: 'substandard', lastPaymentDate: '2026-09-08', branch: 'Makola' },
  { id: 'pl-004', customerName: 'Kwesi Amoah', productName: 'Market Trader Loan', principal: 10000, outstanding: 6100, arrearsDays: 12, classification: 'watch', lastPaymentDate: '2026-10-13', branch: 'Makola' },
  { id: 'pl-005', customerName: 'Comfort Aidoo', productName: 'School Fees Loan', principal: 4500, outstanding: 3800, arrearsDays: 68, classification: 'doubtful', lastPaymentDate: '2026-08-18', branch: 'Kaneshie' },
  { id: 'pl-006', customerName: 'Ibrahim Musah', productName: 'Susu-Linked Loan', principal: 8000, outstanding: 2400, arrearsDays: 0, classification: 'current', lastPaymentDate: '2026-10-24', branch: 'Makola' },
  { id: 'pl-007', customerName: 'Adjoa Kumi', productName: 'Emergency Loan', principal: 2000, outstanding: 1750, arrearsDays: 96, classification: 'loss', lastPaymentDate: '2026-07-21', branch: 'Kaneshie' },
  { id: 'pl-008', customerName: 'Moses Tetteh', productName: 'SME Boost Loan', principal: 20000, outstanding: 17600, arrearsDays: 5, classification: 'watch', lastPaymentDate: '2026-10-20', branch: 'Makola' },
  { id: 'pl-009', customerName: 'Akua Manu', productName: 'Susu-Linked Loan', principal: 4000, outstanding: 1200, arrearsDays: 0, classification: 'current', lastPaymentDate: '2026-10-25', branch: 'Makola' },
  { id: 'pl-010', customerName: 'Nana Yaa Boadi', productName: 'Market Trader Loan', principal: 12000, outstanding: 8800, arrearsDays: 31, classification: 'substandard', lastPaymentDate: '2026-09-24', branch: 'Kaneshie' },
];

// ================= TELLER =================
export const mockTellerDrawer: TellerDrawer = {
  tellerId: 'tlr-002',
  tellerName: 'Akua Sarpong',
  openingFloat: 8000,
  cashIn: 34650,
  cashOut: 21890,
  expectedBalance: 20760,
  countedBalance: 20760,
  variance: 0,
  currencyNotes: [
    { note: 200, count: 45 }, { note: 100, count: 62 }, { note: 50, count: 34 },
    { note: 20, count: 58 }, { note: 10, count: 42 }, { note: 5, count: 46 },
    { note: 2, count: 65 }, { note: 1, count: 90 },
  ],
  status: 'open',
  date: today,
};

export const mockCounterQueue: CounterTransaction[] = [
  { id: 'cqx-001', queueNo: 14, customerName: 'Grace Tetteh', customerPhone: '024 400 1290', type: 'susu_collection', amount: 150, channel: 'momo_mtn', status: 'waiting', time: '09:32', reference: '—' },
  { id: 'cqx-002', queueNo: 15, customerName: 'Yaw Antwi', customerPhone: '055 812 4432', type: 'loan_repayment', amount: 240, channel: 'cash', status: 'waiting', time: '09:34', reference: '—' },
  { id: 'cqx-003', queueNo: 16, customerName: 'Ibrahim Musah', customerPhone: '020 711 9902', type: 'deposit', amount: 1000, channel: 'momo_telecel', status: 'waiting', time: '09:35', reference: '—' },
  { id: 'cqx-004', queueNo: 17, customerName: 'Akua Manu', customerPhone: '026 559 8877', type: 'withdrawal', amount: 500, channel: 'cash', status: 'processing', time: '09:36', reference: '—' },
  { id: 'cqx-005', queueNo: 11, customerName: 'Nana Yaa Boadi', customerPhone: '057 880 1123', type: 'susu_collection', amount: 80, channel: 'cash', status: 'completed', time: '08:51', reference: 'TRX-88410' },
  { id: 'cqx-006', queueNo: 12, customerName: 'Peter Quaye', customerPhone: '024 116 3390', type: 'bill_payment', amount: 230, channel: 'momo_mtn', status: 'completed', time: '09:04', reference: 'TRX-88411' },
  { id: 'cqx-007', queueNo: 13, customerName: 'Fatima Yakubu', customerPhone: '020 998 7756', type: 'deposit', amount: 2000, channel: 'cheque', status: 'completed', time: '09:21', reference: 'CHQ-00931' },
];

export const mockVaultTransfers: VaultTransfer[] = [
  { id: 'vtx-001', direction: 'to_bank', amount: 45000, bank: 'GCB Bank — Makola', requestedBy: 'Akua Sarpong', approvedBy: 'Kwame Osei (BM)', status: 'completed', date: '2026-10-24', note: 'Daily banking — GCB cash deposit' },
  { id: 'vtx-002', direction: 'from_vault', amount: 10000, requestedBy: 'Akua Sarpong', approvedBy: 'Kwame Osei (BM)', status: 'completed', date: '2026-10-25', note: 'Morning float top-up' },
  { id: 'vtx-003', direction: 'to_vault', amount: 15000, requestedBy: 'Akua Sarpong', status: 'requested', date: '2026-10-25', note: 'Excess cash after morning rush' },
  { id: 'vtx-004', direction: 'to_bank', amount: 60000, bank: 'Ecobank Ghana — Kaneshie', requestedBy: 'Adjoa Mensimah', approvedBy: 'Kwame Osei (BM)', status: 'in_transit', date: '2026-10-25', note: 'Bullion van pickup 14:00' },
  { id: 'vtx-005', direction: 'from_bank', amount: 20000, bank: 'GCB Bank — Makola', requestedBy: 'Kwame Osei', status: 'approved', date: '2026-10-25', note: 'Teller chest replenishment' },
];

export const mockEODLines: EODReconciliationLine[] = [
  { id: 'eod-001', category: 'cash', systemTotal: 20760, countedTotal: 20760, variance: 0, txCount: 84 },
  { id: 'eod-002', category: 'momo_mtn', systemTotal: 41280, countedTotal: 41280, variance: 0, txCount: 156 },
  { id: 'eod-003', category: 'momo_telecel', systemTotal: 8940, countedTotal: 8940, variance: 0, txCount: 38 },
  { id: 'eod-004', category: 'momo_at', systemTotal: 3620, countedTotal: 3570, variance: -50, txCount: 19 },
  { id: 'eod-005', category: 'cheque', systemTotal: 12000, countedTotal: 12000, variance: 0, txCount: 4 },
  { id: 'eod-006', category: 'float', systemTotal: 8000, countedTotal: 8000, variance: 0, txCount: 0 },
];

// ================= FIELD SUPERVISOR =================
export const mockSupervisedAgents: SupervisedAgent[] = [
  { id: 'ag-001', name: 'Kofi Adjei', agentCode: 'AG-MAK-014', area: 'Makola Market', customers: 84, todayCollections: 9820, expectedToday: 11400, collectionRate: 86, status: 'in_field', lastSync: '09:41', floatBalance: 3240, pendingVerify: 6 },
  { id: 'ag-002', name: 'Ama Serwaa', agentCode: 'AG-MAK-022', area: 'Tema Station', customers: 67, todayCollections: 7480, expectedToday: 8200, collectionRate: 91, status: 'in_field', lastSync: '09:44', floatBalance: 1850, pendingVerify: 2 },
  { id: 'ag-003', name: 'Yaw Owusu', agentCode: 'AG-KAN-008', area: 'Kaneshie Market', customers: 72, todayCollections: 8640, expectedToday: 9800, collectionRate: 88, status: 'in_field', lastSync: '09:39', floatBalance: 4110, pendingVerify: 4 },
  { id: 'ag-004', name: 'Esi Blankson', agentCode: 'AG-MAD-031', area: 'Madina Market', customers: 58, todayCollections: 4210, expectedToday: 6900, collectionRate: 61, status: 'at_office', lastSync: '08:55', floatBalance: 920, pendingVerify: 11 },
  { id: 'ag-005', name: 'Nana Kwame Duah', agentCode: 'AG-ASH-017', area: 'Ashaiman Market', customers: 91, todayCollections: 11250, expectedToday: 12800, collectionRate: 88, status: 'in_field', lastSync: '09:45', floatBalance: 5600, pendingVerify: 3 },
  { id: 'ag-006', name: 'Adiza Mohammed', agentCode: 'AG-NIM-005', area: 'Nima', customers: 49, todayCollections: 3890, expectedToday: 4500, collectionRate: 86, status: 'offline', lastSync: '17:48', floatBalance: 240, pendingVerify: 8 },
];

export const mockRoutes: SupervisorRoute[] = [
  { id: 'rt-001', name: 'Makola Line A', area: 'Makola Market — fabrics & provisions', agentId: 'ag-001', agentName: 'Kofi Adjei', customers: 32, dailyTarget: 4800, collectedToday: 4120, status: 'in_progress', stops: [
    { customerName: 'Grace Tetteh', area: 'Fabric Line C', amount: 150, status: 'collected' },
    { customerName: 'Kwabena Frimpong', area: 'Provisions Row B', amount: 100, status: 'collected' },
    { customerName: 'Abigail Mensah', area: 'Fabric Line C', amount: 200, status: 'pending' },
    { customerName: 'Joe Lartey', area: 'Cold Store Alley', amount: 350, status: 'pending' },
  ] },
  { id: 'rt-002', name: 'Tema Station Line 2', area: 'Tema Station — spare parts', agentId: 'ag-002', agentName: 'Ama Serwaa', customers: 28, dailyTarget: 4200, collectedToday: 4200, status: 'completed', stops: [
    { customerName: 'Ibrahim Musah', area: 'Spare Parts Wing', amount: 250, status: 'collected' },
    { customerName: 'Yaw Darko', area: 'Aboboyaa Yard', amount: 180, status: 'collected' },
    { customerName: 'Kofi Baah', area: 'Spare Parts Wing', amount: 120, status: 'collected' },
  ] },
  { id: 'rt-003', name: 'Madina Line 1', area: 'Madina Market — foodstuffs', agentId: 'ag-004', agentName: 'Esi Blankson', customers: 25, dailyTarget: 3900, collectedToday: 1450, status: 'in_progress', stops: [
    { customerName: 'Akosua Fremah', area: 'Chop Box Row', amount: 60, status: 'collected' },
    { customerName: 'Hawa Sulemana', area: 'Yam Section', amount: 90, status: 'missed' },
    { customerName: 'Maame Efua', area: 'Chop Box Row', amount: 150, status: 'pending' },
  ] },
  { id: 'rt-004', name: 'Nima Residential', area: 'Nima — shops & kiosks', agentId: 'ag-006', agentName: 'Adiza Mohammed', customers: 22, dailyTarget: 2400, collectedToday: 0, status: 'assigned', stops: [
    { customerName: 'Fatima Yakubu', area: 'Mahmud Mosque Lane', amount: 200, status: 'pending' },
    { customerName: 'Salifu Abubakar', area: 'Kiosk Block D', amount: 80, status: 'pending' },
  ] },
  { id: 'rt-005', name: 'Ashaiman Market Loop', area: 'Ashaiman — general goods', agentId: 'ag-005', agentName: 'Nana Kwame Duah', customers: 35, dailyTarget: 5100, collectedToday: 4980, status: 'in_progress', stops: [
    { customerName: 'Moses Tetteh', area: 'Poultry Line', amount: 300, status: 'collected' },
    { customerName: 'Gbogbo Ebenezer', area: 'General Goods', amount: 150, status: 'collected' },
  ] },
];

export const mockSpotChecks: SpotCheck[] = [
  { id: 'sc-001', agentId: 'ag-002', agentName: 'Ama Serwaa', date: '2026-10-24', customersChecked: 8, receiptsIssued: 8, cashMatched: true, issuesFound: [], rating: 'excellent', notes: 'All receipts issued instantly; passbook entries match cash collected to the cedi.', verifiedBy: 'Yaw Boateng' },
  { id: 'sc-002', agentId: 'ag-004', agentName: 'Esi Blankson', date: '2026-10-23', customersChecked: 6, receiptsIssued: 4, cashMatched: false, issuesFound: ['2 customers collected without receipt', '₵120 unrecorded cash in apron pocket'], rating: 'needs_improvement', notes: 'Counselled on FIC receipt discipline. Re-check scheduled within 7 days.', verifiedBy: 'Yaw Boateng' },
  { id: 'sc-003', agentId: 'ag-001', agentName: 'Kofi Adjei', date: '2026-10-22', customersChecked: 10, receiptsIssued: 10, cashMatched: true, issuesFound: [], rating: 'excellent', notes: 'Excellent MoMo usage — all collections confirmed on the spot with SMS to customer.', verifiedBy: 'Yaw Boateng' },
  { id: 'sc-004', agentId: 'ag-006', agentName: 'Adiza Mohammed', date: '2026-10-21', customersChecked: 5, receiptsIssued: 5, cashMatched: true, issuesFound: ['Passbook updates lagged by 1 day'], rating: 'good', notes: 'Advised to update books at each stop using the offline app mode.', verifiedBy: 'Yaw Boateng' },
  { id: 'sc-005', agentId: 'ag-003', agentName: 'Yaw Owusu', date: '2026-10-20', customersChecked: 7, receiptsIssued: 6, cashMatched: true, issuesFound: ['1 duplicate receipt issued — voided correctly'], rating: 'good', notes: 'Minor receipt book handling issue; training refresher assigned.', verifiedBy: 'Yaw Boateng' },
];

// ================= ACCOUNTANT =================
export const mockLedgerEntries: LedgerEntry[] = [
  { id: 'le-001', date: '2026-10-25', reference: 'JV-1042', accountCode: '1010', accountName: 'Cash on Hand — Teller Chest', debit: 34650, credit: 0, narration: 'Daily susu collections banked to chest', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-002', date: '2026-10-25', reference: 'JV-1042', accountCode: '4010', accountName: 'Susu Collection Income', debit: 0, credit: 1200, narration: 'Commission on daily susu (1% fee)', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-003', date: '2026-10-25', reference: 'JV-1043', accountCode: '1020', accountName: 'MTN MoMo Float', debit: 41280, credit: 0, narration: 'MoMo collections — MTN merchant wallet', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-004', date: '2026-10-24', reference: 'JV-1041', accountCode: '4020', accountName: 'Loan Interest Income', debit: 0, credit: 18450, narration: 'Accrued interest — October cycle', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-005', date: '2026-10-24', reference: 'JV-1040', accountCode: '5010', accountName: 'Agent Commission Expense', debit: 8920, credit: 0, narration: 'Field agent commissions — week 42', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-006', date: '2026-10-23', reference: 'JV-1039', accountCode: '1030', accountName: 'GCB Bank — Operation Account', debit: 45000, credit: 0, narration: 'Cash deposit — daily banking', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-007', date: '2026-10-23', reference: 'JV-1038', accountCode: '5110', accountName: 'Loan Loss Provision', debit: 5400, credit: 0, narration: 'Provision top-up — doubtful & loss classes', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-008', date: '2026-10-22', reference: 'JV-1037', accountCode: '2010', accountName: 'Member Savings Deposits (Susu)', debit: 0, credit: 96500, narration: 'Susu deposits posted to members\' accounts', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-009', date: '2026-10-22', reference: 'JV-1036', accountCode: '5020', accountName: 'Staff Salaries', debit: 38200, credit: 0, narration: 'October payroll net of SSNIT & PAYE', postedBy: 'Esi Nyarko', status: 'posted' },
  { id: 'le-010', date: '2026-10-21', reference: 'JV-1035', accountCode: '1050', accountName: 'Fixed Assets — Equipment', debit: 0, credit: 2200, narration: 'Depreciation — laptops & fingerprint scanners (monthly)', postedBy: 'Esi Nyarko', status: 'reversed' },
];

export const mockChartOfAccounts: ChartOfAccount[] = [
  { code: '1010', name: 'Cash on Hand — Teller Chest', type: 'asset', balance: 52480, momChange: 12.4 },
  { code: '1020', name: 'MTN MoMo Float', type: 'asset', balance: 184200, momChange: 8.1 },
  { code: '1030', name: 'GCB Bank — Operation Account', type: 'asset', balance: 892000, momChange: 4.6 },
  { code: '1040', name: 'Loan Portfolio (Net)', type: 'asset', balance: 2410000, momChange: 6.8 },
  { code: '1050', name: 'Fixed Assets — Equipment', type: 'asset', balance: 96500, momChange: -2.2 },
  { code: '2010', name: 'Member Savings Deposits (Susu)', type: 'liability', balance: 1980000, momChange: 7.9 },
  { code: '2020', name: 'Suspected Fraud Hold', type: 'liability', balance: 3500, momChange: 0 },
  { code: '3010', name: 'Retained Earnings', type: 'equity', balance: 612000, momChange: 9.4 },
  { code: '4010', name: 'Susu Collection Income', type: 'income', balance: 148600, momChange: 14.2 },
  { code: '4020', name: 'Loan Interest Income', type: 'income', balance: 322400, momChange: 10.5 },
  { code: '5010', name: 'Agent Commission Expense', type: 'expense', balance: 68400, momChange: 11.8 },
  { code: '5020', name: 'Staff Salaries', type: 'expense', balance: 164200, momChange: 3.1 },
  { code: '5110', name: 'Loan Loss Provision', type: 'expense', balance: 48200, momChange: 24.6 },
];

export const mockStatements: FinancialStatement[] = [
  { id: 'fs-001', name: 'Statement of Financial Position', period: 'As at 30 September 2026', status: 'final', preparedBy: 'Esi Nyarko', totalAssets: 3635180, totalLiabilities: 1983500, totalEquity: 1651680 },
  { id: 'fs-002', name: 'Income Statement', period: 'January — September 2026', status: 'final', preparedBy: 'Esi Nyarko', revenue: 1423800, expenses: 985600, netIncome: 438200 },
  { id: 'fs-003', name: 'Trial Balance', period: 'October 2026 (mid-month)', status: 'draft', preparedBy: 'Esi Nyarko' },
  { id: 'fs-004', name: 'Cash Flow Statement', period: 'Q3 2026', status: 'submitted', preparedBy: 'Esi Nyarko' },
];

export const mockReconciliations: BankReconciliation[] = [
  { id: 'rc-001', source: 'GCB Bank — Operation Account', bookBalance: 892000, statementBalance: 888400, unmatchedItems: [
    { date: '2026-10-24', description: 'Unpresented cheque — ECG bill payment', amount: 2300, type: 'credit' },
    { date: '2026-10-24', description: 'Bank charges — October SMS alerts', amount: 1300, type: 'debit' },
  ], status: 'in_progress', period: 'October 2026' },
  { id: 'rc-002', source: 'MTN MoMo Float', bookBalance: 184200, statementBalance: 184200, unmatchedItems: [], status: 'reconciled', period: 'October 2026' },
  { id: 'rc-003', source: 'Telecel Cash Float', bookBalance: 42600, statementBalance: 42540, unmatchedItems: [
    { date: '2026-10-25', description: 'Failed reversal — customer withdrawal', amount: 60, type: 'debit' },
  ], status: 'variance', period: 'October 2026' },
  { id: 'rc-004', source: 'AT Money Float', bookBalance: 28800, statementBalance: 28850, unmatchedItems: [
    { date: '2026-10-25', description: 'Unposted credit — bulk payout refund', amount: 50, type: 'credit' },
  ], status: 'variance', period: 'October 2026' },
  { id: 'rc-005', source: 'Ecobank Ghana — Savings', bookBalance: 342000, statementBalance: 342000, unmatchedItems: [], status: 'reconciled', period: 'September 2026' },
];

// ================= COMPLIANCE OFFICER =================
export const mockAMLAlerts: AMLAlert[] = [
  { id: 'aml-001', rule: 'Structuring — multiple deposits below ₵5,000 threshold', severity: 'critical', customerName: 'Hawa Abdulai', customerId: 'usr-038', description: '9 MoMo deposits totalling ₵44,000 across 6 days, each just below the ₵5,000 reporting threshold. All from different senders in Ashaiman & Tema.', amount: 44000, triggeredDate: '2026-10-25', status: 'escalated', assignedTo: 'Nii Ampofo' },
  { id: 'aml-002', rule: 'Rapid movement — deposit & immediate withdrawal', severity: 'high', customerName: 'John Nyeko', customerId: 'usr-057', description: '₵18,000 deposited via Telecel Cash and withdrawn within 40 minutes at Kaneshie counter. No matching susu or loan activity.', amount: 18000, triggeredDate: '2026-10-24', status: 'investigating', assignedTo: 'Nii Ampofo' },
  { id: 'aml-003', rule: 'Dormant account reactivation with high value', severity: 'high', customerName: 'Kojo Poku', customerId: 'usr-061', description: 'Account dormant 14 months reactivated with ₵25,000 cash deposit at Madina agent, followed by 3 international-style transfers.', amount: 25000, triggeredDate: '2026-10-23', status: 'open' },
  { id: 'aml-004', rule: 'Geographic — collections from high-risk border zone', severity: 'medium', customerName: 'Adiza Fuseini', customerId: 'usr-049', description: 'Agent collections pattern shows unusual cash intensity at Aflao border route on market days.', amount: 12400, triggeredDate: '2026-10-22', status: 'investigating', assignedTo: 'Nii Ampofo' },
  { id: 'aml-005', rule: 'Velocity — 20+ transactions in 24 hours', severity: 'medium', customerName: 'Emmanuel Tetteh', customerId: 'usr-072', description: '22 wallet-to-wallet transfers totalling ₵9,800 in one day to 14 different recipients.', amount: 9800, triggeredDate: '2026-10-21', status: 'closed_false_positive', assignedTo: 'Nii Ampofo' },
  { id: 'aml-006', rule: 'Sanctions name screening partial match', severity: 'critical', customerName: 'Yaw Owusu Ansah', customerId: 'usr-068', description: 'Name matches 82% against updated UN consolidated list screening batch. Onboarding KYC on hold pending EDD.', amount: 0, triggeredDate: '2026-10-20', status: 'investigating', assignedTo: 'Nii Ampofo' },
];

export const mockSTRs: STRReport[] = [
  { id: 'str-001', alertId: 'aml-001', subjectName: 'Hawa Abdulai', suspiciousActivity: 'Structured deposits below threshold across 6 days — suspected layering for third party.', amountInvolved: 44000, filedWith: 'Financial Intelligence Centre (FIC)', filedDate: '2026-10-25', status: 'filed', reference: 'FIC/STR/2026/0912' },
  { id: 'str-002', alertId: 'aml-003', subjectName: 'Kojo Poku', suspiciousActivity: 'Dormant account reactivation with disproportionate cash deposit & rapid outbound transfers.', amountInvolved: 25000, filedWith: 'Financial Intelligence Centre (FIC)', filedDate: '2026-10-24', status: 'acknowledged', reference: 'FIC/STR/2026/0897' },
  { id: 'str-003', alertId: 'aml-006', subjectName: 'Yaw Owusu Ansah', suspiciousActivity: 'Partial sanctions list match — EDD incomplete, onboarding suspended.', amountInvolved: 0, filedWith: 'Bank of Ghana', filedDate: '2026-10-26', status: 'draft', reference: '—' },
  { id: 'str-004', alertId: 'aml-002', subjectName: 'John Nyeko', suspiciousActivity: 'Pass-through behaviour: instant withdrawal after MoMo deposit, no savings intent.', amountInvolved: 18000, filedWith: 'Financial Intelligence Centre (FIC)', filedDate: '2026-10-22', status: 'under_review', reference: 'FIC/STR/2026/0871' },
];

export const mockBOGReturns: BOGReturn[] = [
  { id: 'bog-001', return: 'NBFRI 3 (Capital Adequacy)', period: 'October 2026', dueDate: '2026-11-10', status: 'in_progress', completion: 65, preparedBy: 'Nii Ampofo', notes: 'Core capital ₵1.65m vs regulatory minimum ₵1.0m — CAR at 14.8%, comfortably above 13% floor.' },
  { id: 'bog-002', return: 'NBFRI 8 (Liquid Assets)', period: 'October 2026', dueDate: '2026-11-10', status: 'not_started', completion: 0, preparedBy: 'Nii Ampofo', notes: 'Awaiting month-end teller & float balances from Accountant.' },
  { id: 'bog-003', return: 'NBFRI 15 (Large Exposures)', period: 'October 2026', dueDate: '2026-11-05', status: 'in_progress', completion: 40, preparedBy: 'Nii Ampofo', notes: '2 exposures above 10% of capital under review (cold store operator, transport fleet).' },
  { id: 'bog-004', return: 'Monthly Susu Returns', period: 'September 2026', dueDate: '2026-10-15', status: 'submitted', completion: 100, preparedBy: 'Nii Ampofo', notes: 'Filed with 45 susu group schedules & float declarations.' },
  { id: 'bog-005', return: 'AML/CFT Return', period: 'Q3 2026', dueDate: '2026-10-20', status: 'late', completion: 100, preparedBy: 'Nii Ampofo', notes: 'Submitted 2 days late — system migration. Regulator notified; corrective action logged.' },
];

// ================= NOTIFICATIONS (staff portals) =================
// Shape must match Notification in types.ts: { id, title, message, type, date, read, category }

export const staffNotifications: Record<string, Notification[]> = {
  'branch-manager': [
    { id: 'nb-1', title: 'Loan approval needed', message: '3 loans above \u20b510,000 awaiting your approval (\u20b527,500 total).', type: 'warning', date: '2026-10-25T09:48:00', read: false, category: 'approvals' },
    { id: 'nb-2', title: 'October target at 91%', message: 'Daily collections \u20b5286,400 of \u20b5320,000 \u2014 9 days to close the gap.', type: 'info', date: '2026-10-25T08:30:00', read: false, category: 'targets' },
    { id: 'nb-3', title: 'Esi Blankson underperformance', message: 'Madina collection rate dropped to 61%. Spot check scheduled.', type: 'warning', date: '2026-10-25T06:45:00', read: false, category: 'staff' },
    { id: 'nb-4', title: 'Bullion van confirmed', message: 'Ecobank pickup at 14:00 today \u2014 \u20b560,000.', type: 'success', date: '2026-10-25T05:00:00', read: true, category: 'cash' },
  ],
  'loan-officer': [
    { id: 'nl-1', title: 'New application \u2014 Peter Quaye', message: 'Emergency loan \u20b51,500 submitted this morning. Assign field visit.', type: 'info', date: '2026-10-25T09:40:00', read: false, category: 'pipeline' },
    { id: 'nl-2', title: 'Appraisal due', message: 'Fatima Yakubu 5C appraisal awaiting your scoring.', type: 'warning', date: '2026-10-25T08:30:00', read: false, category: 'appraisals' },
    { id: 'nl-3', title: 'PAR alert', message: 'Comfort Aidoo now 68 days in arrears \u2014 doubtful class.', type: 'error', date: '2026-10-25T07:30:00', read: false, category: 'portfolio' },
  ],
  'teller': [
    { id: 'nt-1', title: 'Vault transfer approved', message: '\u20b510,000 morning float approved by BM. Collect from vault.', type: 'success', date: '2026-10-25T08:02:00', read: false, category: 'vault' },
    { id: 'nt-2', title: 'Queue at 4', message: 'Susu collections & 1 withdrawal waiting at your counter.', type: 'info', date: '2026-10-25T09:55:00', read: false, category: 'counter' },
    { id: 'nt-3', title: 'AT Money variance \u20b550', message: "Yesterday's EOD flagged \u20b550 shortfall on AT float. Investigate.", type: 'error', date: '2026-10-24T18:10:00', read: false, category: 'reconciliation' },
  ],
  'field-supervisor': [
    { id: 'nf-1', title: 'Esi Blankson offline', message: 'No sync since yesterday 17:48. 11 collections pending verification.', type: 'warning', date: '2026-10-25T09:44:00', read: false, category: 'agents' },
    { id: 'nf-2', title: 'Spot check today', message: 'Follow-up check on Esi Blankson (receipt discipline) due today.', type: 'info', date: '2026-10-25T08:30:00', read: false, category: 'spot-checks' },
    { id: 'nf-3', title: 'Nima route delayed', message: 'Adiza reports transport challenge \u2014 route start delayed.', type: 'warning', date: '2026-10-25T07:30:00', read: false, category: 'routes' },
  ],
  'accountant': [
    { id: 'na-1', title: 'Telecel float variance \u20b560', message: 'Failed reversal needs posting to 2020 Suspense.', type: 'warning', date: '2026-10-25T09:30:00', read: false, category: 'reconciliation' },
    { id: 'na-2', title: 'Trial balance draft ready', message: 'October mid-month TB ready for your review.', type: 'info', date: '2026-10-25T08:00:00', read: false, category: 'ledger' },
    { id: 'na-3', title: 'PAYE deadline', message: 'GRA PAYE for October staff salaries due by the 15th.', type: 'error', date: '2026-10-24T17:00:00', read: true, category: 'tax' },
  ],
  'compliance-officer': [
    { id: 'nc-1', title: 'Critical AML alert escalated', message: 'Hawa Abdulai structuring case \u2014 STR filed with FIC (ref 0912).', type: 'warning', date: '2026-10-25T08:45:00', read: false, category: 'aml' },
    { id: 'nc-2', title: 'Sanctions screening match 82%', message: 'Onboarding of Yaw Owusu Ansah remains on hold. EDD pending.', type: 'error', date: '2026-10-25T07:00:00', read: false, category: 'kyc' },
    { id: 'nc-3', title: 'NBFRI 3 due in 16 days', message: 'Capital adequacy return 65% complete.', type: 'info', date: '2026-10-24T16:30:00', read: false, category: 'bog' },
  ],
};
