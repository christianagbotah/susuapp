'use client';

import { useAdminStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, getInitials, formatCompactNumber } from '@/lib/formatters';
import { monthlyRevenueData, loanPortfolioData } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import {
  Users, Landmark, Wallet, PiggyBank, UserCheck, AlertTriangle,
  TrendingUp, Clock, ArrowUpRight, CheckCircle, XCircle,
  Building2, Award, FileText, Settings, BarChart3, CreditCard, Shield, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export function AdminDashboard() {
  const { stats, allLoans, allAgents, allBranches, approveLoan, rejectLoan, setActivePage } = useAdminStore();
  const [confirmDialog, askConfirm] = useConfirm();

  const pendingLoans = allLoans.filter(l => l.status === 'pending' || l.status === 'under_review');
  const topAgents = [...allAgents].sort((a, b) => b.totalCollections - a.totalCollections).slice(0, 5);
  const topBranches = [...allBranches].sort((a, b) => b.totalCustomers - a.totalCustomers).slice(0, 5);

  const handleApprove = (id: string) => {
    const loan = pendingLoans.find(l => l.id === id);
    if (!loan) return;
    askConfirm({
      title: 'Approve Loan Application',
      description: 'You are about to approve this loan and release funds to the disbursement queue. The customer will be notified immediately.',
      subject: `${loan.applicantName} — ${formatGHS(loan.amount)}`,
      details: [
        { label: 'Type', value: loan.type },
        { label: 'Amount', value: formatGHS(loan.amount) },
      ],
      confirmLabel: 'Yes, Approve Loan',
      variant: 'success',
      onConfirm: () => {
        approveLoan(id);
        toast.success('Loan approved successfully');
      },
    });
  };

  const handleReject = (id: string) => {
    const loan = pendingLoans.find(l => l.id === id);
    if (!loan) return;
    askConfirm({
      title: 'Reject Loan Application',
      description: 'The application will be rejected and the customer notified with next steps. A reason is required for the audit trail.',
      subject: `${loan.applicantName} — ${formatGHS(loan.amount)}`,
      details: [
        { label: 'Type', value: loan.type },
        { label: 'Amount', value: formatGHS(loan.amount) },
      ],
      confirmLabel: 'Reject Application',
      variant: 'destructive',
      requireReason: true,
      reasonPlaceholder: 'Why is this application being rejected?',
      onConfirm: (reason) => {
        rejectLoan(id, reason?.trim() || 'Does not meet lending criteria');
        toast.error('Loan has been rejected');
      },
    });
  };

  const statCards = [
    { label: 'Total Users', value: formatCompactNumber(stats.totalUsers), change: '+12.5%', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', page: 'users' as const },
    { label: 'Active Loans', value: `${stats.pendingLoans} pending`, change: '34 pending', icon: Landmark, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', page: 'loans' as const },
    { label: 'Total Deposits', value: formatGHS(stats.totalDeposits), change: '+8.2%', icon: Wallet, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', page: 'analytics' as const },
    { label: 'Total Susu Pool', value: formatGHS(stats.totalSusuPool), change: '+15.3%', icon: PiggyBank, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', page: 'susu-groups' as const },
    { label: 'Active Agents', value: `${stats.activeAgents} of ${stats.totalAgents}`, change: '83% active', icon: UserCheck, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30', page: 'agents' as const },
    { label: 'Default Rate', value: `${stats.defaultRate}%`, change: '-0.5%', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', page: 'loans' as const },
  ];

  const quickActions = [
    { label: 'Approve Loans', icon: CheckCircle, page: 'loans' as const },
    { label: 'View Reports', icon: BarChart3, page: 'analytics' as const },
    { label: 'Manage Agents', icon: UserCheck, page: 'agents' as const },
    { label: 'System Settings', icon: Settings, page: 'settings' as const },
  ];

  return (
    <div className="space-y-6">
      {confirmDialog}
      {/* System Overview Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 lg:p-6 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold sm:text-3xl">iSusuPro Admin Console</h1>
          <p className="mt-1 text-emerald-100">
            Total platform users: <span className="font-semibold text-white">{stats.totalUsers.toLocaleString()}</span>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2 py-0.5 text-xs font-medium text-white">
              <TrendingUp className="h-3 w-3" /> +{stats.monthlyGrowth}% growth
            </span>
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 right-20 h-24 w-24 rounded-full bg-white/10" />
      </motion.div>

      {/* Stats Row — every KPI opens its details page */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s, i) => (
          <KpiCard
            key={s.label}
            index={i}
            title={s.label}
            value={s.value}
            sub={s.change}
            subClassName="text-emerald-600 dark:text-emerald-400 font-medium"
            icon={s.icon}
            color={s.color}
            bg={s.bg}
            onClick={() => setActivePage(s.page)}
          />
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => formatCompactNumber(v)} className="text-xs" />
                  <Tooltip formatter={(value: number) => formatGHS(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="deposits" stroke="#3b82f6" fill="url(#colorDeposits)" strokeWidth={2} name="Deposits" />
                  <Area type="monotone" dataKey="loans" stroke="#f59e0b" fill="none" strokeWidth={2} name="Loans" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two-column: Pending Loans + Branch Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Loan Applications */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm lg:text-base font-semibold">Recent Loan Applications</CardTitle>
                <Badge variant="secondary" className="text-xs">{pendingLoans.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto overscroll-contain">
              {pendingLoans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No pending applications</p>
              ) : (
                pendingLoans.map(loan => (
                  <div key={loan.id} className="mobile-list-item flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors touch-manipulation">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{loan.applicantName}</p>
                      <p className="text-xs text-muted-foreground">{formatGHS(loan.amount)} &middot; {loan.type} &middot; {formatDate(loan.startDate || loan.id.slice(-4))}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] lg:min-h-0"
                        onClick={() => handleApprove(loan.id)}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 px-2 text-xs min-h-[44px] lg:min-h-0"
                        onClick={() => handleReject(loan.id)}>
                        <XCircle className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Branch Performance */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm lg:text-base font-semibold">Branch Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto overscroll-contain">
              {topBranches.map((branch, idx) => (
                <div key={branch.id} className="mobile-list-item flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors touch-manipulation">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-bold text-emerald-700">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{branch.name}</p>
                    <p className="text-xs text-muted-foreground">{branch.region} &middot; {branch.totalAgents} agents</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{branch.totalCustomers}</p>
                    <p className="text-xs text-muted-foreground">customers</p>
                  </div>
                  <div className="shrink-0">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(branch.totalCustomers / 900) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Agents Summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm lg:text-base font-semibold">Top Agents by Collections</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActivePage('agents')}>
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-stretch">
              {topAgents.map((agent, idx) => (
                <div key={agent.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors touch-manipulation h-full">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs font-semibold">
                        {getInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{formatGHS(agent.totalCollections)}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">{'★'.repeat(Math.round(agent.rating))} {agent.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Feed */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm lg:text-base font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActivePage('compliance')}>
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto overscroll-contain">
              {[
                { description: 'Loan approved for Efua Darko', user: 'Daniel Tetteh', time: '2 hours ago', type: 'success' as const, Icon: CheckCircle },
                { description: 'New agent registered: Samuel Addo', user: 'System', time: '4 hours ago', type: 'info' as const, Icon: Info },
                { description: 'KYC expired for 23 users', user: 'System', time: '6 hours ago', type: 'warning' as const, Icon: AlertTriangle },
                { description: 'Suspicious activity flagged', user: 'Security', time: '8 hours ago', type: 'error' as const, Icon: XCircle },
                { description: 'Commission payout processed', user: 'System', time: '12 hours ago', type: 'success' as const, Icon: CheckCircle },
                { description: "Susu group 'Makola Queens' created", user: 'Patricia Ampah', time: '1 day ago', type: 'info' as const, Icon: Info },
              ].map((activity, idx) => (
                <div
                  key={idx}
                  className="mobile-list-item flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors touch-manipulation"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      activity.type === 'success'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : activity.type === 'warning'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : activity.type === 'error'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    <activity.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{activity.description}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activity.user}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain">
              {quickActions.map(action => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 min-h-[44px] shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors touch-manipulation"
                  onClick={() => setActivePage(action.page)}
                >
                  <action.icon className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
