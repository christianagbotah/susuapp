'use client';

import { useState } from 'react';
import { useAccountantStore } from '@/store/staff-stores';
import { formatGHS } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { FileSpreadsheet, CheckCircle2, Download, Send } from 'lucide-react';
import type { FinancialStatement } from '@/lib/types';

const statusBadge = (s: FinancialStatement['status']) => ({
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  final: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}[s]);

export function AccountantStatements() {
  const { statements, coa, finalizeStatement } = useAccountantStore();
  const [detail, setDetail] = useState<FinancialStatement | null>(null);

  const assets = coa.filter(a => a.type === 'asset');
  const liabilities = coa.filter(a => a.type === 'liability');
  const equity = coa.filter(a => a.type === 'equity');
  const income = coa.filter(a => a.type === 'income');
  const expenses = coa.filter(a => a.type === 'expense');

  // Live trial balance totals (assets + expenses carry debit balances)
  const tbDebits = coa.filter(a => a.type === 'asset' || a.type === 'expense').reduce((s, a) => s + a.balance, 0);
  const tbCredits = coa.filter(a => a.type === 'liability' || a.type === 'equity' || a.type === 'income').reduce((s, a) => s + a.balance, 0);

  const download = (st: FinancialStatement) => {
    const lines: string[] = [
      'iSusuPro Ghana',
      `${st.name}`,
      `Period,"${st.period}"`,
      `Status,"${st.status}"`,
      `Prepared by,"${st.preparedBy}"`,
      '',
    ];
    if (st.totalAssets !== undefined) {
      lines.push('Section,Amount (GHS)');
      lines.push(`Total Assets,${st.totalAssets.toFixed(2)}`);
      lines.push(`Total Liabilities,${(st.totalLiabilities ?? 0).toFixed(2)}`);
      lines.push(`Total Equity,${(st.totalEquity ?? 0).toFixed(2)}`);
    }
    if (st.revenue !== undefined) {
      lines.push('Section,Amount (GHS)');
      lines.push(`Revenue,${st.revenue.toFixed(2)}`);
      lines.push(`Expenses,${(st.expenses ?? 0).toFixed(2)}`);
      lines.push(`Net Income,${(st.netIncome ?? 0).toFixed(2)}`);
    }
    if (st.name === 'Trial Balance') {
      lines.push('Account Code,Account,Class,Balance (GHS)');
      coa.forEach(a => lines.push(`${a.code},"${a.name}",${a.type},${a.balance.toFixed(2)}`));
      lines.push(`,Debit-balance accounts,,${tbDebits.toFixed(2)}`);
      lines.push(`,Credit-balance accounts,,${tbCredits.toFixed(2)}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${st.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${st.period.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${st.name} exported`, { description: 'CSV downloaded — opens in Excel or Google Sheets.' });
  };

  return (
    <div className="space-y-5">
      {/* Statement cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {statements.map((st, i) => (
          <motion.div key={st.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <Card
              className="mobile-card h-full cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              onClick={() => setDetail(st)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(st); } }}
              role="button"
              tabIndex={0}
              aria-label={`View ${st.name} details`}
            >
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
                    <Button size="sm" className="min-h-[40px] flex-1 bg-emerald-600 hover:bg-emerald-700 touch-manipulation" onClick={(e) => { e.stopPropagation(); finalizeStatement(st.id); toast.success(`${st.name} marked final`, { description: 'Locked for the period; audit trail updated.' }); }}>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Finalize
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="min-h-[40px] flex-1 touch-manipulation" onClick={(e) => { e.stopPropagation(); download(st); }}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
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

      {/* Statement detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Statement Detail</DialogTitle>
            <DialogDescription>{detail?.name} — {detail?.period}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              {/* Identity header */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{detail.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <Badge className={`text-[10px] capitalize ${statusBadge(detail.status)}`}>{detail.status}</Badge>
                    <span className="text-xs text-muted-foreground">prepared by {detail.preparedBy}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Reporting period</p>
                  <p className="text-sm font-bold">{detail.period}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize">{detail.status}</p>
                </div>
              </div>
              {detail.totalAssets !== undefined && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Financial position — closing balances</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Total assets</p>
                      <p className="text-sm font-bold">{formatGHS(detail.totalAssets ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Total liabilities</p>
                      <p className="text-sm font-bold">{formatGHS(detail.totalLiabilities ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Total equity</p>
                      <p className="text-sm font-bold">{formatGHS(detail.totalEquity ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Assets = Liabilities + Equity</p>
                      <p className={`text-sm font-bold ${(detail.totalAssets ?? 0) === ((detail.totalLiabilities ?? 0) + (detail.totalEquity ?? 0)) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {(detail.totalAssets ?? 0) === ((detail.totalLiabilities ?? 0) + (detail.totalEquity ?? 0)) ? 'Balanced' : 'Review'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {detail.revenue !== undefined && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Income &amp; expense lines</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Revenue (susu fees + interest)</span><span className="font-semibold">{formatGHS(detail.revenue ?? 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Expenses (commissions, salaries, provisions)</span><span className="font-semibold">{formatGHS(detail.expenses ?? 0)}</span></div>
                    <div className="flex justify-between border-t pt-2"><span className="font-medium">Net income</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{formatGHS(detail.netIncome ?? 0)}</span></div>
                  </div>
                </div>
              )}
              {detail.name === 'Trial Balance' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live trial balance (from chart of accounts)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Debit-balance accounts</p>
                      <p className="text-sm font-bold">{formatGHS(tbDebits)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Credit-balance accounts</p>
                      <p className="text-sm font-bold">{formatGHS(tbCredits)}</p>
                    </div>
                  </div>
                  <p className={`flex items-center gap-2 rounded-lg p-3 text-xs ${tbDebits === tbCredits ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'}`}>
                    {tbDebits === tbCredits ? 'Dr = Cr — ledger is balanced.' : 'Dr ≠ Cr — investigate before close.'}
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" className="min-h-[40px] flex-1 touch-manipulation" onClick={() => download(detail)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
