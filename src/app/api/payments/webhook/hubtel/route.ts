import { NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/payments/gateway';

export const dynamic = 'force-dynamic';

/** Hubtel transaction-status callbacks (POST to primaryCallbackUrl).
 *  Respond 200 quickly — providers retry aggressively on non-2xx. */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const result = await handleWebhook('hubtel', rawBody, req.headers);
  if (!result.received) {
    return NextResponse.json({ error: result.reason ?? 'rejected' }, { status: 401 });
  }
  return NextResponse.json({ received: true, matched: result.matched });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'hubtel webhook' });
}
