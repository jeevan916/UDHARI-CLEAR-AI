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
    addLog("Requesting remote server telemetry...");
    try {
      const healthRes = await axios.get('/api/system/health');
      const health = healthRes.data;

      // Dump all remote debug logs into the terminal
      if (health.debug_logs && health.debug_logs.length > 0) {
        health.debug_logs.forEach((log: string) => addLog(`REMOTE: ${log}`));
      }

      if (health.db_health !== 'CONNECTED') {
         throw new Error(`DB_HANDSHAKE_FAILED: ${health.last_error || 'No reason provided'}`);
      }

      const res = await axios.get('/api/customers');
      if (res.data && Array.isArray(res.data)) {
        setCustomers(res.data.length > 0 ? res.data : INITIAL_CUSTOMERS);
        setDbStatus('CONNECTED');
        addLog(`NODE_STABLE: Running on version ${health.version}`);
      }
    } catch (e: any) {
      const detail = e.response?.data?.details || e.message;
      addLog(`CRITICAL: ${detail}`);
      setDbStatus('OFFLINE');
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

  const handleDeleteTransaction = useCallback((txId: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        return { ...c, transactions: c.transactions.filter(t => t.id !== txId) };
      }
      return c;
    }));
    addLog("LEDGER: Entry purged.");
  }, [selectedId, addLog]);

  const openEditModal = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsEntryModalOpen(true);
  }, []);

  const enrichCustomerData = useCallback(() => {
    addLog("FORENSICS: Enrichment cycle started.");
  }, [addLog]);

  const updateCustomerDeepvueData = useCallback((updates: any) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        return { ...c, deepvueInsights: { ...c.deepvueInsights, ...updates } as any };
      }
      return c;
    }));
    addLog("FORENSICS: Node intelligence updated.");
  }, [selectedId, addLog]);

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