import React, { useState } from 'react';
import { 
  History, BookOpen, BrainCircuit
} from 'lucide-react';
import { Customer, AiStrategy, Transaction, CommunicationLog } from '../types';
import { LedgerPanel } from '../components/widgets/LedgerPanel';
import { DeepvueLibraryPanel } from '../components/DeepvueLibraryPanel';
import { DigitalFingerprintPanel } from '../components/DigitalFingerprintPanel';
import { CustomerHeader } from '../components/widgets/CustomerHeader';
import { CustomerProfileCard } from '../components/widgets/CustomerProfileCard';
import { GradeWidget } from '../components/widgets/GradeWidget';
import { CommunicationWidget } from '../components/widgets/CommunicationWidget';

interface CustomerDetailViewProps { 
  customer: Customer; 
  behavior: any; 
  isAdmin: boolean; 
  onBack: () => void; 
  onAi: () => Promise<AiStrategy | null>;
  onDeleteTransaction: (id: string) => void; 
  onEditTransaction: (tx: Transaction) => void;
  onEditProfile: () => void;
  onEnrich: () => void;
  onUpdateDeepvue: (data: any) => void;
  callLogs: CommunicationLog[];
  whatsappLogs: CommunicationLog[];
  onAddEntry: (defaults?: any) => void;
  onSetPrimaryContact: (id: string) => void;
  onShareLink: () => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ 
  customer, behavior, isAdmin, onBack, onAi, onDeleteTransaction, onEditTransaction,
  onEditProfile, onEnrich, onUpdateDeepvue, callLogs, whatsappLogs, onAddEntry, onShareLink
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'forensics' | 'cortex'>('ledger');
  const [aiData, setAiData] = useState<AiStrategy | null>(null);

  // Merge logs for the unified communication widget
  const allLogs = [...callLogs, ...whatsappLogs]
    .filter(l => l.customerId === customer.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const runCortexAudit = async () => {
    const result = await onAi();
    setAiData(result);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-in slide-in-from-right duration-300 overflow-y-auto custom-scrollbar">
      
      <div className="p-6 md:p-10 space-y-8">
         {/* 1. Global Header */}
         <CustomerHeader 
            customer={customer} 
            isAdmin={isAdmin} 
            onBack={onBack} 
            onAi={runCortexAudit} 
            onShareLink={onShareLink}
         />

         <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* 2. Left Column: Identity & Risk (Fixed Width on Desktop) */}
            <div className="xl:col-span-4 space-y-8">
               <CustomerProfileCard 
                  customer={customer} 
                  behavior={behavior} 
                  isAdmin={isAdmin} 
                  onEditProfile={onEditProfile}
               />
               
               <GradeWidget 
                  customer={customer} 
                  grade={behavior.calculatedGrade} 
               />

               <CommunicationWidget logs={allLogs} />
            </div>

            {/* 3. Right Column: Operations & Intelligence (Flexible) */}
            <div className="xl:col-span-8 flex flex-col gap-8">
               
               {/* Context Navigation Tabs */}
               <div className="bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm flex gap-2 w-full md:w-fit overflow-x-auto">
                  <button 
                    onClick={() => setActiveTab('ledger')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                     <History size={14}/> Financial Ledger
                  </button>
                  <button 
                    onClick={() => setActiveTab('forensics')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'forensics' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                     <BookOpen size={14}/> Deepvue Forensics
                  </button>
                  <button 
                    onClick={() => setActiveTab('cortex')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'cortex' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                     <BrainCircuit size={14}/> Cortex AI Strategy
                  </button>
               </div>

               {/* Tab Content */}
               <div className="flex-1 min-h-[500px]">
                  {activeTab === 'ledger' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-end gap-4">
                           <button onClick={() => onAddEntry({ type: 'credit', unit: 'money' })} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
                              + Add Credit
                           </button>
                           <button onClick={() => onAddEntry({ type: 'debit', unit: 'money' })} className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
                              + Add Debit
                           </button>
                        </div>
                        <LedgerPanel 
                           customer={customer} 
                           onAddEntry={() => onAddEntry()} 
                           onEditTransaction={onEditTransaction} 
                           onDeleteTransaction={onDeleteTransaction} 
                        />
                     </div>
                  )}

                  {activeTab === 'forensics' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <DeepvueLibraryPanel 
                           insight={customer.deepvueInsights!} 
                           customerName={customer.name} 
                           customerPhone={customer.phone} 
                           onUpdate={onUpdateDeepvue} 
                        />
                        <DigitalFingerprintPanel 
                           customer={customer} 
                           isAdmin={isAdmin} 
                           onEnrich={onEnrich} 
                        />
                     </div>
                  )}

                  {activeTab === 'cortex' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-indigo-600"><BrainCircuit size={200}/></div>
                           <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Request Cortex Reasoner</h3>
                           <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-8">Utilize the Gemini 3 Pro reasoning engine to analyze the entity's payment behavior and communication history.</p>
                           <button 
                             onClick={runCortexAudit}
                             className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all"
                           >Run Deep Strategy Audit</button>
                        </div>

                        {aiData && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="p-8 bg-indigo-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                                 <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">Strategy Analysis</p>
                                 <p className="text-sm leading-relaxed italic opacity-90 font-medium">"{aiData.analysis}"</p>
                              </div>
                              <div className="p-8 bg-white border border-indigo-100 rounded-[2.5rem] shadow-xl">
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Recommended Protocol</p>
                                 <h4 className="text-xl font-black text-slate-900 uppercase mb-4">{aiData.next_step}</h4>
                                 <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black uppercase text-slate-400">Recovery Confidence:</span>
                                    <span className="text-xl font-black text-emerald-600">{aiData.riskScore}%</span>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};