'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Droplets, Tv, Wifi, Building, Shield, Receipt,
  Copy, CheckCircle2, X, CircleDollarSign, Clock, ArrowRight, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useCustomerExtendedStore, useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor } from '@/lib/formatters';
import type { Biller, BillerCategory, BillPayment } from '@/lib/types';
import { toast } from 'sonner';

// ============================================
// Category Configuration
// ============================================
const categoryConfig: Record<BillerCategory, { name: string; icon: React.ElementType; color: string; bg: string }> = {
  electricity: { name: 'Electricity', icon: Zap, color: '#f59e0b', bg: 'bg-amber-100' },
  water: { name: 'Water', icon: Droplets, color: '#3b82f6', bg: 'bg-blue-100' },
  tv: { name: 'TV & Entertainment', icon: Tv, color: '#8b5cf6', bg: 'bg-violet-100' },
  internet: { name: 'Internet', icon: Wifi, color: '#06b6d4', bg: 'bg-cyan-100' },
  government: { name: 'Government', icon: Building, color: '#22c55e', bg: 'bg-emerald-100' },
  insurance: { name: 'Insurance', icon: Shield, color: '#ec4899', bg: 'bg-pink-100' },
};

const tabCategories: (BillerCategory | 'all')[] = ['all', 'electricity', 'water', 'tv', 'internet', 'government'];

const FEE_RATE = 0.015;

// ============================================
// Animation Variants
// ============================================
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
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

// ============================================
// Helpers
// ============================================
function formatCurrency(amount: number): string {
  return `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function getPaymentStatusVariant(status: BillPayment['status']): string {
  const map: Record<BillPayment['status'], string> = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-slate-100 text-slate-800';
}

// ============================================
// Main Component
// ============================================
export function CustomerBills() {
  const { billers, billPayments, payBill } = useCustomerExtendedStore();
  const { wallets } = useCustomerStore();
  const mainWallet = wallets.find((w) => w.type === 'main');

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastPayment, setLastPayment] = useState<BillPayment | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<BillPayment | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Payment form state
  const [accountNumber, setAccountNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');

  // ---- Filtered billers ----
  const filteredBillers = useMemo(() => {
    if (activeTab === 'all') return billers;
    return billers.filter((b) => b.category === activeTab);
  }, [billers, activeTab]);

  // ---- Fee calculation ----
  const numericAmount = parseFloat(amount) || 0;
  const fee = numericAmount > 0 ? numericAmount * FEE_RATE : 0;
  const totalAmount = numericAmount + fee;
  const insufficientBalance = !!mainWallet && totalAmount > mainWallet.balance;

  // ---- Open payment dialog ----
  const handlePayNow = (biller: Biller) => {
    setSelectedBiller(biller);
    setAccountNumber('');
    setCustomerName('');
    setAmount('');
    setPaymentDialogOpen(true);
  };

  // ---- Submit payment ----
  const handleSubmitPayment = () => {
    if (!selectedBiller || !accountNumber || !customerName || numericAmount <= 0) return;
    if (insufficientBalance) {
      toast.error('Insufficient wallet balance for this payment', {
        description: `Available: ${formatCurrency(mainWallet?.balance ?? 0)} — needed: ${formatCurrency(totalAmount)}`,
      });
      return;
    }
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    // Brief processing phase, then commit to the store
    setTimeout(() => {
      const result = payBill(selectedBiller.id, accountNumber, customerName, numericAmount);
      setIsProcessingPayment(false);

      if (!result.ok) {
        toast.error(result.error ?? 'Payment failed', {
          description: 'Your wallet balance was not changed.',
        });
        return;
      }

      // Find the newly added payment (it will be at index 0 after payBill)
      const newPayments = useCustomerExtendedStore.getState().billPayments;
      const newPayment = newPayments[0];

      setLastPayment(newPayment);
      setPaymentDialogOpen(false);
      setSuccessDialogOpen(true);
    }, 500);
  };

  // ---- Copy token to clipboard ----
  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // ---- Active billers only ----
  const activeBillers = filteredBillers.filter((b) => b.isActive);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ==============================
          1. Header
          ============================== */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <CircleDollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pay Bills</h1>
              <p className="text-sm text-slate-500">
                Pay for electricity, water, TV subscriptions, internet and more
              </p>
            </div>
          </div>
          <div className="mt-2 sm:mt-0">
            <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
              <Receipt className="h-3 w-3" />
              {billPayments.length} payment{billPayments.length !== 1 ? 's' : ''} made
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ==============================
          2. Biller Category Tabs + Grid
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Billers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto overscroll-x-contain scrollbar-none bg-slate-100 p-1">
                {tabCategories.map((cat) => {
                  const config = cat !== 'all' ? categoryConfig[cat] : null;
                  const Icon = config ? config.icon : Receipt;
                  const label = config ? config.name : 'All';
                  return (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="flex items-center gap-1.5 whitespace-nowrap text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {tabCategories.map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-4">
                  {/* ---- Biller Grid ---- */}
                  {activeBillers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Receipt className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-500">No billers found</p>
                      <p className="mt-1 text-xs text-slate-400">No billers available in this category</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {activeBillers.map((biller) => {
                        const catConfig = categoryConfig[biller.category];
                        const CatIcon = catConfig.icon;
                        return (
                          <motion.div
                            key={biller.id}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' as const }}
                          >
                            <Card className="group h-full border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300/80">
                              <CardContent className="flex flex-col justify-between gap-4 p-4">
                                {/* Top: Biller info */}
                                <div className="flex items-start gap-3">
                                  <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm"
                                    style={{ backgroundColor: catConfig.color }}
                                  >
                                    {biller.logo}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                                      {biller.name}
                                    </h3>
                                    <Badge
                                      className="mt-1 gap-1 text-[10px] font-medium hover:opacity-80"
                                      style={{
                                        backgroundColor: `${catConfig.color}18`,
                                        color: catConfig.color,
                                      }}
                                    >
                                      <CatIcon className="h-2.5 w-2.5" />
                                      {catConfig.name}
                                    </Badge>
                                  </div>
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shrink-0">
                                    Active
                                  </Badge>
                                </div>

                                {/* Payment methods */}
                                <div className="flex flex-wrap gap-1.5">
                                  {biller.supportedPaymentMethods.map((method) => (
                                    <Badge
                                      key={method}
                                      variant="outline"
                                      className="text-[10px] font-medium capitalize text-slate-500 border-slate-200"
                                    >
                                      {method === 'momo' ? 'MoMo' : method === 'card' ? 'Card' : 'Bank Transfer'}
                                    </Badge>
                                  ))}
                                </div>

                                {/* Pay Now button */}
                                <Button
                                  onClick={() => handlePayNow(biller)}
                                  className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                  size="sm"
                                >
                                  Pay Now
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==============================
          3. Recent Payments Table
          ============================== */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Recent Payments
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Your latest bill payment transactions
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Last {billPayments.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {billPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Receipt className="h-7 w-7 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500">No payments yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Pay your first bill to see it here
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-slate-400">Biller</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Category</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Account</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Amount</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Fee</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Total</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Token</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Date</TableHead>
                        <TableHead className="text-xs font-medium text-slate-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billPayments.map((payment) => {
                        const catConfig = categoryConfig[payment.billerCategory];
                        const CatIcon = catConfig.icon;
                        return (
                          <TableRow
                            key={payment.id}
                            className="border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                            onClick={() => setReceiptPayment(payment)}
                          >
                            <TableCell className="text-xs font-medium text-slate-800">
                              {payment.billerName}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className="gap-1 text-[10px] font-medium hover:opacity-80"
                                style={{
                                  backgroundColor: `${catConfig.color}18`,
                                  color: catConfig.color,
                                }}
                              >
                                <CatIcon className="h-2.5 w-2.5" />
                                {catConfig.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 font-mono">
                              {payment.accountNumber}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-800">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {formatCurrency(payment.fee)}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-slate-900">
                              {formatCurrency(payment.totalAmount)}
                            </TableCell>
                            <TableCell>
                              {payment.token ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopyToken(payment.token!); }}
                                  className="flex items-center gap-1 text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  {payment.token}
                                  <Copy className="h-3 w-3" />
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">&mdash;</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {formatDate(payment.date)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getPaymentStatusVariant(payment.status)} h-5 text-[10px] font-medium capitalize`}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card List */}
                <div className="space-y-2 p-3 lg:hidden max-h-[420px] overflow-y-auto">
                  {billPayments.map((payment) => {
                    const catConfig = categoryConfig[payment.billerCategory];
                    const CatIcon = catConfig.icon;
                    return (
                      <div
                        key={payment.id}
                        onClick={() => setReceiptPayment(payment)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReceiptPayment(payment); } }}
                        aria-label={`View ${payment.billerName} payment receipt`}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                              style={{ backgroundColor: catConfig.color }}
                            >
                              <CatIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {payment.billerName}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {catConfig.name} &middot; {formatDate(payment.date)}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getPaymentStatusVariant(payment.status)} h-5 text-[10px] font-medium capitalize shrink-0`}>
                            {payment.status}
                          </Badge>
                        </div>

                        <Separator className="my-2.5 bg-slate-100" />

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-[10px] text-slate-400">Account</p>
                                <p className="text-xs font-mono text-slate-700">{payment.accountNumber}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400">Fee</p>
                                <p className="text-xs text-slate-600">{formatCurrency(payment.fee)}</p>
                              </div>
                            </div>
                            {payment.token && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyToken(payment.token!); }}
                                className="flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100 transition-colors cursor-pointer mt-1"
                              >
                                Token: {payment.token}
                                <Copy className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">Total</p>
                            <p className="text-base font-bold text-slate-900">
                              {formatCurrency(payment.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ==============================
          4. Payment Dialog
          ============================== */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedBiller && (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: categoryConfig[selectedBiller.category].color }}
                >
                  {selectedBiller.logo}
                </div>
              )}
              <div>
                <span className="text-base font-semibold text-slate-900">
                  {selectedBiller?.name ?? 'Pay Bill'}
                </span>
                {selectedBiller && (
                  <p className="text-xs text-slate-500 font-normal">
                    {categoryConfig[selectedBiller.category].name}
                  </p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="account-number" className="text-sm font-medium text-slate-700">
                {selectedBiller?.fieldLabel ?? 'Account Number'}
              </Label>
              <Input
                id="account-number"
                placeholder={selectedBiller?.fieldPlaceholder ?? 'Enter your account number'}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-sm font-medium text-slate-700">
                Customer Name
              </Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name on the bill"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                Amount (₵)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  ₵
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11 pl-8"
                />
              </div>
            </div>

            {/* Fee Summary */}
            {numericAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.25 }}
              >
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Amount</span>
                    <span className="font-medium text-slate-800">{formatCurrency(numericAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Service Fee (1.5%)</span>
                    <span className="font-medium text-slate-800">{formatCurrency(fee)}</span>
                  </div>
                  <Separator className="bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Balance hint */}
            {numericAmount > 0 && insufficientBalance && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Insufficient wallet balance — available: {formatCurrency(mainWallet?.balance ?? 0)}
              </p>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmitPayment}
              disabled={!accountNumber || !customerName || numericAmount <= 0 || insufficientBalance || isProcessingPayment}
              className="w-full h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              {isProcessingPayment ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatCurrency(totalAmount)}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==============================
          5. Success Dialog
          ============================== */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </motion.div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Successful!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Your bill payment has been processed
              </p>
            </div>

            {/* Token Display (Electricity only) */}
            {lastPayment?.token && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5"
              >
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                  Prepaid Token
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold font-mono tracking-widest text-amber-900">
                    {lastPayment.token}
                  </p>
                  <button
                    onClick={() => handleCopyToken(lastPayment.token!)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/60 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedToken ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-amber-600 mt-2">
                  Enter this token on your prepaid meter
                </p>
              </motion.div>
            )}

            {/* Receipt Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Biller</span>
                <span className="text-sm font-semibold text-slate-800">{lastPayment?.billerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Account</span>
                <span className="text-sm font-mono text-slate-700">{lastPayment?.accountNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Amount</span>
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(lastPayment?.amount ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Fee</span>
                <span className="text-sm text-slate-600">{formatCurrency(lastPayment?.fee ?? 0)}</span>
              </div>
              <Separator className="bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Reference</span>
                <span className="text-xs font-mono text-slate-600">{lastPayment?.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Paid</span>
                <span className="text-base font-bold text-emerald-600">{formatCurrency(lastPayment?.totalAmount ?? 0)}</span>
              </div>
            </motion.div>

            {/* Done Button */}
            <Button
              onClick={() => setSuccessDialogOpen(false)}
              className="w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==============================
          6. Payment Receipt Dialog
          ============================== */}
      <Dialog open={!!receiptPayment} onOpenChange={() => setReceiptPayment(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Full details of this bill payment transaction
            </DialogDescription>
          </DialogHeader>
          {receiptPayment && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: categoryConfig[receiptPayment.billerCategory].color }}
                >
                  {receiptPayment.billerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-lg font-semibold">{receiptPayment.billerName}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className="gap-1 text-[10px] font-medium hover:opacity-80"
                      style={{
                        backgroundColor: `${categoryConfig[receiptPayment.billerCategory].color}18`,
                        color: categoryConfig[receiptPayment.billerCategory].color,
                      }}
                    >
                      {categoryConfig[receiptPayment.billerCategory].name}
                    </Badge>
                    <Badge className={`${getPaymentStatusVariant(receiptPayment.status)} text-xs font-medium capitalize`}>
                      {receiptPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Prepaid Token (with copy) */}
              {receiptPayment.token && (
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4">
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                    Prepaid Token
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-bold font-mono tracking-widest text-amber-900 break-all">
                      {receiptPayment.token}
                    </p>
                    <button
                      onClick={() => handleCopyToken(receiptPayment.token!)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/60 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                      aria-label="Copy token"
                    >
                      {copiedToken ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-2">
                    Enter this token on your prepaid meter
                  </p>
                </div>
              )}

              <Separator className="bg-slate-200" />

              {/* All fields */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Biller</span><span className="font-medium truncate">{receiptPayment.billerName}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Category</span><span>{categoryConfig[receiptPayment.billerCategory].name}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Account</span><span className="font-mono">{receiptPayment.accountNumber}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Customer</span><span className="truncate">{receiptPayment.customerName}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatCurrency(receiptPayment.amount)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Fee</span><span>{formatCurrency(receiptPayment.fee)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Total Paid</span><span className="font-bold text-emerald-600">{formatCurrency(receiptPayment.totalAmount)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Date</span><span>{formatDate(receiptPayment.date)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{receiptPayment.reference}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Status</span><span className="capitalize">{receiptPayment.status}</span></div>
                <div className="flex justify-between gap-2 sm:col-span-2"><span className="text-muted-foreground">Wallet Balance After</span><span>{formatCurrency(receiptPayment.balanceAfter)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
