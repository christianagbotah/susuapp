import { NextRequest, NextResponse } from 'next/server';
import type { GhanaCardOCRResult } from '@/lib/types';

// Simulated Ghana Card OCR processing
// In production, this would call a real OCR API (e.g., AWS Textract, Google Vision, Mindee)
const MOCK_CARD_DATA: Omit<GhanaCardOCRResult, 'verificationScore'>[] = [
  {
    idNumber: 'GHA-123456789-0',
    fullName: 'MENSAH AMA SERWAA',
    dateOfBirth: '15/03/1992',
    gender: 'Female',
    nationality: 'Ghanaian',
    expiryDate: '15/03/2032',
    issueDate: '15/03/2022',
    cardNumber: 'GC-2022-04589371',
    personalIdNumber: 'PIN-2847193650',
    documentType: 'Ghana Card',
    region: 'Greater Accra',
  },
  {
    idNumber: 'GHA-987654321-1',
    fullName: 'APPIAH KWAME OFORI',
    dateOfBirth: '22/08/1988',
    gender: 'Male',
    nationality: 'Ghanaian',
    expiryDate: '22/08/2028',
    issueDate: '22/08/2018',
    cardNumber: 'GC-2018-07128456',
    personalIdNumber: 'PIN-6392841057',
    documentType: 'Ghana Card',
    region: 'Ashanti',
  },
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const side = formData.get('side') as string | null; // 'front' or 'back'

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Simulate OCR processing delay (1.5-3 seconds)
    // In production: await callToRealOCRService(imageFile, side)
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

    // Return mock OCR data with slight randomization
    const baseData = MOCK_CARD_DATA[Math.floor(Math.random() * MOCK_CARD_DATA.length)];
    const confidence = 85 + Math.floor(Math.random() * 15); // 85-99%

    const result: GhanaCardOCRResult = {
      ...baseData,
      verificationScore: confidence,
    };

    return NextResponse.json({
      success: true,
      data: result,
      side,
      confidence,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image. Please try again.' },
      { status: 500 }
    );
  }
}
