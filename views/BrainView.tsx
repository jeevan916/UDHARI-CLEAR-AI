
import React, { useMemo } from 'react';
import { 
  BrainCircuit, Activity, Database, Server, Wallet, ShieldAlert, ArrowRight, 
  GitBranch, Lock, Clock, CheckCircle2, AlertTriangle, Zap, Terminal
} from 'lucide-react';
import { Customer, GradeRule, CommunicationLog } from '../types';
import { analyzeCustomerBehavior, formatCurrency } from '../utils/debtUtils';

interface BrainViewProps {
  customers: Customer[];
  gradeRules: GradeRule[];
  callLogs: CommunicationLog[];
  isAdmin: boolean;
}

export const BrainView: React.FC<BrainViewProps> = ({ customers, gradeRules, callLogs, isAdmin }) => {
  
  // Real-time calculation of portfolio state using the shared kernel logic
  const portfolioState = useMemo(() => {
    return customers.map(c => ({
       ...c,
       behavior: analyzeCustomerBehavior(c, gradeRules, callLogs)
    }));
  }, [customers, gradeRules, callLogs]);

  // Aggregates
  const totalLiability = portfolioState.reduce((s, c) => s + c.currentBalance, 0);
  const riskDistribution = {
     A: portfolioState.filter(c => c.behavior.calculatedGrade === 'A').length,
     B: portfolioState.filter(c => c.behavior.calculatedGrade === 'B').length,
     C: portfolioState.filter(c => c.behavior.calculatedGrade === 'C').length,
     D: portfolioState.filter(c => c.behavior.calculatedGrade === 'D').length,
  };
  const activeCooldowns = portfolioState.filter(c => c.behavior.isSpamBlocked).length;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
       {/* 1. Header & Engine Status */}
       <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
             <div>
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                      <BrainCircuit className="text-blue-400" size={32}/>
                   </div>
                   <span className="text-xs font-black uppercase text-blue-400 tracking-[0.3em] animate-pulse">System Cortex Active</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 leading-none">
                   Central Intelligence
                </h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] max-w-md leading-relaxed">
                   Visualizing the real-time interaction between Financial Ledger, Behavioral Forensics, and Deterministic Logic Gates.
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center w-32 md:w-40">
                   <Wallet size={20} className="text-emerald-400 mb-2"/>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fin-Engine</span>
                   <span className="text-xs font-bold text-emerald-400 mt-1">ONLINE</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center w-32 md:w-40">
                   <Activity size={20} className="text-amber-400 mb-2"/>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Behavior Node</span>
                   <span className="text-xs font-bold text-amber-400 mt-1">PROCESSING</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center w-32 md:w-40">
                   <GitBranch size={20} className="text-blue-400 mb-2"/>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Logic Gate</span>
                   <span className="text-xs font-bold text-blue-400 mt-1">LOCKED</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center w-32 md:w-40">
                   <Server size={20} className="text-rose-400 mb-2"/>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gemini AI</span>
                   <span className="text-xs font-bold text-rose-400 mt-1">STANDBY</span>
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* 2. Logic Pipeline Visualization (Left Col) */}
          <div className="xl:col-span-1 space-y-6">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                   <GitBranch className="text-blue-600"/> Decision Pipeline
                </h3>
                <div className="space-y-4 relative">
                   <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-slate-200"></div>
                   
                   {/* Step 1: Input */}
                   <div className="relative flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center z-10 shrink-0">
                         <Database size={16} className="text-slate-500"/>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Input Vector</p>
                         <p className="text-xs font-bold text-slate-700">Ledger Balance • Inactivity • History</p>
                      </div>
                   </div>

                   {/* Step 2: Risk Grading */}
                   <div className="relative flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center z-10 shrink-0">
                         <ShieldAlert size={16} className="text-blue-600"/>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Risk Classification</p>
                         <p className="text-xs font-bold text-blue-800">Assign Grade (A/B/C/D) based on rules</p>
                      </div>
                   </div>

                   {/* Step 3: Anti-Spam Gate */}
                   <div className="relative flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 border-4 border-white shadow-lg flex items-center justify-center z-10 shrink-0">
                         <Lock size={16} className="text-amber-600"/>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Anti-Spam Gatekeeper</p>
                         <p className="text-xs font-bold text-amber-800">Check Last Contact Timestamp</p>
                      </div>
                   </div>

                   {/* Step 4: Output */}
                   <div className="relative flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 border-4 border-white shadow-lg flex items-center justify-center z-10 shrink-0">
                         <Zap size={16} className="text-emerald-600"/>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Action Output</p>
                         <p className="text-xs font-bold text-emerald-800">Allow Message OR Block (Cooldown)</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Portfolio Stats */}
             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                   <Activity className="text-rose-600"/> Portfolio Health
                </h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <div className="text-2xl font-black text-slate-900 tabular-nums">{customers.length}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Entities</div>
                   </div>
                   <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                      <div className="text-2xl font-black text-rose-600 tabular-nums">{riskDistribution.D}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-rose-400">Critical</div>
                   </div>
                   <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                      <div className="text-2xl font-black text-amber-600 tabular-nums">{activeCooldowns}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">In Cooldown</div>
                   </div>
                   <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <div className="text-xl font-black text-emerald-600 tabular-nums truncate">{formatCurrency(totalLiability)}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Risk</div>
                   </div>
                </div>
             </div>
          </div>

          {/* 3. Real-Time Logic Simulation (Right Col - Wide) */}
          <div className="xl:col-span-2 bg-[#0f172a] text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-full border border-white/5">
             <div className="flex justify-between items-center mb-8 z-10 relative">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                      <Terminal size={24} className="text-emerald-400"/> Live Logic Trace
                   </h3>
                   <p className="text-slate-400 font-mono text-xs mt-1">Monitoring `analyzeCustomerBehavior()` execution stream...</p>
                </div>
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse delay-75"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse delay-150"></div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar z-10 relative pr-2">
                <table className="w-full text-left font-mono text-xs">
                   <thead className="text-slate-500 uppercase font-black tracking-widest border-b border-white/10">
                      <tr>
                         <th className="pb-4">Entity</th>
                         <th className="pb-4">Inputs (Bal / Days)</th>
                         <th className="pb-4">Calculated Grade</th>
                         <th className="pb-4">Spam Gate</th>
                         <th className="pb-4 text-right">Final Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {portfolioState.map(p => (
                         <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-4 font-bold text-white">{p.name}</td>
                            <td className="py-4 text-slate-400">
                               {formatCurrency(p.currentBalance)} / <span className={p.behavior.daysInactive > 30 ? "text-rose-400" : "text-emerald-400"}>{p.behavior.daysInactive}d</span>
                            </td>
                            <td className="py-4">
                               <span className={`px-3 py-1 rounded border text-[10px] font-black ${
                                  p.behavior.calculatedGrade === 'D' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                  p.behavior.calculatedGrade === 'C' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                  p.behavior.calculatedGrade === 'B' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                               }`}>
                                  GRADE {p.behavior.calculatedGrade}
                               </span>
                            </td>
                            <td className="py-4">
                               {p.behavior.isSpamBlocked ? (
                                  <div className="flex items-center gap-2 text-amber-400">
                                     <Lock size={14}/> 
                                     <span>BLOCKED</span>
                                  </div>
                               ) : (
                                  <div className="flex items-center gap-2 text-emerald-400">
                                     <CheckCircle2 size={14}/> 
                                     <span>PASS</span>
                                  </div>
                               )}
                            </td>
                            <td className="py-4 text-right">
                               <span className={`uppercase font-bold ${p.behavior.isSpamBlocked ? 'text-slate-500 line-through' : 'text-blue-400'}`}>
                                  {p.behavior.matchedRule.whatsapp ? 'WHATSAPP' : 'SMS'}
                               </span>
                               {p.behavior.isSpamBlocked && (
                                  <span className="block text-[9px] text-amber-500 mt-1">COOLDOWN: {p.behavior.cooldownRemainingLabel}</span>
                               )}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );
};
