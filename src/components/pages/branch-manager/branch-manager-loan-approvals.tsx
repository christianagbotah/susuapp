'use client';

import { useState } from 'react';
import { useBranchManagerStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { ClipboardCheck, CircleDollarSign, CheckCircle2, XCircle, Eye, CalendarDays, UserCheck } from 'lucide-react';
import type { LoanApprovalRequest } from '@/lib/types';

export function BranchManagerLoanApprovals() {
  const { approvals, decideApproval } = useBranchManagerStore();
  const [filter, setFilter] = useState<'all' | 'pending_bm' | 'approved' | 'rejected'>('pending_bm');
  const [detail, setDetail] = useState<LoanApprovalRequest | null>(null);
  const [rejectOpen, setRejectOpen] = useState<LoanApprovalRequest | null>(null);
  const [reason, setReason] = useState('');

  // Confirmation dialog for sensitive actions
  const [confirmDialog, askConfirm] = useConfirm();

  const filtered = approvals.filter(a => filter === 'all' || a.status === filter);
  const counts = {
    pending: approvals.filter(a => a.status === 'pending_bm').length,
    approved: approvals.filter(a => a.status === 'approved' || a.status === 'disbursed').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  };

  const approve = (a: LoanApprovalRequest) => {
    askConfirm({
      title: 'Approve Loan Application',
      description: 'You are about to approve this loan and release funds to the disbursement queue. The loan officer and customer will be notified by SMS.',
      subject: `${a.applicantName} — ${formatGHS(a.amount)}`,
      details: [
        { label: 'Product', value: a.productName },
        { label: 'Credit Grade', value: a.creditGrade },
        { label: 'Officer', value: a.officerName },
      ],
      confirmLabel: 'Yes, Approve Loan',
      variant: 'success',
      onConfirm: () => {
        decideApproval(a.id, 'approved');
        setDetail(null);
        toast.success(`Loan approved — ${a.applicantName}`, {
          description: `${formatGHS(a.amount)} released to disbursement queue. Officer & customer notified via SMS.`,
        });
      },
    });
  };

  const reject = () => {
    if (!rejectOpen) return;
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason — required for audit trail.');
      return;
    }
    decideApproval(rejectOpen.id, 'rejected');
    toast.error(`Loan rejected — ${rejectOpen.applicantName}`, { description: 'Reason logged; customer notified with next steps.' });
    setRejectOpen(null);
    setDetail(null);
    setReason('');
  };

  const gradeColor = (g: LoanApprovalRequest['creditGrade']) =>
    g === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    : g === 'B' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    : g === 'C' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    : g === 'D' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';

  return (
    <div className="space-y-5">
      {confirmDialog}
      {/* Summary + filters */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: counts.pending, icon: ClipboardCheck, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <Card key={s.label} className="mobile-card">
            <CardContent className="flex items-center gap-3 p-3 lg:p-4">
              <s.icon className={`h-6 w-6 lg:h-8 lg:w-8 ${s.color}`} />
              <div>
                <p className="text-xl font-bold lg:text-2xl">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['pending_bm', `Pending (${counts.pending})`],
          ['approved', 'Approved'],
          ['rejected', 'Rejected'],
          ['all', 'All'],
        ] as const).map(([key, label]) => (
          <Button key={key} size="sm" variant={filter === key ? 'default' : 'outline'} className="min-h-[40px] touch-manipulation" onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      {/* Approval cards */}
      <div className="space-y-3">
        {filtered.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <Card className="mobile-card hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.applicantName}</p>
                      <Badge className={`text-[10px] ${gradeColor(a.creditGrade)}`}>Grade {a.creditGrade}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{a.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{a.productName} · {a.purpose}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> LO: {a.officerName}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(a.requestDate)}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="text-lg font-bold">{formatGHS(a.amount)}</p>
                    <Button size="sm" variant="outline" className="min-h-[40px] touch-manipulation" onClick={() => setDetail(a)}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Nothing here right now.
          </CardContent></Card>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Loan Approval Review</DialogTitle>
                <DialogDescription>{detail.applicantName} · {detail.productName} · Applied {formatDate(detail.requestDate)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Amount', formatGHS(detail.amount)],
                    ['Tenor', `${detail.tenorMonths} months`],
                    ['Interest Rate', `${detail.interestRate}% / month`],
                    ['Monthly Deduction', formatGHS(detail.monthlyDeduction)],
                    ['Appraisal Score', `${detail.appraisalScore}/100`],
                    ['Credit Grade', detail.creditGrade],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">{k}</p>
                      <p className="text-sm font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Purpose</p>
                  <p className="text-sm">{detail.purpose}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <div>
                    <p className="text-xs text-muted-foreground">Loan Officer recommendation</p>
                    <p className="text-sm font-semibold capitalize">{detail.officerRecommendation} — {detail.officerName}</p>
                  </div>
                  <Badge className={detail.officerRecommendation === 'approve' ? 'bg-emerald-600' : detail.officerRecommendation === 'review' ? 'bg-amber-600' : 'bg-red-600'}>
                    {detail.officerRecommendation}
                  </Badge>
                </div>
                {detail.status === 'pending_bm' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 touch-manipulation" onClick={() => approve(detail)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" className="min-h-[44px] touch-manipulation" onClick={() => { setRejectOpen(detail); }}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={(open) => { if (!open) { setRejectOpen(null); setReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
            <DialogDescription>Required for the audit trail and customer SMS notification.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} placeholder="e.g. Debt service ratio exceeds 45% of verified daily susu inflows..." value={reason} onChange={e => setReason(e.target.value)} className="min-h-[100px]" />
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => { setRejectOpen(null); setReason(''); }}>Cancel</Button>
            <Button variant="destructive" className="min-h-[44px]" onClick={reject}><XCircle className="mr-2 h-4 w-4" /> Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
