'use client';

import { useState } from 'react';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor } from '@/lib/formatters';
import { susuGroups as allGroups } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PiggyBank, Users, Target, Plus, Clock, CheckCircle, AlertCircle, Calendar, ArrowRight, DollarSign, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { QuickActionsGrid } from '@/components/shared/mobile-components';

// ---- Animation variants ----
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ---- Frequency badge helper ----
function getFrequencyBadge(freq: string) {
  const map: Record<string, string> = {
    daily: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    weekly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    monthly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return map[freq] ?? 'bg-slate-100 text-slate-700';
}

function getFrequencyLabel(freq: string) {
  const map: Record<string, string> = { daily: 'day', weekly: 'week', monthly: 'month' };
  return map[freq] ?? freq;
}

// ============================================================
// Main Component
// ============================================================
export function CustomerSusu() {
  const {
    susuGroups: myGroups,
    savingsGoals,
    wallets,
    susuPayouts,
    makeContribution,
    createSavingsGoal,
    contributeToGoal,
  } = useCustomerStore();

  // ---- Derived state ----
  const myGroupIds = new Set(myGroups.map((g) => g.id));
  const discoverGroups = allGroups.filter((g) => !myGroupIds.has(g.id));
  const susuWallet = wallets.find((w) => w.type === 'susu');
  const activeGroups = myGroups.filter((g) => g.status === 'active');
  const nextPayout = susuPayouts.find((p) => p.status === 'pending');
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const onTrackGoals = savingsGoals.filter(
    (g) => (g.currentAmount / g.targetAmount) * 100 >= 50,
  );

  // ---- Dialog state ----
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [contributionAmount, setContributionAmount] = useState('');

  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState(false);
  const [addFundsGoalId, setAddFundsGoalId] = useState('');
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const [createGoalDialogOpen, setCreateGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
    contributionAmount: '',
    contributionFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    icon: '🎯',
  });

  // ---- Discover tab state ----
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverFilter, setDiscoverFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  const filteredDiscoverGroups = discoverGroups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(discoverSearch.toLowerCase()) ||
      g.description.toLowerCase().includes(discoverSearch.toLowerCase()) ||
      g.branch.toLowerCase().includes(discoverSearch.toLowerCase());
    const matchesFilter = discoverFilter === 'all' || g.frequency === discoverFilter;
    return matchesSearch && matchesFilter;
  });

  // ---- Handlers ----
  function handleContribute() {
    const amount = parseFloat(contributionAmount);
    if (!selectedGroupId || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    makeContribution(selectedGroupId, amount);
    toast.success('Contribution successful!', {
      description: `${formatGHS(amount)} has been contributed.`,
    });
    setContributeDialogOpen(false);
    setContributionAmount('');
    setSelectedGroupId('');
  }

  function openContributeDialog(groupId: string) {
    setSelectedGroupId(groupId);
    setContributionAmount('');
    setContributeDialogOpen(true);
  }

  function handleAddFunds() {
    const amount = parseFloat(addFundsAmount);
    if (!addFundsGoalId || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    contributeToGoal(addFundsGoalId, amount);
    toast.success('Funds added!', {
      description: `${formatGHS(amount)} has been added to your savings goal.`,
    });
    setAddFundsDialogOpen(false);
    setAddFundsAmount('');
    setAddFundsGoalId('');
  }

  function openAddFundsDialog(goalId: string) {
    setAddFundsGoalId(goalId);
    setAddFundsAmount('');
    setAddFundsDialogOpen(true);
  }

  function handleCreateGoal() {
    const { name, description, targetAmount, deadline, contributionAmount, contributionFrequency, icon } = newGoal;
    if (!name || !targetAmount || !deadline || !contributionAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    createSavingsGoal({
      name,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      deadline,
      icon,
      autoContribute: true,
      contributionAmount: parseFloat(contributionAmount),
      contributionFrequency,
    });
    toast.success('Goal created!', {
      description: `"${name}" savings goal has been created.`,
    });
    setCreateGoalDialogOpen(false);
    setNewGoal({
      name: '',
      description: '',
      targetAmount: '',
      deadline: '',
      contributionAmount: '',
      contributionFrequency: 'monthly',
      icon: '🎯',
    });
  }

  function handleJoinGroup(groupName: string) {
    toast.success('Request sent!', {
      description: `Request sent to join "${groupName}". You'll be notified once approved.`,
    });
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ==============================
          Page Header
          ============================== */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Susu Savings</h1>
          <p className="text-sm text-slate-500">
            Manage your susu groups, discover new ones, and track your savings goals.
          </p>
        </div>
      </motion.div>

      {/* ==============================
          Main Tabs
          ============================== */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="my-susu" className="space-y-6">
          <TabsList className="h-10 w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
            <TabsTrigger
              value="my-susu"
              className="w-full gap-1.5 rounded-md px-2 text-xs sm:w-auto sm:px-3 sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <PiggyBank className="h-3.5 w-3.5" />
              My Susu
            </TabsTrigger>
            <TabsTrigger
              value="discover"
              className="w-full gap-1.5 rounded-md px-2 text-xs sm:w-auto sm:px-3 sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Discover Groups
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="w-full gap-1.5 rounded-md px-2 text-xs sm:w-auto sm:px-3 sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Target className="h-3.5 w-3.5" />
              Savings Goals
            </TabsTrigger>
          </TabsList>

          {/* ==========================================
              TAB 1: My Susu
              ========================================== */}
          <TabsContent value="my-susu" className="space-y-6">
            {/* Summary Cards */}
            {/* Mobile: QuickActionsGrid for tap-friendly summary actions */}
            <div className="sm:hidden">
              <QuickActionsGrid
                columns={3}
                items={[
                  {
                    id: 'balance',
                    label: `${formatGHS(susuWallet?.balance ?? 0)}`,
                    icon: PiggyBank,
                    color: 'text-white',
                    bgColor: 'bg-emerald-500',
                    onClick: () => {},
                  },
                  {
                    id: 'groups',
                    label: `${activeGroups.length} Active`,
                    icon: Users,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100',
                    onClick: () => {},
                  },
                  {
                    id: 'payout',
                    label: nextPayout ? formatGHS(nextPayout.amount) : 'N/A',
                    icon: Gift,
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-100',
                    onClick: () => {},
                  },
                ]}
              />
            </div>
            {/* Desktop: Original grid */}
            <div className="hidden grid-cols-1 gap-4 sm:grid-cols-3 sm:grid">
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -2 }}
              >
                <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-900/10">
                  <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-5 py-5">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                    <div className="relative">
                      <p className="text-xs font-medium text-white/75">Susu Balance</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {formatGHS(susuWallet?.balance ?? 0)}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                        <PiggyBank className="h-3.5 w-3.5" />
                        <span>{myGroups.length} group{myGroups.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -2 }}
              >
                <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-start gap-4 p-5 h-full justify-between">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500">Active Groups</p>
                      <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                        {activeGroups.length}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        of {myGroups.length} total
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -2 }}
              >
                <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-start gap-4 p-5 h-full justify-between">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <Gift className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500">Next Payout</p>
                      <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                        {nextPayout ? formatGHS(nextPayout.amount) : 'N/A'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {nextPayout ? `${formatDate(nextPayout.payoutDate)} · ${nextPayout.groupName}` : 'No pending payouts'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* My Susu Groups List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">My Susu Groups</h2>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {myGroups.length} group{myGroups.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {myGroups.map((group, idx) => {
                  const progressPercent = Math.round(
                    (group.currentRound / group.totalRounds) * 100,
                  );
                  return (
                    <motion.div
                      key={group.id}
                      variants={itemVariants}
                      whileHover={{ y: -3, scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md mobile-card">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                                <Users className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="truncate text-sm font-semibold text-slate-900">
                                  {group.name}
                                </CardTitle>
                                <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                                  {group.description}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(group.status)} shrink-0 text-[10px] font-medium capitalize`}>
                              {group.status}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Contribution Amount */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-800">
                                {formatGHS(group.contributionAmount)}
                              </span>
                              <span className="text-xs text-slate-400">
                                / {getFrequencyLabel(group.frequency)}
                              </span>
                            </div>
                            <Badge className={`${getFrequencyBadge(group.frequency)} h-5 text-[10px] font-medium capitalize`}>
                              {group.frequency}
                            </Badge>
                          </div>

                          {/* Round Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-600">
                                Round {group.currentRound} of {group.totalRounds}
                              </span>
                              <span className="font-semibold text-emerald-600">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2 bg-slate-100" />
                          </div>

                          {/* Next Payout */}
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                            <Calendar className="h-4 w-4 shrink-0 text-amber-500" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Next Payout
                              </p>
                              <p className="text-xs font-medium text-slate-700">
                                {formatDate(group.nextPayout)} · {group.nextPayoutMember}
                              </p>
                            </div>
                          </div>

                          {/* Contribute Button */}
                          <Button
                            onClick={() => openContributeDialog(group.id)}
                            className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 h-11 min-h-[44px] lg:h-auto lg:min-h-0"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                            Contribute Now
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Contribution Dialog */}
            <Dialog open={contributeDialogOpen} onOpenChange={setContributeDialogOpen}>
              <DialogContent className="mx-4 sm:mx-0 sm:max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-emerald-600" />
                    Make Contribution
                  </DialogTitle>
                  <DialogDescription>
                    Contribute to your susu group. The amount will be deducted from your wallet.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="contribute-group">Susu Group</Label>
                    <Select
                      value={selectedGroupId}
                      onValueChange={setSelectedGroupId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {myGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} — {formatGHS(g.contributionAmount)}/{getFrequencyLabel(g.frequency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contribute-amount">Amount (₵)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                        ₵
                      </span>
                      <Input
                        id="contribute-amount"
                        type="number"
                        inputMode="numeric"
                        placeholder="0.00"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="pl-12"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {selectedGroupId && (
                      <p className="text-xs text-slate-400">
                        Suggested: {formatGHS(myGroups.find((g) => g.id === selectedGroupId)?.contributionAmount ?? 0)}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <DialogFooter className="flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setContributeDialogOpen(false)}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleContribute}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Confirm Contribution
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ==========================================
              TAB 2: Discover Groups
              ========================================== */}
          <TabsContent value="discover" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Join a Susu Group</h2>
                <p className="text-sm text-slate-500">
                  Find and join susu groups that match your savings goals.
                </p>
              </div>
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Search groups..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 overflow-x-auto overscroll-x-contain">
              {(['all', 'daily', 'weekly', 'monthly'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={discoverFilter === f ? 'default' : 'outline'}
                  onClick={() => setDiscoverFilter(f)}
                  className={`text-xs capitalize ${
                    discoverFilter === f
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {f === 'all' ? 'All' : f}
                </Button>
              ))}
            </div>

            {/* Groups Grid */}
            {filteredDiscoverGroups.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <AlertCircle className="h-7 w-7 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">No groups found</p>
                <p className="mt-1 text-xs text-slate-400">
                  Try adjusting your search or filter criteria.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDiscoverGroups.map((group) => {
                  const memberPercent = Math.round((group.members / group.maxMembers) * 100);
                  return (
                    <motion.div
                      key={group.id}
                      variants={itemVariants}
                      whileHover={{ y: -3, scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-3 mobile-list-item">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                              <Users className="h-5 w-5 text-violet-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="truncate text-sm font-semibold text-slate-900">
                                {group.name}
                              </CardTitle>
                              <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                                {group.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Key Info Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Total Pool
                              </p>
                              <p className="text-sm font-semibold text-slate-800">
                                {formatGHS(group.totalPool)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Contribution
                              </p>
                              <p className="text-sm font-semibold text-slate-800">
                                {formatGHS(group.contributionAmount)}/{getFrequencyLabel(group.frequency)}
                              </p>
                            </div>
                          </div>

                          {/* Frequency & Branch */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${getFrequencyBadge(group.frequency)} h-5 text-[10px] font-medium capitalize`}>
                              {group.frequency}
                            </Badge>
                            <span className="text-xs text-slate-500">{group.branch}</span>
                          </div>

                          {/* Member Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-slate-600">
                                <Users className="h-3.5 w-3.5" />
                                {group.members} / {group.maxMembers} members
                              </span>
                              <span className="font-medium text-emerald-600">
                                {group.maxMembers - group.members > 0
                                  ? `${group.maxMembers - group.members} spots left`
                                  : 'Full'}
                              </span>
                            </div>
                            <Progress value={memberPercent} className="h-2 bg-slate-100" />
                          </div>

                          {/* Join Button */}
                          <Button
                            onClick={() => handleJoinGroup(group.name)}
                            className="w-full gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                            Join Group
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ==========================================
              TAB 3: Savings Goals
              ========================================== */}
          <TabsContent value="goals" className="space-y-6">
            {/* Summary Card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
            >
              <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-900/10">
                <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-5 py-5 sm:px-8">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
                  <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/75">Total Saved</p>
                      <p className="mt-1 text-2xl font-bold text-white">{formatGHS(totalSaved)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">{savingsGoals.length}</p>
                        <p className="text-xs text-white/70">Goals</p>
                      </div>
                      <Separator orientation="vertical" className="h-8 bg-white/20" />
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">{onTrackGoals.length}</p>
                        <p className="text-xs text-white/70">On Track</p>
                      </div>
                      <Separator orientation="vertical" className="h-8 bg-white/20" />
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">
                          {savingsGoals.length - onTrackGoals.length}
                        </p>
                        <p className="text-xs text-white/70">Behind</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Create New Goal Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Your Goals</h2>
              <Dialog open={createGoalDialogOpen} onOpenChange={setCreateGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      Create Savings Goal
                    </DialogTitle>
                    <DialogDescription>
                      Set up a new savings goal to stay on track with your financial targets.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="goal-name">Goal Name *</Label>
                        <Input
                          id="goal-name"
                          placeholder="e.g. Shop Rent Fund"
                          value={newGoal.name}
                          onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="goal-desc">Description</Label>
                        <Input
                          id="goal-desc"
                          placeholder="What are you saving for?"
                          value={newGoal.description}
                          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal-target">Target Amount (₵) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₵</span>
                          <Input
                            id="goal-target"
                            type="number"
                            placeholder="0.00"
                            value={newGoal.targetAmount}
                            onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                            className="pl-12"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal-deadline">Deadline *</Label>
                        <Input
                          id="goal-deadline"
                          type="date"
                          value={newGoal.deadline}
                          onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal-contribution">Contribution Amount (₵) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₵</span>
                          <Input
                            id="goal-contribution"
                            type="number"
                            placeholder="0.00"
                            value={newGoal.contributionAmount}
                            onChange={(e) => setNewGoal({ ...newGoal, contributionAmount: e.target.value })}
                            className="pl-12"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal-freq">Frequency</Label>
                        <Select
                          value={newGoal.contributionFrequency}
                          onValueChange={(v) =>
                            setNewGoal({
                              ...newGoal,
                              contributionFrequency: v as 'daily' | 'weekly' | 'monthly',
                            })
                          }
                        >
                          <SelectTrigger id="goal-freq">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <DialogFooter className="flex-row gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setCreateGoalDialogOpen(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateGoal}
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
                    >
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                      Create Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Goals Grid */}
            {savingsGoals.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Target className="h-7 w-7 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">No savings goals yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Create your first savings goal to start tracking your progress.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savingsGoals.map((goal) => {
                  const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                  const isOnTrack = percent >= 50;
                  return (
                    <motion.div
                      key={goal.id}
                      variants={itemVariants}
                      whileHover={{ y: -3, scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
                                {goal.icon}
                              </span>
                              <div className="min-w-0">
                                <CardTitle className="truncate text-sm font-semibold text-slate-900">
                                  {goal.name}
                                </CardTitle>
                                <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                                  {goal.description}
                                </CardDescription>
                              </div>
                            </div>
                            {goal.autoContribute && (
                              <Badge className="shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">
                                <Clock className="mr-0.5 h-3 w-3" />
                                Auto
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-600">
                                {formatGHS(goal.currentAmount)} of {formatGHS(goal.targetAmount)}
                              </span>
                              <span className={`font-semibold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {percent}%
                              </span>
                            </div>
                            <Progress value={percent} className="h-2.5 bg-slate-100" />
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Deadline
                              </p>
                              <p className="flex items-center gap-1 text-xs font-medium text-slate-700">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {formatDate(goal.deadline)}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Contribution
                              </p>
                              <p className="flex items-center gap-1 text-xs font-medium text-slate-700">
                                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                                {formatGHS(goal.contributionAmount)}/{getFrequencyLabel(goal.contributionFrequency)}
                              </p>
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div className="flex items-center gap-1.5">
                            {isOnTrack ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-xs font-medium text-emerald-600">On Track</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-xs font-medium text-amber-600">Needs Attention</span>
                              </>
                            )}
                          </div>

                          <Separator />

                          {/* Add Funds Button */}
                          <Button
                            onClick={() => openAddFundsDialog(goal.id)}
                            className="w-full gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                            Add Funds
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ==============================
          Add Funds Dialog
          ============================== */}
      <Dialog open={addFundsDialogOpen} onOpenChange={setAddFundsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Add Funds to Goal
            </DialogTitle>
            <DialogDescription>
              Add money to your savings goal from your wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {addFundsGoalId && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Adding to</p>
                <p className="text-sm font-semibold text-slate-800">
                  {savingsGoals.find((g) => g.id === addFundsGoalId)?.icon}{' '}
                  {savingsGoals.find((g) => g.id === addFundsGoalId)?.name}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-funds-amount">Amount (₵)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  ₵
                </span>
                <Input
                  id="add-funds-amount"
                  type="number"
                  placeholder="0.00"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  className="pl-12"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setAddFundsDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFunds}
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
