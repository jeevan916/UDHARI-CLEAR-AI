import { useState, useMemo, useEffect } from 'react';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, TransactionType, TransactionUnit,
  DeepvueInsight, IntegrationNode, IntegrationField, CustomerGrade
} from '../types';
import { analyzeCustomerBehavior, generateUniqueRef } from '../utils/debtUtils';
import { generateEnterpriseStrategy, getLiveLogs } from '../services/geminiService';
import { deepvueService } from '../services/deepvueService';
import { 
  INITIAL_CUSTOMERS, INITIAL_TEMPLATES, INITIAL_GRADE_RULES, 
  INITIAL_CALL_LOGS, INITIAL_INTEGRATIONS, INITIAL_WHATSAPP_LOGS 
} from '../data/initialData';

export const useAppStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>(INITIAL_GRADE_RULES);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);
  const [callLogs, setCallLogs] = useState<CommunicationLog[]>(INITIAL_CALL_LOGS);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>(INITIAL_WHATSAPP_LOGS);
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

  useEffect(() => {
    if (user) {
      addLog(`NODE_72_61_175_20: Session established for ${user.name}`);
      getLiveLogs().then(logs => setSystemLogs(prev => [...logs, ...prev]));
    }
  }, [user]);

  const handleCommitEntry = (entry: any) => {
    if (!selectedId) return;
    
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        const newTx: Transaction = {
          id: editingTransaction?.id || generateUniqueRef('TX'),
          type: entry.type,
          unit: entry.unit || 'money',
          amount: parseFloat(entry.amount),
          method: entry.method,
          description: entry.description,
          date: entry.date || new Date().toISOString().split('T')[0],
          staffId: user?.id || 'sys',
          balanceAfter: 0
        };

        const otherTxs = editingTransaction ? c.transactions.filter(t => t.id !== editingTransaction.id) : c.transactions;
        const updatedTxs = [...otherTxs, newTx].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let bal = 0; let gold = 0;
        const final = updatedTxs.map(t => {
           if (t.unit === 'money') bal = t.type === 'debit' ? bal + t.amount : bal - t.amount;
           else gold = t.type === 'debit' ? gold + t.amount : gold - t.amount;
           return { ...t, balanceAfter: t.unit === 'money' ? bal : gold };
        });

        return { ...c, transactions: final, currentBalance: bal, currentGoldBalance: gold };
      }
      return c;
    }));

    addLog(`COMMIT_STAGED: Ledger mutation processed for node ${selectedId}`);
    setIsEntryModalOpen(false);
  };

  const addCustomer = (data: any) => {
    const newCustomer: Customer = {
      id: `c_${Date.now()}`,
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
    setCustomers(prev => [...prev, newCustomer]);
    addLog(`NEW_IDENTITY: ${newCustomer.uniquePaymentCode} onboarded.`);
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
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, transactions: c.transactions.filter(t => t.id !== txId) } : c));
      },
      openEditModal: (tx: Transaction) => { setEditingTransaction(tx); setIsEntryModalOpen(true); },
      enrichCustomerData: async () => {
        if (!activeCustomer) return;
        setIsAiLoading(true);
        addLog(`DEEPVUE_TRACE: Pinging forensic APIs for ${activeCustomer.phone}`);
        const insights = await deepvueService.fetchInsights(activeCustomer.phone, activeCustomer.taxNumber || '');
        setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, deepvueInsights: insights } : c));
        setIsAiLoading(false);
        addLog(`DEEPVUE_REPLY: Discovered documents linked.`);
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