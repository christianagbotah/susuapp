/**
 * iSusuPro — Payment Simulator
 * -----------------------------
 * Used whenever a provider has no live credentials configured.
 *
 * Behaviour mirrors the real MoMo rails:
 *   1. Charge request accepted → status 'processing'
 *      ("Approve the prompt on your phone").
 *   2. After 2.5–7s the payer "approves" or the push times out.
 *      Outcomes are DETERMINISTIC per reference (hash), so polling
 *      always returns the same final state — no flaky UI.
 *
 * Outcome distribution (tuned to feel like Ghana's rails):
 *   collections   : ~91% success, ~7% failed (PIN wrong/declined), ~2% cancelled (timeout)
 *   disbursements : ~95% success, ~5% failed
 *
 * A simulated webhook event is also recorded, so the admin
 * webhook log looks identical in shape to production traffic.
 */

import type { PaymentIntent, PaymentProvider, PaymentStatus, ProviderResult } from './types';
import { recordWebhookEvent, updateIntent } from './ledger';

function hashRef(reference: string): number {
  let h = 2166136261;
  for (let i = 0; i < reference.length; i++) {
    h ^= reference.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const MIN_DELAY_MS = 2500;
const MAX_DELAY_MS = 7000;

export function simulatedCharge(provider: PaymentProvider, reference: string): ProviderResult {
  return {
    provider,
    ok: true,
    status: 'processing',
    providerReference: `${provider === 'hubtel' ? 'HB' : 'PS'}-${hashRef(reference) % 1_000_000}`,
    message: 'USSD push sent — awaiting customer approval on their handset',
    raw: { simulated: true },
  };
}

export function simulatedDisbursement(provider: PaymentProvider, reference: string): ProviderResult {
  return {
    provider,
    ok: true,
    status: 'processing',
    providerReference: `${provider === 'hubtel' ? 'HB' : 'PS'}-T${hashRef(reference) % 1_000_000}`,
    message: 'Transfer queued on the network — awaiting debit approval',
    raw: { simulated: true },
  };
}

/** Deterministic final status for a reference. */
function finalStatus(reference: string, direction: PaymentIntent['direction']): { status: PaymentStatus; message: string } {
  const roll = hashRef(reference) % 100;
  if (direction === 'collection') {
    if (roll < 91) return { status: 'success', message: 'Approved by payer — wallet debited' };
    if (roll < 98) return { status: 'failed', message: 'Declined at the handset — wrong PIN or insufficient MoMo balance' };
    return { status: 'cancelled', message: 'Push expired — the payer did not respond in time' };
  }
  if (roll < 95) return { status: 'success', message: 'Transfer completed — recipient wallet/bank credited' };
  return { status: 'failed', message: 'Transfer rejected by the network — please retry' };
}

/** Schedules the terminal state transition on the ledger. */
export function scheduleSimulatedResolution(intent: PaymentIntent): void {
  const delay = MIN_DELAY_MS + (hashRef(`d${intent.reference}`) % (MAX_DELAY_MS - MIN_DELAY_MS));
  setTimeout(() => {
    const { status, message } = finalStatus(intent.reference, intent.direction);
    const updated = updateIntent(intent.reference, {
      status,
      message,
      settledAt: new Date().toISOString(),
    });
    if (updated) {
      recordWebhookEvent({
        id: `wh-${Date.now()}-${hashRef(intent.reference) % 9999}`,
        provider: intent.provider,
        event: intent.direction === 'collection' ? 'charge.success' : 'transfer.success',
        reference: intent.reference,
        simulated: true,
        payloadPreview: JSON.stringify({
          reference: intent.reference,
          providerReference: intent.providerReference,
          amount: intent.amount,
          status,
          simulated: true,
        }),
        receivedAt: new Date().toISOString(),
      });
    }
  }, delay);
}
