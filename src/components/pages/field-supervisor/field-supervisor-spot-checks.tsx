'use client';

import { useState } from 'react';
import { useFieldSupervisorStore } from '@/store/staff-stores';
import { formatDate, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ClipboardCheck, Plus, ShieldCheck, AlertTriangle, Star, ReceiptText } from 'lucide-react';
import type { SpotCheck } from '@/lib/types';

const ratingMeta: Record<SpotCheck['rating'], { badge: string; icon: React.ElementType }> = {
  excellent: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: Star },
  good: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: ShieldCheck },
  needs_improvement: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: AlertTriangle },
  poor: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
};

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

export function FieldSupervisorSpotChecks() {
  const { spotChecks, agents, logSpotCheck } = useFieldSupervisorStore();
  const [open, setOpen] = useState(false);
  const [detailCheck, setDetailCheck] = useState<SpotCheck | null>(null);
  const [form, setForm] = useState({
    agentId: '',
    customersChecked: '',
    receiptsIssued: '',
    cashMatched: true,
    issues: '',
    notes: '',
    rating: 'good' as SpotCheck['rating'],
  });

  const handleSave = () => {
    const agent = agents.find(a => a.id === form.agentId);
    if (!agent) { toast.error('Select the agent you checked.'); return; }
    if (!form.customersChecked || !form.receiptsIssued) { toast.error('Enter customers checked and receipts issued.'); return; }
    logSpotCheck({
      agentId: agent.id,
      agentName: agent.name,
      customersChecked: Number(form.customersChecked),
      receiptsIssued: Number(form.receiptsIssued),
      cashMatched: form.cashMatched,
      issuesFound: form.issues.split('\n').map(s => s.trim()).filter(Boolean),
      rating: form.rating,
      notes: form.notes.trim() || 'No additional notes.',
    });
    toast.success('Spot check logged', {
      description: `${agent.name} — ${form.rating.replace(/_/g, ' ')}. ${form.cashMatched ? 'Cash matched records.' : 'Cash variance flagged for follow-up.'}`,
    });
    setOpen(false);
    setForm({ agentId: '', customersChecked: '', receiptsIssued: '', cashMatched: true, issues: '', notes: '', rating: 'good' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ClipboardCheck className="h-5 w-5 text-amber-500" /> Collection Spot Checks</h2>
          <p className="text-xs text-muted-foreground">Unannounced verifications protect customers & the institution (BoG operational risk requirement).</p>
        </div>
        <Button className="min-h-[44px] touch-manipulation" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Spot Check
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {spotChecks.map((sc, i) => {
          const meta = ratingMeta[sc.rating];
          const Icon = meta.icon;
          return (
            <motion.div key={sc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card
                role="button"
                tabIndex={0}
                aria-label={`Open spot check details — ${sc.agentName}`}
                onClick={() => setDetailCheck(sc)}
                onKeyDown={openOnKey(() => setDetailCheck(sc))}
                className="mobile-card h-full cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <span>{sc.agentName}</span>
                    <Badge className={`text-[10px] capitalize ${meta.badge}`}><Icon className="mr-1 h-3 w-3" />{sc.rating.replace(/_/g, ' ')}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-sm font-bold">{sc.customersChecked}</p>
                      <p className="text-[9px] text-muted-foreground">checked</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="flex items-center justify-center gap-1 text-sm font-bold"><ReceiptText className="h-3.5 w-3.5 text-muted-foreground" />{sc.receiptsIssued}</p>
                      <p className="text-[9px] text-muted-foreground">receipts</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className={`text-sm font-bold ${sc.cashMatched ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{sc.cashMatched ? 'Yes' : 'No'}</p>
                      <p className="text-[9px] text-muted-foreground">cash matched</p>
                    </div>
                  </div>
                  {sc.issuesFound.length > 0 && (
                    <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800 dark:bg-amber-900/20">
                      {sc.issuesFound.map((issue, idx) => (
                        <p key={idx} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-200">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {issue}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{sc.notes}</p>
                  <p className="border-t pt-2 text-[11px] text-muted-foreground">Verified by {sc.verifiedBy} · {formatDate(sc.date)}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* New check dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Spot Check</DialogTitle>
            <DialogDescription>Record an unannounced field verification of an agent's collections.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Agent</Label>
              <Select value={form.agentId} onValueChange={v => setForm(f => ({ ...f, agentId: v }))}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name} — {a.area}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Customers checked</Label>
                <Input type="number" min={1} value={form.customersChecked} onChange={e => setForm(f => ({ ...f, customersChecked: e.target.value }))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label>Receipts issued</Label>
                <Input type="number" min={0} value={form.receiptsIssued} onChange={e => setForm(f => ({ ...f, receiptsIssued: e.target.value }))} className="min-h-[44px]" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Cash matched records</Label>
                <p className="text-xs text-muted-foreground">Physical cash equals passbook + app entries</p>
              </div>
              <Switch checked={form.cashMatched} onCheckedChange={v => setForm(f => ({ ...f, cashMatched: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <Select value={form.rating} onValueChange={v => setForm(f => ({ ...f, rating: v as SpotCheck['rating'] }))}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="needs_improvement">Needs improvement</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!form.cashMatched || form.rating === 'needs_improvement' || form.rating === 'poor' ? (
              <div className="space-y-1.5">
                <Label>Issues found (one per line)</Label>
                <Textarea rows={2} placeholder={'Missing receipt for Ama Mensah\n₵120 unrecorded cash'} value={form.issues} onChange={e => setForm(f => ({ ...f, issues: e.target.value }))} />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Overall observations, coaching given, follow-up plan..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={handleSave}>Save Check</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spot check detail dialog */}
      <Dialog open={!!detailCheck} onOpenChange={() => setDetailCheck(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Spot Check Details</DialogTitle>
            <DialogDescription>Unannounced field verification record — full findings.</DialogDescription>
          </DialogHeader>
          {detailCheck && (() => {
            const meta = ratingMeta[detailCheck.rating];
            const RatingIcon = meta.icon;
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {getInitials(detailCheck.agentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{detailCheck.agentName}</p>
                    <Badge className={`mt-1 text-[10px] capitalize ${meta.badge}`}>
                      <RatingIcon className="mr-1 h-3 w-3" />{detailCheck.rating.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <DetailField label="Check ID" value={detailCheck.id} />
                    <DetailField label="Date" value={formatDate(detailCheck.date)} />
                    <DetailField label="Customers checked" value={String(detailCheck.customersChecked)} />
                    <DetailField label="Receipts issued" value={String(detailCheck.receiptsIssued)} />
                    <DetailField label="Cash matched" value={
                      <span className={detailCheck.cashMatched ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {detailCheck.cashMatched ? 'Yes' : 'No'}
                      </span>
                    } />
                    <DetailField label="Rating" value={<span className="capitalize">{detailCheck.rating.replace(/_/g, ' ')}</span>} />
                    <DetailField label="Verified by" value={detailCheck.verifiedBy} wide />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 text-sm font-semibold">Issues found</h4>
                  {detailCheck.issuesFound.length > 0 ? (
                    <div className="space-y-1.5">
                      {detailCheck.issuesFound.map((issue, idx) => (
                        <p key={idx} className="flex items-start gap-1.5 text-sm text-amber-800 dark:text-amber-200">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {issue}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">No issues recorded — collections verified clean.</p>
                  )}
                </div>
                <div className="text-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                  <p className="mt-1">{detailCheck.notes}</p>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
