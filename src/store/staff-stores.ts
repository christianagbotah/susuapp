// ============================================
// iSusuPro Ghana — Staff Portal Stores
// Branch Manager · Loan Officer · Teller ·
// Field Supervisor · Accountant · Compliance Officer
// ============================================

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  mockStaff, mockLoanApprovals, mockBranchTargets,
  mockLoanApplications, mockAppraisals, mockPortfolio,
  mockTellerDrawer, mockCounterQueue, mockVaultTransfers, mockEODLines,
  mockSupervisedAgents, mockRoutes, mockSpotChecks,
  mockLedgerEntries, mockChartOfAccounts, mockStatements, mockReconciliations,
  mockAMLAlerts, mockSTRs, mockBOGReturns,
} from '@/lib/staff-data';
import type {
  StaffMember, LoanApprovalRequest, BranchTarget,
  LoanApplication, LoanAppraisal, PortfolioLoan,
  TellerDrawer, CounterTransaction, VaultTransfer, EODReconciliationLine,
  SupervisedAgent, SupervisorRoute, SpotCheck,
  LedgerEntry, ChartOfAccount, FinancialStatement, BankReconciliation,
  AMLAlert, STRReport, BOGReturn, PortalId, User,
} from '@/lib/types';

function staffUser(portal: PortalId, name: string, email: string, phone: string, branch: string): User {
  return {
    id: `usr-${portal}`,
    name,
    email,
    phone,
    role: portal,
    kycLevel: 'full',
    memberSince: '2022-06-01',
    location: branch,
    branch,
  };
}

// ---------------- BRANCH MANAGER ----------------
interface BranchManagerState {
  user: User;
  activePage: string;
  staff: StaffMember[];
  approvals: LoanApprovalRequest[];
  targets: BranchTarget[];
  setActivePage: (page: string) => void;
  decideApproval: (id: string, decision: 'approved' | 'rejected') => void;
  updateStaffStatus: (id: string, status: StaffMember['status']) => void;
  addTarget: (target: Omit<BranchTarget, 'id'>) => void;
}

export const useBranchManagerStore = create<BranchManagerState>()(
  persist(
    (set) => ({
      user: staffUser('branch-manager', 'Kwame Osei', 'kwame.osei@isusupro.com', '024 000 1001', 'Makola Branch, Accra'),
      activePage: 'dashboard',
      staff: mockStaff,
      approvals: mockLoanApprovals,
      targets: mockBranchTargets,
      setActivePage: (page) => set({ activePage: page }),
      decideApproval: (id, decision) => set((s) => ({
        approvals: s.approvals.map((a) => (a.id === id ? { ...a, status: decision } : a)),
      })),
      updateStaffStatus: (id, status) => set((s) => ({
        staff: s.staff.map((m) => (m.id === id ? { ...m, status } : m)),
      })),
      addTarget: (target) => set((s) => ({
        targets: [{ ...target, id: `tgt-${Date.now()}` }, ...s.targets],
      })),
    }),
    { name: 'isusupro-bm' }
  )
);

// ---------------- LOAN OFFICER ----------------
interface LoanOfficerState {
  user: User;
  activePage: string;
  applications: LoanApplication[];
  appraisals: LoanAppraisal[];
  portfolio: PortfolioLoan[];
  setActivePage: (page: string) => void;
  advanceStage: (id: string, stage: LoanApplication['stage']) => void;
  saveAppraisal: (appraisal: LoanAppraisal) => void;
  recordFollowUp: (id: string, arrearsDays: number) => void;
}

export const useLoanOfficerStore = create<LoanOfficerState>()(
  persist(
    (set) => ({
      user: staffUser('loan-officer', 'Kwabena Mensah', 'kwabena.mensah@isusupro.com', '024 412 8890', 'Makola Branch, Accra'),
      activePage: 'dashboard',
      applications: mockLoanApplications,
      appraisals: mockAppraisals,
      portfolio: mockPortfolio,
      setActivePage: (page) => set({ activePage: page }),
      advanceStage: (id, stage) => set((s) => ({
        applications: s.applications.map((a) => (a.id === id ? { ...a, stage } : a)),
      })),
      saveAppraisal: (appraisal) => set((s) => {
        const exists = s.appraisals.some((a) => a.id === appraisal.id);
        return {
          appraisals: exists
            ? s.appraisals.map((a) => (a.id === appraisal.id ? appraisal : a))
            : [appraisal, ...s.appraisals],
        };
      }),
      recordFollowUp: (id, arrearsDays) => set((s) => ({
        portfolio: s.portfolio.map((p) =>
          p.id === id
            ? {
                ...p,
                arrearsDays,
                classification:
                  arrearsDays === 0 ? 'current' :
                  arrearsDays <= 30 ? 'watch' :
                  arrearsDays <= 60 ? 'substandard' :
                  arrearsDays <= 90 ? 'doubtful' : 'loss',
              }
            : p
        ),
      })),
    }),
    { name: 'isusupro-lo' }
  )
);

// ---------------- TELLER ----------------
interface TellerState {
  user: User;
  activePage: string;
  drawer: TellerDrawer;
  queue: CounterTransaction[];
  transfers: VaultTransfer[];
  eodLines: EODReconciliationLine[];
  setActivePage: (page: string) => void;
  processNext: (id: string, status: CounterTransaction['status']) => void;
  serveCustomer: (tx: Omit<CounterTransaction, 'id' | 'queueNo' | 'time' | 'status'>) => void;
  requestTransfer: (tx: Omit<VaultTransfer, 'id' | 'status' | 'date' | 'requestedBy'>) => void;
  markTransferStatus: (id: string, status: VaultTransfer['status']) => void;
  countCash: (notes: { note: number; count: number }[]) => void;
  setEODCounted: (id: string, counted: number) => void;
}

export const useTellerStore = create<TellerState>()(
  persist(
    (set) => ({
      user: staffUser('teller', 'Akua Sarpong', 'akua.sarpong@isusupro.com', '055 210 4471', 'Makola Branch, Accra'),
      activePage: 'dashboard',
      drawer: mockTellerDrawer,
      queue: mockCounterQueue,
      transfers: mockVaultTransfers,
      eodLines: mockEODLines,
      setActivePage: (page) => set({ activePage: page }),
      processNext: (id, status) => set((s) => ({
        queue: s.queue.map((q) => (q.id === id ? { ...q, status } : q)),
      })),
      serveCustomer: (tx) => set((s) => {
        const maxQueue = s.queue.reduce((m, q) => Math.max(m, q.queueNo), 0);
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return {
          queue: [{ ...tx, id: `cqx-${Date.now()}`, queueNo: maxQueue + 1, time, status: 'completed' }, ...s.queue],
          drawer: {
            ...s.drawer,
            cashIn: tx.type === 'withdrawal' ? s.drawer.cashIn : s.drawer.cashIn + tx.amount,
            cashOut: tx.type === 'withdrawal' ? s.drawer.cashOut + tx.amount : s.drawer.cashOut,
            expectedBalance:
              tx.type === 'withdrawal'
                ? s.drawer.expectedBalance - tx.amount
                : s.drawer.expectedBalance + tx.amount,
          },
        };
      }),
      requestTransfer: (tx) => set((s) => ({
        transfers: [{ ...tx, id: `vtx-${Date.now()}`, status: 'requested', date: '2026-10-25', requestedBy: s.user.name }, ...s.transfers],
      })),
      markTransferStatus: (id, status) => set((s) => ({
        transfers: s.transfers.map((t) => (t.id === id ? { ...t, status } : t)),
      })),
      countCash: (notes) => set((s) => {
        const counted = notes.reduce((sum, n) => sum + n.note * n.count, 0);
        return {
          drawer: {
            ...s.drawer,
            currencyNotes: notes,
            countedBalance: counted,
            variance: counted - s.drawer.expectedBalance,
          },
        };
      }),
      setEODCounted: (id, counted) => set((s) => ({
        eodLines: s.eodLines.map((l) =>
          l.id === id ? { ...l, countedTotal: counted, variance: counted - l.systemTotal } : l
        ),
      })),
    }),
    { name: 'isusupro-teller' }
  )
);

// ---------------- FIELD SUPERVISOR ----------------
interface FieldSupervisorState {
  user: User;
  activePage: string;
  agents: SupervisedAgent[];
  routes: SupervisorRoute[];
  spotChecks: SpotCheck[];
  setActivePage: (page: string) => void;
  reassignRoute: (routeId: string, agentId: string) => void;
  markStop: (routeId: string, customerName: string, status: 'pending' | 'collected' | 'missed') => void;
  logSpotCheck: (check: Omit<SpotCheck, 'id' | 'verifiedBy' | 'date'>) => void;
  nudgeAgent: (agentId: string) => void;
}

export const useFieldSupervisorStore = create<FieldSupervisorState>()(
  persist(
    (set) => ({
      user: staffUser('field-supervisor', 'Yaw Boateng', 'yaw.boateng@isusupro.com', '020 778 3320', 'Makola Branch, Accra'),
      activePage: 'dashboard',
      agents: mockSupervisedAgents,
      routes: mockRoutes,
      spotChecks: mockSpotChecks,
      setActivePage: (page) => set({ activePage: page }),
      reassignRoute: (routeId, agentId) => set((s) => {
        const agent = s.agents.find((a) => a.id === agentId);
        return {
          routes: s.routes.map((r) =>
            r.id === routeId
              ? { ...r, agentId, agentName: agent?.name ?? r.agentName, status: 'assigned' }
              : r
          ),
        };
      }),
      markStop: (routeId, customerName, status) => set((s) => ({
        routes: s.routes.map((r) =>
          r.id === routeId
            ? {
                ...r,
                stops: r.stops.map((st) => (st.customerName === customerName ? { ...st, status } : st)),
                collectedToday:
                  status === 'collected'
                    ? r.collectedToday + (r.stops.find((st) => st.customerName === customerName)?.amount ?? 0)
                    : r.collectedToday,
              }
            : r
        ),
      })),
      logSpotCheck: (check) => set((s) => ({
        spotChecks: [{ ...check, id: `sc-${Date.now()}`, verifiedBy: s.user.name, date: '2026-10-25' }, ...s.spotChecks],
      })),
      nudgeAgent: (agentId) => set((s) => ({
        agents: s.agents.map((a) =>
          a.id === agentId ? { ...a, status: a.status === 'offline' ? 'in_field' : a.status, lastSync: 'just now' } : a
        ),
      })),
    }),
    { name: 'isusupro-fs' }
  )
);

// ---------------- ACCOUNTANT ----------------
interface AccountantState {
  user: User;
  activePage: string;
  ledger: LedgerEntry[];
  coa: ChartOfAccount[];
  statements: FinancialStatement[];
  reconciliations: BankReconciliation[];
  setActivePage: (page: string) => void;
  postEntry: (entry: Omit<LedgerEntry, 'id' | 'postedBy' | 'status' | 'date'>) => void;
  reverseEntry: (id: string) => void;
  finalizeStatement: (id: string) => void;
  resolveUnmatched: (recId: string, description: string) => void;
}

export const useAccountantStore = create<AccountantState>()(
  persist(
    (set) => ({
      user: staffUser('accountant', 'Esi Nyarko', 'esi.nyarko@isusupro.com', '026 501 7743', 'Head Office, Accra'),
      activePage: 'dashboard',
      ledger: mockLedgerEntries,
      coa: mockChartOfAccounts,
      statements: mockStatements,
      reconciliations: mockReconciliations,
      setActivePage: (page) => set({ activePage: page }),
      postEntry: (entry) => set((s) => ({
        ledger: [
          { ...entry, id: `le-${Date.now()}`, postedBy: s.user.name, status: 'posted', date: '2026-10-25' },
          ...s.ledger,
        ],
        coa: s.coa.map((acc) => {
          if (acc.code === entry.accountCode) {
            return { ...acc, balance: acc.balance + entry.debit - entry.credit };
          }
          return acc;
        }),
      })),
      reverseEntry: (id) => set((s) => ({
        ledger: s.ledger.map((l) => (l.id === id ? { ...l, status: 'reversed' } : l)),
      })),
      finalizeStatement: (id) => set((s) => ({
        statements: s.statements.map((st) => (st.id === id ? { ...st, status: 'final' } : st)),
      })),
      resolveUnmatched: (recId, description) => set((s) => ({
        reconciliations: s.reconciliations.map((r) =>
          r.id === recId
            ? {
                ...r,
                unmatchedItems: r.unmatchedItems.filter((i) => i.description !== description),
                status: r.unmatchedItems.length <= 1 ? 'reconciled' : r.status,
              }
            : r
        ),
      })),
    }),
    { name: 'isusupro-acc' }
  )
);

// ---------------- COMPLIANCE OFFICER ----------------
interface ComplianceState {
  user: User;
  activePage: string;
  alerts: AMLAlert[];
  strs: STRReport[];
  bogReturns: BOGReturn[];
  setActivePage: (page: string) => void;
  updateAlertStatus: (id: string, status: AMLAlert['status']) => void;
  fileSTR: (data: { alertId: string; subjectName: string; suspiciousActivity: string; amountInvolved: number; filedWith: STRReport['filedWith'] }) => void;
  updateSTRStatus: (id: string, status: STRReport['status']) => void;
  updateReturnProgress: (id: string, completion: number) => void;
}

export const useComplianceStore = create<ComplianceState>()(
  persist(
    (set) => ({
      user: staffUser('compliance-officer', 'Nii Ampofo', 'nii.ampofo@isusupro.com', '027 640 2258', 'Head Office, Accra'),
      activePage: 'dashboard',
      alerts: mockAMLAlerts,
      strs: mockSTRs,
      bogReturns: mockBOGReturns,
      setActivePage: (page) => set({ activePage: page }),
      updateAlertStatus: (id, status) => set((s) => ({
        alerts: s.alerts.map((a) => (a.id === id ? { ...a, status, assignedTo: s.user.name } : a)),
      })),
      fileSTR: (data) => set((s) => ({
        strs: [
          {
            ...data,
            id: `str-${Date.now()}`,
            filedDate: '2026-10-25',
            status: 'filed',
            reference: `FIC/STR/2026/0${900 + s.strs.length + 1}`,
          },
          ...s.strs,
        ],
        alerts: s.alerts.map((a) => (a.id === data.alertId ? { ...a, status: 'closed_str_filed' } : a)),
      })),
      updateSTRStatus: (id, status) => set((s) => ({
        strs: s.strs.map((r) => (r.id === id ? { ...r, status } : r)),
      })),
      updateReturnProgress: (id, completion) => set((s) => ({
        bogReturns: s.bogReturns.map((r) =>
          r.id === id ? { ...r, completion, status: completion >= 100 ? 'submitted' : 'in_progress' } : r
        ),
      })),
    }),
    { name: 'isusupro-comp' }
  )
);
