'use client';

import { useState, useMemo } from 'react';
import { useTreasurerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import {
  BarChart3, FileText, Download, CalendarDays,
  TrendingUp, Users, DollarSign, CircleDollarSign,
  Filter, FileSpreadsheet, Printer,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

type DateRange = 'this_week' | 'this_month' | 'last_month';

// Chart configs
const collectionChartConfig = {
  expected: { label: 'Expected', color: 'hsl(var(--chart-2))' },
  collected: { label: 'Collected', color: 'hsl(var(--chart-1))' },
};

const participationChartConfig = {
  contributions: { label: 'Contributions', color: 'hsl(var(--chart-1))' },
};

export function TreasurerReports() {
  const { managedGroups, allContributions, payouts } = useTreasurerStore();
  const [dateRange, setDateRange] = useState<DateRange>('this_month');

  // Date range calculations
  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (dateRange) {
      case 'this_week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  };

  const dateInfo = getDateRange();

  // Filtered contributions by date range
  const filteredContributions = useMemo(() => {
    return allContributions.filter(c => {
      const d = new Date(c.date);
      return d >= dateInfo.start && d <= dateInfo.end;
    });
  }, [allContributions, dateInfo.start, dateInfo.end]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      const d = new Date(p.payoutDate);
      return d >= dateInfo.start && d <= dateInfo.end;
    });
  }, [payouts, dateInfo.start, dateInfo.end]);

  // Collection Report
  const collectionReport = useMemo(() => {
    return managedGroups.map(group => {
      const groupContribs = filteredContributions.filter(c => c.groupId === group.id);
      const paid = groupContribs.filter(c => c.status === 'paid').length;
      const expected = group.members * (dateRange === 'this_week' ? 7 : 30); // rough expected count based on frequency
      const totalCollected = groupContribs.reduce((s, c) => s + c.amount, 0);
      const expectedAmount = group.contributionAmount * group.members;
      const overdueMembers = new Set(groupContribs.filter(c => c.status === 'overdue').map(c => c.memberId)).size;

      const rate = expectedAmount > 0 ? Math.round((totalCollected / expectedAmount) * 100) : 0;

      return {
        groupId: group.id,
        groupName: group.name,
        expected: expectedAmount,
        collected: totalCollected,
        rate: Math.min(rate, 100),
        overdueMembers,
        contributionsCount: paid,
      };
    });
  }, [managedGroups, filteredContributions, dateRange]);

  const totalCollected = collectionReport.reduce((s, r) => s + r.collected, 0);
  const totalExpected = collectionReport.reduce((s, r) => s + r.expected, 0);
  const totalContributions = filteredContributions.filter(c => c.status === 'paid').length;
  const averageContribution = totalContributions > 0 ? Math.round(totalCollected / totalContributions) : 0;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Payout Report
  const payoutReport = useMemo(() => {
    return filteredPayouts.map(p => ({
      id: p.id,
      groupName: p.groupName,
      memberName: p.memberName,
      amount: p.amount,
      date: p.payoutDate,
      method: p.disbursementMethod === 'momo' ? 'MoMo' : 'Bank',
      status: p.status,
    }));
  }, [filteredPayouts]);

  const totalPaidOut = payoutReport.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const completedPayouts = payoutReport.filter(p => p.status === 'completed').length;
  const averagePayout = completedPayouts > 0 ? Math.round(totalPaidOut / completedPayouts) : 0;

  // Group Performance Chart Data
  const groupPerformanceData = useMemo(() => {
    return collectionReport.map(r => ({
      name: r.groupName.length > 15 ? r.groupName.slice(0, 15) + '...' : r.groupName,
      fullName: r.groupName,
      Expected: r.expected,
      Collected: r.collected,
    }));
  }, [collectionReport]);

  // Member Participation Chart Data
  const memberParticipationData = useMemo(() => {
    const memberMap: Record<string, { name: string; contributions: number }> = {};

    filteredContributions.filter(c => c.status === 'paid').forEach(c => {
      if (!memberMap[c.memberId]) {
        memberMap[c.memberId] = { name: c.memberName, contributions: 0 };
      }
      memberMap[c.memberId].contributions += 1;
    });

    return Object.values(memberMap)
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10)
      .map(m => ({
        name: m.name.length > 15 ? m.name.slice(0, 15) + '...' : m.name,
        fullName: m.name,
        contributions: m.contributions,
      }));
  }, [filteredContributions]);

  const dateRangeLabel = dateRange === 'this_week' ? 'This Week'
    : dateRange === 'this_month' ? 'This Month'
    : 'Last Month';

  const handleExportPDF = () => {
    toast.success('PDF report generated! Download will start shortly.');
  };

  const handleExportExcel = () => {
    toast.success('Excel report exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <motion.div {...fadeUp}>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Report Period:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 overscroll-x-contain">
                {([
                  { label: 'This Week', value: 'this_week' as DateRange },
                  { label: 'This Month', value: 'this_month' as DateRange },
                  { label: 'Last Month', value: 'last_month' as DateRange },
                ]).map(option => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={dateRange === option.value ? 'default' : 'outline'}
                    className={`min-h-[44px] touch-manipulation ${dateRange === option.value ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                    onClick={() => setDateRange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Collection Report */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Collection Report
                <Badge variant="secondary" className="text-xs ml-2">{dateRangeLabel}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs min-h-[44px] touch-manipulation" onClick={handleExportPDF}>
                  <FileText className="mr-1 h-3 w-3" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" className="text-xs min-h-[44px] touch-manipulation" onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-1 h-3 w-3" />
                  Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Collection Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatGHS(totalCollected)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Contributions</p>
                <p className="text-sm font-bold mt-0.5">{totalContributions}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Avg. Contribution</p>
                <p className="text-sm font-bold mt-0.5">{formatGHS(averageContribution)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Collection Rate</p>
                <p className={`text-sm font-bold mt-0.5 ${collectionRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : collectionRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {collectionRate}%
                </p>
              </div>
            </div>

            {/* Collection Table */}
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto overscroll-contain">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Group Name</TableHead>
                    <TableHead className="text-xs">Expected</TableHead>
                    <TableHead className="text-xs">Collected</TableHead>
                    <TableHead className="text-xs">Rate</TableHead>
                    <TableHead className="text-xs">Overdue Members</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionReport.map(report => (
                    <TableRow key={report.groupId}>
                      <TableCell className="text-xs font-medium max-w-[180px] truncate">{report.groupName}</TableCell>
                      <TableCell className="text-xs">{formatGHS(report.expected)}</TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatGHS(report.collected)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${report.rate >= 80 ? 'bg-emerald-500' : report.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(report.rate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${report.rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : report.rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {report.rate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.overdueMembers > 0 ? (
                          <Badge className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {report.overdueMembers}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payout Report */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5" />
              Payout Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payout Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Paid Out</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatGHS(totalPaidOut)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Payouts Processed</p>
                <p className="text-sm font-bold mt-0.5">{completedPayouts}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Avg. Payout</p>
                <p className="text-sm font-bold mt-0.5">{formatGHS(averagePayout)}</p>
              </div>
            </div>

            {/* Payout Table */}
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto overscroll-contain">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Group</TableHead>
                    <TableHead className="text-xs">Member</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Method</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                        No payouts in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payoutReport.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium max-w-[150px] truncate">{p.groupName}</TableCell>
                        <TableCell className="text-xs">{p.memberName}</TableCell>
                        <TableCell className="text-xs font-bold">{formatGHS(p.amount)}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{formatDate(p.date)}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{p.method}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${getStatusColor(p.status)}`}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-3 lg:gap-6 lg:grid-cols-2">
        {/* Group Performance Chart */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Group Collection Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={collectionChartConfig} className="h-[300px] w-full">
                <BarChart data={groupPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0]?.payload;
                      return (
                        <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
                          <p className="font-medium mb-1">{data?.fullName || label}</p>
                          {payload.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground">{item.name}:</span>
                              <span className="font-semibold">{formatGHS(Number(item.value))}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="Expected" fill="var(--color-expected)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Member Participation Chart */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Participation (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={participationChartConfig} className="h-[300px] w-full">
                <BarChart data={memberParticipationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0]?.payload;
                      return (
                        <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
                          <p className="font-medium mb-1">{data?.fullName}</p>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">Contributions:</span>
                            <span className="font-semibold">{data?.contributions}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="contributions" fill="var(--color-contributions)" radius={[0, 4, 4, 0]} name="Contributions" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Export Actions */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Export Reports</p>
                <p className="text-xs text-muted-foreground">Generate and download reports for {dateRangeLabel}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 min-h-[44px] touch-manipulation" onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 text-red-500" />
                  PDF Report
                </Button>
                <Button variant="outline" className="gap-2 min-h-[44px] touch-manipulation" onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Excel Export
                </Button>
                <Button variant="outline" className="gap-2 min-h-[44px] touch-manipulation" onClick={() => toast.success('Report sent to printer!')}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
