/**
 * iSusuPro — Hubtel Provider Adapter
 * -----------------------------------
 * Implements the documented Hubtel Unified Payments API v2:
 *
 *   Collections (Receive Money):
 *     POST https://api.hubtel.com/v2/collect-money/rs/initiate
 *     Auth: HTTP Basic (API clientId:clientSecret)
 *
 *   Disbursements (Send Money — MoMo push out / bank):
 *     POST https://api.hubtel.com/v2/send-money/rs/initiate
 *
 *   Transaction status (polling):
 *     GET  https://api.hubtel.com/v2/{collect-money|send-money}/rs/status?clientReference=…
 *
 * Network channel codes (Ghana):
 *   MTN → 'mtn-gh' · Telecel → 'telecel-gh' (legacy 'vodafone-gh') ·
 *   AT → 'at-gh' (legacy 'airteltigo-gh')
 *
 * NOTE: exact paths/field names follow Hubtel's published developer
 * docs (developers.hubtel.com). They are isolated in the constants
 * below so any drift on their side is a one-line fix here.
 */

import type {
  BankDisbursementDetails,
  DisbursementRequest,
  MomoChargeRequest,
  MomoNetwork,
  PaymentIntent,
  PaymentStatus,
  ProviderResult,
} from '../types';

const BASE = 'https://api.hubtel.com/v2';
const COLLECT_PATH = '/collect-money/rs/initiate';
const SEND_PATH = '/send-money/rs/initiate';
const STATUS_PATH = '/rs/status';
const REQUEST_TIMEOUT_MS = 12_000;

const CHANNELS: Record<MomoNetwork, string> = {
  MTN: 'mtn-gh',
  TELECEL: 'telecel-gh', // Hubtel still accepts legacy 'vodafone-gh'
  AT: 'at-gh', // legacy 'airteltigo-gh'
};

export interface HubtelCredentials {
  clientId: string;
  clientSecret: string;
  apiKey?: string;
}

function basicAuth(creds: HubtelCredentials): string {
  return `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`;
}

function toPesewas(amountGhs: number): number {
  return Math.round(amountGhs * 100);
}

async function hubtelFetch(
  path: string,
  creds: HubtelCredentials,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; json: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: basicAuth(creds),
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let json: any = null;
    try { json = await res.json(); } catch { json = null; }
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function mapHubtelStatus(raw: unknown): PaymentStatus {
  const s = String(raw ?? '').toLowerCase();
  if (['success', 'completed', 'paid', 'delivered'].includes(s)) return 'success';
  if (['failed', 'error', 'rejected', 'declined'].includes(s)) return 'failed';
  if (['cancelled', 'canceled', 'expired', 'timeout'].includes(s)) return 'cancelled';
  return 'processing'; // 'inprogress' | 'queued' | unknown → keep polling
}

export const hubtelAdapter = {
  /** MoMo collection — customer approves a push on their handset. */
  async chargeMomo(req: MomoChargeRequest, creds: HubtelCredentials, callbackUrl: string): Promise<ProviderResult> {
    const body = {
      amount: toPesewas(req.amount),
      customerNumber: req.phone.replace(/^0/, ''), // Hubtel expects 24XXXXXXXX
      customerName: req.customerName,
      customerEmail: req.customerEmail ?? '',
      channel: CHANNELS[req.network],
      description: req.description.slice(0, 100),
      primaryCallbackUrl: callbackUrl,
      secondaryCallbackUrl: '',
      reference: `${Date.now()}-${req.purpose}`,
    };
    const res = await hubtelFetch(COLLECT_PATH, creds, body);
    const data = res.json?.data ?? {};
    if (!res.ok) {
      return {
        provider: 'hubtel',
        ok: false,
        status: 'failed',
        providerReference: '',
        message: res.json?.message || `Hubtel rejected the collection (HTTP ${res.status})`,
        raw: res.json,
      };
    }
    return {
      provider: 'hubtel',
      ok: true,
      status: mapHubtelStatus(data.status ?? 'inprogress'),
      providerReference: String(data.transactionId ?? data.id ?? ''),
      message: 'Hubtel accepted the charge — awaiting handset approval',
      raw: res.json,
    };
  },

  /** Money OUT via MoMo (loan disbursement, susu payout, commission). */
  async disburseMomo(req: DisbursementRequest, creds: HubtelCredentials, callbackUrl: string): Promise<ProviderResult> {
    if (!req.phone || !req.network) {
      return { provider: 'hubtel', ok: false, status: 'failed', providerReference: '', message: 'MoMo disbursement requires phone + network' };
    }
    const body = {
      amount: toPesewas(req.amount),
      customerNumber: req.phone.replace(/^0/, ''),
      customerName: req.recipientName,
      channel: CHANNELS[req.network],
      description: req.description.slice(0, 100),
      primaryCallbackUrl: callbackUrl,
      reference: `${Date.now()}-${req.purpose}`,
    };
    const res = await hubtelFetch(SEND_PATH, creds, body);
    const data = res.json?.data ?? {};
    if (!res.ok) {
      return {
        provider: 'hubtel',
        ok: false,
        status: 'failed',
        providerReference: '',
        message: res.json?.message || `Hubtel rejected the send-money (HTTP ${res.status})`,
        raw: res.json,
      };
    }
    return {
      provider: 'hubtel',
      ok: true,
      status: mapHubtelStatus(data.status ?? 'queued'),
      providerReference: String(data.transactionId ?? data.id ?? ''),
      message: 'Hubtel queued the transfer',
      raw: res.json,
    };
  },

  /** Money OUT to a Ghana bank account. */
  async disburseBank(req: DisbursementRequest, bank: BankDisbursementDetails, creds: HubtelCredentials, callbackUrl: string): Promise<ProviderResult> {
    const body = {
      amount: toPesewas(req.amount),
      customerName: bank.accountName || req.recipientName,
      channel: 'bank-gh',
      description: `${req.description.slice(0, 80)} — ${bank.bankName} ${bank.accountNumber}`.slice(0, 100),
      primaryCallbackUrl: callbackUrl,
      // Hubtel bank payouts take the beneficiary account in additionalFields
      additionalFields: {
        accountName: bank.accountName,
        accountNumber: bank.accountNumber,
        bankName: bank.bankName,
      },
      reference: `${Date.now()}-${req.purpose}`,
    };
    const res = await hubtelFetch(SEND_PATH, creds, body);
    const data = res.json?.data ?? {};
    if (!res.ok) {
      return {
        provider: 'hubtel',
        ok: false,
        status: 'failed',
        providerReference: '',
        message: res.json?.message || `Hubtel rejected the bank payout (HTTP ${res.status})`,
        raw: res.json,
      };
    }
    return {
      provider: 'hubtel',
      ok: true,
      status: mapHubtelStatus(data.status ?? 'queued'),
      providerReference: String(data.transactionId ?? data.id ?? ''),
      message: 'Hubtel queued the bank transfer',
      raw: res.json,
    };
  },

  /** Poll Hubtel for the current status of a transaction. */
  async verify(kind: 'collection' | 'disbursement', providerReference: string, creds: HubtelCredentials): Promise<ProviderResult> {
    const family = kind === 'collection' ? 'collect-money' : 'send-money';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(
        `${BASE}/${family}${STATUS_PATH}?clientReference=${encodeURIComponent(providerReference)}`,
        { headers: { Authorization: basicAuth(creds), Accept: 'application/json' }, signal: controller.signal },
      );
      let json: any = null;
      try { json = await res.json(); } catch { json = null; }
      const data = json?.data ?? {};
      if (!res.ok) {
        // Unreachable/unknown status must never fail a payment — keep polling
        return { provider: 'hubtel', ok: false, status: 'processing', providerReference, message: 'Hubtel status unavailable — keep polling', raw: json };
      }
      return {
        provider: 'hubtel',
        ok: true,
        status: mapHubtelStatus(data.status),
        providerReference,
        message: 'Hubtel status fetched',
        raw: json,
      };
    } catch {
      return { provider: 'hubtel', ok: false, status: 'processing', providerReference, message: 'Hubtel status request failed — keep polling' };
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Hubtel posts transaction updates to primaryCallbackUrl. Their
   * payloads carry the transaction object; we accept when the Basic
   * header matches (when present) and the payload references an
   * intent we issued.
   */
  verifyWebhook(rawBody: string, headers: Headers, creds: HubtelCredentials): { valid: boolean; reason?: string } {
    const auth = headers.get('authorization') ?? headers.get('Authorization');
    if (auth && auth !== basicAuth(creds)) return { valid: false, reason: 'bad credentials' };
    try {
      const body = JSON.parse(rawBody);
      const ref = body?.data?.clientReference ?? body?.clientReference ?? body?.data?.reference ?? body?.reference;
      if (typeof ref !== 'string') return { valid: false, reason: 'no reference in payload' };
      return { valid: true };
    } catch {
      return { valid: false, reason: 'malformed JSON' };
    }
  },
};
