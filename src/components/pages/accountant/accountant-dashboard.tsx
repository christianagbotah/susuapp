'use client';

import { useState } from 'react';
import { useAccountantStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import {
  Calculator, BookOpen, FileSpreadsheet, Scale,
  TrendingUp, ArrowRight, AlertTriangle, CheckCircle2, Landmark, Smartphone,
} from 'lucide-react';
import type { ChartOfAccount, BankReconciliation } from '@/lib/types';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export function AccountantDashboard() {
  const { user, ledger, coa, reconciliations, setActivePage } = useAccountantStore();
  const [accountDetail, setAccountDetail] = useState<ChartOfAccount | null>(null);
  const [recDetail, setRecDetail] = useState<BankReconciliation | null>(null);

  const totalAssets = coa.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = coa.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0);
  const income = coa.filter(a => a.type === 'income').reduce((s, a) => s + a.balance, 0);
  const expenses = coa.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0);
  const netIncome = income - expenses;
  const variances = reconciliations.filter(r => r.status === 'variance');

  const statsCards = [
    { title: 'Total Assets', value: formatGHS(totalAssets), icon: Landmark, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', page: 'ledger' as const },
    { title: 'Member Deposits (Susu)', value: formatGHS(totalLiabilities), icon: BookOpen, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', page: 'ledger' as const },
    { title: 'Net Income YTD', value: formatGHS(netIncome), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', page: 'statements' as const },
    { title: 'Reconciliation Variances', value: `${variances.length}`, icon: AlertTriangle, color: variances.length ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', bg: variances.length ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30', page: 'reconciliation' as const },
  ];

  const topAccounts = [...coa].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div {...fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-700 via-slate-800 to-zinc-800 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">{user.name.split(' ')[0]}, books are ready.</h1>
                  <Badge className="border-zinc-300 bg-zinc-500/40 text-white">Accountant</Badge>
                </div>
                <p className="text-sm text-zinc-300">{user.branch} · IFRS for SMEs · cedi books (₵)</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">Period</p>
                <p className="text-sm font-medium">October 2026 · mid-month close</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trial balance snapshot */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Calculator className="h-5 w-5 text-slate-600 dark:text-slate-300" /> Ledger Snapshot — Top Accounts</h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('ledger')}>Full Ledger <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {topAccounts.map(acc => (
                  <div
                    key={acc.code}
                    onClick={() => setAccountDetail(acc)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAccountDetail(acc); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${acc.name} account details`}
                    className="flex cursor-pointer items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{acc.code} · <span className="capitalize">{acc.type}</span></p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{formatGHS(acc.balance)}</p>
                      <p className={`text-[11px] ${acc.momChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {acc.momChange >= 0 ? '+' : ''}{acc.momChange}% MoM
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* P&L mini */}
          <Card className="border-l-4 border-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold"><TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Income Statement — YTD (Jan–Oct)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Income (susu fees + interest)</span><span className="font-semibold">{formatGHS(income)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Expenses (commissions, salaries, provisions)</span><span className="font-semibold">{formatGHS(expenses)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-medium">Net Income</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{formatGHS(netIncome)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Cost-to-income ratio</span><span>{Math.round((expenses / Math.max(income, 1)) * 100)}%</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Reconciliation Health</h2>
          <Card>
            <CardContent className="space-y-2.5 p-4">
              {reconciliations.slice(0, 4).map(r => (
                <div
                  key={r.id}
                  onClick={() => setRecDetail(r)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRecDetail(r); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${r.source} reconciliation details`}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg p-2 -m-2 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.source}</p>
                    <p className="text-xs text-muted-foreground">{formatGHS(r.statementBalance)}</p>
                  </div>
                  <Badge className={`shrink-0 text-[10px] ${r.status === 'reconciled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : r.status === 'variance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                    {r.status === 'variance' ? <AlertTriangle className="mr-1 h-3 w-3" /> : r.status === 'reconciled' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
                    {r.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full min-h-[40px] touch-manipulation" onClick={() => setActivePage('reconciliation')}>
                <Scale className="mr-2 h-4 w-4" /> Open Reconciliation
              </Button>
            </CardContent>
          </Card>

          <h2 className="flex items-center gap-2 text-lg font-semibold"><FileSpreadsheet className="h-5 w-5" /> Statements</h2>
          <Card>
            <CardContent className="space-y-2.5 p-4">
              {[
                { label: 'Statement of Financial Position', status: 'Final · Sep 2026', page: 'statements' },
                { label: 'Income Statement', status: 'Final · Jan–Sep', page: 'statements' },
                { label: 'Trial Balance', status: 'Draft · Oct mid-month', page: 'statements' },
              ].map(s => (
                <button key={s.label} className="flex w-full items-center justify-between gap-2 rounded-lg border p-2.5 text-left touch-manipulation hover:bg-muted/50" onClick={() => setActivePage(s.page)}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.status}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-amber-500">
            <CardContent className="flex items-start gap-2 p-3.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-800 dark:text-amber-200">GRA PAYE for October salaries due by the 15th; SSNIT monthly contribution due by the 14th. Next month-end close: 31 Oct.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account detail dialog */}
      <Dialog open={!!accountDetail} onOpenChange={() => setAccountDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
            <DialogDescription>Chart of accounts — ledger snapshot, October 2026</DialogDescription>
          </DialogHeader>
          {accountDetail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <BookOpen className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{accountDetail.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{accountDetail.code}</span>
                    <Badge className="text-[10px] capitalize bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{accountDetail.type}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Current balance</p>
                  <p className="text-sm font-bold">{formatGHS(accountDetail.balance)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Month-on-month</p>
                  <p className={`text-sm font-bold ${accountDetail.momChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {accountDetail.momChange >= 0 ? '+' : ''}{accountDetail.momChange}% MoM
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Account code</p>
                  <p className="font-mono text-sm">{accountDetail.code}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Account class</p>
                  <p className="text-sm font-medium capitalize">{accountDetail.type}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full min-h-[40px] touch-manipulation" onClick={() => { setAccountDetail(null); setActivePage('ledger'); }}>
                <BookOpen className="mr-2 h-4 w-4" /> Open Full Ledger
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reconciliation detail dialog */}
      <Dialog open={!!recDetail} onOpenChange={() => setRecDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Reconciliation Detail</DialogTitle>
            <DialogDescription>{recDetail?.source} — {recDetail?.period}</DialogDescription>
          </DialogHeader>
          {recDetail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  {recDetail.source.includes('MoMo') || recDetail.source.includes('Telecel') || recDetail.source.includes('AT')
                    ? <Smartphone className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                    : <Landmark className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{recDetail.source}</p>
                  <Badge className={`mt-1 text-[10px] ${recDetail.status === 'reconciled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : recDetail.status === 'variance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                    {recDetail.status === 'variance' ? <AlertTriangle className="mr-1 h-3 w-3" /> : recDetail.status === 'reconciled' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
                    {recDetail.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Book balance</p>
                  <p className="text-sm font-bold">{formatGHS(recDetail.bookBalance)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Statement balance</p>
                  <p className="text-sm font-bold">{formatGHS(recDetail.statementBalance)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Difference</p>
                  <p className={`text-sm font-bold ${(recDetail.bookBalance - recDetail.statementBalance) === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {formatGHS(recDetail.bookBalance - recDetail.statementBalance)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Unmatched items</p>
                  <p className="text-sm font-bold">{recDetail.unmatchedItems.length}</p>
                  <p className="text-[11px] text-muted-foreground">{formatGHS(recDetail.unmatchedItems.reduce((s, i) => s + i.amount, 0))} unresolved</p>
                </div>
              </div>
              {recDetail.unmatchedItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unmatched items</p>
                  {recDetail.unmatchedItems.map(item => (
                    <div key={item.description} className="flex items-start justify-between gap-2 rounded-lg border p-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.date)} · <span className="uppercase">{item.type}</span></p>
                      </div>
                      <p className={`shrink-0 font-bold ${item.type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {item.type === 'debit' ? '−' : '+'}{formatGHS(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {recDetail.unmatchedItems.length === 0 && (
                <p className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Fully reconciled — no unmatched items for this period.
                </p>
              )}
              <Button variant="outline" className="w-full min-h-[40px] touch-manipulation" onClick={() => { setRecDetail(null); setActivePage('reconciliation'); }}>
                <Scale className="mr-2 h-4 w-4" /> Open Reconciliation
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
