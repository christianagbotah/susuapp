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
  CompanyDetails, PaymentGatewayConfig, PaymentGatewayId, PaymentGatewayCredential, PaymentGatewayStatus,
  SMSProviderConfig, SMSProviderId, SMSCredential, SMSProviderStatus,
} from '@/lib/types';
import {
  currentUser, currentAgent, currentTreasurer, currentAdmin,
  users, customerWallets, susuGroups, susuContributions, susuPayouts,
  savingsGoals, loans, loanPayments, transactions, notifications,
  agents, collectionRoutes, agentCommissions, systemStats, branches,
  complianceReports, activityLogs,
  referrals, recentTransfers, disputes
} from '@/lib/mock-data';
import { generateReference } from '@/lib/formatters';

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
}

export const useCustomerStore = create<CustomerState>((set) => ({
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
}));

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
  activePage: string;

  setActivePage: (page: string) => void;
  approveLoan: (loanId: string) => void;
  rejectLoan: (loanId: string, reason: string) => void;
  resolveDispute: (disputeId: string, resolution: string) => void;
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
