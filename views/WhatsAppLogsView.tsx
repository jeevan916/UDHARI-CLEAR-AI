
import React, { useState } from 'react';
import { MessageCircle, Search, Calendar, User, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { CommunicationLog, Customer } from '../types';

interface WhatsAppLogsViewProps {
  logs: CommunicationLog[];
  customers: Customer[];
}

export const WhatsAppLogsView: React.FC<WhatsAppLogsViewProps> = ({ logs, customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');

  // Filter logs based on search and type
  const filteredLogs = logs.filter(log => {
      const customer = customers.find(c => c.id === log.customerId);
      const nameMatch = customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const contentMatch = log.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const typeMatch = filterType === 'all' 
        ? true 
        : filterType === 'sent' 
          ? (log.status !== 'received') 
          : (log.status === 'received');

      return (nameMatch || contentMatch) && typeMatch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Stats
  const totalMessages = logs.length;
  const sentMessages = logs.filter(l => l.status !== 'received').length;
  const receivedMessages = logs.filter(l => l.status === 'received').length;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <MessageCircle className="text-emerald-500" size={24}/>
               <span className="text-xs font-black uppercase text-emerald-400 tracking-widest">Protocol Bridge</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">WhatsApp Logs</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Meta API Message History</p>
         </div>
         <div className="flex items-center gap-6">
             <div className="text-right hidden md:block">
                <p className="text-2xl font-black text-slate-900">{totalMessages}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
             </div>
             <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
             <div className="text-right hidden md:block">
                <p className="text-2xl font-black text-emerald-600">{receivedMessages}</p>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Inbound</p>
             </div>
             <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
             <div className="text-right hidden md:block">
                <p className="text-2xl font-black text-blue-600">{sentMessages}</p>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Outbound</p>
             </div>
         </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
         {/* Toolbar */}
         <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 flex items-center gap-4 w-full">
                <Search className="text-slate-300" size={20}/>
                <input 
                  type="text" 
                  placeholder="Search logs by customer or content..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent font-bold text-xs uppercase text-slate-700 outline-none placeholder:text-slate-300"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
               <button 
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
               >
                  All
               </button>
               <button 
                  onClick={() => setFilterType('sent')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'sent' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
               >
                  Sent
               </button>
               <button 
                  onClick={() => setFilterType('received')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'received' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
               >
                  Received
               </button>
            </div>
         </div>

         {/* Data Table */}
         <div className="flex-1 overflow-x-auto">
             <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-b border-slate-100">
                   <tr>
                      <th className="p-6">Timestamp</th>
                      <th className="p-6">Entity</th>
                      <th className="p-6">Direction</th>
                      <th className="p-6 w-[40%]">Content Payload</th>
                      <th className="p-6 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredLogs.length === 0 ? (
                      <tr>
                         <td colSpan={5} className="p-20 text-center text-slate-300">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-20"/>
                            <p className="text-xs font-black uppercase tracking-widest">No Message Records Found</p>
                         </td>
                      </tr>
                   ) : (
                      filteredLogs.map(log => {
                         const customer = customers.find(c => c.id === log.customerId);
                         const isReceived = log.status === 'received';
                         
                         return (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="p-6">
                                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                                     <Calendar size={14} className="text-slate-300"/> 
                                     {new Date(log.timestamp).toLocaleDateString()}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 mt-1 pl-6">
                                     {new Date(log.timestamp).toLocaleTimeString()}
                                  </div>
                               </td>
                               <td className="p-6">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isReceived ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {customer?.name.charAt(0) || '?'}
                                     </div>
                                     <div>
                                        <p className="font-bold text-slate-800 text-xs uppercase">{customer?.name || 'Unknown'}</p>
                                        <p className="text-[9px] font-mono text-slate-400 mt-0.5">{customer?.phone}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="p-6">
                                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${isReceived ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                     {isReceived ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                                     {isReceived ? 'Inbound' : 'Outbound'}
                                  </span>
                               </td>
                               <td className="p-6">
                                  <p className="text-xs font-medium text-slate-600 leading-relaxed truncate max-w-md group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                     {log.content}
                                  </p>
                               </td>
                               <td className="p-6 text-right">
                                  <div className={`inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                                     log.status === 'read' ? 'text-blue-500' : 
                                     log.status === 'delivered' ? 'text-slate-500' :
                                     log.status === 'failed' ? 'text-rose-500' :
                                     'text-emerald-500'
                                  }`}>
                                     {log.status === 'read' && <CheckCircle2 size={12}/>}
                                     {log.status === 'delivered' && <CheckCircle2 size={12} className="opacity-50"/>}
                                     {log.status === 'failed' && <AlertCircle size={12}/>}
                                     {log.status}
                                  </div>
                               </td>
                            </tr>
                         );
                      })
                   )}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};
