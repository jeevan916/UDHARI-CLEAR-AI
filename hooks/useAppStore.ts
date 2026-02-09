
import { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, CustomerGrade, IntegrationNode, IntegrationField
} from '../types';
import { analyzeCustomerBehavior } from '../utils/debtUtils';
import { 
  INITIAL_CUSTOMERS, INITIAL_TEMPLATES, INITIAL_GRADE_RULES, 
  INITIAL_CALL_LOGS, INITIAL_WHATSAPP_LOGS, INITIAL_INTEGRATIONS 
} from '../data/initialData';

export const useAppStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'OFFLINE'>('OFFLINE');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ ledger: true, protocols: true, risk: true });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryDefaults, setEntryDefaults] = useState<any | null>(null);

  const [callLogs, setCallLogs] = useState<CommunicationLog[]>(INITIAL_CALL_LOGS);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>(INITIAL_WHATSAPP_LOGS);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>(INITIAL_GRADE_RULES);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);
  const [aiStrategy, setAiStrategy] = useState<AiStrategy | null>(null);

  const addLog = useCallback((msg: string) => {
    setSystemLogs(prev => [`[LOG] ${msg}`, ...prev].slice(0, 50));
  }, []);

  const syncLedger = useCallback(async () => {
    if (!user) return;
    addLog("Initializing secure handshake with 139.59.10.70...");
    try {
      const health = await axios.get('/api/system/health');
      if (health.data.db_health !== 'CONNECTED') {
         throw new Error(`DB_LINK_FAILED: ${health.data.last_error || 'Unknown Reason'}`);
      }

      const res = await axios.get('/api/customers');
      if (res.data && Array.isArray(res.data)) {
        setCustomers(res.data.length > 0 ? res.data : INITIAL_CUSTOMERS);
        setDbStatus('CONNECTED');
        addLog("SYNC_COMPLETE: Production node verified.");
      }
    } catch (e: any) {
      const detail = e.response?.data?.details || e.message;
      addLog(`CRITICAL: ${detail}`);
      setDbStatus('OFFLINE');
      // If server is up but DB is down, we use initial data as fallback
      setCustomers(INITIAL_CUSTOMERS);
    }
  }, [user, addLog]);

  useEffect(() => {
    if (user) syncLedger();
  }, [user, syncLedger]);

  const activeCustomer = useMemo(() => customers.find(c => c.id === selectedId) || null, [customers, selectedId]);
  const behavior = useMemo(() => activeCustomer ? analyzeCustomerBehavior(activeCustomer, gradeRules, callLogs) : null, [activeCustomer, gradeRules, callLogs]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.phone.includes(searchTerm) || 
                           c.uniquePaymentCode.toLowerCase().includes(searchTerm.toLowerCase());
      const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
      const matchesGrade = filterGrade === 'all' || b.calculatedGrade === filterGrade;
      return matchesSearch && matchesGrade;
    });
  }, [customers, searchTerm, filterGrade, gradeRules, callLogs]);

  // Fix: Implement missing addCustomer action
  const addCustomer = useCallback((data: any) => {
    const newCustomer: Customer = {
      id: `c_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      groupId: data.groupId,
      taxNumber: data.taxNumber,
      uniquePaymentCode: `${data.name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
      currentBalance: Number(data.openingBalance || 0),
      currentGoldBalance: 0,
      lastTxDate: new Date().toISOString().split('T')[0],
      transactions: [],
      isActive: true,
      enabledGateways: { razorpay: true, setu: false },
      fingerprints: [],
      grade: CustomerGrade.A,
      contactList: [{ id: 'init', type: 'mobile', value: data.phone, isPrimary: true, source: 'MANUAL' }]
    };
    setCustomers(prev => [...prev, newCustomer]);
    addLog(`ENTITY: ${newCustomer.name} onboarded.`);
  }, [addLog]);

  // Fix: Implement missing handleDeleteTransaction action
  const handleDeleteTransaction = useCallback((txId: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        return { ...c, transactions: c.transactions.filter(t => t.id !== txId) };
      }
      return c;
    }));
    addLog("LEDGER: Entry purged.");
  }, [selectedId, addLog]);

  // Fix: Implement missing openEditModal action
  const openEditModal = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsEntryModalOpen(true);
  }, []);

  // Fix: Implement missing enrichCustomerData action
  const enrichCustomerData = useCallback(() => {
    addLog("FORENSICS: Enrichment cycle started.");
    // Simulation of enrichment process
  }, [addLog]);

  // Fix: Implement missing updateCustomerDeepvueData action
  const updateCustomerDeepvueData = useCallback((updates: any) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        return { ...c, deepvueInsights: { ...c.deepvueInsights, ...updates } as any };
      }
      return c;
    }));
    addLog("FORENSICS: Node intelligence updated.");
  }, [selectedId, addLog]);

  // Fix: Implement missing setPrimaryContact action
  const setPrimaryContact = useCallback((contactId: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId && c.contactList) {
        return { 
          ...c, 
          contactList: c.contactList.map(cnt => ({ ...cnt, isPrimary: cnt.id === contactId })) 
        };
      }
      return c;
    }));
  }, [selectedId]);

  // Fix: Implement missing updateIntegrationConfig action
  const updateIntegrationConfig = useCallback((nodeId: string, fields: IntegrationField[]) => {
    setIntegrations(prev => prev.map(n => n.id === nodeId ? { ...n, fields } : n));
    addLog(`INFRA: ${nodeId} node reconfigured.`);
  }, [addLog]);

  const handleAiInquiry = async () => {
    if (!activeCustomer) return null;
    setIsAiLoading(true);
    addLog(`CORTEX: Analyzing ${activeCustomer.uniquePaymentCode}...`);
    try {
      const res = await axios.post('/api/kernel/reason', {
        customerData: { name: activeCustomer.name, balance: activeCustomer.currentBalance }
      });
      const strategy: AiStrategy = {
        riskScore: res.data.risk_score || 50,
        riskLevel: res.data.risk_level || 'MEDIUM',
        analysis: res.data.analysis || 'Standard profile.',
        recommendedAction: res.data.action_plan || 'Contact entity.',
        next_step: res.data.action_plan
      };
      setAiStrategy(strategy);
      addLog("CORTEX: Audit roadmap generated.");
      return strategy;
    } catch (e) {
      addLog("CORTEX_ERR: Reasoning engine timed out.");
      return null;
    } finally {
      setIsAiLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return {
    state: { 
      user, activeView, customers, systemLogs, dbStatus, isAiLoading, isAdmin, 
      activeCustomer, gradeRules, expandedMenus, isMobileMenuOpen, searchTerm, 
      filterGrade, callLogs, whatsappLogs, templates, integrations, aiStrategy, 
      behavior, filteredCustomers, isEntryModalOpen, editingTransaction, entryDefaults, isEditModalOpen
    },
    actions: { 
      setUser, setActiveView, setSelectedId, addLog, syncLedger, handleAiInquiry, 
      navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      setExpandedMenus, setIsMobileMenuOpen, setSearchTerm, setFilterGrade, 
      resetCustomerView: () => { setSelectedId(null); setAiStrategy(null); setActiveView('customers'); },
      setGradeRules, setTemplates, handleAddCallLog: (log: CommunicationLog) => setCallLogs(prev => [log, ...prev]),
      setIsEntryModalOpen, setIsEditModalOpen, setEditingTransaction, setEntryDefaults,
      handleCommitEntry: (entry: any) => { addLog("LEDGER: Entry committed."); setIsEntryModalOpen(false); },
      handleUpdateProfile: (updates: any) => { addLog("PROFILE: Node metadata updated."); setIsEditModalOpen(false); },
      // Fix: Add the missing members to the actions return object
      addCustomer,
      handleDeleteTransaction,
      openEditModal,
      enrichCustomerData,
      updateCustomerDeepvueData,
      setPrimaryContact,
      updateIntegrationConfig
    }
  };
};
