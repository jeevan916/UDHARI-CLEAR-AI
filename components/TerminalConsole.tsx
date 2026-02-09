
import React from 'react';
import { Terminal, Server, TerminalSquare } from 'lucide-react';

export const TerminalConsole: React.FC<{ logs: string[] }> = ({ logs }) => (
  <div className="bg-[#010409] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 h-[400px] md:h-[500px] relative font-mono">
    <div className="flex-1 text-emerald-400/90 text-[10px] md:text-xs space-y-2 md:space-y-3 overflow-y-auto custom-scrollbar">
      {logs.map((l, i) => (
        <div key={i} className="flex gap-3 md:gap-4 break-all">
          <span className="opacity-20 shrink-0">[{i}]</span>
          <span>{l}</span>
        </div>
      ))}
      <div className="flex items-center gap-3 text-white pt-4">
        <span className="text-emerald-500 font-bold text-[10px] md:text-xs">root@node-139-59-10-70:~#</span>
        <span className="animate-pulse w-1.5 h-4 md:w-2 md:h-5 bg-blue-500 shadow-[0_0_10px_cyan]"></span>
      </div>
    </div>
    <div className="absolute top-4 right-6 md:top-6 md:right-8 flex gap-2 opacity-30">
       <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-500"></div>
       <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-500"></div>
       <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500"></div>
    </div>
  </div>
);
