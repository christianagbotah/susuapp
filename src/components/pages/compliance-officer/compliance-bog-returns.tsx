'use client';

import { useState } from 'react';
import { useComplianceStore } from '@/store/staff-stores';
import { formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Landmark, CalendarClock, UploadCloud, FileCheck2, AlertTriangle } from 'lucide-react';
import type { BOGReturn } from '@/lib/types';

const statusMeta: Record<BOGReturn['status'], string> = {
  not_started: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  late: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export function ComplianceBogReturns() {
  const { bogReturns, updateReturnProgress } = useComplianceStore();
  const [detail, setDetail] = useState<BOGReturn | null>(null);

  const syncToPortal = (r: BOGReturn) => {
    toast.success(`${r.return} — progress saved`, { description: r.completion >= 100 ? 'Submitted to BoG ORBA portal.' : 'Draft synced for MLRO review.' });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Bank of Ghana — NBFRI Returns</h2>
        <p className="text-xs text-muted-foreground">Non-Bank Financial Institutions Directive reporting for susu/microfinance licence (BoG licence MF/2024/0187).</p>
      </div>

      {bogReturns.some(r => r.status === 'late') && (
        <Card className="border-l-4 border-red-500">
          <CardContent className="flex items-start gap-2 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-800 dark:text-red-200">A late return is on record — include the incident explanation in next month&apos;s cover letter to prevent a directive letter.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {bogReturns.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <Card
              className="mobile-card h-full cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              onClick={() => setDetail(r)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(r); } }}
              role="button"
              tabIndex={0}
              aria-label={`View ${r.return} details`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between gap-2 text-sm font-semibold">
                  <span>{r.return}</span>
                  <Badge className={`shrink-0 text-[10px] ${statusMeta[r.status]}`}>{r.status.replace(/_/g, ' ')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><CalendarClock className="h-3 w-3" /> {r.period} · due {formatDate(r.dueDate)}</span>
                  <span className="font-semibold">{r.completion}%</span>
                </div>
                <Progress value={r.completion} className="h-2" />
                <p className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">{r.notes}</p>
                {r.status !== 'submitted' && (
                  <div
                    className="space-y-2.5 rounded-lg border p-3"
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">Update completion</p>
                      <span className="text-xs font-bold">{r.completion}%</span>
                    </div>
                    <Slider
                      defaultValue={[r.completion]}
                      max={100}
                      step={5}
                      onValueChange={(v) => updateReturnProgress(r.id, v[0])}
                    />
                    <Button size="sm" className="w-full min-h-[40px] touch-manipulation" onClick={(e) => { e.stopPropagation(); syncToPortal(r); }}>
                      <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Save & Sync to BoG Portal
                    </Button>
                  </div>
                )}
                {r.status === 'submitted' && (
                  <p className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <FileCheck2 className="h-4 w-4" /> Filed — acknowledgement on file.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Reporting Calendar — Q4 2026</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { date: 'Nov 5', item: 'NBFRI 15 — Large Exposures' },
            { date: 'Nov 10', item: 'NBFRI 3 & 8 — Capital Adequacy + Liquid Assets' },
            { date: 'Nov 15', item: 'Monthly Susu Returns (October)' },
            { date: 'Jan 20', item: 'Q4 AML/CFT Return + training log' },
          ].map(c => (
            <div key={c.item} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
              <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{c.date}</Badge>
              <span className="min-w-0 truncate">{c.item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Return detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>BoG Return Detail</DialogTitle>
            <DialogDescription>NBFRI directive reporting — licence MF/2024/0187</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Landmark className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold leading-tight">{detail.return}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge className={`text-[10px] ${statusMeta[detail.status]}`}>{detail.status.replace(/_/g, ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">{detail.period}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-bold">{detail.completion}%</span>
                </div>
                <Progress value={detail.completion} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Return type</p>
                  <p className="text-sm font-medium">{detail.return}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Reporting period</p>
                  <p className="text-sm font-bold">{detail.period}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Due date</p>
                  <p className="text-sm font-bold">{formatDate(detail.dueDate)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Prepared by</p>
                  <p className="truncate text-sm font-medium">{detail.preparedBy}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize">{detail.status.replace(/_/g, ' ')}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Submission</p>
                  <p className="text-sm font-medium">{detail.status === 'submitted' ? 'Filed — acknowledgement on file' : `${detail.completion}% complete`}</p>
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{detail.notes}</p>
              </div>
              {detail.status !== 'submitted' && (
                <div className="space-y-2.5 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Update completion</p>
                    <span className="text-xs font-bold">{detail.completion}%</span>
                  </div>
                  <Slider
                    defaultValue={[detail.completion]}
                    max={100}
                    step={5}
                    onValueChange={(v) => updateReturnProgress(detail.id, v[0])}
                  />
                  <Button
                    size="sm"
                    className="w-full min-h-[40px] touch-manipulation"
                    onClick={() => {
                      syncToPortal(detail);
                      setDetail(null);
                    }}
                  >
                    <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Save & Sync to BoG Portal
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
