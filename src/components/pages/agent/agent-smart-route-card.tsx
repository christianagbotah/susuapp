'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, Loader2, AlertTriangle, Phone, Banknote, RotateCcw, Route as RouteIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatGHS } from '@/lib/formatters';
import type { CollectionRoute } from '@/lib/types';

interface AiVisit {
  customerId: string;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
  suggestion: 'collect' | 'revisit' | 'call';
}

const URGENCY_STYLES: Record<AiVisit['urgency'], { label: string; className: string }> = {
  high: { label: 'Visit first', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  medium: { label: 'Today', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  low: { label: 'Later', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

const SUGGESTION_STYLES: Record<AiVisit['suggestion'], { label: string; icon: React.ElementType }> = {
  collect: { label: 'Collect', icon: Banknote },
  revisit: { label: 'Revisit', icon: RotateCcw },
  call: { label: 'Call / MoMo', icon: Phone },
};

export function AgentSmartRouteCard({
  routes,
  agentName,
}: {
  routes: CollectionRoute[];
  agentName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [visits, setVisits] = useState<AiVisit[]>([]);

  // Customers the agent still needs to see today (pending or absent — never collected).
  const actionable = routes.flatMap((r) =>
    r.customers.filter((c) => c.status !== 'collected').map((c) => ({ ...c, routeName: r.name }))
  );
  const stillToCollect = actionable.reduce(
    (s, c) => s + (c.expectedAmount - (c.collectedAmount || 0)),
    0
  );

  // Names for rendering — resolved against the routes we sent (the route already filtered to known IDs).
  const nameById = new Map(actionable.map((c) => [c.customerId, c]));

  if (!actionable.length) return null;

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/collections-prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          routes: routes.map((r) => ({
            name: r.name,
            area: r.area,
            customers: r.customers.map((c) => ({
              customerId: c.customerId,
              customerName: c.customerName,
              susuGroupName: c.susuGroupName,
              expectedAmount: c.expectedAmount,
              collectedAmount: c.collectedAmount,
              status: c.status,
              notes: c.notes,
            })),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setBrief(typeof data.brief === 'string' ? data.brief : '');
      setVisits(Array.isArray(data.visits) ? data.visits : []);
    } catch {
      setError('Could not build the smart order. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md shadow-emerald-900/5">
      <div className="relative bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/30">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <RouteIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-foreground lg:text-base">
                  Susu AI · Smart visit order
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {visits.length
                    ? `${visits.length} stops ranked — ${formatGHS(stillToCollect)} still to collect`
                    : `${actionable.length} customers pending · ${formatGHS(stillToCollect)} still to collect today`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={generate}
              disabled={loading}
              className="shrink-0 gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:from-emerald-700 hover:to-teal-700"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : visits.length ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{visits.length ? 'Refresh' : 'Prioritize my day'}</span>
              <span className="sm:hidden">{visits.length ? 'Again' : 'Plan'}</span>
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
                    <div className="h-6 w-6 shrink-0 animate-pulse rounded-md bg-muted" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
                <p className="text-center text-[11px] text-muted-foreground">Susu AI is planning your route…</p>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </p>
              </motion.div>
            )}

            {!loading && visits.length > 0 && (
              <motion.div key="visits" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
                {brief && (
                  <p className="rounded-xl border bg-background/70 p-3 text-xs font-medium text-foreground lg:text-sm">{brief}</p>
                )}
                {visits.map((v, i) => {
                  const customer = nameById.get(v.customerId);
                  const urgency = URGENCY_STYLES[v.urgency] || URGENCY_STYLES.medium;
                  const suggestion = SUGGESTION_STYLES[v.suggestion] || SUGGESTION_STYLES.collect;
                  const SuggestionIcon = suggestion.icon;
                  return (
                    <motion.div
                      key={v.customerId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3 rounded-xl border bg-background/70 p-3 transition hover:shadow-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground lg:text-sm">{customer?.customerName ?? 'Customer'}</p>
                          <Badge className={`text-[10px] ${urgency.className}`}>{urgency.label}</Badge>
                          <Badge variant="outline" className="gap-1 text-[10px] capitalize">
                            <SuggestionIcon className="h-3 w-3" /> {suggestion.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {v.reason || `Expected ${formatGHS(customer?.expectedAmount ?? 0)} · ${customer?.status === 'absent' ? 'absent earlier today' : 'pending collection'}`}
                          {customer?.routeName ? <span className="ml-1 opacity-70">· {customer.routeName}</span> : null}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <p className="pt-1 text-[11px] text-muted-foreground">
                  AI guidance from today&apos;s live collections — you know your customers best.
                </p>
              </motion.div>
            )}

            {!loading && !error && visits.length === 0 && (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-muted-foreground">
                Rank today&apos;s pending and absent customers by urgency — big amounts and absentees first — so no cedi is left on the route.
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </div>
    </Card>
  );
}
