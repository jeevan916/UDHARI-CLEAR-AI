import React from 'react';
import { 
  ShieldCheck, Terminal, Scale, Landmark, Users, 
  TrendingUp, Layers, Zap, Globe, Activity,
  Coins, UserCheck, ShieldAlert
} from 'lucide-react';
import { DashboardCard } from '../components/DashboardCard';
import { TerminalConsole } from '../components/TerminalConsole';
import { formatCurrency, analyzeCustomerBehavior, formatGold } from '../utils/debtUtils';
import { Customer, GradeRule, CommunicationLog } from '../types';

interface DashboardViewProps {
  customers: Customer[];
  isAdmin: boolean;
  systemLogs: string[];
  gradeRules: GradeRule[];
  callLogs: CommunicationLog[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  customers, isAdmin, systemLogs, gradeRules, callLogs 
}) => {
  const totalLiability = customers.reduce((s, c) => s + c.currentBalance, 0);
  const totalGoldLiability = customers.reduce((s, c) => s + (c.currentGoldBalance || 0), 0);
  const criticalCount = customers.filter(c => {
    const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
    return b.calculatedGrade === 'D' || b.calculatedGrade === 'C';
  }).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 max-w-[1700px] mx-auto">
      
      {/* Dynamic Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform">
              <Landmark size={120} className="text-indigo-600"/>
           </div>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">Capital Exposure</p>
           <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none mb-2">
             {formatCurrency(totalLiability)}
           </h3>
           <div className="flex items-center gap-2 mt-4">
              <TrendingUp size={12} className="text-emerald-500"/>
              <span className="text-[10px] font-black text-emerald-600 uppercase">+2.4% vs prev week</span>
           </div>
        </div>

        <div className="bg-amber-50 p-8 rounded-[3rem] shadow-xl border border-amber-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-[0.1] group-hover:scale-110 transition-transform">
              <Coins size={120} className="text-amber-600"/>
           </div>
           <p className="text-[10px] font-black uppercase text-amber-600/60 tracking-[0.3em] mb-4">Fine Metal Ledger</p>
           <h3 className="text-4xl font-black text-amber-900 tracking-tighter tabular-nums leading-none mb-2">
             {formatGold(totalGoldLiability)}
           </h3>
           <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mt-4">Total Net Weight (999)</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
              <UserCheck size={120} className="text-blue-600"/>
           </div>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">Active Entities</p>
           <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none mb-2">
             {customers.length}
           </h3>
           <div className="mt-4 flex -space-x-2">
              {[1,2,3,4].map(i => (
                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
              ))}
              <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">+</div>
           </div>
        </div>

        <div className="bg-slate-950 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
           <div className="absolute -bottom-8 -right-8 p-6 opacity-10">
              <ShieldCheck size={200} className="text-white"/>
           </div>
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-4">Infrastructure</p>
           <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2">
             72.61.175.20
           </h3>
           <div className="mt-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Node Healthy</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Real-time Risk Matrix */}
        <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
           <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-lg border border-slate-100">
                    <Activity size={28}/>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">Global Exposure Audit</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                       <ShieldAlert size={14} className="text-rose-500"/> {criticalCount} Entities in Critical Threshold
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="p-6 md:p-10 space-y-4 flex-1">
              <div className="grid grid-cols-12 px-6 mb-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                 <div className="col-span-5">Entity Node</div>
                 <div className="col-span-2">Intelligence</div>
                 <div className="col-span-2">Dormancy</div>
                 <div className="col-span-3 text-right">Net Liability</div>
              </div>
              
              {customers.slice(0, 8).map(c => {
                const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
                return (
                  <div key={c.id} className="grid grid-cols-12 items-center p-5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-[2rem] transition-all group cursor-pointer shadow-sm hover:shadow-md">
                    <div className="col-span-5 flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-xl transition-transform group-hover:scale-110 ${
                        b.score > 70 ? 'bg-emerald-500' : b.score > 40 ? 'bg-indigo-600' : 'bg-rose-500'
                      }`}>
                        {b.calculatedGrade}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{c.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{c.uniquePaymentCode}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                         b.score > 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                         b.score > 40 ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                         'bg-rose-50 text-rose-600 border-rose-100'
                       }`}>
                         {b.score}% Propensity
                       </span>
                    </div>

                    <div className="col-span-2">
                       <p className="text-xs font-black text-slate-700">{b.daysInactive} Days</p>
                    </div>

                    <div className="col-span-3 text-right">
                       <p className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">{formatCurrency(c.currentBalance)}</p>
                       <p className="text-[10px] font-bold text-amber-600 tabular-nums">{formatGold(c.currentGoldBalance)} Metal</p>
                    </div>
                  </div>
                );
              })}
           </div>
           
           <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] hover:translate-x-3 transition-all flex items-center gap-4">
                 Synchronize Full Sovereign Ledger <TrendingUp size={14}/>
              </button>
           </div>
        </div>

        {/* Node Command Terminal */}
        <div className="lg:col-span-4 flex flex-col h-full space-y-6">
           <div className="flex-1 min-h-[500px]">
              <TerminalConsole logs={systemLogs} />
           </div>
           
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                 <Globe size={14} className="text-blue-500"/> Cluster Network Status
              </h4>
              <div className="space-y-5">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase">pay.sanghavijewellers.in</span>
                    <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase">WhatsApp Gateway</span>
                    <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase">Deepvue Auth-API</span>
                    <span className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};