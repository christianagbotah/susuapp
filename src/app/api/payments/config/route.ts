import { NextResponse } from 'next/server';
import { getGatewayStatus, saveStoredConfig } from '@/lib/payments/server-config';
import type { PaymentProvider, ProviderFees } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/payments/config  → { hubtel, paystack, activeProvider, activeMode }
 *                              (credentials are masked — never returned raw)
 *
 * POST /api/payments/config  → saves credentials/fees/activation from
 *                              Admin → Settings → Payments and switches
 *                              the gateway between live and simulation.
 *
 * Environment variables (HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET,
 * HUBTEL_API_KEY, PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY,
 * ACTIVE_PAYMENT_PROVIDER) always override the stored file.
 */
export async function GET() {
  const status = await getGatewayStatus();
  return NextResponse.json(status);
}

interface ConfigUpdateBody {
  provider?: 'hubtel' | 'paystack';
  credentials?: {
    hubtel?: { clientId?: string; clientSecret?: string; apiKey?: string };
    paystack?: { secretKey?: string; publicKey?: string };
  };
  fees?: Partial<ProviderFees>;
  activateProvider?: PaymentProvider | null;
}

export async function POST(req: Request) {
  let body: ConfigUpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Trim credential strings so whitespace-only input can't flip us to "live"
  const clean = (obj?: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(obj ?? {})
        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        .filter(([, v]) => v !== undefined && v !== ''),
    ) as Record<string, string>;

  const credentials: ConfigUpdateBody['credentials'] = {};
  const hubtel = clean(body.credentials?.hubtel as Record<string, unknown> | undefined);
  const paystack = clean(body.credentials?.paystack as Record<string, unknown> | undefined);
  if (hubtel && Object.keys(hubtel).length) credentials.hubtel = hubtel;
  if (paystack && Object.keys(paystack).length) credentials.paystack = paystack;

  if (body.fees) {
    const fees: Partial<ProviderFees> = {};
    if (body.fees.hubtel && Number.isFinite(Number(body.fees.hubtel.percent)) && Number.isFinite(Number(body.fees.hubtel.flat))) {
      fees.hubtel = { percent: Number(body.fees.hubtel.percent), flat: Number(body.fees.hubtel.flat) };
    }
    if (body.fees.paystack && Number.isFinite(Number(body.fees.paystack.percent)) && Number.isFinite(Number(body.fees.paystack.flat))) {
      fees.paystack = { percent: Number(body.fees.paystack.percent), flat: Number(body.fees.paystack.flat) };
    }
    if (Object.keys(fees).length) await saveStoredConfig({ fees });
  }

  if (credentials.hubtel || credentials.paystack) {
    await saveStoredConfig({ credentials });
  }

  if (body.activateProvider === null || body.activateProvider === 'hubtel' || body.activateProvider === 'paystack') {
    await saveStoredConfig({ activeProvider: body.activateProvider });
  }

  const status = await getGatewayStatus();
  return NextResponse.json(status);
}
