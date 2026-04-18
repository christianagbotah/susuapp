'use client';

import { useState, useMemo } from 'react';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor } from '@/lib/formatters';
import type { Referral } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Gift, Users, Clock, CheckCircle2, AlertCircle, Copy, Check,
  MessageCircle, Phone, Share2, UserPlus, Trophy, Star,
  PartyPopper, Filter, ArrowUpRight, Search, Zap, Heart,
  Shield, Megaphone, Smartphone,
} from 'lucide-react';

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

// ---- Mock Referrals Data ----
const mockReferrals: Referral[] = [
  {
    id: 'ref-001', referrerId: 'usr-001', referrerName: 'Ama Mensah',
    referredName: 'Kwame Adjei', referredPhone: '0245566778',
    status: 'rewarded', rewardAmount: 50, rewardStatus: 'paid',
    date: '2026-03-15', registeredDate: '2026-03-16',
  },
  {
    id: 'ref-002', referrerId: 'usr-001', referrerName: 'Ama Mensah',
    referredName: 'Akosua Boateng', referredPhone: '0206677889',
    status: 'rewarded', rewardAmount: 50, rewardStatus: 'paid',
    date: '2026-03-20', registeredDate: '2026-03-21',
  },
  {
    id: 'ref-003', referrerId: 'usr-001', referrerName: 'Ama Mensah',
    referredName: 'Kojo Annan', referredPhone: '0277788990',
    status: 'active', rewardAmount: 50, rewardStatus: 'pending',
    date: '2026-04-05', registeredDate: '2026-04-07',
  },
  {
    id: 'ref-004', referrerId: 'usr-001', referrerName: 'Ama Mensah',
    referredName: 'Yaa Mensah', referredPhone: '0508899001',
    status: 'registered', rewardAmount: 50, rewardStatus: 'pending',
    date: '2026-04-12', registeredDate: '2026-04-14',
  },
  {
    id: 'ref-005', referrerId: 'usr-001', referrerName: 'Ama Mensah',
    referredName: 'Kwabena Osei', referredPhone: '0239900112',
    status: 'pending', rewardAmount: 50, rewardStatus: 'pending',
    date: '2026-04-17',
  },
  {
    id: 'ref-006', referrerId: 'usr-001', referrerName: 'Ama Mensah',
    referredName: 'Abena Nyarko', referredPhone: '0260011223',
    status: 'pending', rewardAmount: 50, rewardStatus: 'pending',
    date: '2026-04-18',
  },
];

// ---- Referral Code ----
const REFERRAL_CODE = 'AMA-SUSU-2026';

// ---- Helper: Referral status ----
function getReferralStatusConfig(status: string) {
  switch (status) {
    case 'rewarded':
      return {
        label: 'Rewarded',
        icon: Trophy,
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      };
    case 'active':
      return {
        label: 'Active',
        icon: CheckCircle2,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      };
    case 'registered':
      return {
        label: 'Registered',
        icon: UserPlus,
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'pending':
      return {
        label: 'Pending',
        icon: Clock,
        color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      };
    default:
      return {
        label: status,
        icon: Clock,
        color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      };
  }
}

function getRewardStatusConfig(status: string) {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      };
    case 'pending':
      return {
        label: 'Pending',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
    default:
      return {
        label: status,
        color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      };
  }
}

// ============================================================
// Main Component
// ============================================================
export function CustomerReferrals() {
  const { user } = useCustomerStore();

  // ---- Computed stats ----
  const totalReferrals = mockReferrals.length;
  const successfulReferrals = mockReferrals.filter((r) => r.status === 'rewarded' || r.status === 'active').length;
  const pendingRewards = mockReferrals.filter((r) => r.rewardStatus === 'pending' && (r.status === 'active' || r.status === 'registered')).length;
  const totalEarned = mockReferrals
    .filter((r) => r.rewardStatus === 'paid')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  // ---- Copy referral code ----
  const [copied, setCopied] = useState(false);

  function handleCopyCode() {
    navigator.clipboard.writeText(REFERRAL_CODE).then(() => {
      setCopied(true);
      toast.success('Referral code copied!', {
        description: `${REFERRAL_CODE} has been copied to your clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.success('Referral code copied!', {
        description: REFERRAL_CODE,
      });
    });
  }

  // ---- Share handlers ----
  function handleShareSMS() {
    toast.success('SMS invite sent!', {
      description: 'Your referral SMS has been queued for delivery.',
    });
  }

  function handleShareWhatsApp() {
    toast.success('WhatsApp message prepared!', {
      description: 'Your referral link has been copied. Open WhatsApp to share it.',
    });
  }

  // ---- Quick invite ----
  const [invitePhone, setInvitePhone] = useState('');

  function handleQuickInvite() {
    if (!invitePhone || invitePhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    toast.success('Invitation sent!', {
      description: `Your referral invite has been sent to 0${invitePhone.slice(1)}.`,
    });
    setInvitePhone('');
  }

  // ---- History filter state ----
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReferrals = useMemo(() => {
    return mockReferrals.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = r.referredName.toLowerCase().includes(q)
          || r.referredPhone.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [statusFilter, searchQuery]);

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || searchQuery !== '';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 sm:p-6"
    >
      {/* ==============================
          Page Header
          ============================== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refer & Earn</h1>
          <p className="text-sm text-muted-foreground">
            Share iSusuPro with friends and earn rewards
          </p>
        </div>
        <Badge className="mt-2 w-fit bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 sm:mt-0">
          {totalEarned > 0 ? `₵${totalEarned} Earned` : 'Start Referring'}
        </Badge>
      </motion.div>

      {/* ==============================
          Hero Banner Card
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-lg shadow-amber-900/10">
          <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 py-8 sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute right-10 bottom-10 opacity-20">
              <Gift className="h-32 w-32 text-white" />
            </div>

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PartyPopper className="h-6 w-6 text-white" />
                  <span className="text-sm font-semibold text-white/90">Referral Program</span>
                </div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Earn ₵50 for Every Friend You Refer!
                </h2>
                <p className="max-w-md text-sm text-white/80 leading-relaxed">
                  Share your unique referral code with friends and family. When they sign up and
                  make their first susu contribution, you both earn ₵50 credited to your wallet.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                    <Zap className="h-3.5 w-3.5 text-amber-200" />
                    <span className="text-xs font-semibold text-white">₵50 per referral</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                    <Users className="h-3.5 w-3.5 text-amber-200" />
                    <span className="text-xs font-semibold text-white">Unlimited referrals</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                    <Star className="h-3.5 w-3.5 text-amber-200" />
                    <span className="text-xs font-semibold text-white">No expiration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ==============================
          Stats Cards
          ============================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Referrals */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Referrals</p>
                  <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Successful */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Successful</p>
                  <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{successfulReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Rewards */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pending Rewards</p>
                  <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{pendingRewards}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Earned */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
                  <Trophy className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Earned</p>
                  <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{formatGHS(totalEarned)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ==============================
          Referral Code Card
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Your Referral Code</p>
                  <p className="text-xs text-muted-foreground">Share this code with your friends to earn rewards</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5">
                  <span className="font-mono text-lg font-bold tracking-wider text-amber-700 dark:text-amber-400">
                    {REFERRAL_CODE}
                  </span>
                </div>
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  size="sm"
                  className={`min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 ${
                    copied
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="hidden sm:inline ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==============================
          Tabs Container
          ============================== */}
      <Tabs defaultValue="referrals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[360px]">
          <TabsTrigger value="referrals" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            My Referrals
          </TabsTrigger>
          <TabsTrigger value="invite" className="gap-1.5 text-xs sm:text-sm">
            <Megaphone className="h-4 w-4" />
            Invite
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            MY REFERRALS TAB
            ========================================== */}
        <TabsContent value="referrals" className="space-y-6">
          {/* Filter Bar */}
          <motion.div variants={itemVariants}>
            <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 min-h-[44px] lg:min-h-0"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto overscroll-x-contain flex-nowrap">
                    <div className="flex gap-1">
                      {['all', 'pending', 'registered', 'active', 'rewarded'].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                          className={`text-xs capitalize min-h-[36px] lg:min-h-0 ${
                            statusFilter === status
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'hover:border-emerald-300 hover:text-emerald-700 dark:hover:border-emerald-600 dark:hover:text-emerald-400'
                          }`}
                        >
                          {status === 'all' ? 'All' : status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary bar */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing <span className="font-medium text-foreground">{filteredReferrals.length}</span> referral{filteredReferrals.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-auto py-1 px-2 text-xs">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto overscroll-contain">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[130px]">Phone</TableHead>
                      <TableHead className="w-[120px]">Date Referred</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[110px]">Reward</TableHead>
                      <TableHead className="w-[110px]">Reward Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Users className="h-10 w-10" />
                            <p className="text-lg font-medium">No referrals yet</p>
                            <p className="text-sm">
                              {hasActiveFilters
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Share your referral code with friends to start earning ₵50 per referral!'}
                            </p>
                            {hasActiveFilters && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilters}
                                className="mt-1"
                              >
                                Clear Filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferrals.map((referral) => {
                        const statusConfig = getReferralStatusConfig(referral.status);
                        const rewardConfig = getRewardStatusConfig(referral.rewardStatus);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <TableRow key={referral.id} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                                  referral.status === 'rewarded' || referral.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : referral.status === 'registered'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {referral.referredName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <span className="font-medium">{referral.referredName}</span>
                                  {referral.registeredDate && (
                                    <p className="text-xs text-muted-foreground">
                                      Joined {formatDate(referral.registeredDate)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {referral.referredPhone}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatDate(referral.date)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-xs capitalize ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatGHS(referral.rewardAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-xs capitalize ${rewardConfig.color}`}
                              >
                                {rewardConfig.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filteredReferrals.length === 0 ? (
              <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                  <Users className="h-10 w-10" />
                  <p className="text-lg font-medium">No referrals yet</p>
                  <p className="text-sm">
                    {hasActiveFilters
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Share your referral code with friends to start earning ₵50 per referral!'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredReferrals.map((referral) => {
                const statusConfig = getReferralStatusConfig(referral.status);
                const rewardConfig = getRewardStatusConfig(referral.rewardStatus);
                return (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 min-h-[60px]">
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            referral.status === 'rewarded' || referral.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : referral.status === 'registered'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {referral.referredName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate text-slate-900 dark:text-slate-100">{referral.referredName}</p>
                              <span className="font-semibold tabular-nums whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                                +{formatGHS(referral.rewardAmount)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{referral.referredPhone}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] capitalize px-1.5 py-0 ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                Referred {formatDate(referral.date)}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] capitalize px-1.5 py-0 ${rewardConfig.color}`}
                              >
                                Reward: {rewardConfig.label}
                              </Badge>
                            </div>
                            {referral.registeredDate && (
                              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded px-2 py-1">
                                Registered on {formatDate(referral.registeredDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ==========================================
            INVITE TAB
            ========================================== */}
        <TabsContent value="invite" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Share via channels */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Share Your Referral Code</CardTitle>
                  <CardDescription>
                    Use any channel below to invite your friends and family
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* WhatsApp */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center gap-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 transition-all touch-manipulation min-h-[44px] lg:min-h-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shrink-0">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">WhatsApp</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Send via WhatsApp message</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                  </motion.button>

                  {/* SMS */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShareSMS}
                    className="w-full flex items-center gap-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 transition-all touch-manipulation min-h-[44px] lg:min-h-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 shrink-0">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">SMS</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Send via text message</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-blue-400" />
                  </motion.button>

                  {/* Copy Code */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyCode}
                    className="w-full flex items-center gap-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 transition-all touch-manipulation min-h-[44px] lg:min-h-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 shrink-0">
                      <Copy className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Copy Code</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Copy & paste anywhere</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-amber-400" />
                  </motion.button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Invite Form */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-500" />
                    <div>
                      <CardTitle className="text-base">Quick Invite</CardTitle>
                      <CardDescription>Enter a friend&apos;s number to send an invite directly</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="invite-phone">Friend&apos;s Phone Number</Label>
                    <div className="flex items-stretch gap-2">
                      <div className="flex items-center rounded-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                        +233
                      </div>
                      <Input
                        id="invite-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="e.g. 0241234567"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="min-h-[44px] lg:min-h-0"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Invite Button */}
                  <Button
                    onClick={handleQuickInvite}
                    className="w-full h-12 min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-700"
                    size="lg"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invite
                  </Button>

                  {/* Referral preview message */}
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Invite message preview:</p>
                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        🎉 Hey! Join me on <span className="font-semibold">iSusuPro</span> and start saving smartly with Susu groups. 
                        Use my referral code <span className="font-bold text-emerald-600 dark:text-emerald-400">{REFERRAL_CODE}</span> 
                        and we&apos;ll both earn <span className="font-bold">₵50</span>! 🎁
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* How It Works */}
          <motion.div variants={itemVariants}>
            <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">How It Works</CardTitle>
                <CardDescription>Simple steps to start earning referral rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Share Your Code</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Send your unique referral code to friends and family via SMS, WhatsApp, or any channel.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Friend Signs Up</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Your friend downloads iSusuPro, signs up with your code, and completes KYC verification.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Both Earn ₵50</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Once your friend makes their first susu contribution, ₵50 is credited to both of your wallets!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Program Terms */}
          <motion.div variants={itemVariants}>
            <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Program Terms</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Referral rewards are credited within 24 hours of the referred user&apos;s first susu contribution. 
                    Both the referrer and referee receive ₵50 each. There is no limit on the number of referrals. 
                    Referral codes do not expire. Rewards are non-transferable and will be credited to your main wallet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
