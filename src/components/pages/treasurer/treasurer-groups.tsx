'use client';

import { useState } from 'react';
import { useTreasurerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Layers, Users, Wallet, TrendingUp, CalendarCheck,
  Building2, RotateCcw, Info, CheckCircle, Clock,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export function TreasurerGroups() {
  const { managedGroups, allContributions, allMembers, setActivePage } = useTreasurerStore();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const activeGroups = managedGroups.filter(g => g.status === 'active');
  const totalMembers = managedGroups.reduce((sum, g) => sum + g.members, 0);
  const combinedPool = managedGroups.reduce((sum, g) => sum + g.totalPool, 0);

  const selectedGroup = managedGroups.find(g => g.id === selectedGroupId);

  // Get mock member data for the selected group
  const getGroupMembers = (groupId: string) => {
    const group = managedGroups.find(g => g.id === groupId);
    const memberCount = group?.members || 5;
    const contributions = allContributions.filter(c => c.groupId === groupId);
    const uniqueMembers = Array.from(new Set(contributions.map(c => c.memberId)));

    // Combine unique members from contributions and fill remaining with mock data
    const members = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < memberCount; i++) {
      if (i < uniqueMembers.length) {
        const memberId = uniqueMembers[i];
        const memberContribs = contributions.filter(c => c.memberId === memberId);
        const totalContributed = memberContribs.reduce((s, c) => s + c.amount, 0);
        const latestContrib = memberContribs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        members.push({
          id: memberId,
          name: memberContribs[0]?.memberName || `Member ${i + 1}`,
          phone: allMembers.find(m => m.id === memberId)?.phone || `02${String(10000000 + i * 111111).slice(0, 8)}`,
          status: i < memberCount - 2 ? 'active' as const : (i === memberCount - 1 ? 'overdue' as const : 'active' as const),
          contributionsCount: memberContribs.length,
          totalContributed,
          lastContribution: latestContrib?.date || null,
        });
      } else {
        const names = ['Akua Mensah', 'Emmanuel Frimpong', 'Abigail Owusu', 'Samuel Agyeman', 'Veronica Osei', 'Rebecca Addo', 'Joseph Amponsah', 'Felicia Nketia', 'Yaw Adjei', 'Akosua Boateng', 'Kwabena Darko', 'Beatrice Tetteh', 'Isaac Thompson', 'Patricia Ofori', 'Daniel Oppong', 'Grace Asamoah', 'Thomas Yeboah', 'Mary Annan', 'Peter Jackson', 'Evelyn Hammond'];
        const name = names[i % names.length];
        members.push({
          id: `mock-${groupId}-${i}`,
          name,
          phone: `02${String(20000000 + i * 222222).slice(0, 8)}`,
          status: i % 7 === 0 ? 'overdue' as const : 'active' as const,
          contributionsCount: Math.floor(Math.random() * 10) + 1,
          totalContributed: 0,
          lastContribution: null,
        });
      }
    }
    return members;
  };

  // Collection summary for current round
  const getCollectionSummary = (groupId: string) => {
    const group = managedGroups.find(g => g.id === groupId);
    if (!group) return { paid: 0, pending: 0, overdue: 0, total: 0 };
    const contribs = allContributions.filter(c => c.groupId === groupId && c.round === group.currentRound);
    const paid = contribs.filter(c => c.status === 'paid').length;
    const pending = contribs.filter(c => c.status === 'pending').length;
    const overdue = contribs.filter(c => c.status === 'overdue').length;
    return { paid, pending, overdue, total: group.members };
  };

  const statsCards = [
    { title: 'Total Groups', value: managedGroups.length.toString(), icon: Layers, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Active Groups', value: activeGroups.length.toString(), icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Total Members', value: totalMembers.toString(), icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Combined Pool', value: formatGHS(combinedPool), icon: Wallet, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="mobile-card hover:shadow-md transition-shadow touch-manipulation">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs lg:text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Group Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Managed Groups
        </h2>

        <div className="grid grid-cols-1 gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {managedGroups.map((group, i) => {
            const memberProgress = Math.round((group.members / group.maxMembers) * 100);
            const roundProgress = Math.round((group.currentRound / group.totalRounds) * 100);

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="mobile-card hover:shadow-md transition-shadow touch-manipulation">
                  <CardContent className="p-3 lg:p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{group.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{group.description}</p>
                      </div>
                      <Badge className={`text-[10px] shrink-0 ${getStatusColor(group.status)}`}>
                        {group.status}
                      </Badge>
                    </div>

                    {/* Members progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-medium">{group.members}/{group.maxMembers}</span>
                      </div>
                      <Progress value={memberProgress} className="h-1.5" />
                    </div>

                    {/* Pool Value */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Pool</span>
                      <span className="font-semibold text-sm">{formatGHS(group.totalPool)}</span>
                    </div>

                    {/* Contribution info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Contribution</span>
                      <span className="font-medium">{formatGHS(group.contributionAmount)} / {group.frequency}</span>
                    </div>

                    {/* Round progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Current Round</span>
                        <span className="font-medium">{group.currentRound} of {group.totalRounds}</span>
                      </div>
                      <Progress value={roundProgress} className="h-1.5" />
                    </div>

                    {/* Branch badge */}
                    <Badge variant="outline" className="text-[10px]">
                      <Building2 className="mr-1 h-3 w-3" />
                      {group.branch}
                    </Badge>

                    {/* Next Payout */}
                    <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Next Payout</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatDate(group.nextPayout)}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{group.nextPayoutMember}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full min-h-[44px] touch-manipulation"
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <Info className="mr-1.5 h-3.5 w-3.5" />
                      Manage Group
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Group Management Dialog */}
      <Dialog open={!!selectedGroupId} onOpenChange={(open) => { if (!open) setSelectedGroupId(null); }}>
        <DialogContent className="mx-4 sm:mx-0 max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              {selectedGroup?.name || 'Group Management'}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedGroup && (
            <div className="space-y-6">
              {/* Group Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Contribution</p>
                  <p className="text-sm font-bold mt-0.5">{formatGHS(selectedGroup.contributionAmount)}</p>
                  <p className="text-[10px] text-muted-foreground">per {selectedGroup.frequency}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Pool</p>
                  <p className="text-sm font-bold mt-0.5">{formatGHS(selectedGroup.totalPool)}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedGroup.members} members</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Current Round</p>
                  <p className="text-sm font-bold mt-0.5">{selectedGroup.currentRound}/{selectedGroup.totalRounds}</p>
                  <p className="text-[10px] text-muted-foreground">{Math.round((selectedGroup.currentRound / selectedGroup.totalRounds) * 100)}% complete</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Next Payout</p>
                  <p className="text-sm font-bold mt-0.5">{formatDate(selectedGroup.nextPayout)}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{selectedGroup.nextPayoutMember}</p>
                </div>
              </div>

              {/* Round Management */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Round Management</h4>
                    <p className="text-xs text-muted-foreground">Currently in Round {selectedGroup.currentRound} of {selectedGroup.totalRounds}</p>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] touch-manipulation"
                    onClick={() => toast.success('New round started!')}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Start New Round
                  </Button>
                </div>
              </div>

              {/* Collection Summary */}
              {(() => {
                const summary = getCollectionSummary(selectedGroup.id);
                return (
                  <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="text-sm font-semibold">Current Round Collection Summary</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{summary.paid}</p>
                          <p className="text-[10px] text-muted-foreground">Collected</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{summary.pending}</p>
                          <p className="text-[10px] text-muted-foreground">Pending</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                        <Clock className="h-4 w-4 text-red-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-red-700 dark:text-red-400">{summary.overdue}</p>
                          <p className="text-[10px] text-muted-foreground">Overdue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Member List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Member List ({selectedGroup.members} members)</h4>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Contributions</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getGroupMembers(selectedGroup.id).map((member, idx) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-[10px] font-semibold">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{member.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs hidden sm:table-cell">{member.phone}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${getStatusColor(member.status)}`}>
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{member.contributionsCount}</TableCell>
                          <TableCell className="text-xs font-medium hidden md:table-cell">
                            {member.totalContributed > 0 ? formatGHS(member.totalContributed) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
