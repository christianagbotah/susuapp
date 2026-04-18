// ============================================
// iSusuPro Ghana - Zustand State Management
// ============================================
import { create } from 'zustand';
import type {
  PortalId, User, Wallet, SusuGroup, SusuContribution, SusuPayout,
  SavingsGoal, Loan, LoanPayment, Transaction, Notification,
  Agent, CollectionRoute, AgentCommission, SystemStats,
  Branch, ComplianceReport, ActivityLog,
  Referral, Transfer, Dispute,
  CreditScoreResult, RepaymentScheduleEntry,
  LoanProduct,
  CompanyDetails, PaymentGatewayConfig, PaymentGatewayId, PaymentGatewayCredential, PaymentGatewayStatus,
  SMSProviderConfig, SMSProviderId, SMSCredential, SMSProviderStatus,
  KYCVerificationRecord,
  // New modules
  PayrollEmployee, Payslip, PayrollRun,
  SSNITContribution, SSNITFiling,
  TAXFiling, TAXPayment, TAXCalendarItem,
  AirtimeProduct, AirtimeTransaction,
  Biller, BillPayment,
  Budget, Expense,
} from '@/lib/types';
import {
  currentUser, currentAgent, currentTreasurer, currentAdmin,
  users, customerWallets, susuGroups, susuContributions, susuPayouts,
  savingsGoals, loans, loanPayments, transactions, notifications,
  agents, collectionRoutes, agentCommissions, systemStats, branches,
  complianceReports, activityLogs,
  referrals, recentTransfers, disputes,
  loanProducts,
} from '@/lib/mock-data';
import { generateReference, calculateCreditScoreFromProfile } from '@/lib/formatters';

// ---- Navigation Store ----
interface NavigationState {
  currentPortal: PortalId | null;
  sidebarOpen: boolean;
  setPortal: (portal: PortalId) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPortal: null,
  sidebarOpen: false,
  setPortal: (portal) => set({ currentPortal: portal, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  logout: () => set({ currentPortal: null }),
}));

// ---- Customer Store ----
interface CustomerState {
  user: User;
  wallets: Wallet[];
  susuGroups: SusuGroup[];
  mySusuContributions: SusuContribution[];
  susuPayouts: SusuPayout[];
  savingsGoals: SavingsGoal[];
  myLoans: Loan[];
  loanPayments: LoanPayment[];
  transactions: Transaction[];
  notifications: Notification[];
  referrals: Referral[];
  recentTransfers: Transfer[];
  disputes: Dispute[];
  activePage: string;

  setActivePage: (page: string) => void;
  makeContribution: (groupId: string, amount: number) => void;
  deposit: (walletId: string, amount: number, provider: string) => void;
  withdraw: (walletId: string, amount: number, provider: string) => void;
  markNotificationRead: (id: string) => void;
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  initiateTransfer: (recipientPhone: string, amount: number, note?: string) => void;
  fileDispute: (transactionId: string, type: string, description: string) => void;
  markDisputeResolved: (disputeId: string, resolution: string) => void;
  completeKYC: (kycLevel: 'basic' | 'full') => void;
  applyForLoan: (application: Partial<Loan>) => void;
  makeLoanPayment: (loanId: string, amount: number, method: string) => void;
  calculateCreditScore: () => CreditScoreResult;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  user: currentUser,
  wallets: customerWallets,
  susuGroups: susuGroups.filter(g =>
    ['sug-001', 'sug-002', 'sug-007'].includes(g.id)
  ),
  mySusuContributions: susuContributions.filter(c => c.memberId === 'usr-001'),
  susuPayouts: susuPayouts.filter(p => p.memberId === 'usr-001'),
  savingsGoals: savingsGoals,
  myLoans: loans.filter(l => l.applicantId === 'usr-001'),
  loanPayments: loanPayments.filter(p =>
    loans.filter(l => l.applicantId === 'usr-001').map(l => l.id).includes(p.loanId)
  ),
  transactions: transactions.filter(t => t.userId === 'usr-001'),
  notifications: notifications,
  referrals: referrals.filter(r => r.referrerId === 'usr-001'),
  recentTransfers: recentTransfers.filter(t => t.senderId === 'usr-001'),
  disputes: disputes.filter(d => d.userId === 'usr-001'),
  activePage: 'dashboard',

  setActivePage: (page) => set({ activePage: page }),

  makeContribution: (groupId, amount) => {
    const group = susuGroups.find(g => g.id === groupId);
    const newContribution: SusuContribution = {
      id: `sc-${Date.now()}`,
      groupId,
      groupName: group?.name || '',
      memberId: 'usr-001',
      memberName: 'Ama Mensah',
      amount,
      date: new Date().toISOString(),
      status: 'paid',
      collectedByName: 'Self Payment',
      round: group?.currentRound || 1,
    };
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      userId: 'usr-001',
      type: 'susu_contribution',
      amount,
      currency: 'GHS',
      status: 'completed',
      date: new Date().toISOString(),
      description: `Contribution to ${group?.name || 'susu group'}`,
      reference: generateReference(),
      category: 'Susu',
      balanceAfter: 0,
    };
    set((s) => ({
      mySusuContributions: [newContribution, ...s.mySusuContributions],
      transactions: [newTxn, ...s.transactions],
      wallets: s.wallets.map(w => w.type === 'main' ? { ...w, balance: w.balance - amount } : w),
    }));
  },

  deposit: (walletId, amount, provider) => {
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      userId: 'usr-001',
      type: 'deposit',
      amount,
      currency: 'GHS',
      status: 'completed',
      date: new Date().toISOString(),
      description: `Deposit via ${provider}`,
      reference: generateReference(),
      category: 'Wallet',
      balanceAfter: 0,
      counterpartName: provider,
    };
    set((s) => ({
      transactions: [newTxn, ...s.transactions],
      wallets: s.wallets.map(w => w.id === walletId ? { ...w, balance: w.balance + amount } : w),
    }));
  },

  withdraw: (walletId, amount, provider) => {
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      userId: 'usr-001',
      type: 'withdrawal',
      amount,
      currency: 'GHS',
      status: 'completed',
      date: new Date().toISOString(),
      description: `Withdrawal to ${provider}`,
      reference: generateReference(),
      category: 'Wallet',
      balanceAfter: 0,
      counterpartName: provider,
    };
    set((s) => ({
      transactions: [newTxn, ...s.transactions],
      wallets: s.wallets.map(w => w.id === walletId ? { ...w, balance: w.balance - amount } : w),
    }));
  },

  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),

  createSavingsGoal: (goal) => {
    const newGoal: SavingsGoal = { ...goal, id: `sg-${Date.now()}` };
    set((s) => ({ savingsGoals: [...s.savingsGoals, newGoal] }));
  },

  contributeToGoal: (goalId, amount) => {
    set((s) => ({
      savingsGoals: s.savingsGoals.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g),
      wallets: s.wallets.map(w => w.type === 'savings' ? { ...w, balance: w.balance + amount } : w),
    }));
  },

  initiateTransfer: (recipientPhone, amount, note) => {
    const newTransfer: Transfer = {
      id: `trf-${Date.now()}`,
      senderId: 'usr-001',
      senderName: 'Ama Mensah',
      recipientName: recipientPhone,
      recipientPhone,
      amount,
      status: 'completed',
      date: new Date().toISOString(),
      reference: generateReference(),
      note,
    };
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      userId: 'usr-001',
      type: 'transfer',
      amount,
      currency: 'GHS',
      status: 'completed',
      date: new Date().toISOString(),
      description: `Transfer to ${recipientPhone}${note ? ` - ${note}` : ''}`,
      reference: newTransfer.reference,
      category: 'Transfer',
      balanceAfter: 0,
      counterpartName: recipientPhone,
    };
    set((s) => ({
      recentTransfers: [newTransfer, ...s.recentTransfers],
      transactions: [newTxn, ...s.transactions],
      wallets: s.wallets.map(w => w.type === 'main' ? { ...w, balance: w.balance - amount } : w),
    }));
  },

  fileDispute: (transactionId, type, description) => {
    const txn = transactions.find(t => t.id === transactionId);
    const newDispute: Dispute = {
      id: `dsp-${Date.now()}`,
      transactionId,
      userId: 'usr-001',
      type: type as Dispute['type'],
      description,
      amount: txn?.amount || 0,
      status: 'open',
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      disputes: [newDispute, ...s.disputes],
    }));
  },

  markDisputeResolved: (disputeId, resolution) => {
    set((s) => ({
      disputes: s.disputes.map(d =>
        d.id === disputeId ? { ...d, status: 'resolved' as const, resolution, updatedAt: new Date().toISOString() } : d
      ),
    }));
  },

  completeKYC: (kycLevel) => {
    set((s) => ({
      user: { ...s.user, kycLevel },
    }));
  },

  applyForLoan: (application) => {
    const product = loanProducts.find(p => p.id === application.productId);
    const numAmount = application.amount || 0;
    const processingFee = product?.processingFeePercent ? Math.round(numAmount * product.processingFeePercent / 100 * 100) / 100 : 0;
    const totalInterest = product?.interestType === 'flat' ? Math.round(numAmount * (product.interestRate / 100) * 100) / 100 : 0;
    const totalRepayment = numAmount + totalInterest;
    const term = application.term || 7;
    const now = new Date().toISOString();
    const start = new Date();
    const end = new Date(start);
    if (application.termUnit === 'days') end.setDate(end.getDate() + term);
    else if (application.termUnit === 'weeks') end.setDate(end.getDate() + term * 7);
    else end.setMonth(end.getMonth() + term);

    const newLoan: Loan = {
      id: `ln-${Date.now()}`,
      applicantId: 'usr-001',
      applicantName: 'Ama Mensah',
      applicantPhone: '0241234567',
      type: product?.type || application.type || 'personal',
      productId: application.productId,
      amount: numAmount,
      interestRate: product?.interestRate || application.interestRate || 5,
      term,
      termUnit: application.termUnit || 'days',
      status: product?.autoApprove ? 'approved' : 'pending',
      monthlyPayment: Math.round(totalRepayment / term * 100) / 100,
      remainingBalance: numAmount,
      totalPaid: 0,
      nextPaymentDate: '',
      startDate: '',
      endDate: end.toISOString().split('T')[0],
      disbursementMethod: (application.disbursementMethod as 'momo' | 'bank') || 'momo',
      disbursementNumber: application.disbursementNumber,
      purpose: application.purpose || '',
      creditScore: 78,
      branch: 'Accra Central',
      applicationDate: now,
      approvedDate: product?.autoApprove ? now : undefined,
      autoApproved: product?.autoApprove || false,
      processingFee,
      totalInterest,
      repaymentFrequency: product?.repaymentFrequency || 'daily',
      interestType: product?.interestType || 'flat',
    };

    if (product?.autoApprove) {
      // Auto-disburse: add disbursement date and schedule
      newLoan.status = 'active';
      newLoan.disbursementDate = now;
      newLoan.startDate = now;
    }

    set((s) => ({
      myLoans: [newLoan, ...s.myLoans],
      wallets: s.wallets.map(w => w.type === 'main' ? { ...w, balance: w.balance + numAmount } : w),
    }));
  },

  makeLoanPayment: (loanId, amount, method) => {
    const newPayment: LoanPayment = {
      id: `lp-${Date.now()}`,
      loanId,
      amount,
      date: new Date().toISOString(),
      status: 'completed',
      method: method as 'momo' | 'bank' | 'agent',
      principal: Math.round(amount * 0.8 * 100) / 100,
      interest: Math.round(amount * 0.2 * 100) / 100,
    };

    set((s) => {
      const updatedLoans = s.myLoans.map(l => {
        if (l.id !== loanId) return l;
        const newTotalPaid = l.totalPaid + amount;
        const newRemaining = Math.max(l.remainingBalance - amount, 0);
        const isFullyPaid = newRemaining <= 0;

        // Update schedule entries
        let remaining = amount;
        const updatedSchedule = (l.repaymentSchedule || []).map(entry => {
          if (entry.status !== 'pending' || remaining <= 0) return entry;
          if (remaining >= entry.amount) {
            remaining -= entry.amount;
            return { ...entry, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0], paidAmount: entry.amount };
          }
          const partial = remaining;
          remaining = 0;
          return { ...entry, status: 'partial' as const, paidDate: new Date().toISOString().split('T')[0], paidAmount: partial };
        });

        return {
          ...l,
          totalPaid: newTotalPaid,
          remainingBalance: newRemaining,
          status: isFullyPaid ? 'repaid' as const : l.status,
          repaymentSchedule: updatedSchedule,
        };
      });

      return {
        loanPayments: [newPayment, ...s.loanPayments],
        myLoans: updatedLoans,
        wallets: s.wallets.map(w => w.type === 'main' ? { ...w, balance: w.balance - amount } : w),
      };
    });
  },

  calculateCreditScore: () => {
    const { mySusuContributions, myLoans, user } = get();
    const accountAgeMs = Date.now() - new Date(user.memberSince).getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    // Wallet activity: based on number of transactions
    const { transactions } = get();
    const recentTx = transactions.filter(t => {
      const txDate = new Date(t.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return txDate >= thirtyDaysAgo;
    });
    const walletActivityScore = Math.min(100, recentTx.length * 10);

    return calculateCreditScoreFromProfile({
      susuContributions: mySusuContributions.map(c => ({ status: c.status, date: c.date })),
      loans: myLoans.map(l => ({ status: l.status, totalPaid: l.totalPaid, amount: l.amount })),
      kycLevel: user.kycLevel,
      accountAgeDays,
      walletActivityScore,
    });
  },
}));

// ---- Agent Store ----
interface AgentState {
  user: User;
  agent: Agent;
  collectionRoutes: CollectionRoute[];
  commissions: AgentCommission[];
  allAgents: Agent[];
  allCustomers: User[];
  activePage: string;

  setActivePage: (page: string) => void;
  collectFromCustomer: (routeId: string, customerId: string, amount: number) => void;
  markCustomerAbsent: (routeId: string, customerId: string, notes: string) => void;
  verifyCustomerKYC: (customerId: string, kycLevel: 'basic' | 'full') => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  user: currentAgent,
  agent: agents[0],
  collectionRoutes: collectionRoutes.slice(0, 2),
  commissions: agentCommissions.filter(c => c.agentId === 'usr-006'),
  allAgents: agents,
  allCustomers: users.filter(u => u.role === 'customer'),
  activePage: 'dashboard',

  setActivePage: (page) => set({ activePage: page }),

  collectFromCustomer: (routeId, customerId, amount) => {
    set((s) => ({
      collectionRoutes: s.collectionRoutes.map(r => {
        if (r.id !== routeId) return r;
        const totalCollected = r.customers.reduce((sum, c) =>
          c.customerId === customerId ? sum + amount : sum + c.collectedAmount, 0);
        return {
          ...r,
          totalCollected,
          status: r.customers.every(c => c.customerId === customerId || c.status !== 'pending') ? 'completed' : 'in_progress',
          customers: r.customers.map(c =>
            c.customerId === customerId ? { ...c, collectedAmount: amount, status: 'collected' as const } : c
          ),
        };
      }),
    }));
  },

  markCustomerAbsent: (routeId, customerId, notes) => {
    set((s) => ({
      collectionRoutes: s.collectionRoutes.map(r => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          customers: r.customers.map(c =>
            c.customerId === customerId ? { ...c, status: 'absent' as const, notes } : c
          ),
        };
      }),
    }));
  },

  verifyCustomerKYC: (customerId, kycLevel) => {
    set((s) => ({
      allCustomers: s.allCustomers.map(c =>
        c.id === customerId ? { ...c, kycLevel } : c
      ),
    }));
  },
}));

// ---- KYC Verification Mock Data ----
const mockKYCRecords: KYCVerificationRecord[] = [
  {
    id: 'kyc-001',
    userId: 'usr-001',
    userName: 'Ama Mensah',
    userPhone: '+233 24 123 4567',
    userEmail: 'ama.mensah@email.com',
    status: 'approved',
    submittedAt: '2026-03-14T14:20:00Z',
    reviewedAt: '2026-03-15T10:30:00Z',
    reviewedBy: 'Daniel Tetteh',
    cardData: {
      idNumber: 'GHA-123456789-0',
      fullName: 'MENSAH AMA SERWAA',
      dateOfBirth: '15/03/1992',
      gender: 'Female',
      nationality: 'Ghanaian',
      expiryDate: '15/03/2032',
      issueDate: '15/03/2022',
      cardNumber: 'GC-2022-04589371',
      personalIdNumber: 'PIN-2847193650',
      documentType: 'Ghana Card',
      region: 'Greater Accra',
      verificationScore: 96,
    },
    facialMatchScore: 94,
    niaVerified: true,
    documentValid: true,
    identityVerified: true,
    recommendation: 'approve',
    ocrConfidence: 96,
    warnings: [],
    processingTime: 3200,
    nextOfKin: { name: 'Kwame Mensah', phone: '+233 20 555 1234', relationship: 'Spouse' },
    addressInfo: { houseNumber: '24', street: 'Osu Oxford Street', area: 'Osu', city: 'Accra', region: 'Greater Accra', digitalAddress: 'GA-234-5678' },
    kycLevel: 'full',
    expiresAt: '2032-03-15T10:30:00Z',
  },
  {
    id: 'kyc-002',
    userId: 'usr-002',
    userName: 'Kofi Asante',
    userPhone: '+233 20 987 6543',
    userEmail: 'kofi.asante@email.com',
    status: 'pending_review',
    submittedAt: '2026-04-18T08:15:00Z',
    cardData: {
      idNumber: 'GHA-987654321-1',
      fullName: 'ASANTE KOFI BOAKYE',
      dateOfBirth: '22/08/1988',
      gender: 'Male',
      nationality: 'Ghanaian',
      expiryDate: '22/08/2028',
      issueDate: '22/08/2018',
      cardNumber: 'GC-2018-07128456',
      personalIdNumber: 'PIN-6392841057',
      documentType: 'Ghana Card',
      region: 'Ashanti',
      verificationScore: 89,
    },
    facialMatchScore: 87,
    niaVerified: true,
    documentValid: true,
    identityVerified: false,
    recommendation: 'manual_review',
    ocrConfidence: 89,
    warnings: ['Card expiry date is within 2 years'],
    processingTime: 4100,
    nextOfKin: { name: 'Adwoa Asante', phone: '+233 50 333 9876', relationship: 'Mother' },
    addressInfo: { houseNumber: '12', street: 'Kejetia Road', area: 'Kejetia', city: 'Kumasi', region: 'Ashanti', digitalAddress: 'AS-567-1234' },
    kycLevel: 'none',
    expiresAt: '2028-08-22T08:15:00Z',
  },
  {
    id: 'kyc-003',
    userId: 'usr-003',
    userName: 'Abena Owusu',
    userPhone: '+233 27 456 7890',
    userEmail: 'abena.owusu@email.com',
    status: 'rejected',
    submittedAt: '2026-04-09T11:45:00Z',
    reviewedAt: '2026-04-10T16:00:00Z',
    reviewedBy: 'Daniel Tetteh',
    rejectionReason: 'Facial match score too low (65%). Blurry selfie image. Please retake with better lighting.',
    cardData: {
      idNumber: 'GHA-456789123-2',
      fullName: 'OWUSU ABENA FREMA',
      dateOfBirth: '10/11/1995',
      gender: 'Female',
      nationality: 'Ghanaian',
      expiryDate: '10/11/2025',
      issueDate: '10/11/2015',
      cardNumber: 'GC-2015-03298471',
      personalIdNumber: 'PIN-4719283056',
      documentType: 'Ghana Card',
      region: 'Western',
      verificationScore: 72,
    },
    facialMatchScore: 65,
    niaVerified: true,
    documentValid: true,
    identityVerified: false,
    recommendation: 'reject',
    ocrConfidence: 72,
    warnings: ['Low OCR confidence on date of birth', 'Low facial match score', 'Selfie image may be blurry'],
    processingTime: 3800,
    nextOfKin: { name: 'Kofi Owusu', phone: '+233 24 111 2233', relationship: 'Father' },
    addressInfo: { houseNumber: '8', street: 'Market Circle', area: 'Takoradi', city: 'Takoradi', region: 'Western', digitalAddress: 'WE-890-5678' },
    kycLevel: 'none',
    expiresAt: '2025-11-10T11:45:00Z',
  },
];

// ---- Admin Store ----
interface AdminState {
  user: User;
  stats: SystemStats;
  allUsers: User[];
  allLoans: Loan[];
  allAgents: Agent[];
  allBranches: Branch[];
  allSusuGroups: SusuGroup[];
  complianceReports: ComplianceReport[];
  activityLogs: ActivityLog[];
  allDisputes: Dispute[];
  kycRecords: KYCVerificationRecord[];
  activePage: string;

  setActivePage: (page: string) => void;
  approveLoan: (loanId: string) => void;
  rejectLoan: (loanId: string, reason: string) => void;
  resolveDispute: (disputeId: string, resolution: string) => void;
  disburseLoan: (loanId: string, method: 'momo' | 'bank', number: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  user: currentAdmin,
  stats: systemStats,
  allUsers: users,
  allLoans: loans,
  allAgents: agents,
  allBranches: branches,
  allSusuGroups: susuGroups,
  complianceReports: complianceReports,
  activityLogs: activityLogs,
  allDisputes: disputes,
  kycRecords: mockKYCRecords,
  activePage: 'dashboard',

  setActivePage: (page) => set({ activePage: page }),

  approveLoan: (loanId) => {
    set((s) => ({
      allLoans: s.allLoans.map(l =>
        l.id === loanId ? { ...l, status: 'approved' as const, reviewedBy: 'Daniel Tetteh', reviewDate: new Date().toISOString() } : l
      ),
    }));
  },

  rejectLoan: (loanId, reason) => {
    set((s) => ({
      allLoans: s.allLoans.map(l =>
        l.id === loanId ? { ...l, status: 'rejected' as const, reviewedBy: 'Daniel Tetteh', reviewDate: new Date().toISOString(), rejectReason: reason } : l
      ),
    }));
  },

  resolveDispute: (disputeId, resolution) => {
    set((s) => ({
      allDisputes: s.allDisputes.map(d =>
        d.id === disputeId ? { ...d, status: 'resolved' as const, resolution, updatedAt: new Date().toISOString() } : d
      ),
    }));
  },

  disburseLoan: (loanId, method, number) => {
    set((s) => {
      const loan = s.allLoans.find(l => l.id === loanId);
      if (!loan) return s;

      const totalInterest = loan.interestType === 'flat'
        ? loan.amount * (loan.interestRate / 100)
        : loan.amount * (loan.interestRate / 100);
      const totalRepayment = loan.amount + totalInterest;
      const term = loan.term;
      const numPayments = loan.repaymentFrequency === 'daily' && loan.termUnit === 'days'
        ? term
        : loan.repaymentFrequency === 'weekly' && loan.termUnit === 'weeks'
          ? term
          : loan.repaymentFrequency === 'monthly' && loan.termUnit === 'months'
            ? term
            : term;

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      if (loan.termUnit === 'days') endDate.setDate(endDate.getDate() + term);
      else if (loan.termUnit === 'weeks') endDate.setDate(endDate.getDate() + term * 7);
      else endDate.setMonth(endDate.getMonth() + term);

      // Generate schedule
      const schedule: RepaymentScheduleEntry[] = [];
      const start = new Date(startDate);
      for (let i = 0; i < numPayments; i++) {
        const dueDate = new Date(start);
        if (loan.repaymentFrequency === 'daily') dueDate.setDate(dueDate.getDate() + i + 1);
        else if (loan.repaymentFrequency === 'weekly') dueDate.setDate(dueDate.getDate() + (i + 1) * 7);
        else dueDate.setMonth(dueDate.getMonth() + i + 1);

        const isLast = i === numPayments - 1;
        const perPrincipal = Math.round((loan.amount / numPayments) * 100) / 100;
        const perInterest = Math.round((totalInterest / numPayments) * 100) / 100;
        schedule.push({
          dueDate: dueDate.toISOString().split('T')[0],
          amount: perPrincipal + perInterest,
          principal: perPrincipal,
          interest: perInterest,
          status: 'pending',
        });
      }

      return {
        allLoans: s.allLoans.map(l =>
          l.id === loanId
            ? {
                ...l,
                status: 'active' as const,
                disbursementDate: new Date().toISOString().split('T')[0],
                startDate,
                endDate: endDate.toISOString().split('T')[0],
                monthlyPayment: Math.round(totalRepayment / numPayments * 100) / 100,
                disbursementMethod: method,
                disbursementNumber: number,
                disbursementProvider: method === 'momo' ? 'Mobile Money' : undefined,
                repaymentSchedule: schedule,
                totalInterest,
                reviewedBy: 'Daniel Tetteh',
                reviewDate: new Date().toISOString(),
              }
            : l
        ),
      };
    });
  },
}));

// ---- Treasurer Store ----
interface TreasurerState {
  user: User;
  managedGroups: SusuGroup[];
  allContributions: SusuContribution[];
  payouts: SusuPayout[];
  allMembers: User[];
  activePage: string;

  setActivePage: (page: string) => void;
  processPayout: (payoutId: string) => void;
}

export const useTreasurerStore = create<TreasurerState>((set) => ({
  user: currentTreasurer,
  managedGroups: susuGroups,
  allContributions: susuContributions,
  payouts: susuPayouts,
  allMembers: users.filter(u => u.role === 'customer'),
  activePage: 'dashboard',

  setActivePage: (page) => set({ activePage: page }),

  processPayout: (payoutId) => {
    set((s) => ({
      payouts: s.payouts.map(p =>
        p.id === payoutId ? { ...p, status: 'completed' as const } : p
      ),
    }));
  },
}));

// ---- Platform Configuration Store ----

const defaultCompanyDetails: CompanyDetails = {
  companyName: '',
  tradingName: '',
  registrationNumber: '',
  taxIdentificationNumber: '',
  companyType: 'limited_liability',
  industry: 'Microfinance & Savings',
  description: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  region: 'Greater Accra',
  digitalAddress: '',
  primaryColor: '#2563EB',
  secondaryColor: '#F59E0B',
  currency: 'GHS',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Africa/Accra',
  fiscalYearStart: 'January',
  enableCustomerRegistration: true,
  enableAgentRegistration: true,
  defaultLanguage: 'en',
  maxDailyTransactionLimit: 50000,
  maxSingleTransactionLimit: 10000,
  minSusuContribution: 1,
  maxSusuContribution: 50000,
};

const defaultHubtelPayment: PaymentGatewayConfig = {
  id: 'hubtel',
  name: 'Hubtel',
  description: 'Ghana\'s leading payment platform for mobile money, card, and bank transfer payments',
  icon: 'H',
  website: 'https://hubtel.com',
  status: 'inactive',
  credentials: { clientId: '', clientSecret: '', apiKey: '', merchantAccountNumber: '', webhookUrl: '', callbackUrl: '' },
  supportedMethods: ['momo', 'card', 'bank_transfer', 'qr'],
  enabledForDeposits: false,
  enabledForWithdrawals: false,
  enabledForLoanDisbursement: false,
  enabledForSusuPayouts: false,
  transactionFeePercent: 1.0,
  flatFee: 0.50,
};

const defaultPaystackPayment: PaymentGatewayConfig = {
  id: 'paystack',
  name: 'Paystack',
  description: 'Pan-African payment gateway supporting mobile money, card, and bank transfers',
  icon: 'P',
  website: 'https://paystack.com',
  status: 'inactive',
  credentials: { clientId: '', clientSecret: '', apiKey: '', webhookUrl: '', callbackUrl: '' },
  supportedMethods: ['momo', 'card', 'bank_transfer'],
  enabledForDeposits: false,
  enabledForWithdrawals: false,
  enabledForLoanDisbursement: false,
  enabledForSusuPayouts: false,
  transactionFeePercent: 1.5,
  flatFee: 0.00,
};

const defaultHubtelSMS: SMSProviderConfig = {
  id: 'hubtel',
  name: 'Hubtel SMS',
  description: 'Ghana\'s most reliable SMS gateway with OTP, notifications, and marketing SMS',
  icon: 'H',
  website: 'https://hubtel.com/sms',
  status: 'inactive',
  credentials: { apiKey: '', senderId: 'iSusuPro' },
  enabledForOTP: false,
  enabledForNotifications: false,
  enabledForMarketing: false,
  enabledForAlerts: false,
  otpExpirySeconds: 300,
  maxOTPRetry: 3,
  smsPerDayLimit: 10000,
};

const defaultArkeselSMS: SMSProviderConfig = {
  id: 'arkesel',
  name: 'Arkesel',
  description: 'Developer-friendly SMS API for OTP verification and bulk messaging in Ghana',
  icon: 'A',
  website: 'https://arkesel.com',
  status: 'inactive',
  credentials: { apiKey: '', senderId: 'iSusuPro' },
  enabledForOTP: false,
  enabledForNotifications: false,
  enabledForMarketing: false,
  enabledForAlerts: false,
  otpExpirySeconds: 300,
  maxOTPRetry: 3,
  smsPerDayLimit: 50000,
};

interface ConfigState {
  company: CompanyDetails;
  paymentGateways: PaymentGatewayConfig[];
  smsProviders: SMSProviderConfig[];
  activePaymentGateway: PaymentGatewayId | null;
  activeSMSProvider: SMSProviderId | null;

  updateCompanyDetails: (details: Partial<CompanyDetails>) => void;
  updatePaymentGateway: (id: PaymentGatewayId, updates: Partial<PaymentGatewayConfig>) => void;
  updatePaymentCredentials: (id: PaymentGatewayId, creds: Partial<PaymentGatewayCredential>) => void;
  setActivePaymentGateway: (id: PaymentGatewayId | null) => void;
  testPaymentGateway: (id: PaymentGatewayId) => void;
  updateSMSProvider: (id: SMSProviderId, updates: Partial<SMSProviderConfig>) => void;
  updateSMSCredentials: (id: SMSProviderId, creds: Partial<SMSCredential>) => void;
  setActiveSMSProvider: (id: SMSProviderId | null) => void;
  testSMSProvider: (id: SMSProviderId) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  company: { ...defaultCompanyDetails },
  paymentGateways: [{ ...defaultHubtelPayment }, { ...defaultPaystackPayment }],
  smsProviders: [{ ...defaultHubtelSMS }, { ...defaultArkeselSMS }],
  activePaymentGateway: null,
  activeSMSProvider: null,

  updateCompanyDetails: (details) => set((s) => ({
    company: { ...s.company, ...details },
  })),

  updatePaymentGateway: (id, updates) => set((s) => ({
    paymentGateways: s.paymentGateways.map(gw =>
      gw.id === id ? { ...gw, ...updates } : gw
    ),
  })),

  updatePaymentCredentials: (id, creds) => set((s) => ({
    paymentGateways: s.paymentGateways.map(gw =>
      gw.id === id ? { ...gw, credentials: { ...gw.credentials, ...creds } } : gw
    ),
  })),

  setActivePaymentGateway: (id) => set((s) => ({
    activePaymentGateway: id,
    paymentGateways: s.paymentGateways.map(gw => ({
      ...gw,
      status: gw.id === id ? 'active' as PaymentGatewayStatus : 'inactive' as PaymentGatewayStatus,
    })),
  })),

  testPaymentGateway: (id) => set((s) => ({
    paymentGateways: s.paymentGateways.map(gw =>
      gw.id === id
        ? { ...gw, lastTested: new Date().toISOString(), testSuccessful: true }
        : gw
    ),
  })),

  updateSMSProvider: (id, updates) => set((s) => ({
    smsProviders: s.smsProviders.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),

  updateSMSCredentials: (id, creds) => set((s) => ({
    smsProviders: s.smsProviders.map(p =>
      p.id === id ? { ...p, credentials: { ...p.credentials, ...creds } } : p
    ),
  })),

  setActiveSMSProvider: (id) => set((s) => ({
    activeSMSProvider: id,
    smsProviders: s.smsProviders.map(p => ({
      ...p,
      status: p.id === id ? 'active' as SMSProviderStatus : 'inactive' as SMSProviderStatus,
    })),
  })),

  testSMSProvider: (id) => set((s) => ({
    smsProviders: s.smsProviders.map(p =>
      p.id === id
        ? { ...p, lastTested: new Date().toISOString(), testSuccessful: true }
        : p
    ),
  })),
}));

// ---- KYC Verification Store ----
interface KYCState {
  records: KYCVerificationRecord[];

  addVerificationRecord: (record: Omit<KYCVerificationRecord, 'id' | 'status' | 'submittedAt'>) => string;
  approveKYC: (recordId: string, reviewerName: string) => void;
  rejectKYC: (recordId: string, reviewerName: string, reason: string) => void;
  getRecordByUserId: (userId: string) => KYCVerificationRecord | undefined;
}

export const useKYCStore = create<KYCState>((set, get) => ({
  records: mockKYCRecords,

  addVerificationRecord: (record) => {
    const id = `kyc-${Date.now()}`;
    const newRecord: KYCVerificationRecord = {
      ...record,
      id,
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
    };
    set((s) => ({ records: [newRecord, ...s.records] }));
    return id;
  },

  approveKYC: (recordId, reviewerName) => {
    set((s) => ({
      records: s.records.map(r =>
        r.id === recordId
          ? { ...r, status: 'approved' as const, reviewedBy: reviewerName, reviewedAt: new Date().toISOString(), kycLevel: 'full' as const }
          : r
      ),
    }));
  },

  rejectKYC: (recordId, reviewerName, reason) => {
    set((s) => ({
      records: s.records.map(r =>
        r.id === recordId
          ? { ...r, status: 'rejected' as const, reviewedBy: reviewerName, reviewedAt: new Date().toISOString(), rejectionReason: reason }
          : r
      ),
    }));
  },

  getRecordByUserId: (userId) => {
    return get().records.find(r => r.userId === userId);
  },
}));

// ============================================
// MOCK DATA FOR NEW MODULES
// ============================================

// -- Payroll Employees --
const mockPayrollEmployees: PayrollEmployee[] = [
  { id: 'emp-001', employeeId: 'EMP001', name: 'Daniel Tetteh', position: 'Operations Manager', department: 'Operations', branch: 'Head Office', phone: '+233 24 123 4567', email: 'daniel.tetteh@isusupro.com', bankName: 'GCB Bank', bankAccount: '0123456789', ssnitNumber: 'SSNIT-001234567', tinNumber: 'TIN-0001234567', ghanaCardId: 'GHA-123456789-0', basicSalary: 4500, housingAllowance: 600, transportAllowance: 400, otherAllowances: 200, status: 'active', dateJoined: '2022-01-15', contractType: 'permanent', payGrade: 'M3' },
  { id: 'emp-002', employeeId: 'EMP002', name: 'Abena Amoah', position: 'Finance Lead', department: 'Finance', branch: 'Head Office', phone: '+233 20 987 6543', email: 'abena.amoah@isusupro.com', bankName: 'Ecobank', bankAccount: '0234567890', ssnitNumber: 'SSNIT-002345678', tinNumber: 'TIN-0002345678', ghanaCardId: 'GHA-234567890-1', basicSalary: 5200, housingAllowance: 700, transportAllowance: 450, otherAllowances: 250, status: 'active', dateJoined: '2021-06-01', contractType: 'permanent', payGrade: 'M4' },
  { id: 'emp-003', employeeId: 'EMP003', name: 'Kwame Boateng', position: 'Field Agent Supervisor', department: 'Field Operations', branch: 'Kumasi', phone: '+233 27 456 7890', email: 'kwame.boateng@isusupro.com', bankName: 'CalBank', bankAccount: '0345678901', ssnitNumber: 'SSNIT-003456789', tinNumber: 'TIN-0003456789', ghanaCardId: 'GHA-345678901-2', basicSalary: 3200, housingAllowance: 400, transportAllowance: 350, otherAllowances: 150, status: 'active', dateJoined: '2023-03-10', contractType: 'permanent', payGrade: 'M2' },
  { id: 'emp-004', employeeId: 'EMP004', name: 'Adwoa Mensah', position: 'Customer Service Officer', department: 'Customer Service', branch: 'Accra', phone: '+233 50 111 2233', email: 'adwoa.mensah@isusupro.com', bankName: 'Fidelity Bank', bankAccount: '0456789012', ssnitNumber: 'SSNIT-004567890', tinNumber: 'TIN-0004567890', ghanaCardId: 'GHA-456789012-3', basicSalary: 2200, housingAllowance: 250, transportAllowance: 200, otherAllowances: 100, status: 'active', dateJoined: '2024-01-15', contractType: 'probation', payGrade: 'J3' },
  { id: 'emp-005', employeeId: 'EMP005', name: 'Emmanuel Darko', position: 'IT Support Specialist', department: 'IT', branch: 'Head Office', phone: '+233 24 555 6677', email: 'emmanuel.darko@isusupro.com', bankName: 'Stanbic Bank', bankAccount: '0567890123', ssnitNumber: 'SSNIT-005678901', tinNumber: 'TIN-0005678901', ghanaCardId: 'GHA-567890123-4', basicSalary: 3500, housingAllowance: 500, transportAllowance: 400, otherAllowances: 200, status: 'active', dateJoined: '2023-07-01', contractType: 'permanent', payGrade: 'M2' },
  { id: 'emp-006', employeeId: 'EMP006', name: 'Felicia Osei', position: 'Treasurer', department: 'Field Operations', branch: 'Tema', phone: '+233 20 888 9900', email: 'felicia.osei@isusupro.com', bankName: 'GCB Bank', bankAccount: '0678901234', ssnitNumber: 'SSNIT-006789012', tinNumber: 'TIN-0006789012', ghanaCardId: 'GHA-678901234-5', basicSalary: 2800, housingAllowance: 350, transportAllowance: 300, otherAllowances: 150, status: 'active', dateJoined: '2022-09-15', contractType: 'permanent', payGrade: 'M1' },
  { id: 'emp-007', employeeId: 'EMP007', name: 'Kwasi Frimpong', position: 'National Service Personnel', department: 'Marketing', branch: 'Head Office', phone: '+233 27 333 4455', email: 'kwasi.frimpong@isusupro.com', bankName: 'UBA', bankAccount: '0789012345', ssnitNumber: 'SSNIT-007890123', tinNumber: 'TIN-0007890123', ghanaCardId: 'GHA-789012345-6', basicSalary: 800, housingAllowance: 0, transportAllowance: 200, otherAllowances: 50, status: 'active', dateJoined: '2025-09-01', contractType: 'national_service', payGrade: 'J1' },
  { id: 'emp-008', employeeId: 'EMP008', name: 'Grace Nartey', position: 'Compliance Officer', department: 'Compliance', branch: 'Head Office', phone: '+233 24 222 3344', email: 'grace.nartey@isusupro.com', bankName: 'Standard Chartered', bankAccount: '0890123456', ssnitNumber: 'SSNIT-008901234', tinNumber: 'TIN-0008901234', ghanaCardId: 'GHA-890123456-7', basicSalary: 4200, housingAllowance: 550, transportAllowance: 400, otherAllowances: 200, status: 'on_leave', dateJoined: '2022-04-01', contractType: 'permanent', payGrade: 'M3' },
];

// -- Payroll Runs --
const mockPayrollRuns: PayrollRun[] = [
  { id: 'pr-001', period: 'March 2026', payDate: '2026-03-31', totalEmployees: 7, totalGrossPay: 35750, totalDeductions: 6320, totalNetPay: 29430, totalSSNIT: 8231, totalPAYE: 3520, status: 'paid', createdAt: '2026-03-25T10:00:00Z', approvedBy: 'Daniel Tetteh', paidAt: '2026-03-31T09:00:00Z' },
  { id: 'pr-002', period: 'April 2026', payDate: '2026-04-30', totalEmployees: 8, totalGrossPay: 38500, totalDeductions: 6850, totalNetPay: 31650, totalSSNIT: 8925, totalPAYE: 3875, status: 'approved', createdAt: '2026-04-25T10:00:00Z', approvedBy: 'Daniel Tetteh' },
  { id: 'pr-003', period: 'May 2026', payDate: '2026-05-31', totalEmployees: 8, totalGrossPay: 38500, totalDeductions: 0, totalNetPay: 0, totalSSNIT: 0, totalPAYE: 0, status: 'draft', createdAt: '2026-04-28T10:00:00Z' },
];

// -- Payslips --
const mockPayslips: Payslip[] = [
  { id: 'ps-001', payrollRunId: 'pr-001', employeeId: 'emp-001', employeeName: 'Daniel Tetteh', position: 'Operations Manager', department: 'Operations', period: 'March 2026', payDate: '2026-03-31', basicSalary: 4500, housingAllowance: 600, transportAllowance: 400, otherAllowances: 200, overtimePay: 0, bonus: 0, grossPay: 5700, ssnitEmployee: 247.5, tier2Employee: 225, payeTax: 718.75, nhfDeduction: 0, otherDeductions: 0, loanDeduction: 0, totalDeductions: 1191.25, netPay: 4508.75, ssnitEmployer: 607.5, tier2Employer: 225, status: 'paid' },
  { id: 'ps-002', payrollRunId: 'pr-001', employeeId: 'emp-002', employeeName: 'Abena Amoah', position: 'Finance Lead', department: 'Finance', period: 'March 2026', payDate: '2026-03-31', basicSalary: 5200, housingAllowance: 700, transportAllowance: 450, otherAllowances: 250, overtimePay: 0, bonus: 0, grossPay: 6600, ssnitEmployee: 286, tier2Employee: 260, payeTax: 981.25, nhfDeduction: 0, otherDeductions: 0, loanDeduction: 0, totalDeductions: 1527.25, netPay: 5072.75, ssnitEmployer: 702, tier2Employer: 260, status: 'paid' },
  { id: 'ps-003', payrollRunId: 'pr-001', employeeId: 'emp-004', employeeName: 'Adwoa Mensah', position: 'Customer Service Officer', department: 'Customer Service', period: 'March 2026', payDate: '2026-03-31', basicSalary: 2200, housingAllowance: 250, transportAllowance: 200, otherAllowances: 100, overtimePay: 0, bonus: 0, grossPay: 2750, ssnitEmployee: 121, tier2Employee: 110, payeTax: 237.5, nhfDeduction: 0, otherDeductions: 0, loanDeduction: 0, totalDeductions: 468.5, netPay: 2281.5, ssnitEmployer: 297, tier2Employer: 110, status: 'paid' },
];

// -- SSNIT Contributions --
const mockSSNITContributions: SSNITContribution[] = [
  { id: 'ssnit-001', employeeId: 'emp-001', employeeName: 'Daniel Tetteh', ssnitNumber: 'SSNIT-001234567', period: 'March 2026', basicSalary: 4500, employeeContribution: 247.5, employerContribution: 607.5, tier2Employer: 225, totalContribution: 1080, paymentDate: '2026-04-10', status: 'paid', reference: 'SSNIT-202603-001' },
  { id: 'ssnit-002', employeeId: 'emp-002', employeeName: 'Abena Amoah', ssnitNumber: 'SSNIT-002345678', period: 'March 2026', basicSalary: 5200, employeeContribution: 286, employerContribution: 702, tier2Employer: 260, totalContribution: 1248, paymentDate: '2026-04-10', status: 'paid', reference: 'SSNIT-202603-002' },
  { id: 'ssnit-003', employeeId: 'emp-003', employeeName: 'Kwame Boateng', ssnitNumber: 'SSNIT-003456789', period: 'March 2026', basicSalary: 3200, employeeContribution: 176, employerContribution: 432, tier2Employer: 160, totalContribution: 768, paymentDate: '2026-04-10', status: 'paid', reference: 'SSNIT-202603-003' },
  { id: 'ssnit-004', employeeId: 'emp-004', employeeName: 'Adwoa Mensah', ssnitNumber: 'SSNIT-004567890', period: 'March 2026', basicSalary: 2200, employeeContribution: 121, employerContribution: 297, tier2Employer: 110, totalContribution: 528, paymentDate: '2026-04-10', status: 'paid', reference: 'SSNIT-202603-004' },
  { id: 'ssnit-005', employeeId: 'emp-001', employeeName: 'Daniel Tetteh', ssnitNumber: 'SSNIT-001234567', period: 'April 2026', basicSalary: 4500, employeeContribution: 247.5, employerContribution: 607.5, tier2Employer: 225, totalContribution: 1080, status: 'pending', reference: 'SSNIT-202604-001' },
  { id: 'ssnit-006', employeeId: 'emp-002', employeeName: 'Abena Amoah', ssnitNumber: 'SSNIT-002345678', period: 'April 2026', basicSalary: 5200, employeeContribution: 286, employerContribution: 702, tier2Employer: 260, totalContribution: 1248, status: 'pending', reference: 'SSNIT-202604-002' },
];

// -- SSNIT Filings --
const mockSSNITFilings: SSNITFiling[] = [
  { id: 'sf-001', period: 'January 2026', totalEmployees: 7, totalEmployeeContributions: 1780, totalEmployerContributions: 4382, totalTier2: 1620, grandTotal: 7782, filingDate: '2026-02-10', paymentDate: '2026-02-12', status: 'paid', reference: 'SSF-202601', ssnitReceiptNumber: 'RCP-2026-001234' },
  { id: 'sf-002', period: 'February 2026', totalEmployees: 7, totalEmployeeContributions: 1780, totalEmployerContributions: 4382, totalTier2: 1620, grandTotal: 7782, filingDate: '2026-03-10', paymentDate: '2026-03-12', status: 'paid', reference: 'SSF-202602', ssnitReceiptNumber: 'RCP-2026-001235' },
  { id: 'sf-003', period: 'March 2026', totalEmployees: 7, totalEmployeeContributions: 1856, totalEmployerContributions: 4558, totalTier2: 1690, grandTotal: 8104, filingDate: '2026-04-10', paymentDate: '2026-04-12', status: 'paid', reference: 'SSF-202603', ssnitReceiptNumber: 'RCP-2026-001236' },
  { id: 'sf-004', period: 'April 2026', totalEmployees: 8, totalEmployeeContributions: 1989, totalEmployerContributions: 4884, totalTier2: 1810, grandTotal: 8683, filingDate: '2026-04-28', status: 'submitted', reference: 'SSF-202604' },
];

// -- GRA Tax Filings --
const mockTAXFilings: TAXFiling[] = [
  { id: 'tax-001', taxType: 'paye', period: 'March 2026', taxpayerName: 'iSusuPro Ghana Ltd', tin: 'P0001234567', totalTax: 3520, filingDate: '2026-04-14', paymentDate: '2026-04-14', dueDate: '2026-04-15', status: 'paid', reference: 'GRA-PAYE-202603' },
  { id: 'tax-002', taxType: 'vat', period: 'Q1 2026', taxpayerName: 'iSusuPro Ghana Ltd', tin: 'P0001234567', totalTax: 4250, filingDate: '2026-04-30', paymentDate: '2026-04-30', dueDate: '2026-04-30', status: 'paid', reference: 'GRA-VAT-Q1-2026' },
  { id: 'tax-003', taxType: 'withholding', period: 'March 2026', taxpayerName: 'iSusuPro Ghana Ltd', tin: 'P0001234567', totalTax: 1200, filingDate: '2026-04-14', dueDate: '2026-04-15', status: 'paid', reference: 'GRA-WHT-202603' },
  { id: 'tax-004', taxType: 'paye', period: 'April 2026', taxpayerName: 'iSusuPro Ghana Ltd', tin: 'P0001234567', totalTax: 3875, filingDate: '2026-04-28', dueDate: '2026-05-15', status: 'filed', reference: 'GRA-PAYE-202604' },
  { id: 'tax-005', taxType: 'nhil', period: 'Q1 2026', taxpayerName: 'iSusuPro Ghana Ltd', tin: 'P0001234567', totalTax: 850, filingDate: '2026-04-30', dueDate: '2026-04-30', status: 'paid', reference: 'GRA-NHIL-Q1-2026' },
  { id: 'tax-006', taxType: 'getfund', period: 'Q1 2026', taxpayerName: 'iSusuPro Ghana Ltd', tin: 'P0001234567', totalTax: 850, filingDate: '2026-04-30', dueDate: '2026-04-30', status: 'paid', reference: 'GRA-GETF-Q1-2026' },
];

// -- GRA Tax Payments --
const mockTAXPayments: TAXPayment[] = [
  { id: 'tp-001', taxType: 'paye', amount: 3520, penaltyAmount: 0, totalAmount: 3520, paymentDate: '2026-04-14', method: 'bank_transfer', reference: 'PAY-REF-001', period: 'March 2026', status: 'completed' },
  { id: 'tp-002', taxType: 'vat', amount: 4250, penaltyAmount: 0, totalAmount: 4250, paymentDate: '2026-04-30', method: 'bank_transfer', reference: 'PAY-REF-002', period: 'Q1 2026', status: 'completed' },
  { id: 'tp-003', taxType: 'withholding', amount: 1200, penaltyAmount: 0, totalAmount: 1200, paymentDate: '2026-04-14', method: 'bank_transfer', reference: 'PAY-REF-003', period: 'March 2026', status: 'completed' },
  { id: 'tp-004', taxType: 'nhil', amount: 850, penaltyAmount: 0, totalAmount: 850, paymentDate: '2026-04-30', method: 'bank_transfer', reference: 'PAY-REF-004', period: 'Q1 2026', status: 'completed' },
];

// -- Tax Calendar --
const mockTaxCalendar: TAXCalendarItem[] = [
  { id: 'tc-001', taxType: 'paye', name: 'PAYE Income Tax', description: 'Monthly PAYE deductions remittance to GRA', dueDay: 15, frequency: 'monthly', penaltyPercent: 5, nextDueDate: '2026-05-15' },
  { id: 'tc-002', taxType: 'vat', name: 'VAT Returns', description: 'Quarterly VAT + NHIL + GETFund filing and payment', dueDay: 30, frequency: 'quarterly', penaltyPercent: 5, nextDueDate: '2026-06-30' },
  { id: 'tc-003', taxType: 'withholding', name: 'Withholding Tax', description: 'Monthly withholding tax on contractor payments', dueDay: 15, frequency: 'monthly', penaltyPercent: 5, nextDueDate: '2026-05-15' },
  { id: 'tc-004', taxType: 'nhil', name: 'NHIL Levy', description: 'National Health Insurance Levy (filed with VAT)', dueDay: 30, frequency: 'quarterly', penaltyPercent: 5, nextDueDate: '2026-06-30' },
  { id: 'tc-005', taxType: 'getfund', name: 'GETFund Levy', description: 'Ghana Education Trust Fund levy (filed with VAT)', dueDay: 30, frequency: 'quarterly', penaltyPercent: 5, nextDueDate: '2026-06-30' },
  { id: 'tc-006', taxType: 'income_tax', name: 'Annual Income Tax', description: 'Corporate income tax annual return', dueDay: 30, frequency: 'annually', penaltyPercent: 10, nextDueDate: '2027-04-30' },
];

// -- Airtime Products --
const mockAirtimeProducts: AirtimeProduct[] = [
  { id: 'at-001', provider: 'mtn', name: 'MTN 1hr', type: 'airtime', description: 'GH1 Airtime - All Networks', price: 1, value: 1, validity: 'Lifetime', popular: false },
  { id: 'at-002', provider: 'mtn', name: 'MTN 5hr', type: 'airtime', description: 'GH5 Airtime - All Networks', price: 5, value: 5, validity: 'Lifetime', popular: true },
  { id: 'at-003', provider: 'mtn', name: 'MTN 10hr', type: 'airtime', description: 'GH10 Airtime - All Networks', price: 10, value: 10, validity: 'Lifetime', popular: true },
  { id: 'at-004', provider: 'mtn', name: 'MTN 20hr', type: 'airtime', description: 'GH20 Airtime - All Networks', price: 20, value: 20, validity: 'Lifetime', popular: false },
  { id: 'at-005', provider: 'telecel', name: 'Telecel 5hr', type: 'airtime', description: 'GH5 Airtime', price: 5, value: 5, validity: 'Lifetime', popular: true },
  { id: 'at-006', provider: 'telecel', name: 'Telecel 10hr', type: 'airtime', description: 'GH10 Airtime', price: 10, value: 10, validity: 'Lifetime', popular: true },
  { id: 'at-007', provider: 'atum', name: 'AT 5hr', type: 'airtime', description: 'GH5 Airtime', price: 5, value: 5, validity: 'Lifetime', popular: false },
  { id: 'at-008', provider: 'mtn', name: 'MTN 1GB', type: 'data', description: '1GB Data - 7 Days', price: 7.5, value: 1024, validity: '7 days', popular: true },
  { id: 'at-009', provider: 'mtn', name: 'MTN 3.5GB', type: 'data', description: '3.5GB Data - 30 Days', price: 20, value: 3584, validity: '30 days', popular: true },
  { id: 'at-010', provider: 'mtn', name: 'MTN 10GB', type: 'data', description: '10GB Data - 30 Days', price: 50, value: 10240, validity: '30 days', popular: false },
  { id: 'at-011', provider: 'telecel', name: 'Telecel 1GB', type: 'data', description: '1GB Data - 7 Days', price: 7, value: 1024, validity: '7 days', popular: true },
  { id: 'at-012', provider: 'telecel', name: 'Telecel 5GB', type: 'data', description: '5GB Data - 30 Days', price: 30, value: 5120, validity: '30 days', popular: false },
  { id: 'at-013', provider: 'atum', name: 'AT 1GB', type: 'data', description: '1GB Data - 7 Days', price: 8, value: 1024, validity: '7 days', popular: false },
  { id: 'at-014', provider: 'mtn', name: 'MTN Flexi 15', type: 'bundle', description: '400mins + 5GB + GH10 Airtime - 30 Days', price: 35, value: 0, validity: '30 days', popular: true },
  { id: 'at-015', provider: 'telecel', name: 'Telecel Xtra 15', type: 'bundle', description: '300mins + 3GB + GH10 Airtime - 30 Days', price: 30, value: 0, validity: '30 days', popular: false },
];

// -- Airtime Transactions --
const mockAirtimeTransactions: AirtimeTransaction[] = [
  { id: 'att-001', userId: 'usr-001', provider: 'mtn', recipientPhone: '+233 24 123 4567', type: 'airtime', productName: 'MTN 10hr', amount: 10, status: 'completed', reference: 'ATT-20260418-001', date: '2026-04-17T14:30:00Z', balanceAfter: 4520 },
  { id: 'att-002', userId: 'usr-001', provider: 'mtn', recipientPhone: '+233 24 123 4567', type: 'data', productName: 'MTN 3.5GB', amount: 20, status: 'completed', reference: 'ATT-20260415-002', date: '2026-04-15T10:00:00Z', balanceAfter: 4530 },
  { id: 'att-003', userId: 'usr-001', provider: 'telecel', recipientPhone: '+233 20 987 6543', recipientName: 'Kofi Asante', type: 'airtime', productName: 'Telecel 5hr', amount: 5, status: 'completed', reference: 'ATT-20260412-003', date: '2026-04-12T16:00:00Z', balanceAfter: 4550 },
  { id: 'att-004', userId: 'usr-001', provider: 'mtn', recipientPhone: '+233 24 123 4567', type: 'bundle', productName: 'MTN Flexi 15', amount: 35, status: 'completed', reference: 'ATT-20260410-004', date: '2026-04-10T09:00:00Z', balanceAfter: 4555 },
];

// -- Billers --
const mockBillers: Biller[] = [
  { id: 'bill-ecg-pre', name: 'ECG Prepaid', category: 'electricity', logo: 'Z', fieldLabel: 'Meter Number', fieldPlaceholder: 'Enter your ECG meter number', supportedPaymentMethods: ['momo', 'card', 'bank_transfer'], isActive: true },
  { id: 'bill-ecg-post', name: 'ECG Postpaid', category: 'electricity', logo: 'Z', fieldLabel: 'Account Number', fieldPlaceholder: 'Enter your ECG account number', supportedPaymentMethods: ['momo', 'card', 'bank_transfer'], isActive: true },
  { id: 'bill-gwcl', name: 'Ghana Water', category: 'water', logo: 'G', fieldLabel: 'Account Number', fieldPlaceholder: 'Enter your GWCL account number', supportedPaymentMethods: ['momo', 'card'], isActive: true },
  { id: 'bill-dstv', name: 'DSTV', category: 'tv', logo: 'D', fieldLabel: 'Smart Card Number', fieldPlaceholder: 'Enter your DSTV smart card number', supportedPaymentMethods: ['momo', 'card'], isActive: true },
  { id: 'bill-gotv', name: 'GOtv', category: 'tv', logo: 'G', fieldLabel: 'Smart Card Number', fieldPlaceholder: 'Enter your GOtv IUC number', supportedPaymentMethods: ['momo', 'card'], isActive: true },
  { id: 'bill-startimes', name: 'StarTimes', category: 'tv', logo: 'S', fieldLabel: 'Smart Card Number', fieldPlaceholder: 'Enter your StarTimes smart card number', supportedPaymentMethods: ['momo', 'card'], isActive: true },
  { id: 'bill-surfline', name: 'Surfline', category: 'internet', logo: 'S', fieldLabel: 'Account Number', fieldPlaceholder: 'Enter your Surfline account number', supportedPaymentMethods: ['momo', 'card'], isActive: true },
  { id: 'bill-busy', name: 'Busy Internet', category: 'internet', logo: 'B', fieldLabel: 'Account Number', fieldPlaceholder: 'Enter your Busy account number', supportedPaymentMethods: ['momo', 'card'], isActive: true },
  { id: 'bill-dvla', name: 'DVLA', category: 'government', logo: 'D', fieldLabel: 'Application ID', fieldPlaceholder: 'Enter your DVLA application reference', supportedPaymentMethods: ['momo'], isActive: true },
];

// -- Bill Payments --
const mockBillPayments: BillPayment[] = [
  { id: 'bp-001', userId: 'usr-001', billerId: 'bill-ecg-pre', billerName: 'ECG Prepaid', billerCategory: 'electricity', accountNumber: '04123456789', customerName: 'Ama Mensah', amount: 100, fee: 1.5, totalAmount: 101.5, status: 'completed', reference: 'BILL-20260418-001', date: '2026-04-17T15:00:00Z', token: '4758-2916-3847-5621', balanceAfter: 4418.5 },
  { id: 'bp-002', userId: 'usr-001', billerId: 'bill-dstv', billerName: 'DSTV', billerCategory: 'tv', accountNumber: '4123456789', customerName: 'Ama Mensah', amount: 350, fee: 2, totalAmount: 352, status: 'completed', reference: 'BILL-20260410-002', date: '2026-04-10T11:00:00Z', balanceAfter: 4068.5 },
  { id: 'bp-003', userId: 'usr-001', billerId: 'bill-gwcl', billerName: 'Ghana Water', billerCategory: 'water', accountNumber: 'GW-12345678', customerName: 'Ama Mensah', amount: 85, fee: 1.5, totalAmount: 86.5, status: 'completed', reference: 'BILL-20260405-003', date: '2026-04-05T09:30:00Z', balanceAfter: 4420.5 },
  { id: 'bp-004', userId: 'usr-001', billerId: 'bill-surfline', billerName: 'Surfline', billerCategory: 'internet', accountNumber: 'SL-98765432', customerName: 'Ama Mensah', amount: 150, fee: 1, totalAmount: 151, status: 'completed', reference: 'BILL-20260328-004', date: '2026-03-28T14:00:00Z', balanceAfter: 4571.5 },
];

// -- Budgets --
const mockBudgets: Budget[] = [
  { id: 'bgt-001', userId: 'usr-001', category: 'food', categoryName: 'Food & Groceries', allocatedAmount: 800, spentAmount: 620, remainingAmount: 180, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30', color: '#22c55e', icon: 'utensils' },
  { id: 'bgt-002', userId: 'usr-001', category: 'transport', categoryName: 'Transport', allocatedAmount: 400, spentAmount: 310, remainingAmount: 90, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30', color: '#3b82f6', icon: 'car' },
  { id: 'bgt-003', userId: 'usr-001', category: 'utilities', categoryName: 'Utilities (Electricity, Water)', allocatedAmount: 300, spentAmount: 235, remainingAmount: 65, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30', color: '#f59e0b', icon: 'zap' },
  { id: 'bgt-004', userId: 'usr-001', category: 'airtime_data', categoryName: 'Airtime & Data', allocatedAmount: 100, spentAmount: 70, remainingAmount: 30, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30', color: '#8b5cf6', icon: 'smartphone' },
  { id: 'bgt-005', userId: 'usr-001', category: 'entertainment', categoryName: 'Entertainment', allocatedAmount: 200, spentAmount: 245, remainingAmount: -45, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30', color: '#ef4444', icon: 'film' },
  { id: 'bgt-006', userId: 'usr-001', category: 'healthcare', categoryName: 'Healthcare', allocatedAmount: 150, spentAmount: 0, remainingAmount: 150, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30', color: '#ec4899', icon: 'heart-pulse' },
  { id: 'bgt-007', userId: 'usr-001', category: 'savings', categoryName: 'Savings Goal', allocatedAmount: 500, spentAmount: 500, remainingAmount: 0, period: 'monthly', startDate: '2026-04-01', endDate: '2026-04-30', color: '#06b6d4', icon: 'piggy-bank' },
];

// -- Expenses --
const mockExpenses: Expense[] = [
  { id: 'exp-001', userId: 'usr-001', category: 'food', categoryName: 'Food & Groceries', amount: 45, description: 'Makola Market - vegetables and provisions', date: '2026-04-18T10:00:00Z', reference: 'EXP-001', recurring: false },
  { id: 'exp-002', userId: 'usr-001', category: 'transport', categoryName: 'Transport', amount: 15, description: 'Trotro fare - Circle to Osu', date: '2026-04-18T08:30:00Z', reference: 'EXP-002', recurring: false },
  { id: 'exp-003', userId: 'usr-001', category: 'entertainment', categoryName: 'Entertainment', amount: 60, description: 'DSTV subscription - Compact package', date: '2026-04-17T15:00:00Z', reference: 'EXP-003', recurring: true, recurringFrequency: 'monthly' },
  { id: 'exp-004', userId: 'usr-001', category: 'food', categoryName: 'Food & Groceries', amount: 120, description: 'Melcom - weekly groceries', date: '2026-04-16T17:00:00Z', reference: 'EXP-004', recurring: true, recurringFrequency: 'weekly' },
  { id: 'exp-005', userId: 'usr-001', category: 'utilities', categoryName: 'Utilities (Electricity, Water)', amount: 100, description: 'ECG prepaid electricity top-up', date: '2026-04-17T14:00:00Z', reference: 'EXP-005', recurring: false },
  { id: 'exp-006', userId: 'usr-001', category: 'airtime_data', categoryName: 'Airtime & Data', amount: 20, description: 'MTN 3.5GB data bundle', date: '2026-04-15T10:00:00Z', reference: 'EXP-006', recurring: false },
  { id: 'exp-007', userId: 'usr-001', category: 'transport', categoryName: 'Transport', amount: 8, description: 'Uber ride - Airport to Accra Mall', date: '2026-04-14T19:00:00Z', reference: 'EXP-007', recurring: false },
  { id: 'exp-008', userId: 'usr-001', category: 'food', categoryName: 'Food & Groceries', amount: 25, description: 'Buka joint - lunch with colleagues', date: '2026-04-14T13:00:00Z', reference: 'EXP-008', recurring: false },
  { id: 'exp-009', userId: 'usr-001', category: 'healthcare', categoryName: 'Healthcare', amount: 85, description: 'Ghana Water bill payment', date: '2026-04-05T09:30:00Z', reference: 'EXP-009', recurring: false },
  { id: 'exp-010', userId: 'usr-001', category: 'entertainment', categoryName: 'Entertainment', amount: 150, description: 'Palace Mall - Netflix and movie tickets', date: '2026-04-13T20:00:00Z', reference: 'EXP-010', recurring: false },
  { id: 'exp-011', userId: 'usr-001', category: 'savings', categoryName: 'Savings Goal', amount: 500, description: 'Monthly susu contribution', date: '2026-04-01T09:00:00Z', reference: 'EXP-011', recurring: true, recurringFrequency: 'monthly' },
  { id: 'exp-012', userId: 'usr-001', category: 'utilities', categoryName: 'Utilities (Electricity, Water)', amount: 85, description: 'Ghana Water bill payment', date: '2026-04-05T09:30:00Z', reference: 'EXP-012', recurring: false },
  { id: 'exp-013', userId: 'usr-001', category: 'food', categoryName: 'Food & Groceries', amount: 35, description: 'Marina Mall - fruits and snacks', date: '2026-04-12T16:00:00Z', reference: 'EXP-013', recurring: false },
  { id: 'exp-014', userId: 'usr-001', category: 'transport', categoryName: 'Transport', amount: 12, description: 'Okada - Spintex to East Legon', date: '2026-04-11T18:30:00Z', reference: 'EXP-014', recurring: false },
  { id: 'exp-015', userId: 'usr-001', category: 'airtime_data', categoryName: 'Airtime & Data', amount: 50, description: 'MTN Flexi bundle - calls + data', date: '2026-04-10T09:00:00Z', reference: 'EXP-015', recurring: true, recurringFrequency: 'monthly' },
];

// ============================================
// ADMIN EXTENDED STORE (Payroll, SSNIT, Tax)
// ============================================
interface AdminExtendedState {
  // Payroll
  payrollEmployees: PayrollEmployee[];
  payrollRuns: PayrollRun[];
  payslips: Payslip[];
  // SSNIT
  ssnitContributions: SSNITContribution[];
  ssnitFilings: SSNITFiling[];
  // Tax
  taxFilings: TAXFiling[];
  taxPayments: TAXPayment[];
  taxCalendar: TAXCalendarItem[];

  addPayrollEmployee: (emp: Omit<PayrollEmployee, 'id'>) => void;
  updatePayrollEmployee: (id: string, updates: Partial<PayrollEmployee>) => void;
  approvePayrollRun: (runId: string) => void;
  createSSNITFiling: (period: string) => void;
  submitTAXFiling: (filingId: string) => void;
}

export const useAdminExtendedStore = create<AdminExtendedState>((set) => ({
  payrollEmployees: mockPayrollEmployees,
  payrollRuns: mockPayrollRuns,
  payslips: mockPayslips,
  ssnitContributions: mockSSNITContributions,
  ssnitFilings: mockSSNITFilings,
  taxFilings: mockTAXFilings,
  taxPayments: mockTAXPayments,
  taxCalendar: mockTaxCalendar,

  addPayrollEmployee: (emp) => {
    const newEmp: PayrollEmployee = { ...emp, id: `emp-${Date.now()}` };
    set((s) => ({ payrollEmployees: [...s.payrollEmployees, newEmp] }));
  },

  updatePayrollEmployee: (id, updates) => {
    set((s) => ({
      payrollEmployees: s.payrollEmployees.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  },

  approvePayrollRun: (runId) => {
    set((s) => ({
      payrollRuns: s.payrollRuns.map(r =>
        r.id === runId ? { ...r, status: 'approved' as const, approvedBy: 'Daniel Tetteh' } : r
      ),
    }));
  },

  createSSNITFiling: (period) => {
    const newFiling: SSNITFiling = {
      id: `sf-${Date.now()}`,
      period,
      totalEmployees: 8,
      totalEmployeeContributions: 1989,
      totalEmployerContributions: 4884,
      totalTier2: 1810,
      grandTotal: 8683,
      filingDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      reference: `SSF-${period.replace(/\s/g, '')}`,
    };
    set((s) => ({ ssnitFilings: [newFiling, ...s.ssnitFilings] }));
  },

  submitTAXFiling: (filingId) => {
    set((s) => ({
      taxFilings: s.taxFilings.map(f =>
        f.id === filingId ? { ...f, status: 'filed' as const, filingDate: new Date().toISOString().split('T')[0] } : f
      ),
    }));
  },
}));

// ============================================
// CUSTOMER EXTENDED STORE (Airtime, Bills, Budget)
// ============================================
interface CustomerExtendedState {
  airtimeProducts: AirtimeProduct[];
  airtimeTransactions: AirtimeTransaction[];
  billers: Biller[];
  billPayments: BillPayment[];
  budgets: Budget[];
  expenses: Expense[];

  purchaseAirtime: (provider: TelcoProvider, phone: string, productId: string) => void;
  payBill: (billerId: string, accountNumber: string, customerName: string, amount: number) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'remainingAmount'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'reference'>) => void;
}

export const useCustomerExtendedStore = create<CustomerExtendedState>((set) => ({
  airtimeProducts: mockAirtimeProducts,
  airtimeTransactions: mockAirtimeTransactions,
  billers: mockBillers,
  billPayments: mockBillPayments,
  budgets: mockBudgets,
  expenses: mockExpenses,

  purchaseAirtime: (provider, phone, productId) => {
    const product = mockAirtimeProducts.find(p => p.id === productId);
    if (!product) return;
    const newTxn: AirtimeTransaction = {
      id: `att-${Date.now()}`,
      userId: 'usr-001',
      provider,
      recipientPhone: phone,
      type: product.type,
      productName: product.name,
      amount: product.price,
      status: 'completed',
      reference: `ATT-${Date.now()}`,
      date: new Date().toISOString(),
      balanceAfter: 0,
    };
    set((s) => ({ airtimeTransactions: [newTxn, ...s.airtimeTransactions] }));
  },

  payBill: (billerId, accountNumber, customerName, amount) => {
    const biller = mockBillers.find(b => b.id === billerId);
    if (!biller) return;
    const fee = amount * 0.015;
    const newPayment: BillPayment = {
      id: `bp-${Date.now()}`,
      userId: 'usr-001',
      billerId,
      billerName: biller.name,
      billerCategory: biller.category,
      accountNumber,
      customerName,
      amount,
      fee,
      totalAmount: amount + fee,
      status: 'completed',
      reference: `BILL-${Date.now()}`,
      date: new Date().toISOString(),
      token: biller.category === 'electricity' ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      balanceAfter: 0,
    };
    set((s) => ({ billPayments: [newPayment, ...s.billPayments] }));
  },

  addBudget: (budget) => {
    const newBudget: Budget = {
      ...budget,
      id: `bgt-${Date.now()}`,
      userId: 'usr-001',
      remainingAmount: budget.allocatedAmount - budget.spentAmount,
    };
    set((s) => ({ budgets: [...s.budgets, newBudget] }));
  },

  addExpense: (expense) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      userId: 'usr-001',
      reference: `EXP-${Date.now()}`,
    };
    set((s) => {
      const updatedBudgets = s.budgets.map(b =>
        b.category === newExpense.category
          ? { ...b, spentAmount: b.spentAmount + newExpense.amount, remainingAmount: b.remainingAmount - newExpense.amount }
          : b
      );
      return { expenses: [newExpense, ...s.expenses], budgets: updatedBudgets };
    });
  },
}));
