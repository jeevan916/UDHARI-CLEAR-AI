import React from 'react';
import { Database, Server, ShieldCheck, Terminal, List, Cpu, Info, Activity, AlertCircle } from 'lucide-react';

interface Props {
  dbStatus: 'CONNECTED' | 'OFFLINE';
  dbStructure: any[];
  systemLogs: string[];
}

export const SystemVaultView: React.FC<Props> = ({ dbStatus, dbStructure, systemLogs }) => {
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
               Exposing raw kernel telemetry and the "Memory Vault" database structure. 
               This dashboard provides direct visibility into the Hostinger handshake and SQL schema validation.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Left: Memory Vault Structure */}
         <div className="lg:col-span-7 space-y-6">
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
                     <p className="text-sm font-bold uppercase">Memory Vault Empty or Unreachable</p>
                     <p className="text-[10px] mt-1">Check logs for handshake errors.</p>
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
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-3">
                  <Cpu className="text-emerald-600"/> Performance Telemetry
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                     { label: 'Latency', val: '24ms', icon: Activity, color: 'text-emerald-500' },
                     { label: 'Uptime', val: '99.98%', icon: ShieldCheck, color: 'text-blue-500' },
                     { label: 'Pool Size', val: '5/10', icon: Server, color: 'text-amber-500' },
                     { label: 'IOPS', val: '142', icon: Info, color: 'text-slate-500' }
                  ].map((stat, i) => (
                     <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <stat.icon className={`${stat.color} mx-auto mb-2`} size={16}/>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">{stat.val}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Right: Raw Connection Logs */}
         <div className="lg:col-span-5 h-[650px] relative group">
            <div className="bg-[#010409] h-full rounded-[4rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden font-mono relative">
               <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex justify-between items-center shrink-0 backdrop-blur-2xl">
                  <div className="flex items-center gap-4">
                     <Terminal size={20} className="text-emerald-500 animate-pulse" />
                     <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Handshake Terminal</span>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Raw MySQL Handshake Trace</p>
                     </div>
                  </div>
               </div>
               
               <div className="p-10 flex-1 overflow-y-auto custom-scrollbar text-[10px] leading-relaxed space-y-2 bg-black/20">
                  {systemLogs.filter(l => l.includes('REMOTE:') || l.includes('CRITICAL:')).map((log, i) => (
                     <div key={i} className="flex gap-4 p-1 rounded transition-colors hover:bg-white/5">
                        <span className={`break-all font-bold ${
                           log.includes('FAILED') || log.includes('CRITICAL') || log.includes('ERR') ? 'text-rose-400' : 
                           log.includes('SUCCESS') || log.includes('CONNECTED') ? 'text-emerald-400' : 
                           'text-slate-400'
                        }`}>
                           {log.replace('REMOTE: ', '')}
                        </span>
                     </div>
                  ))}
                  
                  <div className="flex items-center gap-3 pt-6">
                     <span className="text-blue-500 font-black flex items-center gap-2">
                        <Server size={12}/> system@hostinger-node:~$
                     </span>
                     <span className="w-2.5 h-5 bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};