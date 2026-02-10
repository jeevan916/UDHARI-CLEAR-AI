import React from 'react';
import { Database, Server, ShieldCheck, Terminal, List, Cpu, Info, Activity, AlertCircle, Lock, Code, AlertTriangle, ArrowRight, Wifi, Key } from 'lucide-react';

interface Props {
  dbStatus: 'CONNECTED' | 'OFFLINE' | 'SIMULATION';
  dbStructure: any[];
  systemLogs: string[];
  envCheck?: Record<string, string>;
  lastError?: any;
}

export const SystemVaultView: React.FC<Props> = ({ dbStatus, dbStructure, systemLogs, envCheck = {}, lastError }) => {
  const isTcpTimeout = systemLogs.some(l => l.includes('TCP Timeout') || l.includes('ETIMEDOUT'));
  const isAuthFailed = systemLogs.some(l => l.includes('Access denied') || l.includes('ER_ACCESS_DENIED'));

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Infrastructure Header */}
      <div className={`text-white p-10 rounded-[3rem] shadow-2xl border relative overflow-hidden transition-colors duration-500 ${dbStatus === 'SIMULATION' ? 'bg-amber-950 border-amber-800' : 'bg-[#010409] border-white/5'}`}>
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <Database size={150}/>
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${dbStatus === 'CONNECTED' ? 'bg-emerald-500 text-emerald-500' : dbStatus === 'SIMULATION' ? 'bg-amber-500 text-amber-500' : 'bg-rose-500 text-rose-500'}`}></div>
               <span className={`text-xs font-black uppercase tracking-widest ${dbStatus === 'SIMULATION' ? 'text-amber-200' : 'text-slate-400'}`}>
                  System Node: {envCheck['NODE_ID'] || 'ENV_DEFINED'}
               </span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4">
               <ShieldCheck className={dbStatus === 'SIMULATION' ? 'text-amber-400' : 'text-blue-500'} size={40}/>
               System Integrity Vault
            </h2>
            <p className={`font-mono text-xs max-w-2xl leading-relaxed ${dbStatus === 'SIMULATION' ? 'text-amber-200/80' : 'text-slate-400'}`}>
               Exposing raw kernel telemetry, environment verification, and database structure. 
               Used for diagnosing MySQL handshakes and DDL validation based on your .env configuration.
            </p>
            {dbStatus === 'SIMULATION' && (
               <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 bg-amber-900/50 border border-amber-700/50 p-4 rounded-2xl w-fit">
                     <AlertTriangle className="text-amber-400" size={20}/>
                     <div>
                        <p className="text-xs font-black text-amber-100 uppercase">Fault-Tolerant Simulation Active</p>
                        <p className="text-[10px] text-amber-200/60">Database connection failed. Serving high-fidelity mock data to maintain dashboard availability.</p>
                     </div>
                  </div>
                  
                  {/* RAW ERROR DUMP */}
                  {lastError && (
                     <div className="p-4 bg-black/40 rounded-2xl border border-amber-900/50 w-full max-w-3xl">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Code size={12}/> Raw Error Dump (System Core)
                        </p>
                        <pre className="font-mono text-[10px] text-rose-200/80 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                           {JSON.stringify(lastError, null, 2)}
                        </pre>
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Left: Memory Vault & Environment */}
         <div className="lg:col-span-7 space-y-8">
            
            {/* Network Trace Visualizer */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                  <Activity className="text-blue-600"/> Connectivity Trace
               </h3>
               
               <div className="flex flex-col md:flex-row items-center gap-4 relative">
                  {/* Step 1: Client */}
                  <div className="flex flex-col items-center gap-2 z-10">
                     <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                        <Server size={20}/>
                     </div>
                     <span className="text-[9px] font-black uppercase text-slate-400">App Server</span>
                  </div>

                  {/* Path 1 */}
                  <div className="flex-1 h-1 bg-slate-100 relative min-w-[50px]">
                     <div className={`absolute inset-0 bg-emerald-500 transition-all duration-1000 ${dbStatus === 'CONNECTED' ? 'w-full' : 'w-1/2'}`}></div>
                  </div>

                  {/* Step 2: TCP/Firewall */}
                  <div className="flex flex-col items-center gap-2 z-10">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${isTcpTimeout ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-emerald-50 border-emerald-200 text-emerald-500'}`}>
                        <Wifi size={20}/>
                     </div>
                     <span className={`text-[9px] font-black uppercase ${isTcpTimeout ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isTcpTimeout ? 'Firewall Block' : 'Port 3306 Open'}
                     </span>
                  </div>

                  {/* Path 2 */}
                  <div className="flex-1 h-1 bg-slate-100 relative min-w-[50px]">
                     <div className={`absolute inset-0 bg-emerald-500 transition-all duration-1000 ${!isTcpTimeout && !isAuthFailed ? 'w-full' : 'w-0'}`}></div>
                  </div>

                  {/* Step 3: Auth */}
                  <div className="flex flex-col items-center gap-2 z-10">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${isAuthFailed ? 'bg-rose-50 border-rose-200 text-rose-500' : dbStatus === 'CONNECTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'bg-slate-100 border-slate-200 text-slate-300'}`}>
                        <Key size={20}/>
                     </div>
                     <span className={`text-[9px] font-black uppercase ${isAuthFailed ? 'text-rose-500' : 'text-slate-400'}`}>
                        {isAuthFailed ? 'Auth Failed' : 'Credentials'}
                     </span>
                  </div>

                  {/* Path 3 */}
                  <div className="flex-1 h-1 bg-slate-100 relative min-w-[50px]">
                     <div className={`absolute inset-0 bg-emerald-500 transition-all duration-1000 ${dbStatus === 'CONNECTED' ? 'w-full' : 'w-0'}`}></div>
                  </div>

                  {/* Step 4: DB */}
                  <div className="flex flex-col items-center gap-2 z-10">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${dbStatus === 'CONNECTED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 border-slate-200 text-slate-300'}`}>
                        <Database size={20}/>
                     </div>
                     <span className="text-[9px] font-black uppercase text-slate-400">MySQL DB</span>
                  </div>
               </div>

               {/* Remediation Tips */}
               {(isTcpTimeout || isAuthFailed) && (
                  <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                     <h4 className="text-[10px] font-black uppercase text-amber-600 mb-2 flex items-center gap-2">
                        <AlertCircle size={12}/> Troubleshooting Action Plan
                     </h4>
                     <ul className="space-y-2">
                        {isTcpTimeout && (
                           <li className="text-[10px] text-slate-600 font-medium flex gap-2">
                              <span className="text-amber-500">•</span>
                              <span><strong>Firewall / Network:</strong> The connection timed out. Ensure your server IP is whitelisted on the remote database firewall.</span>
                           </li>
                        )}
                        {isAuthFailed && (
                           <li className="text-[10px] text-slate-600 font-medium flex gap-2">
                              <span className="text-amber-500">•</span>
                              <span><strong>Privileges:</strong> Access Denied. Verify username/password in .env and ensure the user has permissions to access database <code>{envCheck['DB_NAME']?.includes('***') ? 'configured DB' : 'unknown'}</code> from this host.</span>
                           </li>
                        )}
                     </ul>
                  </div>
               )}
            </div>

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
            </div>

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
                  {systemLogs.filter(l => l.includes('REMOTE:') || l.includes('CRITICAL:') || l.includes('TERMINAL_ERROR:') || l.includes('WARNING:') || l.includes('[NET]') || l.includes('[DB]') || l.includes('RAW DUMP')).map((log, i) => (
                     <div key={i} className="flex gap-4 p-1 rounded transition-colors hover:bg-white/5">
                        <span className={`break-all font-bold ${
                           log.includes('FAILED') || log.includes('CRITICAL') || log.includes('ERR') || log.includes('Timeout') ? 'text-rose-400' : 
                           log.includes('SUCCESS') || log.includes('CONNECTED') || log.includes('OK') || log.includes('OPEN') ? 'text-emerald-400' : 
                           log.includes('WARNING') || log.includes('SIMULATION') ? 'text-amber-400' :
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