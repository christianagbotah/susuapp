'use client';

import { useComplianceStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  ShieldAlert, FileWarning, Landmark, Gauge,
  AlertTriangle, ArrowRight, Search, FileCheck2, CalendarClock,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const severityBadge: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function ComplianceDashboard() {
  const { user, alerts, strs, bogReturns, setActivePage } = useComplianceStore();

  const open = alerts.filter(a => ['open', 'investigating'].includes(a.status));
  const critical = alerts.filter(a => a.severity === 'critical' && a.status !== 'closed_false_positive' && a.status !== 'closed_str_filed');
  const filed = strs.filter(s => ['filed', 'acknowledged', 'under_review'].includes(s.status));
  const dueReturns = bogReturns.filter(r => ['in_progress', 'not_started'].includes(r.status));

  const statsCards = [
    { title: 'Open AML Alerts', value: `${open.length}`, sub: `${critical.length} critical`, icon: ShieldAlert, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', page: 'aml-alerts' as const },
    { title: 'STRs Filed (YTD)', value: `${filed.length}`, sub: 'FIC & BoG', icon: FileWarning, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', page: 'str-reports' as const },
    { title: 'Regulatory Returns Due', value: `${dueReturns.length}`, sub: 'NBFRI cycle', icon: Landmark, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', page: 'bog-returns' as const },
    { title: 'KYC Compliance', value: '87%', sub: 'customers with full KYC', icon: Gauge, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', page: 'aml-alerts' as const },
  ];

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div {...fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-900 via-gray-900 to-red-950 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">{user.name.split(' ')[0]}, stay sharp.</h1>
                  <Badge className="border-red-400 bg-red-500/30 text-white">Compliance Officer</Badge>
                </div>
                <p className="text-sm text-gray-300">AML/CFT monitoring · FIC STR filing · BoG NBFRI returns</p>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FileCheck2 className="h-5 w-5" />
                <span className="text-sm">FIC registered institution</span>
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

      {/* Critical alerts */}
      <motion.div {...fadeUp}>
        <Card className="border-l-4 border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /> Critical Alerts — Act Today</span>
              <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('aml-alerts')}>
                All Alerts <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalAlerts.map(a => (
              <div key={a.id} className="space-y-1.5 rounded-lg border border-red-200 bg-red-50/60 p-3.5 dark:border-red-900 dark:bg-red-900/10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`text-[10px] ${severityBadge[a.severity]}`}>{a.severity}</Badge>
                  <p className="text-sm font-semibold">{a.customerName}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(a.triggeredDate)}</span>
                  {a.amount > 0 && <span className="ml-auto text-sm font-bold">{formatGHS(a.amount)}</span>}
                </div>
                <p className="text-xs font-medium text-red-800 dark:text-red-200">{a.rule}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <Badge variant="outline" className="text-[10px] capitalize">{a.status.replace(/_/g, ' ')}</Badge>
                  <Button size="sm" variant="outline" className="min-h-[36px] touch-manipulation" onClick={() => setActivePage('aml-alerts')}>
                    <Search className="mr-1.5 h-3.5 w-3.5" /> Investigate
                  </Button>
                </div>
              </div>
            ))}
            {criticalAlerts.length === 0 && (
              <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <FileCheck2 className="h-5 w-5 text-emerald-500" /> No critical alerts — monitoring continues.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* BoG returns */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" /> BoG Returns Status</h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('bog-returns')}>Open <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </div>
          <Card>
            <CardContent className="space-y-4 p-4">
              {bogReturns.slice(0, 4).map(r => (
                <div key={r.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{r.return}</span>
                    <Badge className={`shrink-0 text-[10px] ${r.status === 'submitted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : r.status === 'late' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                      {r.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Progress value={r.completion} className="h-1.5" />
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3 w-3" /> Due {formatDate(r.dueDate)} · {r.completion}%</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* STR pipeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><FileWarning className="h-5 w-5 text-amber-500" /> STR Pipeline</h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('str-reports')}>Open <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </div>
          <Card>
            <CardContent className="space-y-3 p-4">
              {strs.slice(0, 4).map(s => (
                <div key={s.id} className="space-y-1 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{s.subjectName}</p>
                    <Badge className={`shrink-0 text-[10px] capitalize ${s.status === 'filed' || s.status === 'acknowledged' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{s.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.filedWith} · ref {s.reference}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
