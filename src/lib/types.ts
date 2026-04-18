// ============================================
// iSusuPro Ghana - Enterprise Type Definitions
// ============================================

// Portal & Navigation
export type PortalId = 'customer' | 'agent' | 'admin' | 'treasurer';
export type CustomerPageId = 'dashboard' | 'susu' | 'loans' | 'wallet' | 'transactions' | 'settings';
export type AgentPageId = 'dashboard' | 'collections' | 'customers' | 'commissions' | 'settings';
export type AdminPageId = 'dashboard' | 'users' | 'loans' | 'analytics' | 'compliance' | 'settings' | 'agents' | 'susu-groups';
export type TreasurerPageId = 'dashboard' | 'groups' | 'payouts' | 'members' | 'reports' | 'settings';

// Auth
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: PortalId;
  kycLevel: 'none' | 'basic' | 'full';
  memberSince: string;
  location?: string;
  agentCode?: string;
  branch?: string;
}

// ---- SUSU MODULE ----
export interface SusuGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
  totalPool: number;
  contributionAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextPayout: string;
  nextPayoutMember: string;
  status: 'active' | 'completed' | 'full';
  currentRound: number;
  totalRounds: number;
  roundStartDate: string;
  treasurerId: string;
  treasurerName: string;
  branch: string;
}

export interface SusuContribution {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  collectedBy?: string;
  collectedByName?: string;
  round: number;
}

export interface SusuPayout {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  amount: number;
  payoutDate: string;
  round: number;
  status: 'completed' | 'pending' | 'processing';
  disbursementMethod: 'momo' | 'bank';
  momoNumber?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  autoContribute: boolean;
  contributionAmount: number;
  contributionFrequency: 'daily' | 'weekly' | 'monthly';
}

// ---- LOANS MODULE ----
export interface Loan {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  type: 'personal' | 'business' | 'education' | 'emergency' | 'susu-backed';
  amount: number;
  interestRate: number;
  term: number;
  termUnit: 'months' | 'weeks';
  status: 'pending' | 'under_review' | 'approved' | 'active' | 'repaid' | 'rejected' | 'defaulted';
  monthlyPayment: number;
  remainingBalance: number;
  totalPaid: number;
  nextPaymentDate: string;
  startDate: string;
  endDate: string;
  disbursementMethod: 'momo' | 'bank';
  disbursementProvider?: string;
  disbursementNumber?: string;
  purpose: string;
  guarantorName?: string;
  guarantorPhone?: string;
  collateral?: string;
  creditScore: number;
  branch: string;
  reviewedBy?: string;
  reviewDate?: string;
  rejectReason?: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: 'momo' | 'bank' | 'agent';
  principal: number;
  interest: number;
  penalty?: number;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTerm: number;
  maxTerm: number;
  termUnit: 'months' | 'weeks';
  requirements: string[];
  isActive: boolean;
}

// ---- WALLET MODULE ----
export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  type: 'main' | 'savings' | 'loan' | 'susu';
  provider?: string;
  accountNumber?: string;
  isDefault: boolean;
  status: 'active' | 'frozen' | 'closed';
}

export interface MobileMoneyProvider {
  id: string;
  name: string;
  shortName: string;
  code: string;
  color: string;
  bgColor: string;
  icon: string;
  ussdCode: string;
}

export interface DepositRequest {
  id: string;
  walletId: string;
  amount: number;
  provider: string;
  phoneNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  reference: string;
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  provider: string;
  phoneNumber: string;
  fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  reference: string;
}

// ---- TRANSACTIONS MODULE ----
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'susu_contribution' | 'susu_payout' | 'loan_disbursement' | 'loan_repayment' | 'agent_commission' | 'fee';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  date: string;
  description: string;
  reference: string;
  category: string;
  balanceAfter: number;
  counterpartName?: string;
}

// ---- AGENT MODULE ----
export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  code: string;
  branch: string;
  territory: string;
  status: 'active' | 'inactive' | 'suspended';
  totalCollections: number;
  totalCustomers: number;
  totalCommissions: number;
  rating: number;
  joinedDate: string;
  lastActive: string;
  avatar?: string;
}

export interface CollectionRoute {
  id: string;
  name: string;
  area: string;
  customerCount: number;
  totalExpected: number;
  totalCollected: number;
  date: string;
  status: 'in_progress' | 'completed' | 'pending' | 'partial';
  customers: CollectionCustomer[];
}

export interface CollectionCustomer {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  susuGroupId: string;
  susuGroupName: string;
  expectedAmount: number;
  collectedAmount: number;
  status: 'collected' | 'pending' | 'absent';
  notes?: string;
}

export interface AgentCommission {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  type: 'susu_collection' | 'loan_referral' | 'new_customer' | 'milestone_bonus';
  description: string;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidDate?: string;
}

// ---- ADMIN MODULE ----
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalLoansDisbursed: number;
  totalSusuPool: number;
  totalAgents: number;
  activeAgents: number;
  totalSusuGroups: number;
  pendingLoans: number;
  defaultRate: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  region: string;
  manager: string;
  totalCustomers: number;
  totalAgents: number;
  totalSusuGroups: number;
  status: 'active' | 'inactive';
}

export interface ComplianceReport {
  id: string;
  type: 'kyc' | 'aml' | 'transaction_limit' | 'suspicious_activity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  date: string;
  assignedTo?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
  category: string;
  link?: string;
}

// ---- ACTIVITY LOG ----
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  date: string;
  ip?: string;
  category: string;
}
