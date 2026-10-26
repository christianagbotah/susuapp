'use client';

import { useState } from 'react';
import { useTellerStore } from '@/store/staff-stores';
import { formatGHS } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Scale, CheckCircle2, AlertTriangle, Calculator, Download } from 'lucide-react';
import type { EODReconciliationLine } from '@/lib/types';

const categoryLabel: Record<EODReconciliationLine['category'], string> = {
  cash: 'Cash (Teller Chest)',
  momo_mtn: 'MTN MoMo Float',
  momo_telecel: 'Telecel Cash Float',
  momo_at: 'AT Money Float',
  cheque: 'Cheques Received',
  float: 'Opening Float',
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

export function TellerReconciliation() {
  const { eodLines, setEODCounted, drawer } = useTellerStore();
  const [countOpen, setCountOpen] = useState(false);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [detailLine, setDetailLine] = useState<EODReconciliationLine | null>(null);

  const totalSystem = eodLines.reduce((s, l) => s + l.systemTotal, 0);
  const totalCounted = eodLines.reduce((s, l) => s + l.countedTotal, 0);
  const totalVariance = totalCounted - totalSystem;
  const balanced = totalVariance === 0;

  const openCashCount = () => {
    const initial: Record<number, string> = {};
    drawer.currencyNotes.forEach(n => { initial[n.note] = String(n.count); });
    setCounts(initial);
    setCountOpen(true);
  };

  const liveCounted = Object.entries(counts).reduce((sum, [note, count]) => sum + Number(note) * (Number(count) || 0), 0);
  const liveVariance = liveCounted - drawer.expectedBalance;

  const escapeCsv = (value: string | number): string => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const downloadEODCsv = () => {
    const header = ['Line ID', 'Category', 'System Total (GHS)', 'Counted Total (GHS)', 'Variance (GHS)', 'Transactions'];
    const rows = eodLines.map(l => [l.id, categoryLabel[l.category], l.systemTotal.toFixed(2), l.countedTotal.toFixed(2), l.variance.toFixed(2), l.txCount]);
    const summary: (string | number)[][] = [
      [],
      ['Summary', '25 Oct 2026'],
      ['System Total', '', '', totalSystem.toFixed(2)],
      ['Counted Total', '', '', totalCounted.toFixed(2)],
      ['Variance', '', '', totalVariance.toFixed(2)],
      ['Status', balanced ? 'BALANCED' : 'VARIANCE — BM CO-APPROVAL REQUIRED'],
    ];
    const csv = [header, ...rows, ...summary].map(r => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eod-reconciliation-2026-10-25.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('EOD sheet exported', {
      description: `CSV downloaded — ${eodLines.length} lines · variance ${totalVariance > 0 ? '+' : ''}${formatGHS(totalVariance)}.`,
    });
  };

  const saveCashCount = () => {
    const notes = drawer.currencyNotes.map(n => ({ note: n.note, count: Number(counts[n.note]) || 0 }));
    useTellerStore.getState().countCash(notes);
    const cashLine = eodLines.find(l => l.category === 'cash');
    if (cashLine) setEODCounted(cashLine.id, liveCounted);
    setCountOpen(false);
    toast[liveVariance === 0 ? 'success' : 'warning'](liveVariance === 0 ? 'Cash drawer balanced' : `Variance of ${formatGHS(liveVariance)} recorded`, {
      description: liveVariance === 0 ? 'Perfect count — chest sealed for banking.' : 'Report to Branch Manager before EOD sign-off.',
    });
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="mobile-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">System Total (all channels)</p>
            <p className="text-2xl font-bold">{formatGHS(totalSystem)}</p>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Counted Total</p>
            <p className="text-2xl font-bold">{formatGHS(totalCounted)}</p>
          </CardContent>
        </Card>
        <Card className={`mobile-card ${balanced ? 'border-l-4 border-emerald-500' : 'border-l-4 border-amber-500'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Variance</p>
            <p className={`text-2xl font-bold ${balanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {totalVariance > 0 ? '+' : ''}{formatGHS(totalVariance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span className="flex items-center gap-2"><Scale className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> End-of-Day Reconciliation — 25 Oct 2026</span>
            <Button size="sm" variant="outline" className="min-h-[40px] touch-manipulation" onClick={openCashCount}>
              <Calculator className="mr-1.5 h-4 w-4" /> Count Cash
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {eodLines.map((l, i) => {
            const hasVariance = l.variance !== 0;
            return (
              <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Open reconciliation line details — ${categoryLabel[l.category]}`}
                  onClick={() => setDetailLine(l)}
                  onKeyDown={openOnKey(() => setDetailLine(l))}
                  className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3.5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between ${hasVariance ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {categoryLabel[l.category]}
                      {hasVariance && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{l.txCount} transactions</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">System</p>
                      <p className="text-sm font-semibold">{formatGHS(l.systemTotal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Counted</p>
                      <p className="text-sm font-semibold">{formatGHS(l.countedTotal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Variance</p>
                      <p className={`text-sm font-bold ${hasVariance ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {l.variance > 0 ? '+' : ''}{formatGHS(l.variance)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" className="min-h-[44px] touch-manipulation" onClick={downloadEODCsv}>
              <Download className="mr-2 h-4 w-4" /> Export EOD CSV
            </Button>
            <Button
              className={`min-h-[44px] touch-manipulation ${balanced ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              onClick={() => {
                if (balanced) {
                  toast.success('EOD signed off', { description: 'Day closed. Accountant & Branch Manager notified; figures posted to GL.' });
                } else {
                  toast.warning('Submitted with variance', { description: `${formatGHS(totalVariance)} flagged — BM must co-approve before posting.` });
                }
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Sign Off EOD
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cash counting dialog */}
      <Dialog open={countOpen} onOpenChange={setCountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Count Cash Drawer</DialogTitle>
            <DialogDescription>Enter note counts — total updates live against expected {formatGHS(drawer.expectedBalance)}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {drawer.currencyNotes.map(n => (
              <div key={n.note} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-14 items-center justify-center rounded bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">₵{n.note}</div>
                  <span className="text-sm text-muted-foreground">×</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    className="w-24 text-right min-h-[40px]"
                    value={counts[n.note] ?? ''}
                    onChange={e => setCounts(c => ({ ...c, [n.note]: e.target.value }))}
                  />
                  <span className="w-24 text-right text-sm font-semibold">₵{((Number(counts[n.note]) || 0) * n.note).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className={`rounded-lg p-3 text-center ${liveVariance === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <p className="text-sm text-muted-foreground">Counted: <span className="font-bold text-foreground">{formatGHS(liveCounted)}</span></p>
            <p className={`text-lg font-bold ${liveVariance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              Variance: {liveVariance > 0 ? '+' : ''}{formatGHS(liveVariance)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setCountOpen(false)}>Cancel</Button>
            <Button className="min-h-[44px] touch-manipulation" onClick={saveCashCount}>Save Count</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EOD line detail dialog */}
      <Dialog open={!!detailLine} onOpenChange={() => setDetailLine(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Reconciliation Line</DialogTitle>
            <DialogDescription>End-of-day channel record — system vs counted figures.</DialogDescription>
          </DialogHeader>
          {detailLine && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${detailLine.variance === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                  <Scale className={`h-5 w-5 ${detailLine.variance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{categoryLabel[detailLine.category]}</p>
                  <Badge className={`mt-1 text-[10px] ${detailLine.variance === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                    {detailLine.variance === 0 ? 'Balanced' : 'Variance flagged'}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField label="Line ID" value={detailLine.id} />
                  <DetailField label="Category" value={categoryLabel[detailLine.category]} />
                  <DetailField label="System total" value={formatGHS(detailLine.systemTotal)} />
                  <DetailField label="Counted total" value={formatGHS(detailLine.countedTotal)} />
                  <DetailField label="Variance" value={
                    <span className={`font-semibold ${detailLine.variance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {detailLine.variance > 0 ? '+' : ''}{formatGHS(detailLine.variance)}
                    </span>
                  } />
                  <DetailField label="Transactions" value={String(detailLine.txCount)} />
                </div>
              </div>
              <p className={`text-xs ${detailLine.variance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {detailLine.variance === 0
                  ? 'Counted cash/float matches the system figure — no action required.'
                  : 'Variance must be reported to the Branch Manager before EOD sign-off.'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
