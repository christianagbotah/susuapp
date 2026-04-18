// ============================================
// iSusuPro Ghana - Utility Formatters
// ============================================

export function formatGHS(amount: number): string {
  return `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const prefix = 'ISP';
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

// ---- Credit Score & Repayment Schedule Helpers (Fido-style) ----

export function generateRepaymentSchedule(
  principal: number,
  interestRate: number,
  term: number,
  termUnit: 'days' | 'weeks' | 'months',
  frequency: 'bullet' | 'daily' | 'weekly' | 'monthly',
  startDate: string,
  interestType: 'flat' | 'reducing_balance',
): import('@/lib/types').RepaymentScheduleEntry[] {
  const schedule: import('@/lib/types').RepaymentScheduleEntry[] = [];
  const start = new Date(startDate);

  if (interestType === 'flat') {
    // Flat interest: total interest = principal * rate/100
    const totalInterest = principal * (interestRate / 100);

    if (frequency === 'bullet') {
      // Single bullet payment at end of term
      const endDate = new Date(start);
      if (termUnit === 'days') endDate.setDate(endDate.getDate() + term);
      else if (termUnit === 'weeks') endDate.setDate(endDate.getDate() + term * 7);
      else endDate.setMonth(endDate.getMonth() + term);

      schedule.push({
        dueDate: endDate.toISOString().split('T')[0],
        amount: Math.round((principal + totalInterest) * 100) / 100,
        principal,
        interest: Math.round(totalInterest * 100) / 100,
        status: 'pending',
      });
    } else {
      // Divide into installments
      let numInstallments: number;
      if (frequency === 'daily') {
        numInstallments = termUnit === 'days' ? term : termUnit === 'weeks' ? term * 7 : term * 30;
      } else if (frequency === 'weekly') {
        numInstallments = termUnit === 'days' ? Math.max(1, Math.floor(term / 7)) : termUnit === 'weeks' ? term : Math.max(1, Math.floor(term * 4));
      } else {
        // monthly
        numInstallments = termUnit === 'days' ? Math.max(1, Math.ceil(term / 30)) : termUnit === 'weeks' ? Math.max(1, Math.ceil(term / 4)) : term;
      }

      const perInstallmentPrincipal = Math.round((principal / numInstallments) * 100) / 100;
      const perInstallmentInterest = Math.round((totalInterest / numInstallments) * 100) / 100;
      const perInstallmentAmount = perInstallmentPrincipal + perInstallmentInterest;

      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date(start);
        if (frequency === 'daily') dueDate.setDate(dueDate.getDate() + i + 1);
        else if (frequency === 'weekly') dueDate.setDate(dueDate.getDate() + (i + 1) * 7);
        else dueDate.setMonth(dueDate.getMonth() + i + 1);

        const isLast = i === numInstallments - 1;
        schedule.push({
          dueDate: dueDate.toISOString().split('T')[0],
          amount: isLast
            ? Math.round((principal + totalInterest - perInstallmentAmount * i) * 100) / 100
            : perInstallmentAmount,
          principal: isLast
            ? Math.round((principal - perInstallmentPrincipal * i) * 100) / 100
            : perInstallmentPrincipal,
          interest: isLast
            ? Math.round((totalInterest - perInstallmentInterest * i) * 100) / 100
            : perInstallmentInterest,
          status: 'pending',
        });
      }
    }
  } else {
    // Reducing balance
    if (frequency === 'bullet') {
      const endDate = new Date(start);
      if (termUnit === 'days') endDate.setDate(endDate.getDate() + term);
      else if (termUnit === 'weeks') endDate.setDate(endDate.getDate() + term * 7);
      else endDate.setMonth(endDate.getMonth() + term);

      // Simple flat for bullet reducing balance
      const totalInterest = principal * (interestRate / 100);
      schedule.push({
        dueDate: endDate.toISOString().split('T')[0],
        amount: Math.round((principal + totalInterest) * 100) / 100,
        principal,
        interest: Math.round(totalInterest * 100) / 100,
        status: 'pending',
      });
    } else {
      let numInstallments: number;
      if (frequency === 'daily') {
        numInstallments = termUnit === 'days' ? term : termUnit === 'weeks' ? term * 7 : term * 30;
      } else if (frequency === 'weekly') {
        numInstallments = termUnit === 'days' ? Math.max(1, Math.floor(term / 7)) : termUnit === 'weeks' ? term : Math.max(1, Math.floor(term * 4));
      } else {
        numInstallments = termUnit === 'days' ? Math.max(1, Math.ceil(term / 30)) : termUnit === 'weeks' ? Math.max(1, Math.ceil(term / 4)) : term;
      }

      // For reducing balance, calculate periodic rate
      let periodicRate: number;
      if (frequency === 'daily') periodicRate = interestRate / 100 / 365;
      else if (frequency === 'weekly') periodicRate = interestRate / 100 / 52;
      else periodicRate = interestRate / 100 / 12;

      const installmentPrincipal = principal / numInstallments;
      let remainingBalance = principal;

      for (let i = 0; i < numInstallments; i++) {
        const interestPayment = remainingBalance * periodicRate;
        const isLast = i === numInstallments - 1;
        const principalPayment = isLast ? remainingBalance : installmentPrincipal;

        const dueDate = new Date(start);
        if (frequency === 'daily') dueDate.setDate(dueDate.getDate() + i + 1);
        else if (frequency === 'weekly') dueDate.setDate(dueDate.getDate() + (i + 1) * 7);
        else dueDate.setMonth(dueDate.getMonth() + i + 1);

        schedule.push({
          dueDate: dueDate.toISOString().split('T')[0],
          amount: Math.round((principalPayment + interestPayment) * 100) / 100,
          principal: Math.round(principalPayment * 100) / 100,
          interest: Math.round(interestPayment * 100) / 100,
          status: 'pending',
        });

        remainingBalance = Math.max(remainingBalance - principalPayment, 0);
      }
    }
  }

  return schedule;
}

export function calculateCreditScoreFromProfile(params: {
  susuContributions: { status: string; date: string }[];
  loans: { status: string; totalPaid: number; amount: number }[];
  kycLevel: 'none' | 'basic' | 'full';
  accountAgeDays: number;
  walletActivityScore: number;
}): import('@/lib/types').CreditScoreResult {
  const { susuContributions, loans, kycLevel, accountAgeDays, walletActivityScore } = params;

  // 1. Susu consistency (0-100)
  let susuConsistency = 50;
  if (susuContributions.length > 0) {
    const paidCount = susuContributions.filter(c => c.status === 'paid').length;
    susuConsistency = Math.min(100, Math.round((paidCount / susuContributions.length) * 100));
  }

  // 2. Repayment history (0-100)
  let repaymentHistory = 50;
  const activeRepaidLoans = loans.filter(l => l.status === 'repaid' || l.status === 'active');
  if (activeRepaidLoans.length > 0) {
    const fullyRepaid = loans.filter(l => l.status === 'repaid').length;
    const onTimeRate = activeRepaidLoans.length > 0
      ? (fullyRepaid / activeRepaidLoans.length) * 100
      : 50;
    repaymentHistory = Math.min(100, Math.round(onTimeRate * 1.1));
  }

  // 3. KYC level (0-100)
  const kycMap = { none: 0, basic: 50, full: 100 };
  const kycLevelScore = kycMap[kycLevel] || 0;

  // 4. Account age (0-100) — max at 365 days
  const accountAge = Math.min(100, Math.round((accountAgeDays / 365) * 100));

  // 5. Wallet activity
  const walletActivity = Math.min(100, walletActivityScore);

  // Weighted score
  const score = Math.round(
    susuConsistency * 0.25 +
    repaymentHistory * 0.30 +
    kycLevelScore * 0.20 +
    accountAge * 0.10 +
    walletActivity * 0.15
  );

  // Grade
  let grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  if (score >= 80) grade = 'Excellent';
  else if (score >= 60) grade = 'Good';
  else if (score >= 40) grade = 'Fair';
  else grade = 'Poor';

  // Derived limits
  let maxLoanAmount: number;
  let interestRate: number;
  let maxTermDays: number;

  if (grade === 'Excellent') {
    maxLoanAmount = 2000;
    interestRate = 3;
    maxTermDays = 30;
  } else if (grade === 'Good') {
    maxLoanAmount = 1000;
    interestRate = 5;
    maxTermDays = 21;
  } else if (grade === 'Fair') {
    maxLoanAmount = 500;
    interestRate = 7;
    maxTermDays = 14;
  } else {
    maxLoanAmount = 200;
    interestRate = 10;
    maxTermDays = 7;
  }

  return {
    score,
    grade,
    maxLoanAmount,
    interestRate,
    maxTermDays,
    factors: {
      susuConsistency,
      repaymentHistory,
      kycLevel: kycLevelScore,
      accountAge,
      walletActivity,
    },
  };
}
