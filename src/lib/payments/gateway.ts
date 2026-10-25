/**
 * iSusuPro — Payment Gateway Facade
 * -----------------------------------
 * The single entry point used by the API routes:
 *
 *   chargeMomo()    — customer pays INTO the platform via MoMo
 *   disburse()      — platform pays OUT via MoMo or bank
 *   verifyIntent()  — poll the provider (or simulator) for status
 *   handleWebhook() — process provider callbacks
 *
 * For every request the facade:
 *   1. Resolves the provider (explicit > active setting > first
 *      configured), and its mode (live vs simulation).
 *   2. Creates a PaymentIntent in the ledger with an ISU- reference.
 *   3. Calls the real provider adapter, or the simulator when no
 *      credentials are configured.
 *   4. Returns the intent immediately — terminal states arrive via
 *      polling (verify) or webhooks, exactly like real rails.
 */

import { randomUUID } from 'crypto';
import type {
  DisbursementRequest,
  MomoChargeRequest,
  PaymentIntent,
  PaymentProvider,
  ProviderResult,
} from './types';
import { computeFee } from './types';
import { createIntent, findByAnyReference, recordWebhookEvent, updateIntent } from './ledger';
import { resolveProvider, getActiveProvider } from './server-config';
import { scheduleSimulatedResolution, simulatedCharge, simulatedDisbursement } from './simulator';
import { hubtelAdapter, type HubtelCredentials } from './providers/hubtel';
import { paystackAdapter, type PaystackCredentials } from './providers/paystack';

export function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const noise = Math.floor(Math.random() * 9000 + 1000);
  return `ISU-${stamp}-${noise}`;
}

async function pickProvider(explicit?: PaymentProvider | null): Promise<{
  provider: PaymentProvider;
  mode: 'live' | 'simulation';
  fees: { percent: number; flat: number };
}> {
  if (explicit === 'hubtel' || explicit === 'paystack') {
    const resolved = await resolveProvider(explicit);
    return { provider: resolved.provider, mode: resolved.mode, fees: resolved.fees };
  }
  const active = await getActiveProvider();
  if (active) {
    const resolved = await resolveProvider(active);
    return { provider: resolved.provider, mode: resolved.mode, fees: resolved.fees };
  }
  // No active preference — prefer the first provider that is fully configured
  for (const candidate of ['hubtel', 'paystack'] as const) {
    const resolved = await resolveProvider(candidate);
    if (resolved.mode === 'live') return { provider: resolved.provider, mode: resolved.mode, fees: resolved.fees };
  }
  const fallback = await resolveProvider('hubtel'); // default aggregator for Ghana
  return { provider: fallback.provider, mode: fallback.mode, fees: fallback.fees };
}

function callbackUrl(origin: string, provider: PaymentProvider): string {
  return `${origin.replace(/\/$/, '')}/api/payments/webhook/${provider}`;
}

/* ------------------------------------------------------------------ */
/* COLLECTIONS                                                         */
/* ------------------------------------------------------------------ */

export async function chargeMomo(
  req: MomoChargeRequest,
  options: { provider?: PaymentProvider | null; origin: string },
): Promise<PaymentIntent> {
  const picked = await pickProvider(options.provider);
  const fee = computeFee(req.amount, picked.fees);
  const now = new Date().toISOString();
  const reference = generateReference();

  const intent: PaymentIntent = {
    id: randomUUID(),
    reference,
    provider: picked.provider,
    providerReference: null,
    mode: picked.mode,
    direction: 'collection',
    purpose: req.purpose,
    channel: 'momo',
    amount: req.amount,
    fee,
    total: Math.round((req.amount + fee) * 100) / 100,
    network: req.network,
    phone: req.phone,
    recipientName: 'iSusuPro Ghana',
    description: req.description,
    status: 'pending',
    message: 'Request created',
    metadata: req.metadata,
    createdAt: now,
    updatedAt: now,
  };
  createIntent(intent);

  let result: ProviderResult;
  if (picked.mode === 'live') {
    const cb = callbackUrl(options.origin, picked.provider);
    result = picked.provider === 'hubtel'
      ? await hubtelAdapter.chargeMomo(req, {
          clientId: (await resolveProvider('hubtel')).credentials.clientId ?? '',
          clientSecret: (await resolveProvider('hubtel')).credentials.clientSecret ?? '',
          apiKey: (await resolveProvider('hubtel')).credentials.apiKey,
        } as HubtelCredentials, cb)
      : await paystackAdapter.chargeMomo(req, {
          secretKey: (await resolveProvider('paystack')).credentials.secretKey ?? '',
        } as PaystackCredentials, cb);
  } else {
    result = simulatedCharge(picked.provider, reference);
    scheduleSimulatedResolution(intent);
  }

  return updateIntent(reference, {
    providerReference: result.providerReference || null,
    status: result.status,
    message: result.message,
  }) ?? intent;
}

/* ------------------------------------------------------------------ */
/* DISBURSEMENTS                                                       */
/* ------------------------------------------------------------------ */

export async function disburse(
  req: DisbursementRequest,
  options: { provider?: PaymentProvider | null; origin: string },
): Promise<PaymentIntent> {
  const picked = await pickProvider(options.provider);
  const fee = computeFee(req.amount, picked.fees);
  const now = new Date().toISOString();
  const reference = generateReference();

  const intent: PaymentIntent = {
    id: randomUUID(),
    reference,
    provider: picked.provider,
    providerReference: null,
    mode: picked.mode,
    direction: 'disbursement',
    purpose: req.purpose,
    channel: req.channel,
    amount: req.amount,
    fee,
    total: req.amount, // recipient gets the full amount; platform absorbs the fee
    network: req.network,
    phone: req.phone,
    bank: req.bank,
    recipientName: req.recipientName,
    description: req.description,
    status: 'pending',
    message: 'Request created',
    metadata: req.metadata,
    createdAt: now,
    updatedAt: now,
  };
  createIntent(intent);

  let result: ProviderResult;
  if (picked.mode === 'live') {
    const cb = callbackUrl(options.origin, picked.provider);
    const resolved = await resolveProvider(picked.provider);
    if (picked.provider === 'hubtel') {
      const creds = resolved.credentials as unknown as HubtelCredentials;
      result = req.channel === 'momo'
        ? await hubtelAdapter.disburseMomo(req, creds, cb)
        : await hubtelAdapter.disburseBank(req, req.bank!, creds, cb);
    } else {
      const creds = resolved.credentials as unknown as PaystackCredentials;
      result = req.channel === 'momo'
        ? await paystackAdapter.disburseMomo(req, creds, cb)
        : await paystackAdapter.disburseBank(req, req.bank!, creds, cb);
    }
  } else {
    result = simulatedDisbursement(picked.provider, reference);
    scheduleSimulatedResolution(intent);
  }

  return updateIntent(reference, {
    providerReference: result.providerReference || null,
    status: result.status,
    message: result.message,
  }) ?? intent;
}

/* ------------------------------------------------------------------ */
/* VERIFICATION (polling)                                              */
/* ------------------------------------------------------------------ */

export async function verifyIntent(reference: string): Promise<PaymentIntent | null> {
  const intent = getByReferenceSafe(reference);
  if (!intent) return null;

  // Terminal states never change; pending/processing in live mode → ask the provider
  if (intent.mode === 'live' && (intent.status === 'pending' || intent.status === 'processing') && intent.providerReference) {
    const resolved = await resolveProvider(intent.provider);
    let result: ProviderResult | null = null;
    if (intent.provider === 'hubtel') {
      result = await hubtelAdapter.verify(intent.direction, intent.providerReference, resolved.credentials as unknown as HubtelCredentials);
    } else {
      result = await paystackAdapter.verify(intent.direction, intent.providerReference, resolved.credentials as unknown as PaystackCredentials);
    }
    if (result.status !== intent.status) {
      return updateIntent(reference, { status: result.status, message: result.message });
    }
  }
  return intent;
}

function getByReferenceSafe(reference: string): PaymentIntent | null {
  return findByAnyReference(reference);
}

/* ------------------------------------------------------------------ */
/* WEBHOOKS                                                            */
/* ------------------------------------------------------------------ */

export async function handleWebhook(
  provider: PaymentProvider,
  rawBody: string,
  headers: Headers,
): Promise<{ received: boolean; matched: boolean; reason?: string }> {
  const resolved = await resolveProvider(provider);

  let valid = false;
  let reason: string | undefined;
  if (provider === 'paystack') {
    const check = paystackAdapter.verifyWebhook(rawBody, headers, resolved.credentials as unknown as PaystackCredentials);
    valid = check.valid;
    reason = check.reason;
  } else {
    const check = hubtelAdapter.verifyWebhook(rawBody, headers, resolved.credentials as unknown as HubtelCredentials);
    valid = check.valid;
    reason = check.reason;
  }
  if (!valid) return { received: false, matched: false, reason };

  let parsed: any;
  try { parsed = JSON.parse(rawBody); } catch { return { received: false, matched: false, reason: 'malformed JSON' }; }

  const event: string = parsed?.event ?? (provider === 'hubtel' ? 'transaction.status' : 'unknown');
  const data = parsed?.data ?? {};
  const ref: string | undefined = data.clientReference ?? data.reference ?? data.transfer_code;
  const intent = ref ? findByAnyReference(ref) : null;

  recordWebhookEvent({
    id: `wh-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    provider,
    event,
    reference: intent?.reference ?? ref,
    simulated: false,
    payloadPreview: rawBody.slice(0, 500),
    receivedAt: new Date().toISOString(),
  });

  if (!intent) return { received: true, matched: false, reason: 'no matching intent' };

  let status: PaymentIntent['status'] = 'processing';
  const s = String(data.status ?? '').toLowerCase();
  if (['success', 'paid', 'completed', 'delivered'].includes(s)) status = 'success';
  else if (['failed', 'declined', 'reversed', 'rejected', 'error'].includes(s)) status = 'failed';
  else if (['abandoned', 'cancelled', 'expired', 'timeout'].includes(s)) status = 'cancelled';

  if (status !== intent.status) {
    updateIntent(intent.reference, {
      status,
      message: `Webhook ${event} → ${status}`,
    });
  }
  return { received: true, matched: true };
}
