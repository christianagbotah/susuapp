'use client';

import { useState } from 'react';
import { useTreasurerStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  CircleDollarSign, Clock, CheckCircle, CalendarDays,
  TrendingUp, ArrowRight, FileText, Layers, Zap,
  Filter, CreditCard, Smartphone, Building2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';

// Mock daily payout data for last 2 weeks
const dailyPayoutData = [
  { day: 'Apr 5', amount: 12000, count: 3 },
  { day: 'Apr 6', amount: 8000, count: 2 },
  { day: 'Apr 7', amount: 0, count: 0 },
  { day: 'Apr 8', amount: 15000, count: 4 },
  { day: 'Apr 9', amount: 10000, count: 2 },
  { day: 'Apr 10', amount: 22000, count: 5 },
  { day: 'Apr 11', amount: 18000, count: 3 },
  { day: 'Apr 12', amount: 5000, count: 1 },
  { day: 'Apr 13', amount: 0, count: 0 },
  { day: 'Apr 14', amount: 25000, count: 6 },
  { day: 'Apr 15', amount: 20000, count: 4 },
  { day: 'Apr 16', amount: 15000, count: 3 },
  { day: 'Apr 17', amount: 30000, count: 7 },
  { day: 'Apr 18', amount: 10000, count: 2 },
];

const chartConfig = {
  amount: { label: 'Payout Amount (₵)', color: 'hsl(var(--chart-1))' },
  count: { label: 'Payout Count', color: 'hsl(var(--chart-2))' },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

type PayoutStatus = 'all' | 'pending' | 'processing' | 'completed';

export function TreasurerPayouts() {
  const { payouts, processPayout } = useTreasurerStore();
  const [statusFilter, setStatusFilter] = useState<PayoutStatus>('all');
  const [processDialogId, setProcessDialogId] = useState<string | null>(null);
  const [receiptDialogId, setReceiptDialogId] = useState<string | null>(null);
  const [batchConfirm, setBatchConfirm] = useState(false);

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const processingPayouts = payouts.filter(p => p.status === 'processing');
  const completedPayouts = payouts.filter(p => p.status === 'completed');

  const filteredPayouts = statusFilter === 'all'
    ? payouts
    : payouts.filter(p => p.status === statusFilter);

  const pendingTotal = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const processedToday = completedPayouts.filter(p => {
    const d = new Date(p.payoutDate);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const thisMonthTotal = completedPayouts.filter(p => {
    const d = new Date(p.payoutDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.amount, 0);

  const successRate = payouts.length > 0
    ? Math.round((completedPayouts.length / payouts.length) * 100)
    : 95;

  const statsCards = [
    { title: 'Pending Payouts', value: `${pendingPayouts.length} (${formatGHS(pendingTotal)})`, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Processed Today', value: processedToday.toString(), icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'This Month Total', value: formatGHS(thisMonthTotal), icon: CalendarDays, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  const selectedPayout = payouts.find(p => p.id === processDialogId);
  const receiptPayout = payouts.find(p => p.id === receiptDialogId);

  const handleProcessPayout = () => {
    if (processDialogId) {
      processPayout(processDialogId);
      setProcessDialogId(null);
      toast.success('Payout processed successfully!');
    }
  };

  const handleBatchProcess = () => {
    pendingPayouts.forEach(p => processPayout(p.id));
    setBatchConfirm(false);
    toast.success(`${pendingPayouts.length} payouts processed successfully!`);
  };

  const filterButtons: { label: string; value: PayoutStatus; count: number }[] = [
    { label: 'All', value: 'all', count: payouts.length },
    { label: 'Pending', value: 'pending', count: pendingPayouts.length },
    { label: 'Processing', value: 'processing', count: processingPayouts.length },
    { label: 'Completed', value: 'completed', count: completedPayouts.length },
  ];

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
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar + Batch Processing */}
      <motion.div {...fadeUp}>
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {filterButtons.map(btn => (
                  <Button
                    key={btn.value}
                    size="sm"
                    variant={statusFilter === btn.value ? 'default' : 'outline'}
                    className={`min-h-[44px] touch-manipulation ${statusFilter === btn.value ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                    onClick={() => setStatusFilter(btn.value)}
                  >
                    {btn.label}
                    <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1 text-[10px]">
                      {btn.count}
                    </Badge>
                  </Button>
                ))}
              </div>
              {pendingPayouts.length > 0 && (
                <Button
                  size="sm"
                  className="min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white touch-manipulation"
                  onClick={() => setBatchConfirm(true)}
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Process All Pending ({pendingPayouts.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payouts Table */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5" />
              Payout Records
              <Badge variant="secondary" className="text-xs ml-2">{filteredPayouts.length} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto overscroll-contain">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Group</TableHead>
                    <TableHead className="text-xs">Member</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Payout Date</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Round</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Method</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">MoMo Number</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                        No payouts found for the selected filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="text-xs font-medium max-w-[150px] truncate">{payout.groupName}</TableCell>
                        <TableCell className="text-xs">{payout.memberName}</TableCell>
                        <TableCell className="text-xs font-bold">{formatGHS(payout.amount)}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{formatDate(payout.payoutDate)}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{payout.round}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            {payout.disbursementMethod === 'momo' ? (
                              <><Smartphone className="h-3 w-3" /> MoMo</>
                            ) : (
                              <><Building2 className="h-3 w-3" /> Bank</>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">{payout.momoNumber || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${getStatusColor(payout.status)}`}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payout.status === 'pending' && (
                            <Button
                              size="sm"
                              className="h-7 min-h-[44px] px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white touch-manipulation"
                              onClick={() => setProcessDialogId(payout.id)}
                            >
                              <CircleDollarSign className="mr-1 h-3 w-3" />
                              Process
                            </Button>
                          )}
                          {payout.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 min-h-[44px] px-2 text-xs touch-manipulation"
                              onClick={() => setReceiptDialogId(payout.id)}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              Receipt
                            </Button>
                          )}
                          {payout.status === 'processing' && (
                            <Badge className="text-[10px] bg-amber-100 text-amber-800">
                              <Clock className="mr-1 h-3 w-3" />
                              Processing...
                            </Badge>
                          )}
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

      {/* Payout History Chart */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Payout History (Last 2 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={dailyPayoutData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar yAxisId="left" dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} name="Amount" />
                <Bar yAxisId="right" dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Process Payout Confirmation Dialog */}
      <Dialog open={!!processDialogId} onOpenChange={(open) => { if (!open) setProcessDialogId(null); }}>
        <DialogContent className="mx-4 sm:mx-0 max-w-md overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-emerald-600" />
              Process Payout
            </DialogTitle>
            <DialogDescription>
              Confirm the following payout details before processing.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member</span>
                  <span className="font-medium">{selectedPayout.memberName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Group</span>
                  <span className="font-medium">{selectedPayout.groupName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg text-emerald-600">{formatGHS(selectedPayout.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium flex items-center gap-1">
                    {selectedPayout.disbursementMethod === 'momo' ? (
                      <><Smartphone className="h-3.5 w-3.5" /> Mobile Money</>
                    ) : (
                      <><Building2 className="h-3.5 w-3.5" /> Bank Transfer</>
                    )}
                  </span>
                </div>
                {selectedPayout.momoNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">MoMo Number</span>
                    <span className="font-medium">{selectedPayout.momoNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payout Date</span>
                  <span className="font-medium">{formatDate(selectedPayout.payoutDate)}</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => setProcessDialogId(null)}>
                  Cancel
                </Button>
                <Button
                  className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white touch-manipulation"
                  onClick={handleProcessPayout}
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Confirm Payout
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={!!receiptDialogId} onOpenChange={(open) => { if (!open) setReceiptDialogId(null); }}>
        <DialogContent className="mx-4 sm:mx-0 max-w-md overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Payout Receipt
            </DialogTitle>
          </DialogHeader>

          {receiptPayout && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 p-4 space-y-3 bg-emerald-50/50 dark:bg-emerald-900/10">
                <div className="text-center space-y-1 pb-3 border-b border-emerald-200 dark:border-emerald-700">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">iSusuPro Ghana</p>
                  <p className="font-bold text-lg">Payment Receipt</p>
                  <Badge className="bg-emerald-600 text-white">Completed</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receipt #</span>
                    <span className="font-mono text-xs">{receiptPayout.id.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member</span>
                    <span className="font-medium">{receiptPayout.memberName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Group</span>
                    <span className="font-medium">{receiptPayout.groupName}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-bold text-lg text-emerald-600">{formatGHS(receiptPayout.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium">{receiptPayout.disbursementMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'}</span>
                  </div>
                  {receiptPayout.momoNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sent To</span>
                      <span className="font-medium">{receiptPayout.momoNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{formatDate(receiptPayout.payoutDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Round</span>
                    <span className="font-medium">{receiptPayout.round}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => setReceiptDialogId(null)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Processing Confirmation Dialog */}
      <Dialog open={batchConfirm} onOpenChange={setBatchConfirm}>
        <DialogContent className="mx-4 sm:mx-0 max-w-md overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Batch Process All Pending
            </DialogTitle>
            <DialogDescription>
              You are about to process {pendingPayouts.length} pending payout(s) totaling{' '}
              <span className="font-bold text-foreground">{formatGHS(pendingTotal)}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => setBatchConfirm(false)}>Cancel</Button>
            <Button
              className="min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white touch-manipulation"
              onClick={handleBatchProcess}
            >
              <Zap className="mr-1.5 h-4 w-4" />
              Process {pendingPayouts.length} Payouts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
