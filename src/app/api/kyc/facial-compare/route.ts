import { NextRequest, NextResponse } from 'next/server';

// ---- Facial Comparison Simulation ----
// In production, this would call a facial recognition API such as:
// - AWS Rekognition (CompareFaces)
// - Azure Face API (verify)
// - Google Cloud Vision (Face Detection + comparison)
// - On-device ML Kit Face Detection

interface FacialCompareRequest {
  selfieImage: string;       // base64 encoded selfie
  cardFrontImage: string;    // base64 encoded card front photo
}

interface FacialCompareResponse {
  success: boolean;
  matchScore: number;        // 0-100
  isMatch: boolean;
  confidence: 'high' | 'medium' | 'low';
  details: {
    selfieFaceDetected: boolean;
    cardFaceDetected: boolean;
    livenessCheck: boolean;
    poseMatch: boolean;
    lightingScore: number;
    sharpnessScore: number;
  };
  landmarks: {
    selfie: number;          // number of facial landmarks detected
    card: number;
  };
  processingTime: number;
  timestamp: string;
  warning?: string;
}

// ---- Thresholds ----
const MATCH_THRESHOLD_APPROVE = 85;
const MATCH_THRESHOLD_REVIEW = 70;

// ---- Simulated Face Detection ----
function simulateFaceDetection(imageBase64: string): {
  faceDetected: boolean;
  landmarks: number;
  liveness: boolean;
  sharpness: number;
  lighting: number;
  poseOk: boolean;
} {
  // Deterministic but varied results based on input size
  const size = imageBase64.length;
  const seed = size % 11;

  // 95% chance face is detected
  const faceDetected = seed !== 10;

  // Landmarks: 68 is standard face mesh
  const landmarkBase = [68, 68, 68, 67, 68, 65, 68, 66, 68, 68, 0];
  const landmarks = faceDetected ? landmarkBase[seed] : 0;

  // Liveness check (93% pass)
  const liveness = faceDetected && seed !== 3;

  // Sharpness: 70-98
  const sharpness = 70 + (seed * 2.5);

  // Lighting: 65-95
  const lighting = 65 + (seed * 2.7);

  // Pose match: 90% ok
  const poseOk = faceDetected && seed !== 7;

  return {
    faceDetected,
    landmarks,
    liveness,
    sharpness: Math.min(98, Math.round(sharpness)),
    lighting: Math.min(95, Math.round(lighting)),
    poseOk,
  };
}

// ---- Main POST Handler ----
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { selfieImage, cardFrontImage } = body as FacialCompareRequest;

    // ---- Validate inputs ----
    if (!selfieImage || typeof selfieImage !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "selfieImage". Provide a base64 encoded image.' },
        { status: 400 }
      );
    }

    if (!cardFrontImage || typeof cardFrontImage !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "cardFrontImage". Provide a base64 encoded image.' },
        { status: 400 }
      );
    }

    // Basic base64 format validation
    const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(selfieImage)) {
      return NextResponse.json(
        { success: false, error: 'Invalid selfie image format. Expected data:image/...;base64,...' },
        { status: 400 }
      );
    }

    if (!base64Regex.test(cardFrontImage)) {
      return NextResponse.json(
        { success: false, error: 'Invalid card front image format. Expected data:image/...;base64,...' },
        { status: 400 }
      );
    }

    // Minimum size check (at least ~10KB of image data)
    const selfieBytes = (selfieImage.length - selfieImage.indexOf(',') - 1) * 0.75;
    const cardBytes = (cardFrontImage.length - cardFrontImage.indexOf(',') - 1) * 0.75;
    if (selfieBytes < 10_000) {
      return NextResponse.json(
        { success: false, error: 'Selfie image is too small. Please capture a clearer photo.' },
        { status: 400 }
      );
    }

    // ---- Simulate processing delay (800ms-1.8s) ----
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

    // ---- Detect faces in both images ----
    const selfieResult = simulateFaceDetection(selfieImage);
    const cardResult = simulateFaceDetection(cardFrontImage);

    // If either face is not detected, return early
    if (!selfieResult.faceDetected || !cardResult.faceDetected) {
      const processingTime = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        matchScore: 0,
        isMatch: false,
        confidence: 'low',
        details: {
          selfieFaceDetected: selfieResult.faceDetected,
          cardFaceDetected: cardResult.faceDetected,
          livenessCheck: false,
          poseMatch: false,
          lightingScore: 0,
          sharpnessScore: 0,
        },
        landmarks: {
          selfie: selfieResult.landmarks,
          card: cardResult.landmarks,
        },
        processingTime,
        timestamp: new Date().toISOString(),
        warning: !selfieResult.faceDetected
          ? 'No face detected in the selfie. Please ensure your face is clearly visible and well-lit.'
          : 'No face detected on the card. Please retake the card photo with better focus.',
      });
    }

    // ---- Simulate facial match score ----
    // Base score: 80-99, adjusted by sharpness and lighting
    const baseScore = 80 + Math.random() * 19;
    const qualityPenalty = Math.max(0, (85 - selfieResult.sharpness) * 0.3) +
                           Math.max(0, (80 - selfieResult.lighting) * 0.2) +
                           Math.max(0, (80 - cardResult.sharpness) * 0.3);
    const matchScore = Math.min(99, Math.max(60, Math.round(baseScore - qualityPenalty)));

    const isMatch = matchScore >= MATCH_THRESHOLD_APPROVE;
    const needsReview = matchScore >= MATCH_THRESHOLD_REVIEW && matchScore < MATCH_THRESHOLD_APPROVE;

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (matchScore >= MATCH_THRESHOLD_APPROVE) confidence = 'high';
    else if (matchScore >= MATCH_THRESHOLD_REVIEW) confidence = 'medium';
    else confidence = 'low';

    // Liveness pass requires both selfie liveness and sufficient landmarks
    const livenessCheck = selfieResult.liveness && selfieResult.landmarks >= 65;

    const processingTime = Date.now() - startTime;

    // ---- Build response ----
    const response: FacialCompareResponse = {
      success: true,
      matchScore,
      isMatch: isMatch || needsReview,
      confidence,
      details: {
        selfieFaceDetected: selfieResult.faceDetected,
        cardFaceDetected: cardResult.faceDetected,
        livenessCheck,
        poseMatch: selfieResult.poseOk && cardResult.poseOk,
        lightingScore: Math.round((selfieResult.lighting + cardResult.lighting) / 2),
        sharpnessScore: Math.round((selfieResult.sharpness + cardResult.sharpness) / 2),
      },
      landmarks: {
        selfie: selfieResult.landmarks,
        card: cardResult.landmarks,
      },
      processingTime,
      timestamp: new Date().toISOString(),
    };

    // Add warnings if applicable
    if (!livenessCheck) {
      response.warning = 'Liveness check did not pass. The selfie may not be a live capture.';
    } else if (needsReview) {
      response.warning = `Match score is ${matchScore}% (borderline). Manual review recommended.`;
    }

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Facial comparison error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Facial comparison failed. Please try again.',
        processingTime,
      },
      { status: 500 }
    );
  }
}
