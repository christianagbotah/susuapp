'use client';

import { useState } from 'react';
import { useFieldSupervisorStore } from '@/store/staff-stores';
import { formatGHS, getInitials } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
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

export function FieldSupervisorAgents() {
  const { agents, nudgeAgent } = useFieldSupervisorStore();
  const [query, setQuery] = useState('');

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
              <Card className="mobile-card h-full hover:shadow-md transition-shadow">
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
                    onClick={() => { nudgeAgent(a.id); toast.success(`Ping sent to ${a.name}`, { description: 'SMS + app notification delivered.' }); }}
                  >
                    <Bell className="mr-1.5 h-3.5 w-3.5" /> Send Reminder
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
