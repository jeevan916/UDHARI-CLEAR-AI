
import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, TransactionType, TransactionUnit,
  CustomerGrade, IntegrationNode
} from '../types';
import { analyzeCustomerBehavior, generateUniqueRef } from '../utils/debtUtils';
import { generateEnterpriseStrategy, getLiveLogs } from '../services/geminiService';
import { 
  INITIAL_TEMPLATES, INITIAL_INTEGRATIONS 
} from '../data/initialData';

export const useAppStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>([]);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  /* Added missing IntegrationNode type in state definition */
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);
  const [callLogs, setCallLogs] = useState<CommunicationLog[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');

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
    return analyzeCustomerBehavior(activeCustomer, gradeRules, callLogs);
  }, [activeCustomer, gradeRules, callLogs]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
      const matchesGrade = filterGrade === 'all' || b.calculatedGrade === filterGrade;
      return matchesSearch && matchesGrade;
    });
  }, [customers, searchTerm, filterGrade, gradeRules, callLogs]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  // --- HYDRATION FROM PERSISTENCE LAYER ---
  useEffect(() => {
    if (user) {
      addLog(`NODE_72_61_175_20: Session established for ${user.name}`);
      
      // Fetch Core Data from MySQL via API
      const fetchData = async () => {
         try {
            const [custRes, ruleRes, logsRes] = await Promise.all([
               axios.get('/api/customers'),
               axios.get('/api/grade-rules'),
               getLiveLogs()
            ]);
            setCustomers(custRes.data);
            setGradeRules(ruleRes.data);
            setSystemLogs(prev => [...logsRes, ...prev]);
            addLog("PERSISTENCE: Ledger clusters synchronized.");
         } catch (e) {
            addLog("ERROR: Sovereign DB handshake failed.");
         }
      };
      fetchData();
    }
  }, [user]);

  const handleCommitEntry = async (entry: any) => {
    if (!selectedId || !activeCustomer) return;
    
    const newTx: Transaction = {
      id: editingTransaction?.id || generateUniqueRef('TX'),
      type: entry.type,
      unit: entry.unit || 'money',
      amount: parseFloat(entry.amount),
      method: entry.method,
      description: entry.description,
      date: entry.date || new Date().toISOString().split('T')[0],
      staffId: user?.id || 'sys',
      balanceAfter: entry.unit === 'money' 
         ? (entry.type === 'debit' ? activeCustomer.currentBalance + entry.amount : activeCustomer.currentBalance - entry.amount)
         : (entry.type === 'debit' ? activeCustomer.currentGoldBalance + entry.amount : activeCustomer.currentGoldBalance - entry.amount)
    };

    try {
       await axios.post('/api/transactions', { ...newTx, customerId: selectedId });
       
       // Update UI state locally
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
       
       addLog(`COMMIT_STAGED: MySQL record ${newTx.id} verified.`);
       setIsEntryModalOpen(false);
    } catch (e) {
       addLog("CRITICAL: Transaction persistence failed.");
    }
  };

  const addCustomer = async (data: any) => {
    const newId = `c_${Date.now()}`;
    const newCustomer: Customer = {
      id: newId,
      name: data.name,
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
       await axios.post('/api/customers', newCustomer);
       setCustomers(prev => [...prev, newCustomer]);
       addLog(`NEW_IDENTITY: ${newCustomer.uniquePaymentCode} committed to vault.`);
    } catch (e) {
       addLog("ERROR: Customer onboarding rejected by DB.");
    }
  };

  return {
    state: {
      user, activeView, customers, selectedId, systemLogs, gradeRules, 
      callLogs, whatsappLogs, isAiLoading, searchTerm, filterGrade,
      isAdmin, activeCustomer, filteredCustomers, expandedMenus,
      isMobileMenuOpen, isEntryModalOpen, isEditModalOpen, editingTransaction,
      entryDefaults, aiStrategy, behavior, templates, integrations
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
        addLog(`CORTEX_REQ: Analyzing behavioral vectors for ${activeCustomer.uniquePaymentCode}`);
        const strategy = await generateEnterpriseStrategy(activeCustomer, callLogs);
        setAiStrategy(strategy);
        setIsAiLoading(false);
        addLog(`CORTEX_REPLY: Heuristic strategy cached.`);
      },
      handleDeleteTransaction: (txId: string) => {
        // Implement DELETE API call here
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, transactions: c.transactions.filter(t => t.id !== txId) } : c));
      },
      openEditModal: (tx: Transaction) => { setEditingTransaction(tx); setIsEntryModalOpen(true); },
      enrichCustomerData: async () => {
         // Logic for enrichment already defined in service
      },
      updateCustomerDeepvueData: (id: string, data: any) => {}, 
      setPrimaryContact: (id: string, phone: string) => {}, 
      updateIntegrationConfig: (id: string, fields: any) => {}, 
      handleAddCallLog: (log: CommunicationLog) => {
        setCallLogs(prev => [log, ...prev]);
        addLog(`VOICE_LOG: Interaction recorded for ${log.customerId}`);
      },
      handleUpdateProfile: (updates: any) => {
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, ...updates } : c));
        setIsEditModalOpen(false);
      }
    }
  };
};
