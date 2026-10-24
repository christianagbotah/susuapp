import * as bcrypt from 'bcryptjs';
import { ApiUser, Wallet, Txn, SusuGroup, Contribution, Loan, ApiNotification } from './types';

const DEMO_PIN = '123456';
const hash = () => bcrypt.hashSync(DEMO_PIN, 8);

function daysAgo(n: number, h = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
}

function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function buildSeed() {
  const users: ApiUser[] = [
    { id: 'usr-001', name: 'Ama Mensah', email: 'ama.mensah@gmail.com', phone: '0241234567', role: 'customer', kycLevel: 'full', memberSince: '2024-03-15', location: 'Accra, Greater Accra', passwordHash: hash() },
    { id: 'usr-002', name: 'Kwame Asante', email: 'kwame.asante@yahoo.com', phone: '0209876543', role: 'customer', kycLevel: 'basic', memberSince: '2024-06-20', location: 'Kumasi, Ashanti', passwordHash: hash() },
    { id: 'usr-006', name: 'Emmanuel Osei', email: 'emma.osei@gmail.com', phone: '0265566778', role: 'agent', kycLevel: 'full', memberSince: '2023-08-15', location: 'Accra, Greater Accra', branch: 'Accra Central', passwordHash: hash() },
    { id: 'usr-007', name: 'Grace Owusu', email: 'grace.owusu@gmail.com', phone: '0203344556', role: 'agent', kycLevel: 'full', memberSince: '2024-02-01', location: 'Kumasi, Ashanti', branch: 'Kumasi Adum', passwordHash: hash() },
    { id: 'usr-008', name: 'Patricia Ampah', email: 'pat.ampah@gmail.com', phone: '0246677889', role: 'treasurer', kycLevel: 'full', memberSince: '2023-06-10', location: 'Accra, Greater Accra', branch: 'Accra Central', passwordHash: hash() },
    { id: 'usr-009', name: 'Daniel Tetteh', email: 'dan.tetteh@isusupro.com', phone: '0278899001', role: 'admin', kycLevel: 'full', memberSince: '2023-01-01', location: 'Accra, Greater Accra', branch: 'Head Office', passwordHash: hash() },
  ];

  const wallets: Wallet[] = [
    { id: 'wal-001', userId: 'usr-001', type: 'main', balance: 4520, currency: 'GHS' },
    { id: 'wal-002', userId: 'usr-001', type: 'savings', balance: 1200, currency: 'GHS' },
    { id: 'wal-003', userId: 'usr-002', type: 'main', balance: 3100, currency: 'GHS' },
  ];

  const transactions: Txn[] = [
    { id: 'txn-001', userId: 'usr-001', type: 'deposit', amount: 2000, currency: 'GHS', status: 'completed', date: daysAgo(1, 10), description: 'Deposit via MTN MoMo', reference: 'SP-D001-A1B2C3', category: 'Wallet', balanceAfter: 4520, counterpartName: 'MTN MoMo' },
    { id: 'txn-002', userId: 'usr-001', type: 'susu_contribution', amount: 500, currency: 'GHS', status: 'completed', date: daysAgo(2, 9), description: 'Daily contribution - Makola Market Women', reference: 'SP-M005-B1C2D3', category: 'Susu', balanceAfter: 4020 },
    { id: 'txn-003', userId: 'usr-001', type: 'susu_payout', amount: 10000, currency: 'GHS', status: 'completed', date: daysAgo(4, 16), description: 'Susu payout received - Round 11', reference: 'SP-P001-J1K2L3', category: 'Susu', balanceAfter: 4600 },
    { id: 'txn-004', userId: 'usr-001', type: 'withdrawal', amount: 500, currency: 'GHS', status: 'completed', date: daysAgo(5, 15), description: 'Withdrawal to Telecel Cash', reference: 'SP-W001-V4W5X6', category: 'Wallet', balanceAfter: 5900, counterpartName: 'Telecel Cash' },
    { id: 'txn-005', userId: 'usr-001', type: 'loan_repayment', amount: 1350, currency: 'GHS', status: 'completed', date: daysAgo(8, 14), description: 'Monthly loan repayment - Business Loan', reference: 'SP-L002-E4F5G6', category: 'Loan', balanceAfter: 5900 },
    { id: 'txn-006', userId: 'usr-001', type: 'airtime', amount: 50, currency: 'GHS', status: 'completed', date: daysAgo(9, 18), description: 'MTN airtime top-up', reference: 'SP-A001-M3N4O5', category: 'Airtime', balanceAfter: 7250 },
    { id: 'txn-007', userId: 'usr-001', type: 'bill', amount: 350, currency: 'GHS', status: 'completed', date: daysAgo(11, 11), description: 'DSTV subscription payment', reference: 'SP-B002-P7Q8R9', category: 'Bills', balanceAfter: 4068 },
    { id: 'txn-008', userId: 'usr-001', type: 'transfer', amount: 200, currency: 'GHS', status: 'completed', date: daysAgo(13, 12), description: 'Transfer to 0209876543', reference: 'SP-T001-S1T2U3', category: 'Transfer', balanceAfter: 6400, counterpartName: '0209876543' },
  ];

  const susuGroups: SusuGroup[] = [
    { id: 'grp-001', name: 'Makola Market Women', description: 'Daily savings group for Makola market traders', contributionFrequency: 'daily', contributionAmount: 500, memberCount: 12, currentRound: 11, totalRounds: 12, nextPayoutDate: daysAhead(3), myRole: 'member', status: 'active' },
    { id: 'grp-002', name: 'Kaneshie Traders Union', description: 'Weekly susu group for Kaneshie traders', contributionFrequency: 'weekly', contributionAmount: 3000, memberCount: 8, currentRound: 4, totalRounds: 8, nextPayoutDate: daysAhead(9), myRole: 'treasurer', status: 'active' },
  ];

  const contributions: Contribution[] = [
    { id: 'sc-001', groupId: 'grp-001', groupName: 'Makola Market Women', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 500, date: daysAgo(2, 9), status: 'paid', collectedByName: 'Self Payment', round: 11 },
    { id: 'sc-002', groupId: 'grp-001', groupName: 'Makola Market Women', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 500, date: daysAgo(3, 9), status: 'paid', collectedByName: 'Agent Emmanuel', round: 11 },
    { id: 'sc-003', groupId: 'grp-002', groupName: 'Kaneshie Traders Union', memberId: 'usr-001', memberName: 'Ama Mensah', amount: 3000, date: daysAgo(6, 10), status: 'paid', collectedByName: 'Self Payment', round: 4 },
  ];

  const loans: Loan[] = [
    { id: 'ln-001', applicantId: 'usr-001', applicantName: 'Ama Mensah', applicantPhone: '0241234567', type: 'business', amount: 15000, interestRate: 8, term: 12, termUnit: 'months', status: 'active', monthlyPayment: 1350, remainingBalance: 10125, totalPaid: 5400, nextPaymentDate: daysAhead(6), startDate: daysAgo(340), endDate: daysAhead(25), purpose: 'Expand provision store inventory', creditScore: 78, branch: 'Accra Central', disbursementMethod: 'momo' },
    { id: 'ln-003', applicantId: 'usr-002', applicantName: 'Kwame Asante', applicantPhone: '0209876543', type: 'susu-backed', amount: 3000, interestRate: 5, term: 3, termUnit: 'months', status: 'pending', monthlyPayment: 1025, remainingBalance: 3000, totalPaid: 0, nextPaymentDate: '', startDate: '', endDate: '', purpose: 'Restock clothing inventory', creditScore: 65, branch: 'Kumasi Adum', disbursementMethod: 'momo' },
    { id: 'ln-002', applicantId: 'usr-001', applicantName: 'Ama Mensah', applicantPhone: '0241234567', type: 'education', amount: 5000, interestRate: 6, term: 6, termUnit: 'months', status: 'repaid', monthlyPayment: 860, remainingBalance: 0, totalPaid: 5160, nextPaymentDate: '', startDate: daysAgo(300), endDate: daysAgo(130), purpose: 'Children school fees payment', creditScore: 78, branch: 'Accra Central', disbursementMethod: 'momo' },
  ];

  const notifications: ApiNotification[] = [
    { id: 'ntf-001', userId: 'usr-001', title: 'Payout Processing — Makola Queens', message: 'Round 8 payout of ₵400.00 has been initiated via MTN MoMo. Expected completion within 30 minutes.', type: 'info', date: daysAgo(0, 8), read: false, category: 'payouts' },
    { id: 'ntf-002', userId: 'usr-001', title: 'Contribution Confirmed', message: 'Your daily contribution of ₵500.00 to Makola Market Women was received. Round 11 of 12.', type: 'success', date: daysAgo(1, 10), read: false, category: 'susu' },
    { id: 'ntf-003', userId: 'usr-001', title: 'Loan Payment Reminder', message: 'Your business loan payment of ₵1,350.00 is due in 6 days.', type: 'warning', date: daysAgo(1, 7), read: false, category: 'loans' },
    { id: 'ntf-004', userId: 'usr-001', title: 'Welcome to iSusuPro', message: 'Your account was successfully created. Complete KYC to unlock higher limits.', type: 'success', date: daysAgo(30), read: true, category: 'account' },
  ];

  return { users, wallets, transactions, susuGroups, contributions, loans, notifications };
}
