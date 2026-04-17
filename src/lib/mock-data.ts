// ============================================
// SusuPay Ghana - Comprehensive Mock Data
// ============================================
import type {
  User, SusuGroup, SusuContribution, SusuPayout, SavingsGoal,
  Loan, LoanPayment, LoanProduct, Wallet, MobileMoneyProvider,
  Transaction, Agent, CollectionRoute, AgentCommission,
  SystemStats, Branch, ComplianceReport, Notification,
  ActivityLog, DepositRequest, WithdrawalRequest
} from './types';

// ---- Mobile Money Providers ----
export const mobileMoneyProviders: MobileMoneyProvider[] = [
  { id: 'mtn', name: 'MTN Mobile Money', shortName: 'MoMo', code: 'MTN', color: '#FFC107', bgColor: '#FFF8E1', icon: '📱', ussdCode: '*170#' },
  { id: 'vodafone', name: 'Vodafone Cash', shortName: 'VodaCash', code: 'VOD', color: '#E60000', bgColor: '#FFEBEE', icon: '📲', ussdCode: '*110#' },
  { id: 'airteltigo', name: 'AirtelTigo Money', shortName: 'AT Money', code: 'AT', color: '#005BAC', bgColor: '#E3F2FD', icon: '📲', ussdCode: '*500#' },
];

// ---- Users ----
export const users: User[] = [
  { id: 'usr-001', name: 'Ama Mensah', email: 'ama.mensah@gmail.com', phone: '0241234567', role: 'customer', kycLevel: 'full', memberSince: '2024-03-15', location: 'Accra, Greater Accra' },
  { id: 'usr-002', name: 'Kwame Asante', email: 'kwame.asante@yahoo.com', phone: '0209876543', role: 'customer', kycLevel: 'basic', memberSince: '2024-06-20', location: 'Kumasi, Ashanti' },
  { id: 'usr-003', name: 'Efua Darko', email: 'efua.darko@hotmail.com', phone: '0501112233', role: 'customer', kycLevel: 'full', memberSince: '2024-01-10', location: 'Takoradi, Western' },
  { id: 'usr-004', name: 'Kofi Boateng', email: 'kofi.boateng@gmail.com', phone: '0274455667', role: 'customer', kycLevel: 'none', memberSince: '2025-01-05', location: 'Tema, Greater Accra' },
  { id: 'usr-005', name: 'Adwoa Poku', email: 'adwoa.poku@gmail.com', phone: '0237788990', role: 'customer', kycLevel: 'full', memberSince: '2023-11-22', location: 'Cape Coast, Central' },
  { id: 'usr-006', name: 'Emmanuel Osei', email: 'emma.osei@gmail.com', phone: '0265566778', role: 'agent', agentCode: 'AGT-001', kycLevel: 'full', memberSince: '2023-08-15', location: 'Accra, Greater Accra', branch: 'Accra Central' },
  { id: 'usr-007', name: 'Grace Owusu', email: 'grace.owusu@gmail.com', phone: '0203344556', role: 'agent', agentCode: 'AGT-002', kycLevel: 'full', memberSince: '2024-02-01', location: 'Kumasi, Ashanti', branch: 'Kumasi Adum' },
  { id: 'usr-008', name: 'Patricia Ampah', email: 'pat.ampah@gmail.com', phone: '0246677889', role: 'treasurer', kycLevel: 'full', memberSince: '2023-06-10', location: 'Accra, Greater Accra', branch: 'Accra Central' },
  { id: 'usr-009', name: 'Daniel Tetteh', email: 'dan.tetteh@susupay.com', phone: '0278899001', role: 'admin', kycLevel: 'full', memberSince: '2023-01-01', location: 'Accra, Greater Accra', branch: 'Head Office' },
  { id: 'usr-010', name: 'Abena Frimpong', email: 'abena.frimpong@gmail.com', phone: '0502233445', role: 'customer', kycLevel: 'basic', memberSince: '2024-09-12', location: 'Sunyani, Bono' },
];

export const currentUser = users[0]; // Ama Mensah
export const currentAgent = users[5]; // Emmanuel Osei
export const currentTreasurer = users[7]; // Patricia Ampah
export const currentAdmin = users[8]; // Daniel Tetteh

// ---- Wallets ----
export const customerWallets: Wallet[] = [
  { id: 'wal-001', userId: 'usr-001', currency: 'GHS', balance: 4750.00, type: 'main', provider: 'MTN Mobile Money', accountNumber: '0241234567', isDefault: true, status: 'active' },
  { id: 'wal-002', userId: 'usr-001', currency: 'GHS', balance: 12800.00, type: 'savings', isDefault: false, status: 'active' },
  { id: 'wal-003', userId: 'usr-001', currency: 'GHS', balance: 3500.00, type: 'susu', isDefault: false, status: 'active' },
];

// ---- Susu Groups ----
export const susuGroups: SusuGroup[] = [
  { id: 'sug-001', name: 'Makola Market Women', description: 'Daily susu for traders at Makola Market', members: 20, maxMembers: 20, totalPool: 100000, contributionAmount: 500, frequency: 'daily', nextPayout: '2026-04-19', nextPayoutMember: 'Ama Mensah', status: 'active', currentRound: 12, totalRounds: 20, roundStartDate: '2026-04-07', treasurerId: 'usr-008', treasurerName: 'Patricia Ampah', branch: 'Accra Central' },
  { id: 'sug-002', name: 'Kaneshie Traders Union', description: 'Weekly contribution group for Kaneshie traders', members: 15, maxMembers: 20, totalPool: 45000, contributionAmount: 3000, frequency: 'weekly', nextPayout: '2026-04-25', nextPayoutMember: 'Kwame Asante', status: 'active', currentRound: 8, totalRounds: 15, roundStartDate: '2026-04-14', treasurerId: 'usr-008', treasurerName: 'Patricia Ampah', branch: 'Accra Central' },
  { id: 'sug-003', name: 'Kumasi Cloth Sellers', description: 'Monthly susu for textile merchants in Kumasi', members: 10, maxMembers: 15, totalPool: 50000, contributionAmount: 5000, frequency: 'monthly', nextPayout: '2026-05-01', nextPayoutMember: 'Efua Darko', status: 'active', currentRound: 5, totalRounds: 10, roundStartDate: '2026-04-01', treasurerId: 'usr-008', treasurerName: 'Patricia Ampah', branch: 'Kumasi Adum' },
  { id: 'sug-004', name: 'Tema Port Workers', description: 'Daily susu for workers at Tema Harbour', members: 25, maxMembers: 30, totalPool: 75000, contributionAmount: 300, frequency: 'daily', nextPayout: '2026-04-20', nextPayoutMember: 'Kofi Boateng', status: 'active', currentRound: 18, totalRounds: 25, roundStartDate: '2026-04-02', treasurerId: 'usr-008', treasurerName: 'Patricia Ampah', branch: 'Tema Community' },
  { id: 'sug-005', name: 'Cape Coast Fishmongers', description: 'Weekly susu for fish traders at Cape Coast', members: 12, maxMembers: 15, totalPool: 36000, contributionAmount: 3000, frequency: 'weekly', nextPayout: '2026-04-22', nextPayoutMember: 'Adwoa Poku', status: 'active', currentRound: 6, totalRounds: 12, roundStartDate: '2026-04-10', treasurerId: 'usr-008', treasurerName: 'Patricia Ampah', branch: 'Cape Coast' },
  { id: 'sug-006', name: 'Sunyani Teachers Group', description: 'Monthly contributions for teachers in Sunyani', members: 8, maxMembers: 10, totalPool: 16000, contributionAmount: 2000, frequency: 'monthly', nextPayout: '2026-05-05', nextPayoutMember: 'Abena Frimpong', status: 'active', currentRound: 3, totalRounds: 8, roundStartDate: '2026-04-05', treasurerId: 'usr-008', treasurerName: 'Patricia Ampah', branch: 'Sunyani' },
  { id: 'sug-007', name: 'Accra Digital Entrepreneurs', description: 'Monthly savings for tech entrepreneurs', members: 6, maxMembers: 15, totalPool: 12000, contributionAmount: 2000, frequency: 'monthly', nextPayout: '2026-05-10', nextPayoutMember: 'Ama Mensah', status: 'active', currentRound: 2, totalRounds: 6, roundStartDate: '2026-04-10', treasurerId: 'usr-008', treasurerName: 'Patricia Ampah', branch: 'Accra Central' },
];

// ---- Susu Contributions ----
export const susuContributions: SusuContribution[] = [
  { id: 'sc-001', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 500, date: '2026-04-18', status: 'paid', collectedBy: 'usr-006', collectedByName: 'Emmanuel Osei', round: 12 },
  { id: 'sc-002', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 500, date: '2026-04-17', status: 'paid', collectedBy: 'usr-006', collectedByName: 'Emmanuel Osei', round: 12 },
  { id: 'sc-003', groupId: 'sug-002', groupName: 'Kaneshie Traders Union', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 3000, date: '2026-04-14', status: 'paid', collectedBy: 'usr-006', collectedByName: 'Emmanuel Osei', round: 8 },
  { id: 'sc-004', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 500, date: '2026-04-16', status: 'paid', collectedBy: 'usr-006', collectedByName: 'Emmanuel Osei', round: 12 },
  { id: 'sc-005', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 500, date: '2026-04-15', status: 'paid', collectedBy: 'usr-006', collectedByName: 'Emmanuel Osei', round: 12 },
  { id: 'sc-006', groupId: 'sug-007', groupName: 'Accra Digital Entrepreneurs', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 2000, date: '2026-04-10', status: 'paid', round: 2 },
  { id: 'sc-007', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-002', memberName: 'Kwame Asante', amount: 500, date: '2026-04-18', status: 'pending', round: 12 },
  { id: 'sc-008', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-003', memberName: 'Efua Darko', amount: 500, date: '2026-04-18', status: 'paid', collectedBy: 'usr-006', collectedByName: 'Emmanuel Osei', round: 12 },
  { id: 'sc-009', groupId: 'sug-002', groupName: 'Kaneshie Traders Union', memberId: 'usr-002', memberName: 'Kwame Asante', amount: 3000, date: '2026-04-14', status: 'overdue', round: 8 },
  { id: 'sc-010', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-004', memberName: 'Kofi Boateng', amount: 500, date: '2026-04-18', status: 'pending', round: 12 },
  { id: 'sc-011', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-005', memberName: 'Adwoa Poku', amount: 500, date: '2026-04-18', status: 'paid', collectedBy: 'usr-006', collectedByName: 'Emmanuel Osei', round: 12 },
  { id: 'sc-012', groupId: 'sug-004', groupName: 'Tema Port Workers', memberId: 'usr-004', memberName: 'Kofi Boateng', amount: 300, date: '2026-04-18', status: 'paid', collectedBy: 'usr-007', collectedByName: 'Grace Owusu', round: 18 },
];

// ---- Susu Payouts ----
export const susuPayouts: SusuPayout[] = [
  { id: 'sp-001', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 10000, payoutDate: '2026-04-19', round: 12, status: 'pending', disbursementMethod: 'momo', momoNumber: '0241234567' },
  { id: 'sp-002', groupId: 'sug-001', groupName: 'Makola Market Women', memberId: 'usr-003', memberName: 'Efua Darko', amount: 10000, payoutDate: '2026-04-10', round: 11, status: 'completed', disbursementMethod: 'momo', momoNumber: '0501112233' },
  { id: 'sp-003', groupId: 'sug-002', groupName: 'Kaneshie Traders Union', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 30000, payoutDate: '2026-03-28', round: 7, status: 'completed', disbursementMethod: 'momo', momoNumber: '0241234567' },
];

// ---- Savings Goals ----
export const savingsGoals: SavingsGoal[] = [
  { id: 'sg-001', name: 'Shop Rent Fund', description: 'Save 6 months shop rent at Makola Market', targetAmount: 18000, currentAmount: 12500, deadline: '2026-09-30', icon: '🏪', autoContribute: true, contributionAmount: 1000, contributionFrequency: 'monthly' },
  { id: 'sg-002', name: 'Children School Fees', description: 'Save for next term school fees for 3 children', targetAmount: 8500, currentAmount: 6200, deadline: '2026-07-15', icon: '📚', autoContribute: true, contributionAmount: 500, contributionFrequency: 'weekly' },
  { id: 'sg-003', name: 'Emergency Fund', description: 'Build emergency savings for unexpected expenses', targetAmount: 10000, currentAmount: 4500, deadline: '2026-12-31', icon: '🛡️', autoContribute: true, contributionAmount: 200, contributionFrequency: 'daily' },
  { id: 'sg-004', name: 'New Delivery Van', description: 'Save towards purchasing a delivery van for business', targetAmount: 80000, currentAmount: 22000, deadline: '2027-06-30', icon: '🚗', autoContribute: true, contributionAmount: 5000, contributionFrequency: 'monthly' },
];

// ---- Loan Products ----
export const loanProducts: LoanProduct[] = [
  { id: 'lp-001', name: 'Quick Susu Loan', description: 'Fast loans backed by your susu savings history', minAmount: 500, maxAmount: 5000, interestRate: 5, minTerm: 1, maxTerm: 6, termUnit: 'months', requirements: ['Active susu for 3+ months', 'Valid Ghana Card', 'At least 5 contributions'], isActive: true },
  { id: 'lp-002', name: 'Business Expansion', description: 'Capital for growing your business', minAmount: 2000, maxAmount: 50000, interestRate: 8, minTerm: 3, maxTerm: 24, termUnit: 'months', requirements: ['6 months business history', 'Full KYC verification', 'Business registration documents', 'Bank or MoMo statements'], isActive: true },
  { id: 'lp-003', name: 'Education Loan', description: 'Support your children education expenses', minAmount: 1000, maxAmount: 20000, interestRate: 6, minTerm: 3, maxTerm: 12, termUnit: 'months', requirements: ['Valid Ghana Card', 'Admission letter', 'Full KYC verification'], isActive: true },
  { id: 'lp-004', name: 'Emergency Loan', description: 'For unexpected urgent financial needs', minAmount: 200, maxAmount: 3000, interestRate: 10, minTerm: 1, maxTerm: 3, termUnit: 'months', requirements: ['Active member for 6+ months', 'Valid Ghana Card', 'Basic KYC'], isActive: true },
  { id: 'lp-005', name: 'Market Stall Loan', description: 'Finance your market stall setup or renovation', minAmount: 3000, maxAmount: 30000, interestRate: 7, minTerm: 6, maxTerm: 18, termUnit: 'months', requirements: ['Active susu member', 'Market stall proof', 'Full KYC', 'Guarantor'], isActive: true },
];

// ---- Loans ----
export const loans: Loan[] = [
  { id: 'ln-001', applicantId: 'usr-001', applicantName: 'Ama Mensah', applicantPhone: '0241234567', type: 'business', amount: 15000, interestRate: 8, term: 12, termUnit: 'months', status: 'active', monthlyPayment: 1350, remainingBalance: 10125, totalPaid: 5400, nextPaymentDate: '2026-05-01', startDate: '2025-05-01', endDate: '2026-05-01', disbursementMethod: 'momo', disbursementProvider: 'MTN Mobile Money', disbursementNumber: '0241234567', purpose: 'Expand provision store inventory', guarantorName: 'Kwabena Mensah', guarantorPhone: '0245551234', collateral: 'Susu savings', creditScore: 78, branch: 'Accra Central' },
  { id: 'ln-002', applicantId: 'usr-001', applicantName: 'Ama Mensah', applicantPhone: '0241234567', type: 'education', amount: 5000, interestRate: 6, term: 6, termUnit: 'months', status: 'repaid', monthlyPayment: 860, remainingBalance: 0, totalPaid: 5160, nextPaymentDate: '', startDate: '2025-06-01', endDate: '2025-12-01', disbursementMethod: 'momo', disbursementProvider: 'Vodafone Cash', disbursementNumber: '0241234567', purpose: 'Children school fees payment', guarantorName: 'Efua Darko', guarantorPhone: '0501112233', creditScore: 78, branch: 'Accra Central' },
  { id: 'ln-003', applicantId: 'usr-002', applicantName: 'Kwame Asante', applicantPhone: '0209876543', type: 'susu-backed', amount: 3000, interestRate: 5, term: 3, termUnit: 'months', status: 'pending', monthlyPayment: 1025, remainingBalance: 3000, totalPaid: 0, nextPaymentDate: '', startDate: '', endDate: '', disbursementMethod: 'momo', purpose: 'Restock clothing inventory', creditScore: 65, branch: 'Kumasi Adum' },
  { id: 'ln-004', applicantId: 'usr-003', applicantName: 'Efua Darko', applicantPhone: '0501112233', type: 'business', amount: 25000, interestRate: 8, term: 18, termUnit: 'months', status: 'active', monthlyPayment: 1500, remainingBalance: 18750, totalPaid: 9000, nextPaymentDate: '2026-05-05', startDate: '2025-11-05', endDate: '2027-05-05', disbursementMethod: 'momo', disbursementProvider: 'MTN Mobile Money', disbursementNumber: '0501112233', purpose: 'Open second restaurant location', guarantorName: 'Kwame Darko', guarantorPhone: '0249998877', collateral: 'Property deed', creditScore: 82, branch: 'Takoradi' },
  { id: 'ln-005', applicantId: 'usr-004', applicantName: 'Kofi Boateng', applicantPhone: '0274455667', type: 'emergency', amount: 1500, interestRate: 10, term: 2, termUnit: 'months', status: 'pending', monthlyPayment: 790, remainingBalance: 1500, totalPaid: 0, nextPaymentDate: '', startDate: '', endDate: '', disbursementMethod: 'momo', purpose: 'Medical emergency', creditScore: 55, branch: 'Tema Community' },
  { id: 'ln-006', applicantId: 'usr-005', applicantName: 'Adwoa Poku', applicantPhone: '0237788990', type: 'personal', amount: 8000, interestRate: 7, term: 9, termUnit: 'months', status: 'active', monthlyPayment: 945, remainingBalance: 5600, totalPaid: 2835, nextPaymentDate: '2026-04-25', startDate: '2025-09-25', endDate: '2026-06-25', disbursementMethod: 'bank', purpose: 'Home renovation', guarantorName: 'Joseph Poku', guarantorPhone: '0201234567', creditScore: 71, branch: 'Cape Coast' },
  { id: 'ln-007', applicantId: 'usr-010', applicantName: 'Abena Frimpong', applicantPhone: '0502233445', type: 'education', amount: 12000, interestRate: 6, term: 12, termUnit: 'months', status: 'under_review', monthlyPayment: 1040, remainingBalance: 12000, totalPaid: 0, nextPaymentDate: '', startDate: '', endDate: '', disbursementMethod: 'momo', purpose: 'University tuition fees', creditScore: 60, branch: 'Sunyani', reviewedBy: 'Daniel Tetteh', reviewDate: '2026-04-17' },
  { id: 'ln-008', applicantId: 'usr-001', applicantName: 'Ama Mensah', applicantPhone: '0241234567', type: 'susu-backed', amount: 2000, interestRate: 5, term: 3, termUnit: 'months', status: 'rejected', monthlyPayment: 680, remainingBalance: 0, totalPaid: 0, nextPaymentDate: '', startDate: '', endDate: '', disbursementMethod: 'momo', purpose: 'Quick stock purchase', creditScore: 78, branch: 'Accra Central', reviewedBy: 'Daniel Tetteh', reviewDate: '2026-03-20', rejectReason: 'Duplicate active loan application' },
];

// ---- Loan Payments ----
export const loanPayments: LoanPayment[] = [
  { id: 'lp-001', loanId: 'ln-001', amount: 1350, date: '2026-04-01', status: 'completed', method: 'momo', principal: 1125, interest: 225 },
  { id: 'lp-002', loanId: 'ln-001', amount: 1350, date: '2026-03-01', status: 'completed', method: 'momo', principal: 1125, interest: 225 },
  { id: 'lp-003', loanId: 'ln-001', amount: 1350, date: '2026-02-01', status: 'completed', method: 'momo', principal: 1125, interest: 225 },
  { id: 'lp-004', loanId: 'ln-001', amount: 1350, date: '2026-01-01', status: 'completed', method: 'agent', principal: 1125, interest: 225 },
  { id: 'lp-005', loanId: 'ln-004', amount: 1500, date: '2026-04-05', status: 'completed', method: 'momo', principal: 1250, interest: 250 },
  { id: 'lp-006', loanId: 'ln-006', amount: 945, date: '2026-04-25', status: 'pending', method: 'momo', principal: 800, interest: 145 },
];

// ---- Transactions ----
export const transactions: Transaction[] = [
  { id: 'txn-001', userId: 'usr-001', type: 'susu_contribution', amount: 500, currency: 'GHS', status: 'completed', date: '2026-04-18T09:30:00', description: 'Daily contribution - Makola Market Women', reference: 'SP-M001-A1B2C3', category: 'Susu', balanceAfter: 4750 },
  { id: 'txn-002', userId: 'usr-001', type: 'loan_repayment', amount: 1350, currency: 'GHS', status: 'completed', date: '2026-04-17T14:20:00', description: 'Monthly loan repayment - Business Loan', reference: 'SP-L001-D4E5F6', category: 'Loan', balanceAfter: 5250 },
  { id: 'txn-003', userId: 'usr-001', type: 'deposit', amount: 2000, currency: 'GHS', status: 'completed', date: '2026-04-16T11:00:00', description: 'Deposit via MTN MoMo', reference: 'SP-D001-G7H8I9', category: 'Wallet', balanceAfter: 6600, counterpartName: 'MTN MoMo' },
  { id: 'txn-004', userId: 'usr-001', type: 'susu_payout', amount: 10000, currency: 'GHS', status: 'completed', date: '2026-04-15T16:45:00', description: 'Susu payout received - Round 11', reference: 'SP-P001-J1K2L3', category: 'Susu', balanceAfter: 4600 },
  { id: 'txn-005', userId: 'usr-001', type: 'susu_contribution', amount: 500, currency: 'GHS', status: 'completed', date: '2026-04-15T09:15:00', description: 'Daily contribution - Makola Market Women', reference: 'SP-M002-M4N5O6', category: 'Susu', balanceAfter: -5400 },
  { id: 'txn-006', userId: 'usr-001', type: 'susu_contribution', amount: 500, currency: 'GHS', status: 'completed', date: '2026-04-14T09:30:00', description: 'Daily contribution - Makola Market Women', reference: 'SP-M003-P7Q8R9', category: 'Susu', balanceAfter: 5900 },
  { id: 'txn-007', userId: 'usr-001', type: 'susu_contribution', amount: 3000, currency: 'GHS', status: 'completed', date: '2026-04-14T10:00:00', description: 'Weekly contribution - Kaneshie Traders Union', reference: 'SP-M004-S1T2U3', category: 'Susu', balanceAfter: 2900 },
  { id: 'txn-008', userId: 'usr-001', type: 'withdrawal', amount: 500, currency: 'GHS', status: 'completed', date: '2026-04-13T15:30:00', description: 'Withdrawal to Vodafone Cash', reference: 'SP-W001-V4W5X6', category: 'Wallet', balanceAfter: 5900, counterpartName: 'Vodafone Cash' },
  { id: 'txn-009', userId: 'usr-001', type: 'deposit', amount: 1000, currency: 'GHS', status: 'completed', date: '2026-04-12T08:45:00', description: 'Deposit via AirtelTigo Money', reference: 'SP-D002-Y7Z8A9', category: 'Wallet', balanceAfter: 6400, counterpartName: 'AirtelTigo Money' },
  { id: 'txn-010', userId: 'usr-001', type: 'susu_contribution', amount: 500, currency: 'GHS', status: 'completed', date: '2026-04-12T09:20:00', description: 'Daily contribution - Makola Market Women', reference: 'SP-M005-B1C2D3', category: 'Susu', balanceAfter: 5400 },
  { id: 'txn-011', userId: 'usr-001', type: 'loan_repayment', amount: 1350, currency: 'GHS', status: 'completed', date: '2026-04-01T14:00:00', description: 'Monthly loan repayment - Business Loan', reference: 'SP-L002-E4F5G6', category: 'Loan', balanceAfter: 5900 },
  { id: 'txn-012', userId: 'usr-001', type: 'fee', amount: 5, currency: 'GHS', status: 'completed', date: '2026-04-01T14:00:00', description: 'Transaction fee - Loan repayment', reference: 'SP-F001-H7I8J9', category: 'Fees', balanceAfter: 7250 },
  { id: 'txn-013', userId: 'usr-001', type: 'deposit', amount: 3000, currency: 'GHS', status: 'pending', date: '2026-04-18T16:00:00', description: 'Deposit via MTN MoMo', reference: 'SP-D003-K1L2M3', category: 'Wallet', balanceAfter: 7750, counterpartName: 'MTN MoMo' },
  { id: 'txn-014', userId: 'usr-001', type: 'susu_contribution', amount: 500, currency: 'GHS', status: 'pending', date: '2026-04-18T09:30:00', description: 'Daily contribution - Makola Market Women', reference: 'SP-M006-N4O5P6', category: 'Susu', balanceAfter: 7250 },
  { id: 'txn-015', userId: 'usr-001', type: 'transfer', amount: 500, currency: 'GHS', status: 'completed', date: '2026-04-10T12:00:00', description: 'Transfer to Efua Darko', reference: 'SP-T001-Q7R8S9', category: 'Transfer', balanceAfter: 6750, counterpartName: 'Efua Darko' },
];

// ---- Agents ----
export const agents: Agent[] = [
  { id: 'usr-006', name: 'Emmanuel Osei', phone: '0265566778', email: 'emma.osei@gmail.com', code: 'AGT-001', branch: 'Accra Central', territory: 'Makola, Kaneshie, Accra CBD', status: 'active', totalCollections: 125000, totalCustomers: 45, totalCommissions: 6250, rating: 4.8, joinedDate: '2023-08-15', lastActive: '2026-04-18' },
  { id: 'usr-007', name: 'Grace Owusu', phone: '0203344556', email: 'grace.owusu@gmail.com', code: 'AGT-002', branch: 'Kumasi Adum', territory: 'Kumasi Central, Kejetia, Adum', status: 'active', totalCollections: 98000, totalCustomers: 38, totalCommissions: 4900, rating: 4.6, joinedDate: '2024-02-01', lastActive: '2026-04-18' },
  { id: 'agt-003', name: 'Samuel Addo', phone: '0248899002', email: 'sam.addo@gmail.com', code: 'AGT-003', branch: 'Tema Community', territory: 'Tema Harbour, Community 1-12', status: 'active', totalCollections: 87000, totalCustomers: 32, totalCommissions: 4350, rating: 4.5, joinedDate: '2024-04-10', lastActive: '2026-04-17' },
  { id: 'agt-004', name: 'Rebecca Nketia', phone: '0504455668', email: 'becky.nketia@gmail.com', code: 'AGT-004', branch: 'Cape Coast', territory: 'Cape Coast, Elmina, Winneba', status: 'active', totalCollections: 65000, totalCustomers: 25, totalCommissions: 3250, rating: 4.9, joinedDate: '2024-01-20', lastActive: '2026-04-18' },
  { id: 'agt-005', name: 'Joseph Amponsah', phone: '0271122334', email: 'joe.amponsah@gmail.com', code: 'AGT-005', branch: 'Takoradi', territory: 'Takoradi, Sekondi, Effia-Kwesimintsim', status: 'inactive', totalCollections: 34000, totalCustomers: 18, totalCommissions: 1700, rating: 3.8, joinedDate: '2024-07-15', lastActive: '2026-02-28' },
  { id: 'agt-006', name: 'Felicia Opare', phone: '0233344557', email: 'felicia.opare@gmail.com', code: 'AGT-006', branch: 'Sunyani', territory: 'Sunyani, Techiman, Berekum', status: 'active', totalCollections: 52000, totalCustomers: 22, totalCommissions: 2600, rating: 4.4, joinedDate: '2024-06-01', lastActive: '2026-04-18' },
];

// ---- Collection Routes ----
export const collectionRoutes: CollectionRoute[] = [
  {
    id: 'cr-001', name: 'Makola Market Morning Run', area: 'Makola, Accra', customerCount: 5, totalExpected: 2500, totalCollected: 2000, date: '2026-04-18', status: 'in_progress',
    customers: [
      { id: 'cc-001', customerId: 'usr-001', customerName: 'Ama Mensah', customerPhone: '0241234567', susuGroupId: 'sug-001', susuGroupName: 'Makola Market Women', expectedAmount: 500, collectedAmount: 500, status: 'collected' },
      { id: 'cc-002', customerId: 'usr-003', customerName: 'Efua Darko', customerPhone: '0501112233', susuGroupId: 'sug-001', susuGroupName: 'Makola Market Women', expectedAmount: 500, collectedAmount: 500, status: 'collected' },
      { id: 'cc-003', customerId: 'usr-005', customerName: 'Adwoa Poku', customerPhone: '0237788990', susuGroupId: 'sug-001', susuGroupName: 'Makola Market Women', expectedAmount: 500, collectedAmount: 500, status: 'collected' },
      { id: 'cc-004', customerId: 'usr-002', customerName: 'Kwame Asante', customerPhone: '0209876543', susuGroupId: 'sug-001', susuGroupName: 'Makola Market Women', expectedAmount: 500, collectedAmount: 0, status: 'absent', notes: 'Customer not at stall' },
      { id: 'cc-005', customerId: 'usr-004', customerName: 'Kofi Boateng', customerPhone: '0274455667', susuGroupId: 'sug-001', susuGroupName: 'Makola Market Women', expectedAmount: 500, collectedAmount: 0, status: 'pending' },
    ]
  },
  {
    id: 'cr-002', name: 'Kaneshie Weekly Collection', area: 'Kaneshie, Accra', customerCount: 3, totalExpected: 9000, totalCollected: 3000, date: '2026-04-14', status: 'completed',
    customers: [
      { id: 'cc-006', customerId: 'usr-001', customerName: 'Ama Mensah', customerPhone: '0241234567', susuGroupId: 'sug-002', susuGroupName: 'Kaneshie Traders Union', expectedAmount: 3000, collectedAmount: 3000, status: 'collected' },
      { id: 'cc-007', customerId: 'usr-002', customerName: 'Kwame Asante', customerPhone: '0209876543', susuGroupId: 'sug-002', susuGroupName: 'Kaneshie Traders Union', expectedAmount: 3000, collectedAmount: 0, status: 'absent', notes: 'Will pay tomorrow' },
      { id: 'cc-008', customerId: 'usr-005', customerName: 'Adwoa Poku', customerPhone: '0237788990', susuGroupId: 'sug-002', susuGroupName: 'Kaneshie Traders Union', expectedAmount: 3000, collectedAmount: 0, status: 'absent', notes: 'Traveling' },
    ]
  },
  {
    id: 'cr-003', name: 'Tema Harbour Daily', area: 'Tema, Greater Accra', customerCount: 4, totalExpected: 1200, totalCollected: 900, date: '2026-04-18', status: 'partial',
    customers: [
      { id: 'cc-009', customerId: 'usr-004', customerName: 'Kofi Boateng', customerPhone: '0274455667', susuGroupId: 'sug-004', susuGroupName: 'Tema Port Workers', expectedAmount: 300, collectedAmount: 300, status: 'collected' },
      { id: 'cc-010', customerId: 'cust-t1', customerName: 'Yaw Adjei', customerPhone: '0245566778', susuGroupId: 'sug-004', susuGroupName: 'Tema Port Workers', expectedAmount: 300, collectedAmount: 300, status: 'collected' },
      { id: 'cc-011', customerId: 'cust-t2', customerName: 'Akosua Mensah', customerPhone: '0206677889', susuGroupId: 'sug-004', susuGroupName: 'Tema Port Workers', expectedAmount: 300, collectedAmount: 300, status: 'collected' },
      { id: 'cc-012', customerId: 'cust-t3', customerName: 'Kojo Annan', customerPhone: '0277788990', susuGroupId: 'sug-004', susuGroupName: 'Tema Port Workers', expectedAmount: 300, collectedAmount: 0, status: 'pending' },
    ]
  },
];

// ---- Agent Commissions ----
export const agentCommissions: AgentCommission[] = [
  { id: 'ac-001', agentId: 'usr-006', agentName: 'Emmanuel Osei', amount: 50, type: 'susu_collection', description: 'Collection commission - Makola Market (10 customers)', date: '2026-04-18', status: 'pending' },
  { id: 'ac-002', agentId: 'usr-006', agentName: 'Emmanuel Osei', amount: 100, type: 'new_customer', description: 'New customer signup bonus - Efua Boateng', date: '2026-04-15', status: 'paid', paidDate: '2026-04-16' },
  { id: 'ac-003', agentId: 'usr-006', agentName: 'Emmanuel Osei', amount: 200, type: 'milestone_bonus', description: 'Milestone bonus - 45 customers reached', date: '2026-04-10', status: 'paid', paidDate: '2026-04-11' },
  { id: 'ac-004', agentId: 'usr-006', agentName: 'Emmanuel Osei', amount: 75, type: 'susu_collection', description: 'Collection commission - Kaneshie Weekly', date: '2026-04-14', status: 'paid', paidDate: '2026-04-15' },
  { id: 'ac-005', agentId: 'usr-007', agentName: 'Grace Owusu', amount: 60, type: 'susu_collection', description: 'Collection commission - Tema Harbour', date: '2026-04-18', status: 'pending' },
  { id: 'ac-006', agentId: 'usr-007', agentName: 'Grace Owusu', amount: 150, type: 'loan_referral', description: 'Loan referral commission - Kwame Asante', date: '2026-04-12', status: 'paid', paidDate: '2026-04-13' },
  { id: 'ac-007', agentId: 'usr-006', agentName: 'Emmanuel Osei', amount: 50, type: 'susu_collection', description: 'Collection commission - Makola Market', date: '2026-04-17', status: 'paid', paidDate: '2026-04-18' },
];

// ---- System Stats ----
export const systemStats: SystemStats = {
  totalUsers: 2847,
  activeUsers: 2156,
  totalDeposits: 4250000,
  totalLoansDisbursed: 1850000,
  totalSusuPool: 3200000,
  totalAgents: 24,
  activeAgents: 20,
  totalSusuGroups: 89,
  pendingLoans: 34,
  defaultRate: 2.3,
  monthlyRevenue: 385000,
  monthlyGrowth: 12.5,
};

// ---- Branches ----
export const branches: Branch[] = [
  { id: 'br-001', name: 'Accra Central', location: '31 Makola Road, Accra', region: 'Greater Accra', manager: 'Daniel Tetteh', totalCustomers: 856, totalAgents: 6, totalSusuGroups: 28, status: 'active' },
  { id: 'br-002', name: 'Kumasi Adum', location: '45 Adum Road, Kumasi', region: 'Ashanti', manager: 'Akosua Sarpong', totalCustomers: 624, totalAgents: 5, totalSusuGroups: 22, status: 'active' },
  { id: 'br-003', name: 'Tema Community', location: '12 Community 2, Tema', region: 'Greater Accra', manager: 'Kwame Tetteh', totalCustomers: 412, totalAgents: 4, totalSusuGroups: 15, status: 'active' },
  { id: 'br-004', name: 'Takoradi', location: '8 Market Circle, Takoradi', region: 'Western', manager: 'Abigail Grant', totalCustomers: 298, totalAgents: 3, totalSusuGroups: 10, status: 'active' },
  { id: 'br-005', name: 'Cape Coast', location: '22 Kotokuraba Road, Cape Coast', region: 'Central', manager: 'Ernestina Afful', totalCustomers: 245, totalAgents: 3, totalSusuGroups: 8, status: 'active' },
  { id: 'br-006', name: 'Sunyani', location: '15 Berlin Road, Sunyani', region: 'Bono', manager: 'Thomas Yeboah', totalCustomers: 178, totalAgents: 2, totalSusuGroups: 6, status: 'active' },
  { id: 'br-007', name: 'Tamale', location: '30 Hospital Road, Tamale', region: 'Northern', manager: 'Mariama Iddrisu', totalCustomers: 134, totalAgents: 1, totalSusuGroups: 0, status: 'active' },
];

// ---- Compliance Reports ----
export const complianceReports: ComplianceReport[] = [
  { id: 'cp-001', type: 'kyc', title: 'Incomplete KYC - Batch 47', description: '47 users have not completed full KYC verification after 90 days', severity: 'high', status: 'open', date: '2026-04-15' },
  { id: 'cp-002', type: 'aml', title: 'Large Cash Deposit Alert', description: 'Multiple large deposits detected on account usr-004 exceeding daily limits', severity: 'high', status: 'investigating', date: '2026-04-16', assignedTo: 'Daniel Tetteh' },
  { id: 'cp-003', type: 'transaction_limit', title: 'Daily Limit Exceeded', description: 'User Kofi Boateng has exceeded daily transaction limits 3 times this week', severity: 'medium', status: 'open', date: '2026-04-17' },
  { id: 'cp-004', type: 'suspicious_activity', title: 'Rapid Successive Transfers', description: 'Multiple rapid transfers between related accounts detected', severity: 'critical', status: 'escalated', date: '2026-04-14', assignedTo: 'Daniel Tetteh' },
  { id: 'cp-005', type: 'kyc', title: 'Expired Documents - Batch 23', description: '23 users have Ghana Cards expiring within the next 30 days', severity: 'low', status: 'resolved', date: '2026-04-10' },
  { id: 'cp-006', type: 'aml', title: 'New Account High Activity', description: 'Newly created accounts showing unusual high transaction volumes', severity: 'medium', status: 'investigating', date: '2026-04-18', assignedTo: 'Patricia Ampah' },
];

// ---- Notifications ----
export const notifications: Notification[] = [
  { id: 'ntf-001', title: 'Susu Payout Tomorrow', message: 'You will receive GH₵ 10,000.00 from Makola Market Women susu group tomorrow. Ensure your MoMo number is active.', type: 'info', date: '2026-04-18T08:00:00', read: false, category: 'susu' },
  { id: 'ntf-002', title: 'Loan Payment Due', message: 'Your monthly loan payment of GH₵ 1,350.00 is due on May 1, 2026. Please ensure sufficient balance.', type: 'warning', date: '2026-04-17T10:00:00', read: false, category: 'loan' },
  { id: 'ntf-003', title: 'Contribution Collected', message: 'Your daily contribution of GH₵ 500.00 has been collected by Emmanuel Osei.', type: 'success', date: '2026-04-18T09:35:00', read: true, category: 'susu' },
  { id: 'ntf-004', title: 'KYC Reminder', message: 'Complete your full KYC verification to unlock higher transaction limits and loan access.', type: 'info', date: '2026-04-16T12:00:00', read: true, category: 'account' },
  { id: 'ntf-005', title: 'New Susu Group Available', message: 'Join "Accra Digital Entrepreneurs" - a new monthly susu group with 6 members. Only 9 spots left!', type: 'info', date: '2026-04-15T14:00:00', read: true, category: 'susu' },
  { id: 'ntf-006', title: 'Deposit Successful', message: 'Your deposit of GH₵ 2,000.00 via MTN MoMo has been processed successfully.', type: 'success', date: '2026-04-16T11:05:00', read: true, category: 'wallet' },
  { id: 'ntf-007', title: 'Savings Goal Progress', message: 'Your Shop Rent Fund is 69% complete. Keep contributing to reach your goal!', type: 'success', date: '2026-04-14T09:00:00', read: true, category: 'savings' },
];

// ---- Activity Log ----
export const activityLogs: ActivityLog[] = [
  { id: 'al-001', userId: 'usr-001', userName: 'Ama Mensah', action: 'Contribution Made', details: 'Paid GH₵ 500.00 to Makola Market Women susu group', date: '2026-04-18T09:30:00', category: 'Susu' },
  { id: 'al-002', userId: 'usr-006', userName: 'Emmanuel Osei', action: 'Collection Completed', details: 'Collected GH₵ 2,000.00 from 4 customers on Makola route', date: '2026-04-18T09:45:00', category: 'Collection' },
  { id: 'al-003', userId: 'usr-001', userName: 'Ama Mensah', action: 'Loan Repayment', details: 'Paid GH₵ 1,350.00 for Business Loan (LN-001)', date: '2026-04-17T14:20:00', category: 'Loan' },
  { id: 'al-004', userId: 'usr-001', userName: 'Ama Mensah', action: 'Deposit', details: 'Deposited GH₵ 2,000.00 via MTN MoMo', date: '2026-04-16T11:00:00', category: 'Wallet' },
  { id: 'al-005', userId: 'usr-008', userName: 'Patricia Ampah', action: 'Payout Processed', details: 'Processed GH₵ 10,000.00 payout to Efua Darko', date: '2026-04-15T16:50:00', category: 'Susu' },
  { id: 'al-006', userId: 'usr-009', userName: 'Daniel Tetteh', action: 'Loan Approved', details: 'Approved GH₵ 25,000.00 business loan for Efua Darko', date: '2026-04-10T10:30:00', category: 'Loan' },
  { id: 'al-007', userId: 'usr-001', userName: 'Ama Mensah', action: 'Goal Created', details: 'Created savings goal "Shop Rent Fund" - GH₵ 18,000.00', date: '2026-04-08T08:00:00', category: 'Savings' },
];

// ---- Monthly Revenue Data (for charts) ----
export const monthlyRevenueData = [
  { month: 'Sep', revenue: 245000, deposits: 180000, loans: 65000 },
  { month: 'Oct', revenue: 268000, deposits: 195000, loans: 73000 },
  { month: 'Nov', revenue: 290000, deposits: 210000, loans: 80000 },
  { month: 'Dec', revenue: 320000, deposits: 230000, loans: 90000 },
  { month: 'Jan', revenue: 298000, deposits: 215000, loans: 83000 },
  { month: 'Feb', revenue: 310000, deposits: 225000, loans: 85000 },
  { month: 'Mar', revenue: 345000, deposits: 248000, loans: 97000 },
  { month: 'Apr', revenue: 385000, deposits: 275000, loans: 110000 },
];

export const dailyCollectionData = [
  { day: 'Mon', amount: 12500, customers: 28 },
  { day: 'Tue', amount: 11800, customers: 26 },
  { day: 'Wed', amount: 13200, customers: 30 },
  { day: 'Thu', amount: 12100, customers: 27 },
  { day: 'Fri', amount: 14500, customers: 32 },
  { day: 'Sat', amount: 8900, customers: 20 },
  { day: 'Sun', amount: 0, customers: 0 },
];

export const loanPortfolioData = [
  { month: 'Oct', disbursed: 125000, repaid: 95000, outstanding: 450000 },
  { month: 'Nov', disbursed: 140000, repaid: 110000, outstanding: 480000 },
  { month: 'Dec', disbursed: 160000, repaid: 120000, outstanding: 520000 },
  { month: 'Jan', disbursed: 130000, repaid: 105000, outstanding: 545000 },
  { month: 'Feb', disbursed: 145000, repaid: 115000, outstanding: 575000 },
  { month: 'Mar', disbursed: 155000, repaid: 130000, outstanding: 600000 },
  { month: 'Apr', disbursed: 170000, repaid: 140000, outstanding: 630000 },
];

export const kycStatusData = [
  { status: 'Full KYC', count: 1856, color: '#10b981' },
  { status: 'Basic KYC', count: 542, color: '#f59e0b' },
  { status: 'No KYC', count: 449, color: '#ef4444' },
];
