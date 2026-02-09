
import React, { useRef, useEffect } from 'react';
import { Terminal, Activity, Circle, Server } from 'lucide-react';

export const TerminalConsole: React.FC<{ logs: string[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#010409] h-full rounded-[4rem] border border-white/5 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden font-mono relative group">
      
      {/* Header */}
      <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex justify-between items-center shrink-0 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <Terminal size={20} className="text-emerald-500 animate-pulse" />
          <div>
             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">System Monitor</span>
             <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Enterprise Logic Kernel v5.5</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Circle size={10} className="fill-rose-500 text-rose-500 shadow-[0_0_10px_#f43f5e]" />
          <Circle size={10} className="fill-amber-500 text-amber-500 shadow-[0_0_10px_#f59e0b]" />
          <Circle size={10} className="fill-emerald-500 text-emerald-500 shadow-[0_0_10px_#10b981]" />
        </div>
      </div>
      
      {/* Body */}
      <div className="p-10 flex-1 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed space-y-3 bg-black/20" ref={scrollRef}>
        <div className="text-slate-600 mb-8 border-b border-white/5 pb-6 space-y-1.5">
           <p className="text-blue-500 font-black tracking-[0.2em]">--- SYSTEM BOOT SEQUENCE ---</p>
           <div className="flex justify-between items-center opacity-70">
              <span>ENVIRONMENT:</span>
              <span className="text-blue-400 font-bold">PRODUCTION_CORE</span>
           </div>
           <div className="flex justify-between items-center opacity-70">
              <span>LEDGER_LINK:</span>
              <span className="text-emerald-400 font-bold">ACTIVE (SYNCED)</span>
           </div>
           <div className="flex justify-between items-center opacity-70">
              <span>CORTEX_ENGINE:</span>
              <span className="text-amber-400 font-bold">GEMINI_3_PRO_ACTIVE</span>
           </div>
           <p className="text-emerald-500 mt-4 font-black border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-lg w-fit">
             STATUS: NOMINAL
           </p>
        </div>

        {logs.map((log, i) => (
          <div key={i} className="flex gap-4 animate-in slide-in-from-left-4 duration-300 group/log hover:bg-white/5 p-1 rounded transition-colors">
             <span className="text-slate-700 shrink-0 select-none group-hover/log:text-slate-500">
                [{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
             </span>
             <span className={`break-all font-bold ${
                log.includes('ERR') || log.includes('FAIL') ? 'text-rose-400' : 
                log.includes('OK') || log.includes('SYNC') || log.includes('COMPLETE') ? 'text-emerald-400' : 
                log.includes('AUDIT') || log.includes('REASON') ? 'text-amber-400' : 
                'text-slate-300'
             }`}>
               {log}
             </span>
          </div>
        ))}
        
        <div className="flex items-center gap-3 pt-6">
           <span className="text-blue-500 font-black flex items-center gap-2">
              <Server size={12}/> system@primary-core:~$
           </span>
           <span className="w-2.5 h-5 bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></span>
        </div>
      </div>

      <div className="absolute bottom-8 right-12 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
        <Activity size={180} className="text-blue-500" />
      </div>
    </div>
  );
};
