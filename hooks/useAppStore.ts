import { useState, useMemo, useEffect, useCallback } from 'react';
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

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 60));
  }, []);

  // --- VAULT INITIALIZATION & RESILIENCE ---
  const initializeData = useCallback(async () => {
    if (!user) return;
    
    setDbStatus('RECONNECTING');
    addLog(`INIT: Handshake requested by ${user.name}`);
    
    try {
      const [custRes, ruleRes, logsRes] = await Promise.all([
        axios.get('/api/customers').catch(err => err.response),
        axios.get('/api/grade-rules').catch(err => err.response),
        getLiveLogs()
      ]);

      if (custRes?.status === 200) {
        setCustomers(custRes.data);
        setDbStatus('CONNECTED');
        addLog("VAULT: Database clusters synchronized.");
      } else {
        setCustomers(INITIAL_CUSTOMERS);
        setDbStatus('DISCONNECTED');
        addLog("VAULT_FAIL: Database unreachable (503). Using Local cache.");
      }

      if (ruleRes?.status === 200) {
        setGradeRules(ruleRes.data);
      } else {
        setGradeRules(INITIAL_GRADE_RULES);
      }

      setSystemLogs(prev => [...logsRes, ...prev]);
    } catch (e: any) {
      console.error("Critical Node Failure:", e);
      setDbStatus('DISCONNECTED');
      setCustomers(INITIAL_CUSTOMERS);
      setGradeRules(INITIAL_GRADE_RULES);
      addLog("NODE_OFFLINE: Remote logic clusters timed out.");
    }
  }, [user, addLog]);

  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user, initializeData]);

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
       addLog(`STAGING: Pushing Ledger mutation ${newTx.id}...`);
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
       addLog(`COMMIT_OK: Ref ${newTx.id} persisted to vault.`);
       setIsEntryModalOpen(false);
    } catch (e) {
       addLog("REJECTED: MySQL node rejected the commit payload.");
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
       addLog(`ONBOARDING: Transmitting identity ${newCustomer.uniquePaymentCode}...`);
       await axios.post('/api/customers', newCustomer);
       setCustomers(prev => [...prev, newCustomer]);
       addLog(`SYNC_OK: ${newCustomer.name} committed to vault.`);
    } catch (e) {
       addLog("REJECTED: Onboarding protocol failed.");
    }
  };

  const updateCustomerDeepvueData = (customerId: string, data: Partial<DeepvueInsight>) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, deepvueInsights: { ...(c.deepvueInsights || {}), ...data } as DeepvueInsight } : c
    ));
    addLog(`INTEL_UPDATE: Forensic trace updated for ${customerId}.`);
  };

  const setPrimaryContact = (customerId: string, value: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const updatedContacts = (c.contactList || []).map(cnt => ({ ...cnt, isPrimary: cnt.value === value }));
        return { ...c, phone: value, contactList: updatedContacts };
      }
      return c;
    }));
    addLog(`IDENTITY_FIX: Primary phone updated.`);
  };

  const updateIntegrationConfig = (nodeId: string, fields: IntegrationField[]) => {
    setIntegrations(prev => prev.map(node => node.id === nodeId ? { ...node, fields } : node));
    addLog(`INFRA_UPDATE: Node ${nodeId} credentials updated.`);
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
      handleCommitEntry, addCustomer, initializeData,
      navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      resetCustomerView: () => { setSelectedId(null); setActiveView('customers'); setAiStrategy(null); },
      handleAiInquiry: async () => {
        if (!activeCustomer) return;
        setIsAiLoading(true);
        addLog(`CORTEX: Requesting deep strategy for ${activeCustomer.uniquePaymentCode}...`);
        const strategy = await generateEnterpriseStrategy(activeCustomer, callLogs);
        setAiStrategy(strategy);
        setIsAiLoading(false);
        addLog(`CORTEX_REASON: Analysis received.`);
      },
      handleDeleteTransaction: (txId: string) => {
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, transactions: c.transactions.filter(t => t.id !== txId) } : c));
        addLog(`CLEANUP: Record ${txId} purged from memory.`);
      },
      openEditModal: (tx: Transaction) => { setEditingTransaction(tx); setIsEntryModalOpen(true); },
      enrichCustomerData: async () => {
        if (!activeCustomer) return;
        setIsAiLoading(true);
        addLog(`FORENSIC: Pinging Deepvue node for ${activeCustomer.phone}...`);
        setIsAiLoading(false);
      },
      handleAddCallLog: (log: CommunicationLog) => {
        setCallLogs(prev => [log, ...prev]);
        addLog(`VOICE_PROTOCOL: Interaction committed.`);
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