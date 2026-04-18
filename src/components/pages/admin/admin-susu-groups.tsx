'use client';

import { useState } from 'react';
import { useAdminStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, getInitials, formatCompactNumber } from '@/lib/formatters';
import { motion } from 'framer-motion';
import {
  Users, CircleDot, PiggyBank, DollarSign, Eye, UsersRound,
  Clock, RefreshCw, MapPin, Calendar, User, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { SusuGroup } from '@/lib/types';

const freqColors: Record<string, string> = {
  daily: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  weekly: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  monthly: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export function AdminSusuGroups() {
  const { allSusuGroups } = useAdminStore();
  const [selectedGroup, setSelectedGroup] = useState<SusuGroup | null>(null);

  const totalGroups = allSusuGroups.length;
  const activeGroups = allSusuGroups.filter(g => g.status === 'active').length;
  const totalMembers = allSusuGroups.reduce((s, g) => s + g.members, 0);
  const totalPoolValue = allSusuGroups.reduce((s, g) => s + g.totalPool, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Groups', value: totalGroups, icon: UsersRound, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Active Groups', value: activeGroups, icon: CircleDot, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Total Pool Value', value: formatGHS(totalPoolValue), icon: PiggyBank, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
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

      {/* Groups Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Susu Groups</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden xl:block overflow-x-auto overscroll-x-contain">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Members</th>
                    <th className="px-4 py-3 text-left font-medium">Total Pool</th>
                    <th className="px-4 py-3 text-left font-medium">Contribution</th>
                    <th className="px-4 py-3 text-left font-medium">Frequency</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Round</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Treasurer</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allSusuGroups.map(group => (
                    <tr key={group.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{group.name}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{group.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{group.members}</span>
                          <span className="text-muted-foreground">/ {group.maxMembers}</span>
                        </div>
                        <Progress value={(group.members / group.maxMembers) * 100} className="mt-1 h-1.5" />
                      </td>
                      <td className="px-4 py-3 font-medium">{formatGHS(group.totalPool)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatGHS(group.contributionAmount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${freqColors[group.frequency]}`}>
                          {group.frequency}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{group.branch}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{group.currentRound}</span>
                        <span className="text-muted-foreground">/ {group.totalRounds}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(group.status)}`}>{group.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{group.treasurerName}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedGroup(group)}>
                            <Eye className="mr-1 h-3 w-3" /> Details
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedGroup(group)}>
                            <Users className="mr-1 h-3 w-3" /> Members
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="xl:hidden divide-y">
              {allSusuGroups.map(group => (
                <div key={group.id} className="p-4 space-y-3 touch-manipulation">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{group.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                    </div>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${getStatusColor(group.status)}`}>{group.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={`text-xs ${freqColors[group.frequency]}`}>{group.frequency}</Badge>
                    <span className="text-xs text-muted-foreground">{group.branch}</span>
                    <span className="text-xs text-muted-foreground">Round {group.currentRound}/{group.totalRounds}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Members</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.members}/{group.maxMembers}</span>
                      </div>
                      <Progress value={(group.members / group.maxMembers) * 100} className="h-1.5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Pool Value</p>
                      <p className="font-medium text-emerald-600">{formatGHS(group.totalPool)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Contribution</p>
                      <p className="font-medium">{formatGHS(group.contributionAmount)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Treasurer</p>
                      <p className="font-medium text-xs">{group.treasurerName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs min-h-[44px]" onClick={() => setSelectedGroup(group)}>
                      <Eye className="mr-1 h-3 w-3" /> View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs min-h-[44px]" onClick={() => setSelectedGroup(group)}>
                      <Users className="mr-1 h-3 w-3" /> View Members
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Group Detail Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Susu Group Details</DialogTitle>
            <DialogDescription>Complete group information</DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedGroup.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedGroup.description}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(selectedGroup.status)}`}>{selectedGroup.status}</Badge>
                  <Badge variant="secondary" className={`text-xs ${freqColors[selectedGroup.frequency]}`}>{selectedGroup.frequency}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Branch:</span> {selectedGroup.branch}</div>
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Treasurer:</span> {selectedGroup.treasurerName}</div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Round Start:</span> {formatDate(selectedGroup.roundStartDate)}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Next Payout:</span> {formatDate(selectedGroup.nextPayout)}</div>
              </div>

              <Separator />

              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-3 text-sm font-semibold">Group Metrics</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Members</span><span className="font-medium">{selectedGroup.members} / {selectedGroup.maxMembers}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Current Round</span><span className="font-medium">{selectedGroup.currentRound} / {selectedGroup.totalRounds}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{formatGHS(selectedGroup.contributionAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Pool</span><span className="font-medium text-emerald-600">{formatGHS(selectedGroup.totalPool)}</span></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Round Progress</span>
                    <span>{Math.round((selectedGroup.currentRound / selectedGroup.totalRounds) * 100)}%</span>
                  </div>
                  <Progress value={(selectedGroup.currentRound / selectedGroup.totalRounds) * 100} className="h-2" />
                </div>
              </div>

              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Next payout to: <span className="font-medium text-foreground">{selectedGroup.nextPayoutMember}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled: {formatDate(selectedGroup.nextPayout)}</p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Members ({selectedGroup.members})</h4>
                <div className="space-y-2">
                  {Array.from({ length: Math.min(5, selectedGroup.members) }, (_, i) => {
                    const names = ['Member 1', 'Member 2', 'Member 3', 'Member 4', 'Member 5'];
                    return (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                              {`M${i + 1}`}
                            </AvatarFallback>
                          </Avatar>
                          <span>{names[i]}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                      </div>
                    );
                  })}
                  {selectedGroup.members > 5 && (
                    <p className="text-xs text-muted-foreground text-center">+{selectedGroup.members - 5} more members</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
