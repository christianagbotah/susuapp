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
import { Scale, CheckCircle2, AlertTriangle, Calculator, Printer } from 'lucide-react';
import type { EODReconciliationLine } from '@/lib/types';

const categoryLabel: Record<EODReconciliationLine['category'], string> = {
  cash: 'Cash (Teller Chest)',
  momo_mtn: 'MTN MoMo Float',
  momo_telecel: 'Telecel Cash Float',
  momo_at: 'AT Money Float',
  cheque: 'Cheques Received',
  float: 'Opening Float',
};

export function TellerReconciliation() {
  const { eodLines, setEODCounted, drawer } = useTellerStore();
  const [countOpen, setCountOpen] = useState(false);
  const [counts, setCounts] = useState<Record<number, string>>({});

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
                <div className={`flex flex-col gap-2 rounded-lg border p-3.5 sm:flex-row sm:items-center sm:justify-between ${hasVariance ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' : ''}`}>
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
            <Button variant="outline" className="min-h-[44px] touch-manipulation" onClick={() => toast.info('Reconciliation sheet sent to printer / PDF exported.')}>
              <Printer className="mr-2 h-4 w-4" /> Print EOD Sheet
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
    </div>
  );
}
