'use client';

import { useState } from 'react';
import { useComplianceStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useConfirm } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/mobile-components';
import { ShieldAlert, Search, FileWarning, Send, CheckCircle2, Eye, XCircle } from 'lucide-react';
import type { AMLAlert } from '@/lib/types';

const severityBadge: Record<AMLAlert['severity'], string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const statusMeta: Record<AMLAlert['status'], string> = {
  open: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  investigating: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  closed_false_positive: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  closed_str_filed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function ComplianceAmlAlerts() {
  const { alerts, updateAlertStatus, fileSTR } = useComplianceStore();
  const [filter, setFilter] = useState('active');
  const [detail, setDetail] = useState<AMLAlert | null>(null);
  const [strOpen, setStrOpen] = useState<AMLAlert | null>(null);
  const [strActivity, setStrActivity] = useState('');
  const [strTarget, setStrTarget] = useState('Financial Intelligence Centre (FIC)');

  // Confirmation dialog for sensitive actions
  const [confirmDialog, askConfirm] = useConfirm();

  const filtered = alerts.filter(a =>
    filter === 'all' ? true : filter === 'active' ? ['open', 'investigating', 'escalated'].includes(a.status) : a.status === filter
  );

  const handleFileStr = () => {
    if (!strOpen) return;
    if (!strActivity.trim()) {
      toast.error('Describe the suspicious activity — FIC requires the grounds for suspicion.');
      return;
    }
    fileSTR({
      alertId: strOpen.id,
      subjectName: strOpen.customerName,
      suspiciousActivity: strActivity.trim(),
      amountInvolved: strOpen.amount,
      filedWith: strTarget as never,
    });
    toast.success('STR filed', {
      description: `${strTarget} · reference FIC/STR/2026. Alert closed and subject flagged for enhanced monitoring.`,
    });
    setStrOpen(null);
    setStrActivity('');
    setDetail(null);
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([
          ['active', 'Active'],
          ['open', 'Open'],
          ['investigating', 'Investigating'],
          ['closed_str_filed', 'STR Filed'],
          ['closed_false_positive', 'False Positive'],
          ['all', 'All'],
        ] as const).map(([key, label]) => (
          <Button key={key} size="sm" variant={filter === key ? 'default' : 'outline'} className="min-h-[40px] touch-manipulation" onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No alerts found"
            description="Try adjusting the status filter."
          />
        ) : filtered.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <Card className={`mobile-card ${a.severity === 'critical' && !a.status.startsWith('closed') ? 'border-l-4 border-red-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-[10px] ${severityBadge[a.severity]}`}>{a.severity}</Badge>
                      <p className="font-semibold">{a.customerName}</p>
                      <Badge variant="outline" className={`text-[10px] ${statusMeta[a.status]}`}>{a.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-medium text-foreground/80">{a.rule}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Triggered {formatDate(a.triggeredDate)}{a.assignedTo ? ` · assigned to ${a.assignedTo}` : ''}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                    {a.amount > 0 && <p className="text-sm font-bold">{formatGHS(a.amount)}</p>}
                    <Button size="sm" variant="outline" className="min-h-[38px] touch-manipulation" onClick={() => setDetail(a)}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className={`h-5 w-5 ${detail.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                  AML Case — {detail.customerName}
                </DialogTitle>
                <DialogDescription>{detail.rule} · Case opened {formatDate(detail.triggeredDate)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Suspicious pattern</p>
                  <p className="text-sm">{detail.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Amount involved</p>
                    <p className="text-sm font-bold">{detail.amount > 0 ? formatGHS(detail.amount) : 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Customer ID</p>
                    <p className="font-mono text-sm">{detail.customerId}</p>
                  </div>
                </div>
                {detail.status !== 'closed_str_filed' && detail.status !== 'closed_false_positive' && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Button size="sm" variant="outline" className="min-h-[42px] touch-manipulation" onClick={() => { updateAlertStatus(detail.id, 'investigating'); toast.info('Case moved to investigating'); setDetail(null); }}>
                      <Search className="mr-1 h-4 w-4" /> Investigate
                    </Button>
                    <Button size="sm" variant="outline" className="min-h-[42px] touch-manipulation" onClick={() => { updateAlertStatus(detail.id, 'escalated'); toast.warning('Escalated to MLRO & Branch Manager'); setDetail(null); }}>
                      <ShieldAlert className="mr-1 h-4 w-4" /> Escalate
                    </Button>
                    <Button size="sm" className="min-h-[42px] bg-red-600 hover:bg-red-700 touch-manipulation" onClick={() => { setStrOpen(detail); }}>
                      <FileWarning className="mr-1 h-4 w-4" /> File STR
                    </Button>
                  </div>
                )}
                {detail.status === 'closed_str_filed' && (
                  <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Closed — STR filed with FIC. Subject under enhanced monitoring (EDD).
                  </p>
                )}
                {detail.status === 'closed_false_positive' && (
                  <p className="flex items-center gap-2 rounded-lg bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <XCircle className="h-4 w-4 shrink-0" /> Closed as false positive — rationale retained for FIC audit.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* STR filing dialog */}
      <Dialog open={!!strOpen} onOpenChange={(open) => { if (!open) { setStrOpen(null); setStrActivity(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>File Suspicious Transaction Report</DialogTitle>
            <DialogDescription>Statutory duty under Act 874 (Anti-Terrorism Act, 2020) & AML Act 2020 (Act 1044).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p><span className="font-semibold">{strOpen?.customerName}</span> · {strOpen && strOpen.amount > 0 ? formatGHS(strOpen.amount) : 'No direct amount'}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Filed with</label>
              <Select value={strTarget} onValueChange={setStrTarget}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Financial Intelligence Centre (FIC)">Financial Intelligence Centre (FIC)</SelectItem>
                  <SelectItem value="Bank of Ghana">Bank of Ghana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Grounds for suspicion</label>
              <Textarea rows={4} placeholder="Describe the activity, pattern, amounts, dates and why it is suspicious..." value={strActivity} onChange={e => setStrActivity(e.target.value)} />
            </div>
            <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              Tipping off the customer is a criminal offence. The subject must not be informed of this filing.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setStrOpen(null)}>Cancel</Button>
            <Button className="min-h-[44px] bg-red-600 hover:bg-red-700 touch-manipulation" onClick={handleFileStr}>
              <Send className="mr-2 h-4 w-4" /> File STR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
