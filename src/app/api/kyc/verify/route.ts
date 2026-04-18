import { NextRequest, NextResponse } from 'next/server';

// ---- NIA Database Verification Constants ----
const MIN_AGE_YEARS = 18;
const GHA_ID_REGEX = /^GHA-\d{9}-\d$/;

// ---- Validation Helpers ----

function validateGhaCardFormat(idNumber: string): { valid: boolean; error?: string } {
  if (!GHA_ID_REGEX.test(idNumber)) {
    return {
      valid: false,
      error: `Invalid Ghana Card number format "${idNumber}". Expected format: GHA-XXXXXXXXX-X (9 digits, dash, 1 digit).`,
    };
  }
  return { valid: true };
}

function parseDateDMY(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  if (year < 1900 || year > new Date().getFullYear()) return null;
  const date = new Date(year, month - 1, day);
  // Check the date is valid (e.g., not Feb 30)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  return date;
}

function validateDateOfBirth(dobStr: string): { valid: boolean; age?: number; error?: string } {
  const dob = parseDateDMY(dobStr);
  if (!dob) {
    return { valid: false, error: `Invalid date of birth "${dobStr}". Expected format: DD/MM/YYYY.` };
  }

  if (dob > new Date()) {
    return { valid: false, error: 'Date of birth cannot be in the future.' };
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < MIN_AGE_YEARS) {
    return {
      valid: false,
      error: `Applicant must be at least ${MIN_AGE_YEARS} years old. Calculated age: ${age}.`,
    };
  }

  if (age > 120) {
    return { valid: false, error: 'Date of birth appears invalid (age exceeds 120 years).' };
  }

  return { valid: true, age };
}

function validateExpiryDate(expiryStr: string): { valid: boolean; error?: string } {
  const expiry = parseDateDMY(expiryStr);
  if (!expiry) {
    return { valid: false, error: `Invalid expiry date "${expiryStr}". Expected format: DD/MM/YYYY.` };
  }

  // Card must not have expired (allow 30-day grace period)
  const gracePeriod = new Date();
  gracePeriod.setDate(gracePeriod.getDate() - 30);

  if (expiry < gracePeriod) {
    return { valid: false, error: 'Ghana Card has expired. Please renew your card at an NIA office.' };
  }

  return { valid: true };
}

function validateGender(gender: string): { valid: boolean; error?: string } {
  const normalized = gender.trim().toLowerCase();
  if (normalized !== 'male' && normalized !== 'female') {
    return { valid: false, error: `Invalid gender "${gender}". Must be "Male" or "Female".` };
  }
  return { valid: true };
}

// ---- Simulate NIA Database Checks ----

interface NIACheckResult {
  niaVerified: boolean;
  documentValid: boolean;
  checks: {
    idInDatabase: boolean;
    nameMatches: boolean;
    dobMatches: boolean;
    cardNotRevoked: boolean;
    cardNotBlacklisted: boolean;
  };
  details: string[];
}

function simulateNIADatabaseCheck(cardData: Record<string, string>): NIACheckResult {
  const checks = {
    idInDatabase: Math.random() > 0.08,          // 92% found in DB
    nameMatches: Math.random() > 0.05,            // 95% name match
    dobMatches: Math.random() > 0.07,             // 93% DOB match
    cardNotRevoked: Math.random() > 0.02,         // 98% not revoked
    cardNotBlacklisted: Math.random() > 0.01,     // 99% not blacklisted
  };

  const details: string[] = [];
  if (checks.idInDatabase) details.push('ID number found in NIA database');
  else details.push('ID number NOT found in NIA database');

  if (checks.nameMatches) details.push('Full name matches NIA records');
  else details.push('Full name DOES NOT match NIA records');

  if (checks.dobMatches) details.push('Date of birth verified');
  else details.push('Date of birth mismatch with NIA records');

  if (checks.cardNotRevoked) details.push('Card status: Active');
  else details.push('Card status: REVOKED');

  if (checks.cardNotBlacklisted) details.push('No blacklist flags');
  else details.push('WARNING: Card is on blacklist');

  const allPassed = Object.values(checks).every(Boolean);

  return {
    niaVerified: checks.idInDatabase && checks.nameMatches && checks.dobMatches,
    documentValid: allPassed,
    checks,
    details,
  };
}

// ---- Simulate Facial Comparison ----

function simulateFacialMatch(hasSelfie: boolean): { score: number; isMatch: boolean } {
  if (!hasSelfie) {
    return { score: 0, isMatch: false };
  }
  const score = 85 + Math.floor(Math.random() * 15); // 85-99%
  return { score, isMatch: score >= 80 };
}

// ---- Determine Recommendation ----

type Recommendation = 'approve' | 'manual_review' | 'reject';

function determineRecommendation(
  facialScore: number,
  niaResult: NIACheckResult,
  validationWarnings: string[]
): { recommendation: Recommendation; reasons: string[] } {
  const reasons: string[] = [];

  // Auto-reject conditions
  if (!niaResult.niaVerified) {
    reasons.push('NIA database verification failed');
  }
  if (!niaResult.documentValid) {
    reasons.push('Document integrity check failed');
  }
  if (facialScore > 0 && facialScore < 70) {
    reasons.push('Facial match score below acceptable threshold');
  }
  if (validationWarnings.some(w => w.includes('expired'))) {
    reasons.push('Document has expired');
  }

  if (reasons.length >= 2) {
    return { recommendation: 'reject', reasons };
  }

  // Manual review conditions
  if (facialScore > 0 && facialScore < 85) {
    reasons.push('Facial match score is borderline (70-84%)');
  }
  if (!niaResult.checks.nameMatches) {
    reasons.push('Name does not match NIA records');
  }
  if (validationWarnings.length > 0) {
    reasons.push('Validation warnings require human review');
  }

  if (reasons.length > 0) {
    return { recommendation: 'manual_review', reasons };
  }

  reasons.push('All checks passed');
  return { recommendation: 'approve', reasons };
}

// ---- Main POST Handler ----
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { cardData, selfieImage, addressInfo, nextOfKin } = body;

    if (!cardData || !cardData.idNumber || !cardData.fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required card data fields: idNumber, fullName.' },
        { status: 400 }
      );
    }

    // ---- Run all validations ----
    const warnings: string[] = [];
    let hasValidationErrors = false;

    // 1. GHA Card format
    const idCheck = validateGhaCardFormat(cardData.idNumber);
    if (!idCheck.valid) {
      hasValidationErrors = true;
      return NextResponse.json(
        { success: false, error: idCheck.error },
        { status: 400 }
      );
    }

    // 2. Date of birth
    if (cardData.dateOfBirth) {
      const dobCheck = validateDateOfBirth(cardData.dateOfBirth);
      if (!dobCheck.valid) {
        hasValidationErrors = true;
        warnings.push(dobCheck.error!);
      }
    }

    // 3. Expiry date
    if (cardData.expiryDate) {
      const expiryCheck = validateExpiryDate(cardData.expiryDate);
      if (!expiryCheck.valid) {
        hasValidationErrors = true;
        warnings.push(expiryCheck.error!);
      }
    }

    // 4. Gender
    if (cardData.gender) {
      const genderCheck = validateGender(cardData.gender);
      if (!genderCheck.valid) {
        hasValidationErrors = true;
        warnings.push(genderCheck.error!);
      }
    }

    // ---- Simulate processing delay ----
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // ---- NIA Database Verification ----
    const niaResult = simulateNIADatabaseCheck(cardData);

    if (!niaResult.niaVerified) {
      const processingTime = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        error: 'Could not verify with NIA database. Please ensure your card details are correct.',
        code: 'NIA_VERIFICATION_FAILED',
        niaVerified: niaResult.niaVerified,
        documentValid: niaResult.documentValid,
        checks: niaResult.checks,
        details: niaResult.details,
        warnings,
        processingTime,
      });
    }

    // ---- Facial Comparison ----
    const hasSelfie = !!selfieImage;
    const facialResult = simulateFacialMatch(hasSelfie);
    if (!hasSelfie) {
      warnings.push('No selfie image provided. Facial comparison was skipped.');
    }

    // ---- Build Recommendation ----
    const { recommendation, reasons } = determineRecommendation(
      facialResult.score,
      niaResult,
      warnings
    );

    const allWarnings = [...warnings];
    if (!niaResult.checks.cardNotRevoked) allWarnings.push('Card has been revoked by NIA');
    if (!niaResult.checks.cardNotBlacklisted) allWarnings.push('Card is flagged on NIA blacklist');

    // ---- Identity Verification Summary ----
    const identityVerified =
      niaResult.niaVerified &&
      niaResult.documentValid &&
      (hasSelfie ? facialResult.isMatch : true);

    const processingTime = Date.now() - startTime;

    // ---- Build Response ----
    const response: Record<string, unknown> = {
      success: true,
      verificationId: `KYC-${Date.now()}`,
      status: identityVerified ? 'verified' : 'needs_review',
      kycLevel: identityVerified ? 'full' : 'basic',
      verifiedAt: new Date().toISOString(),
      // Enhanced fields
      facialMatchScore: facialResult.score,
      facialMatchIsMatch: facialResult.isMatch,
      niaVerified: niaResult.niaVerified,
      documentValid: niaResult.documentValid,
      identityVerified,
      recommendation,
      recommendationReasons: reasons,
      // NIA check details
      niaChecks: niaResult.checks,
      niaDetails: niaResult.details,
      // Warnings
      warnings: allWarnings,
      // Echo back submitted data
      addressInfo: addressInfo ?? null,
      nextOfKin: nextOfKin ?? null,
      // Timing
      processingTime,
      message: identityVerified
        ? 'Identity verified successfully! Your KYC level has been upgraded to Full KYC.'
        : 'Additional review is required before your KYC can be fully verified.',
    };

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Verification failed. Please try again.',
        processingTime,
      },
      { status: 500 }
    );
  }
}
