'use client';

import { useState } from 'react';
import { useAdminStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials, formatCompactNumber } from '@/lib/formatters';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, UserX, DollarSign, Eye, Ban, CheckCircle2,
  Star, Phone, MapPin, Calendar, Award, TrendingUp, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Agent } from '@/lib/types';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500">
      {'★'.repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 && '½'}
      {'☆'.repeat(5 - Math.ceil(rating))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

export function AdminAgents() {
  const { allAgents } = useAdminStore();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [suspendedAgents, setSuspendedAgents] = useState<Set<string>>(new Set());

  const activeAgents = allAgents.filter(a => a.status === 'active').length;
  const inactiveAgents = allAgents.filter(a => a.status === 'inactive').length;
  const totalCollections = allAgents.reduce((s, a) => s + a.totalCollections, 0);
  const topAgents = [...allAgents].sort((a, b) => b.totalCollections - a.totalCollections);

  const handleToggleSuspend = (agent: Agent) => {
    setSuspendedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agent.id)) {
        next.delete(agent.id);
        toast.success(`${agent.name} has been activated`);
      } else {
        next.add(agent.id);
        toast.warning(`${agent.name} has been suspended`);
      }
      return next;
    });
  };

  const statusBadge = (agent: Agent) => {
    const suspended = suspendedAgents.has(agent.id);
    if (suspended) return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Suspended</Badge>;
    return <Badge variant="secondary" className={`text-xs ${getStatusColor(agent.status)}`}>{agent.status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Agents', value: allAgents.length, icon: Users, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Active', value: activeAgents, icon: UserCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Inactive', value: inactiveAgents, icon: UserX, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30' },
          { label: 'Total Collections', value: formatGHS(totalCollections), icon: DollarSign, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="mobile-card">
              <CardContent className="flex items-center gap-3 p-3 lg:p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Leaderboard */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Performance Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topAgents.slice(0, 3).map((agent, idx) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`mobile-card relative rounded-lg border p-3 lg:p-4 touch-manipulation ${idx === 0 ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                >
                  {idx === 0 && (
                    <div className="absolute -top-3 left-4 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                      🏆 Top Agent
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                          {getInitials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.branch} &middot; {agent.code}</p>
                      <StarRating rating={agent.rating} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold text-emerald-600">{formatCompactNumber(agent.totalCollections)}</p>
                      <p className="text-muted-foreground">Collected</p>
                    </div>
                    <div>
                      <p className="font-bold">{agent.totalCustomers}</p>
                      <p className="text-muted-foreground">Customers</p>
                    </div>
                    <div>
                      <p className="font-bold text-amber-600">{formatGHS(agent.totalCommissions)}</p>
                      <p className="text-muted-foreground">Commission</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">All Agents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto overscroll-x-contain scrollbar-hide">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Agent</th>
                    <th className="px-4 py-3 text-left font-medium">Code</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Territory</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Customers</th>
                    <th className="px-4 py-3 text-left font-medium">Collections</th>
                    <th className="px-4 py-3 text-left font-medium">Rating</th>
                    <th className="px-4 py-3 text-left font-medium">Last Active</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allAgents.map(agent => (
                    <tr key={agent.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                              {getInitials(agent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{agent.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{agent.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{agent.branch}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{agent.territory}</td>
                      <td className="px-4 py-3">{statusBadge(agent)}</td>
                      <td className="px-4 py-3 font-medium">{agent.totalCustomers}</td>
                      <td className="px-4 py-3 font-medium">{formatGHS(agent.totalCollections)}</td>
                      <td className="px-4 py-3"><StarRating rating={agent.rating} /></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(agent.lastActive)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedAgent(agent)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleToggleSuspend(agent)}>
                            {suspendedAgents.has(agent.id)
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              : <Ban className="h-3.5 w-3.5 text-orange-500" />
                            }
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {allAgents.map(agent => (
                <div key={agent.id} className="mobile-list-item p-4 space-y-3 touch-manipulation">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                          {getInitials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.code} &middot; {agent.branch}</p>
                      </div>
                    </div>
                    {statusBadge(agent)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold">{agent.totalCustomers}</p>
                      <p className="text-muted-foreground">Customers</p>
                    </div>
                    <div>
                      <p className="font-bold">{formatCompactNumber(agent.totalCollections)}</p>
                      <p className="text-muted-foreground">Collections</p>
                    </div>
                    <div>
                      <StarRating rating={agent.rating} />
                      <p className="text-muted-foreground">Rating</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Territory: {agent.territory}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs flex-1 min-h-[44px]" onClick={() => setSelectedAgent(agent)}>
                      <Eye className="mr-1 h-3 w-3" /> View Profile
                    </Button>
                    <Button size="sm" variant="outline" className={`text-xs min-h-[44px] ${suspendedAgents.has(agent.id) ? 'text-emerald-600' : 'text-orange-500'}`}
                      onClick={() => handleToggleSuspend(agent)}>
                      {suspendedAgents.has(agent.id)
                        ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Activate</>
                        : <><Ban className="mr-1 h-3 w-3" /> Suspend</>
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Detail Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Agent Profile</DialogTitle>
            <DialogDescription>Full agent details and performance metrics</DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(selectedAgent.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{selectedAgent.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAgent.code}</p>
                  <StarRating rating={selectedAgent.rating} />
                </div>
              </div>

              <Separator />

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Phone:</span> {selectedAgent.phone}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Branch:</span> {selectedAgent.branch}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Territory:</span> {selectedAgent.territory}</div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Joined:</span> {formatDate(selectedAgent.joinedDate)}</div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Last Active:</span> {formatDate(selectedAgent.lastActive)}</div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 p-3">
                  <p className="text-2xl font-bold text-emerald-600">{selectedAgent.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3">
                  <p className="text-2xl font-bold text-blue-600">{formatGHS(selectedAgent.totalCollections)}</p>
                  <p className="text-xs text-muted-foreground">Total Collections</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 p-3">
                  <p className="text-2xl font-bold text-amber-600">{formatGHS(selectedAgent.totalCommissions)}</p>
                  <p className="text-xs text-muted-foreground">Total Commission</p>
                </div>
                <div className="rounded-lg bg-purple-50 dark:bg-purple-900/10 p-3">
                  <p className="text-2xl font-bold text-purple-600">{selectedAgent.rating}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
