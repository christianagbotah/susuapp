'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAdminStore } from '@/store/app-store';
import {
  formatGHS, formatDate, formatDuration, getStatusColor,
  getInitials, formatCompactNumber, formatDateTime,
} from '@/lib/formatters';
import { loanPayments } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import {
  Landmark, Clock, DollarSign, AlertTriangle, CheckCircle, XCircle,
  Eye, Filter, ChevronLeft, ChevronRight, CreditCard, Calendar,
  User, Phone, MapPin, Shield, Search, Download, ArrowRight,
  FileText, TrendingUp, TrendingDown, Send, Banknote, Building2,
  Wallet, ArrowUpRight, Sparkles, Loader2, ShieldCheck, ShieldAlert, Lightbulb,
  RefreshCw, Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Loan, RepaymentScheduleEntry, CreditScoreFactors } from '@/lib/types';
import { normalizeGhanaPhone } from '@/lib/payments/types';
import type { PaymentIntent } from '@/lib/payments/types';
import { usePaymentsStore } from '@/store/payments-store';
import { useConfirm } from '@/components/shared/confirm-dialog';

const ITEMS_PER_PAGE = 8;

/** Ghana bank list for the disbursement picker (matches the server list
 *  in /api/payments/disburse — codes resolve live from Paystack /bank). */
const GHANA_BANKS = [
  'Absa Bank Ghana', 'Access Bank Ghana', 'Agricultural Development Bank (ADB)',
  'Bank of Africa Ghana (BOA)', 'CalBank', 'Consolidated Bank Ghana (CBG)',
  'Ecobank Ghana', 'Fidelity Bank Ghana', 'First National Bank', 'GCB Bank',
  'Guaranty Trust Bank (GTBank) Ghana', 'Prudential Bank', 'Republic Bank (HFC)',
  'Societe Generale Ghana', 'Stanbic Bank Ghana', 'Standard Chartered Ghana',
  'United Bank for Africa (UBA) Ghana', 'Zenith Bank Ghana',
  'Rural / Community Bank', 'Savings & Loans / Microfinance Institution',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const typeColors: Record<string, string> = {
  personal: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  business: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  education: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'susu-backed': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const pipelineStages = [
  { key: 'pending', label: 'Applied', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700', dot: 'bg-amber-500', line: 'bg-amber-300' },
  { key: 'under_review', label: 'Under Review', color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700', dot: 'bg-purple-500', line: 'bg-purple-300' },
  { key: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700', dot: 'bg-green-500', line: 'bg-green-300' },
  { key: 'active', label: 'Active', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700', dot: 'bg-blue-500', line: 'bg-blue-300' },
  { key: 'repaid', label: 'Repaid', color: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-700', dot: 'bg-teal-500', line: 'bg-teal-300' },
];

function getCreditScoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (score >= 60) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
}

function getCreditScoreText(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export function AdminLoans() {
  const { allLoans, approveLoan, rejectLoan, disburseLoan } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Loan | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [disburseDialog, setDisburseDialog] = useState<Loan | null>(null);
  const [disburseMethod, setDisburseMethod] = useState('momo');
  const [disburseNumber, setDisburseNumber] = useState('');
  const [disbursePhase, setDisbursePhase] = useState<'form' | 'processing' | 'success' | 'failed' | 'timeout'>('form');
  const [disburseIntent, setDisburseIntent] = useState<PaymentIntent | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');

  // Confirmation dialog for sensitive actions
  const [confirmDialog, askConfirm] = useConfirm();

  // ---- AI Risk Assessment ----
  interface AiFactor { factor: string; impact: 'positive' | 'negative' | 'neutral'; note: string; }
  interface AiAssessment { riskLevel: 'low' | 'medium' | 'high'; score: number; recommendation: string; factors: AiFactor[]; }
  const [aiLoan, setAiLoan] = useState<Loan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiAssessment | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const runAiAssessment = async (loan: Loan) => {
    setAiLoan(loan);
    setAiResult(null);
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/loan-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: loan.applicantName,
          type: loan.type,
          amount: loan.amount,
          termMonths: loan.term,
          purpose: loan.purpose,
          creditScore: loan.creditScore,
          interestRate: loan.interestRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setAiResult(data);
    } catch {
      setAiError('The AI risk engine is unavailable right now. Please try again shortly.');
    } finally {
      setAiLoading(false);
    }
  };

  const riskStyles: Record<string, { badge: string; icon: React.ElementType; color: string }> = {
    low: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400', icon: ShieldCheck, color: 'text-emerald-600' },
    medium: { badge: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle, color: 'text-amber-600' },
    high: { badge: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400', icon: ShieldAlert, color: 'text-rose-600' },
  };

  // Computed stats
  const stats = useMemo(() => {
    const totalLoans = allLoans.length;
    const totalDisbursed = allLoans
      .filter(l => l.status === 'active' || l.status === 'repaid')
      .reduce((s, l) => s + l.amount, 0);
    const pendingApprovals = allLoans.filter(l => l.status === 'pending' || l.status === 'under_review').length;
    const nonPerforming = allLoans.filter(l => l.status === 'defaulted' || l.status === 'rejected').length;
    const defaultRate = totalLoans > 0 ? ((nonPerforming / totalLoans) * 100) : 0;
    return { totalLoans, totalDisbursed, pendingApprovals, defaultRate };
  }, [allLoans]);

  // Pipeline counts
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelineStages.forEach(stage => {
      counts[stage.key] = allLoans.filter(l => l.status === stage.key).length;
    });
    counts.rejected = allLoans.filter(l => l.status === 'rejected' || l.status === 'defaulted').length;
    return counts;
  }, [allLoans]);

  // Filtered & searched loans
  const filteredLoans = useMemo(() => {
    return allLoans.filter(l => {
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchSearch = searchQuery === '' ||
        l.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.applicantPhone.includes(searchQuery);
      return matchStatus && matchSearch;
    });
  }, [allLoans, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLoans.length / ITEMS_PER_PAGE);
  const paginatedLoans = filteredLoans.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const loanPaymentsForLoan = detailLoan
    ? loanPayments.filter(p => p.loanId === detailLoan.id)
    : [];

  const handleApprove = () => {
    if (!detailLoan) return;
    askConfirm({
      title: 'Approve Loan Application',
      description: `You are about to approve this loan and release funds to the disbursement queue. The customer and loan officer will be notified immediately.`,
      subject: `${detailLoan.applicantName} — ${formatGHS(detailLoan.amount)}`,
      details: [
        { label: 'Purpose', value: detailLoan.purpose },
        { label: 'Duration', value: `${detailLoan.term} ${detailLoan.termUnit}` },
        { label: 'Credit Score', value: String(detailLoan.creditScore ?? '—') },
      ],
      confirmLabel: 'Yes, Approve Loan',
      variant: 'success',
      onConfirm: () => {
        approveLoan(detailLoan.id);
        toast.success(`Loan approved for ${detailLoan.applicantName}`);
        setDetailLoan(null);
      },
    });
  };

  const handleReject = () => {
    if (rejectDialog && rejectReason.trim()) {
      rejectLoan(rejectDialog.id, rejectReason);
      toast.success(`Loan rejected for ${rejectDialog.applicantName}`);
      setRejectDialog(null);
      setRejectReason('');
    } else {
      toast.error('Please enter a rejection reason');
    }
  };

  /** Disburse an approved loan through the live gateway (Hubtel Send Money /
   *  Paystack Transfer) — MoMo push or Ghana bank transfer, with polling. */
  const submitDisbursement = async () => {
    if (!disburseDialog) return;
    if (disburseMethod === 'momo') {
      if (!normalizeGhanaPhone(disburseNumber)) {
        toast.error('Enter a valid Ghana MoMo number (e.g. 024 123 4567)');
        return;
      }
    } else {
      if (!accountName.trim()) { toast.error('Enter the account name as held at the bank'); return; }
      if (!bankName) { toast.error('Pick the recipient bank'); return; }
      if (!/^\d{10,17}$/.test(disburseNumber.replace(/\s/g, ''))) { toast.error('Account number must be 10–17 digits'); return; }
    }
    setDisbursePhase('processing');
    setElapsed(0);
    try {
      const res = await fetch('/api/payments/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'loan_disbursement',
          channel: disburseMethod,
          amount: disburseDialog.amount,
          phone: disburseMethod === 'momo' ? normalizeGhanaPhone(disburseNumber) : undefined,
          recipientName: disburseDialog.applicantName,
          description: `Loan disbursement — ${disburseDialog.type.replace('-', ' ')} loan for ${disburseDialog.applicantName}`,
          metadata: { loanId: disburseDialog.id, applicant: disburseDialog.applicantName, branch: disburseDialog.branch },
          bank: disburseMethod === 'bank'
            ? { accountName, accountNumber: disburseNumber.replace(/\s/g, ''), bankName }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'The gateway rejected the disbursement'); setDisbursePhase('form'); return; }
      const intent = data.intent as PaymentIntent;
      setDisburseIntent(intent);
      usePaymentsStore.getState().upsertIntent(intent);
      if (intent.status === 'failed') setDisbursePhase('failed');
    } catch {
      toast.error('Network error — could not reach the payment gateway');
      setDisbursePhase('form');
    }
  };

  const resetDisburse = () => {
    setDisburseDialog(null);
    setDisburseNumber('');
    setDisburseMethod('momo');
    setDisbursePhase('form');
    setDisburseIntent(null);
    setElapsed(0);
    setBankName('');
    setAccountName('');
  };

  // New dialog session → reset phase tracking
  useEffect(() => {
    setDisbursePhase('form');
    setDisburseIntent(null);
    setElapsed(0);
  }, [disburseDialog?.id]);

  // Poll the gateway until the transfer settles
  useEffect(() => {
    if (disbursePhase !== 'processing' || !disburseIntent) return;
    let polls = 0;
    const tick = setInterval(() => setElapsed(e => e + 1), 1000);
    const poll = setInterval(async () => {
      polls += 1;
      if (polls > 30) { clearInterval(poll); clearInterval(tick); setDisbursePhase('timeout'); return; }
      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(disburseIntent.reference)}`);
        if (!res.ok) return;
        const data = await res.json();
        const current = data.intent as PaymentIntent;
        if (!current || current.status === disburseIntent.status) return;
        setDisburseIntent(current);
        usePaymentsStore.getState().upsertIntent(current);
        if (current.status === 'success') {
          clearInterval(poll); clearInterval(tick);
          setDisbursePhase('success');
          if (disburseDialog) {
            disburseLoan(
              disburseDialog.id,
              current.channel,
              current.channel === 'momo' ? (current.phone ?? disburseNumber) : (current.bank?.accountNumber ?? disburseNumber),
            );
            toast.success(`₵${disburseDialog.amount.toLocaleString()} sent to ${disburseDialog.applicantName} via ${current.channel === 'momo' ? 'Mobile Money' : 'Bank Transfer'}`);
          }
        } else if (current.status === 'failed' || current.status === 'cancelled') {
          clearInterval(poll); clearInterval(tick);
          setDisbursePhase('failed');
        }
      } catch { /* transient — keep polling */ }
    }, 2000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [disbursePhase, disburseIntent?.reference, disburseDialog?.id]);

  const handleExport = () => {
    toast.success('Loan report exported successfully');
  };

  const getRepaymentProgress = (loan: Loan) => {
    if (loan.amount === 0) return 0;
    return Math.round((loan.totalPaid / loan.amount) * 100);
  };

  return (
    <div className="space-y-6">
      {confirmDialog}
      {/* A. Summary Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4"
      >
        {[
          {
            label: 'Total Loans',
            value: stats.totalLoans.toString(),
            subtitle: 'All applications',
            icon: FileText,
            color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30',
            trend: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />,
            trendLabel: '+12%',
          },
          {
            label: 'Total Disbursed',
            value: formatGHS(stats.totalDisbursed),
            subtitle: 'Active & repaid',
            icon: DollarSign,
            color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
            trend: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />,
            trendLabel: '+8.5%',
          },
          {
            label: 'Pending Approvals',
            value: stats.pendingApprovals.toString(),
            subtitle: 'Needs review',
            icon: Clock,
            color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
            trend: <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />,
            trendLabel: '-3',
          },
          {
            label: 'Default Rate',
            value: `${stats.defaultRate.toFixed(1)}%`,
            subtitle: 'Rejected & defaulted',
            icon: AlertTriangle,
            color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
            trend: stats.defaultRate < 15
              ? <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
              : <TrendingUp className="h-3.5 w-3.5 text-red-500" />,
            trendLabel: stats.defaultRate < 15 ? 'Healthy' : 'At risk',
          },
        ].map((s) => (
          <motion.div key={s.label} variants={itemVariants}>
            <Card className="mobile-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                  <p className="text-lg font-bold truncate">{s.value}</p>
                  <div className="flex items-center gap-1">
                    {s.trend}
                    <span className="text-[11px] text-muted-foreground">{s.trendLabel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* B. Loan Pipeline Section */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              Loan Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {pipelineStages.map((stage, idx) => (
                <div key={stage.key} className="flex items-center shrink-0">
                  <button
                    onClick={() => { setStatusFilter(stage.key); setPage(1); }}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:shadow-sm sm:px-4 sm:py-2.5 sm:text-sm ${stage.color}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                    <span className="whitespace-nowrap">{stage.label}</span>
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[11px] font-bold">
                      {pipelineCounts[stage.key] || 0}
                    </Badge>
                  </button>
                  {idx < pipelineStages.length - 1 && (
                    <ArrowRight className="mx-1 h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                </div>
              ))}
              {/* Rejected/Defaulted at the end */}
              <ArrowRight className="mx-1 h-3 w-3 shrink-0 text-muted-foreground" />
              <button
                onClick={() => { setStatusFilter('rejected'); setPage(1); }}
                className="flex items-center gap-1.5 rounded-lg border bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700 px-3 py-2 text-xs font-medium transition-colors hover:shadow-sm sm:px-4 sm:py-2.5 sm:text-sm shrink-0"
              >
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="whitespace-nowrap">Rejected</span>
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[11px] font-bold">
                  {pipelineCounts.rejected || 0}
                </Badge>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* C. Loan Management Table with Filters */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
        <Card>
          <CardContent className="p-0">
            {/* Tabs + Search + Export */}
            <div className="border-b p-3 lg:p-4">
              <Tabs value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList className="h-9">
                    <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs px-3">Pending</TabsTrigger>
                    <TabsTrigger value="active" className="text-xs px-3">Active</TabsTrigger>
                    <TabsTrigger value="repaid" className="text-xs px-3">Repaid</TabsTrigger>
                    <TabsTrigger value="rejected" className="text-xs px-3">Rejected</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search applicant..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                        className="h-9 pl-9 text-sm"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={handleExport}>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Export
                    </Button>
                  </div>
                </div>
              </Tabs>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto overscroll-x-contain scrollbar-hide">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Applicant</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Rate</th>
                    <th className="px-4 py-3 text-left font-medium">Term</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Credit Score</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLoans.map(loan => (
                    <tr
                      key={loan.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setDetailLoan(loan)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                              {getInitials(loan.applicantName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{loan.applicantName}</span>
                            <p className="text-xs text-muted-foreground">{loan.applicantPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColors[loan.type] || 'bg-gray-100 text-gray-800'}`}>
                          {loan.type.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatGHS(loan.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{loan.interestRate}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDuration(loan.term)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(loan.status)}`}>
                          {loan.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs font-semibold ${getCreditScoreColor(loan.creditScore)}`}>
                          {loan.creditScore}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(loan.startDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          {(loan.status === 'pending' || loan.status === 'under_review') && (
                            <>
                              <Button size="sm" className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                                onClick={() => runAiAssessment(loan)}>
                                <Sparkles className="mr-1 h-3 w-3" /> AI Check
                              </Button>
                              <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => setDetailLoan(loan)}>
                                <CheckCircle className="mr-1 h-3 w-3" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 px-2 text-xs"
                                onClick={() => setRejectDialog(loan)}>
                                <XCircle className="mr-1 h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                          {loan.status === 'approved' && (
                            <Button size="sm" className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => { setDisburseDialog(loan); setDisburseNumber(loan.applicantPhone); }}>
                              <Send className="mr-1 h-3 w-3" /> Disburse
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailLoan(loan)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y">
              {paginatedLoans.map(loan => (
                <div key={loan.id} className="mobile-card p-4 space-y-3" onClick={() => setDetailLoan(loan)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                          {getInitials(loan.applicantName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{loan.applicantName}</p>
                        <p className="text-xs text-muted-foreground truncate">{loan.applicantPhone}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(loan.status)}`}>
                      {loan.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{formatGHS(loan.amount)}</span></div>
                    <div><span className="text-muted-foreground">Rate:</span> <span>{loan.interestRate}%</span></div>
                    <div><span className="text-muted-foreground">Term:</span> <span>{formatDuration(loan.term)}</span></div>
                    <div><span className="text-muted-foreground">Monthly:</span> <span>{formatGHS(loan.monthlyPayment)}</span></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColors[loan.type] || ''}`}>{loan.type.replace('-', ' ')}</span>
                    <Badge variant="secondary" className={`text-xs font-semibold ${getCreditScoreColor(loan.creditScore)}`}>
                      Score: {loan.creditScore}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{formatDate(loan.startDate)}</span>
                  </div>
                  {(loan.status === 'active' || loan.status === 'repaid') && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Repayment</span>
                        <span className="font-medium">{getRepaymentProgress(loan)}%</span>
                      </div>
                      <Progress value={getRepaymentProgress(loan)} className="h-1.5" />
                    </div>
                  )}
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {(loan.status === 'pending' || loan.status === 'under_review') && (
                      <>
                        <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                          onClick={() => setDetailLoan(loan)}>
                          <CheckCircle className="mr-1 h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs min-h-[44px]"
                          onClick={() => setRejectDialog(loan)}>
                          <XCircle className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </>
                    )}
                    {loan.status === 'approved' && (
                      <Button size="sm" className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
                        onClick={() => { setDisburseDialog(loan); setDisburseNumber(loan.applicantPhone); }}>
                        <Send className="mr-1 h-3 w-3" /> Disburse
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-8 text-xs min-h-[44px]" onClick={() => setDetailLoan(loan)}>
                      <Eye className="mr-1 h-3 w-3" /> Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {paginatedLoans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No loans found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search query</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredLoans.length)} of {filteredLoans.length}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-9 w-9 lg:h-7 lg:w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="icon" className="h-9 w-9 lg:h-7 lg:w-7 text-xs" onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-9 w-9 lg:h-7 lg:w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* D. Loan Detail Dialog */}
      <Dialog open={!!detailLoan} onOpenChange={() => setDetailLoan(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
            <DialogDescription>Complete loan information and payment history</DialogDescription>
          </DialogHeader>
          {detailLoan && (
            <div className="space-y-4">
              {/* Applicant Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detailLoan.applicantName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{detailLoan.applicantName}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(detailLoan.status)}`}>
                      {detailLoan.status.replace('_', ' ')}
                    </Badge>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColors[detailLoan.type] || ''}`}>
                      {detailLoan.type.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Repayment Progress */}
              {(detailLoan.status === 'active' || detailLoan.status === 'repaid') && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Repayment Progress</span>
                    <span className="font-bold">{getRepaymentProgress(detailLoan)}%</span>
                  </div>
                  <Progress value={getRepaymentProgress(detailLoan)} className="h-2.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Paid: {formatGHS(detailLoan.totalPaid)}</span>
                    <span>Remaining: {formatGHS(detailLoan.remainingBalance)}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Applicant & Contact Info */}
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><span className="text-muted-foreground">ID:</span> <span className="font-medium ml-1">{detailLoan.applicantId}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{detailLoan.applicantPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{detailLoan.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Badge variant="secondary" className={`text-xs font-semibold ${getCreditScoreColor(detailLoan.creditScore)}`}>
                    Credit Score: {detailLoan.creditScore}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Financial Summary */}
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  Financial Summary
                </h4>
                <div className="grid gap-2.5 text-sm sm:grid-cols-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="font-medium">{formatGHS(detailLoan.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate</span><span>{detailLoan.interestRate}% p.a.</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span>{formatDuration(detailLoan.term)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly Payment</span><span className="font-medium">{formatGHS(detailLoan.monthlyPayment)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-medium text-emerald-600">{formatGHS(detailLoan.totalPaid)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Remaining Balance</span><span className="font-medium">{formatGHS(detailLoan.remainingBalance)}</span></div>
                </div>
              </div>

              {/* Disbursement & Dates */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Dates & Disbursement
                </h4>
                <div className="grid gap-2.5 text-sm sm:grid-cols-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Applied</span><span>{formatDate(detailLoan.startDate)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">End Date</span><span>{formatDate(detailLoan.endDate)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Next Payment</span><span>{formatDate(detailLoan.nextPaymentDate)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="capitalize">{detailLoan.disbursementMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'}</span></div>
                  {detailLoan.disbursementNumber && (
                    <div className="flex justify-between sm:col-span-2"><span className="text-muted-foreground">Disbursement Number</span><span>{detailLoan.disbursementNumber}</span></div>
                  )}
                  {detailLoan.disbursementProvider && (
                    <div className="flex justify-between sm:col-span-2"><span className="text-muted-foreground">Provider</span><span>{detailLoan.disbursementProvider}</span></div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Purpose:</span> <span className="ml-1">{detailLoan.purpose}</span></p>
                {detailLoan.guarantorName && (
                  <p>
                    <span className="text-muted-foreground">Guarantor:</span>{' '}
                    <span className="ml-1">{detailLoan.guarantorName}</span>
                    {detailLoan.guarantorPhone && <span className="text-muted-foreground"> ({detailLoan.guarantorPhone})</span>}
                  </p>
                )}
                {detailLoan.collateral && <p><span className="text-muted-foreground">Collateral:</span> <span className="ml-1">{detailLoan.collateral}</span></p>}
                {detailLoan.rejectReason && (
                  <p className="text-red-600">
                    <span className="font-medium">Rejection Reason:</span> {detailLoan.rejectReason}
                  </p>
                )}
                {detailLoan.reviewedBy && (
                  <p>
                    <span className="text-muted-foreground">Reviewed By:</span>{' '}
                    <span className="ml-1">{detailLoan.reviewedBy}</span>
                    {detailLoan.reviewDate && <span className="text-muted-foreground"> on {formatDate(detailLoan.reviewDate)}</span>}
                  </p>
                )}
              </div>

              {/* Payment History */}
              {loanPaymentsForLoan.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2 text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Payment History
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2 overscroll-contain">
                      {loanPaymentsForLoan.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                          <div>
                            <p className="font-medium">{formatGHS(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(payment.date)} · {payment.method === 'momo' ? 'Mobile Money' : payment.method === 'bank' ? 'Bank' : 'Agent'}
                            </p>
                          </div>
                          <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 sm:flex-row">
                {(detailLoan.status === 'pending' || detailLoan.status === 'under_review') && (
                  <>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                      onClick={handleApprove}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve Loan
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 min-h-[44px]"
                      onClick={() => { setRejectDialog(detailLoan); setDetailLoan(null); }}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject Loan
                    </Button>
                  </>
                )}
                {detailLoan.status === 'approved' && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                    onClick={() => { setDisburseDialog(detailLoan); setDisburseNumber(detailLoan.applicantPhone); setDetailLoan(null); }}
                  >
                    <Send className="mr-2 h-4 w-4" /> Disburse Funds
                  </Button>
                )}
                {detailLoan.status === 'active' && (
                  <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => toast.success('Repayment schedule opened')}>
                    <Calendar className="mr-2 h-4 w-4" /> View Schedule
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason(''); }}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" /> Reject Loan
            </DialogTitle>
            <DialogDescription>Provide a reason for rejecting this loan application</DialogDescription>
          </DialogHeader>
          {rejectDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p><span className="text-muted-foreground">Applicant:</span> {rejectDialog.applicantName}</p>
                <p><span className="text-muted-foreground">Amount:</span> {formatGHS(rejectDialog.amount)}</p>
                <p><span className="text-muted-foreground">Purpose:</span> {rejectDialog.purpose}</p>
              </div>
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <Textarea
                  placeholder="Enter the reason for rejecting this loan..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason(''); }}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject}>
                  <XCircle className="mr-1 h-4 w-4" /> Reject Loan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E. Quick Disburse Dialog */}
      <Dialog open={!!disburseDialog} onOpenChange={(open) => { if (!open && disbursePhase !== 'processing') resetDisburse(); }}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Send className="h-5 w-5" /> Disburse Loan
            </DialogTitle>
            <DialogDescription>
              {disbursePhase === 'form' && 'Send the approved funds to the borrower via the live gateway'}
              {disbursePhase === 'processing' && 'Transfer in flight — the network is processing it'}
              {disbursePhase === 'success' && 'Funds delivered — the loan is now active'}
              {disbursePhase === 'failed' && 'The transfer did not go through'}
              {disbursePhase === 'timeout' && 'Still waiting on the network'}
            </DialogDescription>
          </DialogHeader>

          {/* ══════════ FORM ══════════ */}
          {disburseDialog && disbursePhase === 'form' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Applicant</span><span className="font-medium">{disburseDialog.applicantName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="text-lg font-bold text-blue-600">{formatGHS(disburseDialog.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{disburseDialog.type.replace('-', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span>{formatDuration(disburseDialog.term)}</span></div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Disbursement Method</Label>
                  <Select value={disburseMethod} onValueChange={setDisburseMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momo">
                        <span className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" /> Mobile Money (Hubtel / Paystack)
                        </span>
                      </SelectItem>
                      <SelectItem value="bank">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Bank Transfer
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {disburseMethod === 'momo' ? (
                  <div className="space-y-2">
                    <Label>Mobile Money Number</Label>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 items-center rounded-lg border bg-muted px-3 text-sm font-semibold">+233</span>
                      <Input
                        placeholder="24 123 4567"
                        value={disburseNumber}
                        onChange={e => setDisburseNumber(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      A payment push is sent to this number — the borrower approves it on their handset.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input
                      placeholder="e.g. Ama Mensah"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                    />
                    <Label>Bank</Label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {GHANA_BANKS.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label>Account Number</Label>
                    <Input
                      placeholder="10–17 digits"
                      inputMode="numeric"
                      value={disburseNumber}
                      onChange={e => setDisburseNumber(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Banknote className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-400">Gateway rails</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400/70 mt-0.5">
                      {formatGHS(disburseDialog.amount)} will be pushed to {disburseDialog.applicantName} via{' '}
                      {disburseMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'} through Hubtel / Paystack.
                      Without provider keys it runs in test mode (no real money moves).
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetDisburse}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={submitDisbursement}>
                  <Send className="mr-1 h-4 w-4" /> Send {formatGHS(disburseDialog.amount)}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ══════════ PROCESSING ══════════ */}
          {disbursePhase === 'processing' && disburseIntent && (
            <div className="space-y-5 py-2">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-400/30"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-[spin_1.2s_linear_infinite]" />
                  <Send className="absolute inset-0 m-auto h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold">Transfer in flight</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {disburseIntent.channel === 'momo'
                      ? `${disburseIntent.network === 'MTN' ? 'MTN MoMo' : disburseIntent.network === 'TELECEL' ? 'Telecel Cash' : 'AT Money'} is pushing ₵${disburseIntent.amount.toLocaleString()} to ${disburseIntent.phone}`
                      : `${disburseIntent.bank?.bankName} account ${disburseIntent.bank?.accountNumber} is being credited`}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold">{formatGHS(disburseIntent.amount)}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground">Reference</p>
                  <p className="text-xs font-mono font-semibold">{disburseIntent.reference.slice(0, 14)}…</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground">Elapsed</p>
                  <p className="text-sm font-bold tabular-nums">{elapsed}s</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 animate-pulse text-blue-600" />
                Waiting for the network… transfers usually land in under 20 seconds.
              </div>
            </div>
          )}

          {/* ══════════ SUCCESS ══════════ */}
          {disbursePhase === 'success' && disburseIntent && (
            <div className="space-y-4 py-2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40"
              >
                <CheckCircle className="h-11 w-11 text-blue-600" />
              </motion.div>
              <div>
                <p className="text-lg font-bold">Funds delivered</p>
                <p className="text-sm text-muted-foreground">
                  The loan is active and repayment starts next month.
                </p>
              </div>
              <div className="space-y-1.5 rounded-xl border bg-muted/40 p-3 text-left text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatGHS(disburseIntent.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span className="font-semibold">{disburseIntent.channel === 'momo' ? `${disburseIntent.network} MoMo` : disburseIntent.bank?.bankName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="font-semibold">{disburseIntent.provider === 'hubtel' ? 'Hubtel' : 'Paystack'} · {disburseIntent.mode === 'live' ? 'live' : 'test'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{disburseIntent.reference}</span></div>
              </div>
              <Button className="w-full h-11 font-semibold" onClick={resetDisburse}>Done</Button>
            </div>
          )}

          {/* ══════════ FAILED / TIMEOUT ══════════ */}
          {(disbursePhase === 'failed' || disbursePhase === 'timeout') && (
            <div className="space-y-4 py-2 text-center">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${disbursePhase === 'failed' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                {disbursePhase === 'failed'
                  ? <XCircle className="h-11 w-11 text-red-600" />
                  : <AlertTriangle className="h-11 w-11 text-amber-600" />}
              </div>
              <div>
                <p className="text-lg font-bold">{disbursePhase === 'failed' ? 'Transfer failed' : 'No confirmation yet'}</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  {disbursePhase === 'failed'
                    ? (disburseIntent?.message ?? 'The network rejected the transfer. No money has left the platform.')
                    : 'The network has not confirmed the transfer. If it settles late, the loan will activate automatically — check the ledger in a minute.'}
                </p>
              </div>
              {disburseIntent && (
                <div className="rounded-xl border bg-muted/40 p-3 text-left text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{disburseIntent.reference}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatGHS(disburseIntent.amount)}</span></div>
                </div>
              )}
              <div className="flex gap-2">
                {disbursePhase === 'failed' && (
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setDisbursePhase('form')}>
                    <RefreshCw className="mr-1 h-4 w-4" /> Try again
                  </Button>
                )}
                <Button className="flex-1 h-11 font-semibold" onClick={resetDisburse}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Risk Assessment Dialog */}
      <Dialog open={!!aiLoan} onOpenChange={(open) => { if (!open) { setAiLoan(null); setAiResult(null); setAiError(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              AI Risk Assessment
            </DialogTitle>
            <DialogDescription>
              {aiLoan && <>Susu AI credit analysis for <span className="font-medium text-foreground">{aiLoan.applicantName}</span> — {formatGHS(aiLoan.amount)} {aiLoan.type.replace('-', ' ')} loan</>}
            </DialogDescription>
          </DialogHeader>

          {aiLoading && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3 rounded-xl border bg-violet-50 dark:bg-violet-950/20 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                <div>
                  <p className="text-sm font-medium">Susu AI is evaluating this application…</p>
                  <p className="text-xs text-muted-foreground">Reviewing credit profile, amount, purpose and term.</p>
                </div>
              </div>
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-start gap-3 rounded-xl border p-3">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1.5 py-1">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!aiLoading && aiError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
              {aiError}
            </div>
          )}

          {!aiLoading && aiResult && (
            <div className="space-y-4">
              {/* Risk level + score */}
              <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const style = riskStyles[aiResult.riskLevel] || riskStyles.medium;
                    const Icon = style.icon;
                    return (
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 ${style.badge}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <p className="text-lg font-bold capitalize">{aiResult.riskLevel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">AI Score</p>
                  <p className="text-2xl font-bold tabular-nums">{aiResult.score}<span className="text-sm text-muted-foreground">/100</span></p>
                </div>
              </div>

              {/* Score bar */}
              <Progress value={aiResult.score} className="h-2" />

              {/* Recommendation */}
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{aiResult.recommendation}</p>
              </div>

              {/* Factors */}
              <div className="space-y-2">
                {aiResult.factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border p-2.5">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      f.impact === 'positive' ? 'bg-emerald-500' : f.impact === 'negative' ? 'bg-rose-500' : 'bg-slate-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{f.factor}</p>
                      <p className="text-xs text-muted-foreground">{f.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAiLoan(null); setAiResult(null); setAiError(null); }}>
              Close
            </Button>
            {aiResult && aiLoan && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setAiLoan(null); setAiResult(null); setDetailLoan(aiLoan); }}
              >
                Continue to Approval
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
