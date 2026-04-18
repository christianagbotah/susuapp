'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  ChevronRight,
  ChevronLeft,
  User,
  CreditCard,
  ScanLine,
  Sparkles,
  FileText,
  MapPin,
  Phone,
  Users,
  Pencil,
  Eye,
  X,
  CircleCheckBig,
  Smartphone,
  Loader2,
  IdCard,
  Heart,
  Home,
} from 'lucide-react';
import type {
  KYCVerificationStep,
  GhanaCardOCRResult,
} from '@/lib/types';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta',
  'Northern', 'Brong-Ahafo', 'Upper East', 'Upper West', 'North East',
  'Savannah', 'Bono East', 'Ahafo', 'Oti', 'Western North',
];

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other',
];

interface GhanaCardVerificationProps {
  onComplete: () => void;
  onCancel: () => void;
}

// Scanning animation keyframes injected via style tag
const scanningKeyframes = `
@keyframes scanline {
  0% { top: 0%; opacity: 1; }
  50% { opacity: 0.8; }
  100% { top: 100%; opacity: 1; }
}
@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(217, 168, 55, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(217, 168, 55, 0); }
}
@keyframes flash-capture {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes check-draw {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
`;

const PROCESSING_MESSAGES = [
  'Detecting card edges...',
  'Extracting text from front...',
  'Reading ID number and details...',
  'Extracting data from back...',
  'Running OCR analysis...',
  'Verifying with NIA database...',
  'Complete!',
];

export function GhanaCardVerification({ onComplete, onCancel }: GhanaCardVerificationProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState<KYCVerificationStep>('intro');

  // Image state
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  // OCR results
  const [ocrResult, setOcrResult] = useState<GhanaCardOCRResult | null>(null);
  const [editableResult, setEditableResult] = useState<GhanaCardOCRResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Processing state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flash effect
  const [flashVisible, setFlashVisible] = useState(false);

  // Next of kin state
  const [nextOfKin, setNextOfKin] = useState({ name: '', phone: '', relationship: '' });

  // Address info state
  const [addressInfo, setAddressInfo] = useState({ 
    houseNumber: '', street: '', area: '', city: '', region: 'Greater Accra', digitalAddress: '' 
  });

  // File input refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Processing animation timers
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, []);

  // ---- Image capture helpers ----
  const handleFileCapture = useCallback(
    (file: File, side: 'front' | 'back' | 'selfie') => {
      if (!file || !file.type.startsWith('image/')) {
        toast.error('Invalid file', { description: 'Please select an image file.' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', { description: 'Maximum file size is 10MB.' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (side === 'front') {
          setFrontImage(dataUrl);
        } else if (side === 'back') {
          setBackImage(dataUrl);
        } else {
          setSelfieImage(dataUrl);
          // Flash effect for selfie
          setFlashVisible(true);
          setTimeout(() => setFlashVisible(false), 300);
        }
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileCapture(file, 'front');
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileCapture(file, 'back');
  };

  const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileCapture(file, 'selfie');
  };

  // ---- OCR processing ----
  const runOCRProcessing = useCallback(async () => {
    setCurrentStep('processing');
    setProcessingProgress(0);
    setProcessingMessageIndex(0);

    // Animate progress bar
    progressIntervalRef.current = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 100;
        }
        return Math.min(prev + Math.random() * 8 + 2, 100);
      });
    }, 200);

    // Cycle through messages
    messageIntervalRef.current = setInterval(() => {
      setProcessingMessageIndex((prev) => {
        if (prev >= PROCESSING_MESSAGES.length - 1) {
          if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    try {
      // Call OCR API with front image
      const frontBlob = await fetch(frontImage!).then((r) => r.blob());
      const frontFile = new File([frontBlob], 'front.jpg', { type: 'image/jpeg' });
      const frontFormData = new FormData();
      frontFormData.append('image', frontFile);
      frontFormData.append('side', 'front');

      const frontResponse = await fetch('/api/kyc/ocr', {
        method: 'POST',
        body: frontFormData,
      });
      const frontData = await frontResponse.json();

      if (!frontData.success) {
        throw new Error(frontData.error || 'OCR processing failed');
      }

      // Call OCR API with back image
      const backBlob = await fetch(backImage!).then((r) => r.blob());
      const backFile = new File([backBlob], 'back.jpg', { type: 'image/jpeg' });
      const backFormData = new FormData();
      backFormData.append('image', backFile);
      backFormData.append('side', 'back');

      const backResponse = await fetch('/api/kyc/ocr', {
        method: 'POST',
        body: backFormData,
      });
      const backData = await backResponse.json();

      // Use front data as base, supplement with back data
      const result: GhanaCardOCRResult = {
        ...frontData.data,
        cardNumber: backData.success ? backData.data.cardNumber : frontData.data.cardNumber,
        personalIdNumber: backData.success ? backData.data.personalIdNumber : frontData.data.personalIdNumber,
      };

      setOcrResult(result);
      setEditableResult({ ...result });

      // Ensure animation completes
      setTimeout(() => {
        setProcessingProgress(100);
        setProcessingMessageIndex(PROCESSING_MESSAGES.length - 1);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);

        setTimeout(() => {
          setCurrentStep('review-data');
        }, 600);
      }, 500);
    } catch (error) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      toast.error('OCR Processing Failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      setCurrentStep('capture-back');
    }
  }, [frontImage, backImage]);

  // ---- Verification submission ----
  const handleSubmitVerification = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardData: editableResult,
          selfieImage,
          addressInfo,
          nextOfKin,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      toast.success('KYC Verified!', {
        description: data.message,
      });
      setCurrentStep('complete');
      onComplete();
    } catch (error) {
      toast.error('Verification Failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editableResult, selfieImage, addressInfo, nextOfKin, onComplete]);

  // ---- Navigation ----
  const goToStep = (step: KYCVerificationStep) => setCurrentStep(step);

  const stepOrder: KYCVerificationStep[] = [
    'intro',
    'capture-front',
    'capture-back',
    'processing',
    'review-data',
    'next-of-kin',
    'address-info',
    'selfie',
    'complete',
  ];

  const currentIndex = stepOrder.indexOf(currentStep);

  // ---- Render steps ----
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Ghana Card illustration */}
      <div className="flex justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="w-48 h-30 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-[2px] shadow-lg">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex flex-col items-center justify-center px-4 py-3">
              <div className="text-[10px] font-bold text-amber-900 tracking-wider uppercase">
                Republic of Ghana
              </div>
              <IdCard className="h-8 w-8 text-amber-800 my-1" />
              <div className="text-xs font-semibold text-amber-900">GHANA CARD</div>
              <div className="w-16 h-[1px] bg-amber-700/50 my-1" />
              <div className="text-[9px] text-amber-800">National Identification</div>
            </div>
          </div>
          <div className="absolute -top-2 -right-2">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
        </motion.div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">Ghana Card Verification</h3>
        <p className="text-sm text-muted-foreground">
          Complete your identity verification with your Ghana Card. This takes about 2-3 minutes.
        </p>
      </div>

      {/* Process Steps */}
      <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="pt-4 pb-4">
          <h4 className="font-semibold text-sm mb-3">How it works</h4>
          <div className="space-y-3">
            {[
              { icon: CreditCard, label: 'Capture front of your Ghana Card', color: 'text-amber-600' },
              { icon: ScanLine, label: 'Capture back of your Ghana Card', color: 'text-amber-600' },
              { icon: Eye, label: 'Review extracted information', color: 'text-amber-600' },
              { icon: Heart, label: 'Provide next of kin details', color: 'text-amber-600' },
              { icon: MapPin, label: 'Enter your residential address', color: 'text-amber-600' },
              { icon: User, label: 'Take a selfie for liveness check', color: 'text-amber-600' },
              { icon: CircleCheckBig, label: 'Verification complete!', color: 'text-emerald-600' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-background border shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                </div>
                <step.icon className={`h-4 w-4 ${step.color} shrink-0`} />
                <span className="text-sm">{step.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <h4 className="font-semibold text-sm mb-3">For best results</h4>
          <div className="space-y-2">
            {[
              'Use good, natural lighting — avoid direct sunlight or dark areas',
              'Place your card on a flat, dark surface',
              'Ensure the entire card is visible in the frame',
              'Avoid glare or reflections on the card',
              'Keep the camera steady while capturing',
            ].map((req, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{req}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1 min-h-[44px]">
          Cancel
        </Button>
        <Button
          onClick={() => goToStep('capture-front')}
          className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
        >
          Begin Verification
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderCapture = (side: 'front' | 'back') => {
    const image = side === 'front' ? frontImage : backImage;
    const inputRef = side === 'front' ? frontInputRef : backInputRef;
    const handleFileChange = side === 'front' ? handleFrontFileChange : handleBackFileChange;
    const title = side === 'front' ? 'Front of Ghana Card' : 'Back of Ghana Card';
    const description =
      side === 'front'
        ? 'Position the front of your card so it fills the frame. Make sure all text is readable.'
        : 'Position the back of your card. Ensure the barcode and numbers are visible.';
    const prevStep = side === 'front' ? 'intro' : 'capture-front';

    return (
      <motion.div
        key={side}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Card capture area */}
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-sm aspect-[1.586/1] rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-600 bg-muted/30 overflow-hidden">
            {image ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full h-full"
              >
                <img
                  src={image}
                  alt={`${side} of Ghana Card`}
                  className="w-full h-full object-cover rounded-xl"
                />
                {/* Card overlay guide */}
                <div className="absolute inset-0 border-2 border-amber-400/50 rounded-xl pointer-events-none" />
                {side === 'front' && (
                  <div className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-medium px-2 py-1 rounded-md">
                    FRONT SIDE
                  </div>
                )}
                {side === 'back' && (
                  <div className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-medium px-2 py-1 rounded-md">
                    BACK SIDE
                  </div>
                )}
                <div className="absolute bottom-3 right-3">
                  <Badge className="bg-emerald-500 text-white text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Captured
                  </Badge>
                </div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    {side === 'front' ? 'Front Side' : 'Back Side'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Tap the button below to capture
                  </p>
                </div>
              </div>
            )}

            {/* Card-shaped guide overlay when no image */}
            {!image && (
              <div className="absolute inset-3 border border-amber-300/30 rounded-lg pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-1 bg-amber-300/20 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Action buttons */}
        <div className="space-y-3">
          {!image ? (
            <>
              <Button
                onClick={() => inputRef.current?.click()}
                className="w-full min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
              >
                <Camera className="mr-2 h-5 w-5" />
                Open Camera
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  inputRef.current?.removeAttribute('capture');
                  inputRef.current?.click();
                }}
                className="w-full min-h-[44px]"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload from Gallery
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (side === 'front') setFrontImage(null);
                  else setBackImage(null);
                }}
                className="w-full min-h-[44px]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake Photo
              </Button>
              <Button
                onClick={() => {
                  if (side === 'front') {
                    goToStep('capture-back');
                  } else {
                    runOCRProcessing();
                  }
                }}
                className="w-full min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
              >
                {side === 'front' ? 'Continue to Back' : 'Scan Card'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => goToStep(prevStep)}
          className="w-full min-h-[44px] text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </motion.div>
    );
  };

  const renderProcessing = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold">Scanning Your Ghana Card</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we extract information from your card...
        </p>
      </div>

      {/* Card images with scanning overlay */}
      <div className="grid grid-cols-2 gap-3">
        {frontImage && (
          <div className="relative aspect-[1.586/1] rounded-lg overflow-hidden border">
            <img
              src={frontImage}
              alt="Front of card"
              className="w-full h-full object-cover"
            />
            <style>{scanningKeyframes}</style>
            <div
              className="absolute left-0 right-0 h-[2px] z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, #d9a837, #fbbf24, #d9a837, transparent)',
                animation: 'scanline 1.5s ease-in-out infinite',
                top: '0%',
              }}
            />
            <div className="absolute bottom-1 left-1 right-1 text-center">
              <span className="text-[9px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                FRONT
              </span>
            </div>
          </div>
        )}
        {backImage && (
          <div className="relative aspect-[1.586/1] rounded-lg overflow-hidden border">
            <img
              src={backImage}
              alt="Back of card"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute left-0 right-0 h-[2px] z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, #d9a837, #fbbf24, #d9a837, transparent)',
                animation: 'scanline 1.5s ease-in-out infinite 0.75s',
                top: '0%',
              }}
            />
            <div className="absolute bottom-1 left-1 right-1 text-center">
              <span className="text-[9px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                BACK
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
            {PROCESSING_MESSAGES[processingMessageIndex]}
          </span>
          <span className="font-medium text-amber-600">{Math.round(processingProgress)}%</span>
        </div>
        <Progress value={processingProgress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="grid grid-cols-7 gap-1">
        {PROCESSING_MESSAGES.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: i <= processingMessageIndex ? 1 : 0.3,
              scale: i === processingMessageIndex ? 1.05 : 1,
            }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                i < processingMessageIndex
                  ? 'bg-emerald-500'
                  : i === processingMessageIndex
                    ? 'bg-amber-500'
                    : 'bg-muted'
              }`}
            />
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              {msg.replace('...', '').replace('Complete!', 'Done!')}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderReviewData = () => {
    if (!editableResult) return null;

    const confidence = editableResult.verificationScore;
    const confidenceColor =
      confidence > 90
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
        : confidence > 70
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    const confidenceLabel =
      confidence > 90 ? 'High Confidence' : confidence > 70 ? 'Medium Confidence' : 'Low Confidence';

    const fieldGroups = [
      {
        title: 'Card Information',
        icon: CreditCard,
        fields: [
          { key: 'idNumber', label: 'ID Number' },
          { key: 'documentType', label: 'Document Type' },
          { key: 'issueDate', label: 'Issue Date' },
          { key: 'expiryDate', label: 'Expiry Date' },
          { key: 'cardNumber', label: 'Card Number' },
          { key: 'personalIdNumber', label: 'Personal ID Number' },
        ],
      },
      {
        title: 'Personal Information',
        icon: User,
        fields: [
          { key: 'fullName', label: 'Full Name' },
          { key: 'dateOfBirth', label: 'Date of Birth' },
          { key: 'gender', label: 'Gender' },
          { key: 'nationality', label: 'Nationality' },
          { key: 'region', label: 'Region' },
        ],
      },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold">Review Extracted Data</h3>
          <p className="text-sm text-muted-foreground">
            Please verify the information extracted from your Ghana Card
          </p>
        </div>

        {/* Confidence badge */}
        <div className="flex justify-center">
          <Badge className={`text-sm px-3 py-1 ${confidenceColor}`}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {confidenceLabel} — {confidence}%
          </Badge>
        </div>

        {/* Editable fields */}
        {isEditing ? (
          <div className="space-y-4">
            {fieldGroups.map((group) => (
              <Card key={group.title}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <group.icon className="h-4 w-4 text-amber-500" />
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {group.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      <Input
                        value={(editableResult as unknown as Record<string, string>)[field.key] || ''}
                        onChange={(e) =>
                          setEditableResult((prev) =>
                            prev ? { ...prev, [field.key]: e.target.value } : prev
                          )
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="w-full min-h-[44px]"
            >
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
              Done Editing
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {fieldGroups.map((group) => (
              <Card key={group.title}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <group.icon className="h-4 w-4 text-amber-500" />
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2.5">
                    {group.fields.map((field) => (
                      <div
                        key={field.key}
                        className="flex items-center justify-between py-1.5 border-b border-muted/50 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs text-muted-foreground shrink-0">
                            {field.label}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-right truncate max-w-[60%]">
                          {(editableResult as unknown as Record<string, string>)[field.key] || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="w-full min-h-[44px]"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Fields
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setBackImage(null);
              goToStep('capture-back');
            }}
            className="min-h-[44px]"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Rescan
          </Button>
          <Button
            onClick={() => goToStep('next-of-kin')}
            className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
          >
            Looks Correct
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderNextOfKin = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Heart className="h-6 w-6 text-amber-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold">Next of Kin Information</h3>
        <p className="text-sm text-muted-foreground">
          Please provide details of your next of kin. This is required for account security.
        </p>
      </div>

      <Card className="border-amber-200 dark:border-amber-800/50">
        <CardContent className="pt-4 pb-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nok-name" className="text-xs text-muted-foreground">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nok-name"
              placeholder="Enter full name"
              value={nextOfKin.name}
              onChange={(e) => setNextOfKin((prev) => ({ ...prev, name: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="nok-phone" className="text-xs text-muted-foreground">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                +233
              </span>
              <Input
                id="nok-phone"
                type="tel"
                placeholder="24 123 4567"
                value={nextOfKin.phone}
                onChange={(e) => setNextOfKin((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-10 text-sm pl-14"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="nok-relationship" className="text-xs text-muted-foreground">
              Relationship <span className="text-red-500">*</span>
            </Label>
            <Select
              value={nextOfKin.relationship}
              onValueChange={(value) => setNextOfKin((prev) => ({ ...prev, relationship: value }))}
            >
              <SelectTrigger className="h-10 text-sm min-h-[44px]">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => goToStep('review-data')}
          className="min-h-[44px]"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Review
        </Button>
        <Button
          onClick={() => {
            if (!nextOfKin.name.trim() || !nextOfKin.phone.trim() || !nextOfKin.relationship) {
              toast.error('Missing Information', { description: 'Please fill in all next of kin fields.' });
              return;
            }
            goToStep('address-info');
          }}
          className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
        >
          Continue to Address
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderAddressInfo = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-amber-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold">Residential Address</h3>
        <p className="text-sm text-muted-foreground">
          Please provide your current residential address including your Ghana Post GPS digital address.
        </p>
      </div>

      <Card className="border-amber-200 dark:border-amber-800/50">
        <CardContent className="pt-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="addr-house" className="text-xs text-muted-foreground">House Number</Label>
              <Input
                id="addr-house"
                placeholder="e.g. 24"
                value={addressInfo.houseNumber}
                onChange={(e) => setAddressInfo((prev) => ({ ...prev, houseNumber: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="addr-street" className="text-xs text-muted-foreground">Street Name</Label>
              <Input
                id="addr-street"
                placeholder="e.g. Oxford Street"
                value={addressInfo.street}
                onChange={(e) => setAddressInfo((prev) => ({ ...prev, street: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="addr-area" className="text-xs text-muted-foreground">Area / Locality</Label>
            <Input
              id="addr-area"
              placeholder="e.g. Osu"
              value={addressInfo.area}
              onChange={(e) => setAddressInfo((prev) => ({ ...prev, area: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="addr-city" className="text-xs text-muted-foreground">City / Town</Label>
            <Input
              id="addr-city"
              placeholder="e.g. Accra"
              value={addressInfo.city}
              onChange={(e) => setAddressInfo((prev) => ({ ...prev, city: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="addr-region" className="text-xs text-muted-foreground">Region</Label>
            <Select
              value={addressInfo.region}
              onValueChange={(value) => setAddressInfo((prev) => ({ ...prev, region: value }))}
            >
              <SelectTrigger className="h-10 text-sm min-h-[44px]">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {GHANA_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="addr-gps" className="text-xs text-muted-foreground">
              Ghana Post GPS
            </Label>
            <Input
              id="addr-gps"
              placeholder="GA-XXX-XXXX"
              value={addressInfo.digitalAddress}
              onChange={(e) => setAddressInfo((prev) => ({ ...prev, digitalAddress: e.target.value.toUpperCase() }))}
              className="h-10 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Format: GA-XXX-XXXX (e.g. GA-123-4567)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => goToStep('next-of-kin')}
          className="min-h-[44px]"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Next of Kin
        </Button>
        <Button
          onClick={() => {
            if (!addressInfo.area.trim() || !addressInfo.city.trim()) {
              toast.error('Missing Information', { description: 'Please fill in at least your area and city.' });
              return;
            }
            goToStep('selfie');
          }}
          className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
        >
          Continue to Selfie
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderSelfie = () => (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold">Selfie Verification</h3>
        <p className="text-sm text-muted-foreground">
          Take a selfie to confirm your identity. Position your face within the circle.
        </p>
      </div>

      {/* Selfie capture area */}
      <div className="flex justify-center">
        <div className="relative w-56 h-56">
          {/* Flash overlay */}
          <AnimatePresence>
            {flashVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-white rounded-full z-20 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {selfieImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-full"
            >
              <img
                src={selfieImage}
                alt="Selfie"
                className="w-full h-full object-cover rounded-full border-2 border-amber-400"
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white text-[10px]">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Captured
                </Badge>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full rounded-full border-4 border-dashed border-amber-400 bg-muted/20 flex flex-col items-center justify-center gap-2">
              <div className="w-32 h-32 rounded-full border-2 border-amber-300/40 flex items-center justify-center">
                <User className="h-12 w-12 text-amber-400/60" />
              </div>
              <p className="text-xs text-muted-foreground text-center px-4">
                Face should be clearly visible
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/50">
        <CardContent className="pt-4 pb-4 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-amber-500" />
            Selfie Tips
          </h4>
          <div className="space-y-1.5">
            {[
              'Face the camera directly with a neutral expression',
              'Ensure good lighting on your face (no harsh shadows)',
              'Remove sunglasses, hats, or face coverings',
              'Hold the phone at eye level, arm\'s length away',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleSelfieFileChange}
        className="hidden"
      />

      {/* Action buttons */}
      <div className="space-y-3">
        {!selfieImage ? (
          <>
            <Button
              onClick={() => selfieInputRef.current?.click()}
              className="w-full min-h-[44px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Selfie
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                selfieInputRef.current?.removeAttribute('capture');
                selfieInputRef.current?.click();
              }}
              className="w-full min-h-[44px]"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setSelfieImage(null)}
              className="w-full min-h-[44px]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Selfie
            </Button>
            <Button
              onClick={handleSubmitVerification}
              disabled={isSubmitting}
              className="w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying with NIA...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => goToStep('address-info')}
        className="w-full min-h-[44px] text-muted-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Address
      </Button>
    </motion.div>
  );

  const renderComplete = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Success animation */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.4 }}
            >
              <CircleCheckBig className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          {/* Sparkle decorations */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-6 w-6 text-amber-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute -bottom-1 -left-3"
          >
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </motion.div>
        </motion.div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
          Verification Complete!
        </h3>
        <p className="text-sm text-muted-foreground">
          Your identity has been successfully verified with the National Identification Authority.
        </p>
      </div>

      {/* Success badge */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Badge className="bg-emerald-500 text-white text-sm px-4 py-1.5">
            <Shield className="h-4 w-4 mr-1.5" />
            Full KYC Verified
          </Badge>
        </motion.div>
      </div>

      {/* Verified data summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="pt-4 pb-4 space-y-3">
            <h4 className="font-semibold text-sm">Verified Information</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Full Name
                </span>
                <span className="text-sm font-medium">
                  {editableResult?.fullName || ocrResult?.fullName}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-t border-muted/50">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <IdCard className="h-3.5 w-3.5" /> ID Number
                </span>
                <span className="text-sm font-mono font-medium">
                  {editableResult?.idNumber || ocrResult?.idNumber}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-t border-muted/50">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" /> KYC Level
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Full KYC
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-t border-muted/50">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Verified At
                </span>
                <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
              </div>
              {nextOfKin.name && (
                <div className="flex items-center justify-between py-1.5 border-t border-muted/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5" /> Next of Kin
                  </span>
                  <span className="text-sm font-medium">
                    {nextOfKin.name} {nextOfKin.phone && `(${nextOfKin.phone})`}
                  </span>
                </div>
              )}
              {(addressInfo.area || addressInfo.city) && (
                <div className="flex items-center justify-between py-1.5 border-t border-muted/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Address
                  </span>
                  <span className="text-sm font-medium text-right max-w-[60%] truncate">
                    {[addressInfo.area, addressInfo.city, addressInfo.region].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Benefits unlocked */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/50">
          <CardContent className="pt-4 pb-4 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Benefits Unlocked
            </h4>
            <div className="space-y-1.5">
              {[
                'Higher transaction limits (up to GHS 50,000/day)',
                'Access to larger loan amounts',
                'Priority customer support',
                'Enhanced account security',
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Button
        onClick={onComplete}
        className="w-full min-h-[44px]"
      >
        Back to Settings
      </Button>
    </motion.div>
  );

  // ---- Step progress indicator ----
  const renderStepIndicator = () => {
    const visibleSteps: { step: KYCVerificationStep; label: string }[] = [
      { step: 'intro', label: 'Start' },
      { step: 'capture-front', label: 'Front' },
      { step: 'capture-back', label: 'Back' },
      { step: 'processing', label: 'Scan' },
      { step: 'review-data', label: 'Review' },
      { step: 'next-of-kin', label: 'N.o.K.' },
      { step: 'address-info', label: 'Address' },
      { step: 'selfie', label: 'Selfie' },
      { step: 'complete', label: 'Done' },
    ];

    const visibleIndex = visibleSteps.findIndex((s) => s.step === currentStep);

    return (
      <div className="flex items-center justify-center gap-1 mb-4 overflow-x-auto px-2 py-2">
        {visibleSteps.map((s, i) => {
          const isCompleted = i < visibleIndex;
          const isCurrent = i === visibleIndex;

          return (
            <div key={s.step} className="flex items-center gap-1 shrink-0">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : isCurrent
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-3 w-3" />
                ) : isCurrent && s.step !== 'complete' ? (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                ) : isCurrent ? (
                  <CircleCheckBig className="h-3 w-3" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div
                  className={`h-[2px] w-3 sm:w-6 ${
                    i < visibleIndex ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="mobile-card">
      <CardContent className="pt-5 pb-6 px-4">
        <AnimatePresence mode="wait">
          {currentStep !== 'complete' && renderStepIndicator()}
          {currentStep === 'intro' && renderIntro()}
          {currentStep === 'capture-front' && renderCapture('front')}
          {currentStep === 'capture-back' && renderCapture('back')}
          {currentStep === 'processing' && renderProcessing()}
          {currentStep === 'review-data' && renderReviewData()}
          {currentStep === 'next-of-kin' && renderNextOfKin()}
          {currentStep === 'address-info' && renderAddressInfo()}
          {currentStep === 'selfie' && renderSelfie()}
          {currentStep === 'complete' && renderComplete()}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
