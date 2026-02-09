import React from 'react';
import { 
  ShieldCheck, Terminal, Scale, Landmark, Users, 
  TrendingUp, Layers, Zap, Globe, Activity
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

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Cash Exposure" 
          value={formatCurrency(totalLiability)} 
          icon={<Landmark size={24}/>}
          trend="+2.4%"
          subtext="Total INR Liability Across Nodes"
        />
        <DashboardCard 
          title="Metal Vault" 
          value={formatGold(totalGoldLiability)} 
          icon={<Scale size={24}/>}
          trendColor="text-amber-500"
          subtext="Fine Gold (999) Net Weight"
        />
        <DashboardCard 
          title="Managed Entities" 
          value={customers.length} 
          icon={<Users size={24}/>}
          subtext="Total Registered Customer Nodes"
        />
        <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <ShieldCheck size={80} className="text-white"/>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-1">Infrastructure</p>
              <p className="text-2xl font-black text-white leading-none tracking-tighter">72.61.175.20</p>
           </div>
           <div className="mt-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Node Healthy</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Matrix Table */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                    <Activity size={24}/>
                 </div>
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 leading-none">Portfolio Real-Time Audit</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Live Deterministic Scoring</p>
                 </div>
              </div>
           </div>
           
           <div className="p-4 md:p-8 space-y-4 flex-1">
              {customers.slice(0, 6).map(c => {
                const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
                return (
                  <div key={c.id} className="flex items-center justify-between p-4 md:p-5 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-slate-200 transition-all group shadow-sm hover:shadow-md cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-white shadow-lg transition-transform group-hover:scale-105 ${b.score > 70 ? 'bg-emerald-500' : b.score > 40 ? 'bg-indigo-500' : 'bg-rose-500'}`}>
                        {b.calculatedGrade}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[120px] md:max-w-[200px]">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{b.daysInactive}d Unpaid</span>
                           <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                           <span className={`text-[9px] font-black uppercase ${b.isSpamBlocked ? 'text-rose-400' : 'text-emerald-500'}`}>{b.nextAction}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-base font-black text-slate-800 tabular-nums tracking-tighter">{formatCurrency(c.currentBalance)}</p>
                       <p className="text-[10px] font-bold text-slate-400 tabular-nums">{formatGold(c.currentGoldBalance)} Gold</p>
                    </div>
                  </div>
                );
              })}
           </div>
           
           <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] hover:translate-x-2 transition-all flex items-center gap-3">
                 Explore Full Sovereign Ledger <TrendingUp size={12}/>
              </button>
           </div>
        </div>

        {/* Real-time Terminal Output */}
        <div className="flex flex-col h-full">
           <div className="flex-1 min-h-[500px]">
              <TerminalConsole logs={systemLogs} />
           </div>
        </div>
      </div>
    </div>
  );
};