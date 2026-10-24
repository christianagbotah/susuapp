'use client';

import { useBranchManagerStore } from '@/store/staff-stores';
import { formatGHS, formatDate, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Landmark, Target, TrendingUp, TrendingDown,
  Building2, ArrowRight, ClipboardCheck, AlertTriangle, CircleDollarSign,
  PiggyBank, CalendarClock, ShieldCheck, UserCog,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export function BranchManagerDashboard() {
  const { user, staff, approvals, setActivePage } = useBranchManagerStore();

  const pendingApprovals = approvals.filter(a => a.status === 'pending_bm');
  const activeStaff = staff.filter(s => s.status === 'active');
  const avgPerformance = Math.round(staff.reduce((s, m) => s + m.performance, 0) / staff.length);

  const statsCards = [
    { title: 'Active Staff', value: `${activeStaff.length}/${staff.length}`, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Loans Awaiting Approval', value: `${pendingApprovals.length}`, icon: ClipboardCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Approval Queue Value', value: formatGHS(pendingApprovals.reduce((s, a) => s + a.amount, 0)), icon: CircleDollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Staff Performance Avg', value: `${avgPerformance}%`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  const branchKpis = [
    { label: 'Daily Collections (MoMo + Cash)', value: 286400, target: 320000, unit: '₵', icon: PiggyBank },
    { label: 'Loan Disbursement MTD', value: 341000, target: 450000, unit: '₵', icon: Landmark },
    { label: 'New Susu Accounts', value: 118, target: 150, unit: '', icon: Users },
    { label: 'PAR 30 (target ≤ 5%)', value: 3.8, target: 5, unit: '%', icon: ShieldCheck, inverse: true },
  ];

  const attention = staff.filter(s => s.performance < 70 || s.status === 'suspended');

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div {...fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">Akwaaba, {user.name.split(' ')[0]}!</h1>
                  <Badge className="border-violet-300 bg-violet-500/40 text-white">Branch Manager</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-violet-100">
                  <span className="flex items-center gap-1.5 text-sm"><Building2 className="h-4 w-4" /> {user.branch}</span>
                  <span className="text-sm text-violet-200">|</span>
                  <span className="text-sm">Makola Branch · Greater Accra</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-violet-200">Today</p>
                <p className="text-sm font-medium">{formatDate('2026-10-25')}</p>
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
                    <p className="truncate text-xl font-bold lg:text-2xl">{stat.value}</p>
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

      {/* Branch KPIs vs targets */}
      <motion.div {...fadeUp}>
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Branch KPIs — October 2026
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {branchKpis.map((kpi) => {
              const pct = Math.round((kpi.value / kpi.target) * 100);
              const onTrack = kpi.inverse ? kpi.value <= kpi.target : pct >= 75;
              return (
                <div key={kpi.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <kpi.icon className="h-4 w-4 text-muted-foreground" /> {kpi.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{kpi.unit === '₵' ? formatGHS(kpi.value) : `${kpi.value}${kpi.unit}`}</span>
                      <span className="text-xs text-muted-foreground">/ {kpi.unit === '₵' ? formatGHS(kpi.target) : `${kpi.target}${kpi.unit}`}</span>
                      {onTrack ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      )}
                    </span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Approval queue preview */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardCheck className="h-5 w-5 text-amber-500" />
              High-Value Approvals
            </h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('loan-approvals')}>
              Review All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {pendingApprovals.slice(0, 3).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.08 }}>
                <Card className="mobile-card hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {getInitials(a.applicantName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.applicantName}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.productName} · {a.tenorMonths} mo · Grade {a.creditGrade}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{formatGHS(a.amount)}</p>
                      <Badge variant="outline" className={`mt-0.5 text-[10px] ${a.officerRecommendation === 'approve' ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : a.officerRecommendation === 'review' ? 'border-amber-300 text-amber-700 dark:text-amber-300' : 'border-red-300 text-red-700 dark:text-red-300'}`}>
                        LO: {a.officerRecommendation}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {pendingApprovals.length === 0 && (
              <Card><CardContent className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Approval queue is clear — good work!
              </CardContent></Card>
            )}
          </div>
        </div>

        {/* Staff needing attention + quick actions */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <UserCog className="h-5 w-5" /> Staff Spotlight
          </h2>
          <Card>
            <CardContent className="space-y-3 p-4">
              {attention.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">All staff performing well.</p>
              ) : attention.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className={`${m.avatarColor} text-xs font-bold text-white`}>{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> {m.performance}%
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full min-h-[44px] touch-manipulation" onClick={() => setActivePage('staff')}>
                <Users className="mr-2 h-4 w-4" /> Manage Staff
              </Button>
            </CardContent>
          </Card>

          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarClock className="h-5 w-5" /> Quick Actions
          </h2>
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Review Loan Approvals', icon: ClipboardCheck, page: 'loan-approvals', color: 'text-amber-600' },
                  { label: 'Branch Targets & Performance', icon: Target, page: 'targets', color: 'text-blue-600' },
                  { label: 'Staff Directory', icon: Users, page: 'staff', color: 'text-emerald-600' },
                ].map(action => (
                  <Button key={action.label} variant="outline" className="h-auto min-h-[44px] justify-start gap-3 py-3 touch-manipulation" onClick={() => setActivePage(action.page)}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
