
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
  metadata?: any;
}

export interface VerifiedDocument {
  id: string;
  type: 'PAN' | 'AADHAR' | 'GSTIN' | 'UDYAM';
  documentNumber: string;
  status: 'VALID' | 'INVALID' | 'PENDING';
  nameOnDocument: string;
  verificationDate: string;
  source?: string;
  extractedFields?: any;
  rawResponse?: any;
}

// Added Deepvue related types
export interface DiscoveredContact {
  value: string;
  type: string;
  ownerName: string;
  source: string;
  carrier?: string;
  circle?: string;
  dndStatus?: boolean;
  confidenceScore?: number;
  status?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  source: string;
  upiId?: string;
}

export interface LoanDetails {
  lender: string;
  type: string;
  amount: number;
  outstanding: number;
  status: string;
  disbursalDate: string;
}

export interface RcDetails {
  rcNumber: string;
  ownerName: string;
  vehicleClass: string;
  fuelType: string;
  model: string;
  insuranceValidUntil: string;
  registrationDate: string;
}

export interface DlDetails {
  dlNumber: string;
  name: string;
  dob: string;
  expiry: string;
}

export interface UanDetails {
  uanNumber: string;
  employerName: string;
  memberId: string;
  exitDate?: string;
}

export interface CreditEnquiry {
  enquiryDate: string;
  purpose: string;
  institution: string;
  amount: number;
}

export interface DeepvueLibrary {
  contacts: DiscoveredContact[];
  addresses: Array<{ fullAddress: string; type: string; source: string; lastVerified: string }>;
  bankAccounts: BankAccount[];
  loans: LoanDetails[];
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
  lastRefresh: string;
  verifiedDocuments: VerifiedDocument[];
  library: DeepvueLibrary;
  panValid: boolean;
  aadharValid: boolean;
  associatedEntities: string[];
  gstFilingStatus: string;
}

// Added Profile types
export interface ProfileContact {
  id: string;
  type: string;
  value: string;
  isPrimary: boolean;
  source: string;
  label?: string;
}

export interface ProfileAddress {
  id: string;
  type: string;
  value: string;
  isPrimary: boolean;
  source: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  groupId: string;
  creditLimit?: number;
  isActive: boolean;
  tags?: string[];
  uniquePaymentCode: string;
  currentBalance: number; 
  currentGoldBalance: number;
  lastTxDate: string;
  transactions: Transaction[];
  enabledGateways: {
    razorpay: boolean;
    setu: boolean;
  };
  fingerprints: DigitalFingerprint[];
  deepvueInsights?: DeepvueInsight;
  lastCallDate?: string;
  lastWhatsappDate?: string;
  lastSmsDate?: string;
  grade: CustomerGrade;
  status?: string;
  reference?: string;
  birthDate?: string;
  profilePhoto?: string;
  contactList?: ProfileContact[];
  addressList?: ProfileAddress[];
  paymentLinkStats?: { totalOpens: number, lastOpened: string };
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
  whatsappTemplateId?: string; 
  smsTemplateId?: string;      
  frequencyDays?: number;
}

export interface Template {
  id: string;
  name: string;
  channel: 'whatsapp' | 'sms';
  content: string;
  status: 'active' | 'draft' | 'APPROVED' | 'PENDING' | 'REJECTED';
  category: string;
  language?: string;
  waHeader?: { type: 'TEXT' | 'IMAGE' | 'NONE'; content?: string };
  waFooter?: string;
  waButtons?: Array<{ type: string; text: string; value?: string }>;
  dltTemplateId?: string;
  senderId?: string;
  label?: string;
  context?: string;
  variables?: string[];
  msg91Route?: string;
}

// Added Integration types
export interface IntegrationField {
  key: string;
  label: string;
  type: string;
  value: string;
  placeholder?: string;
}

export interface IntegrationNode {
  id: string;
  name: string;
  category: string;
  status: 'online' | 'offline' | 'idle' | 'processing';
  latency: string;
  description: string;
  fields: IntegrationField[];
}

export interface CommunicationLog {
  id: string;
  customerId: string;
  type: 'sms' | 'whatsapp' | 'call';
  content: string;
  timestamp: string;
  status: string;
  outcome?: string;
  duration?: number;
}

export interface AiStrategy {
  riskScore: number;
  riskLevel: string;
  analysis: string;
  recommendedAction: string;
  drafts?: Array<{ tone: string; text: string }>;
  next_step?: string;
}

export type View = 'dashboard' | 'customers' | 'transactions' | 'communication' | 'grades' | 'view-customer' | 'integrations' | 'brain' | 'cortex-architect' | 'whatsapp-config' | 'whatsapp-chat' | 'whatsapp-logs' | 'payment-logs' | 'template-architect' | 'call-logs' | 'audit-log';
