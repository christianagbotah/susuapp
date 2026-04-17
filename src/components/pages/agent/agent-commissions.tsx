'use client';

import { useState } from 'react';
import { useAgentStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import {
  BadgeDollarSign, DollarSign, Clock, TrendingUp, Info,
  PiggyBank, UserPlus, Award, Phone,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const monthlyEarningsData = [
  { month: 'Nov', amount: 180 },
  { month: 'Dec', amount: 320 },
  { month: 'Jan', amount: 250 },
  { month: 'Feb', amount: 290 },
  { month: 'Mar', amount: 475 },
  { month: 'Apr', amount: 425 },
];

const chartConfig = {
  amount: { label: 'Commission (GH₵)', color: 'hsl(var(--chart-2))' },
};

const typeConfig: Record<string, { label: string; color: string; icon: typeof PiggyBank }> = {
  susu_collection: { label: 'Susu Collection', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: PiggyBank },
  loan_referral: { label: 'Loan Referral', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: DollarSign },
  new_customer: { label: 'New Customer', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: UserPlus },
  milestone_bonus: { label: 'Milestone Bonus', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Award },
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export function AgentCommissions() {
  const { commissions } = useAgentStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const totalEarned = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingPayout = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const thisMonth = commissions
    .filter((c) => {
      const d = new Date(c.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + c.amount, 0);

  const filteredCommissions = commissions.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const summaryCards = [
    {
      title: 'Total Earned',
      value: formatGHS(totalEarned),
      icon: BadgeDollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      subtitle: 'All time',
    },
    {
      title: 'Pending Payout',
      value: formatGHS(pendingPayout),
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      subtitle: 'Next Friday',
    },
    {
      title: 'This Month',
      value: formatGHS(thisMonth),
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      subtitle: 'Current period',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
            <BadgeDollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Commissions</h1>
            <p className="text-sm text-muted-foreground">
              Track your earnings and payout history
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Commission Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Commission History</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {/* Status filter */}
                  <div className="flex gap-1">
                    {(['all', 'pending', 'paid', 'cancelled'] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={statusFilter === s ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Type filter */}
              <div className="flex flex-wrap gap-1.5 border-b px-4 py-2">
                <span className="text-xs text-muted-foreground flex items-center mr-1">Type:</span>
                {['all', 'susu_collection', 'loan_referral', 'new_customer', 'milestone_bonus'].map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={typeFilter === t ? 'default' : 'ghost'}
                    className="h-7 text-xs"
                    onClick={() => setTypeFilter(t)}
                  >
                    {t === 'all' ? 'All' : typeConfig[t]?.label ?? t}
                  </Button>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No commissions found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCommissions.map((commission) => {
                        const tc = typeConfig[commission.type];
                        return (
                          <TableRow key={commission.id}>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {formatDate(commission.date)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${tc?.color ?? ''}`}>
                                {tc?.label ?? commission.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {commission.description}
                            </TableCell>
                            <TableCell className="text-right font-semibold whitespace-nowrap">
                              {formatGHS(commission.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${getStatusColor(commission.status)}`}>
                                {commission.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 p-4 md:hidden">
                {filteredCommissions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="font-medium">No commissions found</p>
                    <p className="text-sm">Try adjusting your filters.</p>
                  </div>
                ) : (
                  filteredCommissions.map((commission) => {
                    const tc = typeConfig[commission.type];
                    return (
                      <div key={commission.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={`text-[10px] ${tc?.color ?? ''}`}>
                            {tc?.label ?? commission.type}
                          </Badge>
                          <Badge className={`text-[10px] ${getStatusColor(commission.status)}`}>
                            {commission.status}
                          </Badge>
                        </div>
                        <p className="text-sm">{commission.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{formatDate(commission.date)}</span>
                          <span className="font-semibold">{formatGHS(commission.amount)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Earnings Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Monthly Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={monthlyEarningsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="amount"
                      fill="var(--color-amount)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payout Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                    <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Payout Schedule</p>
                    <p className="text-xs text-muted-foreground">Payment information</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Commissions are paid every <strong className="text-foreground">Friday</strong> via{' '}
                      <strong className="text-foreground">MTN MoMo</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Pending commissions are processed automatically. Minimum payout threshold is{' '}
                      <strong className="text-foreground">GH₵ 50.00</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Contact support if your payout is delayed beyond 2 business days.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Next Payout Date</p>
                  <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Friday, Apr 25</p>
                  <p className="text-sm text-muted-foreground">{formatGHS(pendingPayout)} pending</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
