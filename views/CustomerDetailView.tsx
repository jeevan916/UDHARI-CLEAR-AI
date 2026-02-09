
import React, { useState } from 'react';
import { 
  ArrowLeft, History, User, BrainCircuit, Fingerprint, Activity, Share2, Phone, Hash, BookOpen, Edit2, Tag
} from 'lucide-react';
import { Customer, AiStrategy, Transaction, CommunicationLog, DeepvueInsight } from '../types';
import { LedgerPanel } from '../components/widgets/LedgerPanel';
import { DeepvueLibraryPanel } from '../components/DeepvueLibraryPanel';
import { DigitalFingerprintPanel } from '../components/DigitalFingerprintPanel';
import { formatCurrency, formatGold } from '../utils/debtUtils';

export const CustomerDetailView: React.FC<{ 
  customer: Customer; behavior: any; isAdmin: boolean; onBack: () => void; onAi: () => Promise<AiStrategy>;
  onDeleteTransaction: (id: string) => void; onEditTransaction: (tx: Transaction) => void;
}> = ({ customer, behavior, isAdmin, onBack, onAi, onDeleteTransaction, onEditTransaction }) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'forensics' | 'cortex' | 'profile'>('ledger');
  const [aiData, setAiData] = useState<AiStrategy | null>(null);

  const runCortexAudit = async () => {
    const result = await onAi();
    setAiData(result);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-300">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
         <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><ArrowLeft size={20}/></button>
            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{customer.name}</h1>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${behavior.score > 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>Grade {behavior.calculatedGrade}</span>
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1"><Phone size={10}/> {customer.phone}</span>
                  <span className="flex items-center gap-1"><Hash size={10}/> {customer.uniquePaymentCode}</span>
               </p>
            </div>
         </div>
         <button className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"><Share2 size={18}/></button>
      </header>

      {/* BALANCE STRIP */}
      <div className="bg-slate-900 text-white px-10 py-6 flex gap-12 items-center shrink-0">
         <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Portfolio Exposure</p>
            <p className="text-3xl font-black tabular-nums">{formatCurrency(customer.currentBalance)}</p>
         </div>
         <div className="w-px h-10 bg-white/10"></div>
         <div>
            <p className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest mb-1">Fine Metal Liability</p>
            <p className="text-xl font-bold tabular-nums text-amber-400">{formatGold(customer.currentGoldBalance)}</p>
         </div>
         <div className="ml-auto flex gap-4">
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Payment Received</button>
            <button className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">New Bill</button>
         </div>
      </div>

      {/* NAV */}
      <nav className="bg-white border-b border-slate-100 px-8 py-2 flex gap-4 shrink-0 overflow-x-auto">
         {[
           { id: 'ledger', label: 'Double Entry Ledger', icon: History },
           { id: 'forensics', label: 'Forensic Library', icon: BookOpen },
           { id: 'cortex', label: 'AI Cortex Audit', icon: BrainCircuit },
           { id: 'profile', label: 'Identity Profile', icon: User }
         ].map(t => (
           <button 
             key={t.id} onClick={() => setActiveTab(t.id as any)}
             className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === t.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
           >
              <t.icon size={14}/> {t.label}
           </button>
         ))}
      </nav>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
         {activeTab === 'ledger' && (
           <LedgerPanel 
             customer={customer} onAddEntry={() => {}} 
             onEditTransaction={onEditTransaction} onDeleteTransaction={onDeleteTransaction} 
             embedded={true} 
           />
         )}

         {activeTab === 'forensics' && (
           <DeepvueLibraryPanel 
              insight={customer.deepvueInsights!} 
              customerName={customer.name} customerPhone={customer.phone} 
              onUpdate={() => {}} 
           />
         )}

         {activeTab === 'cortex' && (
           <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
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

         {activeTab === 'profile' && (
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center">
                 <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center font-black text-3xl mb-6 shadow-xl">{customer.name.charAt(0)}</div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase text-center mb-1">{customer.name}</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{customer.groupId}</p>
                 <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"><Edit2 size={14}/> Modify Node Data</button>
              </div>
              <div className="xl:col-span-2">
                 <DigitalFingerprintPanel customer={customer} isAdmin={isAdmin} onEnrich={() => {}} />
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
