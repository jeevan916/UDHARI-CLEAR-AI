import React from 'react';
import { Database, Server, ShieldCheck, Terminal, List, Cpu, Info, Activity, AlertCircle, Lock, Code } from 'lucide-react';

interface Props {
  dbStatus: 'CONNECTED' | 'OFFLINE';
  dbStructure: any[];
  systemLogs: string[];
  envCheck?: Record<string, string>;
  lastError?: any;
}

export const SystemVaultView: React.FC<Props> = ({ dbStatus, dbStructure, systemLogs, envCheck = {}, lastError }) => {
  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Infrastructure Header */}
      <div className="bg-[#010409] text-white p-10 rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <Database size={150}/>
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${dbStatus === 'CONNECTED' ? 'bg-emerald-500 text-emerald-500' : 'bg-rose-500 text-rose-500'}`}></div>
               <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                  Infrastructure Node: 72.61.175.20
               </span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4">
               <ShieldCheck className="text-blue-500" size={40}/>
               System Integrity Vault
            </h2>
            <p className="text-slate-400 font-mono text-xs max-w-2xl leading-relaxed">
               Exposing raw kernel telemetry, environment verification, and database structure. 
               Used for diagnosing Hostinger MySQL handshakes and DDL validation.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Left: Memory Vault & Environment */}
         <div className="lg:col-span-7 space-y-8">
            
            {/* Environment Audit */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                  <Lock className="text-amber-500"/> Environment Audit
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(envCheck).map(([key, val]) => (
                     <div key={key} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-[10px]">
                        <span className="text-slate-400 font-black uppercase">{key}</span>
                        <span className={val === 'MISSING' ? 'text-rose-500 font-black' : 'text-emerald-600 font-bold'}>
                           {val}
                        </span>
                     </div>
                  ))}
               </div>
               {Object.keys(envCheck).length === 0 && (
                  <p className="text-center text-slate-400 text-xs italic py-4">Waiting for environment telemetry...</p>
               )}
            </div>

            {/* DB Error Card (Visible only when error exists) */}
            {lastError && (
               <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 shadow-xl border-l-8 border-l-rose-500">
                  <div className="flex items-center gap-4 mb-4">
                     <AlertCircle className="text-rose-500" size={32}/>
                     <h3 className="text-xl font-black uppercase tracking-tight text-rose-800">Raw Connection Error</h3>
                  </div>
                  <div className="bg-white/50 p-6 rounded-2xl font-mono text-xs text-rose-900 overflow-x-auto whitespace-pre">
                     {JSON.stringify(lastError, null, 2)}
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                     Target Host: {lastError.host || 'Unknown'}
                  </p>
               </div>
            )}

            {/* Database Memory Vault */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-3">
                     <List className="text-blue-600"/> Database Memory Vault
                  </h3>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                     TABLE: customers
                  </span>
               </div>
               
               {dbStructure.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                     <AlertCircle size={40} className="mb-4 opacity-20"/>
                     <p className="text-sm font-bold uppercase">Memory Vault Empty</p>
                     <p className="text-[10px] mt-1">Check Handshake Terminal for error logs.</p>
                  </div>
               ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                     <table className="w-full text-left font-mono text-[10px]">
                        <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                           <tr>
                              <th className="p-4">Field</th>
                              <th className="p-4">Type</th>
                              <th className="p-4">Null</th>
                              <th className="p-4">Key</th>
                              <th className="p-4">Default</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {dbStructure.map((col, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-4 font-black text-slate-700">{col.Field}</td>
                                 <td className="p-4 text-blue-600">{col.Type}</td>
                                 <td className="p-4 text-slate-400">{col.Null}</td>
                                 <td className="p-4">
                                    {col.Key && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-black">{col.Key}</span>}
                                 </td>
                                 <td className="p-4 text-slate-400">{col.Default || 'NULL'}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>
         </div>

         {/* Right: Raw Connection Logs */}
         <div className="lg:col-span-5 h-full min-h-[650px] relative group">
            <div className="bg-[#010409] h-full rounded-[4rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden font-mono relative">
               <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex justify-between items-center shrink-0 backdrop-blur-2xl">
                  <div className="flex items-center gap-4">
                     <Terminal size={20} className="text-emerald-500 animate-pulse" />
                     <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Handshake Terminal</span>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Raw Kernel Event Stream</p>
                     </div>
                  </div>
               </div>
               
               <div className="p-10 flex-1 overflow-y-auto custom-scrollbar text-[10px] leading-relaxed space-y-2 bg-black/20">
                  {systemLogs.filter(l => l.includes('REMOTE:') || l.includes('CRITICAL:') || l.includes('TERMINAL_ERROR:')).map((log, i) => (
                     <div key={i} className="flex gap-4 p-1 rounded transition-colors hover:bg-white/5">
                        <span className={`break-all font-bold ${
                           log.includes('FAILED') || log.includes('CRITICAL') || log.includes('ERR') ? 'text-rose-400' : 
                           log.includes('SUCCESS') || log.includes('CONNECTED') || log.includes('OK') ? 'text-emerald-400' : 
                           'text-slate-400'
                        }`}>
                           {log.replace('REMOTE: ', '').replace('TERMINAL_ERROR: ', 'FATAL: ')}
                        </span>
                     </div>
                  ))}
                  
                  <div className="flex items-center gap-3 pt-6">
                     <span className="text-blue-500 font-black flex items-center gap-2">
                        <Server size={12}/> system@trace-node:~$
                     </span>
                     <span className="w-2.5 h-5 bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></span>
                  </div>
               </div>
               
               <div className="p-8 border-t border-white/5 bg-black/40">
                  <div className="flex items-center gap-3 text-slate-500 mb-2">
                     <Cpu size={14}/>
                     <span className="text-[9px] font-black uppercase tracking-widest">Memory Context</span>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                     <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-1">
                        <span>CORE_ALLOCATION</span>
                        <span>100%</span>
                     </div>
                     <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-full"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};