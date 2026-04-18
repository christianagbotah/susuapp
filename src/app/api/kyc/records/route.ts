import { NextRequest, NextResponse } from 'next/server';
import type { KYCVerificationRecord } from '@/lib/types';

// ---- Mock KYC Records for Admin Management ----
let mockRecords: KYCVerificationRecord[] = [
  {
    id: 'KYC-10048291',
    userId: 'USR-001247',
    userName: 'Mensah Ama Serwaa',
    userPhone: '+233 24 123 4567',
    userEmail: 'ama.mensah@gmail.com',
    status: 'approved',
    submittedAt: '2026-04-10T09:15:00Z',
    reviewedAt: '2026-04-10T09:45:00Z',
    reviewedBy: 'admin@isusupro.com',
    cardData: {
      idNumber: 'GHA-123456789-0',
      fullName: 'MENSAH AMA SERWAA',
      dateOfBirth: '15/03/1992',
      gender: 'Female',
      nationality: 'Ghanaian',
      region: 'Greater Accra',
      expiryDate: '15/03/2032',
      issueDate: '15/03/2022',
      cardNumber: 'GC-2022-04589371',
      personalIdNumber: 'PIN-2847193650',
      documentType: 'Ghana Card',
      verificationScore: 97,
    },
    facialMatchScore: 96,
    niaVerified: true,
    documentValid: true,
    identityVerified: true,
    recommendation: 'approve',
    ocrConfidence: 97,
    warnings: [],
    processingTime: 2340,
    addressInfo: {
      houseNumber: '24',
      street: 'Osu Oxford Street',
      area: 'Osu',
      city: 'Accra',
      region: 'Greater Accra',
      digitalAddress: 'GA-234-5678',
    },
    nextOfKin: {
      name: 'Kwame Mensah',
      phone: '+233 20 987 6543',
      relationship: 'Spouse',
    },
    kycLevel: 'full',
    expiresAt: '2032-03-15T00:00:00Z',
  },
  {
    id: 'KYC-10048292',
    userId: 'USR-001248',
    userName: 'Appiah Kwame Ofori',
    userPhone: '+233 20 555 7890',
    userEmail: 'kwame.appiah@yahoo.com',
    status: 'pending_review',
    submittedAt: '2026-04-16T14:30:00Z',
    cardData: {
      idNumber: 'GHA-987654321-1',
      fullName: 'APPIAH KWAME OFORI',
      dateOfBirth: '22/08/1988',
      gender: 'Male',
      nationality: 'Ghanaian',
      region: 'Ashanti',
      expiryDate: '22/08/2028',
      issueDate: '22/08/2018',
      cardNumber: 'GC-2018-07128456',
      personalIdNumber: 'PIN-6392841057',
      documentType: 'Ghana Card',
      verificationScore: 93,
    },
    facialMatchScore: 88,
    niaVerified: true,
    documentValid: true,
    identityVerified: true,
    recommendation: 'approve',
    ocrConfidence: 93,
    warnings: [],
    processingTime: 3120,
    addressInfo: {
      houseNumber: '12',
      street: 'Kejetia Road',
      area: 'Bantama',
      city: 'Kumasi',
      region: 'Ashanti',
      digitalAddress: 'AS-123-4567',
    },
    nextOfKin: {
      name: 'Adwoa Appiah',
      phone: '+233 24 333 2211',
      relationship: 'Mother',
    },
    kycLevel: 'basic',
    expiresAt: '2028-08-22T00:00:00Z',
  },
  {
    id: 'KYC-10048293',
    userId: 'USR-001249',
    userName: 'Okonkwo Chidi Eze',
    userPhone: '+233 50 222 3344',
    userEmail: 'chidi.okonkwo@outlook.com',
    status: 'in_review',
    submittedAt: '2026-04-15T11:00:00Z',
    reviewedAt: '2026-04-17T08:20:00Z',
    reviewedBy: 'admin@isusupro.com',
    cardData: {
      idNumber: 'GHA-456789012-3',
      fullName: 'OKONKWO CHIDI EZE',
      dateOfBirth: '07/11/1995',
      gender: 'Male',
      nationality: 'Ghanaian',
      region: 'Eastern',
      expiryDate: '07/11/2030',
      issueDate: '07/11/2020',
      cardNumber: 'GC-2020-05692834',
      personalIdNumber: 'PIN-9283746501',
      documentType: 'Ghana Card',
      verificationScore: 89,
    },
    facialMatchScore: 72,
    niaVerified: true,
    documentValid: true,
    identityVerified: false,
    recommendation: 'manual_review',
    ocrConfidence: 89,
    warnings: [
      'Facial match score is borderline (72%). Manual review required.',
      'Low confidence on "region" field (74%, threshold 75%).',
    ],
    processingTime: 4100,
    addressInfo: {
      houseNumber: '5',
      street: 'Nkawkaw Main Street',
      area: 'Nkawkaw',
      city: 'Nkawkaw',
      region: 'Eastern',
      digitalAddress: 'EP-567-8901',
    },
    nextOfKin: {
      name: 'Ngozi Okonkwo',
      phone: '+233 27 444 5566',
      relationship: 'Sister',
    },
    kycLevel: 'basic',
    expiresAt: '2030-11-07T00:00:00Z',
  },
  {
    id: 'KYC-10048294',
    userId: 'USR-001250',
    userName: 'Adjei Abena Akua',
    userPhone: '+233 27 888 9900',
    userEmail: 'abena.adjei@gmail.com',
    status: 'rejected',
    submittedAt: '2026-04-12T16:45:00Z',
    reviewedAt: '2026-04-13T10:15:00Z',
    reviewedBy: 'admin@isusupro.com',
    rejectionReason: 'Card expired. Ghana Card expired on 01/01/2024. Please renew at NIA office.',
    cardData: {
      idNumber: 'GHA-321654987-4',
      fullName: 'ADJEI ABENA AKUA',
      dateOfBirth: '30/01/1990',
      gender: 'Female',
      nationality: 'Ghanaian',
      region: 'Central',
      expiryDate: '30/01/2024',
      issueDate: '30/01/2014',
      cardNumber: 'GC-2014-08172645',
      personalIdNumber: 'PIN-5182937460',
      documentType: 'Ghana Card',
      verificationScore: 91,
    },
    facialMatchScore: 94,
    niaVerified: true,
    documentValid: false,
    identityVerified: false,
    recommendation: 'reject',
    ocrConfidence: 91,
    warnings: [
      'Ghana Card has expired. Please renew your card at an NIA office.',
    ],
    processingTime: 1890,
    addressInfo: {
      houseNumber: '8',
      street: 'Kotoka Avenue',
      area: 'Cape Coast',
      city: 'Cape Coast',
      region: 'Central',
      digitalAddress: 'CC-890-1234',
    },
    nextOfKin: {
      name: 'Kofi Adjei',
      phone: '+233 20 111 2233',
      relationship: 'Brother',
    },
    kycLevel: 'none',
    expiresAt: '2024-01-30T00:00:00Z',
  },
  {
    id: 'KYC-10048295',
    userId: 'USR-001251',
    userName: 'Danso Kojo Asante',
    userPhone: '+233 24 666 7788',
    userEmail: 'kojo.danso@hotmail.com',
    status: 'approved',
    submittedAt: '2026-04-08T08:00:00Z',
    reviewedAt: '2026-04-08T08:35:00Z',
    reviewedBy: 'admin@isusupro.com',
    cardData: {
      idNumber: 'GHA-654321098-5',
      fullName: 'DANSO KOJO ASANTE',
      dateOfBirth: '19/06/1985',
      gender: 'Male',
      nationality: 'Ghanaian',
      region: 'Western',
      expiryDate: '19/06/2025',
      issueDate: '19/06/2015',
      cardNumber: 'GC-2015-09468231',
      personalIdNumber: 'PIN-8471923056',
      documentType: 'Ghana Card',
      verificationScore: 95,
    },
    facialMatchScore: 91,
    niaVerified: true,
    documentValid: true,
    identityVerified: true,
    recommendation: 'approve',
    ocrConfidence: 95,
    warnings: [],
    processingTime: 2760,
    addressInfo: {
      houseNumber: '31',
      street: 'Takoradi Harbor Road',
      area: 'Effia-Kwesimintsim',
      city: 'Takoradi',
      region: 'Western',
      digitalAddress: 'WR-345-6789',
    },
    nextOfKin: {
      name: 'Ama Danso',
      phone: '+233 50 999 0011',
      relationship: 'Wife',
    },
    kycLevel: 'full',
    expiresAt: '2025-06-19T00:00:00Z',
  },
  {
    id: 'KYC-10048296',
    userId: 'USR-001252',
    userName: 'Agbekor Fiafiameti',
    userPhone: '+233 20 333 4455',
    userEmail: 'fiafi.agbekor@gmail.com',
    status: 'expired',
    submittedAt: '2026-02-01T10:30:00Z',
    cardData: {
      idNumber: 'GHA-789012345-6',
      fullName: 'AGBEKOR FIAFIAMETI',
      dateOfBirth: '12/09/1998',
      gender: 'Male',
      nationality: 'Ghanaian',
      region: 'Volta',
      expiryDate: '12/09/2028',
      issueDate: '12/09/2018',
      cardNumber: 'GC-2018-03827164',
      personalIdNumber: 'PIN-7392814065',
      documentType: 'Ghana Card',
      verificationScore: 82,
    },
    facialMatchScore: 0,
    niaVerified: false,
    documentValid: true,
    identityVerified: false,
    recommendation: 'manual_review',
    ocrConfidence: 82,
    warnings: [
      'No selfie image provided. Facial comparison was skipped.',
      'Verification request expired after 30 days.',
    ],
    processingTime: 0,
    kycLevel: 'none',
    expiresAt: '2026-03-03T00:00:00Z',
  },
];

// ---- GET: List KYC records with filtering & pagination ----
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    // Apply filters
    let filtered = [...mockRecords];

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    if (search) {
      filtered = filtered.filter(r =>
        r.userName.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search) ||
        r.cardData.idNumber.toLowerCase().includes(search) ||
        r.userPhone.includes(search) ||
        r.userEmail.toLowerCase().includes(search)
      );
    }

    // Sort: newest first
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginatedRecords = filtered.slice(startIdx, startIdx + limit);

    // Compute summary stats
    const stats = {
      total,
      pendingReview: mockRecords.filter(r => r.status === 'pending_review').length,
      inReview: mockRecords.filter(r => r.status === 'in_review').length,
      approved: mockRecords.filter(r => r.status === 'approved').length,
      rejected: mockRecords.filter(r => r.status === 'rejected').length,
      expired: mockRecords.filter(r => r.status === 'expired').length,
      avgOcrConfidence: Math.round(
        mockRecords.reduce((sum, r) => sum + r.ocrConfidence, 0) / mockRecords.length
      ),
      avgFacialMatch: Math.round(
        mockRecords.filter(r => r.facialMatchScore > 0)
          .reduce((sum, r) => sum + r.facialMatchScore, 0) /
          mockRecords.filter(r => r.facialMatchScore > 0).length
      ),
    };

    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats,
    });
  } catch (error) {
    console.error('KYC records list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve KYC records.' },
      { status: 500 }
    );
  }
}

// ---- PATCH: Update a KYC record (approve/reject) ----
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, reviewedBy, reviewedAt, rejectionReason } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record "id" is required.' },
        { status: 400 }
      );
    }

    const allowedStatuses = ['approved', 'rejected', 'in_review', 'expired'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Find record
    const recordIndex = mockRecords.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return NextResponse.json(
        { success: false, error: `KYC record "${id}" not found.` },
        { status: 404 }
      );
    }

    const record = mockRecords[recordIndex];

    // Cannot modify already approved/rejected records without special permission
    if ((record.status === 'approved' || record.status === 'rejected') && !reviewedBy) {
      return NextResponse.json(
        { success: false, error: `Record is already ${record.status}. Contact a senior admin to override.` },
        { status: 409 }
      );
    }

    // Apply updates
    if (status) record.status = status;
    if (reviewedBy) record.reviewedBy = reviewedBy;
    if (reviewedAt) record.reviewedAt = reviewedAt;
    if (!record.reviewedAt) record.reviewedAt = new Date().toISOString();
    if (rejectionReason) record.rejectionReason = rejectionReason;

    // Set KYC level based on status
    if (status === 'approved') record.kycLevel = 'full';
    else if (status === 'rejected') record.kycLevel = 'none';

    mockRecords[recordIndex] = record;

    return NextResponse.json({
      success: true,
      data: record,
      message: `KYC record "${id}" updated successfully.`,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('KYC record update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update KYC record.' },
      { status: 500 }
    );
  }
}
