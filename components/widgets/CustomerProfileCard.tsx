
import React from 'react';
import { UserCircle, Wallet, Clock, Activity, Settings2, Lock, Scale, TrendingUp, AlertCircle } from 'lucide-react';
import { Customer } from '../../types';
import { formatGold, formatCurrency } from '../../utils/debtUtils';

interface CustomerProfileCardProps {
  customer: Customer;
  behavior: any;
  isAdmin: boolean;
  onEditProfile: () => void;
}

export const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({ customer, behavior, isAdmin, onEditProfile }) => {
  return (
    <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 text-slate-900 w-full lg:w-[540px] shadow-2xl z-10 flex flex-col items-center shrink-0">
        <UserCircle size={80} className="text-slate-100 mb-6 md:mb-10 md:w-[120px] md:h-[120px]"/>
        <h3 className="text-2xl md:text-4xl font-black text-center uppercase tracking-tighter mb-3 md:mb-4 leading-none">{customer.name}</h3>
        <p className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 md:mb-14">{customer.groupId}</p>
        
        <div className="w-full space-y-6 mb-10 md:mb-16">
            
            {/* Financial Liability Component */}
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wallet size={64}/>
               </div>
               <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                     <Wallet size={16}/>
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Financial Liability</p>
               </div>
               <p className={`text-3xl md:text-4xl font-black tracking-tighter tabular-nums ${isAdmin ? 'text-slate-900' : 'text-rose-500'}`}>
                  {formatCurrency(customer.currentBalance)}
               </p>
               {customer.currentBalance > 0 && <div className="mt-3 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[60%]"></div>
               </div>}
            </div>

            {/* Gold Liability Component */}
            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Scale size={64}/>
               </div>
               <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-amber-200 text-amber-700 rounded-lg">
                     <Scale size={16}/>
                  </div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Metal Liability (22k)</p>
               </div>
               <p className="text-3xl md:text-4xl font-black tracking-tighter tabular-nums text-amber-800">
                  {formatGold(customer.currentGoldBalance || 0)}
               </p>
               {customer.currentGoldBalance > 0 && <div className="mt-3 w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[40%]"></div>
               </div>}
            </div>

            {/* Risk Metrics */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="p-6 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100">
                   <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={12}/> Dormancy</p>
                   <p className="text-2xl md:text-3xl font-black text-slate-800 tabular-nums">{behavior.daysInactive} <span className="text-[10px] text-slate-400 uppercase">Days</span></p>
                </div>
                <div className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border ${behavior.score > 70 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                   <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12}/> Health</p>
                   <p className={`text-2xl md:text-3xl font-black tabular-nums ${behavior.score > 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{behavior.score}<span className="text-[10px] opacity-40">/100</span></p>
                </div>
            </div>
        </div>
        
        <button onClick={onEditProfile} className={`w-full py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-[11px] shadow-2xl flex items-center justify-center gap-5 transition-all hover:scale-105 ${isAdmin ? 'bg-amber-400 text-slate-900 shadow-amber-400/40' : 'bg-slate-900 text-white opacity-80 cursor-not-allowed'}`}>
            {isAdmin ? <Settings2 size={20}/> : <Lock size={20}/>}
            {isAdmin ? 'OVERRIDE KERNEL' : 'READ-ONLY ACCESS'}
        </button>
    </div>
  );
};
