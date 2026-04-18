'use client';

import { useState, useMemo } from 'react';
import { useTreasurerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, UserCheck, AlertTriangle, UserPlus, Search,
  Eye, Bell, History, Filter, Layers, Phone, Wallet,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

type MemberStatus = 'all' | 'active' | 'overdue' | 'new';

interface EnrichedMember {
  id: string;
  name: string;
  phone: string;
  groups: string[];
  groupIds: string[];
  totalContributed: number;
  contributionsCount: number;
  lastContribution: string | null;
  status: 'active' | 'overdue' | 'new';
  memberSince: string;
  email: string;
  kycLevel: string;
}

export function TreasurerMembers() {
  const { allMembers, managedGroups, allContributions } = useTreasurerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [profileDialogId, setProfileDialogId] = useState<string | null>(null);
  const [historyDialogId, setHistoryDialogId] = useState<string | null>(null);

  // Enrich member data
  const enrichedMembers: EnrichedMember[] = useMemo(() => {
    return allMembers.map(member => {
      const memberContribs = allContributions.filter(c => c.memberId === member.id);
      const groupIds = [...new Set(memberContribs.map(c => c.groupId))];
      const groupNames = [...new Set(memberContribs.map(c => c.groupName))];

      const totalContributed = memberContribs.reduce((sum, c) => sum + c.amount, 0);
      const sortedContribs = [...memberContribs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastContribution = sortedContribs.length > 0 ? sortedContribs[0].date : null;

      // Check for overdue contributions
      const hasOverdue = memberContribs.some(c => c.status === 'overdue');

      // Determine member status
      const joinDate = new Date(member.memberSince);
      const now = new Date();
      const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      const isNewMember = daysSinceJoin <= 30;

      let status: 'active' | 'overdue' | 'new';
      if (hasOverdue) status = 'overdue';
      else if (isNewMember) status = 'new';
      else status = 'active';

      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        groups: groupNames,
        groupIds,
        totalContributed,
        contributionsCount: memberContribs.length,
        lastContribution,
        status,
        memberSince: member.memberSince,
        kycLevel: member.kycLevel,
      };
    });
  }, [allMembers, allContributions]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return enrichedMembers.filter(member => {
      const matchesSearch = searchQuery === '' ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery) ||
        member.groups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesGroup = groupFilter === 'all' || member.groupIds.includes(groupFilter);

      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [enrichedMembers, searchQuery, statusFilter, groupFilter]);

  // Stats
  const activeContributors = enrichedMembers.filter(m => m.status === 'active').length;
  const overdueMembers = enrichedMembers.filter(m => m.status === 'overdue').length;
  const newMembers = enrichedMembers.filter(m => m.status === 'new').length;

  const statsCards = [
    { title: 'Total Members', value: allMembers.length.toString(), icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Active Contributors', value: activeContributors.toString(), icon: UserCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Members with Overdue', value: overdueMembers.toString(), icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    { title: 'New This Month', value: newMembers.toString(), icon: UserPlus, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  const selectedMember = enrichedMembers.find(m => m.id === profileDialogId);
  const historyMember = enrichedMembers.find(m => m.id === historyDialogId);

  // Get contribution history for member dialog
  const getMemberContributions = (memberId: string) => {
    return allContributions
      .filter(c => c.memberId === memberId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getContributionsByGroup = (memberId: string) => {
    const contribs = getMemberContributions(memberId);
    const grouped: Record<string, { groupName: string; total: number; count: number; paid: number; overdue: number }> = {};

    contribs.forEach(c => {
      if (!grouped[c.groupId]) {
        grouped[c.groupId] = { groupName: c.groupName, total: 0, count: 0, paid: 0, overdue: 0 };
      }
      grouped[c.groupId].total += c.amount;
      grouped[c.groupId].count += 1;
      if (c.status === 'paid') grouped[c.groupId].paid += 1;
      if (c.status === 'overdue') grouped[c.groupId].overdue += 1;
    });

    return Object.entries(grouped).map(([groupId, data]) => ({ groupId, ...data }));
  };

  const handleSendReminder = (name: string) => {
    toast.success(`Payment reminder sent to ${name}!`);
  };

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

      {/* Search and Filters */}
      <motion.div {...fadeUp}>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-12 lg:h-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-[180px] h-12 lg:h-10">
                    <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Filter by group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {managedGroups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MemberStatus)}>
                  <SelectTrigger className="w-[150px] h-12 lg:h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Members Table */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Directory
                <Badge variant="secondary" className="text-xs ml-2">{filteredMembers.length} members</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto overscroll-contain">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Member</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Groups</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Total Contributed</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Last Contribution</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        No members found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs font-semibold">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[150px]">{member.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{member.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {member.groups.length > 0 ? member.groups.slice(0, 2).map(g => (
                              <Badge key={g} variant="outline" className="text-[10px] max-w-[120px] truncate">
                                {g}
                              </Badge>
                            )) : (
                              <span className="text-xs text-muted-foreground">No groups</span>
                            )}
                            {member.groups.length > 2 && (
                              <Badge variant="secondary" className="text-[10px]">+{member.groups.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium hidden lg:table-cell">
                          {member.totalContributed > 0 ? formatGHS(member.totalContributed) : '-'}
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          {member.lastContribution ? formatDate(member.lastContribution) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${getStatusColor(member.status === 'new' ? 'active' : member.status)}`}>
                            {member.status === 'new' ? 'New' : member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 min-h-[44px] px-2 text-xs touch-manipulation"
                              onClick={() => setProfileDialogId(member.id)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 min-h-[44px] px-2 text-xs touch-manipulation"
                              onClick={() => handleSendReminder(member.name)}
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 min-h-[44px] px-2 text-xs touch-manipulation"
                              onClick={() => setHistoryDialogId(member.id)}
                            >
                              <History className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Member Profile Dialog */}
      <Dialog open={!!profileDialogId} onOpenChange={(open) => { if (!open) setProfileDialogId(null); }}>
        <DialogContent className="mx-4 sm:mx-0 max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Member Profile
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xl font-semibold">
                    {getInitials(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(selectedMember.status === 'new' ? 'active' : selectedMember.status)}`}>
                      {selectedMember.status === 'new' ? 'New Member' : selectedMember.status === 'overdue' ? 'Has Overdue' : 'Active'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedMember.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Contributed</p>
                  <p className="text-sm font-bold mt-0.5">{formatGHS(selectedMember.totalContributed)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Contributions</p>
                  <p className="text-sm font-bold mt-0.5">{selectedMember.contributionsCount}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Groups</p>
                  <p className="text-sm font-bold mt-0.5">{selectedMember.groups.length}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-bold mt-0.5">{formatDate(selectedMember.memberSince)}</p>
                </div>
              </div>

              {/* Contribution by Group */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Contribution History by Group</h4>
                {getContributionsByGroup(selectedMember.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No contributions found.</p>
                ) : (
                  <div className="space-y-2">
                    {getContributionsByGroup(selectedMember.id).map(group => (
                      <div key={group.groupId} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium">{group.groupName}</h5>
                          <span className="text-sm font-bold">{formatGHS(group.total)}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{group.count} contributions</span>
                          <span className="text-emerald-600">{group.paid} paid</span>
                          {group.overdue > 0 && <span className="text-red-600">{group.overdue} overdue</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="mobile-card flex-1 min-h-[44px] touch-manipulation"
                  onClick={() => handleSendReminder(selectedMember.name)}
                >
                  <Bell className="mr-1.5 h-4 w-4" />
                  Send Reminder
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] touch-manipulation"
                  onClick={() => {
                    setProfileDialogId(null);
                    setHistoryDialogId(selectedMember.id);
                  }}
                >
                  <History className="mr-1.5 h-4 w-4" />
                  View All Contributions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contribution History Dialog */}
      <Dialog open={!!historyDialogId} onOpenChange={(open) => { if (!open) setHistoryDialogId(null); }}>
        <DialogContent className="mx-4 sm:mx-0 max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-600" />
              Contribution History - {historyMember?.name}
            </DialogTitle>
            <DialogDescription>
              All contributions across groups
            </DialogDescription>
          </DialogHeader>

          {historyMember && (
            <div className="space-y-4">
              {(() => {
                const contribs = getMemberContributions(historyMember.id);
                const total = contribs.reduce((s, c) => s + c.amount, 0);
                return (
                  <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-emerald-600">{formatGHS(total)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Contributions</p>
                      <p className="text-lg font-bold">{contribs.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Groups</p>
                      <p className="text-lg font-bold">{historyMember.groups.length}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Group</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Round</TableHead>
                      <TableHead className="text-xs">Collected By</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getMemberContributions(historyMember.id).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                          No contributions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      getMemberContributions(historyMember.id).map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs">{formatDate(c.date)}</TableCell>
                          <TableCell className="text-xs font-medium max-w-[150px] truncate">{c.groupName}</TableCell>
                          <TableCell className="text-xs font-bold">{formatGHS(c.amount)}</TableCell>
                          <TableCell className="text-xs">{c.round}</TableCell>
                          <TableCell className="text-xs">{c.collectedByName || 'Self'}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${getStatusColor(c.status)}`}>
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
