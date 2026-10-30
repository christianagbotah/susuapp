'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse, RefreshCw, Loader2, Sparkles, TrendingUp,
  AlertTriangle, ShieldAlert, CheckCircle2, MessageCircleQuestion,
  Volume2, Square,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Budget, Loan, SavingsGoal, SusuGroup, SusuPayout, Transaction, Wallet } from '@/lib/types';

interface Factor {
  label: string;
  status: 'good' | 'fair' | 'poor';
  detail: string;
}

interface HealthResult {
  score: number;
  grade: string;
  summary: string;
  factors: Factor[];
  tips: string[];
  at: number;
}

const STATUS_STYLES: Record<Factor['status'], { icon: React.ElementType; color: string; bg: string }> = {
  good: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  fair: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  poor: { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-100' },
};

const GRADE_RING: Record<string, string> = {
  Excellent: 'stroke-emerald-500',
  Good: 'stroke-emerald-500',
  Fair: 'stroke-amber-500',
  Struggling: 'stroke-rose-500',
};

const CACHE_KEY = 'isusupro-fin-health-v1';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export function FinancialHealthCard({
  wallets,
  transactions,
  budgets,
  savingsGoals,
  myLoans,
  susuGroups,
  susuPayouts,
}: {
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  myLoans: Loan[];
  susuGroups: SusuGroup[];
  susuPayouts: SusuPayout[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playback if the card unmounts mid-sentence
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  // Restore a recent score so the card is useful instantly on return visits
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HealthResult;
      if (parsed && typeof parsed.score === 'number' && Date.now() - parsed.at < CACHE_TTL) {
        setResult(parsed);
      }
    } catch {
      // corrupted cache — start fresh
    }
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/financial-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallets: wallets.map((w) => ({ type: w.type, balance: w.balance })),
          transactions: transactions.slice(0, 20).map((t) => ({ type: t.type, amount: t.amount, category: t.category, date: t.date })),
          budgets: budgets.map((b) => ({ category: b.category, allocatedAmount: b.allocatedAmount, spentAmount: b.spentAmount })),
          savingsGoals: savingsGoals.slice(0, 6).map((g) => ({ name: g.name, currentAmount: g.currentAmount, targetAmount: g.targetAmount })),
          loans: myLoans.map((l) => ({ status: l.status, amount: l.amount, remainingBalance: l.remainingBalance })),
          susuGroups: susuGroups.map((g) => ({ name: g.name, contributionAmount: g.contributionAmount, frequency: g.frequency, status: g.status })),
          susuPayouts: susuPayouts.slice(0, 5).map((p) => ({ groupName: p.groupName, amount: p.amount, status: p.status, payoutDate: p.payoutDate })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const pack: HealthResult = {
        score: Math.round(Number(data.score)),
        grade: data.grade,
        summary: data.summary,
        factors: data.factors,
        tips: data.tips,
        at: Date.now(),
      };
      setResult(pack);
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(pack));
      } catch {
        // storage full — session-only result is fine
      }
    } catch {
      setError('Could not calculate your Financial Health Score. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [wallets, transactions, budgets, savingsGoals, myLoans, susuGroups, susuPayouts]);

  const openSusuAi = () => window.dispatchEvent(new CustomEvent('susu-ai:open'));

  // ---- Read the score aloud (low-literacy accessibility) ----
  const stopSpeaking = () => {
    audioRef.current?.pause();
    setSpeaking(false);
  };

  const speakScore = async () => {
    if (!result || ttsLoading) return;
    if (speaking) {
      stopSpeaking();
      return;
    }
    setTtsLoading(true);
    setError(null);
    try {
      const language = window.localStorage.getItem('isusupro-ai-lang') || 'en';
      const text = `Your financial health score is ${result.score} out of 100. Grade: ${result.grade}. ${result.summary}`;
      const res = await fetch('/api/ai/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!data?.audioBase64) throw new Error(data?.error || 'TTS unavailable');
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      audio.onended = () => setSpeaking(false);
      audioRef.current = audio;
      await audio.play();
      setSpeaking(true);
    } catch {
      setError('Could not read the score aloud right now. Please try again.');
    } finally {
      setTtsLoading(false);
    }
  };

  const score = result?.score ?? 0;
  const RADIUS = 34;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const ringClass = GRADE_RING[result?.grade ?? ''] ?? 'stroke-emerald-500';

  return (
    <Card className="overflow-hidden border-0 shadow-md shadow-emerald-900/5">
      <div className="relative bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/30">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground lg:text-base">Financial Health Score</p>
                <p className="truncate text-xs text-muted-foreground">
                  {result ? `Your money fitness today · ${result.grade}` : 'Let Susu AI grade your money fitness 0–100'}
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
              ) : result ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{result ? 'Refresh' : 'Get my score'}</span>
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-4 rounded-xl border bg-background/70 p-4">
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                  <p className="pt-1 text-[11px] text-muted-foreground">Susu AI is scoring your savings, budgets, loans and susu rounds…</p>
                </div>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
              </motion.div>
            )}

            {!loading && !error && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Score ring */}
                  <div className="flex shrink-0 flex-col items-center gap-1.5 sm:w-28">
                    <div className="relative h-24 w-24">
                      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
                        <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="8" className="stroke-muted" />
                        <motion.circle
                          cx="40"
                          cy="40"
                          r={RADIUS}
                          fill="none"
                          strokeWidth="8"
                          strokeLinecap="round"
                          className={ringClass}
                          strokeDasharray={CIRCUMFERENCE}
                          initial={{ strokeDashoffset: CIRCUMFERENCE }}
                          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - score / 100) }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold leading-none text-foreground">{score}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        result.grade === 'Excellent' || result.grade === 'Good'
                          ? 'bg-emerald-600 text-white'
                          : result.grade === 'Fair'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-600 text-white'
                      }`}
                    >
                      {result.grade}
                    </span>
                  </div>

                  {/* Summary + factors */}
                  <div className="min-w-0 flex-1 space-y-2">
                    {result.summary && (
                      <p className="rounded-xl border bg-background/70 p-3 text-xs font-medium leading-relaxed text-foreground lg:text-sm">
                        {result.summary}
                      </p>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {result.factors.map((factor, i) => {
                        const style = STATUS_STYLES[factor.status] ?? STATUS_STYLES.fair;
                        const Icon = style.icon;
                        return (
                          <motion.div
                            key={factor.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-start gap-2.5 rounded-xl border bg-background/70 p-2.5"
                          >
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
                              <Icon className={`h-4 w-4 ${style.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground">{factor.label}</p>
                              {factor.detail && (
                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{factor.detail}</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {result.tips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.tips.map((tip, i) => (
                      <span key={i} className="flex items-start gap-1 rounded-full border bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground">
                        <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
                        {tip}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openSusuAi}
                    className="gap-1.5 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                  >
                    <MessageCircleQuestion className="h-4 w-4" />
                    Ask Susu AI how to improve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void speakScore()}
                    disabled={ttsLoading}
                    aria-label={speaking ? 'Stop reading score aloud' : 'Read my score aloud'}
                    title={speaking ? 'Stop reading score aloud' : 'Read my score aloud'}
                    className="gap-1.5 rounded-xl"
                  >
                    {ttsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : speaking ? (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{speaking ? 'Stop' : 'Read aloud'}</span>
                  </Button>
                </div>
              </motion.div>
            )}

            {!loading && !error && !result && (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-muted-foreground">
                One tap — Susu AI reviews your savings, budgets, loans and susu rounds and gives you a score out of 100 with a personal action plan.
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </div>
    </Card>
  );
}
