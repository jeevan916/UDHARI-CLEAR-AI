import React, { useState } from 'react';
import { Server, Wifi, Activity, Database, Lock, Globe, CreditCard, MessageSquare, ScanFace, Landmark, Settings2 } from 'lucide-react';
import { IntegrationNode, IntegrationField } from '../types';
import { IntegrationConfigModal } from '../components/IntegrationConfigModal';

interface Props {
  integrations: IntegrationNode[];
  onUpdateConfig: (nodeId: string, fields: IntegrationField[]) => void;
  isAdmin: boolean;
}

export const IntegrationsView: React.FC<Props> = ({ integrations, onUpdateConfig, isAdmin }) => {
  const [selectedNode, setSelectedNode] = useState<IntegrationNode | null>(null);

  const getIcon = (id: string) => {
    switch (id) {
      case 'razorpay': return <CreditCard size={20}/>;
      case 'setu': return <Globe size={20}/>;
      case 'msg91': return <MessageSquare size={20}/>;
      case 'gemini': return <Database size={20}/>;
      case 'deepvue': return <ScanFace size={20}/>;
      case 'lotuspay': return <Landmark size={20}/>;
      default: return <Server size={20}/>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in pb-20">
       <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
             <Server className="text-blue-600"/> Infrastructure Nodes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {integrations.map(n => (
               <div key={n.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col gap-4 relative overflow-hidden group hover:border-blue-200 transition-colors">
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${n.status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : n.status === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`}></div>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-md">
                     {getIcon(n.id)}
                  </div>
                  <div>
                     <h3 className="font-black text-slate-900 uppercase">{n.name}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.category}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed min-h-[40px]">
                     {n.description}
                  </p>
                  <div className="mt-2 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] font-mono text-slate-500">
                     <span>LATENCY: <span className="font-bold">{n.latency}</span></span>
                     {isAdmin && (
                        <button 
                           onClick={() => setSelectedNode(n)}
                           className="flex items-center gap-1 text-blue-600 font-bold uppercase hover:underline"
                        >
                           <Settings2 size={12}/> Configure
                        </button>
                     )}
                  </div>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-[#0f172a] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-6 mb-8">
             <div className="p-4 bg-white/10 rounded-2xl"><Server size={32}/></div>
             <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Cluster Configuration</h3>
                <p className="text-blue-400 font-mono text-xs mt-1">Environment Configured</p>
             </div>
          </div>
          
          <div className="space-y-4 font-mono text-xs">
             <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400">ENDPOINT_ALIAS</span>
                <span className="text-emerald-400">pay.sanghavijewellers.in</span>
             </div>
             <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400">FIREWALL_RULES</span>
                <span className="text-blue-400">ALLOW 443, 80 (Whitelisted Only)</span>
             </div>
             <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400">DB_STATUS</span>
                <span className="text-amber-400">ENV_MANAGED (LOCKED)</span>
             </div>
          </div>
       </div>

       {selectedNode && (
          <IntegrationConfigModal 
             isOpen={!!selectedNode} 
             onClose={() => setSelectedNode(null)} 
             node={selectedNode}
             onSave={onUpdateConfig}
          />
       )}
    </div>
  );
};