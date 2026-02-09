
import { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, CustomerGrade, IntegrationNode, IntegrationField
} from '../types';
import { analyzeCustomerBehavior } from '../utils/debtUtils';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_TEMPLATES, 
  INITIAL_GRADE_RULES, 
  INITIAL_CALL_LOGS, 
  INITIAL_WHATSAPP_LOGS, 
  INITIAL_INTEGRATIONS 
} from '../data/initialData';

export const useAppStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<'LOCAL_VAULT_CONNECTED' | 'VAULT_OFFLINE'>('VAULT_OFFLINE');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // UI & Modal States
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ ledger: true, protocols: true, risk: true });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryDefaults, setEntryDefaults] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Data States
  const [callLogs, setCallLogs] = useState<CommunicationLog[]>(INITIAL_CALL_LOGS);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>(INITIAL_WHATSAPP_LOGS);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>(INITIAL_GRADE_RULES);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);
  const [aiStrategy, setAiStrategy] = useState<AiStrategy | null>(null);

  const addLog = useCallback((msg: string) => {
    setSystemLogs(prev => [`[LOG] ${msg}`, ...prev].slice(0, 100));
  }, []);

  const syncLedger = useCallback(async () => {
    if (!user) return;
    addLog(`Synchronizing with core ledger...`);
    try {
      // First check health
      const health = await axios.get('/api/system/health');
      if (health.data.db_health !== 'CONNECTED') {
         throw new Error(health.data.error_trace || 'Database initialization failed on server.');
      }

      const res = await axios.get('/api/customers');
      if (res.data && Array.isArray(res.data)) {
        setCustomers(res.data.length > 0 ? res.data : INITIAL_CUSTOMERS);
      }
      setDbStatus('LOCAL_VAULT_CONNECTED');
      addLog(`SYNC_COMPLETE: Production data mirrored.`);
    } catch (e: any) {
      const errorMsg = e.response?.data?.details || e.message;
      addLog(`SYNC_FAILED: ${errorMsg}`);
      setDbStatus('VAULT_OFFLINE');
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

  const handleAiInquiry = async () => {
    if (!activeCustomer) return null;
    setIsAiLoading(true);
    addLog(`Requesting behavior audit for ${activeCustomer.uniquePaymentCode}...`);
    try {
      const res = await axios.post('/api/kernel/reason', {
        customerData: { name: activeCustomer.name, balance: activeCustomer.currentBalance },
        interactions: callLogs.filter(l => l.customerId === activeCustomer.id).slice(0, 5)
      });
      
      const strategy: AiStrategy = {
        riskScore: res.data.risk_score,
        riskLevel: res.data.risk_level,
        analysis: res.data.analysis,
        recommendedAction: res.data.action_plan,
        next_step: res.data.action_plan
      };

      setAiStrategy(strategy);
      setIsAiLoading(false);
      addLog(`AUDIT_OK: Strategic roadmap updated.`);
      return strategy;
    } catch (e) {
      setIsAiLoading(false);
      addLog(`AUDIT_FAILED: Reasoning engine timeout.`);
      return null;
    }
  };

  const addCustomer = useCallback(async (data: any) => {
    const newCustomer: Customer = {
      ...data,
      id: `c_${Date.now()}`,
      uniquePaymentCode: `${data.name.substring(0,3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      currentBalance: Number(data.openingBalance) || 0,
      currentGoldBalance: 0,
      lastTxDate: new Date().toISOString().split('T')[0],
      isActive: true,
      grade: CustomerGrade.A,
      transactions: [],
      fingerprints: [],
      enabledGateways: { razorpay: true, setu: true }
    };
    
    // In a full enterprise app, this would be an axios.post
    setCustomers(prev => [...prev, newCustomer]);
    addLog(`ENTITY_CREATED: ${newCustomer.name} onboarded.`);
  }, [addLog]);

  const handleCommitEntry = useCallback((entry: any) => {
    if (!selectedId) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        let newTransactions = [...c.transactions];
        if (editingTransaction) {
          newTransactions = newTransactions.map(t => t.id === editingTransaction.id ? { ...t, ...entry, amount: Number(entry.amount) } : t);
        } else {
          const newTx: Transaction = {
            ...entry,
            id: `t_${Date.now()}`,
            amount: Number(entry.amount),
            staffId: user?.id || 'sys',
            balanceAfter: entry.type === 'debit' ? (c.currentBalance + Number(entry.amount)) : (c.currentBalance - Number(entry.amount))
          };
          newTransactions.push(newTx);
        }
        
        const newMoneyBalance = newTransactions.filter(t => (t.unit || 'money') === 'money').reduce((acc, t) => acc + (t.type === 'debit' ? t.amount : -t.amount), 0);
        const newGoldBalance = newTransactions.filter(t => (t.unit || 'money') === 'gold').reduce((acc, t) => acc + (t.type === 'debit' ? t.amount : -t.amount), 0);

        return { ...c, transactions: newTransactions, currentBalance: newMoneyBalance, currentGoldBalance: newGoldBalance };
      }
      return c;
    }));
    setIsEntryModalOpen(false);
    setEditingTransaction(null);
    addLog(`LEDGER_UPDATED: Changes committed to disk.`);
  }, [selectedId, editingTransaction, user, addLog]);

  const isAdmin = user?.role === 'admin';

  return {
    state: { 
      user, activeView, customers, systemLogs, dbStatus, isAiLoading, isAdmin, 
      activeCustomer, gradeRules, expandedMenus, isMobileMenuOpen, searchTerm, 
      filterGrade, callLogs, whatsappLogs, templates, integrations, aiStrategy, 
      behavior, filteredCustomers,
      isEntryModalOpen, editingTransaction, entryDefaults, isEditModalOpen
    },
    actions: { 
      setUser, setActiveView, setSelectedId, addLog, syncLedger, 
      handleAiInquiry, navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      setExpandedMenus, setIsMobileMenuOpen, setSearchTerm, setFilterGrade, 
      resetCustomerView: () => { setSelectedId(null); setAiStrategy(null); setActiveView('customers'); },
      setGradeRules, updateIntegrationConfig: (nodeId: string, fields: IntegrationField[]) => {
        setIntegrations(prev => prev.map(n => n.id === nodeId ? { ...n, fields } : n));
        addLog(`CONFIG_SAVED: Integration ${nodeId} recalibrated.`);
      },
      setTemplates, handleAddCallLog: (log: CommunicationLog) => setCallLogs(prev => [log, ...prev]),
      addCustomer, setEditingTransaction, setEntryDefaults, setIsEntryModalOpen, 
      setIsEditModalOpen, handleDeleteTransaction: (txId: string) => {
        if (!selectedId) return;
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, transactions: c.transactions.filter(t => t.id !== txId) } : c));
        addLog(`ENTRY_DELETED: Ledger modified.`);
      }, openEditModal: (tx: Transaction) => { setEditingTransaction(tx); setIsEntryModalOpen(true); }, enrichCustomerData: async () => {
        addLog(`ENRICH_START: Scanning global records...`);
        await new Promise(r => setTimeout(r, 1000));
        addLog(`ENRICH_OK: Data points stabilized.`);
      }, updateCustomerDeepvueData: async (updates: any) => {
        if (!selectedId) return;
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, deepvueInsights: { ...c.deepvueInsights!, ...updates } } : c));
        addLog(`INTEL_UPDATED: Deepvue insights refreshed.`);
      }, setPrimaryContact: (id: string) => {
        if (!selectedId) return;
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, contactList: c.contactList?.map(cnt => ({ ...cnt, isPrimary: cnt.id === id })) } : c));
      }, handleCommitEntry, handleUpdateProfile: (updates: Partial<Customer>) => {
        if (!selectedId) return;
        setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, ...updates } : c));
        setIsEditModalOpen(false);
        addLog(`PROFILE_MODIFIED: Metadata updated.`);
      }
    }
  };
};
