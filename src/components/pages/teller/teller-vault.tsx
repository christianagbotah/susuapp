'use client';

import { Fragment, useState } from 'react';
import { useTellerStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { Vault, Landmark, ArrowRightLeft, Send, ShieldCheck, Check } from 'lucide-react';
import type { VaultTransfer } from '@/lib/types';

const directionMeta: Record<VaultTransfer['direction'], { label: string; icon: React.ElementType; color: string; bg: string }> = {
  to_vault: { label: 'Cash → Vault', icon: Vault, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  from_vault: { label: 'Vault → Drawer', icon: Vault, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  to_bank: { label: 'Drawer → Bank', icon: Landmark, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  from_bank: { label: 'Bank → Drawer', icon: Landmark, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const statusBadge = (s: VaultTransfer['status']) => ({
  requested: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_transit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}[s]);

const statusFlow: VaultTransfer['status'][] = ['requested', 'approved', 'in_transit', 'completed'];

const openOnKey = (fn: () => void) => (e: React.KeyboardEvent<HTMLDivElement>): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

function DetailField({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function TellerVault() {
  const { transfers, requestTransfer, markTransferStatus, user } = useTellerStore();
  const [open, setOpen] = useState(false);
  const [detailTransfer, setDetailTransfer] = useState<VaultTransfer | null>(null);
  const [form, setForm] = useState({ direction: 'to_vault' as VaultTransfer['direction'], amount: '', bank: '', note: '' });

  // Confirmation dialog for sensitive actions
  const [confirmDialog, askConfirm] = useConfirm();

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    if ((form.direction === 'to_bank' || form.direction === 'from_bank') && !form.bank) {
      toast.error('Select the bank for this transfer.');
      return;
    }
    requestTransfer({
      direction: form.direction,
      amount: Number(form.amount),
      bank: form.bank || undefined,
      note: form.note.trim() || undefined,
    });
    toast.success('Transfer requested', {
      description: `${formatGHS(Number(form.amount))} — awaiting Branch Manager approval. You will be notified.`,
    });
    setOpen(false);
    setForm({ direction: 'to_vault', amount: '', bank: '', note: '' });
  };

  const advance = (t: VaultTransfer) => {
    const next: VaultTransfer['status'] = t.status === 'requested' ? 'approved' : t.status === 'approved' ? 'in_transit' : 'completed';
    const actionLabel = t.status === 'requested' ? 'Approve Transfer (BM)' : t.status === 'approved' ? 'Mark In Transit' : 'Confirm Delivered';
    askConfirm({
      title: actionLabel,
      description: 'This is a dual-control cash movement. Your action will be recorded in the audit trail with your name, branch, and timestamp.',
      subject: `${directionMeta[t.direction].label} — ${formatGHS(t.amount)}`,
      details: [
        { label: 'Reference', value: t.id },
        { label: 'Bank', value: t.bank ?? '—' },
        { label: 'Note', value: t.note ?? '—' },
        { label: 'New Status', value: next.replace(/_/g, ' ') },
      ],
      confirmLabel: `Yes, ${actionLabel}`,
      variant: t.status === 'requested' ? 'success' : 'default',
      onConfirm: () => {
        markTransferStatus(t.id, next);
        toast.info(`Transfer ${next.replace(/_/g, ' ')}`, { description: `${formatGHS(t.amount)} — ${t.note ?? t.bank ?? 'vault movement'}` });
      },
    });
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ArrowRightLeft className="h-5 w-5 text-amber-500" /> Vault & Bank Transfers</h2>
          <p className="text-xs text-muted-foreground">All movements are dual-controlled: teller requests, Branch Manager approves.</p>
        </div>
        <Button className="min-h-[44px] touch-manipulation" onClick={() => setOpen(true)}>
          <Send className="mr-2 h-4 w-4" /> Request Transfer
        </Button>
      </div>

      <div className="space-y-2">
        {transfers.map((t, i) => {
          const meta = directionMeta[t.direction];
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
              <Card
                role="button"
                tabIndex={0}
                aria-label={`Open transfer details — ${meta.label} ${formatGHS(t.amount)}`}
                onClick={() => setDetailTransfer(t)}
                onKeyDown={openOnKey(() => setDetailTransfer(t))}
                className="mobile-card cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <CardContent className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                      <meta.icon className={`h-5 w-5 ${meta.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{meta.label} — <span className="font-bold">{formatGHS(t.amount)}</span></p>
                      <p className="truncate text-xs text-muted-foreground">{t.bank ?? t.note ?? '—'} · {formatDate(t.date)}</p>
                      <p className="text-[11px] text-muted-foreground">{t.requestedBy}{t.approvedBy ? ` → approved by ${t.approvedBy}` : ' · awaiting approval'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Badge className={`text-[10px] capitalize ${statusBadge(t.status)}`}>{t.status.replace(/_/g, ' ')}</Badge>
                    {t.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="min-h-[40px] touch-manipulation" onClick={e => { e.stopPropagation(); advance(t); }}>
                        {t.status === 'requested' ? 'Approve (BM)' : t.status === 'approved' ? 'Mark In Transit' : 'Confirm Delivered'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-l-4 border-blue-500">
        <CardContent className="flex items-start gap-2 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Dual control policy:</span> cash movements above ₵20,000 require a second custodian signature and bullion van for bank runs above ₵50,000. {user.name}, your approvals are logged for BoG inspection.
          </p>
        </CardContent>
      </Card>

      {/* Request dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Cash Transfer</DialogTitle>
            <DialogDescription>Vault & bank movements — Branch Manager approves before execution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v as VaultTransfer['direction'] }))}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(directionMeta) as VaultTransfer['direction'][]).map(d => (
                    <SelectItem key={d} value={d}>{directionMeta[d].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₵)</Label>
                <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="min-h-[44px]" />
              </div>
              {(form.direction === 'to_bank' || form.direction === 'from_bank') && (
                <div className="space-y-1.5">
                  <Label>Bank</Label>
                  <Select value={form.bank} onValueChange={v => setForm(f => ({ ...f, bank: v }))}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select bank" /></SelectTrigger>
                    <SelectContent>
                      {['GCB Bank — Makola', 'Ecobank Ghana — Kaneshie', 'Absa Ghana — High Street', 'Fidelity Bank — Accra Central'].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input placeholder="e.g. Daily banking — cash deposit" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handleSubmit}><Send className="mr-2 h-4 w-4" /> Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer detail dialog */}
      <Dialog open={!!detailTransfer} onOpenChange={() => setDetailTransfer(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
            <DialogDescription>Dual-controlled cash movement — full record &amp; status timeline.</DialogDescription>
          </DialogHeader>
          {detailTransfer && (() => {
            const meta = directionMeta[detailTransfer.direction];
            const step = statusFlow.indexOf(detailTransfer.status);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                    <meta.icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{meta.label} — {formatGHS(detailTransfer.amount)}</p>
                    <Badge className={`mt-1 text-[10px] capitalize ${statusBadge(detailTransfer.status)}`}>
                      {detailTransfer.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-3 text-sm font-semibold">Status Timeline</h4>
                  <div className="flex items-start">
                    {statusFlow.map((s, i) => (
                      <Fragment key={s}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= step ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                            {i < step ? <Check className="h-3 w-3" /> : i + 1}
                          </div>
                          <span className={`text-[10px] capitalize ${i <= step ? 'font-medium text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            {s.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {i < statusFlow.length - 1 && <div className={`mx-1 mt-3 h-0.5 flex-1 ${i < step ? 'bg-emerald-500' : 'bg-muted'}`} />}
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <DetailField label="Reference" value={detailTransfer.id} />
                    <DetailField label="Date" value={formatDate(detailTransfer.date)} />
                    <DetailField label="Amount" value={<span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatGHS(detailTransfer.amount)}</span>} />
                    <DetailField label="Direction" value={meta.label} />
                    <DetailField label="Bank" value={detailTransfer.bank ?? '—'} />
                    <DetailField label="Status" value={<span className="capitalize">{detailTransfer.status.replace(/_/g, ' ')}</span>} />
                    <DetailField label="Requested by" value={detailTransfer.requestedBy} />
                    <DetailField label="Approved by" value={detailTransfer.approvedBy ?? 'Awaiting BM approval'} />
                    <DetailField label="Note" value={detailTransfer.note ?? '—'} wide />
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
