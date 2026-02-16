import React from 'react';
import { Database, Server, ShieldCheck, Terminal, List, Cpu, Folder, Activity, AlertCircle, Lock, Code, AlertTriangle, Search, Info, Map, FileWarning, CheckCircle2 } from 'lucide-react';

interface Props {
  dbStatus: 'CONNECTED' | 'OFFLINE' | 'SIMULATION' | 'CONFIG_ERROR';
  dbStructure: any[];
  systemLogs: string[];
  envCheck?: Record<string, string>;
  lastError?: any;
  healthData?: any; 
}

export const SystemVaultView: React.FC<Props & { healthData?: any }> = ({ dbStatus, dbStructure, systemLogs, envCheck = {}, lastError, healthData }) => {
  const envPath = healthData?.env_path_found || 'NOT FOUND';
  const hasEnv = healthData?.env_file_exists;
  const hasExample = healthData?.example_file_exists;
  const searchTrace = healthData?.env_search_trace || [];

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Jeweller Integrity Header */}
      <div className={`text-white p-10 rounded-[3rem] shadow-2xl border relative overflow-hidden transition-colors duration-500 ${dbStatus === 'CONNECTED' ? 'bg-[#010409]' : 'bg-rose-950 border-rose-800'}`}>
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <ShieldCheck size={150}/>
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${dbStatus === 'CONNECTED' ? 'bg-emerald-500 text-emerald-500' : 'bg-rose-500 text-rose-500'}`}></div>
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Jeweller Cluster: {dbStatus}
               </span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4">
               Sanghavi Ledger Vault
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
               <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                     <Folder size={14}/>
                     <span className="text-[9px] font-black uppercase tracking-widest">Active Config</span>
                  </div>
                  <p className={`font-mono text-[10px] break-all ${envPath === 'NOT FOUND' ? 'text-rose-400' : 'text-slate-300'}`}>
                     {envPath}
                  </p>
               </div>

               <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                     <FileWarning size={14}/>
                     <span className="text-[9px] font-black uppercase tracking-widest">File Check</span>
                  </div>
                  <div className="flex gap-4 mt-1">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${hasEnv ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="text-[10px] font-mono text-slate-300">.env</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${hasExample ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                        <span className="text-[10px] font-mono text-slate-300">.env.example</span>
                     </div>
                  </div>
               </div>

               <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                     <CheckCircle2 size={14}/>
                     <span className="text-[9px] font-black uppercase tracking-widest">Node Path</span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-300 break-all">{healthData?.working_dir || 'UNKNOWN'}</p>
               </div>
            </div>

            {lastError && (
                <div className="mt-8 p-6 bg-black rounded-2xl border-2 border-rose-500/50 w-full shadow-2xl relative overflow-hidden">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertTriangle size={14}/> DB Handshake Error Dump
                    </p>
                    <pre className="font-mono text-[11px] text-rose-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text p-2 bg-rose-950/20 rounded">
                        {JSON.stringify(lastError, null, 2)}
                    </pre>
                    <p className="mt-4 text-[9px] font-bold text-rose-300 uppercase leading-relaxed">
                       PRO TIP: If you see "Access denied", verify your DB_USER and DB_PASSWORD in .env. If you see "Connect Timeout", check if your Hostinger IP is whitelisted for Remote MySQL.
                    </p>
                </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                  <Map className="text-blue-500"/> Environment Discovery Trace
               </h3>
               <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {searchTrace.map((trace: string, i: number) => (
                     <div key={i} className={`p-3 rounded-xl border font-mono text-[10px] break-all ${trace.startsWith('MATCH') ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        {trace}
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                  <Lock className="text-amber-500"/> Variable Audit
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['DB_HOST', 'DB_USER', 'DB_NAME', 'API_KEY'].map(key => (
                     <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{key}</p>
                        <p className={`text-[10px] font-bold ${process.env[key] ? 'text-emerald-600' : 'text-rose-500'}`}>
                           {process.env[key] ? 'LOADED' : 'MISSING'}
                        </p>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Right: Live Terminal */}
         <div className="lg:col-span-5 h-full min-h-[600px] relative group">
            <div className="bg-[#010409] h-full rounded-[4rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden font-mono relative">
               <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex justify-between items-center shrink-0 backdrop-blur-2xl">
                  <div className="flex items-center gap-4">
                     <Terminal size={20} className="text-emerald-500 animate-pulse" />
                     <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Live Handshake Stream</span>
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