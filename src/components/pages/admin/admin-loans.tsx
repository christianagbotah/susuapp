'use client';

import { useState, useMemo } from 'react';
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
  Wallet, ArrowUpRight,
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
import type { Loan } from '@/lib/types';

const ITEMS_PER_PAGE = 8;

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
  const { allLoans, approveLoan, rejectLoan } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Loan | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [disburseDialog, setDisburseDialog] = useState<Loan | null>(null);
  const [disburseMethod, setDisburseMethod] = useState('momo');
  const [disburseNumber, setDisburseNumber] = useState('');

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
    if (detailLoan) {
      approveLoan(detailLoan.id);
      toast.success(`Loan approved for ${detailLoan.applicantName}`);
      setDetailLoan(null);
    }
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

  const handleDisburse = () => {
    if (disburseDialog) {
      if (!disburseNumber.trim()) {
        toast.error('Please enter recipient number/account');
        return;
      }
      toast.success(`₵${disburseDialog.amount.toLocaleString()} disbursed to ${disburseDialog.applicantName} via ${disburseMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'}`);
      setDisburseDialog(null);
      setDisburseNumber('');
      setDisburseMethod('momo');
    }
  };

  const handleExport = () => {
    toast.success('Loan report exported successfully');
  };

  const getRepaymentProgress = (loan: Loan) => {
    if (loan.amount === 0) return 0;
    return Math.round((loan.totalPaid / loan.amount) * 100);
  };

  return (
    <div className="space-y-6">
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
                      <div>
                        <p className="font-medium text-sm">{loan.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{loan.applicantPhone}</p>
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
                  <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => toast.info('Repayment schedule viewed')}>
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
      <Dialog open={!!disburseDialog} onOpenChange={() => { setDisburseDialog(null); setDisburseNumber(''); setDisburseMethod('momo'); }}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Send className="h-5 w-5" /> Disburse Loan
            </DialogTitle>
            <DialogDescription>Confirm disbursement details for this approved loan</DialogDescription>
          </DialogHeader>
          {disburseDialog && (
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
                          <Wallet className="h-4 w-4" /> Mobile Money
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

                <div className="space-y-2">
                  <Label>{disburseMethod === 'momo' ? 'Mobile Money Number' : 'Bank Account Number'}</Label>
                  <Input
                    placeholder={disburseMethod === 'momo' ? 'e.g. 024 123 4567' : 'e.g. 0123456789012'}
                    value={disburseNumber}
                    onChange={e => setDisburseNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Banknote className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-400">Confirm Disbursement</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400/70 mt-0.5">
                      {formatGHS(disburseDialog.amount)} will be sent to {disburseDialog.applicantName} via{' '}
                      {disburseMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'}.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDisburseDialog(null); setDisburseNumber(''); setDisburseMethod('momo'); }}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleDisburse}>
                  <Send className="mr-1 h-4 w-4" /> Confirm Disbursement
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
