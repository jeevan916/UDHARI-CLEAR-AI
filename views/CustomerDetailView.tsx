import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Wallet, Scale, History, User, 
  BrainCircuit, Fingerprint, Plus, Activity, Share2, Phone, 
  MapPin, Hash, ArrowUpRight, ArrowDownLeft, BookOpen, CheckCircle2, UserCircle, CreditCard, Globe, ScanFace, Edit2, Tag, ChevronDown, ChevronUp
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
  customer, behavior, aiStrategy, isAdmin, onBack, onAi, onAddEntry, onEditProfile, onDeleteTransaction, onEditTransaction, onEnrich, onUpdateDeepvue, callLogs = [], whatsappLogs = []
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

  const combinedLogs = [...callLogs, ...(whatsappLogs || [])]
    .filter(l => l.customerId === activeCustomer.id)
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-300 relative overflow-hidden">
      
      {/* Sticky Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm shrink-0">
         <div className="flex items-center gap-3 overflow-hidden flex-1">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
               <ArrowLeft size={18}/>
            </button>
            <div className="flex flex-col min-w-0">
               <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 truncate">{activeCustomer.name}</h1>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${behavior.score > 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                     Grade {behavior.calculatedGrade}
                  </span>
               </div>
               <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  <span className="flex items-center gap-1"><Phone size={8}/> {activeCustomer.phone}</span>
                  <span className="flex items-center gap-1"><Hash size={8}/> {activeCustomer.uniquePaymentCode}</span>
               </div>
            </div>
         </div>
         <button onClick={() => setIsLinkModalOpen(true)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
            <Share2 size={16}/>
         </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Balance Overview Card */}
        <div className="p-4">
           <div className="bg-slate-900 text-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div 
                 onClick={() => setIsBalancesExpanded(!isBalancesExpanded)}
                 className="p-6 flex justify-between items-center cursor-pointer active:bg-slate-800 transition-colors"
              >
                  <div className="flex items-center gap-8">
                     <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Exposure</p>
                        <p className="text-2xl font-black tabular-nums">{formatCurrency(activeCustomer.currentBalance)}</p>
                     </div>
                     <div className="w-px h-10 bg-white/10"></div>
                     <div>
                        <p className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest mb-1">Vault Gold</p>
                        <p className="text-lg font-bold tabular-nums text-amber-400">{formatGold(activeCustomer.currentGoldBalance)}</p>
                     </div>
                  </div>
                  <div className="text-slate-500">
                     {isBalancesExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </div>
              </div>

              {isBalancesExpanded && (
                 <div className="px-6 pb-6 pt-0 border-t border-white/5 bg-slate-900/50 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-6 py-6">
                       <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Credit Capacity</p>
                          <p className="text-sm font-mono text-slate-300">₹{activeCustomer.creditLimit?.toLocaleString()}</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">999 Net Equiv.</p>
                          <p className="text-sm font-mono text-amber-200/80">{formatGold(activeCustomer.currentGoldBalance * 0.916)}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => onAddEntry({ type: 'debit', unit: 'money' })} className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl hover:bg-rose-500/20 transition-all">
                          <span className="text-[10px] font-black text-rose-400 uppercase">New Debit</span>
                          <ArrowUpRight size={14}/>
                       </button>
                       <button onClick={() => onAddEntry({ type: 'credit', unit: 'money' })} className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all">
                          <span className="text-[10px] font-black text-emerald-400 uppercase">New Credit</span>
                          <ArrowDownLeft size={14}/>
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md px-4 py-2">
           <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'ledger', icon: History, label: 'Ledger' },
                { id: 'library', icon: BookOpen, label: 'Library' },
                { id: 'insight', icon: BrainCircuit, label: 'Insight' },
                { id: 'profile', icon: User, label: 'Profile' },
                { id: 'digital', icon: Fingerprint, label: 'Trace' }
              ].map((t) => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTab(t.id as Tab)} 
                  className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <t.icon size={12}/> {t.label}
                </button>
              ))}
           </div>
        </nav>

        {/* Tab Content Display */}
        <div className="p-4 pb-32">
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
                 <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-200 shadow-xl">
                    <BookOpen size={48} className="text-slate-200 mx-auto mb-4"/>
                    <h3 className="text-lg font-black uppercase text-slate-800">Intelligence Offline</h3>
                    <p className="text-xs text-slate-400 mt-2 mb-8">No forensics library found for this entity.</p>
                    <button onClick={onEnrich} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">Fetch Forensic Profile</button>
                 </div>
              )
           )}

           {activeTab === 'insight' && (
              <div className="space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-black uppercase text-slate-800 text-xs flex items-center gap-2">
                          <BrainCircuit size={16} className="text-blue-500"/> Cortex Analysis
                       </h3>
                       <button onClick={onAi} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100">Run Engine</button>
                    </div>
                    {aiStrategy ? (
                       <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5"><BrainCircuit size={80}/></div>
                          <p className="text-sm font-medium text-blue-900 leading-relaxed italic">"{aiStrategy.analysis}"</p>
                          <div className="mt-4 pt-4 border-t border-blue-200/50 flex justify-between items-center">
                             <div>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Recommended Path</p>
                                <p className="text-xs font-black text-blue-700 mt-1 uppercase">{aiStrategy.recommendedAction}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Recovery Odds</p>
                                <p className="text-sm font-black text-blue-800">{Math.round(aiStrategy.riskScore)}%</p>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting AI Handshake</p>
                       </div>
                    )}
                 </div>
                 <GradeWidget customer={activeCustomer} grade={behavior.calculatedGrade} />
                 <CommunicationWidget logs={combinedLogs} />
              </div>
           )}

           {activeTab === 'profile' && (
              <div className="space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row gap-8 items-center relative">
                    <button onClick={onEditProfile} className="absolute top-6 right-6 p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-200 transition-all">
                       <Edit2 size={16}/>
                    </button>
                    <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 shadow-inner border border-slate-200">
                       <UserCircle size={48}/>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                       <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activeCustomer.name}</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{activeCustomer.groupId}</p>
                       <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                          {(activeCustomer.tags || []).map((tag, i) => (
                             <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-200">
                                <Tag size={8} className="inline mr-1"/> {tag}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-black uppercase text-slate-400 text-[10px] tracking-widest px-2 flex items-center gap-2">
                       <ScanFace size={14}/> Security Gateways
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${activeCustomer.enabledGateways.razorpay ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 border-blue-500' : 'bg-white text-slate-400 border-slate-100'}`}>
                          <div className="flex items-center gap-4">
                             <CreditCard size={20}/>
                             <span className="text-[10px] font-black uppercase tracking-widest">Razorpay Hub</span>
                          </div>
                          {activeCustomer.enabledGateways.razorpay && <CheckCircle2 size={16} className="text-blue-200"/>}
                       </div>
                       <div className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${activeCustomer.enabledGateways.setu ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 border-emerald-400' : 'bg-white text-slate-400 border-slate-100'}`}>
                          <div className="flex items-center gap-4">
                             <Globe size={20}/>
                             <span className="text-[10px] font-black uppercase tracking-widest">Setu Intent</span>
                          </div>
                          {activeCustomer.enabledGateways.setu && <CheckCircle2 size={16} className="text-emerald-200"/>}
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

      {/* Primary Action Trigger */}
      <button 
         onClick={() => onAddEntry()}
         className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] border-4 border-white"
      >
         <Plus size={28}/>
      </button>

      <SharePaymentLinkModal 
         isOpen={isLinkModalOpen}
         onClose={() => setIsLinkModalOpen(false)}
         customer={activeCustomer}
      />
    </div>
  );
};