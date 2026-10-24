'use client';

import { useAccountantStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Calculator, BookOpen, FileSpreadsheet, Scale,
  TrendingUp, ArrowRight, AlertTriangle, CheckCircle2, Landmark,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export function AccountantDashboard() {
  const { user, ledger, coa, reconciliations, setActivePage } = useAccountantStore();

  const totalAssets = coa.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = coa.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0);
  const income = coa.filter(a => a.type === 'income').reduce((s, a) => s + a.balance, 0);
  const expenses = coa.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0);
  const netIncome = income - expenses;
  const variances = reconciliations.filter(r => r.status === 'variance');

  const statsCards = [
    { title: 'Total Assets', value: formatGHS(totalAssets), icon: Landmark, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Member Deposits (Susu)', value: formatGHS(totalLiabilities), icon: BookOpen, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Net Income YTD', value: formatGHS(netIncome), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Reconciliation Variances', value: `${variances.length}`, icon: AlertTriangle, color: variances.length ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', bg: variances.length ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30' },
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
          <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
            <Card className="mobile-card hover:shadow-md transition-shadow touch-manipulation h-full">
              <CardContent className="p-3 lg:p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-xs text-muted-foreground lg:text-sm">{stat.title}</p>
                    <p className="truncate text-base font-bold lg:text-xl">{stat.value}</p>
                  </div>
                  <div className={`shrink-0 rounded-lg p-2.5 lg:p-3 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
                  <div key={acc.code} className="flex items-center justify-between gap-3 p-3.5">
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
                <div key={r.id} className="flex items-center justify-between gap-2">
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
    </div>
  );
}
