import React from 'react';
import { Terminal } from 'lucide-react';

export const TerminalConsole: React.FC<{ logs: string[] }> = ({ logs }) => (
  <div className="bg-[#0d1117] p-6 md:p-8 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/5 h-full relative font-mono">
    <div className="flex-1 text-blue-400/90 text-[10px] md:text-xs space-y-2 overflow-y-auto custom-scrollbar">
      <div className="text-slate-600 mb-4 border-b border-white/5 pb-2">
        <p>ArrearsFlow Sovereign Kernel v3.5.0</p>
        <p>Authenticated SJ_ROOT_ACCESS</p>
        <p>Secure Tunnel: 139.59.10.70:3000</p>
        <p>Local DB: 127.0.0.1 (Colocated)</p>
      </div>
      {logs.map((l, i) => (
        <div key={i} className="flex gap-3 break-all animate-in slide-in-from-left-1">
          <span className="opacity-20 shrink-0 select-none">[{i}]</span>
          <span className={l.includes('ERROR') || l.includes('FAIL') ? 'text-rose-500' : l.includes('SUCCESS') ? 'text-emerald-400' : ''}>{l}</span>
        </div>
      ))}
      <div className="flex items-center gap-3 text-white pt-4">
        <span className="text-blue-500 font-bold">root@node-139-59-10-70:~#</span>
        <span className="animate-pulse w-1.5 h-4 bg-blue-500 shadow-[0_0_10px_#00A3FF]"></span>
      </div>
    </div>
    <div className="absolute top-4 right-6 flex gap-2 opacity-30">
       <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
       <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
    </div>
  </div>
);