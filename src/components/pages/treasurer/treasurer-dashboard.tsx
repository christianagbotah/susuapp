'use client';

import { useState } from 'react';
import { useTreasurerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { SusuGroup, SusuPayout } from '@/lib/types';
import {
  Users, PiggyBank, Wallet, Clock, Shield, ArrowRight,
  TrendingUp, CalendarCheck, CircleDollarSign, BarChart3,
  Building2, ChevronRight, Play, CheckCircle, Layers,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export function TreasurerDashboard() {
  const { user, managedGroups, allContributions, payouts, allMembers, processPayout, setActivePage } = useTreasurerStore();

  const [detailGroup, setDetailGroup] = useState<SusuGroup | null>(null);
  const [detailPayout, setDetailPayout] = useState<SusuPayout | null>(null);

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const totalPoolValue = managedGroups.reduce((sum, g) => sum + g.totalPool, 0);
  const totalMembers = managedGroups.reduce((sum, g) => sum + g.members, 0);

  // Collection progress per group (current round contributions)
  const getGroupCollectionProgress = (groupId: string, members: number) => {
    const paid = allContributions.filter(c => c.groupId === groupId && c.status === 'paid').length;
    return { paid: Math.min(paid, members), total: members };
  };

  const statsCards = [
    {
      title: 'Groups Managed',
      value: managedGroups.length.toString(),
      icon: Layers,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      page: 'groups' as const,
    },
    {
      title: 'Total Pool Value',
      value: formatGHS(totalPoolValue),
      icon: Wallet,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      page: 'reports' as const,
    },
    {
      title: 'Members Under Management',
      value: totalMembers.toString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      page: 'members' as const,
    },
    {
      title: 'Pending Payouts',
      value: pendingPayouts.length.toString(),
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      page: 'payouts' as const,
    },
  ];

  const quickActions = [
    { label: 'Process Payouts', icon: CircleDollarSign, page: 'payouts' as const, color: 'text-emerald-600' },
    { label: 'View Reports', icon: BarChart3, page: 'reports' as const, color: 'text-amber-600' },
    { label: 'Manage Groups', icon: Layers, page: 'groups' as const, color: 'text-blue-600' },
  ];

  const handleProcessPayout = (payoutId: string) => {
    processPayout(payoutId);
    toast.success('Payout processed successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div {...fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">Welcome, {user.name}!</h1>
                  <Badge className="border-cyan-300 bg-cyan-500/40 text-white">
                    <Shield className="mr-1 h-3 w-3" />
                    Treasurer
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-cyan-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{user.branch || 'Accra Central'}</span>
                  </div>
                  <span className="text-sm text-cyan-200">|</span>
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    <span className="text-sm">{managedGroups.length} groups managed</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-cyan-200" />
                <span className="text-sm text-cyan-100">
                  Member since {formatDate(user.memberSince)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <KpiCard
            key={stat.title}
            index={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            onClick={() => setActivePage(stat.page)}
          />
        ))}
      </div>

      {/* Today's Collection Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <Card className="border-l-4 border-emerald-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm lg:text-base font-semibold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
              {/* Total Collected */}
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-1 flex flex-col">
                <p className="text-xs font-medium text-muted-foreground">Total Collected</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">₵3,200.00</span>
                  <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-auto">+12% from yesterday</p>
              </div>

              {/* Members Paid */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 space-y-1 flex flex-col">
                <p className="text-xs font-medium text-muted-foreground">Members Paid</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">28</span>
                  <span className="text-sm text-muted-foreground">/45</span>
                </div>
                <div className="space-y-1 mt-auto">
                  <div className="h-2 w-full rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: '62%' }} />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">62% completion</p>
                </div>
              </div>

              {/* Pending */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 space-y-1 flex flex-col">
                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">17</span>
                  <span className="text-sm text-muted-foreground">members</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-auto">
                  <ArrowDownRight className="h-3 w-3" />
                  Needs follow-up
                </p>
              </div>
            </div>

            {/* Quick Status */}
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  2 groups need attention
                </span>
                <span className="text-xs text-muted-foreground">28 of 45 members paid</span>
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: '62%' }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Overall daily completion: 62%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Group Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Group Summary
            </h2>
            <Button variant="ghost" size="sm" className="text-xs touch-manipulation" onClick={() => setActivePage('groups')}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:gap-4 sm:grid-cols-2 items-stretch">
            {managedGroups.map((group, i) => {
              const collection = getGroupCollectionProgress(group.id, group.members);
              const progress = collection.total > 0 ? Math.round((collection.paid / collection.total) * 100) : 0;
              const roundProgress = Math.round((group.currentRound / group.totalRounds) * 100);

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  <Card
                    onClick={() => setDetailGroup(group)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetailGroup(group);
                      }
                    }}
                    aria-label={`Open ${group.name} group details`}
                    className="cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all touch-manipulation h-full"
                  >
                    <CardContent className="p-3 lg:p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{group.members} members</p>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${getStatusColor(group.status)}`}>
                          {group.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Pool Value</span>
                          <span className="font-semibold text-sm">{formatGHS(group.totalPool)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Round {group.currentRound} of {group.totalRounds}</span>
                          <span className="font-medium">{roundProgress}%</span>
                        </div>
                        <Progress value={roundProgress} className="h-1.5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Collection this round</span>
                          <span className="font-medium">{collection.paid}/{collection.total}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CalendarCheck className="h-3 w-3" />
                          Next: {formatDate(group.nextPayout)}
                        </span>
                        <span className="font-medium">{group.nextPayoutMember}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Pending Payouts + Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Pending Payouts
          </h2>

          <Card>
            <CardContent className="p-3 lg:p-4 overscroll-contain">
              {pendingPayouts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium">All payouts processed!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto overscroll-contain">
                  {pendingPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      onClick={() => setDetailPayout(payout)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setDetailPayout(payout);
                        }
                      }}
                      aria-label={`Open payout details for ${payout.memberName}`}
                      className="mobile-card rounded-lg border p-3 space-y-2 touch-manipulation cursor-pointer hover:bg-muted/30 hover:border-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{payout.memberName}</p>
                          <p className="text-xs text-muted-foreground truncate">{payout.groupName}</p>
                        </div>
                        <span className="text-sm font-bold shrink-0">{formatGHS(payout.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(payout.payoutDate)}</span>
                        <Badge className={`text-[10px] ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProcessPayout(payout.id);
                        }}
                      >
                        <CircleDollarSign className="mr-1 h-3.5 w-3.5" />
                        Process Payout
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </h2>
          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="justify-start gap-3 min-h-[44px] h-auto py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors touch-manipulation"
                    onClick={() => setActivePage(action.page)}
                  >
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Collection Status by Group */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm lg:text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Collection Status by Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto overscroll-contain">
            {managedGroups.filter(g => g.status === 'active').map((group) => {
              const collection = getGroupCollectionProgress(group.id, group.members);
              const progress = collection.total > 0 ? Math.round((collection.paid / collection.total) * 100) : 0;

              return (
                <div
                  key={group.id}
                  onClick={() => setDetailGroup(group)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailGroup(group);
                    }
                  }}
                  aria-label={`Open ${group.name} collection status details`}
                  className="space-y-2 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground">({group.frequency})</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{collection.paid}/{collection.total} members</span>
                      <span className={`font-semibold ${progress >= 80 ? 'text-emerald-600 dark:text-emerald-400' : progress >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Group Detail Dialog */}
      <Dialog open={!!detailGroup} onOpenChange={() => setDetailGroup(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Group Details</DialogTitle>
            <DialogDescription>Complete susu group information</DialogDescription>
          </DialogHeader>
          {detailGroup && (() => {
            const groupProgress = Math.round((detailGroup.currentRound / detailGroup.totalRounds) * 100);
            const collection = getGroupCollectionProgress(detailGroup.id, detailGroup.members);
            const roundCollection = collection.total > 0 ? Math.round((collection.paid / collection.total) * 100) : 0;
            return (
              <div className="space-y-4">
                {/* Identity header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                      {getInitials(detailGroup.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">{detailGroup.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs capitalize ${getStatusColor(detailGroup.status)}`}>
                        {detailGroup.status}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {detailGroup.members} members
                      </span>
                    </div>
                  </div>
                </div>

                {/* Round progress */}
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Round {detailGroup.currentRound} of {detailGroup.totalRounds}</span>
                    <span className="font-bold">{groupProgress}%</span>
                  </div>
                  <Progress value={groupProgress} className="h-2.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Collection this round: {collection.paid}/{collection.total}</span>
                    <span>{roundCollection}%</span>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total Pool</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatGHS(detailGroup.totalPool)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Contribution</p>
                    <p className="text-sm font-medium capitalize mt-0.5">{formatGHS(detailGroup.contributionAmount)} / {detailGroup.frequency}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-sm font-medium mt-0.5">{detailGroup.members} / {detailGroup.maxMembers}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Current Round</p>
                    <p className="text-sm font-medium mt-0.5">{detailGroup.currentRound} / {detailGroup.totalRounds}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Next Payout</p>
                    <p className="text-sm font-medium mt-0.5">{formatDate(detailGroup.nextPayout)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Next Payout Member</p>
                    <p className="text-sm font-medium mt-0.5 truncate">{detailGroup.nextPayoutMember}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Round Start Date</p>
                    <p className="text-sm font-medium mt-0.5">{formatDate(detailGroup.roundStartDate)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="text-sm font-medium mt-0.5">{detailGroup.branch}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Treasurer</p>
                    <p className="text-sm font-medium mt-0.5">{detailGroup.treasurerName}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize mt-0.5">{detailGroup.status}</p>
                  </div>
                  <div className="rounded-lg border p-3 col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm font-medium mt-0.5">{detailGroup.description}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={() => {
                    setDetailGroup(null);
                    setActivePage('groups');
                  }}
                >
                  <Layers className="mr-1 h-4 w-4" />
                  Manage in Groups
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Payout Detail Dialog */}
      <Dialog open={!!detailPayout} onOpenChange={() => setDetailPayout(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>Complete payout information</DialogDescription>
          </DialogHeader>
          {detailPayout && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detailPayout.memberName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{detailPayout.memberName}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs capitalize ${getStatusColor(detailPayout.status)}`}>
                      {detailPayout.status}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CircleDollarSign className="h-3 w-3" />
                      {formatGHS(detailPayout.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatGHS(detailPayout.amount)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize mt-0.5">{detailPayout.status}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Group</p>
                  <p className="text-sm font-medium mt-0.5 truncate">{detailPayout.groupName}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Round</p>
                  <p className="text-sm font-medium mt-0.5">{detailPayout.round}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Payout Date</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(detailPayout.payoutDate)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="text-sm font-medium mt-0.5">{detailPayout.disbursementMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'}</p>
                </div>
                {detailPayout.momoNumber && (
                  <div className="rounded-lg border p-3 col-span-2">
                    <p className="text-xs text-muted-foreground">Disbursement Number</p>
                    <p className="text-sm font-medium mt-0.5">{detailPayout.momoNumber}</p>
                  </div>
                )}
                <div className="rounded-lg border p-3 col-span-2">
                  <p className="text-xs text-muted-foreground">Reference ID</p>
                  <p className="text-sm font-medium mt-0.5">{detailPayout.id}</p>
                </div>
              </div>

              {detailPayout.status === 'pending' && (
                <Button
                  className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    handleProcessPayout(detailPayout.id);
                    setDetailPayout(null);
                  }}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Process Payout
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
