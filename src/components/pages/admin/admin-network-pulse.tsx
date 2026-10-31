'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, Loader2, AlertTriangle, TrendingUp, ShieldAlert, Lightbulb, ArrowRight, BrainCircuit,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Loan, Agent, Branch, ComplianceReport, Dispute, KYCVerificationRecord, SystemStats } from '@/lib/types';

interface PulseItem {
  title: string;
  detail: string;
  tone: 'positive' | 'warning' | 'risk' | 'tip';
  page: 'loans' | 'agents' | 'compliance' | 'kyc-verification' | 'susu-groups' | 'analytics' | 'none';
}

const TONE_STYLES: Record<PulseItem['tone'], { icon: React.ElementType; color: string; bg: string }> = {
  positive: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  risk: { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  tip: { icon: Lightbulb, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/40' },
};

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function AdminNetworkPulse({
  adminName,
  stats,
  approvals,
  agents,
  branches,
  compliance,
  disputes,
  kycRecords,
  onNavigate,
}: {
  adminName: string;
  stats: SystemStats;
  approvals: Loan[];
  agents: Agent[];
  branches: Branch[];
  compliance: ComplianceReport[];
  disputes: Dispute[];
  kycRecords: KYCVerificationRecord[];
  onNavigate: (page: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [items, setItems] = useState<PulseItem[]>([]);

  const openCompliance = compliance.filter((c) => c.status !== 'resolved');
  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'investigating');
  const kycPending = kycRecords.filter((k) => k.status === 'pending_review').length;
  const kycInReview = kycRecords.filter((k) => k.status === 'in_review').length;
  const kycExpired = kycRecords.filter((k) => k.status === 'expired').length;

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Most decision-relevant agents first (troublesome, then top collectors) so the cap keeps what matters.
      const agentsSorted = [...agents].sort((a, b) => {
        const rank = (s: Agent['status']) => (s === 'suspended' ? 0 : s === 'inactive' ? 1 : 2);
        return rank(a.status) - rank(b.status) || b.totalCollections - a.totalCollections;
      });
      // Highest severity first so the cap never drops a critical report.
      const complianceSorted = [...openCompliance].sort(
        (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
      );

      const res = await fetch('/api/ai/admin-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName,
          network: {
            totalUsers: stats.totalUsers,
            activeUsers: stats.activeUsers,
            monthlyGrowth: stats.monthlyGrowth,
            totalDeposits: stats.totalDeposits,
            totalSusuPool: stats.totalSusuPool,
            totalLoansDisbursed: stats.totalLoansDisbursed,
            monthlyRevenue: stats.monthlyRevenue,
            defaultRate: stats.defaultRate,
            totalAgents: stats.totalAgents,
            activeAgents: stats.activeAgents,
            totalSusuGroups: stats.totalSusuGroups,
          },
          approvals: approvals.map((l) => ({
            applicantName: l.applicantName,
            type: l.type,
            amount: l.amount,
            tenor: `${l.term} ${l.termUnit}`,
            creditScore: l.creditScore,
            purpose: l.purpose,
          })),
          agents: agentsSorted.map((a) => ({
            name: a.name,
            branch: a.branch,
            status: a.status,
            totalCollections: a.totalCollections,
            totalCustomers: a.totalCustomers,
            rating: a.rating,
          })),
          branches: branches.map((b) => ({
            name: b.name,
            region: b.region,
            manager: b.manager,
            totalCustomers: b.totalCustomers,
            totalAgents: b.totalAgents,
            totalSusuGroups: b.totalSusuGroups,
            status: b.status,
          })),
          compliance: complianceSorted.map((c) => ({
            type: c.type,
            title: c.title,
            severity: c.severity,
            status: c.status,
          })),
          disputes: openDisputes.map((d) => ({
            type: d.type,
            amount: d.amount,
            status: d.status,
          })),
          kyc: {
            pending: kycPending,
            inReview: kycInReview,
            rejected: kycRecords.filter((k) => k.status === 'rejected').length,
            expired: kycExpired,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setBrief(typeof data.brief === 'string' ? data.brief : '');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError('Could not generate the network pulse. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden border-0 shadow-md shadow-teal-900/5">
        <div className="relative bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 dark:from-teal-950/40 dark:via-cyan-950/30 dark:to-sky-950/30">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-500/25">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-foreground lg:text-base">
                    Susu AI · Network pulse
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {items.length
                      ? `${approvals.length} approvals · ${openCompliance.length} open compliance reports · whole network in one glance`
                      : `${stats.totalUsers.toLocaleString()} users · ${stats.totalAgents} agents · ${branches.length} branches — AI-ready`}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={generate}
                disabled={loading}
                className="shrink-0 gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow hover:from-teal-700 hover:to-cyan-700"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : items.length ? (
                  <RefreshCw className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{items.length ? 'Refresh' : 'Read the pulse'}</span>
                <span className="sm:hidden">{items.length ? 'Again' : 'Pulse'}</span>
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
                  <p className="text-center text-[11px] text-muted-foreground">Susu AI is reading the whole network…</p>
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
                    AI-generated from live network data — decisions stay with you.
                  </p>
                </motion.div>
              )}

              {!loading && !error && items.length === 0 && (
                <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-muted-foreground">
                  One tap, the whole operation: compliance risks first, then the approval queue, agents and branches — tap any item to jump straight there.
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
