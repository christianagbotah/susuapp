import { NextRequest, NextResponse } from 'next/server';
import type { GhanaCardOCRResult } from '@/lib/types';

// ---- Supported OCR Providers ----
type OCRProvider = 'textract' | 'google_vision' | 'mindee' | 'ondevice';

interface ProviderConfig {
  name: string;
  version: string;
  avgLatencyMs: number;
  accuracyBaseline: number;
}

const PROVIDER_CONFIGS: Record<OCRProvider, ProviderConfig> = {
  textract: { name: 'AWS Textract', version: '2024-06', avgLatencyMs: 2200, accuracyBaseline: 94 },
  google_vision: { name: 'Google Cloud Vision', version: 'v1p4beta1', avgLatencyMs: 1800, accuracyBaseline: 96 },
  mindee: { name: 'Mindee OCR', version: '3.2', avgLatencyMs: 1400, accuracyBaseline: 91 },
  ondevice: { name: 'On-Device ML Kit', version: '2.1', avgLatencyMs: 600, accuracyBaseline: 88 },
};

// ---- Highly Realistic Ghana Card Mock Data ----
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
  {
    idNumber: 'GHA-456789012-3',
    fullName: 'OKONKWO CHIDI EZE',
    dateOfBirth: '07/11/1995',
    gender: 'Male',
    nationality: 'Ghanaian',
    expiryDate: '07/11/2030',
    issueDate: '07/11/2020',
    cardNumber: 'GC-2020-09247518',
    personalIdNumber: 'PIN-5183920647',
    documentType: 'Ghana Card',
    region: 'Eastern',
  },
  {
    idNumber: 'GHA-321654987-4',
    fullName: 'ADJEI ABENA AKUA',
    dateOfBirth: '30/01/1990',
    gender: 'Female',
    nationality: 'Ghanaian',
    expiryDate: '30/01/2030',
    issueDate: '30/01/2020',
    cardNumber: 'GC-2020-06382914',
    personalIdNumber: 'PIN-9271834560',
    documentType: 'Ghana Card',
    region: 'Central',
  },
  {
    idNumber: 'GHA-654321098-5',
    fullName: 'DANSO KOJO ASANTE',
    dateOfBirth: '19/06/1985',
    gender: 'Male',
    nationality: 'Ghanaian',
    expiryDate: '19/06/2025',
    issueDate: '19/06/2015',
    cardNumber: 'GC-2015-01483726',
    personalIdNumber: 'PIN-3749261805',
    documentType: 'Ghana Card',
    region: 'Western',
  },
  {
    idNumber: 'GHA-789012345-6',
    fullName: 'AGBEKOR FIAFIAMETI',
    dateOfBirth: '12/09/1998',
    gender: 'Male',
    nationality: 'Ghanaian',
    expiryDate: '12/09/2033',
    issueDate: '12/09/2023',
    cardNumber: 'GC-2023-08264193',
    personalIdNumber: 'PIN-1957384620',
    documentType: 'Ghana Card',
    region: 'Volta',
  },
];

// ---- GHA Card ID Validation ----
const GHA_ID_REGEX = /^GHA-\d{9}-\d$/;

function validateGhaIdFormat(idNumber: string): boolean {
  return GHA_ID_REGEX.test(idNumber);
}

// ---- Simulated field-level confidence ----
interface FieldConfidence {
  field: string;
  confidence: number;
  minThreshold: number;
}

function generateFieldConfidences(baseConfidence: number): FieldConfidence[] {
  const fields = [
    { field: 'idNumber', minThreshold: 95 },
    { field: 'fullName', minThreshold: 90 },
    { field: 'dateOfBirth', minThreshold: 88 },
    { field: 'gender', minThreshold: 92 },
    { field: 'nationality', minThreshold: 80 },
    { field: 'expiryDate', minThreshold: 90 },
    { field: 'issueDate', minThreshold: 90 },
    { field: 'cardNumber', minThreshold: 88 },
    { field: 'personalIdNumber', minThreshold: 87 },
    { field: 'region', minThreshold: 75 },
  ];

  return fields.map(f => {
    // Add ±8% variance from base confidence, clamped to 60-100
    const variance = (Math.random() - 0.5) * 16;
    const confidence = Math.min(100, Math.max(60, Math.round(baseConfidence + variance)));
    return { field: f.field, confidence, minThreshold: f.minThreshold };
  });
}

function extractWarnings(fieldConfidences: FieldConfidence[]): string[] {
  const warnings: string[] = [];
  for (const fc of fieldConfidences) {
    if (fc.confidence < fc.minThreshold) {
      warnings.push(
        `Low confidence on "${fc.field}" (${fc.confidence}%, threshold ${fc.minThreshold}%). Manual review recommended.`
      );
    }
  }
  return warnings;
}

// ---- Simulate image dimension check ----
function simulateImageDimensions(base64OrSize: number): { width: number; height: number } {
  // In production, we'd use sharp/jimp to read actual dimensions
  // Here we simulate based on a deterministic seed from the input size
  const seed = base64OrSize % 7;
  const baseWidths = [480, 640, 720, 1080, 1280, 1920, 2560];
  const width = baseWidths[seed];
  const height = Math.round(width * 0.63); // Ghana Card aspect ratio ~1.586:1
  return { width, height };
}

// ---- Main POST Handler ----
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ---- Parse provider query param ----
    const { searchParams } = new URL(request.url);
    const providerParam = (searchParams.get('provider') ?? 'textract') as OCRProvider;
    const provider = PROVIDER_CONFIGS[providerParam] ?? PROVIDER_CONFIGS.textract;

    // ---- Parse image input (FormData or JSON base64 fallback) ----
    let imageFile: File | null = null;
    let base64Data: string | null = null;
    let imageByteSize = 0;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      imageFile = formData.get('image') as File | null;
      if (!imageFile) {
        return NextResponse.json(
          { success: false, error: 'No image provided in FormData. Use "image" field.' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type. Please upload a JPEG or PNG image.' },
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

      // Validate minimum file size (too small = likely not a card photo)
      if (imageFile.size < 10 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Image too small. The file appears to be corrupted or empty.' },
          { status: 400 }
        );
      }

      imageByteSize = imageFile.size;
    } else if (contentType.includes('application/json')) {
      // JSON fallback: expect { image: "base64string" }
      const body = await request.json();
      base64Data = body.image ?? null;
      if (!base64Data || typeof base64Data !== 'string') {
        return NextResponse.json(
          { success: false, error: 'No base64 "image" field found in JSON body.' },
          { status: 400 }
        );
      }

      // Basic base64 validation
      const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;
      if (!base64Regex.test(base64Data)) {
        return NextResponse.json(
          { success: false, error: 'Invalid base64 image format. Expected data:image/...;base64,...' },
          { status: 400 }
        );
      }

      // Estimate byte size from base64
      imageByteSize = Math.round((base64Data.length - base64Data.indexOf(',') - 1) * 0.75);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported content type. Use multipart/form-data or application/json.' },
        { status: 400 }
      );
    }

    // ---- Simulated image dimension check ----
    const dimensions = simulateImageDimensions(imageByteSize);
    if (dimensions.width < 480) {
      return NextResponse.json(
        {
          success: false,
          error: `Image resolution too low (${dimensions.width}x${dimensions.height}px). Minimum 480px width required for reliable OCR.`,
          code: 'IMAGE_TOO_SMALL',
          dimensions,
        },
        { status: 400 }
      );
    }

    // ---- Simulate OCR processing delay based on provider ----
    const processingDelay = provider.avgLatencyMs + (Math.random() - 0.5) * 800;
    await new Promise(resolve => setTimeout(resolve, Math.max(400, processingDelay)));

    // ---- Generate mock result ----
    const baseData = MOCK_CARD_DATA[Math.floor(Math.random() * MOCK_CARD_DATA.length)];
    const providerVariance = provider.accuracyBaseline - 92; // baseline offset from center
    const rawConfidence = 88 + Math.random() * 12 + providerVariance;
    const confidence = Math.min(99, Math.max(70, Math.round(rawConfidence)));

    // Field-level confidence and warnings
    const fieldConfidences = generateFieldConfidences(confidence);
    const warnings = extractWarnings(fieldConfidences);

    // Validate the GHA ID format in the mock result
    const idFormatValid = validateGhaIdFormat(baseData.idNumber);
    if (!idFormatValid) {
      warnings.push('Extracted ID number does not match GHA-XXXXXXXXX-X format. Please verify manually.');
    }

    const result: GhanaCardOCRResult = {
      ...baseData,
      verificationScore: confidence,
    };

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result,
      side: 'front',
      confidence,
      provider: {
        id: providerParam,
        name: provider.name,
        version: provider.version,
      },
      dimensions: {
        width: dimensions.width,
        height: dimensions.height,
        meetsRequirement: dimensions.width >= 480,
      },
      idFormatValid,
      warnings,
      fieldConfidences: Object.fromEntries(
        fieldConfidences.map(fc => [fc.field, fc.confidence])
      ),
      processingTime,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('OCR processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process image. Please try again.',
        processingTime,
      },
      { status: 500 }
    );
  }
}
