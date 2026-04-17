'use client';

import { useState, useMemo } from 'react';
import { useAdminStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials, formatCompactNumber } from '@/lib/formatters';
import { loanPayments } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import {
  Landmark, Clock, DollarSign, AlertTriangle, CheckCircle, XCircle,
  Eye, Filter, ChevronLeft, ChevronRight, CreditCard, Calendar,
  User, Phone, MapPin, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const typeColors: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  business: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  education: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'susu-backed': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export function AdminLoans() {
  const { allLoans, approveLoan, rejectLoan } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [approveDialog, setApproveDialog] = useState<Loan | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Loan | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);

  const filteredLoans = useMemo(() => {
    return allLoans.filter(l => {
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchType = typeFilter === 'all' || l.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [allLoans, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredLoans.length / ITEMS_PER_PAGE);
  const paginatedLoans = filteredLoans.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pendingCount = allLoans.filter(l => l.status === 'pending').length;
  const activeCount = allLoans.filter(l => l.status === 'active').length;
  const totalDisbursed = allLoans.filter(l => l.status !== 'pending' && l.status !== 'rejected' && l.status !== 'under_review').reduce((s, l) => s + l.totalPaid, 0);
  const defaultedCount = allLoans.filter(l => l.status === 'defaulted').length;

  const handleApprove = () => {
    if (approveDialog) {
      approveLoan(approveDialog.id);
      toast.success(`Loan ${approveDialog.id} approved for ${approveDialog.applicantName}`);
      setApproveDialog(null);
    }
  };

  const handleReject = () => {
    if (rejectDialog && rejectReason.trim()) {
      rejectLoan(rejectDialog.id, rejectReason);
      toast.error(`Loan ${rejectDialog.id} rejected for ${rejectDialog.applicantName}`);
      setRejectDialog(null);
      setRejectReason('');
    } else {
      toast.error('Please enter a rejection reason');
    }
  };

  const loanPaymentsForLoan = detailLoan ? loanPayments.filter(p => p.loanId === detailLoan.id) : [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Active Loans', value: activeCount, icon: Landmark, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Total Disbursed', value: formatGHS(totalDisbursed), icon: DollarSign, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Defaulted', value: defaultedCount, icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="repaid">Repaid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Loan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="susu-backed">Susu-backed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground self-center">{filteredLoans.length} loans found</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loans Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Applicant</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Rate</th>
                    <th className="px-4 py-3 text-left font-medium">Term</th>
                    <th className="px-4 py-3 text-left font-medium">Monthly</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Score</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLoans.map(loan => (
                    <tr key={loan.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                              {getInitials(loan.applicantName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{loan.applicantName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{loan.applicantPhone}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[loan.type] || 'bg-gray-100 text-gray-800'}`}>
                          {loan.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatGHS(loan.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{loan.interestRate}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{loan.term}mo</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatGHS(loan.monthlyPayment)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(loan.status)}`}>
                          {loan.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{loan.branch}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${loan.creditScore >= 70 ? 'text-emerald-600' : loan.creditScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {loan.creditScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {(loan.status === 'pending' || loan.status === 'under_review') && (
                            <>
                              <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => setApproveDialog(loan)}>
                                <CheckCircle className="mr-1 h-3 w-3" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 px-2 text-xs"
                                onClick={() => setRejectDialog(loan)}>
                                <XCircle className="mr-1 h-3 w-3" /> Reject
                              </Button>
                            </>
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
                <div key={loan.id} className="p-4 space-y-3">
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
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(loan.status)}`}>
                      {loan.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{formatGHS(loan.amount)}</span></div>
                    <div><span className="text-muted-foreground">Rate:</span> <span>{loan.interestRate}%</span></div>
                    <div><span className="text-muted-foreground">Term:</span> <span>{loan.term} months</span></div>
                    <div><span className="text-muted-foreground">Monthly:</span> <span>{formatGHS(loan.monthlyPayment)}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[loan.type] || ''}`}>{loan.type}</span>
                    <span className={`text-xs font-medium ${loan.creditScore >= 70 ? 'text-emerald-600' : loan.creditScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      Score: {loan.creditScore}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {(loan.status === 'pending' || loan.status === 'under_review') && (
                      <>
                        <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setApproveDialog(loan)}>
                          <CheckCircle className="mr-1 h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs"
                          onClick={() => setRejectDialog(loan)}>
                          <XCircle className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDetailLoan(loan)}>
                      <Eye className="mr-1 h-3 w-3" /> Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredLoans.length)} of {filteredLoans.length}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="icon" className="h-7 w-7 text-xs" onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" /> Approve Loan
            </DialogTitle>
            <DialogDescription>Review and confirm loan approval</DialogDescription>
          </DialogHeader>
          {approveDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Applicant</span><span className="font-medium">{approveDialog.applicantName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatGHS(approveDialog.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{approveDialog.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span>{approveDialog.term} months</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate</span><span>{approveDialog.interestRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monthly Payment</span><span className="font-medium">{formatGHS(approveDialog.monthlyPayment)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Credit Score</span><span>{approveDialog.creditScore}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Purpose</span><span className="max-w-[180px] text-right">{approveDialog.purpose}</span></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveDialog(null)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Confirm Approval
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason(''); }}>
        <DialogContent className="max-w-md">
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
              </div>
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <Textarea placeholder="Enter the reason for rejecting this loan..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
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

      {/* Loan Details Dialog */}
      <Dialog open={!!detailLoan} onOpenChange={() => setDetailLoan(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
            <DialogDescription>Complete loan information and payment history</DialogDescription>
          </DialogHeader>
          {detailLoan && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detailLoan.applicantName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{detailLoan.applicantName}</p>
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(detailLoan.status)}`}>
                    {detailLoan.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Phone:</span> {detailLoan.applicantPhone}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Branch:</span> {detailLoan.branch}</div>
                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Type:</span> {detailLoan.type}</div>
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Credit Score:</span> {detailLoan.creditScore}</div>
              </div>

              <Separator />

              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 text-sm font-semibold">Financial Summary</h4>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="font-medium">{formatGHS(detailLoan.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate</span><span>{detailLoan.interestRate}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span>{detailLoan.term} months</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly Payment</span><span className="font-medium">{formatGHS(detailLoan.monthlyPayment)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-medium text-emerald-600">{formatGHS(detailLoan.totalPaid)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-medium">{formatGHS(detailLoan.remainingBalance)}</span></div>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Purpose:</span> {detailLoan.purpose}</p>
                {detailLoan.guarantorName && <p><span className="text-muted-foreground">Guarantor:</span> {detailLoan.guarantorName} ({detailLoan.guarantorPhone})</p>}
                {detailLoan.collateral && <p><span className="text-muted-foreground">Collateral:</span> {detailLoan.collateral}</p>}
                {detailLoan.rejectReason && <p><span className="text-red-600">Rejection Reason:</span> {detailLoan.rejectReason}</p>}
                {detailLoan.reviewedBy && <p><span className="text-muted-foreground">Reviewed By:</span> {detailLoan.reviewedBy} on {formatDate(detailLoan.reviewDate || '')}</p>}
              </div>

              {loanPaymentsForLoan.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Payment History</h4>
                    <div className="space-y-2">
                      {loanPaymentsForLoan.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                          <div>
                            <p className="font-medium">{formatGHS(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(payment.date)} &middot; {payment.method}</p>
                          </div>
                          <Badge variant="secondary" className={`text-xs ${getStatusColor(payment.status)}`}>{payment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
