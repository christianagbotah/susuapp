'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, TrendingUp, AlertTriangle, ShieldAlert, Lightbulb, RefreshCw, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/formatters';
import type { Transaction, Wallet, Budget } from '@/lib/types';

interface Insight {
  title: string;
  detail: string;
  tone: 'positive' | 'warning' | 'risk' | 'tip';
}

const TONE_STYLES: Record<Insight['tone'], { icon: React.ElementType; color: string; bg: string; label: string }> = {
  positive: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Good' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Watch' },
  risk: { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Risk' },
  tip: { icon: Lightbulb, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Tip' },
};

export function AiInsightsCard({
  transactions,
  wallets,
  budgets,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: Budget[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallets: wallets.map((w) => ({ type: w.type, balance: w.balance })),
          budgets: budgets.map((b) => ({ category: b.category, allocatedAmount: b.allocatedAmount, spentAmount: b.spentAmount })),
          transactions: transactions.slice(0, 20).map((t) => ({
            type: t.type,
            amount: t.amount,
            category: t.category,
            date: t.date,
            description: t.description,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSummary(data.summary);
      setInsights(data.insights || []);
    } catch {
      setError('Could not generate insights. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md shadow-violet-900/5">
      <div className="relative bg-gradient-to-r from-violet-50 via-fuchsia-50 to-amber-50 dark:from-violet-950/40 dark:via-fuchsia-950/30 dark:to-amber-950/30">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground lg:text-base">AI Financial Insights</p>
                <p className="truncate text-xs text-muted-foreground">
                  {summary ? 'Personalized analysis of your money' : 'Let Susu AI analyze your spending'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={generate}
              disabled={loading}
              className="shrink-0 gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow hover:from-violet-700 hover:to-fuchsia-700"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : insights.length ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{insights.length ? 'Refresh' : 'Generate'}</span>
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
                <p className="text-center text-[11px] text-muted-foreground">Susu AI is analyzing your transactions…</p>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
              </motion.div>
            )}

            {!loading && insights.length > 0 && (
              <motion.div key="insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
                {summary && (
                  <p className="mb-3 rounded-xl border bg-background/70 p-3 text-xs font-medium text-foreground lg:text-sm">{summary}</p>
                )}
                {insights.map((insight, i) => {
                  const style = TONE_STYLES[insight.tone] || TONE_STYLES.tip;
                  const Icon = style.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 rounded-xl border bg-background/70 p-3 transition hover:shadow-sm"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
                        <Icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground lg:text-sm">{insight.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {!loading && !error && insights.length === 0 && (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-muted-foreground">
                Get smart, personalized money tips based on your recent {formatGHS(transactions.reduce((s, t) => s + t.amount, 0)).replace('.00', '')} in activity.
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </div>
    </Card>
  );
}
