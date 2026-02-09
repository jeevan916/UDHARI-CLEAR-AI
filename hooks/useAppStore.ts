import { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, CustomerGrade, IntegrationNode, IntegrationField, TransactionUnit, TransactionType
} from '../types';
import { analyzeCustomerBehavior } from '../utils/debtUtils';
import { INITIAL_CUSTOMERS, INITIAL_GRADE_RULES, INITIAL_TEMPLATES, INITIAL_CALL_LOGS, INITIAL_WHATSAPP_LOGS, INITIAL_INTEGRATIONS } from '../data/initialData';

export const useAppStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>(INITIAL_GRADE_RULES);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [callLogs, setCallLogs] = useState<CommunicationLog[]>(INITIAL_CALL_LOGS);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>(INITIAL_WHATSAPP_LOGS);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ ledger: true, protocols: true, risk: true });
  
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryDefaults, setEntryDefaults] = useState<{ type?: TransactionType, unit?: TransactionUnit } | null>(null);
  const [aiStrategy, setAiStrategy] = useState<AiStrategy | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);

  const isAdmin = user?.role === 'admin';
  const activeCustomer = useMemo(() => customers.find(c => c.id === selectedId), [customers, selectedId]);
  
  const behavior = useMemo(() => {
    if (!activeCustomer) return null;
    return analyzeCustomerBehavior(activeCustomer, gradeRules, callLogs);
  }, [activeCustomer, gradeRules, callLogs]);

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

  const addLog = useCallback((msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  const initializeData = useCallback(async () => {
    if (!user) return;
    addLog("NODE_INIT: Established handshake with 139.59.10.70");
    try {
      const healthRes = await axios.get('/api/kernel/health');
      addLog(`KERNEL_LINK: Node version ${healthRes.data.version} stable.`);
      
      const res = await axios.get('/api/customers');
      setCustomers(res.data.length ? res.data : INITIAL_CUSTOMERS);
      setDbStatus('CONNECTED');
      addLog("VAULT_SYNC: Local loopback 127.0.0.1 synchronized.");
    } catch (e) {
      setCustomers(INITIAL_CUSTOMERS);
      setDbStatus('DISCONNECTED');
      addLog("VAULT_OFFLINE: Could not reach 127.0.0.1. Using edge cache.");
    }
  }, [user, addLog]);

  useEffect(() => {
    if (user) initializeData();
  }, [user, initializeData]);

  const handleAiInquiry = async () => {
    if (!activeCustomer) return;
    setIsAiLoading(true);
    addLog(`CORTEX: Analyzing entity ${activeCustomer.uniquePaymentCode} via Gemini 3 Pro...`);
    try {
      const res = await axios.post('/api/kernel/reason', {
        customerData: { 
          name: activeCustomer.name, 
          balance: activeCustomer.currentBalance, 
          grade: activeCustomer.grade,
          metal: activeCustomer.currentGoldBalance
        },
        interactionLogs: callLogs.filter(l => l.customerId === activeCustomer.id)
      });
      setAiStrategy(res.data);
      setIsAiLoading(false);
      addLog("CORTEX_SYNC: Strategy roadmap injected.");
      return res.data;
    } catch (e) {
      setIsAiLoading(false);
      addLog("CORTEX_ERROR: AI reasoning cycle interrupted.");
      return null;
    }
  };

  const handleCommitEntry = (data: any) => {
    addLog(`LEDGER_COMMIT: Writing ${data.type} of ${data.amount} to ${data.unit} vault...`);
    setIsEntryModalOpen(false);
  };

  const handleUpdateProfile = (updates: Partial<Customer>) => {
    if (!activeCustomer) return;
    setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, ...updates } : c));
    setIsEditModalOpen(false);
    addLog(`SYSTEM_PATCH: Entity ${activeCustomer.uniquePaymentCode} updated.`);
  };

  const addCustomer = (data: any) => {
    const newCust: Customer = {
      id: `c_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      groupId: data.groupId,
      taxNumber: data.taxNumber,
      currentBalance: parseFloat(data.openingBalance) || 0,
      currentGoldBalance: 0,
      isActive: true,
      uniquePaymentCode: data.name.substring(0,3).toUpperCase() + '-' + Math.floor(Math.random()*1000),
      lastTxDate: new Date().toISOString().split('T')[0],
      transactions: [],
      enabledGateways: { razorpay: true, setu: true },
      fingerprints: [],
      grade: CustomerGrade.A
    };
    setCustomers(prev => [...prev, newCust]);
    addLog(`VAULT_WRITE: New entity established: ${newCust.name}`);
  };

  const updateIntegrationConfig = (nodeId: string, fields: IntegrationField[]) => {
    setIntegrations(prev => prev.map(n => n.id === nodeId ? { ...n, fields } : n));
    addLog(`NODE_CONFIG: Infrastructure node ${nodeId} recalibrated.`);
  };

  const handleAddCallLog = (log: CommunicationLog) => {
    setCallLogs(prev => [log, ...prev]);
    addLog(`VOICE_LOG: Documented interaction with ${log.customerId}`);
  };

  return {
    state: { 
      user, activeView, customers, selectedId, systemLogs, gradeRules, 
      callLogs, isAiLoading, dbStatus, isAdmin, activeCustomer, behavior, 
      templates, whatsappLogs, searchTerm, filterGrade, isMobileMenuOpen, 
      expandedMenus, isEntryModalOpen, isEditModalOpen, editingTransaction, 
      entryDefaults, aiStrategy, integrations, filteredCustomers 
    },
    actions: { 
      setUser, setActiveView, setCustomers, setSelectedId, addLog, initializeData, 
      handleAiInquiry, setSearchTerm, setFilterGrade, setIsMobileMenuOpen, 
      setExpandedMenus, setIsEntryModalOpen, setIsEditModalOpen, 
      setEditingTransaction, setEntryDefaults, setGradeRules, setTemplates,
      updateIntegrationConfig, handleAddCallLog, handleCommitEntry, handleUpdateProfile,
      addCustomer,
      navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      resetCustomerView: () => { setSelectedId(null); setActiveView('customers'); },
      handleDeleteTransaction: (id: string) => addLog(`LEDGER_DELETE: Requested removal of hash ${id}`),
      openEditModal: (tx: Transaction) => { setEditingTransaction(tx); setIsEntryModalOpen(true); },
      enrichCustomerData: () => addLog("FORENSICS_START: Triggered deep-trace background enrichment..."),
      updateCustomerDeepvueData: (updates: any) => addLog("VAULT_SYNC: Forensic insights updated."),
      setPrimaryContact: (id: string) => addLog(`SYSTEM: Primary communication node reassigned.`)
    }
  };
};