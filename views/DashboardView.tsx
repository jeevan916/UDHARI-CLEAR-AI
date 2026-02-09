
import React from 'react';
import { 
  ShieldCheck, Landmark, Activity, Database, Server, Cpu, Globe, TrendingUp, Zap, Clock
} from 'lucide-react';
import { TerminalConsole } from '../components/TerminalConsole';
import { formatCurrency, formatGold } from '../utils/debtUtils';
import { Customer, GradeRule } from '../types';
import { useAppStore } from '../hooks/useAppStore';

export const DashboardView: React.FC<{ 
  customers: Customer[]; systemLogs: string[]; gradeRules: GradeRule[] 
}> = ({ customers, systemLogs, gradeRules }) => {
  const { state } = useAppStore();
  
  const totalLiability = customers.reduce((s, c) => s + Number(c.currentBalance), 0);
  const totalGold = customers.reduce((s, c) => s + (Number(c.currentGoldBalance) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-[1600px] mx-auto pb-24">
      
      {/* ENTERPRISE PLATFORM STATUS HEADER */}
      <div className="bg-[#0d1117] text-white p-12 rounded-[4rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-emerald-400">Sanghavi Jewellers Enterprise Core</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
            Recovery <span className="text-blue-500">Center</span>
          </h2>
          <div className="flex items-center gap-6 text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">
             <div className="flex items-center gap-2">
                <Server size={14} className="text-blue-400"/> Node: <span className="text-slate-200">PRODUCTION_PRIMARY</span>
             </div>
             <div className="w-px h-3 bg-slate-800"></div>
             <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400"/> Health: <span className="text-slate-200">OPTIMAL</span>
             </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-6">
          <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-[2.5rem] flex flex-col items-center min-w-[180px] backdrop-blur-xl shadow-2xl">
            <Database className="text-blue-400 mb-3" size={28}/>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Hub</span>
            <span className="text-sm font-bold text-blue-400 uppercase mt-1">SECURE_LINK</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-[2.5rem] flex flex-col items-center min-w-[180px] backdrop-blur-xl shadow-2xl">
            <Cpu className="text-amber-500 mb-3" size={28}/>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cortex IQ</span>
            <span className="text-sm font-bold text-amber-500 uppercase mt-1">Gemini 3 Pro</span>
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 group hover:border-blue-300 transition-all relative overflow-hidden">
           <div className="absolute -bottom-6 -right-6 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity"><Landmark size={180}/></div>
           <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.2em] mb-8">Portfolio Exposure</p>
           <h3 className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums mb-6">{formatCurrency(totalLiability)}</h3>
           <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest bg-rose-50 w-fit px-4 py-1.5 rounded-full border border-rose-100">
             <TrendingUp size={14}/> Risk Analysis Active
           </div>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 group hover:border-amber-300 transition-all relative overflow-hidden">
           <div className="absolute -bottom-6 -right-6 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={180}/></div>
           <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.2em] mb-8">Gold Inventory</p>
           <h3 className="text-5xl font-black text-amber-600 tracking-tighter tabular-nums mb-6">{formatGold(totalGold)}</h3>
           <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest bg-amber-50 w-fit px-4 py-1.5 rounded-full border border-amber-100">
             Fine Gold Ledger
           </div>
        </div>

        <div className="bg-[#010409] p-12 rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-white/5 group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 text-white/5"><Globe size={100}/></div>
           <p className="text-[12px] font-black uppercase text-slate-500 tracking-[0.2em] mb-8">Active Entities</p>
           <h3 className="text-5xl font-black text-white tracking-tighter tabular-nums mb-6">{customers.length}</h3>
           <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">Production Cluster</p>
        </div>

        <div className="bg-blue-600 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -bottom-4 -right-4 text-white/20"><ShieldCheck size={160}/></div>
           <p className="text-[12px] font-black uppercase text-blue-100 tracking-[0.2em] mb-8">System Integrity</p>
           <h3 className="text-3xl font-black text-white tracking-tight mb-6">AES_256_ACTIVE</h3>
           <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest bg-white/20 w-fit px-4 py-1.5 rounded-full border border-white/20">
             Encrypted Protocol
           </div>
        </div>
      </div>

      {/* FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[650px]">
        <div className="lg:col-span-7 bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
           <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Entity Master Ledger</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Centralized Records</p>
              </div>
              <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95">Refresh Core</button>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-5">
              {customers.map(c => (
                <div key={c.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex justify-between items-center hover:bg-white hover:shadow-xl transition-all group cursor-pointer">
                   <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">{c.name.charAt(0)}</div>
                      <div>
                         <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">{c.name}</h4>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">PKT: {c.uniquePaymentCode} • {c.phone}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(Number(c.currentBalance))}</p>
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest mt-2 inline-block border ${c.currentBalance > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                         {c.currentBalance > 0 ? 'Action Required' : 'Stabilized'}
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </div>
        <div className="lg:col-span-5 h-full relative group">
           <TerminalConsole logs={systemLogs} />
        </div>
      </div>
    </div>
  );
};
