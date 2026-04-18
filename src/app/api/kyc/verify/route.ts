import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardData, selfieImage, addressInfo, nextOfKin } = body;

    if (!cardData || !cardData.idNumber || !cardData.fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required card data' },
        { status: 400 }
      );
    }

    // Validate Ghana Card number format: GHA-XXXXXXXXX-X
    const ghaCardRegex = /^GHA-\d{9}-\d$/;
    if (!ghaCardRegex.test(cardData.idNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ghana Card number format. Expected format: GHA-XXXXXXXXX-X' },
        { status: 400 }
      );
    }

    // Simulate verification delay (2-4 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // Simulate NIA database check
    const isNIAVerified = Math.random() > 0.1; // 90% success rate for demo

    if (!isNIAVerified) {
      return NextResponse.json({
        success: false,
        error: 'Could not verify with NIA database. Please ensure your card details are correct.',
        code: 'NIA_VERIFICATION_FAILED',
      });
    }

    return NextResponse.json({
      success: true,
      verificationId: `KYC-${Date.now()}`,
      status: 'verified',
      kycLevel: 'full',
      verifiedAt: new Date().toISOString(),
      message: 'Identity verified successfully! Your KYC level has been upgraded to Full KYC.',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
