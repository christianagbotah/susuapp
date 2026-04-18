'use client';

import { useState } from 'react';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, getStatusColor } from '@/lib/formatters';
import { mobileMoneyProviders } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Smartphone, Building2, QrCode, Copy, Check, Shield, Info, CreditCard, Banknote, TrendingUp } from 'lucide-react';
import { MobileFabWithLabel } from '@/components/shared/mobile-components';

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

// ---- Helper: transaction type badge ----
function getTxnTypeBadge(type: string) {
  const map: Record<string, { label: string; variant: string }> = {
    deposit: { label: 'Deposit', variant: 'bg-emerald-100 text-emerald-700' },
    withdrawal: { label: 'Withdrawal', variant: 'bg-red-100 text-red-700' },
    transfer: { label: 'Transfer', variant: 'bg-slate-100 text-slate-700' },
    susu_contribution: { label: 'Contribution', variant: 'bg-teal-100 text-teal-700' },
    susu_payout: { label: 'Payout', variant: 'bg-emerald-100 text-emerald-700' },
    loan_repayment: { label: 'Repayment', variant: 'bg-amber-100 text-amber-700' },
    loan_disbursement: { label: 'Disbursement', variant: 'bg-blue-100 text-blue-700' },
    fee: { label: 'Fee', variant: 'bg-orange-100 text-orange-700' },
  };
  return map[type] ?? { label: type, variant: 'bg-slate-100 text-slate-700' };
}

function isPositiveAmount(type: string) {
  return ['deposit', 'susu_payout'].includes(type);
}

// ---- Helper: wallet type icon ----
function getWalletTypeIcon(type: string) {
  switch (type) {
    case 'main': return Wallet;
    case 'savings': return CreditCard;
    case 'susu': return TrendingUp;
    default: return Wallet;
  }
}

function getWalletTypeLabel(type: string) {
  switch (type) {
    case 'main': return 'Main Wallet';
    case 'savings': return 'Savings Wallet';
    case 'susu': return 'Susu Wallet';
    default: return type;
  }
}

function getWalletTypeBg(type: string) {
  switch (type) {
    case 'main': return 'from-emerald-500 to-teal-500';
    case 'savings': return 'from-amber-500 to-orange-500';
    case 'susu': return 'from-violet-500 to-purple-500';
    default: return 'from-slate-500 to-slate-600';
  }
}

// ============================================================
// Main Component
// ============================================================
export function CustomerWallet() {
  const { wallets, transactions, deposit, withdraw } = useCustomerStore();

  // ---- Computed values ----
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const walletTransactions = transactions.filter(
    (t) => t.type === 'deposit' || t.type === 'withdrawal'
  );
  const recentWalletActivity = walletTransactions.slice(0, 5);
  const mainWallet = wallets.find((w) => w.type === 'main');

  // ---- Deposit state ----
  const [depositWalletId, setDepositWalletId] = useState('');
  const [depositProviderId, setDepositProviderId] = useState('');
  const [depositPhone, setDepositPhone] = useState(mainWallet?.accountNumber ?? '');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPin, setDepositPin] = useState('');

  // ---- Withdraw state ----
  const [withdrawWalletId, setWithdrawWalletId] = useState('');
  const [withdrawProviderId, setWithdrawProviderId] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState(mainWallet?.accountNumber ?? '');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestType, setWithdrawDestType] = useState<'momo' | 'bank'>('momo');

  // ---- Confirmation dialog ----
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'deposit' | 'withdraw';
    walletId: string;
    amount: number;
    providerName: string;
  }>({ open: false, type: 'deposit', walletId: '', amount: 0, providerName: '' });

  // ---- Selected provider helpers ----
  const selectedDepositProvider = mobileMoneyProviders.find((p) => p.id === depositProviderId);
  const selectedWithdrawProvider = mobileMoneyProviders.find((p) => p.id === withdrawProviderId);

  // ---- Withdrawal fee calculation ----
  const withdrawFee =
    withdrawDestType === 'momo'
      ? (parseFloat(withdrawAmount) || 0) * 0.01
      : (parseFloat(withdrawAmount) || 0) * 0.02;
  const withdrawNet = (parseFloat(withdrawAmount) || 0) - withdrawFee;

  // ---- Deposit fee calculation ----
  const depositFeeAmount = (() => {
    const amt = parseFloat(depositAmount) || 0;
    if (amt < 5000) return 0;
    if (amt <= 10000) return 2.5;
    return amt * 0.0025;
  })();

  // ---- Handlers ----
  function handleDepositSubmit() {
    const amount = parseFloat(depositAmount);
    if (!depositWalletId) { toast.error('Please select a wallet'); return; }
    if (!depositProviderId) { toast.error('Please select a mobile money provider'); return; }
    if (!depositPhone || depositPhone.length < 10) { toast.error('Please enter a valid phone number'); return; }
    if (!amount || amount <= 0) { toast.error('Please enter a valid amount'); return; }
    if (!depositPin || depositPin.length < 4) { toast.error('Please enter your MoMo PIN'); return; }

    const provider = mobileMoneyProviders.find((p) => p.id === depositProviderId);
    setConfirmDialog({
      open: true,
      type: 'deposit',
      walletId: depositWalletId,
      amount,
      providerName: provider?.name ?? '',
    });
  }

  function handleWithdrawSubmit() {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawWalletId) { toast.error('Please select a source wallet'); return; }
    if (withdrawDestType === 'momo' && !withdrawProviderId) { toast.error('Please select a mobile money provider'); return; }
    if (!withdrawPhone || withdrawPhone.length < 10) { toast.error('Please enter a valid phone number'); return; }
    if (!amount || amount <= 0) { toast.error('Please enter a valid amount'); return; }

    const wallet = wallets.find((w) => w.id === withdrawWalletId);
    if (wallet && amount > wallet.balance) { toast.error('Insufficient balance'); return; }

    const providerName = withdrawDestType === 'momo'
      ? (mobileMoneyProviders.find((p) => p.id === withdrawProviderId)?.name ?? 'Bank Transfer')
      : 'Bank Transfer';

    setConfirmDialog({
      open: true,
      type: 'withdraw',
      walletId: withdrawWalletId,
      amount,
      providerName,
    });
  }

  function handleConfirmAction() {
    const { type, walletId, amount, providerName } = confirmDialog;

    if (type === 'deposit') {
      deposit(walletId, amount, providerName);
      toast.success(`Deposit of ${formatGHS(amount)} via ${providerName} is processing!`);
      setDepositAmount('');
      setDepositPin('');
      setDepositProviderId('');
    } else {
      withdraw(walletId, amount, providerName);
      toast.success(`Withdrawal of ${formatGHS(amount)} to ${providerName} is processing!`);
      setWithdrawAmount('');
      setWithdrawProviderId('');
    }

    setConfirmDialog({ open: false, type: 'deposit', walletId: '', amount: 0, providerName: '' });
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
      <motion.div variants={itemVariants} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
          <p className="text-sm text-slate-500">Manage your wallets, deposits, and withdrawals</p>
        </div>
        <Badge className="mt-2 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100 sm:mt-0">
          {wallets.filter((w) => w.status === 'active').length} Active Wallets
        </Badge>
      </motion.div>

      {/* ==============================
          Tabs Container
          ============================== */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="deposit" className="gap-1.5 text-xs sm:text-sm">
            <ArrowDownLeft className="h-4 w-4" />
            Deposit
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="gap-1.5 text-xs sm:text-sm">
            <ArrowUpRight className="h-4 w-4" />
            Withdraw
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            OVERVIEW TAB
            ========================================== */}
        <TabsContent value="overview" className="space-y-6">
          {/* ---- Total Balance Card ---- */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-0 shadow-lg shadow-emerald-900/10">
              <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 sm:px-8 sm:py-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/5" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/75">Total Balance</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white lg:text-4xl sm:text-5xl">
                      {formatGHS(totalBalance)}
                    </p>
                    <p className="mt-2 text-sm text-white/70">Across {wallets.length} wallets</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
                    <TrendingUp className="h-4 w-4 text-emerald-200" />
                    <span className="text-sm font-semibold text-white">+12.5%</span>
                    <span className="text-xs text-white/70">this month</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ---- Wallet Cards Grid ---- */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wallets.map((wallet) => {
                const WalletIcon = getWalletTypeIcon(wallet.type);
                return (
                  <motion.div
                    key={wallet.id}
                    whileHover={{ y: -3, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card className="overflow-hidden border-slate-200/80 shadow-sm transition-shadow hover:shadow-md mobile-card">
                      {/* Colored top strip */}
                      <div className={`h-2 bg-gradient-to-r ${getWalletTypeBg(wallet.type)}`} />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getWalletTypeBg(wallet.type)} shadow-sm`}>
                              <WalletIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {getWalletTypeLabel(wallet.type)}
                              </p>
                              <p className="text-xs text-slate-500">{wallet.currency}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(wallet.status)} capitalize`}>
                            {wallet.status}
                          </Badge>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                          {formatGHS(wallet.balance)}
                        </p>

                        {/* Provider / Account Info */}
                        <div className="mt-3 flex items-center gap-4">
                          {wallet.type === 'main' && wallet.provider && (
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-xs text-slate-500">{wallet.provider}</span>
                            </div>
                          )}
                          {wallet.type === 'main' && wallet.accountNumber && (
                            <span className="text-xs font-mono text-slate-400">{wallet.accountNumber}</span>
                          )}
                        </div>

                        {/* Extra badges */}
                        <div className="mt-3 flex items-center gap-2">
                          {wallet.type === 'savings' && (
                            <Badge className="h-5 bg-amber-100 text-[10px] font-medium text-amber-700 hover:bg-amber-100">
                              Auto-save
                            </Badge>
                          )}
                          {wallet.type === 'susu' && (
                            <Badge className="h-5 bg-violet-100 text-[10px] font-medium text-violet-700 hover:bg-violet-100">
                              Group savings
                            </Badge>
                          )}
                          {wallet.isDefault && (
                            <Badge className="h-5 bg-emerald-100 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100">
                              Default
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ---- Recent Wallet Activity ---- */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ y: -2 }}>
              <Card className="border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Recent Wallet Activity
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Last {recentWalletActivity.length} wallet transactions
                      </CardDescription>
                    </div>
                    <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {recentWalletActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Wallet className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-500">No wallet activity yet</p>
                      <p className="mt-1 text-xs text-slate-400">Make a deposit to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {recentWalletActivity.map((txn) => {
                        const typeInfo = getTxnTypeBadge(txn.type);
                        const positive = isPositiveAmount(txn.type);
                        return (
                          <motion.div
                            key={txn.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50/80"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                positive ? 'bg-emerald-100' : 'bg-red-100'
                              }`}>
                                {positive ? (
                                  <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">
                                  {txn.description}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="text-xs text-slate-400">{formatDate(txn.date)}</span>
                                  {txn.counterpartName && (
                                    <>
                                      <span className="text-slate-300">·</span>
                                      <span className="text-xs text-slate-400">{txn.counterpartName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${
                                positive ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {positive ? '+' : '-'}{formatGHS(txn.amount)}
                              </p>
                              <Badge className={`${getStatusColor(txn.status)} mt-1 h-4 text-[9px] font-medium capitalize px-1.5`}>
                                {txn.status}
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ==========================================
            DEPOSIT TAB
            ========================================== */}
        <TabsContent value="deposit" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left column: Form */}
            <div className="space-y-6 lg:col-span-3">
              {/* Select Wallet */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Deposit to Wallet</CardTitle>
                    <CardDescription>Select the wallet you want to deposit into</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-wallet">Target Wallet</Label>
                      <Select value={depositWalletId} onValueChange={(val) => {
                        setDepositWalletId(val);
                        const w = wallets.find((w) => w.id === val);
                        if (w?.accountNumber) setDepositPhone(w.accountNumber);
                      }}>
                        <SelectTrigger id="deposit-wallet">
                          <SelectValue placeholder="Select a wallet" />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {getWalletTypeLabel(w.type)} — {formatGHS(w.balance)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Mobile Money Provider Selection */}
              {depositWalletId && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-emerald-500" />
                        <div>
                          <CardTitle className="text-base">Mobile Money</CardTitle>
                          <CardDescription>Select your mobile money provider</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Provider Cards */}
                      <div className="grid grid-cols-3 gap-3 lg:grid-cols-3">
                        {mobileMoneyProviders.map((provider) => {
                          const isSelected = depositProviderId === provider.id;
                          return (
                            <motion.button
                              key={provider.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setDepositProviderId(provider.id)}
                              className={`relative mobile-card flex flex-col items-center gap-2 rounded-xl border-2 p-3 lg:p-4 transition-all touch-manipulation ${
                                isSelected
                                  ? 'border-transparent shadow-md'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                              style={isSelected ? { borderColor: provider.color } : undefined}
                            >
                              {isSelected && (
                                <div
                                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
                                  style={{ backgroundColor: provider.color }}
                                >
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                              <div
                                className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
                                style={{ backgroundColor: provider.bgColor }}
                              >
                                {provider.icon}
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-slate-800">{provider.shortName}</p>
                                <p className="text-[11px] text-slate-500">{provider.name}</p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Form fields after provider selection */}
                      {selectedDepositProvider && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4"
                        >
                          <Separator />

                          {/* Phone Number */}
                          <div className="space-y-2">
                            <Label htmlFor="deposit-phone">Phone Number</Label>
                            <div className="relative">
                              <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                id="deposit-phone"
                                type="tel"
                                placeholder="e.g. 0241234567"
                                value={depositPhone}
                                onChange={(e) => setDepositPhone(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="space-y-2">
                            <Label htmlFor="deposit-amount">Amount</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                                ₵
                              </span>
                              <Input
                                id="deposit-amount"
                                type="number"
                                inputMode="numeric"
                                placeholder="0.00"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="pl-12"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>

                          {/* MoMo PIN */}
                          <div className="space-y-2">
                            <Label htmlFor="deposit-pin">MoMo PIN</Label>
                            <div className="relative">
                              <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                id="deposit-pin"
                                type="password"
                                inputMode="numeric"
                                placeholder="Enter your PIN"
                                value={depositPin}
                                onChange={(e) => setDepositPin(e.target.value)}
                                className="pl-10"
                                maxLength={6}
                              />
                            </div>
                          </div>

                          {/* Fee info */}
                          {parseFloat(depositAmount) > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg bg-slate-50 p-3"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Amount</span>
                                <span className="font-semibold text-slate-800">{formatGHS(parseFloat(depositAmount))}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="text-slate-600">Fee</span>
                                <span className="font-medium text-slate-500">{formatGHS(depositFeeAmount)}</span>
                              </div>
                              <Separator className="my-2" />
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-800">You deposit</span>
                                <span className="font-bold text-emerald-600">{formatGHS(parseFloat(depositAmount) - depositFeeAmount)}</span>
                              </div>
                            </motion.div>
                          )}

                          {/* Deposit Button */}
                          <Button
                            onClick={handleDepositSubmit}
                            className="w-full h-12 min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-700"
                            size="lg"
                          >
                            <ArrowDownLeft className="mr-2 h-4 w-4" />
                            Deposit Funds
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Right column: Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Fee Info Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">Deposit Fees</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-2">
                        <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold">₵0.00</span> for amounts under ₵5,000
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-2">
                        <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <p className="text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold">₵2.50</span> for amounts ₵5,000 – ₵10,000
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-2">
                        <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <p className="text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold">0.25%</span> for amounts above ₵10,000
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Amounts Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Deposit</CardTitle>
                    <CardDescription>Tap to set a common amount</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {['100', '500', '1000', '2000', '5000', '10000'].map((val) => (
                        <Button
                          key={val}
                          variant="outline"
                          className="border-slate-200 text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => setDepositAmount(val)}
                        >
                          {formatGHS(parseFloat(val))}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Security Info */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Secure Transactions</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                        All deposits are encrypted and processed through Bank of Ghana regulated channels.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </TabsContent>

        {/* ==========================================
            WITHDRAW TAB
            ========================================== */}
        <TabsContent value="withdraw" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left column: Form */}
            <div className="space-y-6 lg:col-span-3">
              {/* Select Source Wallet */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Withdraw from Wallet</CardTitle>
                    <CardDescription>Select the source wallet for withdrawal</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-wallet">Source Wallet</Label>
                      <Select value={withdrawWalletId} onValueChange={(val) => {
                        setWithdrawWalletId(val);
                        const w = wallets.find((w) => w.id === val);
                        if (w?.accountNumber) setWithdrawPhone(w.accountNumber);
                      }}>
                        <SelectTrigger id="withdraw-wallet">
                          <SelectValue placeholder="Select a wallet" />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {getWalletTypeLabel(w.type)} — {formatGHS(w.balance)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Withdrawal Form */}
              {withdrawWalletId && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                        <div>
                          <CardTitle className="text-base">Withdrawal Details</CardTitle>
                          <CardDescription>Enter amount and select destination</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                            ₵
                          </span>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            inputMode="numeric"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="pl-12"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {/* Available balance indicator */}
                        {withdrawWalletId && (
                          <p className="text-xs text-slate-400">
                            Available: {formatGHS(wallets.find((w) => w.id === withdrawWalletId)?.balance ?? 0)}
                          </p>
                        )}
                      </div>

                      {/* Destination Type */}
                      <div className="space-y-2">
                        <Label>Send To</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setWithdrawDestType('momo')}
                            className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
                              withdrawDestType === 'momo'
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Smartphone className={`h-5 w-5 ${withdrawDestType === 'momo' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-medium ${withdrawDestType === 'momo' ? 'text-emerald-700' : 'text-slate-600'}`}>
                              Mobile Money
                            </span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setWithdrawDestType('bank')}
                            className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${
                              withdrawDestType === 'bank'
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Building2 className={`h-5 w-5 ${withdrawDestType === 'bank' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-medium ${withdrawDestType === 'bank' ? 'text-emerald-700' : 'text-slate-600'}`}>
                              Bank Transfer
                            </span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Mobile Money Provider (if momo) */}
                      {withdrawDestType === 'momo' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2"
                        >
                          <Label>Mobile Money Provider</Label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {mobileMoneyProviders.map((provider) => {
                              const isSelected = withdrawProviderId === provider.id;
                              return (
                                <motion.button
                                  key={provider.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setWithdrawProviderId(provider.id)}
                                  className={`relative flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                    isSelected
                                      ? 'border-transparent shadow-sm'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                  style={isSelected ? { borderColor: provider.color } : undefined}
                                >
                                  {isSelected && (
                                    <div
                                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-white"
                                      style={{ backgroundColor: provider.color }}
                                    >
                                      <Check className="h-2.5 w-2.5" />
                                    </div>
                                  )}
                                  <span className="text-base">{provider.icon}</span>
                                  <span className="text-sm font-medium text-slate-700">{provider.shortName}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* Phone Number / Account */}
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-phone">
                          {withdrawDestType === 'momo' ? 'Phone Number' : 'Account Number'}
                        </Label>
                        <div className="relative">
                          {withdrawDestType === 'momo' ? (
                            <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          ) : (
                            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          )}
                          <Input
                            id="withdraw-phone"
                            type="tel"
                            placeholder={withdrawDestType === 'momo' ? 'e.g. 0241234567' : 'e.g. 001234567890'}
                            value={withdrawPhone}
                            onChange={(e) => setWithdrawPhone(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Fee Summary */}
                      {parseFloat(withdrawAmount) > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Withdrawal Amount</span>
                            <span className="font-semibold text-slate-800">{formatGHS(parseFloat(withdrawAmount))}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <Info className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-slate-600">
                                Fee ({withdrawDestType === 'momo' ? '1% MoMo' : '2% Bank'})
                              </span>
                            </div>
                            <span className="font-medium text-red-500">-{formatGHS(withdrawFee)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-800">You Receive</span>
                            <span className={`text-lg font-bold ${withdrawNet < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatGHS(Math.max(0, withdrawNet))}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Withdraw Button */}
                      <Button
                        onClick={handleWithdrawSubmit}
                        className="w-full h-12 min-h-[44px] bg-red-600 text-white hover:bg-red-700"
                        size="lg"
                      >
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Withdraw Funds
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Right column: Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Fee Info */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">Withdrawal Fees</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-2">
                        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Mobile Money</p>
                          <p className="mt-0.5 text-xs text-slate-600">1% of withdrawal amount</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Bank Transfer</p>
                          <p className="mt-0.5 text-xs text-slate-600">2% of withdrawal amount</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Amounts */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Withdraw</CardTitle>
                    <CardDescription>Tap to set a common amount</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {['100', '200', '500', '1000', '2000', '5000'].map((val) => (
                        <Button
                          key={val}
                          variant="outline"
                          className="border-slate-200 text-sm font-medium hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setWithdrawAmount(val)}
                        >
                          {formatGHS(parseFloat(val))}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Important Notice */}
              <motion.div variants={itemVariants}>
                <Card className="border-amber-200 bg-amber-50 shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <QrCode className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Processing Time</p>
                      <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
                        Mobile Money withdrawals are processed instantly. Bank transfers may take 1-3 business days.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Security Info */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Secure Withdrawals</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                        All withdrawals are protected by 2FA verification and processed through regulated payment channels.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mobile FAB - Quick Deposit */}
      <MobileFabWithLabel
        icon={ArrowDownLeft}
        label="Quick Deposit"
        onClick={() => {
          // Switch to deposit tab by clicking the trigger
          const depositTrigger = document.querySelector('[value="deposit"]') as HTMLElement;
          depositTrigger?.click();
        }}
      />

      {/* ==============================
          Confirmation Dialog
          ============================== */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.type === 'deposit' ? (
                <>
                  <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                  Confirm Deposit
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                  Confirm Withdrawal
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Please review the transaction details below
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Amount</span>
              <span className="font-bold text-slate-900">{formatGHS(confirmDialog.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {confirmDialog.type === 'deposit' ? 'Deposit to' : 'Withdraw from'}
              </span>
              <span className="font-medium text-slate-800">
                {getWalletTypeLabel(wallets.find((w) => w.id === confirmDialog.walletId)?.type ?? '')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {confirmDialog.type === 'deposit' ? 'Via' : 'Send to'}
              </span>
              <span className="font-medium text-slate-800">{confirmDialog.providerName}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={`flex-1 text-white sm:flex-none ${
                confirmDialog.type === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {confirmDialog.type === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
