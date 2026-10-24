/**
 * iSusuPro — Server-side Payment Gateway Configuration
 * ----------------------------------------------------
 * Resolves provider credentials in this priority order:
 *
 *   1. Environment variables (production-grade)
 *        HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET, HUBTEL_API_KEY
 *        PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY
 *        ACTIVE_PAYMENT_PROVIDER  ('hubtel' | 'paystack')
 *
 *   2. Credentials saved from the Admin → Settings → Payments tab
 *      (persisted to .data/payment-gateways.json). This makes the
 *      settings screen functional end-to-end. NOTE: a local JSON
 *      file is fine for this sandbox/demo — in production, keep
 *      secrets in env vars or a vault (the env path always wins).
 *
 *   3. Otherwise → simulation mode (no real money moves; the
 *      gateway returns realistic, deterministic outcomes).
 *
 * 'use server-only' style module: imported exclusively by
 * API route handlers and the gateway — never shipped to the client.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type {
  GatewayStatusResponse,
  PaymentMode,
  PaymentProvider,
  ProviderFees,
  StoredGatewayCredentials,
} from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const CONFIG_FILE = path.join(DATA_DIR, 'payment-gateways.json');

const DEFAULT_FEES: ProviderFees = {
  hubtel: { percent: 1.0, flat: 0.5 }, // ₵0.50 + 1% — matches admin settings defaults
  paystack: { percent: 1.5, flat: 0 },
};

interface StoredConfig {
  credentials: StoredGatewayCredentials;
  fees: ProviderFees;
  activeProvider: PaymentProvider | null;
  updatedAt?: string;
}

let cache: { at: number; config: StoredConfig } | null = null;
const CACHE_TTL_MS = 3000;

async function readStored(): Promise<StoredConfig> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.config;
  const fallback: StoredConfig = { credentials: {}, fees: DEFAULT_FEES, activeProvider: null };
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StoredConfig;
    const config: StoredConfig = {
      credentials: parsed.credentials ?? {},
      fees: { hubtel: { ...DEFAULT_FEES.hubtel, ...parsed.fees?.hubtel }, paystack: { ...DEFAULT_FEES.paystack, ...parsed.fees?.paystack } },
      activeProvider: parsed.activeProvider ?? null,
      updatedAt: parsed.updatedAt,
    };
    cache = { at: Date.now(), config };
    return config;
  } catch {
    cache = { at: Date.now(), config: fallback };
    return fallback;
  }
}

export async function saveStoredConfig(update: {
  credentials?: StoredGatewayCredentials;
  fees?: Partial<ProviderFees>;
  activeProvider?: PaymentProvider | null;
}): Promise<StoredConfig> {
  const current = await readStored();
  const next: StoredConfig = {
    credentials: { ...current.credentials, ...(update.credentials ?? {}) },
    fees: {
      hubtel: { ...current.fees.hubtel, ...(update.fees?.hubtel ?? {}) },
      paystack: { ...current.fees.paystack, ...(update.fees?.paystack ?? {}) },
    },
    activeProvider: update.activeProvider !== undefined ? update.activeProvider : current.activeProvider,
    updatedAt: new Date().toISOString(),
  };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  cache = { at: Date.now(), config: next };
  return next;
}

export interface ResolvedProvider {
  provider: PaymentProvider;
  mode: PaymentMode;
  credentials: { clientId?: string; clientSecret?: string; apiKey?: string; secretKey?: string; publicKey?: string };
  fees: ProviderFees[PaymentProvider];
}

/** Merge env + stored credentials for one provider. */
export async function resolveProvider(provider: PaymentProvider): Promise<ResolvedProvider> {
  const stored = await readStored();
  const envHubtel = {
    clientId: process.env.HUBTEL_CLIENT_ID || stored.credentials.hubtel?.clientId || '',
    clientSecret: process.env.HUBTEL_CLIENT_SECRET || stored.credentials.hubtel?.clientSecret || '',
    apiKey: process.env.HUBTEL_API_KEY || stored.credentials.hubtel?.apiKey || '',
  };
  const envPaystack = {
    secretKey: process.env.PAYSTACK_SECRET_KEY || stored.credentials.paystack?.secretKey || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || stored.credentials.paystack?.publicKey || '',
  };

  if (provider === 'hubtel') {
    const configured = Boolean(envHubtel.clientId && envHubtel.clientSecret);
    return {
      provider,
      mode: configured ? 'live' : 'simulation',
      credentials: envHubtel,
      fees: stored.fees.hubtel,
    };
  }
  const configured = Boolean(envPaystack.secretKey);
  return {
    provider: 'paystack',
    mode: configured ? 'live' : 'simulation',
    credentials: envPaystack,
    fees: stored.fees.paystack,
  };
}

export async function getActiveProvider(): Promise<PaymentProvider | null> {
  const stored = await readStored();
  const fromEnv = process.env.ACTIVE_PAYMENT_PROVIDER as PaymentProvider | undefined;
  if (fromEnv === 'hubtel' || fromEnv === 'paystack') return fromEnv;
  return stored.activeProvider;
}

export async function setActiveProvider(provider: PaymentProvider | null): Promise<void> {
  await saveStoredConfig({ activeProvider: provider });
}

function mask(secret?: string): string | null {
  if (!secret) return null;
  if (secret.length <= 8) return '••••';
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

/** Public (safe) status for the client — no raw secrets. */
export async function getGatewayStatus(): Promise<GatewayStatusResponse> {
  const [hubtel, paystack] = await Promise.all([resolveProvider('hubtel'), resolveProvider('paystack')]);
  const active = await getActiveProvider();
  const activeResolved = active ? await resolveProvider(active) : null;
  return {
    hubtel: {
      mode: hubtel.mode,
      configured: hubtel.mode === 'live',
      masked: mask(hubtel.credentials.clientId),
      fees: hubtel.fees,
    },
    paystack: {
      mode: paystack.mode,
      configured: paystack.mode === 'live',
      masked: mask(paystack.credentials.secretKey),
      fees: paystack.fees,
    },
    activeProvider: active,
    activeMode: activeResolved ? activeResolved.mode : 'simulation',
    updatedAt: new Date().toISOString(),
  };
}

export { DEFAULT_FEES };
