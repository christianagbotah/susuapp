/**
 * iSusuPro — Payment Ledger (server memory)
 * -----------------------------------------
 * Single source of truth for payment intents and disbursements
 * while the Next.js server process is alive (same pattern as the
 * NestJS in-memory DataStoreService used elsewhere in this app).
 *
 * In production this becomes a Prisma `PaymentIntent` table —
 * the interface below is deliberately shaped like a repository
 * so swapping the backing store is a drop-in change.
 */

import type { PaymentIntent, WebhookEvent } from './types';

const MAX_INTENTS = 500;
const MAX_WEBHOOKS = 200;

const intents = new Map<string, PaymentIntent>();
const webhookLog: WebhookEvent[] = [];

export function createIntent(intent: PaymentIntent): PaymentIntent {
  intents.set(intent.reference, intent);
  if (intents.size > MAX_INTENTS) {
    const oldest = intents.keys().next().value;
    if (oldest) intents.delete(oldest);
  }
  return intent;
}

export function updateIntent(
  reference: string,
  patch: Partial<PaymentIntent> & { status?: PaymentIntent['status'] },
): PaymentIntent | null {
  const current = intents.get(reference);
  if (!current) return null;
  const next: PaymentIntent = { ...current, ...patch, updatedAt: new Date().toISOString() };
  if (patch.status === 'success' || patch.status === 'failed' || patch.status === 'cancelled') {
    next.settledAt = next.settledAt ?? new Date().toISOString();
  }
  intents.set(reference, next);
  return next;
}

export function getByReference(reference: string): PaymentIntent | null {
  return intents.get(reference) ?? null;
}

export interface IntentFilter {
  direction?: PaymentIntent['direction'];
  status?: PaymentIntent['status'];
  purpose?: PaymentIntent['purpose'];
  provider?: PaymentIntent['provider'];
  limit?: number;
}

export function listIntents(filter: IntentFilter = {}): PaymentIntent[] {
  let rows = Array.from(intents.values());
  if (filter.direction) rows = rows.filter(r => r.direction === filter.direction);
  if (filter.status) rows = rows.filter(r => r.status === filter.status);
  if (filter.purpose) rows = rows.filter(r => r.purpose === filter.purpose);
  if (filter.provider) rows = rows.filter(r => r.provider === filter.provider);
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return rows.slice(0, filter.limit ?? 100);
}

export function ledgerStats() {
  const all = Array.from(intents.values());
  const collections = all.filter(r => r.direction === 'collection');
  const disbursements = all.filter(r => r.direction === 'disbursement');
  const sum = (rows: PaymentIntent[]) =>
    rows.filter(r => r.status === 'success').reduce((acc, r) => acc + r.amount, 0);
  return {
    totalIntents: all.length,
    collections: {
      count: collections.length,
      successCount: collections.filter(r => r.status === 'success').length,
      pendingCount: collections.filter(r => r.status === 'pending' || r.status === 'processing').length,
      volumeGHS: Math.round(sum(collections) * 100) / 100,
    },
    disbursements: {
      count: disbursements.length,
      successCount: disbursements.filter(r => r.status === 'success').length,
      pendingCount: disbursements.filter(r => r.status === 'pending' || r.status === 'processing').length,
      volumeGHS: Math.round(sum(disbursements) * 100) / 100,
    },
    webhookEvents: webhookLog.length,
  };
}

export function recordWebhookEvent(entry: WebhookEvent): void {
  webhookLog.unshift(entry);
  if (webhookLog.length > MAX_WEBHOOKS) webhookLog.pop();
}

export function listWebhookEvents(limit = 50): WebhookEvent[] {
  return webhookLog.slice(0, limit);
}

/** Find an intent by any reference-ish field a provider might echo back. */
export function findByAnyReference(ref: unknown): PaymentIntent | null {
  if (typeof ref !== 'string' || !ref) return null;
  if (intents.has(ref)) return intents.get(ref)!;
  for (const intent of intents.values()) {
    if (intent.providerReference === ref) return intent;
  }
  // last resort: provider may truncate/suffix our reference
  for (const intent of intents.values()) {
    if (ref.includes(intent.reference)) return intent;
  }
  return null;
}
