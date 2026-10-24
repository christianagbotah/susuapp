'use client';

import { useAccountantStore } from '@/store/staff-stores';
import { formatGHS } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { FileSpreadsheet, CheckCircle2, Printer, Send } from 'lucide-react';
import type { FinancialStatement } from '@/lib/types';

const statusBadge = (s: FinancialStatement['status']) => ({
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  final: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}[s]);

export function AccountantStatements() {
  const { statements, coa, finalizeStatement } = useAccountantStore();

  const assets = coa.filter(a => a.type === 'asset');
  const liabilities = coa.filter(a => a.type === 'liability');
  const equity = coa.filter(a => a.type === 'equity');
  const income = coa.filter(a => a.type === 'income');
  const expenses = coa.filter(a => a.type === 'expense');

  const download = (name: string) => toast.success(`${name} exported`, { description: 'PDF generated and queued for printing.' });

  return (
    <div className="space-y-5">
      {/* Statement cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {statements.map((st, i) => (
          <motion.div key={st.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <Card className="mobile-card h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <span className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-slate-600 dark:text-slate-300" /> {st.name}</span>
                  <Badge className={`text-[10px] capitalize ${statusBadge(st.status)}`}>{st.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{st.period} · prepared by {st.preparedBy}</p>
                {st.totalAssets !== undefined && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">Assets</p><p className="text-xs font-bold">{formatGHS(st.totalAssets ?? 0)}</p></div>
                    <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">Liabilities</p><p className="text-xs font-bold">{formatGHS(st.totalLiabilities ?? 0)}</p></div>
                    <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">Equity</p><p className="text-xs font-bold">{formatGHS(st.totalEquity ?? 0)}</p></div>
                  </div>
                )}
                {st.revenue !== undefined && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-xs font-bold">{formatGHS(st.revenue ?? 0)}</p></div>
                    <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground">Expenses</p><p className="text-xs font-bold">{formatGHS(st.expenses ?? 0)}</p></div>
                    <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20"><p className="text-[10px] text-muted-foreground">Net</p><p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{formatGHS(st.netIncome ?? 0)}</p></div>
                  </div>
                )}
                <div className="flex gap-2">
                  {st.status === 'draft' && (
                    <Button size="sm" className="min-h-[40px] flex-1 bg-emerald-600 hover:bg-emerald-700 touch-manipulation" onClick={() => { finalizeStatement(st.id); toast.success(`${st.name} marked final`, { description: 'Locked for the period; audit trail updated.' }); }}>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Finalize
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="min-h-[40px] flex-1 touch-manipulation" onClick={() => download(st.name)}>
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live account-type breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">October 2026 — Live Balances by Account Class</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { title: 'Assets', rows: assets, color: 'text-blue-600 dark:text-blue-400' },
            { title: 'Liabilities', rows: liabilities, color: 'text-amber-600 dark:text-amber-400' },
            { title: 'Equity', rows: equity, color: 'text-purple-600 dark:text-purple-400' },
            { title: 'Income vs Expenses', rows: [...income, ...expenses], color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(group => (
            <div key={group.title} className="space-y-1.5 rounded-lg border p-3">
              <p className={`text-sm font-semibold ${group.color}`}>{group.title}</p>
              {group.rows.map(r => (
                <div key={r.code} className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{r.name}</span>
                  <span className="font-semibold">{formatGHS(r.balance)}</span>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-blue-500">
        <CardContent className="flex items-start gap-2 p-4">
          <Send className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Final statements feed the Branch Manager pack and the Compliance Officer&apos;s BoG prudential returns. Sign-off workflow: Accountant → Branch Manager → Board Finance Committee.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
