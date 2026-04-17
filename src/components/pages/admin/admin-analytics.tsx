'use client';

import { useState } from 'react';
import { useAdminStore } from '@/store/app-store';
import { formatGHS, formatCompactNumber } from '@/lib/formatters';
import {
  monthlyRevenueData, loanPortfolioData, dailyCollectionData, kycStatusData, branches,
} from '@/lib/mock-data';
import { motion } from 'framer-motion';
import {
  DollarSign, Landmark, TrendingUp, Users, Download, FileText,
  Calendar, Building2, PieChart as PieIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const dateRanges = ['This Month', 'Last Month', 'Last 3 Months', 'This Year'];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export function AdminAnalytics() {
  const { stats } = useAdminStore();
  const [selectedRange, setSelectedRange] = useState('This Month');

  const handleExportPDF = () => toast.success('PDF report generated (mock)');
  const handleExportExcel = () => toast.success('Excel export started (mock)');

  const branchComparisonData = [...branches]
    .sort((a, b) => b.totalCustomers - a.totalCustomers)
    .map(b => ({ name: b.name, customers: b.totalCustomers, agents: b.totalAgents, groups: b.totalSusuGroups }));

  const keyMetrics = [
    { label: 'Total Revenue', value: formatGHS(stats.monthlyRevenue), change: '+12.5%', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Loan Portfolio', value: formatGHS(stats.totalLoansDisbursed), change: '+8.2%', icon: Landmark, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Collection Efficiency', value: '94.7%', change: '+2.1%', icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Customer Growth', value: `+${stats.monthlyGrowth}%`, change: 'this month', icon: Users, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with date range and export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">Platform performance overview</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-1 overflow-x-auto overscroll-x-contain">
            {dateRanges.map(range => (
              <Button key={range} size="sm" variant={selectedRange === range ? 'default' : 'outline'}
                className={`text-xs ${selectedRange === range ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                onClick={() => setSelectedRange(range)}>
                {range}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain">
            <Button size="sm" variant="outline" className="text-xs min-h-[44px] shrink-0" onClick={handleExportPDF}>
              <FileText className="mr-1 h-3 w-3" /> PDF Report
            </Button>
            <Button size="sm" variant="outline" className="text-xs min-h-[44px] shrink-0" onClick={handleExportExcel}>
              <Download className="mr-1 h-3 w-3" /> Excel Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {keyMetrics.map((m, i) => (
          <motion.div key={m.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.color}`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold">{m.value}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{m.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Trend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLoa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => formatCompactNumber(v)} className="text-xs" />
                  <Tooltip formatter={(value: number) => formatGHS(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="deposits" stroke="#3b82f6" fill="url(#colorDep)" strokeWidth={2} name="Deposits" />
                  <Area type="monotone" dataKey="loans" stroke="#f59e0b" fill="url(#colorLoa)" strokeWidth={2} name="Loans" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loan Portfolio + Collection Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Loan Portfolio */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Loan Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loanPortfolioData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(v) => formatCompactNumber(v)} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatGHS(value)} />
                    <Legend />
                    <Bar dataKey="disbursed" fill="#10b981" radius={[2, 2, 0, 0]} name="Disbursed" />
                    <Bar dataKey="repaid" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Repaid" />
                    <Bar dataKey="outstanding" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Outstanding" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Collection Performance */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Daily Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCollectionData.filter(d => d.day !== 'Sun')}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis tickFormatter={(v) => formatCompactNumber(v)} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatGHS(value)} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Amount Collected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Branch Comparison + KYC Completion */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch Comparison */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Branch Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={90} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="customers" fill="#10b981" radius={[0, 4, 4, 0]} name="Customers" />
                    <Bar dataKey="agents" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Agents" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* KYC Completion */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">KYC Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={kycStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="status">
                      {kycStatusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Regional Distribution */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {branches.map(branch => (
                <div key={branch.id} className="rounded-lg border p-3 lg:p-4 hover:bg-muted/50 transition-colors touch-manipulation">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{branch.name}</p>
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {branch.region}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{branch.totalCustomers}</p>
                      <p className="text-muted-foreground">Customers</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{branch.totalAgents}</p>
                      <p className="text-muted-foreground">Agents</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{branch.totalSusuGroups}</p>
                      <p className="text-muted-foreground">Groups</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Manager: {branch.manager}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
