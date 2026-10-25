import { NextResponse } from 'next/server';
import { disburse } from '@/lib/payments/gateway';
import { listIntents, ledgerStats } from '@/lib/payments/ledger';
import { normalizeGhanaPhone, detectNetworkFromPhone, MOMO_NETWORKS } from '@/lib/payments/types';
import type { BankDisbursementDetails, DisbursementRequest, MomoNetwork, PaymentPurpose } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

const DISBURSEMENT_PURPOSES: PaymentPurpose[] = ['loan_disbursement', 'susu_payout', 'agent_commission', 'withdrawal'];
const MAX_AMOUNT = 50_000; // GHS — platform-side payouts run on a higher ceiling than customer collections

function originOf(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
  return `${proto}://${host}`;
}

/** Ghana bank list for the picker. Codes marked † are Paystack nuban
 *  codes commonly published for these banks; in live mode the adapter
 *  re-resolves from Paystack /bank?currency=GHS, so treat these as
 *  user-facing defaults rather than gospel. */
export const GHANA_BANKS: Array<{ name: string; code?: string }> = [
  { name: 'Absa Bank Ghana', code: '100100' },
  { name: 'Access Bank Ghana', code: '280100' },
  { name: 'Agricultural Development Bank (ADB)', code: '080100' },
  { name: 'Bank of Africa Ghana (BOA)' },
  { name: 'CalBank', code: '080100' },
  { name: 'Consolidated Bank Ghana (CBG)' },
  { name: 'Ecobank Ghana', code: '130100' },
  { name: 'Fidelity Bank Ghana', code: '240100' },
  { name: 'First National Bank' },
  { name: 'GCB Bank', code: '040100' },
  { name: 'Guaranty Trust Bank (GTBank) Ghana', code: '090100' },
  { name: 'Prudential Bank', code: '080100' },
  { name: 'Republic Bank (HFC)', code: '090100' },
  { name: 'Societe Generale Ghana', code: '080100' },
  { name: 'Stanbic Bank Ghana', code: '190100' },
  { name: 'Standard Chartered Ghana', code: '020100' },
  { name: 'United Bank for Africa (UBA) Ghana' },
  { name: 'Zenith Bank Ghana', code: '120100' },
  { name: 'Rural / Community Bank' },
  { name: 'Savings & Loans / Microfinance Institution' },
];

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const purpose = body.purpose as PaymentPurpose;
  if (!DISBURSEMENT_PURPOSES.includes(purpose)) {
    return NextResponse.json({ error: `purpose must be one of ${DISBURSEMENT_PURPOSES.join(', ')}` }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return NextResponse.json({ error: `amount must be between ₵0.01 and ₵${MAX_AMOUNT.toLocaleString()}` }, { status: 400 });
  }

  const channel = String(body.channel ?? '') as 'momo' | 'bank';
  if (channel !== 'momo' && channel !== 'bank') {
    return NextResponse.json({ error: 'channel must be "momo" or "bank"' }, { status: 400 });
  }

  const recipientName = String(body.recipientName ?? '').trim();
  if (!recipientName) {
    return NextResponse.json({ error: 'recipientName is required' }, { status: 400 });
  }

  const provider = body.provider === 'hubtel' || body.provider === 'paystack' ? body.provider : null;
  const payload: DisbursementRequest = {
    purpose,
    amount: Math.round(amount * 100) / 100,
    channel,
    recipientName,
    description: String(body.description ?? `${purpose.replace(/_/g, ' ')} to ${recipientName}`),
    metadata: (body.metadata as Record<string, unknown> | undefined) ?? {},
  };

  if (channel === 'momo') {
    const phone = normalizeGhanaPhone(String(body.phone ?? ''));
    if (!phone) {
      return NextResponse.json({ error: 'phone must be a valid Ghana number for MoMo disbursement' }, { status: 400 });
    }
    let network = (body.network as MomoNetwork | undefined)?.toUpperCase() as MomoNetwork | undefined;
    if (network && !MOMO_NETWORKS.includes(network)) {
      return NextResponse.json({ error: `network must be one of ${MOMO_NETWORKS.join(', ')}` }, { status: 400 });
    }
    if (!network) {
      const detected = detectNetworkFromPhone(phone);
      if (!detected) {
        return NextResponse.json({ error: 'Could not detect the MoMo network — pick one explicitly' }, { status: 400 });
      }
      network = detected;
    }
    payload.phone = phone;
    payload.network = network;
  } else {
    const bankBody = (body.bank ?? {}) as Record<string, unknown>;
    const bank: BankDisbursementDetails = {
      accountName: String(bankBody.accountName ?? '').trim(),
      accountNumber: String(bankBody.accountNumber ?? '').replace(/\s/g, ''),
      bankName: String(bankBody.bankName ?? '').trim(),
      bankCode: bankBody.bankCode ? String(bankBody.bankCode) : undefined,
    };
    if (!bank.accountName || !bank.accountNumber || !bank.bankName) {
      return NextResponse.json({ error: 'Bank disbursement requires accountName, accountNumber and bankName' }, { status: 400 });
    }
    if (!/^\d{10,17}$/.test(bank.accountNumber)) {
      return NextResponse.json({ error: 'accountNumber must be 10–17 digits' }, { status: 400 });
    }
    payload.bank = bank;
  }

  const intent = await disburse(payload, { provider, origin: originOf(req) });
  return NextResponse.json({ intent }, { status: 201 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 25) || 25, 100);
  return NextResponse.json({
    intents: listIntents({ direction: 'disbursement', limit }),
    stats: ledgerStats(),
    banks: GHANA_BANKS,
  });
}
