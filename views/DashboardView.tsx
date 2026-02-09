
import React from 'react';
import { Wallet, Server, Database, Users, Activity, TrendingUp, Terminal, ShieldCheck, Clock, Lock } from 'lucide-react';
import { DashboardCard } from '../components/DashboardCard';
import { TerminalConsole } from '../components/TerminalConsole';
import { formatCurrency, analyzeCustomerBehavior } from '../utils/debtUtils';
import { Customer, GradeRule, CommunicationLog } from '../types';

interface DashboardViewProps {
  customers: Customer[];
  isAdmin: boolean;
  systemLogs: string[];
  gradeRules: GradeRule[]; // Added prop to receive live logic
  callLogs: CommunicationLog[]; // Added prop for call analysis
}

export const DashboardView: React.FC<DashboardViewProps> = ({ customers, isAdmin, systemLogs, gradeRules, callLogs }) => {
  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <DashboardCard title="Portfolio Liability" value={formatCurrency(customers.reduce((s, c) => s + c.currentBalance, 0))} icon={<Wallet/>} trend="+3.2%" />
          <DashboardCard title="Collection Efficiency" value="84%" icon={<TrendingUp/>} trend="+12.1%" trendColor="text-emerald-500" />
          <DashboardCard title="Node Security" value="v4.2-LOCKED" icon={<ShieldCheck size={18}/>} subtext="Encryption Layer: AES-256" />
          <DashboardCard title="Active Root" value="139.59.10.70" icon={<Server/>} subtext="Status: Authoritative" />
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden group">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 md:mb-10 gap-4">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-4">
                  <Activity className="text-blue-600"/> 
                  Risk Matrix Priority
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort: By Health</span>
             </div>
             <div className="space-y-4">
                {customers.slice(0, 5).map(c => {
                   // Calculate behavior using live rules AND call logs
                   const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
                   return (
                      <div key={c.id} className={`p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row justify-between sm:items-center border border-slate-100 border-l-[6px] md:border-l-[10px] transition-all hover:bg-white hover:shadow-xl gap-4 ${b.score > 70 ? 'border-l-emerald-500' : b.score > 40 ? 'border-l-amber-500' : 'border-l-rose-500'}`}>
                         <div className="flex gap-4 md:gap-6 items-center">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black ${b.score > 70 ? 'bg-emerald-50 text-emerald-600' : b.score > 40 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{b.score}</div>
                            <div>
                              <p className="font-black text-slate-800 uppercase text-sm md:text-base leading-none mb-1">{c.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net: {formatCurrency(c.currentBalance)}</p>
                            </div>
                         </div>
                         <div className="text-right sm:text-left">
                           {b.isSpamBlocked ? (
                              <p className="text-[9px] md:text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <Clock size={10} /> {b.nextAction}
                              </p>
                           ) : (
                              <p className={`text-[9px] md:text-[10px] font-black px-4 py-1.5 rounded-full border inline-block ${isAdmin ? 'bg-slate-900 text-white border-slate-900' : 'bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-widest'}`}>
                                 "{b.nextAction}"
                              </p>
                           )}
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>
          <div className={`p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl flex flex-col relative overflow-hidden transition-all border border-white/5 ${isAdmin ? 'bg-slate-900 text-white' : 'bg-[#0f172a] text-white'}`}>
             <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-6 md:mb-8 flex items-center gap-4">
               <Terminal size={24} className={isAdmin ? "text-amber-400" : "text-emerald-400"}/> 
               Authoritative Kernel Log
             </h3>
             <TerminalConsole logs={systemLogs} />
          </div>
       </div>
    </div>
  );
};
