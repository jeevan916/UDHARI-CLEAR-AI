
import React from 'react';
import { ShieldCheck, CreditCard, Globe, AlertTriangle } from 'lucide-react';
import { Customer } from '../../types';

interface GradeWidgetProps {
  customer: Customer;
  grade: string;
}

export const GradeWidget: React.FC<GradeWidgetProps> = ({ customer, grade }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
       <div className={`p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-center ${grade === 'A' ? 'bg-emerald-500/10 border-emerald-500/30' : grade === 'B' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ShieldCheck size={64}/>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Grade</p>
          <h4 className={`text-4xl font-black ${grade === 'A' ? 'text-emerald-400' : grade === 'B' ? 'text-blue-400' : 'text-rose-400'}`}>{grade}</h4>
       </div>

       <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Gateways</p>
          <div className="flex flex-col gap-2">
             <div className={`flex items-center gap-3 p-2 rounded-xl border ${customer.enabledGateways.razorpay ? 'bg-blue-500/20 border-blue-500/30' : 'bg-slate-800 border-slate-700 opacity-50'}`}>
                <CreditCard size={16} className={customer.enabledGateways.razorpay ? "text-blue-400" : "text-slate-500"}/>
                <span className="text-[10px] font-bold uppercase text-white">Razorpay</span>
             </div>
             <div className={`flex items-center gap-3 p-2 rounded-xl border ${customer.enabledGateways.setu ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-800 border-slate-700 opacity-50'}`}>
                <Globe size={16} className={customer.enabledGateways.setu ? "text-emerald-400" : "text-slate-500"}/>
                <span className="text-[10px] font-bold uppercase text-white">Setu UPI</span>
             </div>
          </div>
       </div>
    </div>
  );
};
