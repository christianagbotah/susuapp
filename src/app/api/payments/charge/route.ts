import { NextResponse } from 'next/server';
import { chargeMomo } from '@/lib/payments/gateway';
import { listIntents, ledgerStats } from '@/lib/payments/ledger';
import { normalizeGhanaPhone, detectNetworkFromPhone, MOMO_NETWORKS } from '@/lib/payments/types';
import type { MomoNetwork, PaymentPurpose } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

const COLLECTION_PURPOSES: PaymentPurpose[] = ['wallet_deposit', 'susu_contribution', 'loan_repayment'];
const MAX_AMOUNT = 10_000; // GHS — mirrors Admin → Settings transaction limits

function originOf(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const purpose = body.purpose as PaymentPurpose;
  if (!COLLECTION_PURPOSES.includes(purpose)) {
    return NextResponse.json({ error: `purpose must be one of ${COLLECTION_PURPOSES.join(', ')}` }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return NextResponse.json({ error: `amount must be between ₵0.01 and ₵${MAX_AMOUNT.toLocaleString()}` }, { status: 400 });
  }

  const phone = normalizeGhanaPhone(String(body.phone ?? ''));
  if (!phone) {
    return NextResponse.json({ error: 'phone must be a valid Ghana number (e.g. 024 123 4567)' }, { status: 400 });
  }

  let network = (body.network as MomoNetwork | undefined)?.toUpperCase() as MomoNetwork | undefined;
  if (network && !MOMO_NETWORKS.includes(network)) {
    return NextResponse.json({ error: `network must be one of ${MOMO_NETWORKS.join(', ')}` }, { status: 400 });
  }
  if (!network) {
    const detected = detectNetworkFromPhone(phone);
    if (!detected) {
      return NextResponse.json({ error: 'Could not detect the MoMo network from the phone number — pick one explicitly' }, { status: 400 });
    }
    network = detected;
  }

  const customerName = String(body.customerName ?? '').trim();
  if (!customerName) {
    return NextResponse.json({ error: 'customerName is required' }, { status: 400 });
  }

  const provider = body.provider === 'hubtel' || body.provider === 'paystack' ? body.provider : null;

  const intent = await chargeMomo(
    {
      purpose,
      amount: Math.round(amount * 100) / 100,
      network,
      phone,
      customerName,
      customerEmail: body.customerEmail ? String(body.customerEmail) : undefined,
      description: String(body.description ?? `${purpose.replace(/_/g, ' ')} via ${network} MoMo`),
      metadata: (body.metadata as Record<string, unknown> | undefined) ?? {},
    },
    { provider, origin: originOf(req) },
  );

  return NextResponse.json({ intent }, { status: 201 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 25) || 25, 100);
  return NextResponse.json({
    intents: listIntents({ direction: 'collection', limit }),
    stats: ledgerStats(),
  });
}
