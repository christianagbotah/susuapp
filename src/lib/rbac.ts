// ============================================
// iSusuPro Ghana — Role-Based Access Control
// Central permission registry for all 10 portals.
// Mirrors the NestJS RolesGuard on the backend
// (mini-services/isusu-api/src/auth/roles.guard.ts).
// ============================================

import type { Permission, RoleDefinition, RoleId } from './types';

// Shorthand sets
const CUSTOMER_PERMS: Permission[] = [
  'susu.contribute', 'loans.apply', 'wallet.deposit', 'wallet.withdraw',
  'wallet.transfer', 'ussd.manage', 'ai.use',
];

const AGENT_PERMS: Permission[] = [
  'susu.contribute', 'susu.manage_groups', 'kyc.initiate',
  'wallet.deposit', 'wallet.transfer', 'ai.use',
];

const TREASURER_PERMS: Permission[] = [
  'susu.manage_groups', 'susu.approve_payout', 'ai.use',
];

const ADMIN_PERMS: Permission[] = [
  'susu.manage_groups', 'susu.approve_payout', 'loans.approve', 'loans.disburse',
  'kyc.review', 'kyc.approve', 'agents.onboard', 'staff.manage', 'payroll.process',
  'users.manage', 'config.manage', 'analytics.view_all', 'ai.use',
];

const BRANCH_MANAGER_PERMS: Permission[] = [
  'loans.approve', 'agents.onboard', 'agents.supervise', 'staff.manage',
  'branch.targets_manage', 'analytics.view_all', 'kyc.approve', 'ai.use',
];

const LOAN_OFFICER_PERMS: Permission[] = [
  'loans.recommend', 'ai.use', 'kyc.initiate',
];

const TELLER_PERMS: Permission[] = [
  'cash.handle_drawer', 'cash.eod_reconcile', 'wallet.deposit', 'wallet.withdraw',
];

const FIELD_SUPERVISOR_PERMS: Permission[] = [
  'agents.supervise', 'agents.verify_collections', 'agents.onboard', 'ai.use',
];

const ACCOUNTANT_PERMS: Permission[] = [
  'ledger.post', 'ledger.close_period', 'reports.financial', 'payroll.process',
];

const COMPLIANCE_PERMS: Permission[] = [
  'aml.monitor', 'aml.file_str', 'bog.file_returns', 'kyc.review', 'audit.view',
];

export const ROLES: RoleDefinition[] = [
  {
    id: 'customer',
    label: 'Customer',
    group: 'customer',
    description: 'Save daily susu, join groups, borrow, pay bills',
    permissions: CUSTOMER_PERMS,
  },
  {
    id: 'agent',
    label: 'Field Agent',
    group: 'field',
    description: 'Daily susu collection at markets, lorry stations & shops',
    permissions: AGENT_PERMS,
  },
  {
    id: 'field-supervisor',
    label: 'Field Supervisor',
    group: 'field',
    description: 'Supervises agents, verifies collections, manages routes',
    permissions: FIELD_SUPERVISOR_PERMS,
  },
  {
    id: 'teller',
    label: 'Teller / Cashier',
    group: 'operations',
    description: 'Counter cash handling, MoMo float, end-of-day reconciliation',
    permissions: TELLER_PERMS,
  },
  {
    id: 'branch-manager',
    label: 'Branch Manager',
    group: 'operations',
    description: 'Branch P&L, staff oversight, high-value loan approvals',
    permissions: BRANCH_MANAGER_PERMS,
  },
  {
    id: 'loan-officer',
    label: 'Loan Officer',
    group: 'operations',
    description: 'Loan origination, 5C appraisals, field visits, portfolio follow-up',
    permissions: LOAN_OFFICER_PERMS,
  },
  {
    id: 'treasurer',
    label: 'Group Treasurer',
    group: 'operations',
    description: 'Community susu group books, payout rotation & records',
    permissions: TREASURER_PERMS,
  },
  {
    id: 'accountant',
    label: 'Accountant',
    group: 'finance',
    description: 'General ledger, financial statements, bank & MoMo reconciliation',
    permissions: ACCOUNTANT_PERMS,
  },
  {
    id: 'compliance-officer',
    label: 'Compliance Officer',
    group: 'governance',
    description: 'AML/CFT monitoring, STR filing to FIC, BoG NBFRI returns',
    permissions: COMPLIANCE_PERMS,
  },
  {
    id: 'admin',
    label: 'System Administrator',
    group: 'governance',
    description: 'Platform configuration, users, integrations & analytics',
    permissions: ADMIN_PERMS,
  },
];

export function getRole(roleId: RoleId): RoleDefinition {
  return ROLES.find((r) => r.id === roleId) ?? ROLES[0];
}

export function hasPermission(roleId: RoleId, permission: Permission): boolean {
  return getRole(roleId).permissions.includes(permission);
}

export function getRoleGroup(roleId: RoleId): RoleDefinition['group'] {
  return getRole(roleId).group;
}

// Login page grouping (Ghana operations hierarchy)
export const ROLE_GROUPS: { key: RoleDefinition['group']; label: string; hint: string }[] = [
  { key: 'customer', label: 'Personal Banking', hint: 'Susu savers & borrowers' },
  { key: 'field', label: 'Field Operations', hint: 'Agents, supervisors & collectors' },
  { key: 'operations', label: 'Branch Operations', hint: 'Tellers, managers & credit' },
  { key: 'finance', label: 'Finance', hint: 'Accounts & reconciliation' },
  { key: 'governance', label: 'Governance & Compliance', hint: 'AML/CFT, BoG & platform admin' },
];
