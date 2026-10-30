'use client';

import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Loan, Branch, Agent } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export function AdminDashboard() {
  const { stats, allLoans, allAgents, allBranches, approveLoan, rejectLoan, setActivePage } = useAdminStore();
  const [confirmDialog, askConfirm] = useConfirm();
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [detailBranch, setDetailBranch] = useState<Branch | null>(null);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);

  const pendingLoans = allLoans.filter(l => l.status === 'pending' || l.status === 'under_review');
  const activeLoanCount = allLoans.filter(l => l.status === 'active').length;
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
    { label: 'Active Loans', value: `${activeLoanCount}`, change: `${pendingLoans.length} pending review`, icon: Landmark, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', page: 'loans' as const },
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
                  <div
                    key={loan.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View loan application details for ${loan.applicantName}`}
                    className="mobile-list-item flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setDetailLoan(loan)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailLoan(loan); } }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{loan.applicantName}</p>
                      <p className="text-xs text-muted-foreground">{formatGHS(loan.amount)} &middot; {loan.type} &middot; {loan.startDate ? formatDate(loan.startDate) : '—'}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] lg:min-h-0"
                        onClick={(e) => { e.stopPropagation(); handleApprove(loan.id); }}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 px-2 text-xs min-h-[44px] lg:min-h-0"
                        onClick={(e) => { e.stopPropagation(); handleReject(loan.id); }}>
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
                <div
                  key={branch.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${branch.name} branch details`}
                  className="mobile-list-item flex items-center gap-3 rounded-lg border p-3 touch-manipulation cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  onClick={() => setDetailBranch(branch)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailBranch(branch); } }}
                >
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
                <div
                  key={agent.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View agent summary for ${agent.name}`}
                  className="flex items-center gap-3 rounded-lg border p-3 touch-manipulation h-full cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  onClick={() => setDetailAgent(agent)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailAgent(agent); } }}
                >
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
                  className="mobile-list-item flex items-start gap-3 rounded-lg p-3 touch-manipulation"
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

      {/* Compact Loan Detail Dialog (from pending applications list) */}
      <Dialog open={!!detailLoan} onOpenChange={() => setDetailLoan(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Loan Application Details</DialogTitle>
            <DialogDescription>Review the application before approving or rejecting</DialogDescription>
          </DialogHeader>
          {detailLoan && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detailLoan.applicantName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{detailLoan.applicantName}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(detailLoan.status)}`}>
                      {detailLoan.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{detailLoan.type.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Loan terms */}
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatGHS(detailLoan.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate</span><span>{detailLoan.interestRate}% p.a.</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span>{detailLoan.term} {detailLoan.termUnit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly Payment</span><span className="font-medium">{formatGHS(detailLoan.monthlyPayment)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Applied</span><span>{detailLoan.startDate ? formatDate(detailLoan.startDate) : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span>{detailLoan.branch}</span></div>
                </div>
              </div>

              {/* Contact & purpose */}
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Phone:</span> <span className="ml-1">{detailLoan.applicantPhone}</span></p>
                <p><span className="text-muted-foreground">Purpose:</span> <span className="ml-1">{detailLoan.purpose}</span></p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                  onClick={() => { handleApprove(detailLoan.id); setDetailLoan(null); }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve Loan
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 min-h-[44px]"
                  onClick={() => { handleReject(detailLoan.id); setDetailLoan(null); }}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject Loan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Branch Detail Dialog */}
      <Dialog open={!!detailBranch} onOpenChange={() => setDetailBranch(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Branch Details</DialogTitle>
            <DialogDescription>Performance overview for this branch</DialogDescription>
          </DialogHeader>
          {detailBranch && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{detailBranch.name}</p>
                  <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(detailBranch.status)}`}>
                    {detailBranch.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Branch fields */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Region</p>
                  <p className="font-medium">{detailBranch.region}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium truncate">{detailBranch.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="font-medium">{detailBranch.manager}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Agents</p>
                  <p className="font-medium text-amber-600 dark:text-amber-400">{detailBranch.totalAgents}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">{detailBranch.totalCustomers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Susu Groups</p>
                  <p className="font-medium text-blue-600 dark:text-blue-400">{detailBranch.totalSusuGroups}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Summary Dialog */}
      <Dialog open={!!detailAgent} onOpenChange={() => setDetailAgent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Agent Summary</DialogTitle>
            <DialogDescription>Performance snapshot for this agent</DialogDescription>
          </DialogHeader>
          {detailAgent && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detailAgent.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{detailAgent.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`text-xs capitalize ${getStatusColor(detailAgent.status)}`}>
                      {detailAgent.status}
                    </Badge>
                    <span className="text-xs text-amber-600 dark:text-amber-400">{'★'.repeat(Math.round(detailAgent.rating))} {detailAgent.rating}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Agent metrics */}
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Collections</span><span className="font-medium text-emerald-600">{formatGHS(detailAgent.totalCollections)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Customers</span><span className="font-medium">{detailAgent.totalCustomers}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Commissions</span><span className="font-medium">{formatGHS(detailAgent.totalCommissions)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span>{detailAgent.rating} / 5</span></div>
                </div>
              </div>

              {/* Agent info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Agent Code</p>
                  <p className="font-medium font-mono text-xs">{detailAgent.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="font-medium">{detailAgent.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Territory</p>
                  <p className="font-medium truncate">{detailAgent.territory}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{detailAgent.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium truncate">{detailAgent.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(detailAgent.joinedDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Active</p>
                  <p className="font-medium">{formatDate(detailAgent.lastActive)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
