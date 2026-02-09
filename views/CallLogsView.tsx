
import React, { useState } from 'react';
import { Phone, Clock, CheckCircle2, XCircle, User, Calendar, Plus, Search, Timer, FileText, PhoneCall, Save } from 'lucide-react';
import { CommunicationLog, Customer } from '../types';

interface CallLogsViewProps {
  logs: CommunicationLog[];
  customers: Customer[];
  onAddLog: (log: CommunicationLog) => void;
}

export const CallLogsView: React.FC<CallLogsViewProps> = ({ logs, customers, onAddLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Log State
  const [newLog, setNewLog] = useState<Partial<CommunicationLog>>({
    type: 'call',
    outcome: 'Connected',
    duration: 60,
    content: ''
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const handleSave = () => {
    if (!selectedCustomerId) return;
    
    const log: CommunicationLog = {
      id: `cl_${Date.now()}`,
      customerId: selectedCustomerId,
      type: 'call',
      content: newLog.content || '',
      timestamp: new Date().toISOString(),
      status: 'completed',
      duration: newLog.duration,
      outcome: newLog.outcome
    };

    onAddLog(log);
    setIsModalOpen(false);
    setNewLog({ type: 'call', outcome: 'Connected', duration: 60, content: '' });
    setSelectedCustomerId('');
  };

  const filteredLogs = logs.filter(log => {
      const customer = customers.find(c => c.id === log.customerId);
      const nameMatch = customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const contentMatch = log.content.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || contentMatch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Stats
  const totalCalls = logs.length;
  const connectedCalls = logs.filter(l => l.outcome === 'Connected').length;
  const avgDuration = totalCalls > 0 ? Math.round(logs.reduce((s, l) => s + (l.duration || 0), 0) / totalCalls) : 0;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <PhoneCall className="text-blue-500" size={24}/>
               <span className="text-xs font-black uppercase text-blue-400 tracking-widest">Protocol Bridge</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Voice Logs</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Manual & Automated Telephony Records</p>
         </div>
         <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-2xl font-black text-slate-900">{connectedCalls}/{totalCalls}</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Connect Rate</p>
             </div>
             <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
             <div className="text-right hidden md:block">
                <p className="text-2xl font-black text-slate-900">{avgDuration}s</p>
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Avg Duration</p>
             </div>
             <button 
               onClick={() => setIsModalOpen(true)}
               className="ml-4 px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3"
             >
               <Plus size={16}/> Record Call
             </button>
         </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
         <div className="p-6 border-b border-slate-100 flex items-center gap-4">
            <Search className="text-slate-300" size={20}/>
            <input 
              type="text" 
              placeholder="Search logs by customer or notes..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent font-bold text-xs uppercase text-slate-700 outline-none placeholder:text-slate-300"
            />
         </div>
         <div className="flex-1 overflow-y-auto">
             {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-20 text-slate-300">
                   <Phone size={48} className="mb-4 opacity-20"/>
                   <p className="text-xs font-black uppercase tracking-widest">No Call Records Found</p>
                </div>
             ) : (
                <div className="divide-y divide-slate-50">
                   {filteredLogs.map(log => {
                      const customer = customers.find(c => c.id === log.customerId);
                      return (
                         <div key={log.id} className="p-6 md:p-8 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                               <div className="flex items-start gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${log.outcome === 'Connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                     {customer?.name.charAt(0) || '?'}
                                  </div>
                                  <div>
                                     <h4 className="font-black text-sm text-slate-800 uppercase">{customer?.name || 'Unknown Entity'}</h4>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-2">
                                        <Calendar size={10}/> {new Date(log.timestamp).toLocaleString()}
                                     </p>
                                  </div>
                               </div>
                               
                               <div className="flex items-center gap-2 md:gap-6 flex-wrap">
                                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                     log.outcome === 'Connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                     log.outcome === 'No Answer' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                     'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                     {log.outcome}
                                  </span>
                                  <div className="flex items-center gap-2 text-slate-500 font-mono text-xs font-bold bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                     <Timer size={12}/> {log.duration}s
                                  </div>
                               </div>
                            </div>
                            {log.content && (
                               <div className="mt-4 ml-16 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium leading-relaxed relative">
                                  <FileText size={12} className="absolute top-4 left-[-24px] text-slate-300"/>
                                  "{log.content}"
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>
             )}
         </div>
      </div>

      {/* Record Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
               <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                  <h3 className="font-black uppercase tracking-tighter text-lg text-slate-900">Log Interaction</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900"><XCircle size={24}/></button>
               </div>
               <div className="p-8 space-y-6">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Customer Entity</label>
                     <select 
                       value={selectedCustomerId}
                       onChange={e => setSelectedCustomerId(e.target.value)}
                       className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-blue-600 uppercase"
                     >
                        <option value="">Select Customer...</option>
                        {customers.map(c => (
                           <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                        ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Outcome</label>
                        <select 
                           value={newLog.outcome}
                           onChange={e => setNewLog({...newLog, outcome: e.target.value})}
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-blue-600 uppercase"
                        >
                           <option>Connected</option>
                           <option>No Answer</option>
                           <option>Busy</option>
                           <option>Wrong Number</option>
                           <option>Left Voicemail</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Duration (Sec)</label>
                        <input 
                           type="number" 
                           value={newLog.duration}
                           onChange={e => setNewLog({...newLog, duration: parseInt(e.target.value)})}
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-blue-600"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Notes / Action Items</label>
                     <textarea 
                        value={newLog.content}
                        onChange={e => setNewLog({...newLog, content: e.target.value})}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-xs text-slate-700 outline-none focus:border-blue-600 h-24 resize-none"
                        placeholder="Discussed payment plan..."
                     />
                  </div>

                  <button 
                     onClick={handleSave}
                     disabled={!selectedCustomerId}
                     className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     <Save size={16}/> Save Record
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
