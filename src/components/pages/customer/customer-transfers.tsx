'use client';

import { useState, useMemo } from 'react';
import { useCustomerStore } from '@/store/app-store';
import { formatGHS, formatDate, formatDateTime, getStatusColor } from '@/lib/formatters';
import { mobileMoneyProviders } from '@/lib/mock-data';
import type { Transfer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Send, ArrowLeftRight, Smartphone, Building2, Clock,
  CheckCircle2, XCircle, AlertCircle, Info, Copy, Check,
  Shield, Users, TrendingUp, Receipt, Filter, ArrowUpRight,
  Banknote, Search,
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

// ---- Mock Transfer History ----
const mockTransfers: Transfer[] = [
  {
    id: 'tf-001', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Efua Darko', recipientPhone: '0501112233',
    amount: 500, status: 'completed', date: '2026-04-18T14:30:00',
    reference: 'ISPT-A1B2C3D4', note: 'Market payment for fabrics',
  },
  {
    id: 'tf-002', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Kwame Asante', recipientPhone: '0209876543',
    amount: 1200, status: 'completed', date: '2026-04-16T10:15:00',
    reference: 'ISPT-E5F6G7H8', note: 'Susu group contribution',
  },
  {
    id: 'tf-003', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Adwoa Poku', recipientPhone: '0237788990',
    amount: 350, status: 'pending', date: '2026-04-18T16:00:00',
    reference: 'ISPT-I9J0K1L2', note: 'School fees advance',
  },
  {
    id: 'tf-004', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Kofi Boateng', recipientPhone: '0274455667',
    amount: 2500, status: 'failed', date: '2026-04-15T09:45:00',
    reference: 'ISPT-M3N4O5P6', note: 'Failed due to insufficient balance',
  },
  {
    id: 'tf-005', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Abena Frimpong', recipientPhone: '0502233445',
    amount: 800, status: 'completed', date: '2026-04-12T11:20:00',
    reference: 'ISPT-Q7R8S9T0', note: '',
  },
  {
    id: 'tf-006', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Grace Owusu', recipientPhone: '0203344556',
    amount: 1500, status: 'reversed', date: '2026-04-10T08:30:00',
    reference: 'ISPT-U1V2W3X4', note: 'Reversed - wrong recipient',
  },
  {
    id: 'tf-007', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Patricia Ampah', recipientPhone: '0246677889',
    amount: 600, status: 'completed', date: '2026-04-08T15:10:00',
    reference: 'ISPT-Y5Z6A7B8', note: 'Monthly susu payout share',
  },
  {
    id: 'tf-008', senderId: 'usr-001', senderName: 'Ama Mensah',
    recipientName: 'Emmanuel Osei', recipientPhone: '0265566778',
    amount: 2000, status: 'completed', date: '2026-04-05T13:45:00',
    reference: 'ISPT-C9D0E1F2', note: 'Agent collection payment',
  },
];

// ---- Helper: Status badge config ----
function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return CheckCircle2;
    case 'pending': return Clock;
    case 'failed': return XCircle;
    case 'reversed': return AlertCircle;
    default: return Clock;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'pending': return 'Processing';
    case 'failed': return 'Failed';
    case 'reversed': return 'Reversed';
    default: return status;
  }
}

// ---- Known recipients lookup ----
const knownRecipients: Record<string, string> = {
  '0501112233': 'Efua Darko',
  '0209876543': 'Kwame Asante',
  '0237788990': 'Adwoa Poku',
  '0274455667': 'Kofi Boateng',
  '0502233445': 'Abena Frimpong',
  '0203344556': 'Grace Owusu',
  '0246677889': 'Patricia Ampah',
  '0265566778': 'Emmanuel Osei',
};

// ============================================================
// Main Component
// ============================================================
export function CustomerTransfers() {
  const { user, wallets, transactions } = useCustomerStore();
  const mainWallet = wallets.find((w) => w.type === 'main');

  // ---- Summary stats ----
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const transfersThisMonth = mockTransfers.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalTransferredThisMonth = transfersThisMonth
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentCount = mockTransfers.filter((t) => {
    const d = new Date(t.date);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && t.status === 'completed';
  }).length;

  // ---- Send Money state ----
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendProviderId, setSendProviderId] = useState('');
  const [sendMethod, setSendMethod] = useState<'momo' | 'bank'>('momo');
  const [sendNote, setSendNote] = useState('');

  // ---- Auto-fill recipient name on phone change ----
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setRecipientPhone(cleaned);
    const match = knownRecipients[cleaned];
    if (match) setRecipientName(match);
    else setRecipientName('');
  };

  // ---- Transfer fee calculation ----
  const amountNum = parseFloat(sendAmount) || 0;
  const transferFee = sendMethod === 'momo' ? amountNum * 0.01 : amountNum * 0.02;
  const totalDebit = amountNum + transferFee;

  // ---- Selected provider ----
  const selectedProvider = mobileMoneyProviders.find((p) => p.id === sendProviderId);

  // ---- Confirmation dialog ----
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ---- Handle send submit ----
  function handleSendSubmit() {
    if (!recipientPhone || recipientPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!recipientName.trim()) {
      toast.error('Please enter the recipient name');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (sendMethod === 'momo' && !sendProviderId) {
      toast.error('Please select a mobile money provider');
      return;
    }
    if (mainWallet && totalDebit > mainWallet.balance) {
      toast.error('Insufficient wallet balance for this transfer');
      return;
    }
    setConfirmOpen(true);
  }

  // ---- Confirm transfer ----
  function handleConfirmTransfer() {
    toast.success('Transfer initiated successfully!', {
      description: `${formatGHS(amountNum)} to ${recipientName} (${recipientPhone}). Reference: ISPT${Date.now().toString(36).toUpperCase()}`,
    });
    // Reset form
    setRecipientPhone('');
    setRecipientName('');
    setSendAmount('');
    setSendProviderId('');
    setSendMethod('momo');
    setSendNote('');
    setConfirmOpen(false);
  }

  // ---- History filter state ----
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransfers = useMemo(() => {
    return mockTransfers.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = t.recipientName.toLowerCase().includes(q)
          || t.recipientPhone.includes(q)
          || t.reference.toLowerCase().includes(q)
          || (t.note && t.note.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [statusFilter, searchQuery]);

  const resetHistoryFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || searchQuery !== '';

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
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Money Transfer</h1>
          <p className="text-sm text-muted-foreground">
            Send money instantly to anyone in Ghana
          </p>
        </div>
        <Badge className="mt-2 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 sm:mt-0">
          {mockTransfers.filter((t) => t.status === 'completed').length} Successful Transfers
        </Badge>
      </motion.div>

      {/* ==============================
          Summary Cards
          ============================== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Transferred This Month */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Sent This Month</p>
                    <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {formatGHS(totalTransferredThisMonth)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {transfersThisMonth.length} transfer{transfersThisMonth.length !== 1 ? 's' : ''} in {now.toLocaleString('en-US', { month: 'long' })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transfers */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Last 7 Days</p>
                    <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {recentCount}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Successful transfers this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transfer Fee Info */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Transfer Fee</p>
                    <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      1% / 2%
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                1% MoMo &bull; 2% Bank Transfer
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ==============================
          Tabs Container
          ============================== */}
      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[360px]">
          <TabsTrigger value="send" className="gap-1.5 text-xs sm:text-sm">
            <Send className="h-4 w-4" />
            Send Money
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" />
            Transfer History
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            SEND MONEY TAB
            ========================================== */}
        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left column: Send Form */}
            <div className="space-y-6 lg:col-span-3">
              {/* Transfer Method Selection */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Send To</CardTitle>
                    <CardDescription>Choose your transfer method</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSendMethod('momo')}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 lg:p-4 transition-all touch-manipulation min-h-[44px] lg:min-h-0 ${
                          sendMethod === 'momo'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <Smartphone className={`h-5 w-5 ${sendMethod === 'momo' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className={`text-sm font-medium ${sendMethod === 'momo' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                          Mobile Money
                        </span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSendMethod('bank')}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 lg:p-4 transition-all touch-manipulation min-h-[44px] lg:min-h-0 ${
                          sendMethod === 'bank'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <Building2 className={`h-5 w-5 ${sendMethod === 'bank' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className={`text-sm font-medium ${sendMethod === 'bank' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                          Bank Transfer
                        </span>
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recipient & Amount Form */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-500" />
                      <div>
                        <CardTitle className="text-base">Transfer Details</CardTitle>
                        <CardDescription>Enter recipient information and amount</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Recipient Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient-phone">Recipient Phone Number</Label>
                      <div className="flex items-stretch gap-2">
                        <div className="flex items-center rounded-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          +233
                        </div>
                        <Input
                          id="recipient-phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="e.g. 0241234567"
                          value={recipientPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="min-h-[44px] lg:min-h-0"
                          maxLength={10}
                        />
                      </div>
                      {recipientPhone.length >= 10 && recipientName && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          iSusuPro user found: {recipientName}
                        </p>
                      )}
                    </div>

                    {/* Recipient Name */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient-name">Recipient Name</Label>
                      <Input
                        id="recipient-name"
                        type="text"
                        placeholder="Enter full name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="min-h-[44px] lg:min-h-0"
                      />
                    </div>

                    {/* Mobile Money Provider (if MoMo selected) */}
                    {sendMethod === 'momo' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <Label>Mobile Money Provider</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {mobileMoneyProviders.map((provider) => {
                            const isSelected = sendProviderId === provider.id;
                            return (
                              <motion.button
                                key={provider.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSendProviderId(provider.id)}
                                className={`relative mobile-card haptic-feedback flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all touch-manipulation min-h-[44px] lg:min-h-0 ${
                                  isSelected
                                    ? 'border-transparent shadow-md'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                                style={isSelected ? { borderColor: provider.color } : undefined}
                              >
                                {isSelected && (
                                  <div
                                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                                    style={{ backgroundColor: provider.color }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                                <div
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                                  style={{ backgroundColor: provider.bgColor }}
                                >
                                  {provider.icon}
                                </div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {provider.shortName}
                                </p>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="send-amount">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          ₵
                        </span>
                        <Input
                          id="send-amount"
                          type="number"
                          inputMode="numeric"
                          placeholder="0.00"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          className="pl-12 min-h-[44px] lg:min-h-0"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {mainWallet && (
                        <p className="text-xs text-muted-foreground">
                          Available balance: <span className="font-semibold text-foreground">{formatGHS(mainWallet.balance)}</span>
                        </p>
                      )}
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                      <Label htmlFor="send-note">
                        Note <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Textarea
                        id="send-note"
                        placeholder="What is this transfer for?"
                        value={sendNote}
                        onChange={(e) => setSendNote(e.target.value)}
                        className="resize-none min-h-[44px] lg:min-h-0"
                        rows={2}
                      />
                    </div>

                    {/* Fee Calculation */}
                    {amountNum > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Transfer amount</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{formatGHS(amountNum)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fee ({sendMethod === 'momo' ? '1%' : '2%'} {sendMethod === 'momo' ? 'MoMo' : 'Bank'})</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">+ {formatGHS(transferFee)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">Total debit</span>
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatGHS(totalDebit)}</span>
                        </div>
                        {mainWallet && totalDebit > mainWallet.balance && (
                          <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Insufficient balance
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Send Button */}
                    <Button
                      onClick={handleSendSubmit}
                      className="w-full h-12 min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-700"
                      size="lg"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send {amountNum > 0 ? formatGHS(amountNum) : 'Money'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right column: Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Fee Info */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">Transfer Fees</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <div className="flex items-start gap-2">
                        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-semibold">Mobile Money: 1%</span> of transfer amount
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-semibold">Bank Transfer: 2%</span> of transfer amount
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-semibold">Free</span> for iSusuPro-to-iSusuPro transfers
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Amounts */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Amount</CardTitle>
                    <CardDescription>Tap to set a common amount</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {['100', '200', '500', '1000', '2000', '5000'].map((val) => (
                        <Button
                          key={val}
                          variant="outline"
                          className="border-slate-200 dark:border-slate-700 text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 min-h-[44px] lg:min-h-0"
                          onClick={() => setSendAmount(val)}
                        >
                          ₵{parseInt(val).toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Security Info */}
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Secure Transfers</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        All transfers are encrypted and processed through Bank of Ghana regulated payment channels.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </TabsContent>

        {/* ==========================================
            TRANSFER HISTORY TAB
            ========================================== */}
        <TabsContent value="history" className="space-y-6">
          {/* Filter Bar */}
          <motion.div variants={itemVariants}>
            <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, phone, or reference..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 min-h-[44px] lg:min-h-0"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto overscroll-x-contain flex-nowrap">
                    <Select
                      value={statusFilter}
                      onValueChange={(val) => setStatusFilter(val)}
                    >
                      <SelectTrigger className="w-[150px] min-h-[44px] lg:min-h-0">
                        <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="reversed">Reversed</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetHistoryFilters}
                        className="min-h-[44px] lg:min-h-0"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary bar */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing <span className="font-medium text-foreground">{filteredTransfers.length}</span> transfer{filteredTransfers.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <span className="hidden sm:inline">
                (filtered from {mockTransfers.length} total)
              </span>
            )}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block border-slate-200/80 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto overscroll-contain">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="w-[120px]">Phone</TableHead>
                      <TableHead className="text-right w-[120px]">Amount</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[130px]">Reference</TableHead>
                      <TableHead className="w-[100px]">Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ArrowLeftRight className="h-10 w-10" />
                            <p className="text-lg font-medium">No transfers found</p>
                            <p className="text-sm">
                              {hasActiveFilters
                                ? 'Try adjusting your search or filter criteria.'
                                : 'You have not made any transfers yet. Send money to get started!'}
                            </p>
                            {hasActiveFilters && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetHistoryFilters}
                                className="mt-1"
                              >
                                Clear Filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransfers.map((transfer) => {
                        const StatusIcon = getStatusIcon(transfer.status);
                        return (
                          <TableRow key={transfer.id} className="group">
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatDateTime(transfer.date)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{transfer.recipientName}</span>
                                {transfer.note && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {transfer.note}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {transfer.recipientPhone}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-red-600 dark:text-red-400">
                              -{formatGHS(transfer.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-xs capitalize ${getStatusColor(transfer.status)}`}
                              >
                                {getStatusText(transfer.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {transfer.reference.slice(0, 12)}...
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs font-normal">
                                {transfer.recipientPhone.startsWith('0') ? 'MoMo' : 'Bank'}
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
            {filteredTransfers.length === 0 ? (
              <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm">
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                  <ArrowLeftRight className="h-10 w-10" />
                  <p className="text-lg font-medium">No transfers found</p>
                  <p className="text-sm">
                    {hasActiveFilters
                      ? 'Try adjusting your search or filter criteria.'
                      : 'You have not made any transfers yet. Send money to get started!'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={resetHistoryFilters} className="mt-1">
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredTransfers.map((transfer) => {
                const StatusIcon = getStatusIcon(transfer.status);
                return (
                  <motion.div
                    key={transfer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="border-slate-200/80 dark:border-slate-700/50 shadow-sm mobile-card">
                      <CardContent className="p-4 mobile-list-item">
                        <div className="flex items-start gap-3 min-h-[60px]">
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            transfer.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30'
                              : transfer.status === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            <ArrowUpRight className={`h-4 w-4 ${
                              transfer.status === 'completed'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : transfer.status === 'pending'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate text-slate-900 dark:text-slate-100">{transfer.recipientName}</p>
                              <span className="font-semibold tabular-nums whitespace-nowrap text-red-600 dark:text-red-400">
                                -{formatGHS(transfer.amount)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{transfer.recipientPhone}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] capitalize px-1.5 py-0 ${getStatusColor(transfer.status)}`}
                              >
                                {getStatusText(transfer.status)}
                              </Badge>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDateTime(transfer.date)}</span>
                              <span className="font-mono">{transfer.reference.slice(0, 12)}...</span>
                            </div>
                            {transfer.note && (
                              <p className="mt-1.5 text-xs text-muted-foreground truncate bg-slate-50 dark:bg-slate-800/50 rounded px-2 py-1">
                                {transfer.note}
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
      </Tabs>

      {/* ==============================
          Confirmation Dialog
          ============================== */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Confirm Transfer
            </DialogTitle>
            <DialogDescription>
              Please review the details below before confirming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{recipientName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium font-mono text-slate-900 dark:text-slate-100">+233 {recipientPhone}</span>
              </div>
              {sendMethod === 'momo' && selectedProvider && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{selectedProvider.name}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatGHS(amountNum)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fee ({sendMethod === 'momo' ? '1%' : '2%'} {sendMethod === 'momo' ? 'MoMo' : 'Bank'})</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">+ {formatGHS(transferFee)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatGHS(totalDebit)}</span>
              </div>
              {sendNote && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Note: </span>
                    <span className="text-slate-700 dark:text-slate-300">{sendNote}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                This action cannot be undone. Please verify the recipient details carefully before confirming.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="w-full sm:w-auto min-h-[44px] lg:min-h-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 min-h-[44px] lg:min-h-0"
            >
              <Send className="mr-2 h-4 w-4" />
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
