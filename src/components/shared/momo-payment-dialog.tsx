'use client';

/**
 * iSusuPro — Shared MoMo Payment Dialog
 * ---------------------------------------
 * One reusable flow for every customer-facing collection:
 * wallet deposits, susu contributions and loan repayments —
 * over MTN MoMo, Telecel Cash or AT Money, processed through
 * Hubtel or Paystack (whichever is active in Admin → Settings).
 *
 * Flow: form → processing (approve-on-handset) → success/failed.
 * Status is polled from /api/payments/status every 2s. In
 * simulation mode the outcome arrives after 2.5–7s, exactly like
 * a real MoMo push.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, CheckCircle2, XCircle, Clock, RefreshCw, Loader2,
  Phone, AlertTriangle, Zap, ShieldCheck, ArrowRight, Landmark,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatGHS } from '@/lib/formatters';
import {
  MOMO_NETWORKS, NETWORK_BRAND, computeFee, detectNetworkFromPhone,
  normalizeGhanaPhone,
} from '@/lib/payments/types';
import type { MomoNetwork, PaymentIntent, PaymentProvider } from '@/lib/payments/types';
import { usePaymentsStore } from '@/store/payments-store';

export type MomoPurpose = 'wallet_deposit' | 'susu_contribution' | 'loan_repayment';

interface MomoPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purpose: MomoPurpose;
  title: string;
  subtitle?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  /** Lock the amount (e.g. a contribution already chosen). */
  fixedAmount?: number;
  defaultAmount?: number;
  amountPresets?: number[];
  /** Pre-select the network (page already asked for it). */
  initialNetwork?: MomoNetwork;
  metadata?: Record<string, unknown>;
  /** Fired exactly once when the payment settles successfully. */
  onSettled: (intent: PaymentIntent) => void;
}

type Phase = 'form' | 'processing' | 'success' | 'failed' | 'timeout';

const SUCCESS_HEADLINE: Record<MomoPurpose, string> = {
  wallet_deposit: 'Wallet top-up confirmed',
  susu_contribution: 'Susu contribution received',
  loan_repayment: 'Loan repayment received',
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30;

export function MomoPaymentDialog({
  open, onOpenChange, purpose, title, subtitle,
  customerName, customerPhone, customerEmail,
  fixedAmount, defaultAmount, amountPresets, initialNetwork,
  metadata, onSettled,
}: MomoPaymentDialogProps) {
  const [phase, setPhase] = useState<Phase>('form');
  const [amount, setAmount] = useState<string>(fixedAmount ? String(fixedAmount) : defaultAmount ? String(defaultAmount) : '');
  const [network, setNetwork] = useState<MomoNetwork | null>(null);
  const [phone, setPhone] = useState(customerPhone || '');
  const [submitting, setSubmitting] = useState(false);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const settledRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gateway = usePaymentsStore(s => s.gateway);
  const upsertIntent = usePaymentsStore(s => s.upsertIntent);
  const setGateway = usePaymentsStore(s => s.setGateway);

  /* ---------- gateway status (provider + mode + fees) ---------- */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/payments/config');
        if (!res.ok || cancelled) return;
        const status = await res.json();
        if (!cancelled) setGateway(status);
      } catch { /* offline — cached status still renders */ }
    })();
    return () => { cancelled = true; };
  }, [open, setGateway]);

  const activeProvider: PaymentProvider = gateway?.activeProvider ?? 'hubtel';
  const mode = gateway?.activeMode ?? 'simulation';
  const fees = gateway?.[activeProvider]?.fees ?? { percent: 1, flat: 0.5 };

  const numericAmount = useMemo(() => Math.round((Number(amount) || 0) * 100) / 100, [amount]);
  const feeEstimate = useMemo(() => numericAmount > 0 ? computeFee(numericAmount, fees) : 0, [numericAmount, fees]);

  /* ---------- reset ONLY on the closed→open transition ----------
     Never reset mid-session: the parent may clear its amount state
     inside onSettled (e.g. "₵0" fixedAmount), which must not stomp
     the success/processing phase that is still on screen. */
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setPhase('form');
      setIntent(null);
      setElapsed(0);
      settledRef.current = false;
      setAmount(fixedAmount ? String(fixedAmount) : defaultAmount ? String(defaultAmount) : '');
      setPhone(customerPhone || '');
      setNetwork(initialNetwork ?? null);
    }
    prevOpenRef.current = open;
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [open]);

  /* ---------- auto-detect network from phone prefix ---------- */
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const detected = detectNetworkFromPhone(value);
    if (detected) setNetwork(detected);
  };

  /* ---------- submit → charge ---------- */
  const submit = useCallback(async () => {
    if (numericAmount < 1 || numericAmount > 10000) {
      toast.error('Enter an amount between ₵1 and ₵10,000');
      return;
    }
    const normalizedPhone = normalizeGhanaPhone(phone);
    if (!normalizedPhone) {
      toast.error('Enter a valid Ghana MoMo number (e.g. 024 123 4567)');
      return;
    }
    if (!network) {
      toast.error('Pick your mobile money network');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose,
          amount: numericAmount,
          network,
          phone: normalizedPhone,
          customerName,
          customerEmail,
          provider: activeProvider,
          description: `${title} — ${customerName} (${NETWORK_BRAND[network].label})`,
          metadata,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Payment request was rejected');
        return;
      }
      const created = data.intent as PaymentIntent;
      setIntent(created);
      upsertIntent(created);
      if (created.status === 'failed') {
        setPhase('failed');
        return;
      }
      setPhase('processing');
      setElapsed(0);
    } catch {
      toast.error('Network error — could not reach the payment gateway');
    } finally {
      setSubmitting(false);
    }
  }, [numericAmount, phone, network, purpose, customerName, customerEmail, activeProvider, title, metadata, upsertIntent]);

  /* ---------- poll for settlement ---------- */
  useEffect(() => {
    if (phase !== 'processing' || !intent) return;

    tickRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    let polls = 0;
    const poll = async () => {
      polls += 1;
      if (polls > MAX_POLLS) {
        if (pollRef.current) clearInterval(pollRef.current);
        if (tickRef.current) clearInterval(tickRef.current);
        setPhase('timeout');
        return;
      }
      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(intent.reference)}`);
        if (!res.ok) return;
        const data = await res.json();
        const current = data.intent as PaymentIntent;
        // Only advance on a real status change — otherwise setState would
        // re-run this effect and silently reset the poll counter.
        if (!current || current.status === intent.status) return;
        setIntent(current);
        if (current.status === 'success') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (tickRef.current) clearInterval(tickRef.current);
          upsertIntent(current);
          if (!settledRef.current) {
            settledRef.current = true;
            onSettled(current);
          }
          setPhase('success');
        } else if (current.status === 'failed' || current.status === 'cancelled') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (tickRef.current) clearInterval(tickRef.current);
          upsertIntent(current);
          setPhase('failed');
        }
      } catch { /* transient — keep polling */ }
    };
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, intent, onSettled, upsertIntent]);

  const networkOptions = MOMO_NETWORKS;
  const providerLabel = activeProvider === 'hubtel' ? 'Hubtel' : 'Paystack';

  return (
    <Dialog open={open} onOpenChange={(next) => { if (phase !== 'processing') onOpenChange(next); }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            {title}
          </DialogTitle>
          {(subtitle || phase === 'form') && (
            <DialogDescription>
              {subtitle ?? 'Pay with mobile money — MTN MoMo, Telecel Cash or AT Money.'}
            </DialogDescription>
          )}
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ══════════════ FORM ══════════════ */}
          {phase === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount (₵)</label>
                {fixedAmount ? (
                  <div className="rounded-lg border bg-muted/50 px-3 py-2.5 text-lg font-bold">{formatGHS(fixedAmount)}</div>
                ) : (
                  <>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="text-lg font-semibold h-12"
                    />
                    {amountPresets && amountPresets.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {amountPresets.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setAmount(String(p))}
                            className="flex-1 rounded-lg border px-2 py-2 text-sm font-medium hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors min-h-[40px]"
                          >
                            {formatGHS(p)}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Network */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mobile money network</label>
                <div className="grid grid-cols-3 gap-2">
                  {networkOptions.map(n => {
                    const brand = NETWORK_BRAND[n];
                    const selected = network === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNetwork(n)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 transition-all min-h-[64px] ${
                          selected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-border hover:border-muted-foreground/40'
                        }`}
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                          style={{ backgroundColor: brand.hex, color: n === 'MTN' ? '#1a1a1a' : '#fff' }}
                        >
                          {brand.short.slice(0, 2)}
                        </span>
                        <span className="text-[11px] font-medium leading-tight text-center">{brand.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">MoMo number to debit</label>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 items-center rounded-lg border bg-muted px-3 text-sm font-semibold">+233</span>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="24 123 4567"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className="h-11 font-medium tracking-wide"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The approval prompt is sent to this number. Keep the phone unlocked.
                </p>
              </div>

              {/* Fee + provider strip */}
              <div className="rounded-xl border bg-muted/40 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gateway</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Landmark className="h-3.5 w-3.5" /> {providerLabel}
                    <Badge variant="secondary" className={`h-4 px-1.5 text-[10px] ${mode === 'live' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300' : 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                      {mode === 'live' ? 'LIVE' : 'TEST MODE'}
                    </Badge>
                  </span>
                </div>
                {numericAmount > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Payer fee ({fees.percent}%{fees.flat > 0 ? ` + ${formatGHS(fees.flat)}` : ''})</span>
                      <span className="font-medium">{formatGHS(feeEstimate)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Total charged to MoMo wallet</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatGHS(numericAmount + feeEstimate)}</span>
                    </div>
                  </>
                )}
                <p className="flex items-start gap-1 text-[10px] text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
                  {mode === 'live'
                    ? 'Live mode — real money moves over the provider rails.'
                    : 'Test mode — no real money moves. Add provider keys in Admin → Settings → Payments to go live.'}
                </p>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                disabled={submitting || numericAmount < 1 || !network || !normalizeGhanaPhone(phone)}
                onClick={submit}
              >
                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                {submitting ? 'Sending push…' : `Pay ${numericAmount > 0 ? formatGHS(numericAmount + feeEstimate) : ''}`}
              </Button>
            </motion.div>
          )}

          {/* ══════════════ PROCESSING ══════════════ */}
          {phase === 'processing' && intent && (
            <motion.div key="processing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5 py-2">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-emerald-400/30"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-[spin_1.2s_linear_infinite]" />
                  <Smartphone className="absolute inset-0 m-auto h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-base font-semibold">Approve the prompt on your phone</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {intent.network === 'MTN' ? 'MTN MoMo' : intent.network === 'TELECEL' ? 'Telecel Cash' : 'AT Money'} has sent a confirmation request to{' '}
                    <span className="font-medium text-foreground">{intent.phone}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold">{formatGHS(intent.total)}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground">Reference</p>
                  <p className="text-xs font-mono font-semibold">{intent.reference.slice(0, 14)}…</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground">Elapsed</p>
                  <p className="text-sm font-bold tabular-nums">{elapsed}s</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 animate-pulse text-emerald-600" />
                Waiting for the network… this usually takes under 15 seconds.
              </div>
            </motion.div>
          )}

          {/* ══════════════ SUCCESS ══════════════ */}
          {phase === 'success' && intent && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
              >
                <CheckCircle2 className="h-11 w-11 text-emerald-600" />
              </motion.div>
              <div>
                <p className="text-lg font-bold">Payment successful</p>
                <p className="text-sm text-muted-foreground">
                  {SUCCESS_HEADLINE[purpose]} — <span className="font-medium text-foreground">{formatGHS(intent.amount)}</span> settled over{' '}
                  {intent.provider === 'hubtel' ? 'Hubtel' : 'Paystack'}.
                </p>
              </div>
              <div className="space-y-1.5 rounded-xl border bg-muted/40 p-3 text-left text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatGHS(intent.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payer fee</span><span className="font-semibold">{formatGHS(intent.fee)}</span></div>
                <div className="flex justify-between border-t pt-1.5"><span className="text-muted-foreground">Total debited</span><span className="font-bold">{formatGHS(intent.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Network</span><span className="font-semibold">{intent.network === 'MTN' ? 'MTN MoMo' : intent.network === 'TELECEL' ? 'Telecel Cash' : 'AT Money'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="font-semibold">{intent.provider === 'hubtel' ? 'Hubtel' : 'Paystack'} · {intent.mode === 'live' ? 'live' : 'test'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{intent.reference}</span></div>
              </div>
              <Button className="w-full h-11 font-semibold" onClick={() => onOpenChange(false)}>
                Done <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ══════════════ FAILED / TIMEOUT ══════════════ */}
          {(phase === 'failed' || phase === 'timeout') && intent && (
            <motion.div key="failed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 py-2 text-center">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${phase === 'failed' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                {phase === 'failed'
                  ? <XCircle className="h-11 w-11 text-red-600" />
                  : <AlertTriangle className="h-11 w-11 text-amber-600" />}
              </div>
              <div>
                <p className="text-lg font-bold">{phase === 'failed' ? 'Payment not completed' : 'Still waiting on the network'}</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  {phase === 'failed'
                    ? (intent.message || 'The mobile money request was declined. No money has left your wallet.')
                    : 'We have not received a confirmation yet. If you approved it late, the payment may still settle — check your transaction history in a minute.'}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3 text-left text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{intent.reference}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatGHS(intent.total)}</span></div>
              </div>
              <div className="flex gap-2">
                {phase === 'failed' && (
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setPhase('form')}>
                    <RefreshCw className="mr-1 h-4 w-4" /> Try again
                  </Button>
                )}
                <Button className="flex-1 h-11 font-semibold" onClick={() => onOpenChange(false)}>Close</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
