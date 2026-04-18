'use client';

import { useState, useMemo } from 'react';
import { useAdminExtendedStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor } from '@/lib/formatters';
import { motion } from 'framer-motion';
import {
  Landmark, Clock, Users, CalendarClock, AlertCircle,
  FileText, Plus, Eye, Info, Shield, TrendingUp,
  Building2, Receipt, CheckCircle2, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import type { SSNITFiling } from '@/lib/types';

// ---- Status helpers ----
const filingStatusVariant: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const contributionStatusVariant: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const chartConfig = {
  employee: { label: 'Employee Contributions', color: 'hsl(var(--chart-2))' },
  employer: { label: 'Employer Contributions', color: 'hsl(var(--chart-1))' },
};

export function AdminSSNIT() {
  const { ssnitContributions, ssnitFilings, createSSNITFiling } = useAdminExtendedStore();
  const [activeTab, setActiveTab] = useState('filings');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [receiptFiling, setReceiptFiling] = useState<SSNITFiling | null>(null);

  // ---- Computed values ----
  const totalYTD = useMemo(
    () => ssnitFilings.filter((f) => f.status === 'paid').reduce((s, f) => s + f.grandTotal, 0),
    [ssnitFilings],
  );

  const pendingCount = useMemo(
    () => ssnitFilings.filter((f) => f.status === 'submitted' || f.status === 'draft').length,
    [ssnitFilings],
  );

  const activeEmployees = useMemo(() => {
    const latestPeriod = ssnitContributions.length > 0
      ? ssnitContributions.reduce((a, b) => (a.period > b.period ? a : b)).period
      : '';
    return latestPeriod
      ? ssnitContributions.filter((c) => c.period === latestPeriod).length
      : 0;
  }, [ssnitContributions]);

  const nextFilingDue = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const deadline = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 14);
    const diffMs = deadline.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { date: deadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), days };
  }, []);

  // ---- Unique periods for filter ----
  const periods = useMemo(() => {
    const set = new Set(ssnitContributions.map((c) => c.period));
    return ['all', ...Array.from(set).sort().reverse()];
  }, [ssnitContributions]);

  const filteredContributions = useMemo(
    () => periodFilter === 'all' ? ssnitContributions : ssnitContributions.filter((c) => c.period === periodFilter),
    [ssnitContributions, periodFilter],
  );

  const contributionTotals = useMemo(
    () => ({
      basicSalary: filteredContributions.reduce((s, c) => s + c.basicSalary, 0),
      employeeContribution: filteredContributions.reduce((s, c) => s + c.employeeContribution, 0),
      employerContribution: filteredContributions.reduce((s, c) => s + c.employerContribution, 0),
      tier2Employer: filteredContributions.reduce((s, c) => s + c.tier2Employer, 0),
      totalContribution: filteredContributions.reduce((s, c) => s + c.totalContribution, 0),
    }),
    [filteredContributions],
  );

  // ---- Chart data ----
  const chartData = useMemo(() => {
    const periodMap = new Map<string, { employee: number; employer: number }>();
    for (const c of ssnitContributions) {
      const existing = periodMap.get(c.period) || { employee: 0, employer: 0 };
      existing.employee += c.employeeContribution;
      existing.employer += c.employerContribution;
      periodMap.set(c.period, existing);
    }
    return Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => ({ period: period.replace(' 20', '\n20'), ...vals }));
  }, [ssnitContributions]);

  // ---- Handlers ----
  const handleNewFiling = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();
    const period = `${monthName} ${year}`;
    const alreadyExists = ssnitFilings.some(
      (f) => f.period.toLowerCase() === period.toLowerCase(),
    );
    if (alreadyExists) {
      toast.warning(`A filing for ${period} already exists`);
      return;
    }
    createSSNITFiling(period);
    toast.success(`Draft filing created for ${period}`);
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">SSNIT Payments</h1>
        <p className="text-muted-foreground mt-1">
          Manage Social Security and National Insurance Trust contributions and filings
        </p>
      </div>

      {/* ========== Summary Stats ========== */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total Contributions YTD',
            value: formatGHS(totalYTD),
            icon: TrendingUp,
            color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
          },
          {
            label: 'Pending Filings',
            value: pendingCount,
            icon: Clock,
            color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
          },
          {
            label: 'Active Employees',
            value: activeEmployees,
            icon: Users,
            color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
          },
          {
            label: 'Next Filing Due',
            value: `${nextFilingDue.days} days`,
            subtitle: nextFilingDue.date,
            icon: CalendarClock,
            color: nextFilingDue.days <= 3
              ? 'text-red-600 bg-red-100 dark:bg-red-900/30'
              : 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="mobile-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-xl font-bold leading-tight">{stat.value}</p>
                  {'subtitle' in stat && (
                    <p className="text-[10px] text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ========== Info Banner ========== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2 shrink-0">
              <Info className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">SSNIT Rates</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-amber-700 dark:text-amber-300">
              <span><strong>Employee:</strong> 5.5%</span>
              <span><strong>Employer:</strong> 13.5% <span className="text-xs">(11% Pension + 2.5% NHIS)</span></span>
              <span><strong>Tier 2 (Occupational):</strong> 5% <span className="text-xs">(Employer)</span></span>
            </div>
            <div className="sm:ml-auto shrink-0">
              <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                <Shield className="mr-1 h-3 w-3" />
                3-Tier Pension
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ========== Tabs ========== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="filings" className="gap-1.5">
              <FileText className="h-4 w-4" /> Filings
            </TabsTrigger>
            <TabsTrigger value="contributions" className="gap-1.5">
              <Users className="h-4 w-4" /> Contributions
            </TabsTrigger>
            <TabsTrigger value="rates" className="gap-1.5">
              <Info className="h-4 w-4" /> Rates & Info
            </TabsTrigger>
          </TabsList>

          {/* ===== FILINGS TAB ===== */}
          <TabsContent value="filings" className="mt-4 space-y-4">
            {/* New Filing Button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{ssnitFilings.length} filings total</p>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handleNewFiling}>
                <Plus className="h-4 w-4" /> New Filing
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Employees</TableHead>
                        <TableHead className="text-right">Employee Contrib.</TableHead>
                        <TableHead className="text-right">Employer Contrib.</TableHead>
                        <TableHead className="text-right">Tier 2</TableHead>
                        <TableHead className="text-right">Grand Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ssnitFilings.map((filing) => (
                        <TableRow key={filing.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{filing.period}</TableCell>
                          <TableCell className="text-right">{filing.totalEmployees}</TableCell>
                          <TableCell className="text-right">{formatGHS(filing.totalEmployeeContributions)}</TableCell>
                          <TableCell className="text-right">{formatGHS(filing.totalEmployerContributions)}</TableCell>
                          <TableCell className="text-right">{formatGHS(filing.totalTier2)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatGHS(filing.grandTotal)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs capitalize ${filingStatusVariant[filing.status] || ''}`}>
                              {filing.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{filing.reference}</TableCell>
                          <TableCell className="text-right">
                            {filing.status === 'paid' && filing.ssnitReceiptNumber && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => setReceiptFiling(filing)}
                              >
                                <Receipt className="mr-1 h-3 w-3" /> View Receipt
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y">
                  {ssnitFilings.map((filing) => (
                    <div key={filing.id} className="mobile-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{filing.period}</p>
                          <p className="text-xs text-muted-foreground font-mono">{filing.reference}</p>
                        </div>
                        <Badge variant="secondary" className={`text-xs capitalize ${filingStatusVariant[filing.status] || ''}`}>
                          {filing.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Employees: </span>
                          <span className="font-medium">{filing.totalEmployees}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Employee: </span>
                          <span>{formatGHS(filing.totalEmployeeContributions)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Employer: </span>
                          <span>{formatGHS(filing.totalEmployerContributions)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tier 2: </span>
                          <span>{formatGHS(filing.totalTier2)}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Grand Total</span>
                        <span className="text-lg font-bold">{formatGHS(filing.grandTotal)}</span>
                      </div>
                      {filing.status === 'paid' && filing.ssnitReceiptNumber && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-9 text-xs min-h-[44px] lg:min-h-0"
                          onClick={() => setReceiptFiling(filing)}
                        >
                          <Receipt className="mr-1 h-3 w-3" /> View Receipt
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Contribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Monthly Contribution Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="employee" fill="var(--color-employee)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="employer" fill="var(--color-employer)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CONTRIBUTIONS TAB ===== */}
          <TabsContent value="contributions" className="mt-4 space-y-4">
            {/* Period Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{filteredContributions.length} contributions</p>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === 'all' ? 'All Periods' : p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>SSNIT Number</TableHead>
                        <TableHead className="text-right">Basic Salary</TableHead>
                        <TableHead className="text-right">Employee (5.5%)</TableHead>
                        <TableHead className="text-right">Employer (13.5%)</TableHead>
                        <TableHead className="text-right">Tier 2 (5%)</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContributions.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{c.employeeName}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{c.ssnitNumber}</TableCell>
                          <TableCell className="text-right">{formatGHS(c.basicSalary)}</TableCell>
                          <TableCell className="text-right">{formatGHS(c.employeeContribution)}</TableCell>
                          <TableCell className="text-right">{formatGHS(c.employerContribution)}</TableCell>
                          <TableCell className="text-right">{formatGHS(c.tier2Employer)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatGHS(c.totalContribution)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs capitalize ${contributionStatusVariant[c.status] || ''}`}>
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">{formatGHS(contributionTotals.basicSalary)}</TableCell>
                        <TableCell className="text-right">{formatGHS(contributionTotals.employeeContribution)}</TableCell>
                        <TableCell className="text-right">{formatGHS(contributionTotals.employerContribution)}</TableCell>
                        <TableCell className="text-right">{formatGHS(contributionTotals.tier2Employer)}</TableCell>
                        <TableCell className="text-right">{formatGHS(contributionTotals.totalContribution)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y">
                  {filteredContributions.map((c) => (
                    <div key={c.id} className="mobile-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{c.employeeName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.ssnitNumber}</p>
                        </div>
                        <Badge variant="secondary" className={`text-xs capitalize ${contributionStatusVariant[c.status] || ''}`}>
                          {c.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Basic Salary: </span>
                          <span className="font-medium">{formatGHS(c.basicSalary)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Period: </span>
                          <span>{c.period}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Employee 5.5%</p>
                          <p className="font-semibold">{formatGHS(c.employeeContribution)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Employer 13.5%</p>
                          <p className="font-semibold">{formatGHS(c.employerContribution)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Tier 2 5%</p>
                          <p className="font-semibold">{formatGHS(c.tier2Employer)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-sm text-muted-foreground">Total Contribution</span>
                        <span className="text-lg font-bold">{formatGHS(c.totalContribution)}</span>
                      </div>
                    </div>
                  ))}
                  {/* Mobile Totals */}
                  <div className="p-4 bg-muted/50 space-y-2">
                    <p className="text-sm font-semibold">Period Totals</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">Employee</p>
                        <p className="font-semibold">{formatGHS(contributionTotals.employeeContribution)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">Employer</p>
                        <p className="font-semibold">{formatGHS(contributionTotals.employerContribution)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">Tier 2</p>
                        <p className="font-semibold">{formatGHS(contributionTotals.tier2Employer)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-medium">Grand Total</span>
                      <span className="text-lg font-bold">{formatGHS(contributionTotals.totalContribution)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== RATES & INFO TAB ===== */}
          <TabsContent value="rates" className="mt-4 space-y-4">
            {/* 3-Tier Pension System */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ghana&apos;s 3-Tier Pension System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tier 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Tier 1 — Basic National Social Security</h3>
                      <p className="text-sm text-muted-foreground">Managed by SSNIT (Social Security and National Insurance Trust)</p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 ml-[52px]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Employee Contribution</Label>
                          <span className="font-bold text-emerald-600">5.5%</span>
                        </div>
                        <Progress value={5.5} max={24} className="h-2" />
                        <p className="text-xs text-muted-foreground">Deducted from gross salary</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Employer Contribution</Label>
                          <span className="font-bold text-emerald-600">13.5%</span>
                        </div>
                        <Progress value={13.5} max={24} className="h-2" />
                        <p className="text-xs text-muted-foreground">11% Pension + 2.5% NHIS</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm">
                      <p className="font-medium text-emerald-800 dark:text-emerald-300">
                        Total Tier 1: <span className="font-bold">19%</span> of assessable income
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tier 2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Tier 2 — Occupational Pension Scheme</h3>
                      <p className="text-sm text-muted-foreground">Mandatory employer-funded occupational pension</p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 ml-[52px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Employer Contribution</Label>
                        <p className="text-xs text-muted-foreground">Paid by employer on behalf of employee</p>
                      </div>
                      <span className="font-bold text-blue-600 text-lg">5%</span>
                    </div>
                    <Progress value={5} max={24} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Managed by approved occupational pension trustees
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Tier 3 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Tier 3 — Voluntary Provident Fund</h3>
                      <p className="text-sm text-muted-foreground">Optional additional retirement savings (tax-exempt up to 16.5% of income)</p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 ml-[52px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Voluntary Contribution</Label>
                        <p className="text-xs text-muted-foreground">Employee and/or employer</p>
                      </div>
                      <span className="font-bold text-purple-600 text-lg">Variable</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Fully tax-exempt up to 16.5% of assessable income. Managed by approved trustees.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contribution Limits & Deadlines */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Contribution Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Maximum Monthly Contribution</span>
                      <span className="font-bold">{formatGHS(7020)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Minimum Monthly Contribution</span>
                      <span className="font-bold">{formatGHS(66.16)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Assessable Income Cap</span>
                      <span className="font-bold">{formatGHS(37200)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Filing Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Monthly Filing Deadline</p>
                        <p className="text-sm text-muted-foreground">14 days after the end of each month</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Payment Method</p>
                        <p className="text-sm text-muted-foreground">Bank transfer or direct payment via SSNIT portal</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-red-100 text-red-700 flex items-center justify-center dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Late Payment Penalty</p>
                        <p className="text-sm text-muted-foreground">3% per month on outstanding contributions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rate Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  SSNIT Contribution Rate Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead className="text-right">Employee %</TableHead>
                        <TableHead className="text-right">Employer %</TableHead>
                        <TableHead className="text-right">Total %</TableHead>
                        <TableHead>Managed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="font-semibold text-sm">
                          Tier 1 — SSNIT (Basic National Social Security)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell />
                        <TableCell>Pension Fund</TableCell>
                        <TableCell className="text-right font-medium">5.5%</TableCell>
                        <TableCell className="text-right font-medium">13.5%</TableCell>
                        <TableCell className="text-right font-medium">19.0%</TableCell>
                        <TableCell>SSNIT</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="font-semibold text-sm">
                          Tier 2 — Occupational Pension Scheme
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell />
                        <TableCell>Occupational Pension</TableCell>
                        <TableCell className="text-right">0%</TableCell>
                        <TableCell className="text-right font-medium">5.0%</TableCell>
                        <TableCell className="text-right font-medium">5.0%</TableCell>
                        <TableCell>Approved Trustees</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="font-semibold text-sm">
                          Tier 3 — Voluntary Provident Fund
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell />
                        <TableCell>Voluntary Savings</TableCell>
                        <TableCell className="text-right">Variable</TableCell>
                        <TableCell className="text-right">Variable</TableCell>
                        <TableCell className="text-right">Variable</TableCell>
                        <TableCell>Approved Trustees</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>Total Mandatory (Tier 1 + Tier 2)</TableCell>
                        <TableCell className="text-right">5.5%</TableCell>
                        <TableCell className="text-right">18.5%</TableCell>
                        <TableCell className="text-right">24.0%</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ========== Receipt Dialog ========== */}
      <Dialog open={!!receiptFiling} onOpenChange={() => setReceiptFiling(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              SSNIT Payment Receipt
            </DialogTitle>
            <DialogDescription>Payment confirmation details for this filing period</DialogDescription>
          </DialogHeader>
          {receiptFiling && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">Payment Confirmed</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period</span>
                    <span className="font-medium">{receiptFiling.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt Number</span>
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{receiptFiling.ssnitReceiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono">{receiptFiling.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employees</span>
                    <span>{receiptFiling.totalEmployees}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filing Date</span>
                    <span>{formatDate(receiptFiling.filingDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Date</span>
                    <span>{receiptFiling.paymentDate ? formatDate(receiptFiling.paymentDate) : 'N/A'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employee Contributions</span>
                    <span>{formatGHS(receiptFiling.totalEmployeeContributions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employer Contributions</span>
                    <span>{formatGHS(receiptFiling.totalEmployerContributions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tier 2</span>
                    <span>{formatGHS(receiptFiling.totalTier2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Grand Total Paid</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatGHS(receiptFiling.grandTotal)}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Keep this receipt for your records. Contact SSNIT if there are discrepancies.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
