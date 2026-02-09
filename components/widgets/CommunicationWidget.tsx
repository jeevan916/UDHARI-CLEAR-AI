
import React, { useState } from 'react';
import { MessageSquare, Phone, Clock, CheckCircle2 } from 'lucide-react';
import { CommunicationLog } from '../../types';

interface CommunicationWidgetProps {
  logs: CommunicationLog[];
}

export const CommunicationWidget: React.FC<CommunicationWidgetProps> = ({ logs }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'whatsapp' | 'call'>('all');

  const filteredLogs = logs.filter(l => activeTab === 'all' || l.type === activeTab).slice(0, 5);

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
       <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
             <MessageSquare size={20} className="text-blue-400"/> Protocol Bridge
          </h4>
          <div className="flex gap-2">
             {['all', 'whatsapp', 'call'].map(t => (
                <button 
                   key={t}
                   onClick={() => setActiveTab(t as any)}
                   className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                >
                   {t}
                </button>
             ))}
          </div>
       </div>

       <div className="space-y-3">
          {filteredLogs.length === 0 && (
             <div className="text-center p-6 text-slate-500 text-xs font-bold uppercase tracking-widest">No Recent Logs</div>
          )}
          {filteredLogs.map(log => (
             <div key={log.id} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.type === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                   {log.type === 'whatsapp' ? <MessageSquare size={14}/> : <Phone size={14}/>}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">{log.type}</span>
                      <span className="text-[9px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                   </div>
                   <p className="text-xs text-slate-400 font-medium truncate mt-1">{log.content}</p>
                   <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${log.outcome === 'Connected' || log.status === 'read' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                         {log.outcome || log.status}
                      </span>
                      {log.duration && <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1"><Clock size={10}/> {log.duration}s</span>}
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
