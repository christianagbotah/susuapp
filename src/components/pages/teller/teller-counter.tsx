'use client';

import { useState } from 'react';
import { useTellerStore } from '@/store/staff-stores';
import { formatGHS, generateReference } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Banknote, Smartphone, FileText, CheckCircle2, ArrowRight, CircleDot } from 'lucide-react';
import type { CounterTransaction } from '@/lib/types';

const typeMeta: Record<CounterTransaction['type'], { label: string; icon: React.ElementType; color: string }> = {
  deposit: { label: 'Deposit', icon: Banknote, color: 'text-emerald-600' },
  withdrawal: { label: 'Withdrawal', icon: Banknote, color: 'text-amber-600' },
  susu_collection: { label: 'Susu Collection', icon: CircleDot, color: 'text-blue-600' },
  loan_repayment: { label: 'Loan Repayment', icon: FileText, color: 'text-purple-600' },
  bill_payment: { label: 'Bill Payment', icon: Smartphone, color: 'text-cyan-600' },
};

const channelLabel: Record<CounterTransaction['channel'], string> = {
  cash: 'Cash', momo_mtn: 'MTN MoMo', momo_telecel: 'Telecel Cash', momo_at: 'AT Money', cheque: 'Cheque',
};

export function TellerCounter() {
  const { queue, processNext, serveCustomer } = useTellerStore();
  const [serveOpen, setServeOpen] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', type: 'deposit' as CounterTransaction['type'], amount: '', channel: 'cash' as CounterTransaction['channel'] });

  const waiting = queue.filter(q => q.status === 'waiting');
  const now = queue.filter(q => q.status === 'processing');
  const done = queue.filter(q => q.status === 'completed').sort((a, b) => b.queueNo - a.queueNo);

  const handleComplete = (tx: CounterTransaction) => {
    processNext(tx.id, 'completed');
    toast.success(`#${tx.queueNo} completed — ${tx.customerName}`, {
      description: `${formatGHS(tx.amount)} via ${channelLabel[tx.channel]} · Receipt TRX-${Math.floor(10000 + Math.random() * 89999)} sent by SMS.`,
    });
  };

  const handleServe = () => {
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error('Customer name, phone and a valid amount are required.');
      return;
    }
    serveCustomer({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      type: form.type,
      amount: Number(form.amount),
      channel: form.channel,
      reference: generateReference(),
    });
    toast.success('Transaction posted', { description: `${formatGHS(Number(form.amount))} — customer receipt sent by SMS.` });
    setServeOpen(false);
    setForm({ customerName: '', customerPhone: '', type: 'deposit', amount: '', channel: 'cash' });
  };

  const row = (tx: CounterTransaction, actions?: React.ReactNode) => {
    const meta = typeMeta[tx.type];
    return (
      <div key={tx.id} className="flex flex-col gap-2.5 rounded-lg border p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted font-bold text-sm ${tx.status === 'waiting' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
            {tx.queueNo}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{tx.customerName} <span className="font-normal text-muted-foreground">· {tx.customerPhone}</span></p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} /> {meta.label} · {channelLabel[tx.channel]} · {tx.time}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <p className="text-sm font-bold">{formatGHS(tx.amount)}</p>
          {actions}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-cyan-500" /> Counter Queue</h2>
        <Button className="min-h-[44px] touch-manipulation" onClick={() => setServeOpen(true)}>
          <Banknote className="mr-2 h-4 w-4" /> New Walk-in Transaction
        </Button>
      </div>

      {/* Processing now */}
      {now.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Processing</p>
          {now.map(tx => row(tx, (
            <Button size="sm" className="min-h-[40px] bg-emerald-600 hover:bg-emerald-700 touch-manipulation" onClick={() => handleComplete(tx)}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete
            </Button>
          )))}
        </div>
      )}

      {/* Waiting */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Waiting ({waiting.length})</p>
        <AnimatePresence>
          {waiting.map(tx => row(tx, (
            <Button size="sm" variant="outline" className="min-h-[40px] touch-manipulation" onClick={() => processNext(tx.id, 'processing')}>
              Call <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )))}
        </AnimatePresence>
        {waiting.length === 0 && (
          <Card><CardContent className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> No one waiting — serve walk-ins below.
          </CardContent></Card>
        )}
      </div>

      {/* Completed */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Completed Today ({done.length})</p>
        {done.map(tx => row(tx, <Badge className="bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Done</Badge>))}
      </div>

      {/* New transaction dialog */}
      <Dialog open={serveOpen} onOpenChange={setServeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Walk-in Transaction</DialogTitle>
            <DialogDescription>Post a counter transaction — receipt goes to the customer by SMS.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Customer name</Label>
                <Input placeholder="e.g. Grace Tetteh" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="024 400 1290" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as CounterTransaction['type'] }))}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v as CounterTransaction['channel'] }))}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(channelLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₵)</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="min-h-[44px] text-lg font-semibold" />
            </div>
            {form.type === 'withdrawal' && Number(form.amount) > 5000 && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                Withdrawals above ₵5,000 require Branch Manager co-signature on the voucher.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setServeOpen(false)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handleServe}>Post Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
