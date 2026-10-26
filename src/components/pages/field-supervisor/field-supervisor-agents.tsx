'use client';

import { useState } from 'react';
import { useFieldSupervisorStore } from '@/store/staff-stores';
import { formatGHS, getInitials } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, MapPin, Wallet, Users, Bell, ClipboardCheck, Radio } from 'lucide-react';
import type { SupervisedAgent } from '@/lib/types';

const statusMeta: Record<SupervisedAgent['status'], { badge: string; dot: string }> = {
  in_field: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  at_office: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
  offline: { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
};

const openOnKey = (fn: () => void) => (e: React.KeyboardEvent<HTMLDivElement>): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

function DetailField({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function FieldSupervisorAgents() {
  const { agents, nudgeAgent } = useFieldSupervisorStore();
  const [query, setQuery] = useState('');
  const [detailAgent, setDetailAgent] = useState<SupervisedAgent | null>(null);

  const filtered = agents.filter(a => `${a.name} ${a.agentCode} ${a.area}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search agents by name, code or area..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 min-h-[44px]" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((a, i) => {
          const meta = statusMeta[a.status];
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card
                role="button"
                tabIndex={0}
                aria-label={`Open agent details — ${a.name}`}
                onClick={() => setDetailAgent(a)}
                onKeyDown={openOnKey(() => setDetailAgent(a))}
                className="mobile-card h-full cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">{getInitials(a.name)}</AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${meta.dot}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.agentCode}</p>
                    </div>
                    <Badge className={`shrink-0 text-[9px] capitalize ${meta.badge}`}>{a.status.replace('_', ' ')}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {a.area} · last sync {a.lastSync}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <Users className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                      <p className="mt-0.5 text-sm font-bold">{a.customers}</p>
                      <p className="text-[9px] text-muted-foreground">customers</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <Wallet className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                      <p className="mt-0.5 text-sm font-bold">{formatGHS(a.floatBalance)}</p>
                      <p className="text-[9px] text-muted-foreground">float</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <ClipboardCheck className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                      <p className="mt-0.5 text-sm font-bold">{a.pendingVerify}</p>
                      <p className="text-[9px] text-muted-foreground">to verify</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Today: {formatGHS(a.todayCollections)} / {formatGHS(a.expectedToday)}</span>
                      <span className={`font-semibold ${a.collectionRate >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{a.collectionRate}%</span>
                    </div>
                    <Progress value={a.collectionRate} className="h-1.5" />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full min-h-[40px] touch-manipulation"
                    onClick={e => { e.stopPropagation(); nudgeAgent(a.id); toast.success(`Ping sent to ${a.name}`, { description: 'SMS + app notification delivered.' }); }}
                  >
                    <Bell className="mr-1.5 h-3.5 w-3.5" /> Send Reminder
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Agent detail dialog */}
      <Dialog open={!!detailAgent} onOpenChange={() => setDetailAgent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
            <DialogDescription>Full agent record — float, collections and verification queue.</DialogDescription>
          </DialogHeader>
          {detailAgent && (() => {
            const meta = statusMeta[detailAgent.status];
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        {getInitials(detailAgent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${meta.dot}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{detailAgent.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{detailAgent.agentCode}</span>
                      <Badge className={`text-[9px] capitalize ${meta.badge}`}>{detailAgent.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-medium">Collection rate</span>
                    <span className={`font-bold ${detailAgent.collectionRate >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{detailAgent.collectionRate}%</span>
                  </div>
                  <Progress value={detailAgent.collectionRate} className="h-2.5" />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Today: {formatGHS(detailAgent.todayCollections)}</span>
                    <span>Expected: {formatGHS(detailAgent.expectedToday)}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <DetailField label="Agent code" value={detailAgent.agentCode} />
                    <DetailField label="Area" value={detailAgent.area} />
                    <DetailField label="Status" value={<span className="capitalize">{detailAgent.status.replace('_', ' ')}</span>} />
                    <DetailField label="Customers" value={String(detailAgent.customers)} />
                    <DetailField label="Float balance" value={formatGHS(detailAgent.floatBalance)} />
                    <DetailField label="Pending verify" value={String(detailAgent.pendingVerify)} />
                    <DetailField label="Today collections" value={<span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatGHS(detailAgent.todayCollections)}</span>} />
                    <DetailField label="Expected today" value={formatGHS(detailAgent.expectedToday)} />
                    <DetailField label="Collection rate" value={`${detailAgent.collectionRate}%`} />
                    <DetailField label="Last sync" value={detailAgent.lastSync} />
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
