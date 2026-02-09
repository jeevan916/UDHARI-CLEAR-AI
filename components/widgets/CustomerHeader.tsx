
import React from 'react';
import { Shield, ShieldAlert, Sparkles, Phone, MessageSquare, Clock, Link } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerHeaderProps {
  customer: Customer;
  isAdmin: boolean;
  onBack: () => void;
  onAi: () => void;
  onShareLink?: () => void; // New Prop
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customer, isAdmin, onBack, onAi, onShareLink }) => {
  // Calculate real stats
  const lastCall = customer.lastCallDate ? new Date(customer.lastCallDate).toLocaleDateString() : 'N/A';
  const lastWA = customer.lastWhatsappDate ? new Date(customer.lastWhatsappDate).toLocaleDateString() : 'N/A';

  // Calculate Avg Pay Days Logic
  const creditTx = customer.transactions
    .filter(t => t.type === 'credit')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let avgPayDays: string | number = 'N/A';
  if (creditTx.length > 1) {
     let totalDays = 0;
     for (let i = 1; i < creditTx.length; i++) {
        const d1 = new Date(creditTx[i-1].date).getTime();
        const d2 = new Date(creditTx[i].date).getTime();
        totalDays += (d2 - d1) / (1000 * 3600 * 24);
     }
     avgPayDays = Math.round(totalDays / (creditTx.length - 1));
  } else if (creditTx.length === 1) {
     // If only 1 payment, calculate time since onboarding (first tx)
     const firstTx = customer.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
     if (firstTx && firstTx.id !== creditTx[0].id) {
        const diff = (new Date(creditTx[0].date).getTime() - new Date(firstTx.date).getTime()) / (1000 * 3600 * 24);
        avgPayDays = Math.round(diff);
     }
  }

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 md:gap-10">
       <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none break-words">{customer.name}</h2>
          
          {/* New Stats Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                <Phone size={12} className="text-slate-900"/> Last Call: {lastCall}
             </div>
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                <MessageSquare size={12} className="text-emerald-600"/> Last WA: {lastWA}
             </div>
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                <Clock size={12} className="text-blue-600"/> Avg Pay Cycle: {avgPayDays !== 'N/A' ? `${avgPayDays} Days` : 'Insufficient Data'}
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4">
             <span className={`px-5 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl ${isAdmin ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'}`}>
                {isAdmin ? <ShieldAlert size={14} className="text-amber-400 md:w-4 md:h-4"/> : <Shield size={14} className="md:w-4 md:h-4"/>}
                {isAdmin ? 'ROOT SYSTEM AUTHORITY' : 'ADVISORY NODE'}
             </span>
             <div className="flex items-center gap-3 md:gap-4 bg-white px-5 md:px-8 py-2 md:py-3 rounded-full border border-slate-200 shadow-sm">
                <span className="text-[10px] md:text-[11px] font-black text-slate-300 uppercase tracking-widest">PKT_ID:</span>
                <span className="text-[10px] md:text-[12px] font-black text-slate-800 uppercase tabular-nums">{customer.uniquePaymentCode}</span>
             </div>
          </div>
       </div>
       <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          {onShareLink && (
             <button onClick={onShareLink} className="px-8 md:px-10 py-6 md:py-8 bg-blue-600 text-white rounded-[2rem] md:rounded-[2.5rem] font-black uppercase text-[11px] md:text-[12px] tracking-widest shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3">
                <Link size={18}/> Share Link
             </button>
          )}
          <button onClick={onAi} className={`flex-1 xl:flex-none px-8 md:px-16 py-6 md:py-8 text-white rounded-[2rem] md:rounded-[2.5rem] font-black uppercase text-[11px] md:text-[12px] tracking-widest shadow-2xl flex items-center justify-center gap-4 md:gap-5 hover:scale-105 active:scale-95 transition-all ${isAdmin ? 'bg-slate-900 shadow-slate-900/40' : 'bg-indigo-600 shadow-indigo-600/30'}`}>
            <Sparkles size={20} className="md:w-7 md:h-7"/> {isAdmin ? 'Run Deep Strategy' : 'Request Advice'}
          </button>
          <button onClick={onBack} className="px-8 md:px-12 py-6 md:py-8 bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] text-[11px] md:text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-50 transition-all">Close Node</button>
       </div>
    </div>
  );
};
