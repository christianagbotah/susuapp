// ============================================
// iSusuPro Ghana - Enterprise Type Definitions
// ============================================

// Portal & Navigation
export type PortalId = 'customer' | 'agent' | 'admin' | 'treasurer';
export type CustomerPageId = 'dashboard' | 'susu' | 'loans' | 'wallet' | 'transactions' | 'settings' | 'transfers' | 'referrals' | 'airtime' | 'bills' | 'budgeting';
export type AgentPageId = 'dashboard' | 'collections' | 'customers' | 'commissions' | 'settings';
export type AdminPageId = 'dashboard' | 'users' | 'loans' | 'analytics' | 'compliance' | 'settings' | 'agents' | 'susu-groups' | 'payroll' | 'ssnit' | 'tax' | 'kyc-verification';
export type TreasurerPageId = 'dashboard' | 'groups' | 'payouts' | 'members' | 'reports' | 'settings';

// Auth
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: PortalId;
  kycLevel: 'none' | 'basic' | 'full';
  memberSince: string;
  location?: string;
  agentCode?: string;
  branch?: string;
}

// ---- SUSU MODULE ----
export interface SusuGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
  totalPool: number;
  contributionAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextPayout: string;
  nextPayoutMember: string;
  status: 'active' | 'completed' | 'full';
  currentRound: number;
  totalRounds: number;
  roundStartDate: string;
  treasurerId: string;
  treasurerName: string;
  branch: string;
}

export interface SusuContribution {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  collectedBy?: string;
  collectedByName?: string;
  round: number;
}

export interface SusuPayout {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  amount: number;
  payoutDate: string;
  round: number;
  status: 'completed' | 'pending' | 'processing';
  disbursementMethod: 'momo' | 'bank';
  momoNumber?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  autoContribute: boolean;
  contributionAmount: number;
  contributionFrequency: 'daily' | 'weekly' | 'monthly';
}

// ---- LOANS MODULE ----
export interface Loan {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  type: 'personal' | 'business' | 'education' | 'emergency' | 'susu-backed';
  amount: number;
  interestRate: number;
  term: number;
  termUnit: 'months' | 'weeks' | 'days';
  status: 'pending' | 'under_review' | 'approved' | 'active' | 'repaid' | 'rejected' | 'defaulted';
  monthlyPayment: number;
  remainingBalance: number;
  totalPaid: number;
  nextPaymentDate: string;
  startDate: string;
  endDate: string;
  disbursementMethod: 'momo' | 'bank';
  disbursementProvider?: string;
  disbursementNumber?: string;
  purpose: string;
  guarantorName?: string;
  guarantorPhone?: string;
  collateral?: string;
  creditScore: number;
  branch: string;
  reviewedBy?: string;
  reviewDate?: string;
  rejectReason?: string;
  repaymentSchedule?: RepaymentScheduleEntry[];
  repaymentFrequency?: 'bullet' | 'daily' | 'weekly' | 'monthly';
  processingFee?: number;
  totalInterest?: number;
  disbursementDate?: string;
  applicationDate?: string;
  approvedDate?: string;
  autoApproved?: boolean;
  interestType?: 'flat' | 'reducing_balance';
  productId?: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: 'momo' | 'bank' | 'agent';
  principal: number;
  interest: number;
  penalty?: number;
}

export interface RepaymentScheduleEntry {
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidDate?: string;
  paidAmount?: number;
  overdueDays?: number;
}

export interface CreditScoreFactors {
  susuConsistency: number;
  repaymentHistory: number;
  kycLevel: number;
  accountAge: number;
  walletActivity: number;
}

export interface CreditScoreResult {
  score: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  maxLoanAmount: number;
  interestRate: number;
  maxTermDays: number;
  factors: CreditScoreFactors;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  type?: 'personal' | 'business' | 'education' | 'emergency' | 'susu-backed';
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTerm: number;
  maxTerm: number;
  termUnit: 'months' | 'weeks' | 'days';
  requirements: string[];
  isActive: boolean;
  repaymentFrequency?: 'bullet' | 'daily' | 'weekly' | 'monthly';
  interestType?: 'flat' | 'reducing_balance';
  processingFeePercent?: number;
  autoApprove?: boolean;
  maxCreditScoreRequired?: number;
}

// ---- WALLET MODULE ----
export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  type: 'main' | 'savings' | 'loan' | 'susu';
  provider?: string;
  accountNumber?: string;
  isDefault: boolean;
  status: 'active' | 'frozen' | 'closed';
}

export interface MobileMoneyProvider {
  id: string;
  name: string;
  shortName: string;
  code: string;
  color: string;
  bgColor: string;
  icon: string;
  ussdCode: string;
}

export interface DepositRequest {
  id: string;
  walletId: string;
  amount: number;
  provider: string;
  phoneNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  reference: string;
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  provider: string;
  phoneNumber: string;
  fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  reference: string;
}

// ---- TRANSACTIONS MODULE ----
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'susu_contribution' | 'susu_payout' | 'loan_disbursement' | 'loan_repayment' | 'agent_commission' | 'fee';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  date: string;
  description: string;
  reference: string;
  category: string;
  balanceAfter: number;
  counterpartName?: string;
}

// ---- AGENT MODULE ----
export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  code: string;
  branch: string;
  territory: string;
  status: 'active' | 'inactive' | 'suspended';
  totalCollections: number;
  totalCustomers: number;
  totalCommissions: number;
  rating: number;
  joinedDate: string;
  lastActive: string;
  avatar?: string;
}

export interface CollectionRoute {
  id: string;
  name: string;
  area: string;
  customerCount: number;
  totalExpected: number;
  totalCollected: number;
  date: string;
  status: 'in_progress' | 'completed' | 'pending' | 'partial';
  customers: CollectionCustomer[];
}

export interface CollectionCustomer {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  susuGroupId: string;
  susuGroupName: string;
  expectedAmount: number;
  collectedAmount: number;
  status: 'collected' | 'pending' | 'absent';
  notes?: string;
}

export interface AgentCommission {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  type: 'susu_collection' | 'loan_referral' | 'new_customer' | 'milestone_bonus';
  description: string;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidDate?: string;
}

// ---- ADMIN MODULE ----
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalLoansDisbursed: number;
  totalSusuPool: number;
  totalAgents: number;
  activeAgents: number;
  totalSusuGroups: number;
  pendingLoans: number;
  defaultRate: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  region: string;
  manager: string;
  totalCustomers: number;
  totalAgents: number;
  totalSusuGroups: number;
  status: 'active' | 'inactive';
}

export interface ComplianceReport {
  id: string;
  type: 'kyc' | 'aml' | 'transaction_limit' | 'suspicious_activity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  date: string;
  assignedTo?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
  category: string;
  link?: string;
}

// ---- REFER-A-FRIEND MODULE ----
export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredName: string;
  referredPhone: string;
  status: 'pending' | 'registered' | 'active' | 'rewarded';
  rewardAmount: number;
  rewardStatus: 'pending' | 'paid' | 'cancelled';
  date: string;
  registeredDate?: string;
}

// ---- MONEY TRANSFER MODULE ----
export interface Transfer {
  id: string;
  senderId: string;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  date: string;
  reference: string;
  note?: string;
}

// ---- TRANSACTION DISPUTE MODULE ----
export interface Dispute {
  id: string;
  transactionId: string;
  userId: string;
  type: 'unauthorized' | 'duplicate' | 'incorrect_amount' | 'not_received' | 'other';
  description: string;
  amount: number;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  resolution?: string;
  date: string;
  updatedAt: string;
}

// ---- ACTIVITY LOG ----
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  date: string;
  ip?: string;
  category: string;
}

// ---- COMPANY DETAILS ----
export interface CompanyDetails {
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  taxIdentificationNumber: string;
  companyType: 'sole_proprietorship' | 'partnership' | 'limited_liability' | 'cooperative' | 'ngo';
  industry: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  digitalAddress: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: 'GHS' | 'USD';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timezone: string;
  fiscalYearStart: string;
  enableCustomerRegistration: boolean;
  enableAgentRegistration: boolean;
  defaultLanguage: 'en' | 'tw' | 'fa' | 'ga';
  maxDailyTransactionLimit: number;
  maxSingleTransactionLimit: number;
  minSusuContribution: number;
  maxSusuContribution: number;
}

// ---- PAYMENT GATEWAY CONFIGURATION ----
export type PaymentGatewayId = 'hubtel' | 'paystack';
export type PaymentGatewayStatus = 'active' | 'inactive' | 'test_mode';

export interface PaymentGatewayCredential {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  merchantAccountNumber?: string;
  webhookUrl: string;
  callbackUrl: string;
}

export interface PaymentGatewayConfig {
  id: PaymentGatewayId;
  name: string;
  description: string;
  icon: string;
  website: string;
  status: PaymentGatewayStatus;
  credentials: PaymentGatewayCredential;
  supportedMethods: ('momo' | 'card' | 'bank_transfer' | 'qr')[];
  enabledForDeposits: boolean;
  enabledForWithdrawals: boolean;
  enabledForLoanDisbursement: boolean;
  enabledForSusuPayouts: boolean;
  transactionFeePercent: number;
  flatFee: number;
  lastTested?: string;
  testSuccessful?: boolean;
}

// ---- SMS/OTP PROVIDER CONFIGURATION ----
export type SMSProviderId = 'hubtel' | 'arkesel';
export type SMSProviderStatus = 'active' | 'inactive' | 'test_mode';

export interface SMSCredential {
  apiKey: string;
  senderId: string;
  webhookUrl?: string;
}

export interface SMSProviderConfig {
  id: SMSProviderId;
  name: string;
  description: string;
  icon: string;
  website: string;
  status: SMSProviderStatus;
  credentials: SMSCredential;
  enabledForOTP: boolean;
  enabledForNotifications: boolean;
  enabledForMarketing: boolean;
  enabledForAlerts: boolean;
  otpExpirySeconds: number;
  maxOTPRetry: number;
  smsPerDayLimit: number;
  lastTested?: string;
  testSuccessful?: boolean;
}

// ---- PLATFORM CONFIGURATION (Combined) ----
export interface PlatformConfig {
  company: CompanyDetails;
  paymentGateways: PaymentGatewayConfig[];
  smsProviders: SMSProviderConfig[];
  activePaymentGateway: PaymentGatewayId | null;
  activeSMSProvider: SMSProviderId | null;
}

// ---- GHANA CARD OCR ----
export interface GhanaCardOCRResult {
  idNumber: string;           // GHA-XXXXXXXXX format
  fullName: string;           // Surname Firstname OtherNames
  dateOfBirth: string;        // DD/MM/YYYY
  gender: 'Male' | 'Female';
  nationality: string;        // Ghanaian
  expiryDate: string;         // DD/MM/YYYY
  issueDate: string;          // DD/MM/YYYY
  cardNumber: string;         // Back of card number
  personalIdNumber: string;   // Back of card PIN
  documentType: string;       // Ghana Card
  region: string;             // Place of registration
  verificationScore: number;  // 0-100 OCR confidence
}

export type KYCVerificationStep = 
  | 'intro'
  | 'capture-front'
  | 'capture-back'
  | 'processing'
  | 'review-data'
  | 'next-of-kin'
  | 'address-info'
  | 'selfie'
  | 'complete';

export interface KYCVerificationState {
  currentStep: KYCVerificationStep;
  frontImage: string | null;       // base64 data URL
  backImage: string | null;        // base64 data URL
  selfieImage: string | null;      // base64 data URL
  ocrResult: GhanaCardOCRResult | null;
  ocrConfidence: number;           // 0-100
  isProcessing: boolean;
  processingProgress: number;      // 0-100 for animation
  errors: string[];
  submittedAt: string | null;
  verifiedAt: string | null;
}

export interface KYCNextOfKin {
  name: string;
  phone: string;
  relationship: string;
}

export interface KYCAddressInfo {
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  region: string;
  digitalAddress: string;  // Ghana Post GPS
}

// ---- KYC VERIFICATION RECORD (Admin Management) ----
export type KYCRecordStatus = 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'expired';
export type KYCRecommendation = 'approve' | 'manual_review' | 'reject';

export interface KYCVerificationRecord {
  id: string;                              // KYC-XXXXXXXX
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  status: KYCRecordStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  // Card data from OCR
  cardData: GhanaCardOCRResult;
  // Verification results
  facialMatchScore: number;                // 0-100
  niaVerified: boolean;
  documentValid: boolean;
  identityVerified: boolean;
  recommendation: KYCRecommendation;
  ocrConfidence: number;                   // 0-100
  warnings: string[];
  processingTime: number;                  // ms
  // Additional info
  addressInfo?: KYCAddressInfo;
  nextOfKin?: KYCNextOfKin;
  // Metadata
  kycLevel: 'none' | 'basic' | 'full';
  expiresAt: string;
}



export interface KYCAdminStats {
  totalVerified: number;
  totalPending: number;
  totalRejected: number;
  completionRate: number;
  averageOCRConfidence: number;
  averageFacialMatch: number;
}

// ============================================
// PAYROLL MODULE (Ghana)
// ============================================

export interface PayrollEmployee {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  branch: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  ssnitNumber: string;
  tinNumber: string;
  ghanaCardId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  dateJoined: string;
  contractType: 'permanent' | 'contract' | 'probation' | 'national_service';
  payGrade: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  period: string;           // e.g. "April 2026"
  payDate: string;
  // Earnings
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  bonus: number;
  grossPay: number;
  // Deductions
  ssnitEmployee: number;    // 5.5%
  tier2Employee: number;    // 5%
  payeTax: number;
  nhfDeduction: number;
  otherDeductions: number;
  loanDeduction: number;
  totalDeductions: number;
  // Net
  netPay: number;
  // Employer SSNIT (shown for reference)
  ssnitEmployer: number;    // 13.5%
  tier2Employer: number;    // 5%
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled';
}

export interface PayrollRun {
  id: string;
  period: string;
  payDate: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalSSNIT: number;       // employer + employee
  totalPAYE: number;
  status: 'draft' | 'processing' | 'approved' | 'paid';
  createdAt: string;
  approvedBy?: string;
  paidAt?: string;
}

// ============================================
// SSNIT MODULE (Ghana)
// ============================================

export interface SSNITContribution {
  id: string;
  employeeId: string;
  employeeName: string;
  ssnitNumber: string;
  period: string;
  basicSalary: number;
  employeeContribution: number;   // 5.5%
  employerContribution: number;   // 13.5% (11% pension + 2.5% NHIS)
  tier2Employer: number;          // 5%
  totalContribution: number;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'failed';
  reference: string;
}

export interface SSNITFiling {
  id: string;
  period: string;
  totalEmployees: number;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  totalTier2: number;
  grandTotal: number;
  filingDate: string;
  paymentDate?: string;
  status: 'draft' | 'submitted' | 'paid' | 'rejected' | 'overdue';
  reference: string;
  ssnitReceiptNumber?: string;
}

// ============================================
// GRA TAX MODULE (Ghana)
// ============================================

export type TAXType = 'paye' | 'vat' | 'withholding' | 'income_tax' | 'nhil' | 'getfund';

export interface TAXFiling {
  id: string;
  taxType: TAXType;
  period: string;
  taxpayerName: string;
  tin: string;
  totalTax: number;
  filingDate: string;
  paymentDate?: string;
  dueDate: string;
  status: 'draft' | 'filed' | 'paid' | 'overdue' | 'penalty';
  reference: string;
  graReceiptNumber?: string;
  penaltyAmount?: number;
}

export interface TAXPayment {
  id: string;
  taxType: TAXType;
  amount: number;
  penaltyAmount: number;
  totalAmount: number;
  paymentDate: string;
  method: 'bank_transfer' | 'momo' | 'cheque';
  reference: string;
  graReceiptNumber?: string;
  period: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface TAXCalendarItem {
  id: string;
  taxType: TAXType;
  name: string;
  description: string;
  dueDay: number;             // day of month (e.g., 15 for PAYE)
  frequency: 'monthly' | 'quarterly' | 'annually';
  penaltyPercent: number;
  nextDueDate: string;
}

// ============================================
// AIRTIME & DATA TOP-UP MODULE (Ghana)
// ============================================

export type TelcoProvider = 'mtn' | 'telecel' | 'atum' | 'glo';

export interface AirtimeProduct {
  id: string;
  provider: TelcoProvider;
  name: string;
  type: 'airtime' | 'data' | 'bundle';
  description: string;
  price: number;
  value: number;
  validity: string;           // e.g., "30 days", "7 days"
  popular: boolean;
}

export interface AirtimeTransaction {
  id: string;
  userId: string;
  provider: TelcoProvider;
  recipientPhone: string;
  recipientName?: string;
  type: 'airtime' | 'data' | 'bundle';
  productName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string;
  date: string;
  balanceAfter: number;
}

// ============================================
// BILL PAYMENTS MODULE (Ghana)
// ============================================

export type BillerCategory = 'electricity' | 'water' | 'tv' | 'internet' | 'government' | 'insurance';

export interface Biller {
  id: string;
  name: string;
  category: BillerCategory;
  logo: string;
  fieldLabel: string;         // e.g., "Meter Number", "Account Number"
  fieldPlaceholder: string;
  supportedPaymentMethods: ('momo' | 'card' | 'bank_transfer')[];
  isActive: boolean;
}

export interface BillPayment {
  id: string;
  userId: string;
  billerId: string;
  billerName: string;
  billerCategory: BillerCategory;
  accountNumber: string;
  customerName: string;
  amount: number;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string;
  date: string;
  token?: string;             // e.g., ECG prepaid token
  balanceAfter: number;
}

// ============================================
// BUDGETING & EXPENSES MODULE
// ============================================

export type BudgetCategory = 
  | 'food' | 'transport' | 'utilities' | 'rent' | 'healthcare'
  | 'education' | 'entertainment' | 'savings' | 'airtime_data'
  | 'clothing' | 'family' | 'religious' | 'other';

export interface Budget {
  id: string;
  userId: string;
  category: BudgetCategory;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  color: string;
  icon: string;
}

export interface Expense {
  id: string;
  userId: string;
  category: BudgetCategory;
  categoryName: string;
  amount: number;
  description: string;
  date: string;
  reference: string;
  location?: string;
  recurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
}
