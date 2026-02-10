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
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'OFFLINE' | 'SIMULATION'>('OFFLINE');
  const [dbStructure, setDbStructure] = useState<any[]>([]);
  const [envCheck, setEnvCheck] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<any>(null);
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
    // Prevent duplicate adjacent logs for cleaner UI
    setSystemLogs(prev => {
       if (prev.length > 0 && prev[0] === msg) return prev;
       return [msg, ...prev].slice(0, 200);
    });
  }, []);

  const syncLedger = useCallback(async () => {
    if (!user) return;
    
    try {
      const healthRes = await axios.get('/api/system/health');
      const health = healthRes.data;

      if (health.database_structure) setDbStructure(health.database_structure);
      if (health.env_check) setEnvCheck(health.env_check);
      if (health.last_error) setLastError(health.last_error);
      
      // Update logs from server
      if (health.debug_logs && Array.isArray(health.debug_logs)) {
         setSystemLogs(health.debug_logs); // Direct sync from server source of truth
      }

      if (health.db_health === 'MOCK_CORE') {
         setDbStatus('SIMULATION');
      } else if (health.db_health !== 'CONNECTED') {
         setDbStatus('OFFLINE');
         return;
      } else {
         setDbStatus('CONNECTED');
      }

      // Fetch customers (works for both CONNECTED and MOCK_CORE)
      const res = await axios.get('/api/customers');
      if (res.data && Array.isArray(res.data)) {
        const mergedData = health.db_health === 'MOCK_CORE' 
            ? INITIAL_CUSTOMERS 
            : res.data;
            
        setCustomers(mergedData.length > 0 ? mergedData : INITIAL_CUSTOMERS);
      }
    } catch (e: any) {
      const detail = e.response?.data?.details || e.message;
      addLog(`[FRONTEND_ERR] Failed to sync: ${detail}`);
      setDbStatus('OFFLINE');
    }
  }, [user, addLog]);

  useEffect(() => {
    if (user) {
        syncLedger();
        // Poll for logs/health every 5 seconds if in error state, else 30s
        const interval = setInterval(syncLedger, dbStatus !== 'CONNECTED' ? 5000 : 30000);
        return () => clearInterval(interval);
    }
  }, [user, syncLedger, dbStatus]);

  const activeCustomer = useMemo(() => {
    if (!selectedId) return null;
    return customers.find(c => c.id === selectedId) || null;
  }, [customers, selectedId]);

  const behavior = useMemo(() => {
    if (!activeCustomer) return null;
    try {
      return analyzeCustomerBehavior(activeCustomer, gradeRules, callLogs);
    } catch (err) {
      return null;
    }
  }, [activeCustomer, gradeRules, callLogs]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.phone.includes(searchTerm) || 
                           (c.uniquePaymentCode && c.uniquePaymentCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
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

  const handleAiInquiry = async () => {
    if (!activeCustomer) return null;
    setIsAiLoading(true);
    addLog(`CORTEX: Analyzing Trace ${activeCustomer.uniquePaymentCode}...`);
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
      addLog("CORTEX: Analysis Generated.");
      return strategy;
    } catch (e) {
      addLog("CORTEX_ERR: Inquiry timed out.");
      return null;
    } finally {
      setIsAiLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return {
    state: { 
      user, activeView, customers, systemLogs, dbStatus, dbStructure, envCheck, lastError, isAiLoading, isAdmin, 
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
      handleUpdateProfile: (updates: any) => { addLog("PROFILE: Node updated."); setIsEditModalOpen(false); },
      addCustomer,
      handleDeleteTransaction,
      openEditModal,
      enrichCustomerData: () => addLog("FORENSICS: Enrichment cycle."),
      updateCustomerDeepvueData: (u: any) => addLog("FORENSICS: Intel updated."),
      setPrimaryContact: (id: string) => addLog("CONTACT: Primary switched."),
      updateIntegrationConfig: (id: string, f: any) => addLog(`INFRA: ${id} updated.`)
    }
  };
};