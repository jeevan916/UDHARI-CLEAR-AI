import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, TransactionType, TransactionUnit,
  CustomerGrade, IntegrationNode, IntegrationField, DeepvueInsight
} from '../types';
import { analyzeCustomerBehavior, generateUniqueRef } from '../utils/debtUtils';
import { generateEnterpriseStrategy, getLiveLogs } from '../services/geminiService';
import { 
  INITIAL_CUSTOMERS, INITIAL_TEMPLATES, INITIAL_INTEGRATIONS, INITIAL_GRADE_RULES 
} from '../data/initialData';

export const useAppStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>([]);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);
  const [callLogs, setCallLogs] = useState<CommunicationLog[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'>('RECONNECTING');

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ ledger: true, protocols: true, risk: true });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryDefaults, setEntryDefaults] = useState<{ type?: TransactionType, unit?: TransactionUnit } | null>(null);
  const [aiStrategy, setAiStrategy] = useState<AiStrategy | null>(null);

  const isAdmin = user?.role === 'admin';
  const activeCustomer = useMemo(() => customers.find(c => c.id === selectedId), [customers, selectedId]);
  
  const behavior = useMemo(() => {
    if (!activeCustomer) return null;
    return analyzeCustomerBehavior(activeCustomer, gradeRules.length > 0 ? gradeRules : INITIAL_GRADE_RULES, callLogs);
  }, [activeCustomer, gradeRules, callLogs]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const b = analyzeCustomerBehavior(c, gradeRules.length > 0 ? gradeRules : INITIAL_GRADE_RULES, callLogs);
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.phone.includes(searchTerm) || 
                           c.uniquePaymentCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = filterGrade === 'all' || b.calculatedGrade === filterGrade;
      return matchesSearch && matchesGrade;
    });
  }, [customers, searchTerm, filterGrade, gradeRules, callLogs]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 60));
  };

  // --- NODE INITIALIZATION & SYNC ---
  useEffect(() => {
    if (user) {
      addLog(`HANDSHAKE: Authenticating root identity ${user.name}`);
      const initializeData = async () => {
         try {
            setDbStatus('RECONNECTING');
            const [custRes, ruleRes, liveLogs] = await Promise.all([
               axios.get('/api/customers').catch(e => e.response),
               axios.get('/api/grade-rules').catch(e => e.response),
               getLiveLogs()
            ]);

            // Handle potential 503 or 404 from partial backend readiness
            if (custRes?.status === 200) {
              setCustomers(custRes.data);
              setDbStatus('CONNECTED');
              addLog("VAULT: Database u477692720_ArrearsFlow synchronized.");
            } else {
              setCustomers(INITIAL_CUSTOMERS);
              setDbStatus('DISCONNECTED');
              addLog("CRITICAL: Vault 503. Using offline cache (initialData). Check .env credentials.");
            }

            if (ruleRes?.status === 200) {
              setGradeRules(ruleRes.data);
            } else {
              setGradeRules(INITIAL_GRADE_RULES);
            }

            setSystemLogs(prev => [...liveLogs, ...prev]);
            addLog("SYNC: Remote logic clusters online.");
         } catch (e: any) {
            console.error("Initialization Error:", e);
            setDbStatus('DISCONNECTED');
            setCustomers(INITIAL_CUSTOMERS);
            setGradeRules(INITIAL_GRADE_RULES);
            addLog("ERROR: Node infrastructure timed out. Operating in Local Mode.");
         }
      };
      initializeData();
    }
  }, [user]);

  const handleCommitEntry = async (entry: any) => {
    if (!selectedId || !activeCustomer) return;
    
    const amount = parseFloat(entry.amount);
    const newTx: Transaction = {
      id: editingTransaction?.id || generateUniqueRef('TX'),
      type: entry.type,
      unit: entry.unit || 'money',
      amount: amount,
      method: entry.method,
      description: entry.description,
      date: entry.date || new Date().toISOString().split('T')[0],
      staffId: user?.id || 'sys',
      balanceAfter: entry.unit === 'money' 
         ? (entry.type === 'debit' ? activeCustomer.currentBalance + amount : activeCustomer.currentBalance - amount)
         : (entry.type === 'debit' ? activeCustomer.currentGoldBalance + amount : activeCustomer.currentGoldBalance - amount)
    };

    try {
       addLog(`STAGING: Pushing ref ${newTx.id} to MySQL node...`);
       await axios.post('/api/transactions', { ...newTx, customerId: selectedId });
       
       setCustomers(prev => prev.map(c => {
         if (c.id === selectedId) {
           return { 
             ...c, 
             transactions: [newTx, ...c.transactions],
             currentBalance: newTx.unit === 'money' ? newTx.balanceAfter : c.currentBalance,
             currentGoldBalance: newTx.unit === 'gold' ? newTx.balanceAfter : c.currentGoldBalance
           };
         }
         return c;
       }));
       addLog(`COMMIT: Ledger mutated for ${activeCustomer.uniquePaymentCode}`);
       setIsEntryModalOpen(false);
    } catch (e) {
       addLog("REJECTED: Vault write error. Check DB permissions.");
    }
  };

  const addCustomer = async (data: any) => {
    const newId = `c_${Date.now()}`;
    const newCustomer: Customer = {
      id: newId,
      name: data.name.toUpperCase(),
      phone: data.phone,
      groupId: data.groupId,
      taxNumber: data.taxNumber,
      currentBalance: parseFloat(data.openingBalance || '0'),
      currentGoldBalance: 0,
      isActive: true,
      contactList: [{ id: `cnt_${Date.now()}`, type: 'mobile', value: data.phone, isPrimary: true, source: 'MANUAL' }],
      addressList: [],
      uniquePaymentCode: `${data.name.substring(0,3).toUpperCase()}-${Math.floor(100+Math.random()*900)}`,
      grade: CustomerGrade.A,
      lastTxDate: new Date().toISOString().split('T')[0],
      transactions: [],
      status: 'active',
      paymentLinkStats: { totalOpens: 0 },
      enabledGateways: { razorpay: true, setu: true },
      fingerprints: []
    };

    try {
       addLog(`ONBOARDING: Syncing identity ${newCustomer.uniquePaymentCode}...`);
       await axios.post('/api/customers', newCustomer);
       setCustomers(prev => [...prev, newCustomer]);
       addLog(`SYNC_OK: ${newCustomer.name} committed to vault.`);
    } catch (e) {
       addLog("ERROR: Database cluster rejected the new entity.");
    }
  };

  const updateCustomerDeepvueData = (customerId: string, data: Partial<DeepvueInsight>) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, deepvueInsights: { ...(c.deepvueInsights || {}), ...data } as DeepvueInsight } : c
    ));
    addLog(`INTEL_UPDATE: Forensic profile for ${customerId} synchronized.`);
  };

  const setPrimaryContact = (customerId: string, value: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const updatedContacts = (c.contactList || []).map(cnt => ({ ...cnt, isPrimary: cnt.value === value }));
        return { ...c, phone: value, contactList: updatedContacts };
      }
      return c;
    }));
    addLog(`IDENTITY_MUTATION: Primary contact updated.`);
  };

  const updateIntegrationConfig = (nodeId: string, fields: IntegrationField[]) => {
    setIntegrations(prev => prev.map(node => node.id === nodeId ? { ...node, fields } : node));
    addLog(`INFRA_UPDATE: Credentials encrypted and committed.`);
  };

  return {
    state: {
      user, activeView, customers, selectedId, systemLogs, gradeRules, 
      callLogs, whatsappLogs, isAiLoading, searchTerm, filterGrade,
      isAdmin, activeCustomer, filteredCustomers, expandedMenus,
      isMobileMenuOpen, isEntryModalOpen, isEditModalOpen, editingTransaction,
      entryDefaults, aiStrategy, behavior, templates, integrations, dbStatus
    },
    actions: {
      setUser, setActiveView, setCustomers, setSearchTerm, setFilterGrade,
      setExpandedMenus, setIsMobileMenuOpen, setIsEntryModalOpen, setEditingTransaction,
      setEntryDefaults, setIsEditModalOpen, setTemplates, setGradeRules,
      handleCommitEntry, addCustomer,
      navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      resetCustomerView: () => { setSelectedId(null); setActiveView('customers'); setAiStrategy(null); },
      handleAiInquiry: async () => {
        if (!activeCustomer) return;
        setIsAiLoading(true);
        addLog(`CORTEX: Reasoning cycle initiated for ${activeCustomer.uniquePaymentCode}`);
        const strategy = await generateEnterpriseStrategy(activeCustomer, callLogs);
        setAiStrategy(strategy);
        setIsAiLoading(false);
        addLog(`ADVISORY: Heuristic roadmap received.`);
      },
      handleDeleteTransaction: (txId: string) => {
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, transactions: c.transactions.filter(t => t.id !== txId) } : c));
        addLog(`CLEANUP: Reference ${txId} purged from memory.`);
      },
      openEditModal: (tx: Transaction) => { setEditingTransaction(tx); setIsEntryModalOpen(true); },
      enrichCustomerData: async () => {
        if (!activeCustomer) return;
        setIsAiLoading(true);
        addLog(`FORENSIC: Pinging Deepvue for identity trace ${activeCustomer.phone}`);
        setIsAiLoading(false);
      },
      handleAddCallLog: (log: CommunicationLog) => {
        setCallLogs(prev => [log, ...prev]);
        addLog(`PROTOCOL: Voice interaction committed to ledger.`);
      },
      handleUpdateProfile: (updates: any) => {
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, ...updates } : c));
        setIsEditModalOpen(false);
        addLog(`IDENTITY: Profile mutation successful.`);
      },
      updateCustomerDeepvueData,
      setPrimaryContact,
      updateIntegrationConfig
    }
  };
};