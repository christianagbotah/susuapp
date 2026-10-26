'use client';

import { useState } from 'react';
import { useTellerStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Wallet, Users, ArrowDownToLine, ArrowUpFromLine, Scale,
  Landmark, Vault, Clock, CheckCircle2, TrendingUp, Landmark as BankIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { VaultTransfer } from '@/lib/types';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const transferStatusBadge = (s: VaultTransfer['status']) =>
  s === 'requested'
    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    : s === 'approved'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';

const openOnKey = (fn: () => void) => (e: React.KeyboardEvent<HTMLDivElement>): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

function DetailField({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function TellerDashboard() {
  const { user, drawer, queue, transfers, setActivePage } = useTellerStore();
  const [detailTransfer, setDetailTransfer] = useState<VaultTransfer | null>(null);

  const waiting = queue.filter(q => q.status === 'waiting').length;
  const processedToday = queue.filter(q => q.status === 'completed').length;
  const momoIn = 41280 + 8940 + 3620;

  const statsCards = [
    { title: 'Drawer Balance (expected)', value: formatGHS(drawer.expectedBalance), icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', page: 'vault' as const },
    { title: 'Cash In / Out Today', value: `${formatGHS(drawer.cashIn)} / ${formatGHS(drawer.cashOut)}`, icon: ArrowDownToLine, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', page: 'counter' as const },
    { title: 'Customers Waiting', value: `${waiting}`, icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', page: 'counter' as const },
    { title: 'Processed Today', value: `${processedToday}`, icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', page: 'counter' as const },
  ];

  const pendingTransfers = transfers.filter(t => ['requested', 'approved', 'in_transit'].includes(t.status));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div {...fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">Welcome, {user.name.split(' ')[0]}!</h1>
                  <Badge className="border-cyan-300 bg-cyan-500/40 text-white">Teller · Counter 2</Badge>
                </div>
                <p className="text-sm text-cyan-100">{user.branch} · Drawer: TL-02 · Float {formatGHS(drawer.openingFloat)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-cyan-200">{formatDate('2026-10-25')}</p>
                <p className="text-sm font-medium">Business day open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statsCards.map((stat, i) => (
          <KpiCard
            key={stat.title}
            index={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            onClick={() => setActivePage(stat.page)}
          />
        ))}
      </div>

      {/* Channel collections */}
      <motion.div {...fadeUp}>
        <Card className="border-l-4 border-cyan-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Today by Channel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'MTN MoMo', value: 41280, tx: 156, color: 'from-yellow-400 to-amber-500' },
              { label: 'Telecel Cash', value: 8940, tx: 38, color: 'from-red-500 to-rose-600' },
              { label: 'AT Money', value: 3620, tx: 19, color: 'from-blue-500 to-indigo-600' },
              { label: 'Cash at counter', value: drawer.cashIn, tx: 84, color: 'from-emerald-500 to-teal-600' },
            ].map(ch => (
              <div key={ch.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{ch.label}</span>
                  <span className="text-muted-foreground">{formatGHS(ch.value)} · {ch.tx} txns</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${ch.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((ch.value / (momoIn + drawer.cashIn)) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending vault transfers */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Vault className="h-5 w-5 text-amber-500" /> Cash Movement</h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('vault')}>Vault Desk</Button>
          </div>
          <div className="space-y-2">
            {pendingTransfers.map(t => (
              <Card
                key={t.id}
                role="button"
                tabIndex={0}
                aria-label={`Open transfer details — ${t.direction.replace(/_/g, ' ')} ${formatGHS(t.amount)}`}
                onClick={() => setDetailTransfer(t)}
                onKeyDown={openOnKey(() => setDetailTransfer(t))}
                className="mobile-card cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <CardContent className="flex items-center justify-between gap-3 p-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.direction.includes('bank') ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      {t.direction.includes('bank') ? <BankIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Vault className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold capitalize">{t.direction.replace(/_/g, ' ')} — {formatGHS(t.amount)}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.note ?? t.bank}</p>
                    </div>
                  </div>
                  <Badge className={`shrink-0 text-[10px] capitalize ${transferStatusBadge(t.status)}`}>
                    {t.status.replace(/_/g, ' ')}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Clock className="h-5 w-5" /> Counter Actions</h2>
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Serve Next Customer', icon: Users, page: 'counter', color: 'text-cyan-600' },
                  { label: 'End-of-Day Reconciliation', icon: Scale, page: 'reconciliation', color: 'text-emerald-600' },
                  { label: 'Vault & Bank Transfers', icon: Landmark, page: 'vault', color: 'text-amber-600' },
                ].map(action => (
                  <Button key={action.label} variant="outline" className="h-auto min-h-[44px] justify-start gap-3 py-3 touch-manipulation" onClick={() => setActivePage(action.page)}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-emerald-500">
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium">Drawer integrity</p>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Counted cash matches expected balance — ₵0 variance</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transfer detail dialog */}
      <Dialog open={!!detailTransfer} onOpenChange={() => setDetailTransfer(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Cash Transfer Details</DialogTitle>
            <DialogDescription>Dual-controlled vault & bank movement record.</DialogDescription>
          </DialogHeader>
          {detailTransfer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${detailTransfer.direction.includes('bank') ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                  {detailTransfer.direction.includes('bank') ? <BankIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Vault className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold capitalize">{detailTransfer.direction.replace(/_/g, ' ')} — {formatGHS(detailTransfer.amount)}</p>
                  <Badge className={`mt-1 text-[10px] capitalize ${transferStatusBadge(detailTransfer.status)}`}>
                    {detailTransfer.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField label="Reference" value={detailTransfer.id} />
                  <DetailField label="Date" value={formatDate(detailTransfer.date)} />
                  <DetailField label="Amount" value={<span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatGHS(detailTransfer.amount)}</span>} />
                  <DetailField label="Direction" value={<span className="capitalize">{detailTransfer.direction.replace(/_/g, ' ')}</span>} />
                  <DetailField label="Bank" value={detailTransfer.bank ?? '—'} />
                  <DetailField label="Requested by" value={detailTransfer.requestedBy} />
                  <DetailField label="Approved by" value={detailTransfer.approvedBy ?? 'Awaiting BM approval'} />
                  <DetailField label="Status" value={<span className="capitalize">{detailTransfer.status.replace(/_/g, ' ')}</span>} />
                  <DetailField label="Note" value={detailTransfer.note ?? '—'} wide />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
