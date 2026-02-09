
export enum CustomerGrade {
  A = 'A', B = 'B', C = 'C', D = 'D'
}

export type TransactionType = 'credit' | 'debit';
export type TransactionUnit = 'money' | 'gold'; 
export type PaymentMethod = 'cash' | 'cheque' | 'upi' | 'rtgs' | 'adjustment' | 'gold_bar' | 'ornament' | 'bill';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  avatarUrl?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  unit: TransactionUnit;
  amount: number;
  method: PaymentMethod;
  description: string;
  date: string;
  staffId: string;
  balanceAfter: number;
  refNo?: string; 
  particular?: string;
}

export interface DigitalFingerprint {
  id: string;
  timestamp: string;
  eventType: 'LINK_OPEN' | 'PAYMENT_ATTEMPT' | 'PAYMENT_SUCCESS' | 'UPI_INTENT';
  ipAddress: string;
  device: {
    model: string;
    os: string;
    browser: string;
    type: 'mobile' | 'desktop' | 'tablet';
  };
  network: {
    type: '4g' | '5g' | 'wifi';
    isp: string;
  };
  location: {
    lat: number;
    lng: number;
    city: string;
    region: string;
    country: string;
  };
  metadata?: {
    upiId?: string;
    paymentMethod?: string;
    amount?: number;
    provider?: 'setu' | 'razorpay';
  };
}

export interface VerifiedDocument {
  id: string;
  type: 'PAN' | 'AADHAR' | 'GSTIN' | 'UDYAM' | 'VOTER_ID';
  documentNumber: string;
  status: 'VALID' | 'INVALID' | 'SUSPICIOUS' | 'PENDING';
  nameOnDocument: string;
  verificationDate: string;
  source: 'DEEPVUE_API' | 'MANUAL_UPLOAD' | 'MOBILE_TRACE'; 
  extractedFields: {
    dob?: string;
    fatherName?: string;
    address?: string;
    entityType?: string;
    dateOfIncorporation?: string;
    aadhaarSeedingStatus?: 'LINKED' | 'NOT_LINKED' | 'UNKNOWN'; 
    category?: string; 
  };
  rawResponse?: any;
}

// --- DEEPVUE LIBRARY STRUCTURES ---

export interface DiscoveredContact {
  type: 'mobile' | 'email' | 'landline';
  value: string;
  ownerName: string;
  source: 'GST_REGISTRY' | 'CIBIL_ENQUIRY' | 'LINKEDIN' | 'PREVIOUS_LOAN' | 'EQUIFAX' | 'MOBILE_TRACE';
  confidenceScore: number;
  status: 'Verified' | 'Unverified' | 'Invalid' | 'Active' | 'Inactive';
  
  // Mobile Network Intelligence Fields
  carrier?: string; 
  circle?: string; 
  dndStatus?: boolean; 
  lastActive?: string;
}

export interface DiscoveredAddress {
  type: 'registered' | 'operational' | 'residential' | 'permanent';
  fullAddress: string;
  source: string;
  lastVerified: string;
}

export interface BankAccount {
  accountNumber: string; 
  ifsc: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'OD' | 'CC' | 'UPI_LINKED';
  source: 'PENNY_DROP' | 'GST_FILING' | 'NACH_MANDATE' | 'MOBILE_TO_UPI';
  upiId?: string; 
}

export interface LoanDetails {
  lender: string;
  type: 'PERSONAL' | 'BUSINESS' | 'GOLD' | 'HOME' | 'CC';
  amount: number;
  outstanding: number;
  status: 'ACTIVE' | 'CLOSED' | 'WRITTEN_OFF' | 'DPD_30+';
  disbursalDate: string;
}

// New: Credit Enquiry (Hard Pulls)
export interface CreditEnquiry {
  enquiryDate: string;
  purpose: string; // e.g., 'Credit Card', 'Personal Loan'
  institution: string;
  amount: number;
}

// New: Vehicle Registration (RC)
export interface RcDetails {
  rcNumber: string;
  ownerName: string;
  vehicleClass: string; // e.g. "MCWG", "LMV"
  fuelType: string;
  model: string;
  insuranceValidUntil: string;
  registrationDate: string;
}

// New: Driving License (DL)
export interface DlDetails {
  dlNumber: string;
  name: string;
  dob: string;
  validUntil: string;
  status: 'Active' | 'Expired';
}

// New: EPFO/UAN
export interface UanDetails {
  uanNumber: string;
  employerName: string; // Last known employer
  memberId: string;
  exitDate?: string; // If left
}

export interface DeepvueLibrary {
  contacts: DiscoveredContact[];
  addresses: DiscoveredAddress[];
  bankAccounts: BankAccount[];
  loans: LoanDetails[];
  
  // Advanced Modules
  rcDetails?: RcDetails[];
  dlDetails?: DlDetails[];
  uanDetails?: UanDetails[];
  creditEnquiries?: CreditEnquiry[];
  mobileIdentityName?: string; 
}

export interface DeepvueInsight {
  kycStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  riskScore: number; 
  creditScore: number; 
  financialPropensity: 'HIGH' | 'MEDIUM' | 'LOW';
  associatedEntities: string[]; 
  gstFilingStatus: 'REGULAR' | 'IRREGULAR' | 'UNKNOWN';
  lastRefresh: string;
  
  verifiedDocuments: VerifiedDocument[];
  
  library: DeepvueLibrary;

  // Legacy accessors
  panValid: boolean;
  panNumber?: string;
  aadharValid: boolean;
  aadharNumber?: string;
}

// --- NEW PROFILE STRUCTURES ---
export interface ProfileContact {
  id: string;
  type: 'mobile' | 'email' | 'work' | 'home';
  value: string;
  label?: string;
  isPrimary: boolean;
  source: 'MANUAL' | 'DEEPVUE_IMPORT';
}

export interface ProfileAddress {
  id: string;
  type: 'residential' | 'office' | 'registered' | 'warehouse';
  value: string;
  isPrimary: boolean;
  source: 'MANUAL' | 'DEEPVUE_IMPORT';
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // Keep as Primary Sync
  email?: string;
  address?: string; // Keep as Primary Sync
  taxNumber?: string;
  reference?: string;
  groupId: string;
  birthDate?: string;
  anniversaryDate?: string;
  creditLimit?: number;
  spouseName?: string;
  isActive: boolean;
  profilePhoto?: string;
  tags?: string[]; // Added Tags
  
  // New Array Fields for Multiple Support
  contactList: ProfileContact[];
  addressList: ProfileAddress[];

  uniquePaymentCode: string;
  grade: CustomerGrade;
  
  currentBalance: number; 
  currentGoldBalance: number;

  lastTxDate: string;
  transactions: Transaction[];
  status: 'active' | 'overdue' | 'settled';

  lastCallDate?: string;
  lastWhatsappDate?: string;
  lastSmsDate?: string; 
  paymentLinkStats: {
    totalOpens: number;
    lastOpened?: string;
  };
  enabledGateways: {
    razorpay: boolean;
    setu: boolean;
  };
  
  fingerprints: DigitalFingerprint[];
  deepvueInsights?: DeepvueInsight;
  
  panNumber?: string;
  aadharNumber?: string;
}

export interface GradeRule {
  id: string;
  label: string;
  color: string;
  priority: number;
  
  minBalance: number;       
  daysSincePayment: number; 
  daysSinceContact: number; 
  
  antiSpamThreshold: number; 
  antiSpamUnit: 'hours' | 'days'; 

  whatsapp: boolean;
  sms: boolean;
  templateId: string; 
  whatsappTemplateId?: string; 
  smsTemplateId?: string;      
  frequencyDays: number;
}

export interface CustomerGroup {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface Template {
  id: string;
  name: string;
  label?: string; 
  context?: string; 
  channel: 'whatsapp' | 'sms';
  content: string;
  variables: string[];
  status: 'active' | 'draft' | 'pending_dlt' | 'pending_meta' | 'rejected' | 'APPROVED' | 'REJECTED' | 'PENDING' | 'PAUSED';
  category?: string;
  provider?: string;
  
  dltTemplateId?: string; 
  senderId?: string;      
  msg91Route?: 'transactional' | 'promotional';

  waHeader?: { type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'NONE'; content?: string };
  waFooter?: string;
  waButtons?: { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; value?: string }[];
  language?: string;
}

export interface CommunicationLog {
  id: string;
  customerId: string;
  type: 'sms' | 'whatsapp' | 'call' | 'visit';
  content: string;
  timestamp: string;
  status: string;
  duration?: number;
  outcome?: string;
}

export interface AiStrategy {
  riskScore: number;
  riskLevel: string;
  analysis: string;
  recommendedAction: string;
  drafts: { tone: string; text: string }[];
}

export interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password';
  value: string;
  placeholder?: string;
}

export interface IntegrationNode {
  id: string;
  name: string;
  category: string;
  status: 'online' | 'offline' | 'processing' | 'idle';
  latency: string;
  description: string;
  fields: IntegrationField[];
}

export interface BuildMemory {
  buildId: string;
  version: string;
  primaryColor: string;
  navigationTree: string[];
  mandatoryModules: string[];
  coreDesignElements: string[];
  lastUpdate: string;
  serverNode: string;
}

export type View = 'dashboard' | 'customers' | 'transactions' | 'communication' | 'payment-logs' | 'whatsapp-config' | 'whatsapp-chat' | 'grades' | 'template-architect' | 'view-customer' | 'integrations' | 'call-logs' | 'brain' | 'whatsapp-logs' | 'cortex-architect';
