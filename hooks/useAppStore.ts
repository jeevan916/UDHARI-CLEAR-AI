
import { useState, useMemo, useEffect } from 'react';
import { 
  Customer, User, AiStrategy, Transaction, Template, 
  GradeRule, CommunicationLog, View, TransactionType, TransactionUnit,
  DeepvueInsight, IntegrationNode, IntegrationField
} from '../types';
import { analyzeCustomerBehavior, generateUniqueRef } from '../utils/debtUtils';
import { generateEnterpriseStrategy } from '../services/geminiService';
// Added missing deepvueService import
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
  // Added templates and integrations state
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);
  const [callLogs, setCallLogs] = useState<CommunicationLog[]>(INITIAL_CALL_LOGS);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>(INITIAL_WHATSAPP_LOGS);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');

  // UI State: Added missing UI controls
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
  
  // Added behavior analysis for active customer
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
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 100));
  };

  useEffect(() => {
    if (user) {
      addLog(`User ${user.name} authenticated. Node: 139.59.10.70`);
      addLog("Initializing Ledger Clusters...");
      addLog("AI Core Standing By.");
    }
  }, [user]);

  // Actions
  const handleCommitEntry = (entry: any) => {
    if (!selectedId) return;
    
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedId) {
        let newTx: Transaction;
        let updatedTxs: Transaction[];
        
        if (editingTransaction) {
            newTx = {
                ...editingTransaction,
                type: entry.type,
                unit: entry.unit || 'money',
                amount: parseFloat(entry.amount),
                method: entry.method,
                description: entry.description,
                date: entry.date
            };
            const otherTxs = c.transactions.filter(t => t.id !== editingTransaction.id);
            updatedTxs = [...otherTxs, newTx].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else {
            newTx = {
              id: generateUniqueRef('TX'),
              type: entry.type,
              unit: entry.unit || 'money',
              amount: parseFloat(entry.amount),
              method: entry.method,
              description: entry.description,
              date: entry.date || new Date().toISOString().split('T')[0],
              staffId: user?.id || 'sys',
              balanceAfter: 0
            };
            updatedTxs = [...c.transactions, newTx].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        // Recalculate running balances
        let bal = 0;
        let gold = 0;
        const finalTxs = updatedTxs.map(t => {
            if (t.unit === 'money') {
                bal = t.type === 'debit' ? bal + t.amount : bal - t.amount;
                return { ...t, balanceAfter: bal };
            } else {
                gold = t.type === 'debit' ? gold + t.amount : gold - t.amount;
                return { ...t, balanceAfter: gold };
            }
        });

        return { ...c, transactions: finalTxs, currentBalance: bal, currentGoldBalance: gold };
      }
      return c;
    }));

    addLog(`LEDGER_COMMIT: ${entry.type.toUpperCase()} recorded.`);
    setIsEntryModalOpen(false);
    setEditingTransaction(null);
  };

  const addCustomer = (data: any) => {
      const newCust: Customer = {
          id: `c_${Date.now()}`,
          name: data.name,
          phone: data.phone,
          groupId: data.groupId,
          taxNumber: data.taxNumber,
          uniquePaymentCode: `${data.name.slice(0,3).toUpperCase()}-${Math.floor(100+Math.random()*900)}`,
          grade: 'A' as any,
          currentBalance: parseFloat(data.openingBalance) || 0,
          currentGoldBalance: 0,
          lastTxDate: new Date().toISOString().split('T')[0],
          isActive: true,
          status: 'active',
          contactList: [{ id: 'cnt_1', type: 'mobile', value: data.phone, isPrimary: true, source: 'MANUAL' }],
          addressList: [],
          paymentLinkStats: { totalOpens: 0 },
          enabledGateways: { razorpay: true, setu: true },
          transactions: data.openingBalance ? [{
              id: 'tx_init',
              type: 'debit',
              unit: 'money',
              amount: parseFloat(data.openingBalance),
              method: 'adjustment',
              description: 'Opening Balance',
              date: new Date().toISOString().split('T')[0],
              staffId: user?.id || 'sys',
              balanceAfter: parseFloat(data.openingBalance)
          }] : [],
          fingerprints: []
      };
      setCustomers(prev => [...prev, newCust]);
      addLog(`ENTITY_ONBOARD: ${newCust.name} added to cluster.`);
  };

  const handleUpdateProfile = (updates: Partial<Customer>) => {
      if (!selectedId) return;
      setCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, ...updates } : c));
      setIsEditModalOpen(false);
      addLog(`PROFILE_UPDATE: ${activeCustomer?.name} state modified.`);
  };

  const handleDeleteTransaction = (txId: string) => {
      if (!selectedId) return;
      setCustomers(prev => prev.map(c => {
          if (c.id === selectedId) {
              const txs = c.transactions.filter(t => t.id !== txId);
              // Recalculate
              let bal = 0;
              let gold = 0;
              const updated = txs.map(t => {
                  if (t.unit === 'money') {
                      bal = t.type === 'debit' ? bal + t.amount : bal - t.amount;
                      return { ...t, balanceAfter: bal };
                  } else {
                      gold = t.type === 'debit' ? gold + t.amount : gold - t.amount;
                      return { ...t, balanceAfter: gold };
                  }
              });
              return { ...c, transactions: updated, currentBalance: bal, currentGoldBalance: gold };
          }
          return c;
      }));
      addLog(`LEDGER_DELETE: Transaction ${txId} removed.`);
  };

  const updateIntegrationConfig = (nodeId: string, fields: IntegrationField[]) => {
      setIntegrations(prev => prev.map(n => n.id === nodeId ? { ...n, fields } : n));
      addLog(`CONFIG_SYNC: Infrastructure node ${nodeId} updated.`);
  };

  const handleAddCallLog = (log: CommunicationLog) => {
      setCallLogs(prev => [...prev, log]);
      addLog(`CALL_LOG: Recorded interaction for entity.`);
  };

  const enrichCustomerData = async () => {
      if (!activeCustomer) return;
      setIsAiLoading(true);
      addLog(`INTEL_FETCH: Deepvue forensic scan initiated for ${activeCustomer.name}`);
      try {
          const insights = await deepvueService.fetchInsights(activeCustomer.phone, activeCustomer.taxNumber || '');
          setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, deepvueInsights: insights } : c));
          addLog(`INTEL_SUCCESS: Behavioral snapshot synchronized.`);
      } catch (e) {
          addLog(`INTEL_ERROR: Forensic node failure.`);
      } finally {
          setIsAiLoading(false);
      }
  };

  const updateCustomerDeepvueData = (customerId: string, data: Partial<DeepvueInsight>) => {
      setCustomers(prev => prev.map(c => {
          if (c.id === customerId && c.deepvueInsights) {
              return { ...c, deepvueInsights: { ...c.deepvueInsights, ...data } };
          }
          return c;
      }));
  };

  const setPrimaryContact = (customerId: string, value: string) => {
      setCustomers(prev => prev.map(c => {
          if (c.id === customerId) {
              const updatedContacts = c.contactList.map(cnt => ({ ...cnt, isPrimary: cnt.value === value }));
              return { ...c, contactList: updatedContacts, phone: value };
          }
          return c;
      }));
  };

  return {
    state: {
      user, activeView, customers, selectedId, systemLogs, gradeRules, 
      callLogs, whatsappLogs, isAiLoading, searchTerm, filterGrade,
      isAdmin, activeCustomer, filteredCustomers,
      // Added missing state exports
      expandedMenus, isMobileMenuOpen, templates, integrations,
      isEntryModalOpen, isEditModalOpen, editingTransaction, entryDefaults,
      aiStrategy, behavior
    },
    actions: {
      setUser, setActiveView, setCustomers, setSearchTerm, setFilterGrade,
      // Added missing action exports
      setExpandedMenus, setIsMobileMenuOpen, setTemplates, setGradeRules,
      handleCommitEntry, navigateToCustomer: (id: string) => { setSelectedId(id); setActiveView('view-customer'); },
      resetCustomerView: () => { setSelectedId(null); setActiveView('customers'); setAiStrategy(null); },
      handleAiInquiry: async () => {
        if (!activeCustomer) return;
        setIsAiLoading(true);
        addLog(`AI_REQUEST: Full-risk audit initiated for ${activeCustomer.name}`);
        const strategy = await generateEnterpriseStrategy(activeCustomer, callLogs);
        setAiStrategy(strategy);
        setIsAiLoading(false);
        addLog(`AI_RESPONSE: Strategy generated successfully.`);
      },
      addCustomer, setEditingTransaction, setEntryDefaults, setIsEntryModalOpen, setIsEditModalOpen,
      handleDeleteTransaction, openEditModal: (tx: Transaction) => { setEditingTransaction(tx); setIsEntryModalOpen(true); },
      enrichCustomerData, updateCustomerDeepvueData, setPrimaryContact,
      updateIntegrationConfig, handleAddCallLog, handleUpdateProfile
    }
  };
};
