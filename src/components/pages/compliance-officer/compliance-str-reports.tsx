'use client';

import { useState } from 'react';
import { useComplianceStore } from '@/store/staff-stores';
import { formatGHS, formatDate, getInitials } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/shared/mobile-components';
import { FileWarning, Send, Download, Eye, CheckCircle2, Clock } from 'lucide-react';
import type { STRReport } from '@/lib/types';

const statusMeta: Record<STRReport['status'], { badge: string; icon: React.ElementType }> = {
  draft: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Clock },
  filed: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Send },
  acknowledged: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
  under_review: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Eye },
};

export function ComplianceStrReports() {
  const { strs, updateSTRStatus } = useComplianceStore();
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState<STRReport | null>(null);

  const filtered = strs.filter(s => filter === 'all' || s.status === filter);

  // Real CSV export (Blob + a.download + revokeObjectURL) — confidential register row
  const download = (s: STRReport) => {
    const lines = [
      'iSusuPro Ghana — Suspicious Transaction Report (CONFIDENTIAL)',
      `Reference,"${s.reference}"`,
      `Subject,"${s.subjectName}"`,
      `Filed with,"${s.filedWith}"`,
      `Filed date,"${formatDate(s.filedDate)}"`,
      `Status,"${s.status.replace(/_/g, ' ')}"`,
      `Amount involved (GHS),"${s.amountInvolved > 0 ? s.amountInvolved.toFixed(2) : 'N/A'}"`,
      `Linked AML alert,"${s.alertId}"`,
      '',
      'Grounds for suspicion',
      `"${s.suspiciousActivity.replace(/"/g, '""')}"`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `str-${s.reference.replace(/[^a-zA-Z0-9]+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('STR exported', { description: `CSV downloaded for ${s.reference} — handle under AML Act 1044 confidentiality.` });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><FileWarning className="h-5 w-5 text-amber-500" /> STR / SAR Register</h2>
        <p className="text-xs text-muted-foreground">Confidential register of reports filed with FIC & BoG. Access restricted to Compliance & MLRO (audit.view).</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'filed', 'acknowledged', 'under_review'] as const).map(k => (
          <Button key={k} size="sm" variant={filter === k ? 'default' : 'outline'} className="min-h-[40px] capitalize touch-manipulation" onClick={() => setFilter(k)}>
            {k.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="lg:col-span-2">
            <EmptyState
              icon={FileWarning}
              title="No STR reports found"
              description="Try adjusting the status filter."
            />
          </div>
        ) : filtered.map((s, i) => {
          const meta = statusMeta[s.status];
          const Icon = meta.icon;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card
                className="mobile-card h-full cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                onClick={() => setDetail(s)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(s); } }}
                role="button"
                tabIndex={0}
                aria-label={`View STR ${s.reference}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span className="min-w-0 truncate">{s.subjectName}</span>
                    <Badge className={`shrink-0 text-[10px] ${meta.badge}`}><Icon className="mr-1 h-3 w-3" />{s.status.replace(/_/g, ' ')}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{s.suspiciousActivity}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Amount: </span><span className="font-semibold">{s.amountInvolved > 0 ? formatGHS(s.amountInvolved) : 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Filed: </span><span className="font-semibold">{formatDate(s.filedDate)}</span></div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
                    <p className="font-medium">{s.filedWith}</p>
                    <p className="font-mono text-muted-foreground">{s.reference}</p>
                  </div>
                  <div className="flex gap-2">
                    {s.status === 'draft' && (
                      <Button size="sm" className="min-h-[38px] flex-1 bg-red-600 hover:bg-red-700 touch-manipulation" onClick={(e) => { e.stopPropagation(); updateSTRStatus(s.id, 'filed'); toast.success('STR submitted to FIC portal', { description: 'Acknowledgement expected within 3 working days.' }); }}>
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Submit
                      </Button>
                    )}
                    {s.status === 'filed' && (
                      <Button size="sm" variant="outline" className="min-h-[38px] flex-1 touch-manipulation" onClick={(e) => { e.stopPropagation(); updateSTRStatus(s.id, 'acknowledged'); toast.success('Marked as acknowledged by FIC'); }}>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Acknowledged
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="min-h-[38px] flex-1 touch-manipulation" onClick={(e) => { e.stopPropagation(); download(s); }}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-l-4 border-blue-500">
        <CardContent className="p-4">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Retention:</span> STR files and supporting evidence must be retained for 5 years (AML Act 1044 s.24). This register auto-locks each record after filing; corrections require a supplementary report.
          </p>
        </CardContent>
      </Card>

      {/* STR detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>STR / SAR Detail</DialogTitle>
            <DialogDescription>Confidential — {detail?.reference}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {getInitials(detail.subjectName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{detail.subjectName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <Badge className={`text-[10px] ${statusMeta[detail.status].badge}`}>{detail.status.replace(/_/g, ' ')}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{detail.reference}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Amount involved</p>
                  <p className="text-sm font-bold">{detail.amountInvolved > 0 ? formatGHS(detail.amountInvolved) : 'N/A'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Reported date</p>
                  <p className="text-sm font-medium">{formatDate(detail.filedDate)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Filed with</p>
                  <p className="text-sm font-medium">{detail.filedWith}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize">{detail.status.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Suspicion category / narrative</p>
                <p className="text-sm">{detail.suspiciousActivity}</p>
              </div>
              <div className="space-y-1.5 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Linked records</p>
                <p className="text-sm">Source AML alert: <span className="font-mono text-xs">{detail.alertId}</span></p>
              </div>
              <DialogFooter>
                <Button variant="outline" className="min-h-[40px] flex-1 touch-manipulation" onClick={() => download(detail)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
