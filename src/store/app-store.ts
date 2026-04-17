// ============================================
// SusuPay Ghana - Zustand State Management
// ============================================
import { create } from 'zustand';
import type {
  PortalId, User, Wallet, SusuGroup, SusuContribution, SusuPayout,
  SavingsGoal, Loan, LoanPayment, Transaction, Notification,
  Agent, CollectionRoute, AgentCommission, SystemStats,
  Branch, ComplianceReport, ActivityLog
} from '@/lib/types';
import {
  currentUser, currentAgent, currentTreasurer, currentAdmin,
  users, customerWallets, susuGroups, susuContributions, susuPayouts,
  savingsGoals, loans, loanPayments, transactions, notifications,
  agents, collectionRoutes, agentCommissions, systemStats, branches,
  complianceReports, activityLogs
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
  activePage: string;

  setActivePage: (page: string) => void;
  makeContribution: (groupId: string, amount: number) => void;
  deposit: (walletId: string, amount: number, provider: string) => void;
  withdraw: (walletId: string, amount: number, provider: string) => void;
  markNotificationRead: (id: string) => void;
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
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
  activePage: string;

  setActivePage: (page: string) => void;
  approveLoan: (loanId: string) => void;
  rejectLoan: (loanId: string, reason: string) => void;
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
