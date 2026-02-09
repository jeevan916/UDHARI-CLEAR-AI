import React from 'react';
import { 
  ShieldCheck, Landmark, TrendingUp, Activity, Coins, Database, Server, RefreshCw, AlertCircle
} from 'lucide-react';
import { TerminalConsole } from '../components/TerminalConsole';
import { formatCurrency, formatGold } from '../utils/debtUtils';
import { Customer, GradeRule, CommunicationLog } from '../types';
import { useAppStore } from '../hooks/useAppStore';

export const DashboardView: React.FC<{ customers: Customer[]; systemLogs: string[]; gradeRules: GradeRule[]; callLogs: CommunicationLog[] }> = ({ 
  customers, systemLogs, gradeRules, callLogs 
}) => {
  const { state, actions } = useAppStore();
  const totalLiability = customers.reduce((s, c) => s + c.currentBalance, 0);
  const totalGold = customers.reduce((s, c) => s + (c.currentGoldBalance || 0), 0);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20">
      
      {/* ENTERPRISE COMMAND HEADER */}
      <div className="bg-[#0d1117] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <Server className="text-blue-500" size={20}/>
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Hostinger Sovereign Cluster</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">
               Recovery <span className="text-amber-500">Authority</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.3em]">Sanghavi Jewellers | Active Node: 139.59.10.70</p>
         </div>

         <div className="relative z-10 flex gap-4">
            <div className={`px-6 py-4 rounded-2xl flex flex-col items-center min-w-[140px] border ${state.dbStatus === 'CONNECTED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
               <Database size={18} className="mb-2"/>
               <span className="text-[8px] font-black uppercase tracking-widest">Vault@127.0.0.1</span>
               <span className="text-xs font-bold">{state.dbStatus}</span>
            </div>
            <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center min-w-[140px] text-blue-400">
               <Activity size={18} className="mb-2"/>
               <span className="text-[8px] font-black uppercase tracking-widest">Execution Tier</span>
               <span className="text-xs font-bold uppercase">PRO_NODE</span>
            </div>
         </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white/5 p-8 rounded-[2.5rem] shadow-xl border border-white/5 group hover:border-blue-500/30 transition-all">
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Portfolio Exposure</p>
           <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(totalLiability)}</h3>
           <div className="flex items-center gap-2 mt-4 text-rose-500">
              <TrendingUp size={14}/>
              <span className="text-[10px] font-black uppercase tracking-widest">Unrealized Liability</span>
           </div>
        </div>

        <div className="bg-amber-500/5 p-8 rounded-[2.5rem] shadow-xl border border-amber-500/10 group hover:border-amber-500/30 transition-all">
           <p className="text-[10px] font-black uppercase text-amber-500/60 tracking-widest mb-4">Metal Repository</p>
           <h3 className="text-4xl font-black text-amber-500 tracking-tighter tabular-nums">{formatGold(totalGold)}</h3>
           <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mt-4">Fine Gold 999.9 Verified</p>
        </div>

        <div className="bg-white/5 p-8 rounded-[2.5rem] shadow-xl border border-white/5">
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Node Connections</p>
           <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{customers.length}</h3>
           <div className="mt-4 flex -space-x-2">
              {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full border-2 border-[#010409] bg-slate-800"></div>)}
           </div>
        </div>

        <div className="bg-blue-600/10 p-8 rounded-[2.5rem] shadow-xl border border-blue-500/20 relative overflow-hidden">
           <div className="absolute -bottom-4 -right-4 opacity-10 text-blue-400"><ShieldCheck size={120}/></div>
           <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-4">Security Protocol</p>
           <h3 className="text-2xl font-black text-white tracking-tighter">AES_256_GCM</h3>
           <div className="mt-4 flex items-center gap-2 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase">Socket Encrypted</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
        <div className="lg:col-span-8 bg-[#0d1117] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col">
           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Entity Watchlist</h3>
              <button className="text-[10px] font-black uppercase text-blue-500 tracking-widest">View Master</button>
           </div>
           <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
              {customers.slice(0, 8).map(c => (
                <div key={c.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all cursor-pointer">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-black text-xs uppercase">{c.name.charAt(0)}</div>
                      <div>
                         <p className="text-sm font-black text-white uppercase">{c.name}</p>
                         <p className="text-[10px] font-mono text-slate-500">{c.uniquePaymentCode}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-white">{formatCurrency(c.currentBalance)}</p>
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-[9px] font-black uppercase">Authority Recall</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
        <div className="lg:col-span-4 h-full">
           <TerminalConsole logs={systemLogs} />
        </div>
      </div>
    </div>
  );
};