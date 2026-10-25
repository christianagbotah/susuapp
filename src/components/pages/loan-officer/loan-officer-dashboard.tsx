'use client';

import { useLoanOfficerStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Landmark, ClipboardList, UserSearch, Briefcase, AlertTriangle,
  TrendingUp, ArrowRight, CalendarCheck, ShieldAlert, PiggyBank, Phone,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const stageColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  documents_pending: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  field_visit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  appraisal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  recommended: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  approved: 'bg-emerald-600 text-white',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  disbursed: 'bg-teal-600 text-white',
};

export function LoanOfficerDashboard() {
  const { user, applications, appraisals, portfolio, setActivePage } = useLoanOfficerStore();

  const pipeline = applications.filter(a => !['disbursed', 'rejected'].includes(a.stage));
  const pendingAppraisals = applications.filter(a => ['field_visit', 'appraisal', 'documents_pending'].includes(a.stage));
  const arrears = portfolio.filter(p => p.arrearsDays > 0);
  const par30 = Math.round((portfolio.filter(p => p.arrearsDays > 30).reduce((s, p) => s + p.outstanding, 0) / portfolio.reduce((s, p) => s + p.outstanding, 0)) * 100);
  const recommended = appraisals.filter(a => a.recommendation !== 'reject');

  const statsCards = [
    { title: 'Active Pipeline', value: `${pipeline.length}`, sub: formatGHS(pipeline.reduce((s, a) => s + a.amount, 0)), icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', page: 'pipeline' as const },
    { title: 'Awaiting Appraisal', value: `${pendingAppraisals.length}`, sub: 'Field visits & 5C scoring', icon: UserSearch, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', page: 'appraisals' as const },
    { title: 'Recommended to BM', value: `${recommended.length}`, sub: formatGHS(recommended.reduce((s, a) => s + a.recommendedAmount, 0)), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', page: 'pipeline' as const },
    { title: 'Portfolio At Risk (30)', value: `${par30}%`, sub: `${arrears.length} loans in arrears`, icon: ShieldAlert, color: par30 > 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', bg: par30 > 5 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30', page: 'portfolio' as const },
  ];

  const pipelineByStage = (['new', 'documents_pending', 'field_visit', 'appraisal', 'recommended'] as const).map(stage => ({
    stage,
    count: applications.filter(a => a.stage === stage).length,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div {...fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">Medaase, {user.name.split(' ')[0]}!</h1>
                  <Badge className="border-orange-300 bg-orange-500/40 text-white">Loan Officer</Badge>
                </div>
                <p className="text-sm text-orange-100">{user.branch} · Credit & field appraisal desk</p>
              </div>
              <div className="flex items-center gap-2 text-orange-100">
                <CalendarCheck className="h-5 w-5" />
                <span className="text-sm">{formatDate('2026-10-25')}</span>
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
            sub={stat.sub}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            onClick={() => setActivePage(stat.page)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline funnel */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Landmark className="h-5 w-5 text-amber-500" /> Origination Funnel</h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('pipeline')}>
              Open Pipeline <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <Card>
            <CardContent className="space-y-4 p-4">
              {pipelineByStage.map((s, i) => {
                const pct = pipeline.length ? Math.round((s.count / pipeline.length) * 100) : 0;
                return (
                  <div key={s.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{s.stage.replace(/_/g, ' ')}</span>
                      <span className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${stageColors[s.stage]}`}>{s.count}</Badge>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Arrears watchlist */}
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-red-500" /> Arrears Watchlist</h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('portfolio')}>
              Full Portfolio <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {arrears.slice(0, 3).map(p => (
              <Card key={p.id} className="mobile-card border-l-4 border-red-400">
                <CardContent className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.customerName}</p>
                    <p className="text-xs text-muted-foreground">{p.productName} · last pay {formatDate(p.lastPaymentDate)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{formatGHS(p.outstanding)}</p>
                    <Badge className="mt-0.5 bg-red-100 text-[10px] text-red-700 dark:bg-red-900/40 dark:text-red-300">{p.arrearsDays} days</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Daily susu context + quick actions */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><PiggyBank className="h-5 w-5" /> Susu-Linked Insight</h2>
          <Card className="border-l-4 border-emerald-500">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-medium">Daily savings drive approvals</p>
              <p className="text-xs text-muted-foreground">
                Applicants with consistent daily susu (≥ 90 days) qualify for preferential rates. 6 of your 8 pipeline applicants are active savers — highlight this in appraisals.
              </p>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">75% of pipeline is susu-linked</p>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Review Applications', icon: ClipboardList, page: 'pipeline', color: 'text-blue-600' },
                  { label: '5C Appraisals', icon: UserSearch, page: 'appraisals', color: 'text-amber-600' },
                  { label: 'Portfolio & PAR', icon: Briefcase, page: 'portfolio', color: 'text-emerald-600' },
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

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="flex items-start gap-2 p-3.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Reminder: confirm guarantors by phone before recommending. FIC requires recorded consent for susu-linked guarantors.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
