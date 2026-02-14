
import { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, CustomerGrade, IntegrationNode, IntegrationField
} from '../types';
import { analyzeCustomerBehavior } from '../utils/debtUtils';
/* Fix: Import required service for handleAiInquiry */
import { generateEnterpriseStrategy } from '../services/geminiService';
import { 
  INITIAL_CUSTOMERS, INITIAL_TEMPLATES, INITIAL_GRADE_RULES, 
  INITIAL_CALL_LOGS, INITIAL_WHATSAPP_LOGS, INITIAL_INTEGRATIONS 
} from '../data/initialData';

export const useAppStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<any>('OFFLINE');
  const [dbStructure, setDbStructure] = useState<any[]>([]);
  const [envCheck, setEnvCheck] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
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
      setHealthData(health);

      if (health.database_structure) setDbStructure(health.database_structure);
      if (health.env_check) setEnvCheck(health.env_check);
      if (health.last_error) setLastError(health.last_error);
      if (health.debug_logs) setSystemLogs(health.debug_logs);

      setDbStatus(health.db_health);

      if (health.db_health === 'CONNECTED') {
        const res = await axios.get('/api/customers');
        if (res.data && Array.isArray(res.data)) {
          setCustomers(res.data.length > 0 ? res.data : INITIAL_CUSTOMERS);
        }
      }
    } catch (e: any) {
      addLog(`[SYSTEM] Sync Error: ${e.message}`);
      setDbStatus('OFFLINE');
    }
  }, [user, addLog]);

  useEffect(() => {
    if (user) {
        syncLedger();
        const interval = setInterval(syncLedger, 10000);
        return () => clearInterval(interval);
    }
  }, [user, syncLedger]);

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
                           c.phone.includes(searchTerm);
      const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
      const matchesGrade = filterGrade === 'all' || b.calculatedGrade === filterGrade;
      return matchesSearch && matchesGrade;
    });
  }, [customers, searchTerm, filterGrade, gradeRules, callLogs]);

  const isAdmin = user?.role === 'admin';

  return {
    state: { 
      user, activeView, customers, systemLogs, dbStatus, dbStructure, envCheck, lastError, healthData, isAiLoading, isAdmin, 
      activeCustomer, gradeRules, expandedMenus, isMobileMenuOpen, searchTerm, 
      filterGrade, callLogs, whatsappLogs, templates, integrations, aiStrategy, 
      behavior, filteredCustomers, isEntryModalOpen, editingTransaction, entryDefaults, isEditModalOpen
    },
    actions: { 
      setUser, setActiveView, setSelectedId, addLog, syncLedger, 
      navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      setExpandedMenus, setIsMobileMenuOpen, setSearchTerm, setFilterGrade, 
      resetCustomerView: () => { setSelectedId(null); setAiStrategy(null); setActiveView('customers'); },
      setGradeRules, setTemplates, handleAddCallLog: (log: CommunicationLog) => setCallLogs(prev => [log, ...prev]),
      setIsEntryModalOpen, setIsEditModalOpen, setEditingTransaction, setEntryDefaults,
      handleCommitEntry: () => setIsEntryModalOpen(false),
      handleUpdateProfile: () => setIsEditModalOpen(false),
      addCustomer: () => {},
      handleDeleteTransaction: () => {},
      openEditModal: (tx: any) => { setEditingTransaction(tx); setIsEntryModalOpen(true); },
      enrichCustomerData: () => {},
      updateCustomerDeepvueData: () => {},
      setPrimaryContact: () => {},
      /* Fix: Implement handleAiInquiry for CustomerDetailView */
      handleAiInquiry: async () => {
        if (!activeCustomer) return null;
        setIsAiLoading(true);
        try {
          const strategy = await generateEnterpriseStrategy(activeCustomer, callLogs);
          if (strategy) {
            setAiStrategy(strategy);
            addLog(`[AI] Strategy generated for ${activeCustomer.name}`);
          }
          return strategy;
        } catch (e: any) {
          addLog(`[AI] Reasoning failure: ${e.message}`);
          return null;
        } finally {
          setIsAiLoading(false);
        }
      },
      /* Fix: Update updateIntegrationConfig signature to handle nodeId and fields */
      updateIntegrationConfig: (nodeId: string, fields: IntegrationField[]) => {
        setIntegrations(prev => prev.map(n => n.id === nodeId ? { ...n, fields } : n));
        addLog(`[SYSTEM] Configuration for node ${nodeId} updated.`);
      }
    }
  };
};