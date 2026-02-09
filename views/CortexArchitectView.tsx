
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, BrainCircuit, Terminal, Server, ShieldCheck, Code, 
  RefreshCw, Save, CheckCircle2, Bot, Ghost, 
  FileCode
} from 'lucide-react';
import { cortexService } from '../services/cortexService';

const MOCK_FILES = [
  { name: 'App.tsx', path: './App.tsx' },
  { name: 'useAppStore.ts', path: './hooks/useAppStore.ts' },
  { name: 'whatsappService.ts', path: './services/whatsappService.ts' },
  { name: 'debtUtils.ts', path: './utils/debtUtils.ts' },
  { name: 'DashboardView.tsx', path: './views/DashboardView.tsx' }
];

export const CortexArchitectView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(MOCK_FILES[0]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Handshake with 139.59.10.70 verified...",
    "Cortex Engine v4.2.0 initialising...",
    "Self-repair module: READY",
    "Awaiting root instructions."
  ]);
  const [proposedFix, setProposedFix] = useState<any>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const addLog = (log: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const handleReason = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setProposedFix(null);
    addLog(`Initiating reasoning cycle for: "${prompt}"`);
    
    try {
      addLog(`Reading ${selectedFile.path}...`);
      await new Promise(r => setTimeout(r, 800));
      
      const result = await cortexService.proposeModification(prompt, `// Mock content of ${selectedFile.name}\nexport const App = () => { ... }`);
      
      setProposedFix(result);
      addLog("Analysis complete. Proposed mutation generated.");
    } catch (e: any) {
      addLog(`CRITICAL: Reasoning failed - ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!proposedFix) return;
    setIsProcessing(true);
    addLog("Applying patch to filesystem...");
    
    await new Promise(r => setTimeout(r, 1500));
    addLog(`SUCCESS: ${proposedFix.fileAffected} rewritten on node 139.59.10.70`);
    addLog("Triggering system hot-reload...");
    
    setTimeout(() => {
       setProposedFix(null);
       setPrompt('');
       setIsProcessing(false);
       addLog("System mutation stable.");
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 lg:h-[calc(100vh-140px)] animate-in fade-in duration-500">
      
      {/* Header / Console Status */}
      <div className="bg-slate-900 text-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden shrink-0">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 animate-pulse hidden sm:block">
                  <Ghost className="text-blue-400" size={32}/>
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <ShieldCheck size={14} className="text-emerald-400"/>
                     <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em]">Root System "God Mode"</span>
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter leading-none">Cortex Architect</h2>
               </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
               <div className="flex-1 lg:flex-none px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center min-w-[100px]">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Mutations</span>
                  <span className="text-xl font-black text-white leading-none">42</span>
               </div>
               <div className="flex-1 lg:flex-none px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center min-w-[100px]">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Node Sync</span>
                  <span className="text-xl font-black text-white leading-none">100%</span>
               </div>
            </div>
         </div>
      </div>

      {/* Main Workspace - Column on Mobile, Row on Desktop */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
         
         {/* Left Panel: Controls (Scrollable on mobile, Fixed width on desktop) */}
         <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar">
            
            {/* File Explorer */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl flex flex-col">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2 shrink-0">
                  <FileCode size={14}/> Active File System
               </h3>
               <div className="flex flex-col gap-2">
                  {MOCK_FILES.map(file => (
                     <button 
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border text-left ${selectedFile.path === file.path ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300'}`}
                     >
                        <Code size={16} className={selectedFile.path === file.path ? 'text-blue-400' : 'text-slate-400'}/>
                        <span className="text-[11px] font-black uppercase tracking-tight truncate">{file.name}</span>
                        {selectedFile.path === file.path && <CheckCircle2 size={14} className="ml-auto text-emerald-400"/>}
                     </button>
                  ))}
               </div>
            </div>

            {/* AI Command Input */}
            <div className="bg-[#0f172a] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl flex flex-col">
               <h3 className="text-xs font-black uppercase text-blue-400 tracking-widest mb-4 flex items-center gap-2">
                  <Bot size={14}/> Command Engine
               </h3>
               <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the change..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white font-medium placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all resize-none h-32"
               />
               <button 
                  onClick={handleReason}
                  disabled={isProcessing || !prompt.trim()}
                  className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
               >
                  {isProcessing ? <RefreshCw size={14} className="animate-spin"/> : <Zap size={14}/>}
                  {isProcessing ? 'Thinking...' : 'Execute'}
               </button>
            </div>
         </div>

         {/* Right Panel: Terminal & Diff (Scrollable content) */}
         <div className="flex-1 bg-[#010409] rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden min-h-[500px]">
            
            {/* Terminal Output - Fixed Height Section */}
            <div className="h-48 lg:h-56 border-b border-white/5 p-6 font-mono text-emerald-400/80 text-[10px] lg:text-xs overflow-y-auto custom-scrollbar flex flex-col gap-2 shrink-0 bg-black/20">
               {terminalLogs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                     <span className="opacity-20 shrink-0 select-none">[{i}]</span>
                     <span className="break-all">{log}</span>
                  </div>
               ))}
               <div ref={terminalEndRef} />
            </div>

            {/* Dynamic Content Area - Fills remaining space */}
            <div className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar relative">
               {!proposedFix && !isProcessing && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 py-10">
                     <Terminal size={64} className="mb-4"/>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">System Idle</p>
                  </div>
               )}
               
               {isProcessing && !proposedFix && (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 animate-pulse py-10">
                     <BrainCircuit size={64} className="text-blue-600" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Processing...</p>
                  </div>
               )}

               {proposedFix && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-500 pb-10">
                     <div className="p-6 bg-blue-900/20 border border-blue-500/20 rounded-3xl">
                        <h4 className="text-[10px] font-black uppercase text-blue-400 mb-2">Reasoning Strategy</h4>
                        <p className="text-slate-300 text-xs leading-relaxed italic">"{proposedFix.explanation}"</p>
                     </div>

                     <div className="relative group">
                        <div className="absolute top-4 right-4 bg-slate-800 px-3 py-1 rounded-lg border border-white/5 text-[9px] font-black uppercase text-slate-400">
                           {proposedFix.fileAffected}
                        </div>
                        <div className="bg-[#0f172a] rounded-3xl p-6 pt-12 border border-white/10 font-mono text-[10px] lg:text-xs leading-relaxed text-slate-300 overflow-x-auto shadow-inner">
                           <pre>{proposedFix.suggestedCode}</pre>
                        </div>
                     </div>

                     <button 
                        onClick={handleApply}
                        className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99]"
                     >
                        <Save size={18}/> Commit Patch
                     </button>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};
