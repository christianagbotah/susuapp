'use client';

import { useState } from 'react';
import { useFieldSupervisorStore } from '@/store/staff-stores';
import { formatGHS } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Route, MapPin, CheckCircle2, CircleDot, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { SupervisorRoute } from '@/lib/types';

const routeStatusBadge = (s: SupervisorRoute['status']) => ({
  assigned: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  unassigned: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}[s]);

export function FieldSupervisorRoutes() {
  const { routes, agents, reassignRoute, markStop } = useFieldSupervisorStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState<SupervisorRoute | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  const handleAssign = () => {
    if (!assignOpen || !selectedAgent) {
      toast.error('Choose an agent to assign.');
      return;
    }
    reassignRoute(assignOpen.id, selectedAgent);
    toast.success(`Route "${assignOpen.name}" reassigned`, { description: 'Agent notified with today\'s stop list & target.' });
    setAssignOpen(null);
    setSelectedAgent('');
  };

  return (
    <div className="space-y-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Route className="h-5 w-5 text-blue-500" /> Collection Routes — Today</h2>

      <div className="space-y-3">
        {routes.map((r, i) => {
          const pct = Math.round((r.collectedToday / Math.max(r.dailyTarget, 1)) * 100);
          const isExpanded = expanded === r.id;
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card className="mobile-card">
                <CardContent className="p-4">
                  <button className="flex w-full items-start justify-between gap-3 text-left touch-manipulation" onClick={() => setExpanded(isExpanded ? null : r.id)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{r.name}</p>
                        <Badge className={`text-[10px] capitalize ${routeStatusBadge(r.status)}`}>{r.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {r.area} · {r.agentName} · {r.customers} customers
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{formatGHS(r.collectedToday)}<span className="text-xs font-normal text-muted-foreground"> / {formatGHS(r.dailyTarget)}</span></p>
                      {isExpanded ? <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" /> : <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  <div className="mt-3 space-y-1">
                    <Progress value={Math.min(pct, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground">{pct}% of daily target</p>
                  </div>

                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2 overflow-hidden border-t pt-3">
                      {r.stops.map(stop => (
                        <div key={stop.customerName} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{stop.customerName}</p>
                            <p className="truncate text-xs text-muted-foreground">{stop.area} · {formatGHS(stop.amount)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {stop.status === 'collected' && <Badge className="bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle2 className="mr-1 h-3 w-3" />collected</Badge>}
                            {stop.status === 'pending' && (
                              <>
                                <Badge variant="outline" className="text-[10px]">pending</Badge>
                                <Button size="sm" variant="outline" className="h-8 min-h-0 px-2 text-xs touch-manipulation" onClick={() => { markStop(r.id, stop.customerName, 'collected'); toast.success(`${stop.customerName} marked collected — ₵${stop.amount}`); }}>
                                  <CircleDot className="mr-1 h-3 w-3" /> Collect
                                </Button>
                              </>
                            )}
                            {stop.status === 'missed' && <Badge className="bg-red-100 text-[10px] text-red-700 dark:bg-red-900/40 dark:text-red-300"><XCircle className="mr-1 h-3 w-3" />missed</Badge>}
                          </div>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" className="w-full min-h-[40px] touch-manipulation" onClick={() => { setAssignOpen(r); setSelectedAgent(r.agentId); }}>
                        Reassign Route
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Reassign dialog */}
      <Dialog open={!!assignOpen} onOpenChange={(open) => !open && setAssignOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign Route</DialogTitle>
            <DialogDescription>{assignOpen?.name} — {assignOpen?.customers} customers, target {assignOpen ? formatGHS(assignOpen.dailyTarget) : ''}</DialogDescription>
          </DialogHeader>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choose agent" /></SelectTrigger>
            <SelectContent>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name} — {a.area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setAssignOpen(null)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handleAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
