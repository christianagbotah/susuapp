'use client';

import { useState } from 'react';
import { useAccountantStore } from '@/store/staff-stores';
import { formatGHS, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Scale, CheckCircle2, AlertTriangle, ArrowRightLeft, Landmark, Smartphone } from 'lucide-react';
import type { BankReconciliation } from '@/lib/types';

const sourceIcon = (source: string) =>
  source.includes('MoMo') || source.includes('Telecel') || source.includes('AT')
    ? <Smartphone className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />
    : <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />;

const statusBadge = (s: BankReconciliation['status']) => ({
  reconciled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  variance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}[s]);

export function AccountantReconciliation() {
  const { reconciliations, resolveUnmatched } = useAccountantStore();
  const [detail, setDetail] = useState<BankReconciliation | null>(null);

  const withVariance = reconciliations.filter(r => r.status === 'variance');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Scale className="h-5 w-5 text-slate-600 dark:text-slate-300" /> Bank & MoMo Reconciliation — October 2026</h2>
        <p className="text-xs text-muted-foreground">Match book balances to bank/telecel statements. All Ghana float accounts reconciled daily.</p>
      </div>

      {withVariance.length > 0 && (
        <Card className="border-l-4 border-amber-500">
          <CardContent className="flex items-start gap-2 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {withVariance.length} account(s) with unresolved variance — {withVariance.map(r => r.source).join(', ')}. Resolve before the mid-month close.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {reconciliations.map((r, i) => {
          const diff = r.bookBalance - r.statementBalance;
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card className="mobile-card h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span className="flex min-w-0 items-center gap-2">{sourceIcon(r.source)} <span className="truncate">{r.source}</span></span>
                    <Badge className={`shrink-0 text-[10px] ${statusBadge(r.status)}`}>{r.status.replace('_', ' ')}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Book balance</p>
                      <p className="text-sm font-bold">{formatGHS(r.bookBalance)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2.5">
                      <p className="text-[10px] text-muted-foreground">Statement balance</p>
                      <p className="text-sm font-bold">{formatGHS(r.statementBalance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Difference</span>
                    <span className={`font-bold ${diff === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{formatGHS(diff)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.unmatchedItems.length} unmatched item(s) · {r.period}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="min-h-[40px] flex-1 touch-manipulation" onClick={() => setDetail(r)}>
                      View Items
                    </Button>
                    {r.unmatchedItems.length === 0 && (
                      <Button size="sm" variant="ghost" className="min-h-[40px] flex-1 text-emerald-600 touch-manipulation" disabled>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Clean
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detail?.source}</DialogTitle>
            <DialogDescription>{detail?.period} — unmatched items</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {detail?.unmatchedItems.length === 0 && (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Fully reconciled.
              </p>
            )}
            {detail?.unmatchedItems.map(item => (
              <div key={item.description} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.date)} · <span className="uppercase">{item.type}</span></p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${item.type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.type === 'debit' ? '−' : '+'}{formatGHS(item.amount)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full min-h-[38px] touch-manipulation"
                  onClick={() => {
                    resolveUnmatched(detail.id, item.description);
                    toast.success('Item matched & posted', { description: `${item.description} reconciled against book balance.` });
                    setDetail(null);
                  }}
                >
                  <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" /> Match & Post
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setDetail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
