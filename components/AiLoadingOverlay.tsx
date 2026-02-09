
import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const AiLoadingOverlay: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => (
   <div className="fixed inset-0 z-[1000] bg-[#010409]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-16 text-center animate-in fade-in duration-500">
      <div className="relative mb-20">
         <BrainCircuit size={220} className={`${isAdmin ? 'text-amber-400' : 'text-blue-500'} animate-pulse`} />
         <div className="absolute inset-0 bg-blue-500/20 blur-[100px] animate-pulse"></div>
      </div>
      <h3 className="text-7xl font-black text-white uppercase tracking-[0.8em] mb-10 leading-none">
        {isAdmin ? 'ROOT AUTHORITY' : 'ADVISORY NODE'}
      </h3>
      <div className="flex flex-col items-center gap-6">
         <p className="text-blue-300/80 font-mono text-[14px] uppercase tracking-[0.6em] animate-bounce font-black">
           {isAdmin ? 'SYNCHRONIZING DETERMINISTIC LEDGER CLUSTERS...' : 'PARSING BEHAVIORAL SNAPSHOTS...'}
         </p>
         <div className="w-96 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full ${isAdmin ? 'bg-amber-400' : 'bg-blue-600'} animate-progress-fast`}></div>
         </div>
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-10">Node: 139.59.10.70 Kernel Handshake [v4.2]</p>
      </div>
   </div>
);
