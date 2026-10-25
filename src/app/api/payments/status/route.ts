import { NextResponse } from 'next/server';
import { verifyIntent } from '@/lib/payments/gateway';
import { getByReference, ledgerStats, listIntents, listWebhookEvents } from '@/lib/payments/ledger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/status?reference=ISU-XXX
 *   → polls the provider when live, reads the simulated clock when
 *     in simulation mode. Polled by the payment dialogs every 2s.
 *
 * GET /api/payments/status                  → recent ledger + stats
 * GET /api/payments/status?webhooks=1       → webhook event log
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get('reference');

  if (reference) {
    const intent = await verifyIntent(reference);
    if (!intent) {
      const bare = getByReference(reference);
      if (bare) return NextResponse.json({ intent: bare });
      return NextResponse.json({ error: 'Unknown payment reference' }, { status: 404 });
    }
    return NextResponse.json({ intent });
  }

  if (url.searchParams.get('webhooks')) {
    return NextResponse.json({ events: listWebhookEvents(50) });
  }

  const direction = url.searchParams.get('direction') ?? undefined;
  return NextResponse.json({
    intents: listIntents({
      direction: direction === 'collection' || direction === 'disbursement' ? direction : undefined,
      limit: 50,
    }),
    stats: ledgerStats(),
  });
}
