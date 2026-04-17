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
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Landmark, Plus, Calculator, CheckCircle, Clock, AlertCircle, XCircle, DollarSign, Calendar, Percent, FileText, ChevronRight, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import type { LoanProduct } from '@/lib/types';

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

// ============================================================
// Main Component
// ============================================================
export function CustomerLoans() {
  const { myLoans, loanPayments } = useCustomerStore();

  // ---- Derived state ----
  const totalBorrowed = useMemo(() => myLoans.reduce((s, l) => s + l.amount, 0), [myLoans]);
  const outstandingBalance = useMemo(() => myLoans.reduce((s, l) => s + l.remainingBalance, 0), [myLoans]);

  const nextPayment = useMemo(() => {
    const activeLoans = myLoans
      .filter((l) => l.status === 'active' && l.nextPaymentDate)
      .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
    return activeLoans[0] ?? null;
  }, [myLoans]);

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

  // ---- Calculator state ----
  const [calcAmount, setCalcAmount] = useState<string>('5000');
  const [calcRate, setCalcRate] = useState<string>('8');
  const [calcTerm, setCalcTerm] = useState<string>('12');

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
    toast.success('Loan application submitted!', {
      description: `Your application for ${formatGHS(numAmount)} (${selectedProduct.name}) is being reviewed.`,
    });
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
      className="space-y-6 p-4 sm:p-6"
    >
      {/* ==============================
          Page Header
          ============================== */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loans</h1>
          <p className="text-sm text-slate-500">
            Manage your loans, apply for new ones, and use the loan calculator to plan.
          </p>
        </div>
      </motion.div>

      {/* ==============================
          Main Tabs
          ============================== */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="my-loans" className="space-y-6">
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
                <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-900/10">
                  <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-5 py-5">
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
                <Card className="border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
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
                <Card className="border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
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
                  onClick={() => {
                    const tab = document.querySelector('[value="apply"]') as HTMLElement;
                    tab?.click();
                  }}
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
                    <div className="overflow-x-auto">
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
                    <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
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

            {/* Apply Dialog */}
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="apply-amount">Loan Amount (GHS) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          GH₵
                        </span>
                        <Input
                          id="apply-amount"
                          type="number"
                          placeholder={`Min ${selectedProduct.minAmount}, Max ${selectedProduct.maxAmount}`}
                          value={applicationForm.amount}
                          onChange={(e) => setApplicationForm({ ...applicationForm, amount: e.target.value })}
                          className="pl-12"
                          min={selectedProduct.minAmount}
                          max={selectedProduct.maxAmount}
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        Range: {formatGHS(selectedProduct.minAmount)} — {formatGHS(selectedProduct.maxAmount)}
                      </p>
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
                        Loan Amount (GHS)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          GH₵
                        </span>
                        <Input
                          id="calc-amount"
                          type="number"
                          value={calcAmount}
                          onChange={(e) => setCalcAmount(e.target.value)}
                          className="pl-12"
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
                          value={calcRate}
                          onChange={(e) => setCalcRate(e.target.value)}
                          className="pr-8"
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
                        value={calcTerm}
                        onChange={(e) => setCalcTerm(e.target.value)}
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
    </motion.div>
  );
}
