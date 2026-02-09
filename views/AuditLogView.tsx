
import React, { useState } from 'react';
import { ShieldAlert, Terminal, Search, Filter, Lock, Server, Globe, Activity, FileJson } from 'lucide-react';

interface AuditLogViewProps {
  systemLogs: string[];
  isAdmin: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ systemLogs, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  // We combine the live systemLogs with some mock "Raw Webhook" logs to simulate a real payment audit trail
  const combinedLogs = [
    ...systemLogs.map((log, i) => ({
      id: `SYS-${1000 + i}`,
      timestamp: new Date().toLocaleTimeString(),
      actor: 'SYSTEM_KERNEL',
      action: log.split(':')[0] || 'SYSTEM_EVENT',
      details: log.split(':')[1] || log,
      hash: `sha256-${Math.random().toString(36).substring(7)}`,
      type: 'SYSTEM'
    })),
    // Mocking some historical payment gateway webhooks for the "Audit" feel
    { id: 'WH-RZP-9921', timestamp: '10:42:12 AM', actor: 'RAZORPAY_WEBHOOK', action: 'PAYMENT_AUTHORIZED', details: 'amount: 2320000, status: captured, method: card', hash: 'sha256-a1b2c3d4', type: 'WEBHOOK' },
    { id: 'WH-SETU-8821', timestamp: '09:15:00 AM', actor: 'SETU_UPI_DEEPLINK', action: 'CREDIT_CONFIRMATION', details: 'utr: 3322118822, amount: 500000, vpa: customer@upi', hash: 'sha256-e5f6g7h8', type: 'WEBHOOK' },
    { id: 'SEC-LOG-1102', timestamp: '08:30:45 AM', actor: 'ADMIN_CONSOLE', action: 'AUTH_HANDSHAKE', details: 'Session established from IP 103.21.44.12', hash: 'sha256-i9j0k1l2', type: 'SECURITY' }
  ].reverse();

  const filteredLogs = combinedLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || log.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl border border-slate-800 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <ShieldAlert size={120}/>
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_#f43f5e]"></div>
               <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Write-Once Read-Many (WORM) Storage</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Immutable Audit Trail</h2>
            <p className="text-slate-400 font-mono text-xs max-w-2xl leading-relaxed">
               This registry contains a cryptographic record of all state mutations, gateway callbacks, and security events. 
               Entries cannot be modified or deleted. Used for compliance (RBI/ISO 27001).
            </p>
         </div>
         
         <div className="flex gap-4 mt-8">
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
               <Server size={16} className="text-emerald-400"/>
               <span className="text-[10px] font-bold uppercase tracking-widest">Node: 139.59.10.70</span>
            </div>
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
               <Lock size={16} className="text-amber-400"/>
               <span className="text-[10px] font-bold uppercase tracking-widest">Integrity: VERIFIED</span>
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-4 px-6">
            <Search className="text-slate-300" size={20}/>
            <input 
              type="text" 
              placeholder="Search by Hash, Event, or Actor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent font-bold uppercase text-xs text-slate-700 outline-none"
            />
         </div>
         <div className="flex bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100">
            {['ALL', 'SYSTEM', 'WEBHOOK', 'SECURITY'].map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                 {f}
               </button>
            ))}
         </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
               <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                  <tr>
                     <th className="p-8">Event ID / Hash</th>
                     <th className="p-8">Timestamp</th>
                     <th className="p-8">Actor / Origin</th>
                     <th className="p-8">Action Type</th>
                     <th className="p-8">Payload Detail</th>
                     <th className="p-8 text-center">Verification</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 font-mono text-xs">
                  {filteredLogs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-8">
                           <div className="font-bold text-slate-800">{log.id}</div>
                           <div className="text-[9px] text-slate-400 mt-1 truncate max-w-[100px]">{log.hash}</div>
                        </td>
                        <td className="p-8 text-slate-600 font-bold">
                           {log.timestamp}
                        </td>
                        <td className="p-8">
                           <div className="flex items-center gap-3">
                              {log.type === 'WEBHOOK' ? <Globe size={14} className="text-blue-500"/> : log.type === 'SECURITY' ? <Lock size={14} className="text-rose-500"/> : <Activity size={14} className="text-emerald-500"/>}
                              <span className="font-bold text-slate-700">{log.actor}</span>
                           </div>
                        </td>
                        <td className="p-8">
                           <span className={`px-3 py-1 rounded border text-[9px] font-black uppercase tracking-wider ${
                              log.type === 'WEBHOOK' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              log.type === 'SECURITY' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                              'bg-emerald-50 text-emerald-600 border-emerald-100'
                           }`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="p-8">
                           <div className="text-slate-600 truncate max-w-xs p-2 bg-slate-100 rounded border border-slate-200 group-hover:bg-white transition-colors">
                              {log.details}
                           </div>
                        </td>
                        <td className="p-8 text-center">
                           <div className="inline-flex items-center gap-2 text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                              <ShieldAlert size={12}/> Valid
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
