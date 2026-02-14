import React from 'react';
import { Database, Server, ShieldCheck, Terminal, List, Cpu, Folder, Activity, AlertCircle, Lock, Code, AlertTriangle, Search, Info } from 'lucide-react';

interface Props {
  dbStatus: 'CONNECTED' | 'OFFLINE' | 'SIMULATION' | 'CONFIG_ERROR';
  dbStructure: any[];
  systemLogs: string[];
  envCheck?: Record<string, string>;
  lastError?: any;
  healthData?: any; // We'll pass the whole health object if available
}

export const SystemVaultView: React.FC<Props & { healthData?: any }> = ({ dbStatus, dbStructure, systemLogs, envCheck = {}, lastError, healthData }) => {
  const envPath = healthData?.env_path_found || 'UNKNOWN';
  const workingDir = healthData?.working_dir || 'UNKNOWN';

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Infrastructure Header */}
      <div className={`text-white p-10 rounded-[3rem] shadow-2xl border relative overflow-hidden transition-colors duration-500 ${dbStatus === 'CONFIG_ERROR' ? 'bg-rose-950 border-rose-800' : 'bg-[#010409] border-white/5'}`}>
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <ShieldCheck size={150}/>
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${dbStatus === 'CONNECTED' ? 'bg-emerald-500 text-emerald-500' : 'bg-rose-500 text-rose-500'}`}></div>
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Node Status: {dbStatus}
               </span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4">
               System Integrity Vault
            </h2>
            
            {/* Deployment Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
               <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                     <Folder size={14}/>
                     <span className="text-[9px] font-black uppercase tracking-widest">Working Directory</span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-300 break-all">{workingDir}</p>
               </div>
               <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                     <Search size={14}/>
                     <span className="text-[9px] font-black uppercase tracking-widest">Config Found At</span>
                  </div>
                  <p className={`font-mono text-[10px] break-all ${envPath === 'UNKNOWN' ? 'text-rose-400' : 'text-slate-300'}`}>
                     {envPath}
                  </p>
               </div>
            </div>

            {lastError && (
                <div className="mt-8 p-6 bg-black rounded-2xl border-2 border-rose-500/50 w-full shadow-2xl relative overflow-hidden">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertTriangle size={14}/> Handshake Error Dump
                    </p>
                    <pre className="font-mono text-[11px] text-rose-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text p-2 bg-rose-950/20 rounded">
                        {JSON.stringify(lastError, null, 2)}
                    </pre>
                </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Left: Memory Vault & Environment */}
         <div className="lg:col-span-7 space-y-8">
            {/* Environment Audit */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                  <Lock className="text-amber-500"/> Variable Validation
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
               <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                  <Info className="text-amber-600 shrink-0" size={16}/>
                  <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                     If variables show "MISSING", verify the .env file path shown in the header diagnostics above. PM2 or other process managers may require an absolute path.
                  </p>
               </div>
            </div>

            {/* Database Memory Vault */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-3">
                     <List className="text-blue-600"/> Schema Map
                  </h3>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                     TABLE: customers
                  </span>
               </div>
               
               {dbStructure.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                     <AlertCircle size={40} className="mb-4 opacity-20"/>
                     <p className="text-sm font-bold uppercase">Schema data restricted</p>
                     <p className="text-[10px] mt-1">Connect database to introspect vault.</p>
                  </div>
               ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                     <table className="w-full text-left font-mono text-[10px]">
                        <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                           <tr>
                              <th className="p-4">Field</th>
                              <th className="p-4">Type</th>
                              <th className="p-4">Key</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {dbStructure.map((col, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-4 font-black text-slate-700">{col.Field}</td>
                                 <td className="p-4 text-blue-600">{col.Type}</td>
                                 <td className="p-4">
                                    {col.Key && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-black">{col.Key}</span>}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>
         </div>

         {/* Right: Terminal */}
         <div className="lg:col-span-5 h-full min-h-[600px] relative group">
            <div className="bg-[#010409] h-full rounded-[4rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden font-mono relative">
               <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex justify-between items-center shrink-0 backdrop-blur-2xl">
                  <div className="flex items-center gap-4">
                     <Terminal size={20} className="text-emerald-500 animate-pulse" />
                     <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Live Kernel Stream</span>
                  </div>
               </div>
               
               <div className="p-10 flex-1 overflow-y-auto custom-scrollbar text-[10px] leading-relaxed space-y-2 bg-black/20">
                  {systemLogs.map((log, i) => (
                     <div key={i} className="flex gap-4 p-1 rounded transition-colors hover:bg-white/5">
                        <span className={`break-all font-bold ${
                           log.includes('ERR') || log.includes('FAIL') || log.includes('CRITICAL') ? 'text-rose-400' : 
                           log.includes('SUCCESS') || log.includes('CONNECTED') ? 'text-emerald-400' : 
                           'text-slate-400'
                        }`}>
                           {log}
                        </span>
                     </div>
                  ))}
                  <div className="flex items-center gap-3 pt-6">
                     <span className="text-blue-500 font-black flex items-center gap-2">
                        <Server size={12}/> system@hostinger-node:~$
                     </span>
                     <span className="w-2.5 h-5 bg-emerald-500 animate-pulse"></span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};