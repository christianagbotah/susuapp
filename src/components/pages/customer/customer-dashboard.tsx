'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PiggyBank, Landmark, Wallet, TrendingUp,
  ArrowUpRight, ArrowDownRight, Bell, Target, Users,
  ChevronRight, DollarSign, CreditCard, Shield, CheckCircle2, Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, formatCompactNumber, getStatusColor, getInitials } from '@/lib/formatters';
import { monthlyRevenueData } from '@/lib/mock-data';

// ---- Animation variants ----
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ---- Stat card config type ----
interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
}

// ---- Custom chart tooltip ----
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold text-slate-800">
          {entry.dataKey === 'revenue' ? 'Savings' : entry.dataKey === 'deposits' ? 'Deposits' : 'Loans'}:{' '}
          <span style={{ color: entry.color }}>{formatGHS(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export function CustomerDashboard() {
  const {
    user, wallets, susuGroups: mySusuGroups, myLoans, transactions, savingsGoals, susuPayouts, notifications, setActivePage,
  } = useCustomerStore();

  // ---- Computed stats ----
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const totalSavingsBalance = wallets.filter((w) => w.type === 'savings' || w.type === 'susu').reduce((sum, w) => sum + w.balance, 0);
  const mainWallet = wallets.find((w) => w.type === 'main');
  const activeLoans = myLoans.filter((l) => l.status === 'active');

  // This month's contributions count
  const now = new Date();
  const thisMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const thisMonthContributions = transactions.filter((t) => {
    if (t.type !== 'susu_contribution' && t.type !== 'deposit') return false;
    const tDate = new Date(t.date);
    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
  });
  const thisMonthContributionTotal = thisMonthContributions.reduce((sum, t) => sum + t.amount, 0);

  const stats: StatCard[] = [
    {
      title: 'Total Savings',
      value: formatGHS(totalSavingsBalance),
      subtitle: `Across ${wallets.filter((w) => w.type === 'savings' || w.type === 'susu').length} wallets`,
      icon: PiggyBank,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: { value: '+12.5%', positive: true },
    },
    {
      title: 'Active Loans',
      value: formatGHS(activeLoans.reduce((s, l) => s + l.remainingBalance, 0)),
      subtitle: `${activeLoans.length} active loan${activeLoans.length !== 1 ? 's' : ''}`,
      icon: Landmark,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Wallet Balance',
      value: formatGHS(mainWallet?.balance ?? 0),
      subtitle: mainWallet?.provider ?? 'MTN Mobile Money',
      icon: Wallet,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Contributions',
      value: formatGHS(thisMonthContributionTotal),
      subtitle: `${thisMonth} · ${thisMonthContributions.length} transactions`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: { value: '+8.2%', positive: true },
    },
  ];

  // Quick actions
  const quickActions = [
    { label: 'Start Susu', icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', page: 'susu' },
    { label: 'Apply for Loan', icon: Landmark, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', page: 'loans' },
    { label: 'Deposit Money', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', page: 'wallet' },
    { label: 'Send Money', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100', page: 'transfers' },
    { label: 'Refer & Earn', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50 hover:bg-teal-100', page: 'referrals' },
    { label: 'View Statements', icon: CreditCard, color: 'text-slate-600', bg: 'bg-slate-50 hover:bg-slate-100', page: 'transactions' },
  ];

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Transaction type badge helper
  const getTxnTypeBadge = (type: string) => {
    const map: Record<string, { label: string; variant: string }> = {
      deposit: { label: 'Deposit', variant: 'bg-emerald-100 text-emerald-700' },
      withdrawal: { label: 'Withdrawal', variant: 'bg-red-100 text-red-700' },
      susu_contribution: { label: 'Contribution', variant: 'bg-emerald-100 text-emerald-700' },
      susu_payout: { label: 'Payout', variant: 'bg-emerald-100 text-emerald-700' },
      loan_repayment: { label: 'Repayment', variant: 'bg-amber-100 text-amber-700' },
      loan_disbursement: { label: 'Disbursement', variant: 'bg-blue-100 text-blue-700' },
      transfer: { label: 'Transfer', variant: 'bg-slate-100 text-slate-700' },
      fee: { label: 'Fee', variant: 'bg-orange-100 text-orange-700' },
    };
    return map[type] ?? { label: type, variant: 'bg-slate-100 text-slate-700' };
  };

  const isPositiveAmount = (type: string) => ['deposit', 'susu_payout'].includes(type);

  // Frequency badge
  const getFrequencyBadge = (freq: string) => {
    const map: Record<string, string> = {
      daily: 'bg-emerald-100 text-emerald-700',
      weekly: 'bg-blue-100 text-blue-700',
      monthly: 'bg-amber-100 text-amber-700',
    };
    return map[freq] ?? 'bg-slate-100 text-slate-700';
  };

  // Upcoming payouts
  const upcomingPayouts = susuPayouts.filter((p) => p.status === 'pending');

  // Chart data - for savings growth (show deposits line)
  const savingsChartData = useMemo(() =>
    monthlyRevenueData.map((d) => ({
      ...d,
      savings: d.deposits * 0.6 + d.revenue * 0.1,
    })),
    [],
  );

  // Today's formatted date
  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 lg:p-6 overscroll-contain"
    >
      {/* ==============================
          1. Welcome Banner
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-900/10">
          <div className="relative safe-area-top bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-4 lg:px-8 lg:py-8">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/5" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-white/30 bg-white/20 shadow-md">
                  <AvatarFallback className="bg-white/20 text-lg font-bold text-white backdrop-blur-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-white sm:text-2xl">
                    Welcome back, {user.name}!
                  </h1>
                  <p className="text-sm text-white/75">{todayStr}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ==============================
          2. Stats Row
          ============================== */}
      <div className="grid grid-cols-2 gap-2 lg:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md touch-manipulation">
                <CardContent className="flex flex-col items-center gap-2 p-3 lg:flex-row lg:items-start lg:gap-4 lg:p-5 h-full justify-between">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1 text-center lg:text-left">
                    <p className="text-[10px] font-medium text-slate-500 lg:text-xs">{stat.title}</p>
                    <p className="mt-0.5 text-base font-bold tracking-tight text-slate-900 lg:text-lg">
                      {stat.value}
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1.5 lg:justify-start">
                      {stat.trend && (
                        <span
                          className={`flex items-center gap-0.5 text-xs font-medium ${
                            stat.trend.positive ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {stat.trend.positive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {stat.trend.value}
                        </span>
                      )}
                      <span className="truncate text-[10px] text-slate-400 lg:text-xs">{stat.subtitle}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ==============================
          2.5 Credit Score Widget
          ============================== */}
      <motion.div variants={itemVariants}>
        <motion.div whileHover={{ y: -2 }}>
          <Card className="border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                  {/* Left: Circular Progress */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative">
                      <svg width={140} height={140} viewBox="0 0 140 140" className="-rotate-90">
                        {/* Background ring */}
                        <circle
                          cx={70}
                          cy={70}
                          r={58}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={10}
                          className="text-slate-100"
                        />
                        {/* Progress ring */}
                        <circle
                          cx={70}
                          cy={70}
                          r={58}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={10}
                          strokeLinecap="round"
                          strokeDasharray={364.42}
                          strokeDashoffset={364.42 - (364.42 * 78) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-800">78</span>
                        <span className="text-[10px] font-medium text-slate-400">out of 100</span>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                      <Shield className="h-3 w-3" />
                      Good
                    </Badge>
                  </div>

                  {/* Right: Score Factors */}
                  <div className="flex-1 space-y-1">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-800">Credit Score</h3>
                      <p className="text-xs text-slate-500">Based on your financial activity</p>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                        <span className="text-xs font-medium text-slate-600">Payment History</span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          Excellent
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                        <span className="text-xs font-medium text-slate-600">Susu Savings</span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          Strong
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                        <span className="text-xs font-medium text-slate-600">Active Loans</span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                          On Track
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                        <span className="text-xs font-medium text-slate-600">Account Age</span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          2+ years
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ==============================
          3. Quick Actions
          ============================== */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-3 overflow-x-auto flex-nowrap overscroll-x-contain scrollbar-none lg:grid lg:grid-cols-6 lg:overflow-visible">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.label}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Card
                  className="group min-w-[120px] shrink-0 cursor-pointer border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md lg:min-w-0 touch-manipulation mobile-card"
                  onClick={() => setActivePage(action.page)}
                >
                  <CardContent className="flex flex-col items-center justify-between gap-3 p-4 text-center min-h-[120px]">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${action.bg}`}
                    >
                      <Icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                      {action.label}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ==============================
          4. Two-column layout
          ============================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---- LEFT COLUMN (wider) ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Savings Growth Chart */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ y: -2 }}>
              <Card className="border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Savings Growth
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Last 8 months performance
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      +12.5%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={savingsChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="depositsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => formatCompactNumber(v)}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Savings"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#savingsGradient)"
                          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="deposits"
                          name="Deposits"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          fill="url(#depositsGradient)"
                          dot={false}
                          strokeDasharray="5 3"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* My Susu Groups */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ y: -2 }}>
              <Card className="border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        My Susu Groups
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {mySusuGroups.length} active group{mySusuGroups.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => setActivePage('susu')}
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mySusuGroups.map((group) => (
                    <motion.div
                      key={group.id}
                      whileHover={{ x: 2 }}
                      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 mobile-card"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                        <Users className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-emerald-800">
                          {group.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge className={`h-5 text-[10px] font-medium capitalize ${getFrequencyBadge(group.frequency)}`}>
                            {group.frequency}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatGHS(group.contributionAmount)}/{' '}
                            {group.frequency === 'daily' ? 'day' : group.frequency === 'weekly' ? 'week' : 'month'}
                          </span>
                        </div>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="text-xs text-slate-500">Next payout</p>
                        <p className="text-sm font-medium text-slate-700">{formatDate(group.nextPayout)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-emerald-500" />
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div className="space-y-6">
          {/* Savings Goals Progress */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ y: -2 }}>
              <Card className="border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Savings Goals
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {savingsGoals.length} active goals
                      </CardDescription>
                    </div>
                    <Target className="h-5 w-5 text-emerald-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savingsGoals.map((goal) => {
                    const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{goal.icon}</span>
                            <span className="text-sm font-medium text-slate-800">{goal.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600">{percent}%</span>
                        </div>
                        <Progress
                          value={percent}
                          className="h-2 bg-slate-100"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {formatGHS(goal.currentAmount)} saved
                          </span>
                          <span className="text-xs text-slate-400">
                            of {formatGHS(goal.targetAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ y: -2 }}>
              <Card className="border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Recent Transactions
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Last 5 transactions
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => setActivePage('transactions')}
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Desktop table */}
                  <div className="hidden sm:block overscroll-contain">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100 hover:bg-transparent">
                          <TableHead className="text-xs font-medium text-slate-400">Date</TableHead>
                          <TableHead className="text-xs font-medium text-slate-400">Description</TableHead>
                          <TableHead className="text-xs font-medium text-slate-400">Type</TableHead>
                          <TableHead className="text-right text-xs font-medium text-slate-400">Amount</TableHead>
                          <TableHead className="text-right text-xs font-medium text-slate-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTransactions.map((txn) => {
                          const typeInfo = getTxnTypeBadge(txn.type);
                          const positive = isPositiveAmount(txn.type);
                          return (
                            <TableRow key={txn.id} className="border-slate-50 hover:bg-slate-50/50">
                              <TableCell className="whitespace-nowrap text-xs text-slate-600">
                                {formatDate(txn.date)}
                              </TableCell>
                              <TableCell className="max-w-[140px] truncate text-xs font-medium text-slate-800">
                                {txn.description}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${typeInfo.variant} h-5 text-[10px] font-medium hover:${typeInfo.variant}`}>
                                  {typeInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`whitespace-nowrap text-right text-xs font-semibold ${
                                  positive ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {positive ? '+' : '-'}{formatGHS(txn.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge className={`${getStatusColor(txn.status)} h-5 text-[10px] font-medium capitalize`}>
                                  {txn.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile card list */}
                  <div className="space-y-1 p-3 sm:hidden overscroll-contain">
                    {recentTransactions.map((txn) => {
                      const typeInfo = getTxnTypeBadge(txn.type);
                      const positive = isPositiveAmount(txn.type);
                      return (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 touch-manipulation mobile-list-item"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-800">
                              {txn.description}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge className={`${typeInfo.variant} h-4 text-[9px] font-medium px-1.5 hover:${typeInfo.variant}`}>
                                {typeInfo.label}
                              </Badge>
                              <span className="text-[10px] text-slate-400">{formatDate(txn.date)}</span>
                            </div>
                          </div>
                          <div className="ml-3 text-right">
                            <p
                              className={`text-base font-semibold lg:text-sm ${
                                positive ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {positive ? '+' : '-'}{formatGHS(txn.amount)}
                            </p>
                            <Badge className={`${getStatusColor(txn.status)} mt-1 h-4 text-[9px] font-medium capitalize px-1.5`}>
                              {txn.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ==============================
          5. Upcoming Payouts
          ============================== */}
      <motion.div variants={itemVariants}>
        <motion.div whileHover={{ y: -2 }}>
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Upcoming Payouts
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {upcomingPayouts.length} pending payout{upcomingPayouts.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              {upcomingPayouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <DollarSign className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-500">No upcoming payouts</p>
                  <p className="mt-1 text-xs text-slate-400">Your next payout will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-800">{payout.groupName}</p>
                          <p className="text-xs text-slate-500">Round {payout.round}</p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          Pending
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-end justify-between border-t border-emerald-100 pt-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Payout Date</p>
                          <p className="text-sm font-semibold text-slate-700">{formatDate(payout.payoutDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Amount</p>
                          <p className="text-lg font-bold text-emerald-600">{formatGHS(payout.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ==============================
          6. Financial Tips
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 lg:p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                <Lightbulb className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Financial Tips</h3>
                <p className="text-xs text-slate-500">Smart ways to grow your money</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto overscroll-x-contain scrollbar-none lg:grid lg:grid-cols-4 lg:overflow-visible">
              {[
                {
                  emoji: '💡',
                  title: 'Save Automatically',
                  description: 'Set up automatic daily contributions to your susu group. Even small amounts add up significantly over time.',
                },
                {
                  emoji: '📈',
                  title: 'Track Your Progress',
                  description: 'Monitor your savings goals regularly. Members who track progress save 23% more on average.',
                },
                {
                  emoji: '🛡️',
                  title: 'Complete Your KYC',
                  description: 'Full KYC verification unlocks higher transaction limits and access to premium loan products.',
                },
                {
                  emoji: '💰',
                  title: 'Earn Referral Bonuses',
                  description: 'Refer friends to iSusuPro and earn ₵25 for each successful referral. No limit on earnings!',
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="min-w-[220px] shrink-0 rounded-xl border border-blue-100/60 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-shadow hover:shadow-md lg:min-w-0"
                >
                  <span className="text-2xl">{tip.emoji}</span>
                  <h4 className="mt-3 text-sm font-semibold text-slate-800">{tip.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{tip.description}</p>
                  <button className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Learn More →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
