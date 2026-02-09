
import React from 'react';
import { 
  Wallet, TrendingUp, ShieldCheck, Server, 
  Activity, ArrowUpRight, ArrowDownRight, 
  Layers, Users, Clock, Zap, Terminal
} from 'lucide-react';
import { DashboardCard } from '../components/DashboardCard';
import { TerminalConsole } from '../components/TerminalConsole';
import { formatCurrency, analyzeCustomerBehavior } from '../utils/debtUtils';
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
  const recoveryRate = 72; // Simulated metric

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <DashboardCard 
          title="Gross Portfolio Liability" 
          value={formatCurrency(totalLiability)} 
          icon={<Wallet className="text-blue-600"/>}
          trend="+2.4%"
          subtext="Net position vs last period"
        />
        <DashboardCard 
          title="Recovery Velocity" 
          value={`${recoveryRate}%`} 
          icon={<TrendingUp className="text-emerald-600"/>}
          trendColor="text-emerald-500"
          subtext="Efficiency Index: Alpha"
        />
        <DashboardCard 
          title="Active Recovery Nodes" 
          value={customers.length} 
          icon={<Users className="text-indigo-600"/>}
          subtext="Live managed entities"
        />
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <ShieldCheck size={64} className="text-white"/>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">System Integrity</p>
              <p className="text-xl font-black text-white leading-none">v4.5-STABLE</p>
           </div>
           <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Node 139.59.10.70 Live</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart Area (Placeholder for real data) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
           <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Layers size={20}/>
                 </div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 leading-none">Risk Segmentation Matrix</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Entity Grading</p>
                 </div>
              </div>
           </div>
           
           <div className="p-6 md:p-8 space-y-4 flex-1">
              {customers.slice(0, 6).map(c => {
                const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
                return (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${b.score > 70 ? 'bg-emerald-500' : b.score > 40 ? 'bg-blue-500' : 'bg-rose-500'}`}>
                        {b.calculatedGrade}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[120px] md:max-w-none">{c.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{b.daysInactive}d Dormancy</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(c.currentBalance)}</p>
                       <p className={`text-[8px] font-black uppercase tracking-widest ${b.isSpamBlocked ? 'text-rose-400' : 'text-emerald-500'}`}>
                          {b.nextAction}
                       </p>
                    </div>
                  </div>
                );
              })}
           </div>
           
           <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                 View Comprehensive Analysis <Zap size={10}/>
              </button>
           </div>
        </div>

        {/* Live Kernel Logs */}
        <div className="flex flex-col">
           <div className="bg-slate-900 rounded-3xl shadow-2xl flex-1 flex flex-col overflow-hidden border border-white/5">
              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                 {/* Added missing Terminal icon */}
                 <Terminal size={18} className="text-emerald-400"/>
                 <h4 className="text-xs font-black text-white uppercase tracking-widest">Kernel Stream</h4>
              </div>
              <div className="flex-1 min-h-[400px]">
                 <TerminalConsole logs={systemLogs} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
