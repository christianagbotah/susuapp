'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, Loader2, AlertTriangle, TrendingUp, ShieldAlert, Lightbulb, ArrowRight, BrainCircuit,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/formatters';
import type { TellerDrawer, CounterTransaction, VaultTransfer, EODReconciliationLine } from '@/lib/types';

interface DrawerItem {
  title: string;
  detail: string;
  tone: 'positive' | 'warning' | 'risk' | 'tip';
  page: 'counter' | 'reconciliation' | 'vault' | 'none';
}

const TONE_STYLES: Record<DrawerItem['tone'], { icon: React.ElementType; color: string; bg: string }> = {
  positive: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  risk: { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  tip: { icon: Lightbulb, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/40' },
};

export function TellerBriefCard({
  tellerName,
  drawer,
  queue,
  transfers,
  eodLines,
  onNavigate,
}: {
  tellerName: string;
  drawer: TellerDrawer;
  queue: CounterTransaction[];
  transfers: VaultTransfer[];
  eodLines: EODReconciliationLine[];
  onNavigate: (page: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [items, setItems] = useState<DrawerItem[]>([]);

  const waiting = queue.filter((q) => q.status === 'waiting' || q.status === 'processing').length;
  const stuckTransfers = transfers.filter((t) => t.status !== 'completed').length;
  const variance = drawer.countedBalance - drawer.expectedBalance;
  const varianceLabel = Math.abs(variance) >= 0.01
    ? `${formatGHS(Math.abs(variance))} drawer variance`
    : 'drawer balanced';

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Waiting/processing customers first so the cap keeps the live counter.
      const queueSorted = [...queue].sort(
        (a, b) => (a.status === 'waiting' ? 0 : a.status === 'processing' ? 1 : 2) - (b.status === 'waiting' ? 0 : b.status === 'processing' ? 1 : 2),
      );
      // Open transfers first (requested → in_transit) — completed ones are done.
      const transfersSorted = [...transfers].sort((a, b) => {
        const rank = (s: VaultTransfer['status']) => (s === 'requested' ? 0 : s === 'approved' ? 1 : s === 'in_transit' ? 2 : 3);
        return rank(a.status) - rank(b.status);
      });
      // Lines with a non-zero variance first so the cap keeps what must be explained.
      const eodSorted = [...eodLines].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

      const res = await fetch('/api/ai/teller-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tellerName,
          drawer: {
            openingFloat: drawer.openingFloat,
            cashIn: drawer.cashIn,
            cashOut: drawer.cashOut,
            expectedBalance: drawer.expectedBalance,
            countedBalance: drawer.countedBalance,
            variance,
            status: drawer.status,
          },
          queue: queueSorted.slice(0, 8).map((q) => ({
            queueNo: q.queueNo,
            type: q.type,
            amount: q.amount,
            channel: q.channel,
            status: q.status,
          })),
          transfers: transfersSorted.slice(0, 6).map((t) => ({
            direction: t.direction,
            amount: t.amount,
            status: t.status,
            requestedBy: t.requestedBy,
          })),
          eodLines: eodSorted.slice(0, 6).map((e) => ({
            category: e.category,
            systemTotal: e.systemTotal,
            countedTotal: e.countedTotal,
            variance: e.variance,
            txCount: e.txCount,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setBrief(typeof data.brief === 'string' ? data.brief : '');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError('Could not generate the drawer check. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden border-0 shadow-md shadow-cyan-900/5">
        <div className="relative bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 dark:from-cyan-950/30 dark:via-sky-950/25 dark:to-blue-950/25">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-sky-600 text-white shadow-md shadow-sky-500/25">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-foreground lg:text-base">
                    Susu AI · Drawer check
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {items.length
                      ? `${waiting} at the counter · ${varianceLabel} — one glance`
                      : `${waiting} at the counter · ${varianceLabel} — AI-ready`}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={generate}
                disabled={loading}
                className="shrink-0 gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow hover:from-cyan-700 hover:to-sky-700"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : items.length ? (
                  <RefreshCw className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{items.length ? 'Refresh' : 'Check drawer'}</span>
                <span className="sm:hidden">{items.length ? 'Again' : 'Drawer'}</span>
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                      <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-muted" />
                      <div className="flex-1 space-y-1.5 py-0.5">
                        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-[11px] text-muted-foreground">Susu AI is counting your drawer…</p>
                </motion.div>
              )}

              {!loading && error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                  <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                  </p>
                </motion.div>
              )}

              {!loading && items.length > 0 && (
                <motion.div key="items" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
                  {brief && (
                    <p className="rounded-xl border bg-background/70 p-3 text-xs font-medium text-foreground lg:text-sm">{brief}</p>
                  )}
                  {items.map((item, i) => {
                    const style = TONE_STYLES[item.tone] || TONE_STYLES.tip;
                    const Icon = style.icon;
                    const clickable = item.page !== 'none';
                    const row = (
                      <div className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
                          <Icon className={`h-4 w-4 ${style.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground lg:text-sm">{item.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                        </div>
                        {clickable && (
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                        )}
                      </div>
                    );
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        {clickable ? (
                          <div
                            onClick={() => onNavigate(item.page)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(item.page); } }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${item.title} — jump to ${item.page.replace('-', ' ')} page`}
                            className="cursor-pointer rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>div]:hover:shadow-sm [&>div]:hover:border-primary/40"
                          >
                            {row}
                          </div>
                        ) : (
                          row
                        )}
                      </motion.div>
                    );
                  })}
                  <p className="pt-1 text-[11px] text-muted-foreground">
                    AI-generated from live counter data — cash custody stays with you.
                  </p>
                </motion.div>
              )}

              {!loading && !error && items.length === 0 && (
                <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-muted-foreground">
                  One tap before close of day: drawer variance, stuck vault transfers, channel mismatches, queue pressure — tap any item to jump straight there.
                  {stuckTransfers > 0 ? ` ${stuckTransfers} transfer${stuckTransfers > 1 ? 's' : ''} still open.` : ''}
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
