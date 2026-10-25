/**
 * iSusuPro — Payment Gateway Domain Types
 * ----------------------------------------
 * Shared by the gateway layer (server), the Next.js API routes,
 * and the client-side payments store.
 *
 * Ghana context:
 *  - All amounts are in GHS (₵).
 *  - Mobile Money networks: MTN MoMo, Telecel Cash (formerly
 *    Vodafone Cash), AT Money (formerly AirtelTigo Money).
 *  - Providers: Hubtel (local, aggregator) and Paystack.
 */

export type PaymentProvider = 'hubtel' | 'paystack';
export type PaymentMode = 'live' | 'simulation';
export type MomoNetwork = 'MTN' | 'TELECEL' | 'AT';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

export type PaymentPurpose =
  | 'wallet_deposit'
  | 'susu_contribution'
  | 'loan_repayment'
  | 'loan_disbursement'
  | 'susu_payout'
  | 'agent_commission'
  | 'withdrawal';

export type PaymentDirection = 'collection' | 'disbursement';

export interface PaymentMetadata {
  loanId?: string;
  loanRef?: string;
  groupId?: string;
  groupName?: string;
  memberId?: string;
  agentId?: string;
  customerEmail?: string;
  [key: string]: unknown;
}

/** A MoMo collection request (customer pays INTO iSusuPro). */
export interface MomoChargeRequest {
  purpose: PaymentPurpose;
  amount: number; // GHS
  network: MomoNetwork;
  phone: string; // Ghana local format 0XXXXXXXXX
  customerName: string;
  customerEmail?: string;
  description: string;
  metadata?: PaymentMetadata;
}

export interface BankDisbursementDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  /** Provider bank code (e.g. Paystack nuban codes). Resolved
   *  from the provider's /bank endpoint when live if missing. */
  bankCode?: string;
}

/** Platform money OUT (loan disbursement, susu payout, commission). */
export interface DisbursementRequest {
  purpose: PaymentPurpose;
  amount: number; // GHS
  channel: 'momo' | 'bank';
  /** MoMo channel */
  phone?: string;
  network?: MomoNetwork;
  /** Bank channel */
  bank?: BankDisbursementDetails;
  recipientName: string;
  description: string;
  metadata?: PaymentMetadata;
}

/** Normalised result of a provider API call (live or simulated). */
export interface ProviderResult {
  provider: PaymentProvider;
  ok: boolean;
  status: PaymentStatus;
  providerReference: string;
  message: string;
  raw?: unknown;
}

/** The unified ledger record — one per payment attempt. */
export interface PaymentIntent {
  id: string;
  /** Our own reference: ISU-XXXXXX-NN */
  reference: string;
  provider: PaymentProvider;
  /** Provider's reference once known (Hubtel transaction id,
   *  Paystack reference / transfer code). */
  providerReference: string | null;
  mode: PaymentMode;
  direction: PaymentDirection;
  purpose: PaymentPurpose;
  channel: 'momo' | 'bank';
  amount: number;
  fee: number;
  /** Collections: amount + fee (what the payer is charged).
   *  Disbursements: amount (fee is borne by the platform). */
  total: number;
  network?: MomoNetwork;
  phone?: string;
  bank?: BankDisbursementDetails;
  recipientName: string;
  description: string;
  status: PaymentStatus;
  message: string;
  metadata?: PaymentMetadata;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
}

/** Webhook event log entry (admin visibility + audit). */
export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  event: string;
  reference?: string;
  simulated: boolean;
  payloadPreview: string;
  receivedAt: string;
}

/* ---------- server-side gateway configuration ---------- */

export interface StoredGatewayCredentials {
  hubtel?: { clientId?: string; clientSecret?: string; apiKey?: string };
  paystack?: { secretKey?: string; publicKey?: string };
}

export interface ProviderFeeConfig {
  percent: number; // e.g. 1.5 => 1.5%
  flat: number; // GHS
}

export interface ProviderFees {
  hubtel: ProviderFeeConfig;
  paystack: ProviderFeeConfig;
}

export interface GatewayStatusResponse {
  hubtel: { mode: PaymentMode; configured: boolean; masked: string | null; fees: ProviderFeeConfig };
  paystack: { mode: PaymentMode; configured: boolean; masked: string | null; fees: ProviderFeeConfig };
  activeProvider: PaymentProvider | null;
  activeMode: PaymentMode;
  updatedAt?: string;
}

/* ---------- Ghana constants ---------- */

export const MOMO_NETWORKS: MomoNetwork[] = ['MTN', 'TELECEL', 'AT'];

/** Brand colours per network (used by the payment dialog). */
export const NETWORK_BRAND: Record<MomoNetwork, { label: string; short: string; hex: string }> = {
  MTN: { label: 'MTN MoMo', short: 'MTN', hex: '#FFC107' },
  TELECEL: { label: 'Telecel Cash', short: 'Telecel', hex: '#E60000' },
  AT: { label: 'AT Money', short: 'AT', hex: '#005BAC' },
};

/** Ghana phone prefixes → network (best-effort auto-detect). */
export const GHANA_PREFIX_NETWORK: Record<string, MomoNetwork> = {
  '24': 'MTN', '54': 'MTN', '55': 'MTN', '59': 'MTN', '25': 'MTN', '53': 'MTN',
  '20': 'TELECEL', '50': 'TELECEL',
  '27': 'AT', '57': 'AT', '26': 'AT', '56': 'AT',
};

/** Normalise any Ghana phone input to 0XXXXXXXXX (or null). */
export function normalizeGhanaPhone(input: string): string | null {
  const digits = (input || '').replace(/[^\d]/g, '');
  let local = digits;
  if (local.startsWith('233') && local.length >= 12) local = local.slice(3);
  if (local.length === 9 && !local.startsWith('0')) local = '0' + local;
  if (local.length === 10 && local.startsWith('0')) {
    if (!local.startsWith('02') && !local.startsWith('05')) return null;
    return local;
  }
  return null;
}

export function detectNetworkFromPhone(phone: string): MomoNetwork | null {
  const normalized = normalizeGhanaPhone(phone);
  if (!normalized) return null;
  const prefix = normalized.slice(1, 3); // "24", "20", ...
  return GHANA_PREFIX_NETWORK[prefix] ?? null;
}

export function computeFee(amount: number, fees: ProviderFeeConfig): number {
  const value = amount * (fees.percent / 100) + fees.flat;
  return Math.round(value * 100) / 100;
}
