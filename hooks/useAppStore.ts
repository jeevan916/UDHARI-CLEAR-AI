
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

  // UI States
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ ledger: true, protocols: true, risk: true });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryDefaults, setEntryDefaults] = useState<{ type?: TransactionType, unit?: TransactionUnit } | null>(null);
  const [aiStrategy, setAiStrategy] = useState<AiStrategy | null>(null);

  // Derived
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

  // Sync Kernel Logs on Mount
  useEffect(() => {
    if (user) {
      addLog(`SESSION_ESTABLISHED: ${user.name} @ 139.59.10.70`);
      getLiveLogs().then(logs => setSystemLogs(prev => [...logs, ...prev]));
    }
  }, [user]);

  // Actions
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

        // Recalculate balances chronologically
        let bal = 0;
        let gold = 0;
        const final = updatedTxs.map(t => {
           if (t.unit === 'money') {
             bal = t.type === 'debit' ? bal + t.amount : bal - t.amount;
             return { ...t, balanceAfter: bal };
           } else {
             gold = t.type === 'debit' ? gold + t.amount : gold - t.amount;
             return { ...t, balanceAfter: gold };
           }
        });

        return { ...c, transactions: final, currentBalance: bal, currentGoldBalance: gold };
      }
      return c;
    }));

    addLog(`LEDGER_COMMIT: ${entry.type.toUpperCase()} recorded for node.`);
    setIsEntryModalOpen(false);
  };

  const handleUpdateProfile = (updates: Partial<Customer>) => {
    if (!selectedId) return;
    setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, ...updates } : c));
    setIsEditModalOpen(false);
    addLog(`PROFILE_SYNC: Entity data updated.`);
  };

  // Added missing actions to fix App.tsx errors

  const addCustomer = (data: any) => {
    const openingBal = parseFloat(data.openingBalance || '0');
    const newCustomer: Customer = {
      id: `c_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      groupId: data.groupId,
      taxNumber: data.taxNumber,
      currentBalance: openingBal,
      currentGoldBalance: 0,
      isActive: true,
      contactList: [{ id: `cnt_${Date.now()}`, type: 'mobile', value: data.phone, isPrimary: true, source: 'MANUAL' }],
      addressList: [],
      uniquePaymentCode: (data.name.substring(0, 3).toUpperCase() || 'CUST') + '-' + Math.floor(100 + Math.random() * 900),
      grade: CustomerGrade.A,
      lastTxDate: new Date().toISOString().split('T')[0],
      transactions: openingBal !== 0 ? [{
        id: `tx_init_${Date.now()}`,
        type: openingBal > 0 ? 'debit' : 'credit',
        unit: 'money',
        amount: Math.abs(openingBal),
        method: 'adjustment',
        description: 'Opening Balance',
        date: new Date().toISOString().split('T')[0],
        staffId: user?.id || 'sys',
        balanceAfter: openingBal
      }] : [],
      status: 'active',
      paymentLinkStats: { totalOpens: 0 },
      enabledGateways: { razorpay: true, setu: true },
      fingerprints: []
    };
    setCustomers(prev => [...prev, newCustomer]);
    addLog(`ENTITY_ONBOARD: ${data.name} synchronized.`);
  };

  const handleDeleteTransaction = (txId: string) => {
    if (!selectedId) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        const updatedTxs = c.transactions.filter(t => t.id !== txId);
        let bal = 0; let gold = 0;
        const final = updatedTxs.map(t => {
           if (t.unit === 'money') {
             bal = t.type === 'debit' ? bal + t.amount : bal - t.amount;
             return { ...t, balanceAfter: bal };
           } else {
             gold = t.type === 'debit' ? gold + t.amount : gold - t.amount;
             return { ...t, balanceAfter: gold };
           }
        });
        return { ...c, transactions: final, currentBalance: bal, currentGoldBalance: gold };
      }
      return c;
    }));
    addLog(`LEDGER_DELETE: Entry removed.`);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsEntryModalOpen(true);
  };

  const enrichCustomerData = async () => {
    if (!activeCustomer) return;
    setIsAiLoading(true);
    addLog(`DEEPVUE_QUERY: Fetching forensics for ${activeCustomer.name}`);
    try {
      const insights = await deepvueService.fetchInsights(activeCustomer.phone, activeCustomer.taxNumber || '');
      setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, deepvueInsights: insights } : c));
      addLog(`DEEPVUE_REPLY: Intelligence node synchronized.`);
    } catch (e) {
      addLog(`DEEPVUE_ERROR: Handshake failed.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const updateCustomerDeepvueData = (customerId: string, data: Partial<DeepvueInsight>) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { 
          ...c, 
          deepvueInsights: { ...c.deepvueInsights!, ...data } as DeepvueInsight 
        };
      }
      return c;
    }));
  };

  const setPrimaryContact = (customerId: string, value: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const updatedContacts = (c.contactList || []).map(cnt => ({
          ...cnt,
          isPrimary: cnt.value === value
        }));
        const primaryPhone = updatedContacts.find(cnt => cnt.isPrimary)?.value || c.phone;
        return { ...c, contactList: updatedContacts, phone: primaryPhone };
      }
      return c;
    }));
  };

  const updateIntegrationConfig = (nodeId: string, fields: IntegrationField[]) => {
    setIntegrations(prev => prev.map(n => n.id === nodeId ? { ...n, fields } : n));
    addLog(`INFRA_SYNC: ${nodeId.toUpperCase()} configuration updated.`);
  };

  const handleAddCallLog = (log: CommunicationLog) => {
    setCallLogs(prev => [log, ...prev]);
    addLog(`COMM_LOG: Voice interaction recorded.`);
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
      handleCommitEntry, handleUpdateProfile,
      navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      resetCustomerView: () => { setSelectedId(null); setActiveView('customers'); },
      handleAiInquiry: async () => {
        if (!activeCustomer) return;
        setIsAiLoading(true);
        addLog(`KERNEL_QUERY: Deep-analysis for ${activeCustomer.name}`);
        const strategy = await generateEnterpriseStrategy(activeCustomer, callLogs);
        setAiStrategy(strategy);
        setIsAiLoading(false);
        addLog(`KERNEL_REPLY: Intelligence strategy cached.`);
      },
      // Added missing actions to the return object
      addCustomer,
      handleDeleteTransaction,
      openEditModal,
      enrichCustomerData,
      updateCustomerDeepvueData,
      setPrimaryContact,
      updateIntegrationConfig,
      handleAddCallLog
    }
  };
};
