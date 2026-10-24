'use client';

import { useTellerStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Wallet, Users, ArrowDownToLine, ArrowUpFromLine, Scale,
  Landmark, Vault, Clock, CheckCircle2, TrendingUp, Landmark as BankIcon,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export function TellerDashboard() {
  const { user, drawer, queue, transfers, setActivePage } = useTellerStore();

  const waiting = queue.filter(q => q.status === 'waiting').length;
  const processedToday = queue.filter(q => q.status === 'completed').length;
  const momoIn = 41280 + 8940 + 3620;

  const statsCards = [
    { title: 'Drawer Balance (expected)', value: formatGHS(drawer.expectedBalance), icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Cash In / Out Today', value: `${formatGHS(drawer.cashIn)} / ${formatGHS(drawer.cashOut)}`, icon: ArrowDownToLine, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Customers Waiting', value: `${waiting}`, icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Processed Today', value: `${processedToday}`, icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
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
              <Card key={t.id} className="mobile-card">
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
                  <Badge className={`shrink-0 text-[10px] capitalize ${t.status === 'requested' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : t.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
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
    </div>
  );
}
