'use client';

import { useState } from 'react';
import { useBranchManagerStore } from '@/store/staff-stores';
import { formatGHS, formatDate, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Landmark, Target, TrendingUp, TrendingDown,
  Building2, ArrowRight, ClipboardCheck, AlertTriangle, CircleDollarSign,
  PiggyBank, CalendarClock, ShieldCheck, UserCog, Phone, Mail, CalendarDays,
} from 'lucide-react';
import type { LoanApprovalRequest, StaffMember } from '@/lib/types';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const approvalStatusMeta: Record<LoanApprovalRequest['status'], { label: string; className: string }> = {
  pending_bm: { label: 'Pending BM Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  disbursed: { label: 'Disbursed', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
};

const recommendationMeta: Record<LoanApprovalRequest['officerRecommendation'], string> = {
  approve: 'border-emerald-300 text-emerald-700 dark:text-emerald-300',
  review: 'border-amber-300 text-amber-700 dark:text-amber-300',
  reject: 'border-red-300 text-red-700 dark:text-red-300',
};

const staffStatusMeta: Record<StaffMember['status'], { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  on_leave: { label: 'On Leave', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

export function BranchManagerDashboard() {
  const { user, staff, approvals, setActivePage } = useBranchManagerStore();
  const [approvalDetail, setApprovalDetail] = useState<LoanApprovalRequest | null>(null);
  const [staffDetail, setStaffDetail] = useState<StaffMember | null>(null);

  const pendingApprovals = approvals.filter(a => a.status === 'pending_bm');
  const activeStaff = staff.filter(s => s.status === 'active');
  const avgPerformance = Math.round(staff.reduce((s, m) => s + m.performance, 0) / staff.length);

  const statsCards = [
    { title: 'Active Staff', value: `${activeStaff.length}/${staff.length}`, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', page: 'staff' as const },
    { title: 'Loans Awaiting Approval', value: `${pendingApprovals.length}`, icon: ClipboardCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', page: 'loan-approvals' as const },
    { title: 'Approval Queue Value', value: formatGHS(pendingApprovals.reduce((s, a) => s + a.amount, 0)), icon: CircleDollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', page: 'loan-approvals' as const },
    { title: 'Staff Performance Avg', value: `${avgPerformance}%`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', page: 'targets' as const },
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
                <Card
                  onClick={() => setApprovalDetail(a)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setApprovalDetail(a); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View approval details for ${a.applicantName}`}
                  className="mobile-card cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                >
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
                      <Badge variant="outline" className={`mt-0.5 text-[10px] ${recommendationMeta[a.officerRecommendation]}`}>
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
                <div
                  key={m.id}
                  onClick={() => setStaffDetail(m)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStaffDetail(m); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View staff details for ${m.name}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
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

      {/* Loan approval detail dialog */}
      <Dialog open={!!approvalDetail} onOpenChange={() => setApprovalDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Approval Preview</DialogTitle>
            <DialogDescription>High-value loan awaiting your branch manager decision</DialogDescription>
          </DialogHeader>
          {approvalDetail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(approvalDetail.applicantName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{approvalDetail.applicantName}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`text-xs ${approvalStatusMeta[approvalDetail.status].className}`}>
                      {approvalStatusMeta[approvalDetail.status].label}
                    </Badge>
                    <Badge variant="outline" className={`text-xs capitalize ${recommendationMeta[approvalDetail.officerRecommendation]}`}>
                      LO: {approvalDetail.officerRecommendation}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Requested amount */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground">Requested Amount</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatGHS(approvalDetail.amount)}</p>
              </div>

              <Separator />

              {/* Loan terms */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Landmark className="h-4 w-4 text-muted-foreground" /> Loan Terms
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0"><p className="text-xs text-muted-foreground">Product</p><p className="truncate font-medium">{approvalDetail.productName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Term</p><p className="font-medium">{approvalDetail.tenorMonths} months</p></div>
                  <div><p className="text-xs text-muted-foreground">Interest Rate</p><p className="font-medium">{approvalDetail.interestRate}% p.a.</p></div>
                  <div><p className="text-xs text-muted-foreground">Monthly Deduction</p><p className="font-medium">{formatGHS(approvalDetail.monthlyDeduction)}</p></div>
                </div>
              </div>

              {/* Credit assessment */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Credit Assessment
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Risk Grade</p><p className="font-semibold">Grade {approvalDetail.creditGrade}</p></div>
                  <div><p className="text-xs text-muted-foreground">Appraisal Score</p><p className="font-medium">{approvalDetail.appraisalScore}/100</p></div>
                  <div className="min-w-0"><p className="text-xs text-muted-foreground">Loan Officer</p><p className="truncate font-medium">{approvalDetail.officerName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Applicant ID</p><p className="truncate font-medium">{approvalDetail.applicantId}</p></div>
                </div>
              </div>

              {/* Request details */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" /> Request Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Request Date</p><p className="font-medium">{formatDate(approvalDetail.requestDate)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Reference</p><p className="truncate font-medium">{approvalDetail.id}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Purpose</p><p className="font-medium">{approvalDetail.purpose}</p></div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Staff detail dialog */}
      <Dialog open={!!staffDetail} onOpenChange={() => setStaffDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>Team member profile and performance</DialogDescription>
          </DialogHeader>
          {staffDetail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`${staffDetail.avatarColor} text-sm font-bold text-white`}>
                    {getInitials(staffDetail.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{staffDetail.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`text-xs ${staffStatusMeta[staffDetail.status].className}`}>
                      {staffStatusMeta[staffDetail.status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{staffDetail.role}</span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Performance Score</span>
                  <span className="font-bold">{staffDetail.performance}%</span>
                </div>
                <Progress value={staffDetail.performance} className="h-2.5" />
                <p className="text-xs text-muted-foreground">Attention flagged when below 70% or status is suspended.</p>
              </div>

              <Separator />

              {/* Contact & details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{staffDetail.phone}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{staffDetail.email}</span>
                </div>
                <div><p className="text-xs text-muted-foreground">Branch</p><p className="truncate font-medium">{staffDetail.branch}</p></div>
                <div><p className="text-xs text-muted-foreground">Joined</p><p className="font-medium">{formatDate(staffDetail.joinedDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">Staff ID</p><p className="truncate font-medium">{staffDetail.id}</p></div>
                {typeof staffDetail.pendingApprovals === 'number' && (
                  <div><p className="text-xs text-muted-foreground">Pending Approvals</p><p className="font-medium">{staffDetail.pendingApprovals}</p></div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
