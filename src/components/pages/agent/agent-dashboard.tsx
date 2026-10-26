'use client';

import { useState } from 'react';
import { useAgentStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import {
  Route, Users, BadgeDollarSign, DollarSign, Star, MapPin, Clock,
  ChevronRight, TrendingUp, CheckCircle, Play, Trophy, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { AgentCommission, CollectionRoute } from '@/lib/types';

const commissionTypeLabels: Record<AgentCommission['type'], string> = {
  susu_collection: 'Susu Collection',
  loan_referral: 'Loan Referral',
  new_customer: 'New Customer',
  milestone_bonus: 'Milestone Bonus',
};

const weeklyChartData = [
  { day: 'Mon', amount: 12500 },
  { day: 'Tue', amount: 11800 },
  { day: 'Wed', amount: 13200 },
  { day: 'Thu', amount: 12100 },
  { day: 'Fri', amount: 14500 },
  { day: 'Sat', amount: 8900 },
];

const chartConfig = {
  amount: { label: 'Collections (₵)', color: 'hsl(var(--chart-1))' },
};

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

export function AgentDashboard() {
  const { agent, collectionRoutes, commissions, allCustomers, setActivePage } = useAgentStore();

  const [detailCommission, setDetailCommission] = useState<AgentCommission | null>(null);
  const [detailRoute, setDetailRoute] = useState<CollectionRoute | null>(null);

  const todayRoutes = collectionRoutes.filter(
    (r) => r.status === 'in_progress' || r.status === 'partial'
  );
  const completedRoutes = collectionRoutes.filter((r) => r.status === 'completed');

  const todaysCollections = todayRoutes.reduce((sum, r) => sum + r.totalCollected, 0);
  const thisMonthCommissions = commissions
    .filter((c) => {
      const d = new Date(c.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const statsCards = [
    {
      title: "Today's Collections",
      value: formatGHS(todaysCollections),
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      page: 'collections' as const,
    },
    {
      title: 'Total Customers',
      value: allCustomers.length.toString(),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      page: 'customers' as const,
    },
    {
      title: "This Month's Commissions",
      value: formatGHS(thisMonthCommissions),
      icon: BadgeDollarSign,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      page: 'commissions' as const,
    },
    {
      title: 'Active Routes',
      value: todayRoutes.length.toString(),
      icon: Route,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      page: 'collections' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div {...fadeIn}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col gap-3 lg:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold sm:text-3xl">Hello, {agent.name}!</h1>
                <div className="flex flex-wrap items-center gap-3 text-emerald-100">
                  <Badge className="border-emerald-300 bg-emerald-500/40 text-white">
                    {agent.code}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={agent.rating} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{agent.territory}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-200" />
                <span className="text-sm text-emerald-100">
                  Last active: {formatDateTime(agent.lastActive)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row — every KPI opens its details page */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Routes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
              <Route className="h-5 w-5" />
              Today&apos;s Routes
            </h2>
            <span className="text-sm text-muted-foreground">
              {todayRoutes.length} active
            </span>
          </div>

          {todayRoutes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
                <p className="font-medium">All routes completed for today!</p>
                <p className="text-sm">Great work, {agent.name.split(' ')[0]}!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayRoutes.map((route, i) => {
                const progress =
                  route.totalExpected > 0
                    ? Math.round((route.totalCollected / route.totalExpected) * 100)
                    : 0;
                const collectedCount = route.customers.filter(
                  (c) => c.status === 'collected'
                ).length;

                return (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <Card
                      onClick={() => setDetailRoute(route)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setDetailRoute(route);
                        }
                      }}
                      aria-label={`Open ${route.name} route details`}
                      className="mobile-card cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all touch-manipulation"
                    >
                      <CardContent className="p-3 lg:p-4">
                        <div className="flex flex-col gap-3 lg:gap-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-sm lg:text-base">{route.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {route.area}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDate(route.date)}
                                </span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(route.status)}>
                              {route.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatGHS(route.totalCollected)} of {formatGHS(route.totalExpected)}
                              </span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2.5" />
                          </div>

                          {/* Customer count */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              <Users className="mr-1 inline h-4 w-4" />
                              {collectedCount}/{route.customerCount} customers collected
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[44px] lg:min-h-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePage('collections');
                                }}
                              >
                                <ChevronRight className="mr-1 h-4 w-4" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] lg:min-h-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePage('collections');
                                }}
                              >
                                <Play className="mr-1 h-4 w-4" />
                                Continue Collection
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Commission Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" />
            Commission Summary
          </h2>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">This Month&apos;s Earnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatGHS(paidCommissions)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatGHS(pendingCommissions)}
                  </span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold">{formatGHS(paidCommissions + pendingCommissions)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Recent Commissions</p>
                <div className="max-h-48 space-y-2 overflow-y-auto overscroll-contain">
                  {commissions.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setDetailCommission(c)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setDetailCommission(c);
                        }
                      }}
                      aria-label={`Open commission details: ${c.description}`}
                      className="mobile-list-item flex items-center justify-between rounded-lg border p-2.5 text-sm cursor-pointer hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(c.date)}</p>
                      </div>
                      <div className="ml-2 text-right">
                        <p className="font-semibold">{formatGHS(c.amount)}</p>
                        <Badge className={`text-[10px] ${getStatusColor(c.status)}`}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              This Month&apos;s Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 items-stretch">
              {/* Collection Rate */}
              <div className="flex flex-col gap-2 rounded-lg border p-3 h-full">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
                    <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">Collection Rate</span>
                </div>
                <span className="text-2xl font-bold">94.5%</span>
                <Progress value={94.5} className="h-1.5 [&>div]:bg-emerald-500" />
                <p className="text-xs text-muted-foreground">Above 90% target</p>
              </div>

              {/* Customer Retention */}
              <div className="flex flex-col gap-2 rounded-lg border p-3 h-full">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">Customer Retention</span>
                </div>
                <span className="text-2xl font-bold">96%</span>
                <Progress value={96} className="h-1.5 [&>div]:bg-emerald-500" />
                <p className="text-xs text-muted-foreground">Excellent retention</p>
              </div>

              {/* New Customers */}
              <div className="flex flex-col gap-2 rounded-lg border p-3 h-full">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">New Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">12</span>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300">
                    +3 this week
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Growing steadily</p>
              </div>

              {/* On-time Rate */}
              <div className="flex flex-col gap-2 rounded-lg border p-3 h-full">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-100 p-1.5 dark:bg-amber-900/30">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">On-time Rate</span>
                </div>
                <span className="text-2xl font-bold">91%</span>
                <Progress value={91} className="h-1.5 [&>div]:bg-amber-500" />
                <p className="text-xs text-muted-foreground">Room for improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Commission Detail Dialog */}
      <Dialog open={!!detailCommission} onOpenChange={() => setDetailCommission(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Commission Details</DialogTitle>
            <DialogDescription>Full details of this commission earning</DialogDescription>
          </DialogHeader>
          {detailCommission && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detailCommission.agentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{formatGHS(detailCommission.amount)}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs capitalize ${getStatusColor(detailCommission.status)}`}>
                      {detailCommission.status}
                    </Badge>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {commissionTypeLabels[detailCommission.type]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm font-medium mt-0.5">{detailCommission.description}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatGHS(detailCommission.amount)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(detailCommission.date)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize mt-0.5">{detailCommission.status}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium mt-0.5">{commissionTypeLabels[detailCommission.type]}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Reference ID</p>
                  <p className="text-sm font-medium mt-0.5">{detailCommission.id}</p>
                </div>
                {detailCommission.paidDate && (
                  <div className="rounded-lg border p-3 col-span-2">
                    <p className="text-xs text-muted-foreground">Paid Date</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{formatDate(detailCommission.paidDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Route Detail Dialog */}
      <Dialog open={!!detailRoute} onOpenChange={() => setDetailRoute(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Route Details</DialogTitle>
            <DialogDescription>Collection route summary and progress</DialogDescription>
          </DialogHeader>
          {detailRoute && (() => {
            const routeProgress =
              detailRoute.totalExpected > 0
                ? Math.round((detailRoute.totalCollected / detailRoute.totalExpected) * 100)
                : 0;
            const collectedCustomers = detailRoute.customers.filter((c) => c.status === 'collected').length;
            return (
              <div className="space-y-4">
                {/* Identity header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                      {getInitials(detailRoute.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">{detailRoute.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs capitalize ${getStatusColor(detailRoute.status)}`}>
                        {detailRoute.status.replace('_', ' ')}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {detailRoute.area}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Collection Progress</span>
                    <span className="font-bold">{routeProgress}%</span>
                  </div>
                  <Progress value={routeProgress} className="h-2.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Collected: {formatGHS(detailRoute.totalCollected)}</span>
                    <span>Expected: {formatGHS(detailRoute.totalExpected)}</span>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Area</p>
                    <p className="text-sm font-medium mt-0.5">{detailRoute.area}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium mt-0.5">{formatDate(detailRoute.date)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Customers Assigned</p>
                    <p className="text-sm font-medium mt-0.5">{detailRoute.customerCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Customers Collected</p>
                    <p className="text-sm font-medium mt-0.5">{collectedCustomers}/{detailRoute.customerCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Expected Amount</p>
                    <p className="text-sm font-medium mt-0.5">{formatGHS(detailRoute.totalExpected)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Collected Amount</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatGHS(detailRoute.totalCollected)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize mt-0.5">{detailRoute.status.replace('_', ' ')}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Reference ID</p>
                    <p className="text-sm font-medium mt-0.5">{detailRoute.id}</p>
                  </div>
                </div>

                <Button
                  className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    setDetailRoute(null);
                    setActivePage('collections');
                  }}
                >
                  <Play className="mr-1 h-4 w-4" />
                  Open in Collections
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Collection Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Completed Routes (collapsed) */}
      {completedRoutes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="mb-3 text-base lg:text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Completed Routes
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {completedRoutes.map((route) => (
              <Card key={route.id} className="mobile-card touch-manipulation">
                <CardContent className="p-3 lg:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{route.name}</p>
                      <p className="text-sm text-muted-foreground">{route.area}</p>
                    </div>
                    <Badge className={getStatusColor(route.status)}>completed</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
