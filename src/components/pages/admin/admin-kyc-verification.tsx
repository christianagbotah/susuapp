'use client';

import { useState, useMemo } from 'react';
import { useKYCStore } from '@/store/app-store';
import { formatDate, formatDateTime, getInitials } from '@/lib/formatters';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Clock, XCircle, BarChart3,
  Search, Eye, CheckCircle, XCircle as XCircleIcon,
  AlertTriangle, ChevronDown, User, Phone, Mail, CreditCard,
  MapPin, Heart, Calendar, Timer, ArrowUpDown, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { KYCVerificationRecord, KYCRecordStatus } from '@/lib/types';

// ---- Constants ----

const STATUS_OPTIONS: { value: KYCRecordStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

const statusBadgeColor: Record<KYCRecordStatus, string> = {
  pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const recommendationBadgeColor: Record<string, string> = {
  approve: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  manual_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  reject: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function getOCRConfidenceColor(score: number): string {
  if (score > 90) return 'text-emerald-600';
  if (score > 70) return 'text-amber-600';
  return 'text-red-600';
}

function getOCRConfidenceBarClass(score: number): string {
  if (score > 90) return '[&>div]:bg-emerald-500';
  if (score > 70) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function getFacialMatchColor(score: number): string {
  if (score > 90) return 'text-emerald-600';
  if (score > 75) return 'text-amber-600';
  return 'text-red-600';
}

function getFacialMatchBarClass(score: number): string {
  if (score > 90) return '[&>div]:bg-emerald-500';
  if (score > 75) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function formatStatusLabel(status: KYCRecordStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRecommendationLabel(rec: string): string {
  return rec.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- Animation ----
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ---- Component ----
export function AdminKYCVerification() {
  const { records, approveKYC, rejectKYC } = useKYCStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<KYCRecordStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [detailRecord, setDetailRecord] = useState<KYCVerificationRecord | null>(null);
  const [rejectDialogRecord, setRejectDialogRecord] = useState<KYCVerificationRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ---- Stats ----
  const stats = useMemo(() => {
    const approved = records.filter((r) => r.status === 'approved').length;
    const pending = records.filter((r) => r.status === 'pending_review').length;
    const rejected = records.filter((r) => r.status === 'rejected').length;
    const avgConfidence =
      records.length > 0
        ? Math.round(
            records.reduce((sum, r) => sum + r.ocrConfidence, 0) / records.length
          )
        : 0;
    return { approved, pending, rejected, avgConfidence };
  }, [records]);

  // ---- Filtered / Sorted Records ----
  const filteredRecords = useMemo(() => {
    let filtered = records.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.userName.toLowerCase().includes(q) ||
        r.userPhone.includes(q) ||
        r.cardData.idNumber.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
    filtered.sort((a, b) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [records, statusFilter, searchQuery, sortOrder]);

  // ---- Handlers ----
  const handleApprove = (record: KYCVerificationRecord) => {
    approveKYC(record.id, 'Daniel Tetteh');
    toast.success(`KYC approved for ${record.userName}`);
    setDetailRecord(null);
  };

  const handleReject = () => {
    if (!rejectDialogRecord || !rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    rejectKYC(rejectDialogRecord.id, 'Daniel Tetteh', rejectReason.trim());
    toast.error(`KYC rejected for ${rejectDialogRecord.userName}`);
    setRejectDialogRecord(null);
    setRejectReason('');
    setDetailRecord(null);
  };

  const openRejectDialog = (record: KYCVerificationRecord) => {
    setRejectDialogRecord(record);
    setRejectReason('');
  };

  // ---- Render: Status Filter Buttons ----
  const renderStatusFilters = () => (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((opt) => {
        const isActive =
          statusFilter === opt.value;
        const count =
          opt.value === 'all'
            ? records.length
            : records.filter((r) => r.status === opt.value).length;
        return (
          <Button
            key={opt.value}
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            className={`h-8 text-xs min-h-[44px] lg:min-h-0 ${isActive ? '' : ''}`}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );

  // ---- Render: Desktop Table ----
  const renderDesktopTable = () => (
    <div className="hidden md:block overflow-x-auto overscroll-x-contain scrollbar-hide">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Applicant</th>
            <th className="px-4 py-3 text-left font-medium">ID Number</th>
            <th className="px-4 py-3 text-left font-medium">OCR Confidence</th>
            <th className="px-4 py-3 text-left font-medium">Facial Match</th>
            <th className="px-4 py-3 text-left font-medium">Recommendation</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Date</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((record) => (
            <tr
              key={record.id}
              className="border-b hover:bg-muted/30 transition-colors"
            >
              {/* Applicant */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                      {getInitials(record.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{record.userName}</p>
                    <p className="text-xs text-muted-foreground">{record.userPhone}</p>
                  </div>
                </div>
              </td>
              {/* ID Number */}
              <td className="px-4 py-3 font-mono text-xs">{record.cardData.idNumber}</td>
              {/* OCR Confidence */}
              <td className="px-4 py-3">
                <span className={`font-semibold ${getOCRConfidenceColor(record.ocrConfidence)}`}>
                  {record.ocrConfidence}%
                </span>
              </td>
              {/* Facial Match */}
              <td className="px-4 py-3">
                <span className={`font-semibold ${getFacialMatchColor(record.facialMatchScore)}`}>
                  {record.facialMatchScore}%
                </span>
              </td>
              {/* Recommendation */}
              <td className="px-4 py-3">
                <Badge
                  variant="secondary"
                  className={`text-xs ${recommendationBadgeColor[record.recommendation] || ''}`}
                >
                  {formatRecommendationLabel(record.recommendation)}
                </Badge>
              </td>
              {/* Status */}
              <td className="px-4 py-3">
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusBadgeColor[record.status]}`}
                >
                  {formatStatusLabel(record.status)}
                </Badge>
              </td>
              {/* Date */}
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {formatDate(record.submittedAt)}
              </td>
              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setDetailRecord(record)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {(record.status === 'pending_review' || record.status === 'in_review') && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(record)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => openRejectDialog(record)}
                      >
                        <XCircleIcon className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ---- Render: Mobile Cards ----
  const renderMobileCards = () => (
    <div className="md:hidden divide-y">
      {filteredRecords.map((record) => (
        <div key={record.id} className="mobile-card p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                  {getInitials(record.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{record.userName}</p>
                <p className="text-xs text-muted-foreground truncate">{record.userPhone}</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs ${statusBadgeColor[record.status]}`}
            >
              {formatStatusLabel(record.status)}
            </Badge>
          </div>
          {/* Info Row */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">ID Number</span>
              <p className="font-mono text-xs font-medium">{record.cardData.idNumber}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Submitted</span>
              <p className="text-xs">{formatDate(record.submittedAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">OCR Confidence</span>
              <p className={`text-xs font-semibold ${getOCRConfidenceColor(record.ocrConfidence)}`}>
                {record.ocrConfidence}%
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Facial Match</span>
              <p className={`text-xs font-semibold ${getFacialMatchColor(record.facialMatchScore)}`}>
                {record.facialMatchScore}%
              </p>
            </div>
          </div>
          {/* Recommendation Badge */}
          <div>
            <Badge
              variant="secondary"
              className={`text-xs ${recommendationBadgeColor[record.recommendation]}`}
            >
              {formatRecommendationLabel(record.recommendation)}
            </Badge>
          </div>
          {/* Actions */}
          <div className="flex gap-2">
            {(record.status === 'pending_review' || record.status === 'in_review') && (
              <>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] lg:min-h-0"
                  onClick={() => handleApprove(record)}
                >
                  <CheckCircle className="mr-1 h-3 w-3" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 h-8 text-xs min-h-[44px] lg:min-h-0"
                  onClick={() => openRejectDialog(record)}
                >
                  <XCircleIcon className="mr-1 h-3 w-3" /> Reject
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs min-h-[44px] lg:min-h-0"
              onClick={() => setDetailRecord(record)}
            >
              <Eye className="mr-1 h-3 w-3" /> View Details
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  // ---- Render: Detail Dialog ----
  const renderDetailDialog = () => (
    <Dialog open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            KYC Verification Details
          </DialogTitle>
          <DialogDescription>Complete KYC record information and verification results</DialogDescription>
        </DialogHeader>
        {detailRecord && (
          <div className="space-y-5">
            {/* Header with status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(detailRecord.userName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{detailRecord.userName}</p>
                  <p className="text-sm text-muted-foreground">{detailRecord.id}</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`text-xs px-3 py-1 ${statusBadgeColor[detailRecord.status]}`}
              >
                {formatStatusLabel(detailRecord.status)}
              </Badge>
            </div>

            <Separator />

            {/* Customer Info */}
            <div>
              <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Customer Information
              </h4>
              <div className="grid gap-3 text-sm sm:grid-cols-2 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{detailRecord.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{detailRecord.userPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{detailRecord.userEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{formatDateTime(detailRecord.submittedAt)}</span>
                </div>
              </div>
            </div>

            {/* Card Data */}
            <div>
              <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Ghana Card Data
              </h4>
              <div className="grid gap-3 text-sm sm:grid-cols-2 rounded-lg bg-muted/50 p-4">
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">ID Number:</span>{' '}
                  <span className="font-mono font-semibold">{detailRecord.cardData.idNumber}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Full Name:</span>{' '}
                  <span className="font-medium">{detailRecord.cardData.fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>{' '}
                  <span>{detailRecord.cardData.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>{' '}
                  <span>{detailRecord.cardData.gender}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nationality:</span>{' '}
                  <span>{detailRecord.cardData.nationality}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Region:</span>{' '}
                  <span>{detailRecord.cardData.region}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Issue Date:</span>{' '}
                  <span>{detailRecord.cardData.issueDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expiry Date:</span>{' '}
                  <span>{detailRecord.cardData.expiryDate}</span>
                </div>
              </div>
            </div>

            {/* Verification Scores */}
            <div>
              <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Verification Scores
              </h4>
              <div className="rounded-lg bg-muted/50 p-4 space-y-4">
                {/* OCR Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">OCR Confidence</span>
                    <span className={`text-sm font-bold ${getOCRConfidenceColor(detailRecord.ocrConfidence)}`}>
                      {detailRecord.ocrConfidence}%
                    </span>
                  </div>
                  <Progress
                    value={detailRecord.ocrConfidence}
                    className={`h-2.5 ${getOCRConfidenceBarClass(detailRecord.ocrConfidence)}`}
                  />
                </div>
                {/* Facial Match */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">Facial Match Score</span>
                    <span className={`text-sm font-bold ${getFacialMatchColor(detailRecord.facialMatchScore)}`}>
                      {detailRecord.facialMatchScore}%
                    </span>
                  </div>
                  <Progress
                    value={detailRecord.facialMatchScore}
                    className={`h-2.5 ${getFacialMatchBarClass(detailRecord.facialMatchScore)}`}
                  />
                </div>
              </div>
            </div>

            {/* Recommendation & Verification Checks */}
            <div>
              <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Recommendation & Checks
              </h4>
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">System Recommendation</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs px-3 py-1 ${recommendationBadgeColor[detailRecord.recommendation]}`}
                  >
                    {formatRecommendationLabel(detailRecord.recommendation)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {detailRecord.niaVerified ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span>NIA Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {detailRecord.documentValid ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span>Document Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {detailRecord.identityVerified ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span>Identity Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{detailRecord.processingTime}ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {detailRecord.warnings.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </h4>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
                  {detailRecord.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-amber-800 dark:text-amber-300">{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next of Kin */}
            {detailRecord.nextOfKin && (
              <div>
                <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  Next of Kin
                </h4>
                <div className="grid gap-3 text-sm sm:grid-cols-3 rounded-lg bg-muted/50 p-4">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{detailRecord.nextOfKin.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">{detailRecord.nextOfKin.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Relationship:</span>{' '}
                    <span className="font-medium">{detailRecord.nextOfKin.relationship}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {detailRecord.addressInfo && (
              <div>
                <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Address Information
                </h4>
                <div className="rounded-lg bg-muted/50 p-4 space-y-1 text-sm">
                  <p className="font-medium">
                    {detailRecord.addressInfo.houseNumber} {detailRecord.addressInfo.street},{' '}
                    {detailRecord.addressInfo.area}
                  </p>
                  <p className="text-muted-foreground">
                    {detailRecord.addressInfo.city}, {detailRecord.addressInfo.region}
                  </p>
                  {detailRecord.addressInfo.digitalAddress && (
                    <p className="text-muted-foreground">
                      GPS: <span className="font-mono">{detailRecord.addressInfo.digitalAddress}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Review Info */}
            {(detailRecord.reviewedBy || detailRecord.status === 'approved' || detailRecord.status === 'rejected') && (
              <div>
                <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Review Information
                </h4>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  {detailRecord.reviewedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviewed By</span>
                      <span className="font-medium">{detailRecord.reviewedBy}</span>
                    </div>
                  )}
                  {detailRecord.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Review Date</span>
                      <span>{formatDateTime(detailRecord.reviewedAt)}</span>
                    </div>
                  )}
                  {detailRecord.rejectionReason && (
                    <div className="pt-2 border-t border-red-200 dark:border-red-800">
                      <p className="text-red-600 font-medium text-xs mb-1">Rejection Reason:</p>
                      <p className="text-red-700 dark:text-red-400">{detailRecord.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions in Detail Dialog */}
            {(detailRecord.status === 'pending_review' || detailRecord.status === 'in_review') && (
              <>
                <Separator />
                <DialogFooter className="flex-row gap-2 sm:justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => openRejectDialog(detailRecord)}
                    className="min-h-[44px]"
                  >
                    <XCircleIcon className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                    onClick={() => handleApprove(detailRecord)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve Verification
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // ---- Render: Reject Dialog ----
  const renderRejectDialog = () => (
    <Dialog
      open={!!rejectDialogRecord}
      onOpenChange={() => {
        setRejectDialogRecord(null);
        setRejectReason('');
      }}
    >
      <DialogContent className="max-w-md mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircleIcon className="h-5 w-5" /> Reject KYC Verification
          </DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this KYC verification
          </DialogDescription>
        </DialogHeader>
        {rejectDialogRecord && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Applicant:</span>{' '}
                <span className="font-medium">{rejectDialogRecord.userName}</span>
              </p>
              <p>
                <span className="text-muted-foreground">ID Number:</span>{' '}
                <span className="font-mono">{rejectDialogRecord.cardData.idNumber}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter the reason for rejecting this KYC verification..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="min-h-[44px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogRecord(null);
                  setRejectReason('');
                }}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                className="min-h-[44px]"
              >
                <XCircleIcon className="mr-1 h-4 w-4" /> Reject KYC
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // ---- Main Return ----
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Verified', value: stats.approved, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, icon: BarChart3, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ delay: i * 0.05 }}>
            <Card className="mobile-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters Bar */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-3 lg:p-4 space-y-3">
            {/* Search & Sort Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or ID number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 min-h-[44px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 h-8 text-xs min-h-[44px] lg:min-h-0 w-full sm:w-auto"
                onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </Button>
            </div>
            {/* Status Filter Buttons */}
            {renderStatusFilters()}
            {/* Result Count */}
            <p className="text-xs text-muted-foreground">
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* KYC Records List */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="p-0">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No KYC records found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <>
                {renderDesktopTable()}
                {renderMobileCards()}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      {renderDetailDialog()}

      {/* Reject Dialog */}
      {renderRejectDialog()}
    </div>
  );
}
