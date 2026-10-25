import { NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/payments/gateway';

export const dynamic = 'force-dynamic';

/** Paystack webhook — verifies x-paystack-signature (HMAC-SHA512 of
 *  the raw body with the secret key) before touching the ledger. */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const result = await handleWebhook('paystack', rawBody, req.headers);
  if (!result.received) {
    return NextResponse.json({ error: result.reason ?? 'rejected' }, { status: 401 });
  }
  return NextResponse.json({ received: true, matched: result.matched });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'paystack webhook' });
}
