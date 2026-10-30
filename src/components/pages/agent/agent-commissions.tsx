'use client';

import { useState } from 'react';
import { useAgentStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
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
import type { AgentCommission } from '@/lib/types';

const monthlyEarningsData = [
  { month: 'Nov', amount: 180 },
  { month: 'Dec', amount: 320 },
  { month: 'Jan', amount: 250 },
  { month: 'Feb', amount: 290 },
  { month: 'Mar', amount: 475 },
  { month: 'Apr', amount: 425 },
];

const chartConfig = {
  amount: { label: 'Commission (₵)', color: 'hsl(var(--chart-2))' },
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
  const [detail, setDetail] = useState<AgentCommission | null>(null);

  // Scroll helper — summary cards jump to the relevant in-page section
  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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
      sub: 'All time',
      subClassName: 'text-emerald-600 dark:text-emerald-400 font-medium',
      onClick: () => {
        setStatusFilter('paid');
        scrollToSection('commission-history');
      },
    },
    {
      title: 'Pending Payout',
      value: formatGHS(pendingPayout),
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      sub: 'Next Friday',
      subClassName: 'text-amber-600 dark:text-amber-400 font-medium',
      onClick: () => {
        setStatusFilter('pending');
        scrollToSection('commission-history');
      },
    },
    {
      title: 'This Month',
      value: formatGHS(thisMonth),
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      sub: 'Current period',
      subClassName: 'text-blue-600 dark:text-blue-400 font-medium',
      onClick: () => {
        setStatusFilter('all');
        scrollToSection('earnings-chart');
      },
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

      {/* Summary Cards — clickable, jump to the relevant section/filter */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 sm:grid-cols-3">
        {summaryCards.map((stat, i) => (
          <KpiCard
            key={stat.title}
            index={i}
            title={stat.title}
            value={stat.value}
            sub={stat.sub}
            subClassName={stat.subClassName}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Commission Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card id="commission-history">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm lg:text-base">Commission History</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {/* Status filter */}
                  <div className="flex gap-1">
                    {(['all', 'pending', 'paid', 'cancelled'] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={statusFilter === s ? 'default' : 'outline'}
                        className="min-h-[44px] lg:min-h-0 shrink-0"
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
              <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-hide border-b px-4 py-2">
                <span className="text-xs text-muted-foreground flex items-center mr-1">Type:</span>
                {['all', 'susu_collection', 'loan_referral', 'new_customer', 'milestone_bonus'].map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={typeFilter === t ? 'default' : 'ghost'}
                    className="h-7 text-xs shrink-0"
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
                          <TableRow
                            key={commission.id}
                            onClick={() => setDetail(commission)}
                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(commission); } }}
                            aria-label={`Open commission details: ${commission.description}`}
                          >
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
              <div className="space-y-2 p-3 lg:p-4 md:hidden">
                {filteredCommissions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="font-medium">No commissions found</p>
                    <p className="text-sm">Try adjusting your filters.</p>
                  </div>
                ) : (
                  filteredCommissions.map((commission) => {
                    const tc = typeConfig[commission.type];
                    return (
                      <div
                        key={commission.id}
                        onClick={() => setDetail(commission)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setDetail(commission);
                          }
                        }}
                        aria-label={`Open commission details: ${commission.description}`}
                        className="mobile-card rounded-lg border p-3 space-y-2 touch-manipulation cursor-pointer hover:bg-muted/30 hover:border-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
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
            id="earnings-chart"
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
                      <strong className="text-foreground">₵50.00</strong>.
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

      {/* Commission Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Commission Details</DialogTitle>
            <DialogDescription>Full details of this commission earning</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detail.agentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{formatGHS(detail.amount)}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs capitalize ${getStatusColor(detail.status)}`}>
                      {detail.status}
                    </Badge>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeConfig[detail.type]?.color ?? ''}`}>
                      {typeConfig[detail.type]?.label ?? detail.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 col-span-2">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm font-medium mt-0.5">{detail.description}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatGHS(detail.amount)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize mt-0.5">{detail.status}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(detail.date)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium mt-0.5">{typeConfig[detail.type]?.label ?? detail.type}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Reference ID</p>
                  <p className="text-sm font-medium mt-0.5">{detail.id}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Agent</p>
                  <p className="text-sm font-medium mt-0.5">{detail.agentName}</p>
                </div>
                {detail.paidDate && (
                  <div className="rounded-lg border p-3 col-span-2">
                    <p className="text-xs text-muted-foreground">Paid Date</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{formatDate(detail.paidDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
