'use client';

import { useFieldSupervisorStore } from '@/store/staff-stores';
import { toast } from 'sonner';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Route, Users, Wallet, ClipboardCheck, TrendingUp, TrendingDown,
  MapPin, Radio, Bell, ArrowRight, AlertTriangle, Percent,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const statusMeta: Record<string, { badge: string; dot: string }> = {
  in_field: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  at_office: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
  offline: { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
};

export function FieldSupervisorDashboard() {
  const { user, agents, routes, spotChecks, setActivePage, nudgeAgent } = useFieldSupervisorStore();

  const totalExpected = agents.reduce((s, a) => s + a.expectedToday, 0);
  const totalCollected = agents.reduce((s, a) => s + a.todayCollections, 0);
  const rate = Math.round((totalCollected / Math.max(totalExpected, 1)) * 100);
  const pendingVerify = agents.reduce((s, a) => s + a.pendingVerify, 0);
  const offlineAgents = agents.filter(a => a.status === 'offline');

  const statsCards = [
    { title: 'Agents in Field', value: `${agents.filter(a => a.status === 'in_field').length}/${agents.length}`, icon: Radio, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Collected Today', value: formatGHS(totalCollected), sub: `of ${formatGHS(totalExpected)} expected`, icon: Wallet, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Collection Rate', value: `${rate}%`, icon: Percent, color: rate >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400', bg: rate >= 85 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Pending Verification', value: `${pendingVerify}`, sub: 'collections to verify', icon: ClipboardCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div {...fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">{user.name.split(' ')[0]}, good morning!</h1>
                  <Badge className="border-lime-300 bg-lime-500/40 text-white">Field Supervisor</Badge>
                </div>
                <p className="text-sm text-lime-100">{user.branch} · {agents.length} agents across Greater Accra markets</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-lime-200">{formatDate('2026-10-25')}</p>
                <p className="text-sm font-medium">Market day — peak collections</p>
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
                    {stat.sub && <p className="truncate text-[11px] text-muted-foreground line-clamp-1">{stat.sub}</p>}
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

      {/* Live collection progress */}
      <motion.div {...fadeUp}>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /> Live Collection Progress</span>
              <span className="text-sm text-muted-foreground">{rate}% of daily target</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${rate}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {agents.slice(0, 4).map(a => (
                <div key={a.id} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusMeta[a.status].dot}`} />
                  <span className="truncate">{a.name.split(' ')[0]}: <span className="font-semibold">{a.collectionRate}%</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agent snapshot */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-green-600" /> Agent Live Status</h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('agents')}>All Agents <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </div>
          <div className="space-y-2">
            {agents.slice(0, 4).map(a => {
              const meta = statusMeta[a.status];
              return (
                <Card key={a.id} className="mobile-card">
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{a.name}</p>
                        <Badge className={`shrink-0 text-[9px] capitalize ${meta.badge}`}>{a.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{a.area} · {a.customers} customers · last sync {a.lastSync}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{formatGHS(a.todayCollections)}</p>
                      <div className="flex items-center gap-1.5">
                        <Progress value={a.collectionRate} className="h-1.5 w-16" />
                        <span className={`text-[11px] font-semibold ${a.collectionRate >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{a.collectionRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Alerts + quick actions */}
        <div className="space-y-4">
          {offlineAgents.length > 0 && (
            <>
              <h2 className="flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-amber-500" /> Needs Attention</h2>
              <Card className="border-l-4 border-amber-500">
                <CardContent className="space-y-2 p-4">
                  {offlineAgents.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.pendingVerify} unverified · sync {a.lastSync}</p>
                      </div>
                      <Button size="sm" variant="outline" className="min-h-[36px] shrink-0 touch-manipulation" onClick={() => { nudgeAgent(a.id); toast.success(`SMS ping sent to ${a.name}`); }}>
                        <Bell className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Manage Agents', icon: Users, page: 'agents', color: 'text-green-600' },
                  { label: 'Routes & Assignments', icon: Route, page: 'routes', color: 'text-blue-600' },
                  { label: 'Spot Checks', icon: ClipboardCheck, page: 'spot-checks', color: 'text-amber-600' },
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

          <Card className="border-l-4 border-blue-500">
            <CardContent className="space-y-1 p-4">
              <p className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-blue-600" /> Route completion</p>
              <p className="text-xs text-muted-foreground">{routes.filter(r => r.status === 'completed').length} of {routes.length} routes completed · {routes.filter(r => r.status === 'unassigned').length} unassigned</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
