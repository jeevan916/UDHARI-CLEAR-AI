
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Wallet, Scale, History, User, 
  BrainCircuit, Fingerprint, Plus, Activity, Share2, Phone, MessageSquare, ChevronDown, ChevronUp,
  MapPin, Hash, ArrowUpRight, ArrowDownLeft, BookOpen, CheckCircle2, UserCircle, CreditCard, Globe, Calendar, Briefcase, Tag, ScanFace, Copy, Edit2, ShieldAlert, Star
} from 'lucide-react';
import { Customer, AiStrategy, Transaction, CommunicationLog, TransactionType, TransactionUnit, DeepvueLibrary, DeepvueInsight } from '../types';
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
  const [lastSync, setLastSync] = useState(new Date());
  
  const [activeCustomer, setActiveCustomer] = useState(customer);

  useEffect(() => {
     setActiveCustomer(customer);
  }, [customer]);

  useEffect(() => {
    const interval = setInterval(() => {
       setLastSync(new Date());
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

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
  const manualContacts = activeCustomer.contactList || [{ type: 'mobile', value: activeCustomer.phone, isPrimary: true, source: 'MANUAL' }];
  const discoveredContacts = activeCustomer.deepvueInsights?.library?.contacts.map(c => ({
     id: `dv_${c.value}`,
     type: c.type,
     value: c.value,
     isPrimary: false, // Discovered are never primary by default until user promotes them
     source: 'DEEPVUE_IMPORT',
     label: c.ownerName
  })) || [];

  // Deduplicate based on value
  const unifiedContacts = [...manualContacts];
  discoveredContacts.forEach(dc => {
     if (!unifiedContacts.some(mc => mc.value === dc.value)) {
        unifiedContacts.push(dc as any);
     }
  });

  const addresses = activeCustomer.addressList || (activeCustomer.address ? [{ type: 'registered', value: activeCustomer.address, isPrimary: true }] : []);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-in slide-in-from-right duration-300 relative">
      
      {/* 1. Mobile-First Sticky Header (Compact & Detailed) */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-4 py-2 flex justify-between items-center shadow-sm shrink-0 min-h-[64px]">
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
                  <span className="text-[8px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                     <Activity size={8} className="animate-pulse text-emerald-500"/> Online
                  </span>
               </div>
               
               {/* Detail Row: Phone | Address | Ref */}
               <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight overflow-x-auto no-scrollbar whitespace-nowrap">
                  <span className="flex items-center gap-1"><Phone size={8}/> {activeCustomer.phone}</span>
                  <span className="w-0.5 h-3 bg-slate-200"></span>
                  <span className="flex items-center gap-1 truncate max-w-[100px]"><MapPin size={8}/> {activeCustomer.address || 'No Address'}</span>
                  <span className="w-0.5 h-3 bg-slate-200"></span>
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

      {/* 2. Collapsible Hero Section */}
      <div className="px-4 pt-3 pb-1 shrink-0">
         <div className={`bg-slate-900 text-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${isBalancesExpanded ? 'border border-slate-700' : ''}`}>
            {/* Summary Bar (Always Visible) */}
            <div 
               onClick={() => setIsBalancesExpanded(!isBalancesExpanded)}
               className="p-3 flex justify-between items-center cursor-pointer active:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-4 flex-1">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Net Outstanding</span>
                      <div className="flex items-center gap-2">
                         <span className="text-lg font-black tracking-tight tabular-nums">{formatCurrency(activeCustomer.currentBalance)}</span>
                         <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${activeCustomer.currentBalance > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                           {activeCustomer.currentBalance > 0 ? 'DR' : 'CR'}
                         </span>
                      </div>
                   </div>
                   <div className="w-px h-6 bg-white/10"></div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-wider">Gold (22k)</span>
                      <span className="text-sm font-bold tracking-tight tabular-nums text-amber-400">{formatGold(activeCustomer.currentGoldBalance)}</span>
                   </div>
                </div>
                <div className="text-slate-400 pl-2">
                   {isBalancesExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
            </div>

            {/* Expanded Details & Quick Actions */}
            {isBalancesExpanded && (
               <div className="px-3 pb-3 pt-0 border-t border-white/10 bg-slate-900 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-3 py-3 border-b border-white/5">
                     <div>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Credit Limit</p>
                        <p className="text-xs font-mono text-slate-300">₹{activeCustomer.creditLimit?.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Fine Gold Equivalent</p>
                        <p className="text-xs font-mono text-amber-200/80">{formatGold(activeCustomer.currentGoldBalance * 0.916)} (999)</p>
                     </div>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div className="pt-3">
                     <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-1">
                        <Plus size={8} className="border border-slate-500 rounded-full"/> Quick Entry
                     </p>
                     <div className="grid grid-cols-2 gap-2">
                        {/* Money Actions */}
                        <button 
                           onClick={() => onAddEntry({ type: 'debit', unit: 'money' })}
                           className="flex items-center justify-between px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors group"
                        >
                           <span className="text-[9px] font-black text-rose-400 uppercase">Debit (₹)</span>
                           <ArrowUpRight size={10} className="text-rose-400 group-hover:translate-x-0.5 transition-transform"/>
                        </button>
                        <button 
                           onClick={() => onAddEntry({ type: 'credit', unit: 'money' })}
                           className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors group"
                        >
                           <span className="text-[9px] font-black text-emerald-400 uppercase">Credit (₹)</span>
                           <ArrowDownLeft size={10} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform"/>
                        </button>

                        {/* Gold Actions */}
                        <button 
                           onClick={() => onAddEntry({ type: 'debit', unit: 'gold' })}
                           className="flex items-center justify-between px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors group"
                        >
                           <span className="text-[9px] font-black text-amber-400 uppercase">Debit (Gold)</span>
                           <ArrowUpRight size={10} className="text-amber-400 group-hover:translate-x-0.5 transition-transform"/>
                        </button>
                        <button 
                           onClick={() => onAddEntry({ type: 'credit', unit: 'gold' })}
                           className="flex items-center justify-between px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors group"
                        >
                           <span className="text-[9px] font-black text-amber-400 uppercase">Credit (Gold)</span>
                           <ArrowDownLeft size={10} className="text-amber-400 group-hover:translate-x-0.5 transition-transform"/>
                        </button>
                     </div>
                     <button 
                        onClick={() => onAddEntry()}
                        className="w-full mt-2 py-1.5 text-[8px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                     >
                        View Full Ledger <History size={8}/>
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* 3. Compact Tab Navigation */}
         <div className="sticky top-[64px] z-40 bg-[#F8FAFC]/95 backdrop-blur-md pt-2 pb-2 px-4 border-b border-slate-100/50 shadow-sm shrink-0">
            <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
               <button onClick={() => setActiveTab('ledger')} className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  <History size={10}/> Ledger
               </button>
               <button onClick={() => setActiveTab('library')} className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'library' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  <BookOpen size={10}/> Library
               </button>
               <button onClick={() => setActiveTab('insight')} className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'insight' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  <BrainCircuit size={10}/> Insight
               </button>
               <button onClick={() => setActiveTab('profile')} className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  <User size={10}/> Profile
               </button>
               <button onClick={() => setActiveTab('digital')} className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'digital' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Fingerprint size={10}/> Digital
               </button>
            </div>
         </div>

         {/* 4. Tab Content Area */}
         <div className="flex-1 overflow-y-auto px-4 py-3 pb-32 custom-scrollbar min-h-0">
            
            {activeTab === 'ledger' && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <LedgerPanel 
                     customer={activeCustomer}
                     onAddEntry={() => onAddEntry()}
                     onEditTransaction={onEditTransaction}
                     onDeleteTransaction={onDeleteTransaction}
                     embedded={true} 
                  />
               </div>
            )}

            {activeTab === 'library' && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {activeCustomer.deepvueInsights?.library ? (
                     <DeepvueLibraryPanel 
                        insight={activeCustomer.deepvueInsights} 
                        customerName={activeCustomer.name}
                        customerPhone={activeCustomer.phone}
                        onUpdate={handleDeepvueUpdate}
                     />
                  ) : (
                     <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] border border-slate-100 text-center">
                        <BookOpen size={48} className="text-slate-300 mb-4"/>
                        <h3 className="text-lg font-black uppercase text-slate-800">Library Empty</h3>
                        <p className="text-xs text-slate-500 mt-2 max-w-xs mb-6">No failover contacts or banking data found. Enrich profile to populate.</p>
                        <button onClick={onEnrich} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Fetch Intelligence</button>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'insight' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black uppercase text-slate-800 text-xs flex items-center gap-2"><BrainCircuit size={14} className="text-blue-500"/> AI Risk Strategy</h3>
                        <button onClick={onAi} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase hover:bg-blue-100 transition-colors">Run Analysis</button>
                     </div>
                     {aiStrategy ? (
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 relative">
                           <div className="absolute top-0 left-4 -translate-y-1/2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white">Gemini Report</div>
                           <p className="text-xs font-bold text-blue-900 leading-relaxed mt-1">"{aiStrategy.analysis}"</p>
                           <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-[9px] font-black text-blue-400 uppercase">Recommended Action</p>
                              <p className="text-xs font-bold text-blue-700 mt-1">{aiStrategy.recommendedAction}</p>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center p-6 text-slate-400 text-[10px] font-bold uppercase bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                           No active strategy generated.
                        </div>
                     )}
                  </div>

                  <GradeWidget customer={activeCustomer} grade={behavior.calculatedGrade} />
                  <CommunicationWidget logs={combinedLogs} />
               </div>
            )}

            {activeTab === 'profile' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* 1. Identity Card (Unified Hub) */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center relative">
                     <button 
                        onClick={onEditProfile} 
                        className="absolute top-6 right-6 p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-100 shadow-sm z-10"
                        title="Edit Profile"
                     >
                        <Edit2 size={18}/>
                     </button>

                     <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] overflow-hidden bg-slate-100 shrink-0 border-4 border-slate-50 shadow-inner">
                        {activeCustomer.profilePhoto ? (
                           <img src={activeCustomer.profilePhoto} alt={activeCustomer.name} className="w-full h-full object-cover"/>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <UserCircle size={48}/>
                           </div>
                        )}
                     </div>
                     <div className="flex-1 space-y-2">
                        <div className="pr-12">
                           <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeCustomer.name}</h2>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{activeCustomer.groupId}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                           {(activeCustomer.tags || []).map((tag, i) => (
                              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                 <Tag size={10}/> {tag}
                              </span>
                           ))}
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                           <div className="flex items-center gap-2 text-slate-500">
                              <Calendar size={14}/>
                              <div>
                                 <p className="text-[8px] font-black uppercase text-slate-300">Date of Birth</p>
                                 <p className="text-[10px] font-bold uppercase">{activeCustomer.birthDate || 'N/A'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 text-slate-500">
                              <Briefcase size={14}/>
                              <div>
                                 <p className="text-[8px] font-black uppercase text-slate-300">Reference</p>
                                 <p className="text-[10px] font-bold uppercase">{activeCustomer.reference || 'N/A'}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* 2. Unified Contact Intelligence */}
                     <div className="space-y-4">
                        <h3 className="font-black uppercase text-slate-800 text-xs mb-1 px-2 flex items-center gap-2">
                           <ScanFace size={14} className="text-blue-600"/> Unified Contact Intelligence
                        </h3>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                           {unifiedContacts.map((contact: any, i: number) => (
                              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${contact.source === 'MANUAL' ? 'bg-blue-50/50 border-blue-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                 <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${contact.source === 'MANUAL' ? 'bg-blue-600 text-white' : 'bg-white text-amber-500'}`}>
                                    <Phone size={16}/>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                       <p className={`text-[9px] font-bold uppercase flex items-center gap-2 ${contact.source === 'MANUAL' ? 'text-blue-500' : 'text-amber-600'}`}>
                                          {contact.label || contact.type} 
                                          {contact.source === 'DEEPVUE_IMPORT' && <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded text-[7px]">DISCOVERED</span>}
                                       </p>
                                       <button onClick={() => copyToClipboard(contact.value)} className="text-slate-300 hover:text-slate-500"><Copy size={12}/></button>
                                    </div>
                                    <p className="text-sm font-black text-slate-800 font-mono tracking-tight">{contact.value}</p>
                                 </div>
                                 
                                 {/* Set Primary Action */}
                                 <button 
                                    onClick={() => onSetPrimaryContact(activeCustomer.id, contact.value)}
                                    className={`p-2.5 rounded-xl transition-all border shrink-0 ${contact.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-300 border-slate-200 hover:border-blue-400 hover:text-blue-400'}`}
                                    title={contact.isPrimary ? "Primary Contact" : "Set as Primary"}
                                 >
                                    <Star size={16} fill={contact.isPrimary ? "currentColor" : "none"}/>
                                 </button>

                                 {/* WhatsApp Indicator */}
                                 {contact.type === 'mobile' && (
                                    <button 
                                       onClick={() => window.open(`https://wa.me/91${contact.value.replace(/\D/g, '').slice(-10)}`, '_blank')}
                                       className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors shrink-0 flex items-center gap-1"
                                       title="Open WhatsApp"
                                    >
                                       <MessageSquare size={16}/>
                                    </button>
                                 )}
                              </div>
                           ))}
                           {unifiedContacts.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No contact records found.</p>}
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                           <h3 className="font-black uppercase text-slate-400 text-[10px] tracking-widest mb-2 flex items-center gap-2">
                              <MapPin size={12}/> Registered Locations
                           </h3>
                           {addresses.map((addr: any, i: number) => (
                              <div key={i} className={`p-4 rounded-2xl border ${addr.isPrimary ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'}`}>
                                 <div className="flex justify-between items-start mb-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{addr.type} {addr.isPrimary && '(Primary)'}</p>
                                    {addr.isPrimary && <CheckCircle2 size={12} className="text-emerald-500"/>}
                                 </div>
                                 <p className="text-xs font-bold text-slate-700 leading-relaxed">{addr.value}</p>
                              </div>
                           ))}
                           {addresses.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No addresses on file.</p>}
                        </div>
                     </div>

                     {/* 3. Right Column: Compliance & Gateways */}
                     <div className="space-y-6">
                        <div className="space-y-4">
                           <h3 className="font-black uppercase text-slate-800 text-xs mb-1 px-2 flex items-center gap-2">
                              <Wallet size={14} className="text-emerald-600"/> Payment Infrastructure
                           </h3>
                           <div className="grid grid-cols-1 gap-4">
                              {/* Razorpay Card */}
                              <div className={`p-5 rounded-2xl border flex items-center justify-between ${activeCustomer.enabledGateways.razorpay ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
                                 <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${activeCustomer.enabledGateways.razorpay ? 'bg-white/20' : 'bg-white'}`}>
                                       <CreditCard size={20}/>
                                    </div>
                                    <div>
                                       <p className="text-sm font-black uppercase">Razorpay</p>
                                       <p className={`text-[9px] font-bold uppercase tracking-widest ${activeCustomer.enabledGateways.razorpay ? 'text-blue-200' : 'text-slate-400'}`}>Card & Netbanking</p>
                                    </div>
                                 </div>
                                 {activeCustomer.enabledGateways.razorpay && <div className="px-3 py-1 bg-white text-blue-600 rounded-lg text-[9px] font-black uppercase">Active</div>}
                              </div>

                              {/* Setu UPI Card */}
                              <div className={`p-5 rounded-2xl border flex items-center justify-between ${activeCustomer.enabledGateways.setu ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
                                 <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${activeCustomer.enabledGateways.setu ? 'bg-white/20' : 'bg-white'}`}>
                                       <Globe size={20}/>
                                    </div>
                                    <div>
                                       <p className="text-sm font-black uppercase">Setu UPI</p>
                                       <p className={`text-[9px] font-bold uppercase tracking-widest ${activeCustomer.enabledGateways.setu ? 'text-emerald-100' : 'text-slate-400'}`}>DeepLink Intent</p>
                                    </div>
                                 </div>
                                 {activeCustomer.enabledGateways.setu && <div className="px-3 py-1 bg-white text-emerald-600 rounded-lg text-[9px] font-black uppercase">Active</div>}
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                           <h3 className="font-black uppercase text-slate-800 text-xs mb-1">Tax & Compliance</h3>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">GSTIN / TAX ID</p>
                                 <p className="text-xs font-black text-slate-800 mt-1">{activeCustomer.taxNumber || 'N/A'}</p>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">System Node ID</p>
                                 <p className="text-xs font-black text-slate-800 mt-1">{activeCustomer.uniquePaymentCode}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'digital' && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <DigitalFingerprintPanel 
                     customer={activeCustomer} 
                     isAdmin={isAdmin} 
                     onEnrich={onEnrich} 
                  />
               </div>
            )}

         </div>

         {/* 5. Mobile Floating Action Button (FAB) */}
         <button 
            onClick={() => onAddEntry()}
            className="fixed bottom-6 right-5 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white"
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
