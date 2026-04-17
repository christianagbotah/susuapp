// ============================================
// SusuPay Ghana - Utility Formatters
// ============================================

export function formatGHS(amount: number): string {
  return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function generateReference(): string {
  const prefix = 'SP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function formatPhoneGH(phone: string): string {
  if (phone.startsWith('+233')) return phone;
  if (phone.startsWith('0')) return `+233 ${phone.substring(1)}`;
  return `+233 ${phone}`;
}

export function maskPhone(phone: string): string {
  const formatted = formatPhoneGH(phone);
  const parts = formatted.split(' ');
  if (parts.length === 2) {
    return `${parts[0]} ${parts[1].substring(0, 2)}***${parts[1].substring(parts[1].length - 2)}`;
  }
  return phone;
}

export function formatDuration(months: number): string {
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return years === 1 ? '1 year' : `${years} years`;
  return `${years}y ${remaining}m`;
}

export function calculateLoanPayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    repaid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    defaulted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    under_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    processing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    full: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    escalated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    investigating: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    frozen: 'bg-ice-100 text-ice-800 dark:bg-ice-900/30 dark:text-ice-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    reversed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    absent: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    collected: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    open: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
}

export function getTransactionTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    deposit: 'ArrowDownLeft',
    withdrawal: 'ArrowUpRight',
    transfer: 'ArrowLeftRight',
    susu_contribution: 'PiggyBank',
    susu_payout: 'Gift',
    loan_disbursement: 'Landmark',
    loan_repayment: 'CreditCard',
    agent_commission: 'BadgeDollarSign',
    fee: 'Receipt',
  };
  return icons[type] || 'Circle';
}

export const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
] as const;
