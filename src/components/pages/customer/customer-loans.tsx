'use client';

import { useState, useMemo } from 'react';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, formatDuration, calculateLoanPayment } from '@/lib/formatters';
import { loanProducts } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Landmark, Plus, Calculator, CheckCircle, Clock, AlertCircle, XCircle, DollarSign, Calendar, Percent, FileText, ChevronRight, Info, CreditCard, ShieldCheck, TrendingDown, Zap, ArrowRight, PiggyBank } from 'lucide-react';
import { SwipeableRow, FAB } from '@/components/shared/mobile-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import type { LoanProduct, RepaymentScheduleEntry } from '@/lib/types';

// ---- Animation variants ----
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ---- Helpers ----
function getLoanTypeBadge(type: string) {
  const map: Record<string, string> = {
    business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    education: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    personal: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    'susu-backed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return map[type] ?? 'bg-slate-100 text-slate-700';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'repaid':
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'pending':
    case 'under_review':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'rejected':
    case 'defaulted':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-slate-400" />;
  }
}

function getProductIcon(productName: string) {
  if (productName.includes('Quick') || productName.includes('Susu')) return '⚡';
  if (productName.includes('Business')) return '💼';
  if (productName.includes('Education')) return '📚';
  if (productName.includes('Emergency')) return '🚨';
  if (productName.includes('Market')) return '🏪';
  return '💰';
}

// ---- Duration options generator ----
function getDurationOptions(product: LoanProduct) {
  const options: { value: string; label: string }[] = [];
  for (let m = product.minTerm; m <= product.maxTerm; m++) {
    options.push({ value: String(m), label: formatDuration(m) });
  }
  return options;
}

// ---- Amortization schedule generator ----
function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  maxRows: number = 6,
) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateLoanPayment(principal, annualRate, termMonths);
  const schedule: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remaining: number;
  }[] = [];
  let balance = principal;

  const rowsToShow = Math.min(termMonths, maxRows);
  for (let i = 1; i <= rowsToShow; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(balance - principalPayment, 0);
    schedule.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      remaining: balance,
    });
  }

  return schedule;
}

// ---- Preset amounts generator ----
function getPresetAmounts(min: number, max: number): number[] {
  const candidates = [500, 1000, 2000, 3000, 5000, 10000, 15000, 20000, 30000, 50000];
  const filtered = candidates.filter((c) => c >= min && c <= max);
  if (filtered.length >= 2) return filtered.slice(0, 5);
  if (filtered.length === 1) return [min, ...filtered, max];
  return [min, Math.round((min + max) / 2), max];
}

// ---- Credit score tips ----
const creditScoreTips = [
  {
    icon: Clock,
    title: 'Make Timely Payments',
    description: 'Pay your loans and susu contributions on time to build a strong repayment history.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Complete KYC',
    description: 'Full KYC verification boosts your trust score and unlocks higher loan limits.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: PiggyBank,
    title: 'Save Consistently',
    description: 'Regular susu contributions demonstrate financial discipline to lenders.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: TrendingDown,
    title: 'Maintain Low Debt',
    description: 'Keep your debt-to-income ratio low to qualify for better interest rates.',
    color: 'bg-rose-100 text-rose-600',
  },
];

// ============================================================
// Main Component
// ============================================================
export function CustomerLoans() {
  const { myLoans, loanPayments, applyForLoan, makeLoanPayment, calculateCreditScore } = useCustomerStore();

  // ---- Tab state (controlled) ----
  const [activeTab, setActiveTab] = useState('my-loans');

  // ---- Derived state ----
  const totalBorrowed = useMemo(() => myLoans.reduce((s, l) => s + l.amount, 0), [myLoans]);
  const outstandingBalance = useMemo(() => myLoans.reduce((s, l) => s + l.remainingBalance, 0), [myLoans]);

  const nextPayment = useMemo(() => {
    const activeLoans = myLoans
      .filter((l) => l.status === 'active' && l.nextPaymentDate)
      .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
    return activeLoans[0] ?? null;
  }, [myLoans]);

  // ---- Credit score & pre-qualification (Fido-style dynamic) ----
  const creditScoreResult = useMemo(() => calculateCreditScore(), [myLoans, loanPayments]);
  const userCreditScore = creditScoreResult.score;

  const preQualifiedAmount = useMemo(() => {
    return creditScoreResult.maxLoanAmount;
  }, [creditScoreResult]);

  const isFidoProduct = (productId: string | undefined) => productId === 'lp-006';

  // ---- Expanded row state ----
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  // ---- Apply dialog state ----
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    amount: '',
    purpose: '',
    duration: '',
    disbursementMethod: '',
    phoneNumber: '',
    guarantorName: '',
    guarantorPhone: '',
  });

  // ---- Preset amounts for selected product ----
  const presetAmounts = useMemo(() => {
    if (!selectedProduct) return [];
    return getPresetAmounts(selectedProduct.minAmount, selectedProduct.maxAmount);
  }, [selectedProduct]);

  // ---- Amortization schedule preview ----
  const amortizationPreview = useMemo(() => {
    if (!selectedProduct || !applicationForm.amount || !applicationForm.duration) return null;
    const principal = parseFloat(applicationForm.amount);
    const term = parseInt(applicationForm.duration);
    if (isNaN(principal) || isNaN(term) || principal <= 0 || term <= 0) return null;
    return generateAmortizationSchedule(principal, selectedProduct.interestRate, term);
  }, [selectedProduct, applicationForm.amount, applicationForm.duration]);

  // ---- Calculator state ----
  const [calcAmount, setCalcAmount] = useState<string>('5000');
  const [calcRate, setCalcRate] = useState<string>('8');
  const [calcTerm, setCalcTerm] = useState<string>('12');

  // ---- Payment dialog state ----
  const [payDialogLoan, setPayDialogLoan] = useState<import('@/lib/types').Loan | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('momo');

  // ---- Calculator memo ----
  const calculatorResult = useMemo(() => {
    const principal = parseFloat(calcAmount) || 0;
    const rate = parseFloat(calcRate) || 0;
    const term = parseFloat(calcTerm) || 1;

    const monthlyPayment = calculateLoanPayment(principal, rate, term);
    const totalPayment = monthlyPayment * term;
    const totalInterest = totalPayment - principal;

    return { principal, rate, term, monthlyPayment, totalPayment, totalInterest };
  }, [calcAmount, calcRate, calcTerm]);

  // ---- Chart data ----
  const chartData = useMemo(
    () => [
      { name: 'Principal', value: calculatorResult.principal, fill: '#10b981' },
      { name: 'Total Interest', value: Math.max(calculatorResult.totalInterest, 0), fill: '#f59e0b' },
    ],
    [calculatorResult],
  );

  // ---- Handlers ----
  function openApplyDialog(product: LoanProduct) {
    setSelectedProduct(product);
    setApplicationForm({
      amount: '',
      purpose: '',
      duration: '',
      disbursementMethod: '',
      phoneNumber: '',
      guarantorName: '',
      guarantorPhone: '',
    });
    setApplyDialogOpen(true);
  }

  function handleApply() {
    if (!selectedProduct) return;
    const { amount, purpose, duration, disbursementMethod, phoneNumber } = applicationForm;
    if (!amount || !purpose || !duration || !disbursementMethod || !phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < selectedProduct.minAmount || numAmount > selectedProduct.maxAmount) {
      toast.error(`Amount must be between ${formatGHS(selectedProduct.minAmount)} and ${formatGHS(selectedProduct.maxAmount)}`);
      return;
    }

    // Call store action
    applyForLoan({
      productId: selectedProduct.id,
      amount: numAmount,
      purpose,
      term: parseInt(duration),
      termUnit: selectedProduct.termUnit,
      disbursementMethod,
      disbursementNumber: phoneNumber,
      interestRate: selectedProduct.interestRate,
    });

    const isAutoApprove = selectedProduct.autoApprove;
    if (isAutoApprove) {
      toast.success('Instant Loan Approved! 🎉', {
        description: `${formatGHS(numAmount)} has been sent to your ${disbursementMethod === 'momo' ? 'Mobile Money' : 'bank account'} in under 60 seconds.`,
      });
    } else {
      toast.success('Loan application submitted!', {
        description: `Your application for ${formatGHS(numAmount)} (${selectedProduct.name}) is being reviewed.`,
      });
    }
    setApplyDialogOpen(false);
    setSelectedProduct(null);
  }

  function toggleExpand(loanId: string) {
    setExpandedLoanId((prev) => (prev === loanId ? null : loanId));
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ==============================
          Instant Loan Hero Section (Fido-style)
          ============================== */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-6 sm:p-8">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-20 top-4 h-16 w-16 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side: Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Instant Loan</span>
              </div>
              <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                You&apos;re pre-qualified for up to{' '}
                <span className="text-yellow-300">{formatGHS(preQualifiedAmount)}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-white/70" />
                  <span>{creditScoreResult.grade === 'Excellent' ? 'Apply in 60 seconds' : 'Funds in under 5 minutes'}</span>
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div className="flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-white/70" />
                  <span>From {creditScoreResult.interestRate}% interest</span>
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <span>Up to {creditScoreResult.maxTermDays} days</span>
                </div>
              </div>
              {/* Credit score badge */}
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs font-semibold border-0 ${
                    userCreditScore >= 80
                      ? 'bg-white/20 text-white'
                      : userCreditScore >= 60
                        ? 'bg-yellow-400/30 text-yellow-100'
                        : 'bg-red-400/30 text-red-100'
                  }`}
                >
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Credit Score: {userCreditScore} — {creditScoreResult.grade}
                </Badge>
              </div>
              {/* Factor breakdown mini bars */}
              <div className="mt-3 grid grid-cols-5 gap-2">
                {Object.entries(creditScoreResult.factors).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <Progress
                      value={val}
                      className={`h-1.5 ${
                        val >= 80 ? '[&>bar-bg-emerald-400]' : val >= 60 ? '[&>bar-bg-amber-400]' : val >= 40 ? '[&>bar-bg-orange-400]' : '[&>bar-bg-red-400]'
                      } bg-white/20`}
                    />
                    <p className="text-[10px] text-white/60 truncate text-center capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: CTA */}
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Button
                onClick={() => setActiveTab('apply')}
                size="lg"
                className="gap-2 rounded-full bg-white px-6 font-semibold text-emerald-700 shadow-lg shadow-emerald-900/20 hover:bg-white/90"
              >
                <Zap className="h-4 w-4" />
                Get Instant Loan
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-white/60">No paperwork required</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ==============================
          Main Tabs
          ============================== */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-10 w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
            <TabsTrigger
              value="my-loans"
              className="gap-1.5 rounded-md px-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Landmark className="h-3.5 w-3.5" />
              My Loans
            </TabsTrigger>
            <TabsTrigger
              value="apply"
              className="gap-1.5 rounded-md px-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Apply for Loan
            </TabsTrigger>
            <TabsTrigger
              value="calculator"
              className="gap-1.5 rounded-md px-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Calculator className="h-3.5 w-3.5" />
              Loan Calculator
            </TabsTrigger>
          </TabsList>

          {/* ==========================================
              TAB 1: My Loans
              ========================================== */}
          <TabsContent value="my-loans" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
                <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-900/10 h-full">
                  <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-5 py-5 flex flex-col justify-between h-full">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                    <div className="relative">
                      <p className="text-xs font-medium text-white/75">Total Borrowed</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {formatGHS(totalBorrowed)}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                        <Landmark className="h-3.5 w-3.5" />
                        <span>{myLoans.length} loan{myLoans.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
                <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-start gap-4 p-5 h-full justify-between">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
                      <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                        {formatGHS(outstandingBalance)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Across active loans
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
                <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-start gap-4 p-5 h-full justify-between">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500">Next Payment</p>
                      <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                        {nextPayment ? formatGHS(nextPayment.monthlyPayment) : 'N/A'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {nextPayment
                          ? `${formatDate(nextPayment.nextPaymentDate)} · ${formatGHS(nextPayment.remainingBalance)} remaining`
                          : 'No upcoming payments'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Loans Table */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Loan History</h2>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {myLoans.length} loan{myLoans.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </motion.div>

            {myLoans.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Landmark className="h-7 w-7 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">No loans yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Apply for a loan to get started with financing.
                </p>
                <Button
                  onClick={() => setActiveTab('apply')}
                  className="mt-4 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Apply for a Loan
                </Button>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto scrollbar-hide">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-slate-500">Loan Type</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">Amount</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">Interest Rate</TableHead>
                            <TableHead className="hidden text-xs font-semibold text-slate-500 sm:table-cell">Term</TableHead>
                            <TableHead className="hidden text-xs font-semibold text-slate-500 md:table-cell">Monthly Payment</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                            <TableHead className="hidden text-xs font-semibold text-slate-500 lg:table-cell">Remaining</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myLoans.map((loan) => {
                            const isExpanded = expandedLoanId === loan.id;
                            const progressPercent =
                              loan.amount > 0
                                ? Math.round(((loan.amount - loan.remainingBalance) / loan.amount) * 100)
                                : 0;

                            return (
                              <AnimatePresence key={loan.id}>
                                <motion.tr
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                                  onClick={() => toggleExpand(loan.id)}
                                >
                                  <TableCell className="py-3.5">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(loan.status)}
                                      <Badge className={`${getLoanTypeBadge(loan.type)} text-[10px] font-medium capitalize`}>
                                        {loan.type.replace('-', ' ')}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3.5 text-sm font-semibold text-slate-900">
                                    {formatGHS(loan.amount)}
                                  </TableCell>
                                  <TableCell className="py-3.5 text-sm text-slate-600">
                                    {loan.interestRate}% p.a.
                                  </TableCell>
                                  <TableCell className="hidden py-3.5 text-sm text-slate-600 sm:table-cell">
                                    {formatDuration(loan.term)}
                                  </TableCell>
                                  <TableCell className="hidden py-3.5 text-sm font-medium text-slate-800 md:table-cell">
                                    {formatGHS(loan.monthlyPayment)}
                                  </TableCell>
                                  <TableCell className="py-3.5">
                                    <Badge className={`${getStatusColor(loan.status)} text-[10px] font-medium capitalize`}>
                                      {loan.status.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden py-3.5 text-sm text-slate-600 lg:table-cell">
                                    {formatGHS(loan.remainingBalance)}
                                  </TableCell>
                                  <TableCell className="py-3.5">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-slate-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(loan.id);
                                      }}
                                    >
                                      Details
                                      <ChevronRight
                                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                          isExpanded ? 'rotate-90' : ''
                                        }`}
                                      />
                                    </Button>
                                  </TableCell>
                                </motion.tr>

                                {/* Expanded Detail Row */}
                                {isExpanded && (
                                  <motion.tr
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-b border-slate-100 bg-slate-50/40"
                                  >
                                    <TableCell colSpan={8} className="px-6 py-4">
                                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {/* Progress */}
                                        {(loan.status === 'active' || loan.status === 'repaid') && (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="font-medium text-slate-600">Repayment Progress</span>
                                              <span className="font-semibold text-emerald-600">{progressPercent}%</span>
                                            </div>
                                            <Progress value={progressPercent} className="h-2 bg-slate-200" />
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                              <span>Paid: {formatGHS(loan.totalPaid)}</span>
                                              <span>Remaining: {formatGHS(loan.remainingBalance)}</span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Purpose */}
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                            Purpose
                                          </p>
                                          <div className="flex items-start gap-1.5">
                                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <p className="text-sm text-slate-700">{loan.purpose}</p>
                                          </div>
                                        </div>

                                        {/* Disbursement */}
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                            Disbursement
                                          </p>
                                          <p className="text-sm text-slate-700">
                                            {loan.disbursementMethod === 'momo'
                                              ? loan.disbursementProvider ?? 'Mobile Money'
                                              : 'Bank Transfer'}
                                          </p>
                                          {loan.disbursementNumber && (
                                            <p className="text-xs text-slate-400">{loan.disbursementNumber}</p>
                                          )}
                                        </div>

                                        {/* Guarantor */}
                                        {loan.guarantorName && (
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                              Guarantor
                                            </p>
                                            <p className="text-sm text-slate-700">{loan.guarantorName}</p>
                                            {loan.guarantorPhone && (
                                              <p className="text-xs text-slate-400">{loan.guarantorPhone}</p>
                                            )}
                                          </div>
                                        )}

                                        {/* Dates */}
                                        {loan.startDate && (
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                              Loan Period
                                            </p>
                                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                              {formatDate(loan.startDate)} — {formatDate(loan.endDate)}
                                            </div>
                                          </div>
                                        )}

                                        {/* Credit Score */}
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                            Credit Score
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                                                loan.creditScore >= 75
                                                  ? 'bg-emerald-500'
                                                  : loan.creditScore >= 60
                                                    ? 'bg-amber-500'
                                                    : 'bg-red-500'
                                              }`}
                                            >
                                              {loan.creditScore}
                                            </div>
                                            <span className="text-xs text-slate-500">
                                              {loan.creditScore >= 75
                                                ? 'Excellent'
                                                : loan.creditScore >= 60
                                                  ? 'Good'
                                                  : 'Needs Improvement'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Collateral */}
                                        {loan.collateral && (
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                              Collateral
                                            </p>
                                            <p className="text-sm text-slate-700">{loan.collateral}</p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Reject Reason */}
                                      {loan.status === 'rejected' && loan.rejectReason && (
                                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                          <div>
                                            <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
                                            <p className="mt-0.5 text-xs text-red-600">{loan.rejectReason}</p>
                                          </div>
                                        </div>
                                      )}
                                    </TableCell>
                                  </motion.tr>
                                )}
                              </AnimatePresence>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Mobile: Swipeable Loan Cards (hidden on desktop) */}
            <div className="space-y-3 lg:hidden">
              {myLoans.map((loan) => {
                const progressPercent =
                  loan.amount > 0
                    ? Math.round(((loan.amount - loan.remainingBalance) / loan.amount) * 100)
                    : 0;
                return (
                  <SwipeableRow
                    key={loan.id}
                    rightActions={[
                      ...(loan.status === 'active' ? [{
                        label: 'Pay',
                        icon: CreditCard,
                        bg: 'bg-emerald-500',
                        onClick: () => {
                          setPayDialogLoan(loan);
                        },
                      }] : []),
                      {
                        label: 'Details',
                        icon: FileText,
                        bg: 'bg-blue-500',
                        onClick: () => toggleExpand(loan.id),
                      },
                    ]}
                  >
                    <div className="mobile-list-item flex items-center gap-3 bg-background p-4 rounded-none">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        {getStatusIcon(loan.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {loan.type.replace('-', ' ')}
                          </span>
                          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                            {formatGHS(loan.amount)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{loan.interestRate}%</span>
                          <span>·</span>
                          <span>{formatDuration(loan.term)}</span>
                          <span>·</span>
                          <Badge className={`${getStatusColor(loan.status)} text-[10px] font-medium capitalize px-1.5 py-0`}>
                            {loan.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {loan.status === 'active' && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Progress</span>
                              <span className="font-semibold text-emerald-600">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-1.5 bg-slate-100" />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </div>
                  </SwipeableRow>
                );
              })}
            </div>

            {/* FAB: Quick Pay */}
            <FAB
              icon={CreditCard}
              onClick={() => {
                const activeLoans = myLoans.filter(l => l.status === 'active');
                if (activeLoans.length > 0) {
                  setPayDialogLoan(activeLoans[0]);
                  const nextSchedule = activeLoans[0].repaymentSchedule?.find(e => e.status === 'pending' || e.status === 'overdue');
                  if (nextSchedule) setPayAmount(nextSchedule.amount.toString());
                } else {
                  setActiveTab('apply');
                }
              }}
              label="Pay"
            />
          </TabsContent>

          {/* ==========================================
              TAB 2: Apply for Loan
              ========================================== */}
          <TabsContent value="apply" className="space-y-6">
            <motion.div variants={itemVariants}>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-slate-900">Loan Products</h2>
                <p className="text-sm text-slate-500">
                  Choose a loan product that fits your needs and apply online.
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {loanProducts
                .filter((p) => p.isActive)
                .map((product) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md mobile-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                            {getProductIcon(product.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-sm font-semibold text-slate-900">
                              {product.name}
                            </CardTitle>
                            <CardDescription className="mt-0.5 line-clamp-2 text-xs">
                              {product.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Key Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              Loan Range
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {formatGHS(product.minAmount)} — {formatGHS(product.maxAmount)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              Interest Rate
                            </p>
                            <div className="flex items-center gap-1">
                              <Percent className="h-3.5 w-3.5 text-emerald-500" />
                              <p className="text-sm font-semibold text-slate-800">{product.interestRate}% p.a.</p>
                            </div>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              Term Range
                            </p>
                            <p className="text-sm text-slate-800">
                              {formatDuration(product.minTerm)} — {formatDuration(product.maxTerm)}
                            </p>
                          </div>
                        </div>

                        {/* Requirements */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Requirements
                          </p>
                          <ul className="space-y-1">
                            {product.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Apply Button */}
                        <Button
                          onClick={() => openApplyDialog(product)}
                          className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                          Apply
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>

            {/* ==============================
                Boost Your Credit Score Section
                ============================== */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-slate-900">Boost Your Credit Score</h3>
              </div>
              <p className="text-sm text-slate-500">
                Follow these tips to improve your credit score and unlock better loan terms.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {creditScoreTips.map((tip) => (
                <motion.div
                  key={tip.title}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tip.color}`}>
                        <tip.icon className="h-5 w-5" />
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-slate-900">{tip.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{tip.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Apply Dialog */}
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
              <DialogContent className="mx-4 sm:mx-0 sm:max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-emerald-600" />
                    Apply for {selectedProduct?.name ?? 'Loan'}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the details below to submit your loan application. Fields marked with * are required.
                  </DialogDescription>
                </DialogHeader>

                {selectedProduct && (
                  <div className="space-y-4 py-2">
                    {/* Product (disabled) */}
                    <div className="space-y-2">
                      <Label>Loan Product</Label>
                      <Input
                        value={selectedProduct.name}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>

                    {/* ==============================
                        Loan Amount Slider (Fido-style)
                        ============================== */}
                    <div className="space-y-3">
                      <Label htmlFor="apply-amount">Loan Amount *</Label>

                      {/* Prominent amount display */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-slate-400">₵</span>
                        <span className="text-3xl font-bold text-emerald-600">
                          {applicationForm.amount
                            ? formatGHS(parseFloat(applicationForm.amount) || 0).replace('₵', '')
                            : '0.00'}
                        </span>
                      </div>

                      {/* Range Slider */}
                      <Slider
                        min={selectedProduct.minAmount}
                        max={selectedProduct.maxAmount}
                        step={50}
                        value={[parseFloat(applicationForm.amount) || selectedProduct.minAmount]}
                        onValueChange={([val]) =>
                          setApplicationForm({ ...applicationForm, amount: String(val) })
                        }
                        className="w-full"
                      />

                      {/* Min / Max labels */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{formatGHS(selectedProduct.minAmount)}</span>
                        <span>{formatGHS(selectedProduct.maxAmount)}</span>
                      </div>

                      {/* Quick-select preset buttons */}
                      {presetAmounts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {presetAmounts.map((amt) => (
                            <Button
                              key={amt}
                              type="button"
                              variant={applicationForm.amount === String(amt) ? 'default' : 'outline'}
                              size="sm"
                              className={`h-8 text-xs ${
                                applicationForm.amount === String(amt)
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'text-slate-600 hover:text-emerald-600 hover:border-emerald-300'
                              }`}
                              onClick={() => setApplicationForm({ ...applicationForm, amount: String(amt) })}
                            >
                              {formatGHS(amt).replace('₵', '₵')}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Purpose */}
                    <div className="space-y-2">
                      <Label htmlFor="apply-purpose">Purpose *</Label>
                      <Textarea
                        id="apply-purpose"
                        placeholder="Describe what you need the loan for..."
                        value={applicationForm.purpose}
                        onChange={(e) => setApplicationForm({ ...applicationForm, purpose: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="apply-duration">Loan Duration *</Label>
                      <Select
                        value={applicationForm.duration}
                        onValueChange={(v) => setApplicationForm({ ...applicationForm, duration: v })}
                      >
                        <SelectTrigger id="apply-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDurationOptions(selectedProduct).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Disbursement Method */}
                    <div className="space-y-2">
                      <Label htmlFor="apply-method">Disbursement Method *</Label>
                      <Select
                        value={applicationForm.disbursementMethod}
                        onValueChange={(v) => setApplicationForm({ ...applicationForm, disbursementMethod: v })}
                      >
                        <SelectTrigger id="apply-method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn">MTN MoMo</SelectItem>
                          <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                          <SelectItem value="airteltigo">AirtelTigo Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="apply-phone">Phone Number for Disbursement *</Label>
                      <Input
                        id="apply-phone"
                        type="tel"
                        placeholder="e.g. 0241234567"
                        value={applicationForm.phoneNumber}
                        onChange={(e) => setApplicationForm({ ...applicationForm, phoneNumber: e.target.value })}
                      />
                    </div>

                    {/* ==============================
                        Repayment Schedule Preview
                        ============================== */}
                    {amortizationPreview && amortizationPreview.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <Separator />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Calculator className="h-4 w-4 text-emerald-600" />
                            <h4 className="text-sm font-semibold text-slate-900">
                              Repayment Schedule Preview
                            </h4>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Projected monthly payments at {selectedProduct.interestRate}% p.a.
                          </p>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="text-[10px] font-semibold text-slate-500 px-3 py-2">Month</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 px-3 py-2 text-right">Payment</TableHead>
                                <TableHead className="hidden text-[10px] font-semibold text-slate-500 px-3 py-2 text-right sm:table-cell">Principal</TableHead>
                                <TableHead className="hidden text-[10px] font-semibold text-slate-500 px-3 py-2 text-right sm:table-cell">Interest</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 px-3 py-2 text-right">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {amortizationPreview.map((row) => (
                                <TableRow key={row.month} className="border-slate-100">
                                  <TableCell className="text-xs font-medium text-slate-700 px-3 py-2">
                                    {row.month}
                                  </TableCell>
                                  <TableCell className="text-xs font-semibold text-slate-900 px-3 py-2 text-right">
                                    {formatGHS(row.payment)}
                                  </TableCell>
                                  <TableCell className="hidden text-xs text-slate-600 px-3 py-2 text-right sm:table-cell">
                                    {formatGHS(row.principal)}
                                  </TableCell>
                                  <TableCell className="hidden text-xs text-amber-600 px-3 py-2 text-right sm:table-cell">
                                    {formatGHS(row.interest)}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-600 px-3 py-2 text-right">
                                    {formatGHS(row.remaining)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {amortizationPreview.length < parseInt(applicationForm.duration) && (
                          <p className="text-xs text-slate-400 text-center">
                            Showing first {amortizationPreview.length} of {applicationForm.duration} months
                          </p>
                        )}
                      </motion.div>
                    )}

                    <Separator />

                    {/* Guarantor (optional) */}
                    <div>
                      <div className="mb-3 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-xs font-medium text-slate-500">Guarantor Details (Optional)</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="apply-guarantor-name">Guarantor Name</Label>
                          <Input
                            id="apply-guarantor-name"
                            placeholder="Full name"
                            value={applicationForm.guarantorName}
                            onChange={(e) => setApplicationForm({ ...applicationForm, guarantorName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apply-guarantor-phone">Guarantor Phone</Label>
                          <Input
                            id="apply-guarantor-phone"
                            type="tel"
                            placeholder="e.g. 0201234567"
                            value={applicationForm.guarantorPhone}
                            onChange={(e) => setApplicationForm({ ...applicationForm, guarantorPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <DialogFooter className="flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setApplyDialogOpen(false)}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Submit Application
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ==========================================
              TAB 3: Loan Calculator
              ========================================== */}
          <TabsContent value="calculator" className="space-y-6">
            <motion.div variants={itemVariants}>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-slate-900">Loan Calculator</h2>
                <p className="text-sm text-slate-500">
                  Plan your loan repayment with real-time calculations.
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Input Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calculator className="h-5 w-5 text-emerald-600" />
                      Loan Details
                    </CardTitle>
                    <CardDescription>Enter the loan parameters below.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Loan Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="calc-amount" className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        Loan Amount (₵)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          ₵
                        </span>
                        <Input
                          id="calc-amount"
                          type="number"
                          inputMode="decimal"
                          value={calcAmount}
                          onChange={(e) => setCalcAmount(e.target.value)}
                          className="pl-12 h-12"
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-2">
                      <Label htmlFor="calc-rate" className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-slate-400" />
                        Interest Rate (% per annum)
                      </Label>
                      <div className="relative">
                        <Input
                          id="calc-rate"
                          type="number"
                          inputMode="decimal"
                          value={calcRate}
                          onChange={(e) => setCalcRate(e.target.value)}
                          className="pr-8 h-12"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Loan Term */}
                    <div className="space-y-2">
                      <Label htmlFor="calc-term" className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Loan Term (months)
                      </Label>
                      <Input
                        id="calc-term"
                        type="number"
                        inputMode="numeric"
                        value={calcTerm}
                        onChange={(e) => setCalcTerm(e.target.value)}
                        className="h-12"
                        min="1"
                        max="360"
                        step="1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results */}
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
                    <Card className="border-slate-200/80 bg-white shadow-sm">
                      <CardContent className="p-4 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Monthly Payment
                        </p>
                        <p className="mt-1 text-lg font-bold text-emerald-600">
                          {formatGHS(calculatorResult.monthlyPayment)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
                    <Card className="border-slate-200/80 bg-white shadow-sm">
                      <CardContent className="p-4 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Total Payment
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatGHS(calculatorResult.totalPayment)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
                    <Card className="border-slate-200/80 bg-white shadow-sm">
                      <CardContent className="p-4 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Total Interest
                        </p>
                        <p className="mt-1 text-lg font-bold text-amber-600">
                          {formatGHS(Math.max(calculatorResult.totalInterest, 0))}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Bar Chart */}
                <motion.div variants={itemVariants}>
                  <Card className="border-slate-200/80 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-900">
                        Payment Breakdown
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Visual comparison of principal vs. total interest.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12, fill: '#64748b' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(value: number) =>
                                value >= 1000 ? `${(value / 1000).toFixed(0)}K` : String(value)
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => [formatGHS(value), '']}
                              contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                              }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                              {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Additional Info */}
                <motion.div variants={itemVariants}>
                  <Card className="border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-700">Loan Summary</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                            <span>Loan Term:</span>
                            <span className="font-medium text-slate-700">{formatDuration(calculatorResult.term)}</span>
                            <span>Interest Rate:</span>
                            <span className="font-medium text-slate-700">{calculatorResult.rate}% p.a.</span>
                            <span>Interest-to-Principal Ratio:</span>
                            <span className="font-medium text-slate-700">
                              {calculatorResult.principal > 0
                                ? ((calculatorResult.totalInterest / calculatorResult.principal) * 100).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ---- Loan Payment Dialog ---- */}
      <Dialog open={!!payDialogLoan} onOpenChange={(open) => { if (!open) setPayDialogLoan(null); }}>
        {payDialogLoan && (
          <DialogContent className="mx-4 sm:mx-0 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Repay Loan
              </DialogTitle>
              <DialogDescription>
                Make a payment towards your {payDialogLoan.type.replace('-', ' ')} loan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Loan summary */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Amount</span>
                  <span className="font-medium">{formatGHS(payDialogLoan.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outstanding Balance</span>
                  <span className="font-semibold text-red-600">{formatGHS(payDialogLoan.remainingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Payment</span>
                  <span className="font-medium">{formatGHS(payDialogLoan.monthlyPayment)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="pay-amount">Payment Amount (₵)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₵</span>
                  <Input
                    id="pay-amount"
                    type="number"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="pl-12"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setPayAmount(payDialogLoan.monthlyPayment.toString())}
                  >
                    Full Installment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setPayAmount(payDialogLoan.remainingBalance.toString())}
                  >
                    Pay Off
                  </Button>
                </div>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momo">Mobile Money (MTN MoMo)</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="agent">Agent Collection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPayDialogLoan(null)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const amt = parseFloat(payAmount);
                  if (!amt || amt <= 0) {
                    toast.error('Please enter a valid amount');
                    return;
                  }
                  if (amt > payDialogLoan.remainingBalance) {
                    toast.error(`Amount cannot exceed outstanding balance of ${formatGHS(payDialogLoan.remainingBalance)}`);
                    return;
                  }
                  makeLoanPayment(payDialogLoan.id, amt, payMethod);
                  toast.success('Payment successful!', {
                    description: `${formatGHS(amt)} has been paid towards your loan.`,
                  });
                  setPayDialogLoan(null);
                  setPayAmount('');
                }}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Pay Now
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
