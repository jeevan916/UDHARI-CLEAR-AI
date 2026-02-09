
import { useState, useMemo, useEffect } from 'react';
import { Customer, User, AiStrategy, Transaction, Template, GradeRule, CommunicationLog, DigitalFingerprint, IntegrationNode, IntegrationField, CustomerGrade, View, TransactionType, TransactionUnit, DeepvueInsight, ProfileContact } from '../types';
import { analyzeCustomerBehavior, generateUniqueRef } from '../utils/debtUtils';
import { generateEnterpriseStrategy } from '../services/geminiService';
import { deepvueService } from '../services/deepvueService';
import { INITIAL_CUSTOMERS, INITIAL_TEMPLATES, INITIAL_GRADE_RULES, INITIAL_CALL_LOGS, INITIAL_INTEGRATIONS, INITIAL_WHATSAPP_LOGS } from '../data/initialData';

export const useAppStore = () => {
  // --- STATE DEFINITIONS ---
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ ledger: true, protocols: true, risk: true });
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>(INITIAL_GRADE_RULES);
  const [callLogs, setCallLogs] = useState<CommunicationLog[]>(INITIAL_CALL_LOGS);
  const [whatsappLogs, setWhatsappLogs] = useState<CommunicationLog[]>(INITIAL_WHATSAPP_LOGS);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(INITIAL_INTEGRATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiStrategy, setAiStrategy] = useState<AiStrategy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  
  // UI State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  // NEW: Store defaults for new entries (e.g. Unit: Gold, Type: Debit)
  const [entryDefaults, setEntryDefaults] = useState<{ type?: TransactionType, unit?: TransactionUnit } | null>(null);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- DERIVED STATE ---
  const isAdmin = user?.role === 'admin';
  const activeCustomer = useMemo(() => customers.find(c => c.id === selectedId), [customers, selectedId]);
  
  // Dynamic Behavior Analysis using the current GradeRules AND Call Logs
  const behavior = useMemo(() => 
     activeCustomer ? analyzeCustomerBehavior(activeCustomer, gradeRules, callLogs) : null
  , [activeCustomer, gradeRules, callLogs]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Use the dynamic rules and call logs to check grade for filtering
      const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
      const matchesGrade = filterGrade === 'all' || b.calculatedGrade === filterGrade;
      return matchesSearch && matchesGrade;
    });
  }, [customers, searchTerm, filterGrade, gradeRules, callLogs]);

  // --- HELPER LOGIC ---
  const recalculateBalance = (transactions: Transaction[]) => {
    const sorted = [...transactions].sort((a, b) => {
        const d1 = new Date(a.date).getTime();
        const d2 = new Date(b.date).getTime();
        return d1 - d2;
    });

    let moneyBal = 0;
    let goldBal = 0;

    return sorted.map(t => {
      if (t.unit === 'gold') {
         if (t.type === 'debit') goldBal += t.amount;
         else goldBal -= t.amount;
         return { ...t, balanceAfter: goldBal };
      } else {
         if (t.type === 'debit') moneyBal += t.amount;
         else moneyBal -= t.amount;
         return { ...t, balanceAfter: moneyBal };
      }
    });
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (user) {
      const logs = [
        "SSH Connection established: 139.59.10.70",
        "ArrearsFlow Kernel v2.5 Online...",
        "RSA-4096 Handshake Verified.",
        "Meta Cloud Infrastructure Connected.",
        "Ledger Clusters Syncing [7/7 Nodes]..."
      ];
      logs.forEach((l, i) => setTimeout(() => setSystemLogs(prev => [...prev, l]), i * 400));
    }
  }, [user]);

  // --- AJAX / REALTIME SIMULATION ---
  useEffect(() => {
    if (!user) return;

    // Simulate incoming payments every 30 seconds
    const interval = setInterval(() => {
       // Only simulate if a customer is selected to see the effect instantly
       if (selectedId && Math.random() > 0.7) {
          setCustomers(prev => prev.map(c => {
             if (c.id === selectedId) {
                // Generate a random incoming payment
                const incomingAmount = Math.floor(Math.random() * 5000) + 1000;
                const newTx: Transaction = {
                   id: `rx_auto_${Date.now()}`,
                   type: 'credit',
                   unit: 'money',
                   amount: incomingAmount,
                   method: 'upi',
                   description: 'Auto-Reconciled: UPI Payment Received',
                   date: new Date().toISOString().split('T')[0],
                   staffId: 'sys_bot',
                   balanceAfter: 0,
                   particular: `UPI/${Math.floor(Math.random()*99999)}`
                };
                
                const newTransactions = [...c.transactions, newTx];
                const recalculated = recalculateBalance(newTransactions);
                const finalMoneyBal = recalculated.filter(t => (t.unit || 'money') === 'money').pop()?.balanceAfter ?? 0;
                
                setSystemLogs(prevLogs => [...prevLogs, `WEBHOOK_EVENT: Payment of ₹${incomingAmount} received for ${c.name}`]);
                
                return {
                   ...c,
                   transactions: recalculated,
                   currentBalance: finalMoneyBal
                };
             }
             return c;
          }));
       }
    }, 10000); // Check every 10s for "server" updates

    return () => clearInterval(interval);
  }, [user, selectedId]);

  // --- ACTIONS (Handlers) ---
  const handleCommitEntry = (entry: any) => {
    if (!activeCustomer) return;
    
    if (editingTransaction) {
       const updatedTx: Transaction = {
         ...editingTransaction,
         type: entry.type,
         unit: entry.unit || 'money',
         amount: parseFloat(entry.amount),
         date: entry.date, // Use edited date from form
         method: entry.method,
         description: entry.description,
       };

       setCustomers(prev => prev.map(c => {
         if (c.id === selectedId) {
            const updatedTransactions = c.transactions.map(t => t.id === editingTransaction.id ? updatedTx : t);
            const recalculated = recalculateBalance(updatedTransactions);
            
            const finalMoneyBal = recalculated.filter(t => (t.unit || 'money') === 'money').pop()?.balanceAfter ?? 0;
            const finalGoldBal = recalculated.filter(t => t.unit === 'gold').pop()?.balanceAfter ?? 0;

            return { 
                ...c, 
                transactions: recalculated, 
                currentBalance: finalMoneyBal,
                currentGoldBalance: finalGoldBal 
            };
         }
         return c;
       }));
       setSystemLogs(prev => [...prev, `LEDGER_UPDATE: Ref ${editingTransaction.id} modified. Re-indexed.`]);
    } else {
       const newTx: Transaction = {
        id: generateUniqueRef('TX'),
        type: entry.type,
        unit: entry.unit || 'money',
        amount: parseFloat(entry.amount),
        method: entry.method,
        description: entry.description,
        date: entry.date || new Date().toISOString().split('T')[0], // Use provided date or fallback
        staffId: user?.id || 'sys',
        balanceAfter: 0
      };

      setCustomers(prev => prev.map(c => {
        if (c.id === selectedId) {
           const newTransactions = [...c.transactions, newTx];
           const recalculated = recalculateBalance(newTransactions);
           
           const finalMoneyBal = recalculated.filter(t => (t.unit || 'money') === 'money').pop()?.balanceAfter ?? 0;
           const finalGoldBal = recalculated.filter(t => t.unit === 'gold').pop()?.balanceAfter ?? 0;

           return { 
               ...c, 
               transactions: recalculated, 
               currentBalance: finalMoneyBal,
               currentGoldBalance: finalGoldBal,
               lastTxDate: newTx.date > c.lastTxDate ? newTx.date : c.lastTxDate // Update lastTx only if new date is newer
           };
        }
        return c;
      }));
      setSystemLogs(prev => [...prev, `LEDGER_COMMIT: ${entry.type.toUpperCase()} recorded for ${activeCustomer.name} on ${entry.date}`]);
    }

    setIsEntryModalOpen(false);
    setEditingTransaction(null);
    setEntryDefaults(null);
  };

  const handleDeleteTransaction = (txId: string) => {
     if(!selectedId) return;
     if(!window.confirm("Are you sure you want to void this transaction? This action is logged.")) return;

     setCustomers(prev => prev.map(c => {
        if(c.id === selectedId) {
           const filtered = c.transactions.filter(t => t.id !== txId);
           const recalculated = recalculateBalance(filtered);
           
           const fMoney = recalculated.filter(t => t.unit === 'money').pop()?.balanceAfter ?? 0;
           const fGold = recalculated.filter(t => t.unit === 'gold').pop()?.balanceAfter ?? 0;

           return { 
               ...c, 
               transactions: recalculated, 
               currentBalance: fMoney,
               currentGoldBalance: fGold 
           };
        }
        return c;
     }));
     setSystemLogs(prev => [...prev, `LEDGER_VOID: Transaction ${txId} removed from active ledger.`]);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEntryDefaults(null);
    setIsEntryModalOpen(true);
  };

  const handleUpdateProfile = (updates: Partial<Customer>) => {
    if (!selectedId) return;
    setCustomers(prev => prev.map(c => {
       if (c.id === selectedId) {
          // Logic: If contacts or addresses are updated, we must also sync the primary one to the root 'phone' and 'address' fields
          // This ensures backward compatibility with views that use c.phone/c.address
          let syncUpdates = { ...updates };
          
          if (updates.contactList) {
             const primary = updates.contactList.find(c => c.isPrimary);
             if (primary) syncUpdates.phone = primary.value;
          }

          if (updates.addressList) {
             const primary = updates.addressList.find(a => a.isPrimary);
             if (primary) syncUpdates.address = primary.value;
          }

          return { ...c, ...syncUpdates };
       }
       return c;
    }));
    setIsEditModalOpen(false);
    setSystemLogs(prev => [...prev, `PROFILE_UPDATE: ${activeCustomer?.name} configuration modified.`]);
  };

  // --- NEW: Deepvue Intelligence Persistence ---
  const updateCustomerDeepvueData = (customerId: string, data: Partial<DeepvueInsight>) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const existing = c.deepvueInsights || {
           kycStatus: 'PENDING',
           riskScore: 0,
           creditScore: 0,
           financialPropensity: 'LOW',
           associatedEntities: [],
           gstFilingStatus: 'UNKNOWN',
           lastRefresh: new Date().toISOString(),
           verifiedDocuments: [],
           library: { contacts: [], addresses: [], bankAccounts: [], loans: [], rcDetails: [], dlDetails: [], uanDetails: [], creditEnquiries: [] }
        } as DeepvueInsight;

        // Intelligent Deep Merge
        // For arrays, we append new items if they don't exist (avoid duplicates)
        // For objects, we merge
        const mergedLibrary = { 
           ...existing.library, 
           ...(data.library || {}),
           // Explicitly merge arrays to prevent overwrite if only one is passed
           contacts: data.library?.contacts ? [...(existing.library.contacts), ...(data.library.contacts.filter(nc => !existing.library.contacts.some(ec => ec.value === nc.value)))] : existing.library.contacts,
           // Add similar logic for other arrays if needed, simplified here:
           bankAccounts: data.library?.bankAccounts ? [...existing.library.bankAccounts, ...data.library.bankAccounts] : existing.library.bankAccounts,
           loans: data.library?.loans ? [...existing.library.loans, ...data.library.loans] : existing.library.loans,
           rcDetails: data.library?.rcDetails ? [...(existing.library.rcDetails || []), ...data.library.rcDetails] : existing.library.rcDetails,
           uanDetails: data.library?.uanDetails ? [...(existing.library.uanDetails || []), ...data.library.uanDetails] : existing.library.uanDetails,
        };
        
        // Merge verified documents
        const mergedDocs = data.verifiedDocuments 
           ? [...(existing.verifiedDocuments || []), ...data.verifiedDocuments]
           : existing.verifiedDocuments;

        return {
           ...c,
           deepvueInsights: {
              ...existing,
              ...data,
              library: mergedLibrary,
              verifiedDocuments: mergedDocs,
              lastRefresh: new Date().toISOString()
           }
        };
      }
      return c;
    }));
    setSystemLogs(prev => [...prev, `DATA_INGEST: Forensic library updated for customer ${customerId}`]);
  };

  // --- NEW: Set Primary Mechanism ---
  const setPrimaryContact = (customerId: string, contactValue: string) => {
     setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
           const updatedList = c.contactList.map(contact => ({
              ...contact,
              isPrimary: contact.value === contactValue
           }));
           return { ...c, contactList: updatedList, phone: contactValue };
        }
        return c;
     }));
     setSystemLogs(prev => [...prev, `PROFILE_UPDATE: Primary contact changed for ${customerId}`]);
  };

  const handleAiInquiry = async () => {
    if (!activeCustomer) return;
    setIsAiLoading(true);
    // Pass call logs to Gemini for improved context
    const strategy = await generateEnterpriseStrategy(activeCustomer, callLogs);
    setAiStrategy(strategy);
    setIsAiLoading(false);
  };

  const navigateToCustomer = (id: string) => {
    setSelectedId(id);
    setActiveView('view-customer');
  };

  const resetCustomerView = () => {
    setAiStrategy(null);
    setActiveView('customers');
  };

  const handleAddCallLog = (log: CommunicationLog) => {
    setCallLogs(prev => [log, ...prev]);
    // Update customer last call date
    setCustomers(prev => prev.map(c => {
      if (c.id === log.customerId) {
        return { ...c, lastCallDate: log.timestamp.split('T')[0] };
      }
      return c;
    }));
    setSystemLogs(prev => [...prev, `CALL_LOG: Voice interaction recorded for customer ${log.customerId}`]);
  };

  const enrichCustomerData = async () => {
    if (!activeCustomer) return;
    setIsAiLoading(true);
    
    // Extract Credentials from Integration State
    const deepvueNode = integrations.find(n => n.id === 'deepvue');
    const clientId = deepvueNode?.fields.find(f => f.key === 'client_id')?.value;
    const clientSecret = deepvueNode?.fields.find(f => f.key === 'client_secret')?.value;

    try {
      const insights = await deepvueService.fetchInsights(
          activeCustomer.phone, 
          activeCustomer.taxNumber || '',
          (clientId && clientSecret) ? { clientId, clientSecret } : undefined
      );
      
      setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, deepvueInsights: insights } : c));
      setSystemLogs(prev => [...prev, `DEEPVUE_SYNC: Forensic data acquired for ${activeCustomer.name}`]);
    } catch (e) {
      console.error(e);
      setSystemLogs(prev => [...prev, `DEEPVUE_ERROR: Failed to acquire forensic data.`]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const logFingerprint = (customerId: string, fp: DigitalFingerprint) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { 
          ...c, 
          fingerprints: [fp, ...c.fingerprints],
          paymentLinkStats: { 
             ...c.paymentLinkStats, 
             totalOpens: c.paymentLinkStats.totalOpens + 1,
             lastOpened: fp.timestamp
          }
        };
      }
      return c;
    }));
    setSystemLogs(prev => [...prev, `DIGITAL_FINGERPRINT: ${fp.eventType} detected from ${fp.ipAddress}`]);
  };

  const updateIntegrationConfig = (nodeId: string, fields: IntegrationField[]) => {
    setIntegrations(prev => prev.map(node => 
       node.id === nodeId ? { ...node, fields } : node
    ));
    setSystemLogs(prev => [...prev, `CONFIG_UPDATE: Credentials updated for node ${nodeId.toUpperCase()}.`]);
  };

  const addCustomer = (data: any) => {
    const newId = `c${Date.now()}`;
    const openingBalance = parseFloat(data.openingBalance) || 0;
    
    // Create initial transaction if balance > 0
    const transactions = [];
    if (openingBalance > 0) {
        transactions.push({
            id: `tx_init_${Date.now()}`,
            type: 'debit',
            unit: 'money',
            amount: openingBalance,
            method: 'adjustment',
            description: 'Opening Balance Carry Forward',
            date: new Date().toISOString().split('T')[0],
            staffId: user?.id || 'sys',
            balanceAfter: openingBalance,
            particular: 'OB-001'
        });
    }

    const newCustomer: Customer = {
        id: newId,
        name: data.name,
        phone: data.phone,
        groupId: data.groupId,
        taxNumber: data.taxNumber,
        email: '',
        address: '',
        contactList: [
           { id: `cnt_${Date.now()}`, type: 'mobile', value: data.phone, isPrimary: true, source: 'MANUAL', label: 'Primary' }
        ],
        addressList: [],
        uniquePaymentCode: `${data.name.substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        grade: CustomerGrade.A, // Default safe grade
        currentBalance: openingBalance,
        currentGoldBalance: 0,
        lastTxDate: new Date().toISOString().split('T')[0],
        status: openingBalance > 0 ? 'active' : 'settled',
        isActive: true,
        creditLimit: 50000,
        paymentLinkStats: { totalOpens: 0 },
        enabledGateways: { razorpay: true, setu: true },
        // Use undefined for optional dates to avoid logic errors with empty strings
        lastWhatsappDate: undefined,
        lastSmsDate: undefined,
        transactions: transactions as any,
        fingerprints: []
    };

    setCustomers(prev => [newCustomer, ...prev]);
    setSystemLogs(prev => [...prev, `ENTITY_CREATION: New node ${newCustomer.name} (${newCustomer.id}) initialized.`]);
  };

  // --- EXPORT ---
  return {
    state: {
      user, activeView, expandedMenus, customers, templates, selectedId, 
      aiStrategy, searchTerm, filterGrade, systemLogs, gradeRules, callLogs,
      integrations, whatsappLogs,
      isEntryModalOpen, isEditModalOpen, editingTransaction, isAiLoading, isMobileMenuOpen,
      entryDefaults, // EXPOSED
      isAdmin, activeCustomer, behavior, filteredCustomers
    },
    actions: {
      setUser, setActiveView, setExpandedMenus, setCustomers, setTemplates, 
      setSearchTerm, setFilterGrade, setIsEntryModalOpen, setIsEditModalOpen, 
      setEditingTransaction, setIsMobileMenuOpen, setGradeRules, setEntryDefaults, // EXPOSED
      handleCommitEntry, handleDeleteTransaction, openEditModal, handleUpdateProfile,
      handleAiInquiry, navigateToCustomer, resetCustomerView, handleAddCallLog,
      enrichCustomerData, logFingerprint, updateIntegrationConfig, addCustomer,
      setWhatsappLogs, updateCustomerDeepvueData, setPrimaryContact
    }
  };
};
