'use client';

import { useMemo, useState } from 'react';
import { useLoanOfficerStore } from '@/store/staff-stores';
import { formatGHS, formatDate, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/shared/mobile-components';
import { Briefcase, Phone, ShieldAlert, TrendingDown, PieChart, CalendarCheck } from 'lucide-react';
import type { PortfolioLoan } from '@/lib/types';

const classMeta: Record<PortfolioLoan['classification'], { badge: string; label: string }> = {
  current: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Current' },
  watch: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: 'Watch (1–30d)' },
  substandard: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', label: 'Substandard (31–60d)' },
  doubtful: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', label: 'Doubtful (61–90d)' },
  loss: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', label: 'Loss (90d+)' },
};

export function LoanOfficerPortfolio() {
  const { portfolio, recordFollowUp } = useLoanOfficerStore();
  const [filter, setFilter] = useState('all');
  const [followUp, setFollowUp] = useState<PortfolioLoan | null>(null);
  const [detail, setDetail] = useState<PortfolioLoan | null>(null);
  const [note, setNote] = useState('');

  const filtered = useMemo(() =>
    portfolio.filter(p => filter === 'all' || p.classification === filter),
    [portfolio, filter]
  );

  const totals = useMemo(() => {
    const outstanding = portfolio.reduce((s, p) => s + p.outstanding, 0);
    const byClass = (['current', 'watch', 'substandard', 'doubtful', 'loss'] as const).map(c => ({
      classification: c,
      amount: portfolio.filter(p => p.classification === c).reduce((s, p) => s + p.outstanding, 0),
      count: portfolio.filter(p => p.classification === c).length,
    }));
    const par30 = portfolio.filter(p => p.arrearsDays > 30).reduce((s, p) => s + p.outstanding, 0);
    return { outstanding, byClass, par30, par30Pct: Math.round((par30 / outstanding) * 100) };
  }, [portfolio]);

  const handleFollowUp = () => {
    if (!followUp) return;
    if (!note.trim()) {
      toast.error('Add a follow-up note for the customer file.');
      return;
    }
    const promisedDays = followUp.arrearsDays <= 15 ? 0 : Math.max(followUp.arrearsDays - 15, 0);
    recordFollowUp(followUp.id, promisedDays);
    toast.success(`Follow-up logged — ${followUp.customerName}`, {
      description: promisedDays === 0 ? 'Customer promised full settlement; loan moved to current.' : 'Promise-to-pay recorded; reminders scheduled by SMS.',
    });
    setFollowUp(null);
    setNote('');
  };

  return (
    <div className="space-y-5">
      {/* PAR summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="mobile-card">
          <CardContent className="p-3 lg:p-4">
            <p className="text-xs text-muted-foreground">Portfolio Outstanding</p>
            <p className="text-lg font-bold lg:text-2xl">{formatGHS(totals.outstanding)}</p>
            <p className="text-[11px] text-muted-foreground">{portfolio.length} loans</p>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-3 lg:p-4">
            <p className="text-xs text-muted-foreground">PAR 30</p>
            <p className={`text-lg font-bold lg:text-2xl ${totals.par30Pct > 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{totals.par30Pct}%</p>
            <p className="text-[11px] text-muted-foreground">BoG limit ≤ 5%</p>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-3 lg:p-4">
            <p className="text-xs text-muted-foreground">In Arrears</p>
            <p className="text-lg font-bold lg:text-2xl">{portfolio.filter(p => p.arrearsDays > 0).length}</p>
            <p className="text-[11px] text-muted-foreground">loans need follow-up</p>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-3 lg:p-4">
            <p className="text-xs text-muted-foreground">At Risk Value</p>
            <p className="text-lg font-bold lg:text-2xl">{formatGHS(totals.par30)}</p>
            <p className="text-[11px] text-muted-foreground">31+ days outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Classification chart */}
      <Card className="border-l-4 border-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Portfolio Classification (BoG NBFRI bands)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {totals.byClass.map(c => {
            const pct = totals.outstanding ? Math.round((c.amount / totals.outstanding) * 100) : 0;
            return (
              <div key={c.classification} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${classMeta[c.classification].badge.split(' ')[0]}`} /> {classMeta[c.classification].label}</span>
                  <span className="text-muted-foreground">{formatGHS(c.amount)} · {c.count} loans · {pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`h-full rounded-full ${classMeta[c.classification].badge.split(' ')[0].replace('bg-', 'bg-')}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'current', 'watch', 'substandard', 'doubtful', 'loss'] as const).map(c => (
          <Button key={c} size="sm" variant={filter === c ? 'default' : 'outline'} className="min-h-[40px] capitalize touch-manipulation" onClick={() => setFilter(c)}>
            {c === 'all' ? 'All' : classMeta[c].label}
          </Button>
        ))}
      </div>

      {/* Loan list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No portfolio loans found"
            description="Try adjusting the classification filter."
          />
        ) : filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}>
            <Card
              onClick={() => setDetail(p)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(p); } }}
              role="button"
              tabIndex={0}
              aria-label={`View loan details for ${p.customerName}`}
              className="mobile-card cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              <CardContent className="p-3.5">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{p.customerName}</p>
                      <Badge className={`text-[10px] ${classMeta[p.classification].badge}`}>{classMeta[p.classification].label}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.productName} · {p.branch} · principal {formatGHS(p.principal)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold">{formatGHS(p.outstanding)}</p>
                      <p className="text-[11px] text-muted-foreground">last pay {formatDate(p.lastPaymentDate)}</p>
                    </div>
                    {p.arrearsDays > 0 && (
                      <Button size="sm" variant="outline" className="min-h-[40px] shrink-0 touch-manipulation" onClick={(e) => { e.stopPropagation(); setFollowUp(p); }}>
                        <Phone className="mr-1 h-3.5 w-3.5" /> Follow up
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Follow-up dialog */}
      <Dialog open={!!followUp} onOpenChange={(open) => { if (!open) { setFollowUp(null); setNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Follow-up</DialogTitle>
            <DialogDescription>{followUp?.customerName} — {followUp ? formatGHS(followUp.outstanding) : ''} outstanding · {followUp?.arrearsDays} days in arrears</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} placeholder="e.g. Customer promises ₵500 on Friday (Makola market day). Guarantor to visit branch Monday..." value={note} onChange={e => setNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setFollowUp(null)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handleFollowUp}><CalendarCheck className="mr-2 h-4 w-4" /> Save Follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
            <DialogDescription>Portfolio loan position and repayment status</DialogDescription>
          </DialogHeader>
          {detail && (() => {
            const paid = Math.max(detail.principal - detail.outstanding, 0);
            const repaidPct = detail.principal ? Math.min(100, Math.round((paid / detail.principal) * 100)) : 0;
            return (
              <div className="space-y-4">
                {/* Identity header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                      {getInitials(detail.customerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">{detail.customerName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={`text-xs ${classMeta[detail.classification].badge}`}>
                        {classMeta[detail.classification].label}
                      </Badge>
                      {detail.arrearsDays > 0 && (
                        <Badge className="bg-red-100 text-[10px] text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          {detail.arrearsDays} days in arrears
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Repayment progress */}
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Repaid To Date</span>
                    <span className="font-bold">{repaidPct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${repaidPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Paid: {formatGHS(paid)}</span>
                    <span>Outstanding: {formatGHS(detail.outstanding)}</span>
                  </div>
                </div>

                <Separator />

                {/* Loan details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0"><p className="text-xs text-muted-foreground">Product</p><p className="truncate font-medium">{detail.productName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Principal</p><p className="font-medium">{formatGHS(detail.principal)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Outstanding</p><p className="font-medium">{formatGHS(detail.outstanding)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Paid</p><p className="font-medium text-emerald-600 dark:text-emerald-400">{formatGHS(paid)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Arrears Days</p><p className="font-medium">{detail.arrearsDays}</p></div>
                  <div><p className="text-xs text-muted-foreground">Classification</p><p className="font-medium">{classMeta[detail.classification].label}</p></div>
                  <div><p className="text-xs text-muted-foreground">Last Payment</p><p className="font-medium">{formatDate(detail.lastPaymentDate)}</p></div>
                  <div className="min-w-0"><p className="text-xs text-muted-foreground">Branch</p><p className="truncate font-medium">{detail.branch}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Loan Reference</p><p className="truncate font-medium">{detail.id}</p></div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
