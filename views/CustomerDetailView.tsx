import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Wallet, Scale, History, User, 
  BrainCircuit, Fingerprint, Plus, Activity, Share2, Phone, MessageSquare, ChevronDown, ChevronUp,
  MapPin, Hash, ArrowUpRight, ArrowDownLeft, BookOpen, CheckCircle2, UserCircle, CreditCard, Globe, Calendar, Briefcase, Tag, ScanFace, Copy, Edit2, Star
} from 'lucide-react';
import { Customer, AiStrategy, Transaction, CommunicationLog, TransactionType, TransactionUnit, DeepvueInsight } from '../types';
import { DigitalFingerprintPanel } from '../components/DigitalFingerprintPanel';
import { LedgerPanel } from '../components/widgets/LedgerPanel';
import { CommunicationWidget } from '../components/widgets/CommunicationWidget';
import { GradeWidget } from '../components/widgets/GradeWidget';
import { SharePaymentLinkModal } from '../components/SharePaymentLinkModal';
import { DeepvueLibraryPanel } from '../components/DeepvueLibraryPanel';
import { formatCurrency, formatGold } from '../utils/debtUtils';

interface CustomerDetailViewProps {
  customer: Customer;
  behavior: any;
  aiStrategy: AiStrategy | null;
  isAdmin: boolean;
  onBack: () => void;
  onAi: () => void;
  onAddEntry: (defaults?: { type?: TransactionType, unit?: TransactionUnit }) => void;
  onEditProfile: () => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onEnrich: () => void;
  onUpdateDeepvue: (customerId: string, data: Partial<DeepvueInsight>) => void;
  onSetPrimaryContact: (customerId: string, value: string) => void;
  callLogs?: CommunicationLog[]; 
  whatsappLogs?: CommunicationLog[]; 
}

type Tab = 'ledger' | 'insight' | 'profile' | 'digital' | 'library';

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ 
  customer, behavior, aiStrategy, isAdmin, onBack, onAi, onAddEntry, onEditProfile, onDeleteTransaction, onEditTransaction, onEnrich, onUpdateDeepvue, onSetPrimaryContact, callLogs = [], whatsappLogs = []
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('ledger');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isBalancesExpanded, setIsBalancesExpanded] = useState(false);
  
  const [activeCustomer, setActiveCustomer] = useState(customer);

  useEffect(() => {
     setActiveCustomer(customer);
  }, [customer]);

  const handleDeepvueUpdate = (updates: Partial<DeepvueInsight>) => {
     onUpdateDeepvue(activeCustomer.id, updates);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const combinedLogs = [...callLogs, ...(whatsappLogs || [])]
    .filter(l => l.customerId === activeCustomer.id)
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Merge Contacts for Unified View
  const manualContacts = activeCustomer.contactList || [{ id: 'init', type: 'mobile', value: activeCustomer.phone, isPrimary: true, source: 'MANUAL' }];
  const discoveredContacts = activeCustomer.deepvueInsights?.library?.contacts.map(c => ({
     id: `dv_${c.value}`,
     type: c.type,
     value: c.value,
     isPrimary: false,
     source: 'DEEPVUE_IMPORT',
     label: c.ownerName
  })) || [];

  const unifiedContacts = [...manualContacts];
  discoveredContacts.forEach(dc => {
     if (!unifiedContacts.some(mc => mc.value === dc.value)) {
        unifiedContacts.push(dc as any);
     }
  });

  const addresses = activeCustomer.addressList || (activeCustomer.address ? [{ id: 'init', type: 'registered', value: activeCustomer.address, isPrimary: true }] : []);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-in slide-in-from-right duration-300 relative overflow-hidden">
      
      {/* 1. Sticky Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-4 py-2 flex justify-between items-center shadow-sm shrink-0">
         <div className="flex items-center gap-2 overflow-hidden flex-1">
            <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors shrink-0">
               <ArrowLeft size={18}/>
            </button>
            <div className="flex flex-col overflow-hidden w-full pr-2">
               <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black uppercase tracking-tighter text-slate-900 leading-none truncate max-w-[200px]">{activeCustomer.name}</h1>
                  <span className={`text-[8px] font-black px-1 py-px rounded border uppercase shrink-0 ${behavior.score > 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                     Grade {behavior.calculatedGrade}
                  </span>
               </div>
               <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap">
                  <span className="flex items-center gap-1"><Phone size={8}/> {activeCustomer.phone}</span>
                  <span className="w-px h-3 bg-slate-200"></span>
                  <span className="flex items-center gap-1 truncate max-w-[100px]"><MapPin size={8}/> {activeCustomer.address || 'No Address'}</span>
                  <span className="w-px h-3 bg-slate-200"></span>
                  <span className="flex items-center gap-1"><Hash size={8}/> {activeCustomer.uniquePaymentCode}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setIsLinkModalOpen(true)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
               <Share2 size={16}/>
            </button>
         </div>
      </div>

      {/* Main Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* 2. Hero Section */}
        <div className="px-4 pt-4 pb-2">
           <div className={`bg-slate-900 text-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 ${isBalancesExpanded ? 'ring-1 ring-slate-700' : ''}`}>
              <div 
                 onClick={() => setIsBalancesExpanded(!isBalancesExpanded)}
                 className="p-4 flex justify-between items-center cursor-pointer active:bg-slate-800 transition-colors"
              >
                  <div className="flex items-center gap-4 flex-1">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Net Outstanding</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xl font-black tracking-tight tabular-nums">{formatCurrency(activeCustomer.currentBalance)}</span>
                           <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${activeCustomer.currentBalance > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                             {activeCustomer.currentBalance > 0 ? 'DR' : 'CR'}
                           </span>
                        </div>
                     </div>
                     <div className="w-px h-8 bg-white/10"></div>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-wider">Gold (22k)</span>
                        <span className="text-sm font-bold tracking-tight tabular-nums text-amber-400">{formatGold(activeCustomer.currentGoldBalance)}</span>
                     </div>
                  </div>
                  <div className="text-slate-400">
                     {isBalancesExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </div>
              </div>

              {isBalancesExpanded && (
                 <div className="px-4 pb-4 pt-0 border-t border-white/5 bg-slate-900 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4 py-4 border-b border-white/5">
                       <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Credit Limit</p>
                          <p className="text-xs font-mono text-slate-300">₹{activeCustomer.creditLimit?.toLocaleString()}</p>
                       </div>
                       <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">999 Equivalent</p>
                          <p className="text-xs font-mono text-amber-200/80">{formatGold(activeCustomer.currentGoldBalance * 0.916)}</p>
                       </div>
                    </div>
                    
                    <div className="pt-4">
                       <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-1">
                          <Plus size={8} className="border border-slate-500 rounded-full"/> Quick Entry
                       </p>
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => onAddEntry({ type: 'debit', unit: 'money' })} className="flex items-center justify-between px-3 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl transition-colors hover:bg-rose-500/20">
                             <span className="text-[9px] font-black text-rose-400 uppercase">Debit (₹)</span>
                             <ArrowUpRight size={12} className="text-rose-400"/>
                          </button>
                          <button onClick={() => onAddEntry({ type: 'credit', unit: 'money' })} className="flex items-center justify-between px-3 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl transition-colors hover:bg-emerald-500/20">
                             <span className="text-[9px] font-black text-emerald-400 uppercase">Credit (₹)</span>
                             <ArrowDownLeft size={12} className="text-emerald-400"/>
                          </button>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* 3. Tab Bar (Sticky) */}
        <div className="sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-md px-4 py-2">
           <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar gap-1">
              {[
                { id: 'ledger', icon: History, label: 'Ledger' },
                { id: 'library', icon: BookOpen, label: 'Library' },
                { id: 'insight', icon: BrainCircuit, label: 'Insight' },
                { id: 'profile', icon: User, label: 'Profile' },
                { id: 'digital', icon: Fingerprint, label: 'Digital' }
              ].map((t) => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTab(t.id as Tab)} 
                  className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === t.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <t.icon size={12}/> {t.label}
                </button>
              ))}
           </div>
        </div>

        {/* 4. Tab Content */}
        <div className="px-4 py-4 pb-32">
           {activeTab === 'ledger' && (
              <LedgerPanel 
                 customer={activeCustomer}
                 onAddEntry={() => onAddEntry()}
                 onEditTransaction={onEditTransaction}
                 onDeleteTransaction={onDeleteTransaction}
                 embedded={true} 
              />
           )}

           {activeTab === 'library' && (
              activeCustomer.deepvueInsights?.library ? (
                 <DeepvueLibraryPanel 
                    insight={activeCustomer.deepvueInsights} 
                    customerName={activeCustomer.name}
                    customerPhone={activeCustomer.phone}
                    onUpdate={handleDeepvueUpdate}
                 />
              ) : (
                 <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] border border-slate-100 text-center">
                    <BookOpen size={48} className="text-slate-200 mb-4"/>
                    <h3 className="text-lg font-black uppercase text-slate-800">Library Empty</h3>
                    <button onClick={onEnrich} className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Fetch Intelligence</button>
                 </div>
              )
           )}

           {activeTab === 'insight' && (
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-black uppercase text-slate-800 text-xs flex items-center gap-2"><BrainCircuit size={14} className="text-blue-500"/> AI Cortex Analysis</h3>
                       <button onClick={onAi} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase hover:bg-blue-100">Sync Engine</button>
                    </div>
                    {aiStrategy ? (
                       <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-xs font-bold text-blue-900 leading-relaxed">"{aiStrategy.analysis}"</p>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                             <p className="text-[9px] font-black text-blue-400 uppercase">Strategy Path</p>
                             <p className="text-xs font-bold text-blue-700 mt-1">{aiStrategy.recommendedAction}</p>
                          </div>
                       </div>
                    ) : (
                       <div className="text-center p-6 text-slate-400 text-[10px] font-bold uppercase bg-slate-50 rounded-2xl border border-dashed">
                          No active reasoning cached.
                       </div>
                    )}
                 </div>
                 <GradeWidget customer={activeCustomer} grade={behavior.calculatedGrade} />
                 <CommunicationWidget logs={combinedLogs} />
              </div>
           )}

           {activeTab === 'profile' && (
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center relative">
                    <button onClick={onEditProfile} className="absolute top-6 right-6 p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors border">
                       <Edit2 size={16}/>
                    </button>
                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-slate-300 shrink-0 border">
                       <UserCircle size={40}/>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                       <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{activeCustomer.name}</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{activeCustomer.groupId}</p>
                       <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                          {(activeCustomer.tags || []).map((tag, i) => (
                             <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Tag size={8}/> {tag}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-black uppercase text-slate-800 text-[10px] mb-1 px-2 flex items-center gap-2">
                       <ScanFace size={14} className="text-blue-600"/> Infrastructure Gateways
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                       <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeCustomer.enabledGateways.razorpay ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          <div className="flex items-center gap-3">
                             <CreditCard size={18}/>
                             <span className="text-[10px] font-black uppercase">Razorpay Gateway</span>
                          </div>
                          {activeCustomer.enabledGateways.razorpay && <CheckCircle2 size={14}/>}
                       </div>
                       <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeCustomer.enabledGateways.setu ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          <div className="flex items-center gap-3">
                             <Globe size={18}/>
                             <span className="text-[10px] font-black uppercase">Setu UPI Intent</span>
                          </div>
                          {activeCustomer.enabledGateways.setu && <CheckCircle2 size={14}/>}
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'digital' && (
              <DigitalFingerprintPanel customer={activeCustomer} isAdmin={isAdmin} onEnrich={onEnrich} />
           )}
        </div>
      </div>

      {/* 5. Fixed Actions */}
      <button 
         onClick={() => onAddEntry()}
         className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white"
      >
         <Plus size={24}/>
      </button>

      <SharePaymentLinkModal 
         isOpen={isLinkModalOpen}
         onClose={() => setIsLinkModalOpen(false)}
         customer={activeCustomer}
      />
    </div>
  );
};