/**
 * iSusuPro — Payments Store (client)
 * -----------------------------------
 * A persisted mirror of the server ledger for offline display and
 * per-portal history. The API ledger remains the source of truth;
 * this store caches settled intents so payment history survives
 * reloads and works offline (PWA).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PaymentIntent, PaymentProvider } from '@/lib/payments/types';

export interface GatewayStatusClient {
  hubtel: { mode: 'live' | 'simulation'; configured: boolean; masked: string | null; fees: { percent: number; flat: number } };
  paystack: { mode: 'live' | 'simulation'; configured: boolean; masked: string | null; fees: { percent: number; flat: number } };
  activeProvider: PaymentProvider | null;
  activeMode: 'live' | 'simulation';
  updatedAt?: string;
}

interface PaymentsState {
  /** Settled + in-flight intents, newest first. */
  intents: PaymentIntent[];
  /** Gateway status last fetched from /api/payments/config. */
  gateway: GatewayStatusClient | null;

  upsertIntent: (intent: PaymentIntent) => void;
  setGateway: (status: GatewayStatusClient) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 200;

export const usePaymentsStore = create<PaymentsState>()(
  persist(
    (set) => ({
      intents: [],
      gateway: null,

      upsertIntent: (intent) =>
        set((s) => {
          const rest = s.intents.filter(i => i.reference !== intent.reference);
          return { intents: [intent, ...rest].slice(0, MAX_HISTORY) };
        }),

      setGateway: (gateway) => set({ gateway }),

      clearHistory: () => set({ intents: [] }),
    }),
    { name: 'isusupro-payments' },
  ),
);

/** Fetch + cache the gateway status (live/simulation, fees, provider). */
export async function refreshGatewayStatus(): Promise<GatewayStatusClient | null> {
  try {
    const res = await fetch('/api/payments/config');
    if (!res.ok) return null;
    const status = (await res.json()) as GatewayStatusClient;
    usePaymentsStore.getState().setGateway(status);
    return status;
  } catch {
    return null;
  }
}
