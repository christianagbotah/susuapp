/**
 * iSusuPro — Paystack Provider Adapter
 * --------------------------------------
 * Implements Paystack's documented Ghana endpoints:
 *
 *   MoMo collection:
 *     POST https://api.paystack.co/charge
 *       { email, amount(pesewas), currency: 'GHS',
 *         mobile_money: { phone, provider: 'mtn'|'vod'|'atl' } }
 *     → data.status 'pay_offline' (customer approves on handset)
 *
 *   Verify collection:
 *     GET  https://api.paystack.co/transaction/verify/:reference
 *
 *   Disbursement (MoMo or bank):
 *     POST https://api.paystack.co/transferrecipient  (create recipient)
 *     POST https://api.paystack.co/transfer           (source: 'balance')
 *     GET  https://api.paystack.co/transfer/verify/:reference
 *
 *   Webhook signature:
 *     x-paystack-signature = HMAC-SHA512(rawBody, secretKey) hex
 *
 * Network codes (Paystack Ghana still uses the legacy Vodafone
 * code for Telecel): MTN → 'mtn', Telecel → 'vod', AT → 'atl'.
 *
 * Bank payouts use Paystack 'nuban' recipients. When live and the
 * bank code is unknown, the adapter resolves it from
 * GET /bank?currency=GHS by name.
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
import { createHmac } from 'crypto';

const BASE = 'https://api.paystack.co';
const REQUEST_TIMEOUT_MS = 12_000;

const MOMO_CODES: Record<MomoNetwork, string> = {
  MTN: 'mtn',
  TELECEL: 'vod', // Paystack's Ghana code for the former Vodafone Cash
  AT: 'atl',
};

export interface PaystackCredentials {
  secretKey: string;
  publicKey?: string;
}

function toPesewas(amountGhs: number): number {
  return Math.round(amountGhs * 100);
}

async function paystackFetch(
  path: string,
  creds: PaystackCredentials,
  init: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; status: number; json: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${creds.secretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    let json: any = null;
    try { json = await res.json(); } catch { json = null; }
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function mapPaystackStatus(raw: unknown): PaymentStatus {
  const s = String(raw ?? '').toLowerCase();
  if (['success', 'paid'].includes(s)) return 'success';
  if (['failed', 'declined', 'reversed'].includes(s)) return 'failed';
  if (['abandoned', 'cancelled', 'expired', 'timeout'].includes(s)) return 'cancelled';
  return 'processing'; // 'pay_offline' | 'ongoing' | 'pending' | 'queued'
}

let bankListCache: { at: number; rows: Array<{ name: string; code: string }> } | null = null;
const BANK_CACHE_TTL_MS = 10 * 60_000;

/** Resolve Paystack nuban bank codes for Ghana (live mode). */
async function resolveBankCode(bank: BankDisbursementDetails, creds: PaystackCredentials): Promise<string | null> {
  if (bank.bankCode) return bank.bankCode;
  if (bankListCache && Date.now() - bankListCache.at < BANK_CACHE_TTL_MS) {
    const hit = bankListCache.rows.find(b => b.name.toLowerCase().includes(bank.bankName.toLowerCase().slice(0, 8)));
    if (hit) return hit.code;
    return null;
  }
  const res = await paystackFetch('/bank?currency=GHS', creds);
  if (!res.ok) return null;
  const rows = (res.json?.data ?? []).map((b: any) => ({ name: String(b.name ?? ''), code: String(b.code ?? '') }));
  bankListCache = { at: Date.now(), rows };
  const hit = rows.find(b => b.name.toLowerCase().includes(bank.bankName.toLowerCase().slice(0, 8)));
  return hit?.code ?? null;
}

export const paystackAdapter = {
  async chargeMomo(req: MomoChargeRequest, creds: PaystackCredentials, callbackUrl: string): Promise<ProviderResult> {
    const reference = `ISU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const res = await paystackFetch('/charge', creds, {
      method: 'POST',
      body: {
        email: req.customerEmail || `${req.phone}@isusupro.gh`,
        amount: toPesewas(req.amount),
        currency: 'GHS',
        reference,
        mobile_money: {
          phone: req.phone,
          provider: MOMO_CODES[req.network],
        },
        metadata: {
          custom_fields: [
            { display_name: 'Purpose', variable_name: 'purpose', value: req.purpose },
            { display_name: 'Payer', variable_name: 'payer', value: req.customerName },
          ],
          ...req.metadata,
        },
      },
    });
    const data = res.json?.data ?? {};
    if (!res.ok || !res.json?.status) {
      return {
        provider: 'paystack',
        ok: false,
        status: 'failed',
        providerReference: '',
        message: res.json?.message || `Paystack rejected the charge (HTTP ${res.status})`,
        raw: res.json,
      };
    }
    return {
      provider: 'paystack',
      ok: true,
      status: mapPaystackStatus(data.status),
      providerReference: String(data.reference ?? reference),
      message: 'Paystack accepted the charge — awaiting handset approval',
      raw: res.json,
    };
  },

  async createRecipient(
    kind: 'momo' | 'bank',
    input: { name: string; email?: string; phone?: string; network?: MomoNetwork; bank?: BankDisbursementDetails },
    creds: PaystackCredentials,
  ): Promise<{ ok: boolean; recipientCode: string; message: string; raw?: unknown }> {
    let body: Record<string, unknown>;
    if (kind === 'momo') {
      if (!input.phone || !input.network) {
        return { ok: false, recipientCode: '', message: 'MoMo transfer requires phone + network' };
      }
      body = {
        type: 'mobile_money',
        name: input.name,
        email: input.email || `${input.phone}@isusupro.gh`,
        currency: 'GHS',
        mobile_money: { phone: input.phone, provider: MOMO_CODES[input.network] },
      };
    } else {
      const bank = input.bank;
      if (!bank) return { ok: false, recipientCode: '', message: 'Bank transfer requires account details' };
      const bankCode = await resolveBankCode(bank, creds);
      if (!bankCode) return { ok: false, recipientCode: '', message: `Could not resolve a Paystack bank code for "${bank.bankName}" — pick the bank again or set the code manually` };
      body = {
        type: 'nuban',
        name: bank.accountName || input.name,
        account_number: bank.accountNumber,
        bank_code: bankCode,
        currency: 'GHS',
      };
    }
    const res = await paystackFetch('/transferrecipient', creds, { method: 'POST', body });
    const data = res.json?.data ?? {};
    if (!res.ok || !res.json?.status) {
      return { ok: false, recipientCode: '', message: res.json?.message || `Paystack could not create the recipient (HTTP ${res.status})`, raw: res.json };
    }
    return { ok: true, recipientCode: String(data.recipient_code ?? ''), message: 'Recipient created', raw: res.json };
  },

  async disburse(
    req: DisbursementRequest,
    recipientCode: string,
    creds: PaystackCredentials,
  ): Promise<ProviderResult> {
    const reference = `ISU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const res = await paystackFetch('/transfer', creds, {
      method: 'POST',
      body: {
        source: 'balance',
        amount: toPesewas(req.amount),
        recipient: recipientCode,
        reason: req.description.slice(0, 100),
        currency: 'GHS',
        reference,
      },
    });
    const data = res.json?.data ?? {};
    if (!res.ok || !res.json?.status) {
      return {
        provider: 'paystack',
        ok: false,
        status: 'failed',
        providerReference: '',
        message: res.json?.message || `Paystack rejected the transfer (HTTP ${res.status})`,
        raw: res.json,
      };
    }
    return {
      provider: 'paystack',
      ok: true,
      status: mapPaystackStatus(data.status ?? 'pending'),
      providerReference: String(data.transfer_code ?? data.reference ?? reference),
      message: 'Paystack queued the transfer',
      raw: res.json,
    };
  },

  async disburseMomo(req: DisbursementRequest, creds: PaystackCredentials, _callbackUrl: string): Promise<ProviderResult> {
    const recipient = await this.createRecipient('momo', {
      name: req.recipientName,
      phone: req.phone,
      network: req.network,
    }, creds);
    if (!recipient.ok) {
      return { provider: 'paystack', ok: false, status: 'failed', providerReference: '', message: recipient.message, raw: recipient.raw };
    }
    return this.disburse(req, recipient.recipientCode, creds);
  },

  async disburseBank(req: DisbursementRequest, bank: BankDisbursementDetails, creds: PaystackCredentials, _callbackUrl: string): Promise<ProviderResult> {
    const recipient = await this.createRecipient('bank', { name: req.recipientName, bank }, creds);
    if (!recipient.ok) {
      return { provider: 'paystack', ok: false, status: 'failed', providerReference: '', message: recipient.message, raw: recipient.raw };
    }
    return this.disburse(req, recipient.recipientCode, creds);
  },

  async verify(kind: 'collection' | 'disbursement', providerReference: string, creds: PaystackCredentials): Promise<ProviderResult> {
    const path = kind === 'collection'
      ? `/transaction/verify/${encodeURIComponent(providerReference)}`
      : `/transfer/verify/${encodeURIComponent(providerReference)}`;
    const res = await paystackFetch(path, creds);
    const data = res.json?.data ?? {};
    if (!res.ok || !res.json?.status) {
      return { provider: 'paystack', ok: false, status: 'processing', providerReference, message: 'Paystack status unavailable — keep polling', raw: res.json };
    }
    return {
      provider: 'paystack',
      ok: true,
      status: mapPaystackStatus(data.status),
      providerReference,
      message: 'Paystack status fetched',
      raw: res.json,
    };
  },

  /** HMAC-SHA512(rawBody, secretKey) — hex, per Paystack docs. */
  verifyWebhook(rawBody: string, headers: Headers, creds: PaystackCredentials): { valid: boolean; reason?: string } {
    if (!creds.secretKey) return { valid: false, reason: 'no secret key configured' };
    const provided = headers.get('x-paystack-signature');
    if (!provided) return { valid: false, reason: 'missing x-paystack-signature' };
    const expected = createHmac('sha512', creds.secretKey).update(rawBody).digest('hex');
    if (provided.length !== expected.length || provided !== expected) {
      return { valid: false, reason: 'signature mismatch' };
    }
    try {
      const body = JSON.parse(rawBody);
      if (!body?.event || typeof body?.data?.reference !== 'string') return { valid: false, reason: 'malformed payload' };
      return { valid: true };
    } catch {
      return { valid: false, reason: 'malformed JSON' };
    }
  },
};
