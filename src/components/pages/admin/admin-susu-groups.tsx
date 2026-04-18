'use client';

import { useState } from 'react';
import { useAdminStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, getInitials, formatCompactNumber, formatPhoneGH } from '@/lib/formatters';
import { motion } from 'framer-motion';
import {
  Users, CircleDot, PiggyBank, DollarSign, Eye, UsersRound,
  Clock, RefreshCw, MapPin, Calendar, User, ChevronRight,
  Search, Shield, CheckCircle2, Phone, Mail, Star, TrendingUp,
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
import { Input } from '@/components/ui/input';
import { users as allUsers } from '@/lib/mock-data';
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

// Generate realistic mock members for each group
function getGroupMembers(group: SusuGroup) {
  const customers = allUsers.filter(u => u.role === 'customer');
  const memberCount = Math.min(group.members, customers.length);
  const members = [];
  // Use treasurer as first member
  const treasurer = allUsers.find(u => u.id === group.treasurerId);
  if (treasurer) {
    members.push({
      name: treasurer.name,
      phone: treasurer.phone,
      email: treasurer.email,
      kycLevel: treasurer.kycLevel,
      role: 'Treasurer' as const,
      joinedDate: treasurer.memberSince,
      contributions: Math.floor(Math.random() * 5 + group.currentRound - 2),
      status: 'active' as const,
    });
  }
  for (let i = 0; i < memberCount - (treasurer ? 1 : 0); i++) {
    const u = customers[i % customers.length];
    members.push({
      name: u.name,
      phone: u.phone,
      email: u.email,
      kycLevel: u.kycLevel,
      role: 'Member' as const,
      joinedDate: u.memberSince,
      contributions: Math.floor(Math.random() * (group.currentRound + 1)),
      status: Math.random() > 0.15 ? ('active' as const) : ('inactive' as const),
    });
  }
  return members;
}

type DialogView = 'details' | 'members' | null;

export function AdminSusuGroups() {
  const { allSusuGroups } = useAdminStore();
  const [selectedGroup, setSelectedGroup] = useState<SusuGroup | null>(null);
  const [dialogView, setDialogView] = useState<DialogView>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const totalGroups = allSusuGroups.length;
  const activeGroups = allSusuGroups.filter(g => g.status === 'active').length;
  const totalMembers = allSusuGroups.reduce((s, g) => s + g.members, 0);
  const totalPoolValue = allSusuGroups.reduce((s, g) => s + g.totalPool, 0);

  function openDetails(group: SusuGroup) {
    setSelectedGroup(group);
    setDialogView('details');
  }

  function openMembers(group: SusuGroup) {
    setSelectedGroup(group);
    setDialogView('members');
    setMemberSearch('');
  }

  function closeDialog() {
    setSelectedGroup(null);
    setDialogView(null);
    setMemberSearch('');
  }

  const groupMembers = selectedGroup ? getGroupMembers(selectedGroup) : [];
  const filteredMembers = memberSearch
    ? groupMembers.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.phone.includes(memberSearch) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : groupMembers;

  const activeMemberCount = groupMembers.filter(m => m.status === 'active').length;
  const fullyKycCount = groupMembers.filter(m => m.kycLevel === 'full').length;

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
            <Card className="mobile-card">
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
            <div className="hidden xl:block overflow-x-auto overscroll-x-contain scrollbar-hide">
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
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDetails(group)}>
                            <Eye className="mr-1 h-3 w-3" /> Details
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openMembers(group)}>
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
                <div key={group.id} className="mobile-card p-4 space-y-3 touch-manipulation">
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
                    <Button size="sm" variant="outline" className="flex-1 text-xs min-h-[44px]" onClick={() => openDetails(group)}>
                      <Eye className="mr-1 h-3 w-3" /> View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs min-h-[44px]" onClick={() => openMembers(group)}>
                      <Users className="mr-1 h-3 w-3" /> View Members
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ======== GROUP DETAILS DIALOG ======== */}
      <Dialog open={dialogView === 'details' && !!selectedGroup} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Group Details
            </DialogTitle>
            <DialogDescription>Complete information for this susu group</DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">{selectedGroup.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{selectedGroup.description}</p>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(selectedGroup.status)}>{selectedGroup.status}</Badge>
                <Badge className={freqColors[selectedGroup.frequency]}>{selectedGroup.frequency}</Badge>
                <Badge variant="outline">Round {selectedGroup.currentRound}/{selectedGroup.totalRounds}</Badge>
              </div>

              <Separator />

              {/* Key Info Grid */}
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2.5 rounded-lg border p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-medium truncate">{selectedGroup.branch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border p-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Treasurer</p>
                    <p className="font-medium truncate">{selectedGroup.treasurerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Round Start Date</p>
                    <p className="font-medium">{formatDate(selectedGroup.roundStartDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border p-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Next Payout</p>
                    <p className="font-medium">{formatDate(selectedGroup.nextPayout)}</p>
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Financial Overview
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Total Pool</span>
                    <span className="font-bold text-emerald-600">{formatGHS(selectedGroup.totalPool)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Contribution</span>
                    <span className="font-semibold">{formatGHS(selectedGroup.contributionAmount)}/{selectedGroup.frequency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Members</span>
                    <span className="font-semibold">{selectedGroup.members} / {selectedGroup.maxMembers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Current Round</span>
                    <span className="font-semibold">{selectedGroup.currentRound} / {selectedGroup.totalRounds}</span>
                  </div>
                </div>
              </div>

              {/* Round Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Round Progress</span>
                  <span className="font-semibold">{Math.round((selectedGroup.currentRound / selectedGroup.totalRounds) * 100)}%</span>
                </div>
                <Progress value={(selectedGroup.currentRound / selectedGroup.totalRounds) * 100} className="h-2.5" />
              </div>

              {/* Next Payout Info */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold">Next Payout Recipient</span>
                </div>
                <p className="text-sm font-medium">{selectedGroup.nextPayoutMember}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled for {formatDate(selectedGroup.nextPayout)} &middot; {formatGHS(selectedGroup.totalPool)} payout amount
                </p>
              </div>

              {/* Quick action to view members */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => { closeDialog(); setTimeout(() => openMembers(selectedGroup), 100); }}
              >
                <Users className="h-4 w-4" />
                View All {selectedGroup.members} Members
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======== MEMBERS DIALOG ======== */}
      <Dialog open={dialogView === 'members' && !!selectedGroup} onOpenChange={closeDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Group Members
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.name} &mdash; {selectedGroup?.members} members
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              {/* Members Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-600">{activeMemberCount}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Active</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                  <p className="text-lg font-bold text-blue-600">{fullyKycCount}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Full KYC</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                  <p className="text-lg font-bold text-amber-600">{groupMembers.length - activeMemberCount}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Inactive</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>

              {memberSearch && (
                <p className="text-xs text-muted-foreground">
                  {filteredMembers.length} result{filteredMembers.length !== 1 ? 's' : ''} found
                </p>
              )}

              {/* Members List */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto overscroll-contain">
                {filteredMembers.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mt-2">No members match your search</p>
                  </div>
                ) : (
                  filteredMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border p-3 mobile-list-item">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className={`text-xs font-semibold ${
                          member.role === 'Treasurer'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate">{member.name}</p>
                          {member.role === 'Treasurer' && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] px-1 py-0">
                              Treasurer
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatPhoneGH(member.phone)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                          <Shield className={`h-3 w-3 ${
                            member.kycLevel === 'full' ? 'text-emerald-500' : member.kycLevel === 'basic' ? 'text-amber-500' : 'text-red-400'
                          }`} />
                          <span className={`text-[10px] font-medium capitalize ${
                            member.kycLevel === 'full' ? 'text-emerald-600' : member.kycLevel === 'basic' ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {member.kycLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {member.status === 'active' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <CircleDot className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={`text-[10px] capitalize ${member.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {member.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {member.contributions} contrib.
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
