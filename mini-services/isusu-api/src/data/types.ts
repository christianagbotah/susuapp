// ============================================
// iSusuPro Ghana API — Domain Types
// ============================================

export type Role = 'customer' | 'agent' | 'treasurer' | 'admin';
export type KycLevel = 'none' | 'basic' | 'full';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  kycLevel: KycLevel;
  memberSince: string;
  location?: string;
  branch?: string;
  passwordHash?: string; // never serialized out
}

export interface Wallet {
  id: string;
  userId: string;
  type: 'main' | 'savings';
  balance: number;
  currency: 'GHS';
}

export interface Txn {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'susu_contribution' | 'susu_payout' | 'loan_repayment' | 'fee' | 'airtime' | 'bill';
  amount: number;
  currency: 'GHS';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
  reference: string;
  category: string;
  balanceAfter: number;
  counterpartName?: string;
}

export interface SusuGroup {
  id: string;
  name: string;
  description: string;
  contributionFrequency: 'daily' | 'weekly';
  contributionAmount: number;
  memberCount: number;
  currentRound: number;
  totalRounds: number;
  nextPayoutDate: string;
  myRole: 'member' | 'treasurer';
  status: 'active' | 'completed';
}

export interface Contribution {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
  collectedByName: string;
  round: number;
}

export type LoanStatus = 'pending' | 'active' | 'approved' | 'rejected' | 'repaid';

export interface Loan {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  type: 'business' | 'personal' | 'education' | 'emergency' | 'susu-backed';
  amount: number;
  interestRate: number;
  term: number;
  termUnit: 'months';
  status: LoanStatus;
  monthlyPayment: number;
  remainingBalance: number;
  totalPaid: number;
  nextPaymentDate: string;
  startDate: string;
  endDate: string;
  purpose: string;
  creditScore: number;
  branch: string;
  disbursementMethod: 'momo' | 'bank';
  rejectionReason?: string;
}

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
  category: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
  name: string;
}
