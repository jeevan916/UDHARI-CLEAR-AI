
import { Customer, CustomerGrade, Template, GradeRule, CommunicationLog, IntegrationNode } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1', name: 'A P NATHAN', phone: '9022484385', email: 'apnathan@email.com', address: 'Mumbai Central, MH', taxNumber: 'GSTIN99201',
    groupId: 'Retail Client', uniquePaymentCode: 'APN-101', grade: CustomerGrade.B, currentBalance: 18000, currentGoldBalance: 0, lastTxDate: '2025-12-14',
    status: 'overdue', isActive: true, creditLimit: 50000,
    reference: 'Mr. Suresh Gold',
    birthDate: '1985-08-15',
    profilePhoto: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60',
    tags: ['VIP', 'Old Customer', 'High Volume'],
    contactList: [
       { id: 'cnt_1', type: 'mobile', value: '9022484385', label: 'Primary', isPrimary: true, source: 'MANUAL' },
       { id: 'cnt_1b', type: 'mobile', value: '9000011111', label: 'Office', isPrimary: false, source: 'MANUAL' }
    ],
    addressList: [
       { id: 'adr_1', type: 'registered', value: 'Mumbai Central, MH', isPrimary: true, source: 'MANUAL' }
    ],
    paymentLinkStats: { totalOpens: 12, lastOpened: '2025-12-14' }, enabledGateways: { razorpay: true, setu: false },
    lastWhatsappDate: '2025-12-10', lastSmsDate: '2025-11-20', lastCallDate: '2025-12-12',
    transactions: [
      { id: 't1', type: 'debit', unit: 'money', amount: 41200, method: 'rtgs', description: 'Stock Purchase - Lot A', date: '2025-12-14', staffId: 'u1', balanceAfter: 41200, particular: 'Bill #8821' },
      { id: 't2', type: 'credit', unit: 'money', amount: 23200, method: 'cash', description: 'Part Payment Received', date: '2025-12-15', staffId: 'u1', balanceAfter: 18000, particular: 'Receipt #992' },
    ],
    fingerprints: [
      {
        id: 'fp_101',
        timestamp: '2025-12-14T10:30:00',
        eventType: 'LINK_OPEN',
        ipAddress: '49.32.112.55',
        device: { model: 'Samsung S23', os: 'Android 14', browser: 'Chrome Mobile', type: 'mobile' },
        network: { type: '4g', isp: 'Jio Infocomm' },
        location: { lat: 19.0760, lng: 72.8777, city: 'Mumbai', region: 'Maharashtra', country: 'India' }
      }
    ],
    deepvueInsights: {
      kycStatus: 'VERIFIED',
      riskScore: 780,
      creditScore: 750,
      financialPropensity: 'HIGH',
      associatedEntities: ['Nathan Traders Pvt Ltd', 'APN Gold House'],
      gstFilingStatus: 'REGULAR',
      lastRefresh: '2025-12-01',
      panValid: true,
      panNumber: 'ABCDE1234F',
      aadharValid: true,
      aadharNumber: 'XXXX-XXXX-1234',
      verifiedDocuments: [
        {
           id: 'doc_1',
           type: 'PAN',
           documentNumber: 'ABCDE1234F',
           status: 'VALID',
           nameOnDocument: 'A P NATHAN',
           verificationDate: '2025-11-01T10:00:00Z',
           source: 'DEEPVUE_API',
           extractedFields: { 
              entityType: 'Individual',
              aadhaarSeedingStatus: 'LINKED' // PAN Plus v2
           }
        }
      ],
      library: {
         contacts: [
            { 
               type: 'mobile', 
               value: '9022484385', 
               ownerName: 'Self', 
               source: 'GST_REGISTRY', 
               confidenceScore: 100, 
               status: 'Active',
               carrier: 'Jio',
               circle: 'Mumbai',
               dndStatus: false 
            },
            { 
               type: 'mobile', 
               value: '9988112233', 
               ownerName: 'Son', 
               source: 'LINKEDIN', 
               confidenceScore: 75, 
               status: 'Unverified',
               carrier: 'Airtel',
               dndStatus: true 
            }
         ],
         addresses: [
            { type: 'registered', fullAddress: 'Mumbai Central, MH', source: 'GST_REGISTRY', lastVerified: '2025-12-01' }
         ],
         bankAccounts: [
            { bankName: 'HDFC Bank', accountNumber: 'XXXX-8821', ifsc: 'HDFC000123', accountType: 'CURRENT', source: 'PENNY_DROP' },
            { bankName: 'SBI', accountNumber: 'XXXX-1122', ifsc: 'SBIN0000111', accountType: 'UPI_LINKED', source: 'MOBILE_TO_UPI', upiId: '9022484385@oksbi' }
         ],
         loans: [
            { lender: 'Muthoot', type: 'GOLD', amount: 500000, outstanding: 200000, status: 'ACTIVE', disbursalDate: '2024-01-01' },
            { lender: 'Bajaj Finance', type: 'CC', amount: 100000, outstanding: 95000, status: 'ACTIVE', disbursalDate: '2024-05-20' }
         ]
      }
    }
  },
  {
    id: 'c2', name: 'MAHESH JEWELLERS', phone: '9820012345', email: 'mahesh@gold.com', address: 'Zaveri Bazaar, Mumbai', taxNumber: 'GSTIN88102',
    groupId: 'Wholesale Group', uniquePaymentCode: 'MAH-202', grade: CustomerGrade.A, currentBalance: 450000, currentGoldBalance: 25.500, lastTxDate: '2025-12-20',
    status: 'active', isActive: true, creditLimit: 1000000,
    reference: 'Self Walk-in',
    birthDate: '1990-01-01',
    tags: ['Wholesaler', 'Prompt Payer'],
    contactList: [
       { id: 'cnt_2', type: 'mobile', value: '9820012345', label: 'Primary', isPrimary: true, source: 'MANUAL' }
    ],
    addressList: [
       { id: 'adr_2', type: 'office', value: 'Zaveri Bazaar, Mumbai', isPrimary: true, source: 'MANUAL' }
    ],
    paymentLinkStats: { totalOpens: 2, lastOpened: '2025-12-21' }, enabledGateways: { razorpay: true, setu: true },
    lastWhatsappDate: '2025-12-21', lastSmsDate: null as any, lastCallDate: '2025-12-15',
    transactions: [
       { id: 't_g1', type: 'debit', unit: 'gold', amount: 50.000, method: 'gold_bar', description: 'Fine Gold 999 Bar Issue', date: '2025-12-10', staffId: 'u1', balanceAfter: 50.000, particular: 'Vault Issue' },
       { id: 't_g2', type: 'credit', unit: 'gold', amount: 24.500, method: 'ornament', description: 'Scrap Gold Return', date: '2025-12-12', staffId: 'u1', balanceAfter: 25.500, particular: 'Melting Report #44' }
    ],
    fingerprints: [
      {
        id: 'fp_201',
        timestamp: '2025-12-21T14:15:00',
        eventType: 'LINK_OPEN',
        ipAddress: '103.21.44.12',
        device: { model: 'iPhone 15 Pro', os: 'iOS 17', browser: 'Safari', type: 'mobile' },
        network: { type: '5g', isp: 'Airtel' },
        location: { lat: 18.9220, lng: 72.8347, city: 'Mumbai', region: 'Maharashtra', country: 'India' }
      }
    ]
  }
];

export const INITIAL_TEMPLATES: Template[] = [
  { 
    id: 'TPL_001', 
    name: 'credit_flow_gentle_reminder_v1', 
    label: 'Soft Payment Nudge',
    context: 'Early Stage (Grade B)',
    channel: 'whatsapp', 
    category: 'UTILITY',
    content: "Hello {{1}}, a gentle reminder that an amount of ₹{{2}} is pending.", 
    variables: ['customer_name', 'balance', 'payment_link'],
    status: 'active',
    waHeader: { type: 'IMAGE', content: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=600&q=80' },
    waFooter: 'ArrearsFlow Secure Payments',
    waButtons: [
      { type: 'URL', text: 'Pay Securely', value: '{{3}}' },
      { type: 'QUICK_REPLY', text: 'Call Me Back' }
    ]
  },
  { 
    id: 'TPL_HELLO', 
    name: 'hello_world', 
    label: 'Meta Connectivity Test',
    context: 'System Diagnostics',
    channel: 'whatsapp', 
    category: 'UTILITY',
    content: "Hello world", 
    variables: [],
    status: 'active',
    waHeader: { type: 'NONE' },
    waButtons: []
  },
  { 
    id: 'TPL_002', 
    name: 'Urgent Dues Alert', 
    label: 'SMS Critical Alert',
    context: 'Offline / DND Customers',
    channel: 'sms', 
    category: 'TRANSACTIONAL',
    content: "URGENT: Your account is overdue by {#var#}. Pay immediately via {#var#} to avoid suspension. - AURAGD", 
    variables: ['balance', 'payment_link'],
    status: 'active',
    dltTemplateId: '10074492888192833',
    senderId: 'AURAGD',
    msg91Route: 'transactional'
  },
  { 
    id: 'TPL_003', 
    name: 'credit_flow_legal_warning_final', 
    label: 'Pre-Legal Notice',
    context: 'Critical NPA (Grade D)',
    channel: 'whatsapp', 
    category: 'UTILITY',
    content: "NOTICE: Despite multiple reminders, your balance of ₹{{1}} remains unpaid. This is a final notice before legal action.", 
    variables: ['balance'],
    status: 'draft',
    waHeader: { type: 'TEXT', content: 'FINAL NOTICE' },
    waFooter: 'Legal Department',
    waButtons: [
       { type: 'PHONE_NUMBER', text: 'Contact Legal', value: '+919999999999' }
    ]
  },
  { 
    id: 'TPL_004', 
    name: 'Payment Acknowledgement', 
    label: 'Receipt Confirmation',
    context: 'Post-Transaction',
    channel: 'sms', 
    category: 'TRANSACTIONAL',
    content: "Dear Customer, we have received {#var#}. Your ledger is updated. - AURAGD", 
    variables: ['balance'],
    status: 'active',
    dltTemplateId: '10072238477123882',
    senderId: 'AURAGD',
    msg91Route: 'transactional'
  }
];

export const INITIAL_GRADE_RULES: GradeRule[] = [
   { 
      id: 'D', 
      label: 'Critical / NPA', 
      color: 'rose', 
      priority: 1, 
      minBalance: 50000, 
      daysSincePayment: 90, 
      daysSinceContact: 15,
      antiSpamThreshold: 48,
      antiSpamUnit: 'hours', // 48 Hours Cooldown
      whatsapp: true, sms: true, templateId: 'TPL_003', whatsappTemplateId: 'TPL_003', smsTemplateId: 'TPL_002', frequencyDays: 2 
   },
   { 
      id: 'C', 
      label: 'High Risk', 
      color: 'amber', 
      priority: 2, 
      minBalance: 20000, 
      daysSincePayment: 45, 
      daysSinceContact: 7,
      antiSpamThreshold: 3,
      antiSpamUnit: 'days',
      whatsapp: true, sms: true, templateId: 'TPL_002', whatsappTemplateId: 'TPL_001', smsTemplateId: 'TPL_002', frequencyDays: 3 
   },
   { 
      id: 'B', 
      label: 'Moderate Watch', 
      color: 'blue', 
      priority: 3, 
      minBalance: 5000, 
      daysSincePayment: 15, 
      daysSinceContact: 30,
      antiSpamThreshold: 7,
      antiSpamUnit: 'days',
      whatsapp: true, sms: false, templateId: 'TPL_001', whatsappTemplateId: 'TPL_001', frequencyDays: 7 
   },
   { 
      id: 'A', 
      label: 'Standard / Safe', 
      color: 'emerald', 
      priority: 4, 
      minBalance: 0, 
      daysSincePayment: 0, 
      daysSinceContact: 0,
      antiSpamThreshold: 15,
      antiSpamUnit: 'days',
      whatsapp: true, sms: false, templateId: 'TPL_001', whatsappTemplateId: 'TPL_001', frequencyDays: 30 
   }
];

export const INITIAL_CALL_LOGS: CommunicationLog[] = [
  {
    id: 'cl_1',
    customerId: 'c1',
    type: 'call',
    content: 'Promised to pay by next Monday. Discussed invoice #8821.',
    timestamp: '2025-12-12T14:30:00',
    status: 'completed',
    duration: 120, // seconds
    outcome: 'Connected'
  },
  {
    id: 'cl_2',
    customerId: 'c2',
    type: 'call',
    content: 'No answer. Left voicemail regarding outstanding balance.',
    timestamp: '2025-12-15T10:15:00',
    status: 'no_answer',
    duration: 0,
    outcome: 'No Answer'
  }
];

export const INITIAL_WHATSAPP_LOGS: CommunicationLog[] = [
  {
    id: 'wa_1',
    customerId: 'c1',
    type: 'whatsapp',
    content: 'Hello A P NATHAN, a gentle reminder that an amount of ₹18,000 is pending.',
    timestamp: '2025-12-10T09:30:00',
    status: 'read',
    outcome: 'Delivered'
  },
  {
    id: 'wa_2',
    customerId: 'c1',
    type: 'whatsapp',
    content: 'Can I pay via UPI?',
    timestamp: '2025-12-10T09:35:00',
    status: 'received',
    outcome: 'Received'
  },
  {
    id: 'wa_3',
    customerId: 'c2',
    type: 'whatsapp',
    content: 'Your order #8821 has been dispatched.',
    timestamp: '2025-12-21T14:00:00',
    status: 'delivered',
    outcome: 'Delivered'
  },
  {
     id: 'wa_4',
     customerId: 'c2',
     type: 'whatsapp',
     content: 'Thank you for the update.',
     timestamp: '2025-12-21T14:10:00',
     status: 'received',
     outcome: 'Received'
  }
];

export const INITIAL_INTEGRATIONS: IntegrationNode[] = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'Payment Gateway',
    status: 'online',
    latency: '24ms',
    description: 'Processes credit cards, netbanking, and wallets with automated reconciliation.',
    fields: [
      { key: 'key_id', label: 'Key ID', type: 'text', value: '', placeholder: 'rzp_live_...' },
      { key: 'key_secret', label: 'Key Secret', type: 'password', value: '', placeholder: '••••••••' }
    ]
  },
  {
    id: 'setu',
    name: 'Setu UPI',
    category: 'DeepLink Fabric',
    status: 'online',
    latency: '41ms',
    description: 'Enables generation of dynamic UPI intent links and fast direct settlement.',
    fields: [
      { key: 'scheme_id', label: 'Scheme ID', type: 'text', value: '', placeholder: 'SCH_...' },
      { key: 'client_id', label: 'Client ID', type: 'text', value: '', placeholder: 'UUID' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', value: '', placeholder: '••••••••' }
    ]
  },
  {
    id: 'msg91',
    name: 'Msg91',
    category: 'SMS Transport',
    status: 'idle',
    latency: '110ms',
    description: 'Enterprise SMS gateway for OTPs and transactional notifications.',
    fields: [
      { key: 'auth_key', label: 'Auth Key', type: 'password', value: '', placeholder: '••••••••' },
      { key: 'sender_id', label: 'Sender ID', type: 'text', value: '', placeholder: 'ARFLOW' },
      { key: 'dlt_te_id', label: 'DLT TE ID', type: 'text', value: '', placeholder: '1702...' }
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini AI',
    category: 'Intelligence Kernel',
    status: 'processing',
    latency: '890ms',
    description: 'Google DeepMind models for risk profiling and natural language drafting.',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', value: '', placeholder: 'AIza...' },
      { key: 'project_id', label: 'Project ID', type: 'text', value: '', placeholder: 'Optional' }
    ]
  },
  {
    id: 'deepvue',
    name: 'Deepvue',
    category: 'KYC & Intelligence',
    status: 'online',
    latency: '65ms',
    description: 'Provides advanced KYC verification, GST analysis, and credit risk signals.',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', value: '', placeholder: 'dv_client_...' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', value: '', placeholder: '••••••••' },
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', value: '', placeholder: 'https://.../callback' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', value: '', placeholder: 'whsec_...' }
    ]
  },
  {
    id: 'lotuspay',
    name: 'LotusPay',
    category: 'eNACH Mandates',
    status: 'idle',
    latency: '140ms',
    description: 'Automates recurring collections via NACH and eNACH mandates.',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', value: '', placeholder: 'Bearer ...' }
    ]
  }
];
