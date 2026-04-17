'use client';

import { useState } from 'react';
import { useTreasurerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, PiggyBank, Wallet, Clock, Shield, ArrowRight,
  TrendingUp, CalendarCheck, CircleDollarSign, BarChart3,
  Building2, ChevronRight, Play, CheckCircle, Layers,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export function TreasurerDashboard() {
  const { user, managedGroups, allContributions, payouts, allMembers, processPayout, setActivePage } = useTreasurerStore();

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
    },
    {
      title: 'Total Pool Value',
      value: formatGHS(totalPoolValue),
      icon: Wallet,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: 'Members Under Management',
      value: totalMembers.toString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Pending Payouts',
      value: pendingPayouts.length.toString(),
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Group Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Group Summary
            </h2>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActivePage('groups')}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
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
            <CardContent className="p-4">
              {pendingPayouts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium">All payouts processed!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayouts.map((payout) => (
                    <div key={payout.id} className="rounded-lg border p-3 space-y-2">
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
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleProcessPayout(payout.id)}
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
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
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
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Collection Status by Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {managedGroups.filter(g => g.status === 'active').map((group) => {
              const collection = getGroupCollectionProgress(group.id, group.members);
              const progress = collection.total > 0 ? Math.round((collection.paid / collection.total) * 100) : 0;

              return (
                <div key={group.id} className="space-y-2">
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
    </div>
  );
}
