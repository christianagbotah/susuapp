'use client';

import { useState } from 'react';
import { useFieldSupervisorStore } from '@/store/staff-stores';
import { formatDate, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function FieldSupervisorSpotChecks() {
  const { spotChecks, agents, logSpotCheck } = useFieldSupervisorStore();
  const [open, setOpen] = useState(false);
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
              <Card className="mobile-card h-full">
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
    </div>
  );
}
