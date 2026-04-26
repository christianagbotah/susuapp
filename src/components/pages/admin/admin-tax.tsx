'use client';

import { useState, useMemo } from 'react';
import { useAdminExtendedStore } from '@/store/app-store';
import { formatGHS, formatDate } from '@/lib/formatters';
import { motion } from 'framer-motion';
import {
  Receipt,
  CalendarClock,
  Calculator,
  TrendingUp,
  FileText,
  Banknote,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  Landmark,
  Smartphone,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { toast } from 'sonner';
import type { TAXType, TAXFiling, TAXCalendarItem } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────
const TAX_TYPE_LABELS: Record<TAXType, string> = {
  paye: 'PAYE',
  vat: 'VAT',
  withholding: 'Withholding Tax',
  nhil: 'NHIL',
  getfund: 'GETFund',
  income_tax: 'Income Tax',
};

const TAX_TYPE_COLORS: Record<TAXType, string> = {
  paye: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  vat: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  withholding: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  nhil: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  getfund: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  income_tax: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
};

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  filed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  penalty: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const METHOD_ICONS: Record<string, typeof Landmark> = {
  bank_transfer: Landmark,
  momo: Smartphone,
  cheque: CreditCard,
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  momo: 'Mobile Money',
  cheque: 'Cheque',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

// Ghana PAYE Tax Bands 2024
const PAYE_BANDS = [
  { min: 0, max: 5880, rate: 0, label: 'First ₵ 5,880' },
  { min: 5881, max: 7200, rate: 5, label: '₵ 5,881 – 7,200' },
  { min: 7201, max: 8760, rate: 10, label: '₵ 7,201 – 8,760' },
  { min: 8761, max: 46764, rate: 17.5, label: '₵ 8,761 – 46,764' },
  { min: 46765, max: 238764, rate: 25, label: '₵ 46,765 – 238,764' },
  { min: 238765, max: 605004, rate: 30, label: '₵ 238,765 – 605,004' },
  { min: 605005, max: Infinity, rate: 35, label: 'Above ₵ 605,004' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

// ─── Helper: compute PAYE ────────────────────────────────
interface PAYEBandResult {
  band: string;
  rate: number;
  taxableAmount: number;
  tax: number;
}

function computePAYE(annualIncome: number): { bands: PAYEBandResult[]; totalAnnualTax: number; monthlyPAYE: number } {
  const bands: PAYEBandResult[] = [];
  let remaining = annualIncome;
  let totalTax = 0;

  for (const band of PAYE_BANDS) {
    const taxable = Math.max(0, Math.min(remaining, band.max === Infinity ? remaining : band.max - band.min + 1));
    const tax = (taxable * band.rate) / 100;
    bands.push({
      band: band.label,
      rate: band.rate,
      taxableAmount: taxable,
      tax,
    });
    totalTax += tax;
    remaining -= taxable;
    if (remaining <= 0) break;
  }

  return { bands, totalAnnualTax: totalTax, monthlyPAYE: totalTax / 12 };
}

// ─── Component ────────────────────────────────────────────
export function AdminTax() {
  const { taxFilings, taxPayments, taxCalendar, submitTAXFiling } = useAdminExtendedStore();

  // ── State ──
  const [activeTab, setActiveTab] = useState('filings');
  const [filingTypeFilter, setFilingTypeFilter] = useState<string>('all');
  const [filingStatusFilter, setFilingStatusFilter] = useState<string>('all');
  const [selectedFiling, setSelectedFiling] = useState<TAXFiling | null>(null);
  const [payeIncome, setPayeIncome] = useState<string>('72000');

  // ── Derived ──
  const filteredFilings = useMemo(() => {
    return taxFilings.filter(f => {
      if (filingTypeFilter !== 'all' && f.taxType !== filingTypeFilter) return false;
      if (filingStatusFilter !== 'all' && f.status !== filingStatusFilter) return false;
      return true;
    });
  }, [taxFilings, filingTypeFilter, filingStatusFilter]);

  const totalPaidYTD = useMemo(
    () => taxPayments.filter(p => p.status === 'completed').reduce((s, p) => s + p.totalAmount, 0),
    [taxPayments],
  );

  const pendingCount = useMemo(
    () => taxFilings.filter(f => f.status === 'draft' || f.status === 'filed').length,
    [taxFilings],
  );

  const nextDueDate = useMemo(() => {
    const now = new Date();
    const future = taxCalendar
      .filter(c => new Date(c.nextDueDate) > now)
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    return future[0] ?? null;
  }, [taxCalendar]);

  const complianceScore = useMemo(() => {
    const total = taxFilings.length;
    if (total === 0) return 100;
    const onTime = taxFilings.filter(f => f.status === 'paid').length;
    return Math.round((onTime / total) * 100);
  }, [taxFilings]);

  const paymentRunningTotal = useMemo(
    () => taxPayments.filter(p => p.status === 'completed').reduce((s, p) => s + p.totalAmount, 0),
    [taxPayments],
  );

  // Tax payment chart data
  const paymentByType = useMemo(() => {
    const map = new Map<TAXType, number>();
    taxPayments.filter(p => p.status === 'completed').forEach(p => {
      map.set(p.taxType, (map.get(p.taxType) ?? 0) + p.totalAmount);
    });
    return Array.from(map.entries()).map(([type, amount]) => ({
      name: TAX_TYPE_LABELS[type],
      value: amount,
    }));
  }, [taxPayments]);

  // PAYE calculator
  const payeResult = useMemo(() => computePAYE(Number(payeIncome) || 0), [payeIncome]);

  // ── Handlers ──
  const handleFile = (filingId: string) => {
    submitTAXFiling(filingId);
    toast.success('Filing submitted successfully');
  };

  // ── Urgency helper for calendar ──
  const getUrgency = (dateStr: string) => {
    const now = new Date();
    const due = new Date(dateStr);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 7) return { label: 'Urgent', cls: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' };
    if (diff <= 30) return { label: 'Upcoming', cls: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' };
    return { label: 'On Track', cls: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10' };
  };

  // ── Days remaining helper ──
  const daysRemaining = (dateStr: string) => {
    const now = new Date();
    const due = new Date(dateStr);
    return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Receipt className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GRA Tax Payments</h1>
            <p className="text-sm text-muted-foreground">Manage tax filings, payments, and compliance</p>
          </div>
        </div>
      </motion.div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Tax Paid YTD', value: formatGHS(totalPaidYTD), icon: Banknote, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', sub: `${taxPayments.filter(p => p.status === 'completed').length} payments` },
          { label: 'Pending Filings', value: pendingCount, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', sub: 'draft + filed' },
          { label: 'Next Due Date', value: nextDueDate ? formatDate(nextDueDate.nextDueDate) : 'N/A', icon: CalendarClock, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', sub: nextDueDate ? `${daysRemaining(nextDueDate.nextDueDate)} days left` : '' },
          { label: 'Compliance Score', value: `${complianceScore}%`, icon: ShieldCheck, color: complianceScore >= 80 ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' : 'text-red-600 bg-red-100 dark:bg-red-900/30', sub: complianceScore >= 80 ? 'Good standing' : 'Needs attention' },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="mobile-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold truncate">{s.value}</p>
                  {s.sub && <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Compliance Progress ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tax Compliance</span>
              <span className={`text-sm font-bold ${complianceScore >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{complianceScore}%</span>
            </div>
            <Progress value={complianceScore} className="h-2" />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">{taxFilings.filter(f => f.status === 'paid').length} of {taxFilings.length} filings paid</span>
              <span className="text-xs text-muted-foreground">{pendingCount} pending</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="filings" className="text-xs sm:text-sm gap-1">
              <FileText className="h-3.5 w-3.5 hidden sm:block" /> Filings
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm gap-1">
              <Banknote className="h-3.5 w-3.5 hidden sm:block" /> Payments
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm gap-1">
              <CalendarClock className="h-3.5 w-3.5 hidden sm:block" /> Tax Calendar
            </TabsTrigger>
            <TabsTrigger value="paye" className="text-xs sm:text-sm gap-1">
              <Calculator className="h-3.5 w-3.5 hidden sm:block" /> PAYE Calc
            </TabsTrigger>
          </TabsList>

          {/* ────────── FILINGS TAB ────────── */}
          <TabsContent value="filings" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Tax Type</Label>
                  <Select value={filingTypeFilter} onValueChange={setFilingTypeFilter}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {(Object.entries(TAX_TYPE_LABELS) as [TAXType, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                  <Select value={filingStatusFilter} onValueChange={setFilingStatusFilter}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="filed">Filed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="penalty">Penalty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => { setFilingTypeFilter('all'); setFilingStatusFilter('all'); }}
                >
                  Reset
                </Button>
              </CardContent>
            </Card>

            {/* Desktop Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Tax Filings
                  <Badge variant="secondary" className="ml-auto text-xs">{filteredFilings.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tax Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Filing Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFilings.map(filing => (
                        <TableRow key={filing.id} className="hover:bg-muted/30">
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${TAX_TYPE_COLORS[filing.taxType]}`}>
                              {TAX_TYPE_LABELS[filing.taxType]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{filing.period}</TableCell>
                          <TableCell className="text-right font-semibold">{formatGHS(filing.totalTax)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(filing.dueDate)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(filing.filingDate)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${STATUS_STYLES[filing.status]}`}>
                              {filing.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">{filing.reference}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {filing.status === 'draft' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs min-h-[32px]" onClick={() => handleFile(filing.id)}>
                                  <Send className="mr-1 h-3 w-3" /> File
                                </Button>
                              )}
                              {filing.status === 'paid' && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs min-h-[32px]" onClick={() => setSelectedFiling(filing)}>
                                  <Eye className="mr-1 h-3 w-3" /> Receipt
                                </Button>
                              )}
                              {filing.status !== 'draft' && filing.status !== 'paid' && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs min-h-[32px]" onClick={() => setSelectedFiling(filing)}>
                                  <Eye className="mr-1 h-3 w-3" /> View
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredFilings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No filings match the selected filters.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {filteredFilings.map(filing => (
                    <div key={filing.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-xs ${TAX_TYPE_COLORS[filing.taxType]}`}>
                              {TAX_TYPE_LABELS[filing.taxType]}
                            </Badge>
                            <Badge variant="secondary" className={`text-xs ${STATUS_STYLES[filing.status]}`}>
                              {filing.status}
                            </Badge>
                          </div>
                          <p className="font-semibold text-sm mt-1">{filing.period}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{filing.reference}</p>
                        </div>
                        <p className="text-lg font-bold text-right">{formatGHS(filing.totalTax)}</p>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Due: {formatDate(filing.dueDate)}</span>
                        <span>Filed: {formatDate(filing.filingDate)}</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        {filing.status === 'draft' && (
                          <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={() => handleFile(filing.id)}>
                            <Send className="mr-1 h-3 w-3" /> File
                          </Button>
                        )}
                        {filing.status === 'paid' && (
                          <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={() => setSelectedFiling(filing)}>
                            <Eye className="mr-1 h-3 w-3" /> View Receipt
                          </Button>
                        )}
                        {filing.status !== 'draft' && filing.status !== 'paid' && (
                          <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={() => setSelectedFiling(filing)}>
                            <Eye className="mr-1 h-3 w-3" /> View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredFilings.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No filings match the selected filters.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ────────── PAYMENTS TAB ────────── */}
          <TabsContent value="payments" className="space-y-4">
            {/* Chart + Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Payments by Tax Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {paymentByType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatGHS(value)}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {paymentByType.map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart className="h-4 w-4" /> Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={taxPayments.filter(p => p.status === 'completed')}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₵${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatGHS(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="totalAmount" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payments Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Payment Records
                  <Badge variant="secondary" className="ml-auto text-xs">{taxPayments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto overscroll-x-contain scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Penalty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxPayments.map(payment => {
                        const MethodIcon = METHOD_ICONS[payment.method] || Landmark;
                        return (
                          <TableRow key={payment.id} className="hover:bg-muted/30">
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${TAX_TYPE_COLORS[payment.taxType]}`}>
                                {TAX_TYPE_LABELS[payment.taxType]}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{payment.period}</TableCell>
                            <TableCell className="text-right">{formatGHS(payment.amount)}</TableCell>
                            <TableCell className={`text-right ${payment.penaltyAmount > 0 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                              {payment.penaltyAmount > 0 ? formatGHS(payment.penaltyAmount) : '—'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatGHS(payment.totalAmount)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <MethodIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm">{METHOD_LABELS[payment.method]}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${STATUS_STYLES[payment.status]}`}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <tfoot>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4} className="text-right">Running Total</TableCell>
                        <TableCell className="text-right">{formatGHS(paymentRunningTotal)}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    </tfoot>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {taxPayments.map(payment => {
                    const MethodIcon = METHOD_ICONS[payment.method] || Landmark;
                    return (
                      <div key={payment.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`text-xs ${TAX_TYPE_COLORS[payment.taxType]}`}>
                                {TAX_TYPE_LABELS[payment.taxType]}
                              </Badge>
                              <Badge variant="secondary" className={`text-xs ${STATUS_STYLES[payment.status]}`}>
                                {payment.status}
                              </Badge>
                            </div>
                            <p className="font-semibold text-sm mt-1">{payment.period}</p>
                          </div>
                          <p className="text-lg font-bold text-right">{formatGHS(payment.totalAmount)}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MethodIcon className="h-3 w-3" />{METHOD_LABELS[payment.method]}</span>
                          <span>{formatDate(payment.paymentDate)}</span>
                          {payment.penaltyAmount > 0 && <span className="text-red-600">Penalty: {formatGHS(payment.penaltyAmount)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Running total for mobile */}
                <div className="md:hidden p-4 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Running Total</span>
                    <span className="text-base font-bold">{formatGHS(paymentRunningTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ────────── TAX CALENDAR TAB ────────── */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> Upcoming Tax Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {taxCalendar.map(item => {
                    const urgency = getUrgency(item.nextDueDate);
                    const days = daysRemaining(item.nextDueDate);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <div className={`rounded-lg border-2 p-4 space-y-3 transition-all hover:shadow-md ${urgency.cls}`}>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm">{item.name}</h3>
                              <Badge variant="secondary" className={`text-xs mt-1 ${TAX_TYPE_COLORS[item.taxType]}`}>
                                {TAX_TYPE_LABELS[item.taxType]}
                              </Badge>
                            </div>
                            {urgency.label === 'Urgent' && <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
                            {urgency.label === 'On Track' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                            {urgency.label === 'Upcoming' && <Clock className="h-5 w-5 text-amber-600 shrink-0" />}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-muted-foreground">{item.description}</p>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Due Date</span>
                              <p className="font-medium">{formatDate(item.nextDueDate)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Days Left</span>
                              <p className={`font-bold ${days <= 7 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {days} day{days !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Frequency</span>
                              <p className="font-medium capitalize">{item.frequency}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Penalty</span>
                              <p className="font-medium text-red-600">{item.penaltyPercent}%</p>
                            </div>
                          </div>

                          {/* Urgency indicator */}
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${urgency.label === 'Urgent' ? 'border-red-400 text-red-700 dark:text-red-400' : urgency.label === 'Upcoming' ? 'border-amber-400 text-amber-700 dark:text-amber-400' : 'border-emerald-400 text-emerald-700 dark:text-emerald-400'}`}
                            >
                              {urgency.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Due on the {item.dueDay}{item.dueDay === 1 ? 'st' : item.dueDay === 2 ? 'nd' : item.dueDay === 3 ? 'rd' : 'th'}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ────────── PAYE CALCULATOR TAB ────────── */}
          <TabsContent value="paye" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Input */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" /> Ghana PAYE Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paye-income">Annual Taxable Income (₵)</Label>
                    <Input
                      id="paye-income"
                      type="number"
                      placeholder="e.g. 72000"
                      value={payeIncome}
                      onChange={(e) => setPayeIncome(e.target.value)}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">Enter gross annual income after SSNIT deductions</p>
                  </div>

                  <Separator />

                  {/* Result Summary */}
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Percent className="h-4 w-4" /> Tax Computation Summary
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Annual Taxable Income</span>
                        <span className="font-medium">{formatGHS(Number(payeIncome) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Annual PAYE Tax</span>
                        <span className="font-semibold text-red-600">{formatGHS(payeResult.totalAnnualTax)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Monthly PAYE</span>
                        <span className="font-bold text-lg text-emerald-600">{formatGHS(payeResult.monthlyPAYE)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Effective Rate */}
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Effective Tax Rate</span>
                      <span className="text-2xl font-bold">
                        {Number(payeIncome) > 0 ? ((payeResult.totalAnnualTax / Number(payeIncome)) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <Progress
                      value={Number(payeIncome) > 0 ? (payeResult.totalAnnualTax / Number(payeIncome)) * 100 : 0}
                      className="h-2 mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Band Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Tax Band Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {/* Header */}
                    <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                      <span>Band</span>
                      <span className="text-center">Rate</span>
                      <span className="text-right">Taxable</span>
                      <span className="text-right">Tax</span>
                    </div>

                    {payeResult.bands.map((band, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-4 py-2.5 text-sm border-b last:border-b-0 ${band.tax > 0 ? 'bg-muted/30' : ''}`}
                      >
                        <span className="text-xs text-muted-foreground truncate pr-2">{band.band}</span>
                        <span className="text-center">
                          <Badge variant={band.rate > 0 ? 'secondary' : 'outline'} className="text-xs">
                            {band.rate}%
                          </Badge>
                        </span>
                        <span className="text-right text-muted-foreground">{band.taxableAmount > 0 ? formatGHS(band.taxableAmount) : '—'}</span>
                        <span className={`text-right font-semibold ${band.tax > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {band.tax > 0 ? formatGHS(band.tax) : '—'}
                        </span>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="grid grid-cols-4 py-3 text-sm font-bold mt-1">
                      <span>Total</span>
                      <span></span>
                      <span className="text-right">{formatGHS(Number(payeIncome) || 0)}</span>
                      <span className="text-right text-red-600">{formatGHS(payeResult.totalAnnualTax)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Tax Bands Reference */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ghana PAYE Tax Bands 2024</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {PAYE_BANDS.map((band, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3 shrink-0" />
                          <span>{band.label} <span className="font-medium text-foreground">@ {band.rate}%</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Filing Detail Dialog ── */}
      <Dialog open={!!selectedFiling} onOpenChange={() => setSelectedFiling(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedFiling?.status === 'paid' ? 'Payment Receipt' : 'Filing Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedFiling?.period} - {selectedFiling && TAX_TYPE_LABELS[selectedFiling.taxType]}
            </DialogDescription>
          </DialogHeader>
          {selectedFiling && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex gap-2">
                <Badge variant="secondary" className={`text-xs ${TAX_TYPE_COLORS[selectedFiling.taxType]}`}>
                  {TAX_TYPE_LABELS[selectedFiling.taxType]}
                </Badge>
                <Badge variant="secondary" className={`text-xs ${STATUS_STYLES[selectedFiling.status]}`}>
                  {selectedFiling.status}
                </Badge>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxpayer</span>
                  <span className="font-medium text-right">{selectedFiling.taxpayerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TIN</span>
                  <span className="font-mono">{selectedFiling.tin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{selectedFiling.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tax</span>
                  <span className="font-bold text-emerald-600">{formatGHS(selectedFiling.totalTax)}</span>
                </div>
                {selectedFiling.penaltyAmount != null && selectedFiling.penaltyAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penalty</span>
                    <span className="font-bold text-red-600">{formatGHS(selectedFiling.penaltyAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{formatDate(selectedFiling.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filing Date</span>
                  <span>{formatDate(selectedFiling.filingDate)}</span>
                </div>
                {selectedFiling.paymentDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Date</span>
                    <span>{formatDate(selectedFiling.paymentDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{selectedFiling.reference}</span>
                </div>
                {selectedFiling.graReceiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GRA Receipt No.</span>
                    <span className="font-mono text-xs">{selectedFiling.graReceiptNumber}</span>
                  </div>
                )}
              </div>

              {selectedFiling.status === 'paid' && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Payment Confirmed</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-500">This filing has been paid and confirmed by GRA.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
