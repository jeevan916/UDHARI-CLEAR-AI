
import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, Activity, Zap, Check, X, Edit2, Sliders, MessageSquare, Smartphone, 
  ArrowRight, AlertTriangle, RefreshCw, Bot, BrainCircuit, ShieldCheck, ChevronDown, Plus, Radio, Clock, ArrowDown, PlayCircle, Calculator, CheckCircle2,
  Lock, Network
} from 'lucide-react';
import { GradeRule, Customer, CommunicationLog, Template } from '../types';
import { formatCurrency, analyzeCustomerBehavior } from '../utils/debtUtils';
import { generateOptimizedGradeRules } from '../services/geminiService';

interface GradesViewProps {
  isAdmin: boolean;
  gradeRules: GradeRule[];
  setGradeRules: (rules: GradeRule[]) => void;
  customers: Customer[];
  callLogs?: CommunicationLog[];
  templates: Template[];
}

export const GradesView: React.FC<GradesViewProps> = ({ isAdmin, gradeRules, setGradeRules, customers, callLogs = [], templates }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GradeRule>>({});
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  
  // Simulation State
  const [simBalance, setSimBalance] = useState(12500);
  const [simDays, setSimDays] = useState(45);

  // Filter templates by channel for dropdowns
  const waTemplates = templates.filter(t => t.channel === 'whatsapp' && t.status === 'active');
  const smsTemplates = templates.filter(t => t.channel === 'sms' && t.status === 'active');

  const getTemplateName = (id?: string) => {
    return templates.find(t => t.id === id)?.name || id || 'Default';
  };

  // Helper to calculate impact of rules on current customers
  const getMatchCount = (ruleId: string) => {
    return customers.filter(c => {
       const analysis = analyzeCustomerBehavior(c, gradeRules, callLogs);
       return analysis.calculatedGrade === ruleId;
    }).length;
  };

  // Simulate a single mock customer against the rules
  const simulationResult = useMemo(() => {
     const mockCustomer: Customer = {
        ...customers[0],
        id: 'sim_1',
        currentBalance: simBalance,
        lastTxDate: new Date(Date.now() - (simDays * 24 * 60 * 60 * 1000)).toISOString(),
        lastCallDate: '',
        lastWhatsappDate: ''
     };
     return analyzeCustomerBehavior(mockCustomer, gradeRules, []);
  }, [simBalance, simDays, gradeRules, customers]);

  const startEdit = (g: GradeRule) => {
    setEditingId(g.id);
    setEditForm(g);
  };

  const saveEdit = () => {
    // Fixed: Use gradeRules from props instead of functional update
    setGradeRules(gradeRules.map(g => g.id === editingId ? { ...g, ...editForm } : g));
    setEditingId(null);
  };

  const handleAiOptimize = async () => {
    setIsAiOptimizing(true);
    const stats = {
       count: customers.length,
       totalBalance: customers.reduce((s, c) => s + c.currentBalance, 0),
       avgBalance: Math.round(customers.reduce((s, c) => s + c.currentBalance, 0) / customers.length),
       maxDormancy: Math.max(...customers.map(c => {
          const lastTx = new Date(c.lastTxDate).getTime();
          return Math.floor((Date.now() - lastTx) / (1000 * 3600 * 24));
       }))
    };
    
    const optimizedRules = await generateOptimizedGradeRules(stats);
    if (optimizedRules && optimizedRules.length === 4) {
       setGradeRules(optimizedRules);
    }
    setIsAiOptimizing(false);
  };

  const handleAddGrade = () => {
    // Generate next ID (e.g., E, F, G...)
    const ids = gradeRules.map(g => g.id);
    let nextChar = 'A';
    if (ids.length > 0) {
       // Find the max character code
       const maxCode = Math.max(...ids.map(id => id.charCodeAt(0)));
       nextChar = String.fromCharCode(maxCode + 1);
    }

    // Fix: Using correct property names from GradeRule interface (whatsappTemplateId and smsTemplateId instead of templateId)
    const newRule: GradeRule = {
       id: nextChar,
       label: 'New Segment',
       color: 'slate',
       priority: gradeRules.length + 1,
       minBalance: 0,
       daysSincePayment: 0,
       daysSinceContact: 0,
       antiSpamThreshold: 24,
       antiSpamUnit: 'hours',
       whatsapp: false,
       sms: false,
       whatsappTemplateId: '',
       smsTemplateId: '',
       frequencyDays: 30
    };

    setGradeRules([...gradeRules, newRule]);
    setEditingId(newRule.id);
    setEditForm(newRule);
  };

  // Sort rules for display EXACTLY as the Kernel processes them
  // Priority ASC -> then Strictest Financials (MinBalance DESC)
  const sortedRules = useMemo(() => {
    return [...gradeRules].sort((a,b) => {
       if (a.priority !== b.priority) return a.priority - b.priority;
       return b.minBalance - a.minBalance; // Visual consistency with Kernel
    });
  }, [gradeRules]);

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
       {/* Dashboard Header */}
       <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
               <BrainCircuit className="text-emerald-500 animate-pulse"/>
               <span className="text-xs font-black uppercase text-emerald-400 tracking-widest">Logic Kernel v3.0</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 leading-none">
               Autoheal™ Engine
            </h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Deterministic Risk Segmentation Matrix</p>
          </div>

          <div className="relative z-10 flex gap-4">
             {isAdmin && (
                <>
                  <button 
                    onClick={handleAiOptimize}
                    disabled={isAiOptimizing}
                    className="px-8 py-5 bg-white/10 border border-white/20 rounded-2xl flex items-center gap-3 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                     {isAiOptimizing ? <RefreshCw size={20} className="animate-spin text-emerald-400"/> : <Bot size={20} className="text-emerald-400"/>}
                     <div className="text-left">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-400">Gemini Core</span>
                        <span className="block text-xs font-bold text-white uppercase">{isAiOptimizing ? 'Optimizing...' : 'Generate Logic'}</span>
                     </div>
                  </button>

                  <button 
                    onClick={handleAddGrade}
                    className="px-8 py-5 bg-white/10 border border-white/20 rounded-2xl flex items-center gap-3 hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                  >
                     <div className="p-1.5 bg-blue-500 rounded-lg text-white shadow-lg">
                        <Plus size={16} strokeWidth={4}/>
                     </div>
                     <div className="text-left">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-blue-400">Manual</span>
                        <span className="block text-xs font-bold text-white uppercase">Add Grade</span>
                     </div>
                  </button>
                </>
             )}
             <div className="px-8 py-5 bg-blue-600 rounded-2xl flex flex-col items-center justify-center border border-blue-400 shadow-xl shadow-blue-900/50">
                <span className="text-2xl font-black text-white">{customers.length}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-200">Entities</span>
             </div>
          </div>
       </div>

       {/* Logic Flow Visualization */}
       <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative">
          
          {/* Waterfall Connecting Line (Desktop Only) */}
          <div className="hidden xl:block absolute top-[20%] left-0 right-0 h-1 bg-slate-100 -z-10 translate-y-12"></div>

          {sortedRules.map((g, index) => {
             const isEditing = editingId === g.id;
             const matchedCount = getMatchCount(g.id);
             const isLast = index === sortedRules.length - 1;
             
             // Visual Logic: "Active" if sim matches this grade
             const isSimMatch = simulationResult.calculatedGrade === g.id;
             
             return (
                <div key={g.id} className={`flex flex-col relative group transition-all duration-300 ${isEditing ? 'z-20 scale-105' : 'z-10'} ${isSimMatch ? '-translate-y-4' : ''}`}>
                   {/* Priority Badge */}
                   <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl z-20 flex items-center gap-2 whitespace-nowrap transition-colors ${isSimMatch ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 text-white border-slate-600'}`}>
                      {index === 0 ? "Start Check" : "Else If..."}
                   </div>
                   
                   {/* Waterfall Arrow */}
                   {!isLast && (
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-0 hidden xl:flex text-slate-300">
                         <ArrowRight size={24} strokeWidth={3}/>
                      </div>
                   )}

                   <div className={`flex-1 bg-white rounded-[2.5rem] border-2 shadow-xl overflow-hidden flex flex-col transition-all mt-4 ${isEditing ? 'border-blue-500 shadow-blue-500/20' : isSimMatch ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-50' : 'border-slate-100 hover:border-slate-300'}`}>
                      
                      {/* Grade Header */}
                      <div className={`p-6 bg-${g.color}-50 border-b border-${g.color}-100 flex justify-between items-start`}>
                         <div>
                            <h3 className={`text-4xl font-black text-${g.color}-500 mb-1 flex items-center gap-2`}>
                               {g.id} {isSimMatch && <CheckCircle2 size={24} className="text-emerald-500"/>}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{g.label}</p>
                         </div>
                         <div className={`px-4 py-2 bg-white rounded-xl text-xs font-black shadow-sm text-${g.color}-600 border border-${g.color}-100`}>
                            {matchedCount} Matches
                         </div>
                      </div>

                      {/* Logic Body */}
                      <div className="p-6 space-y-6 flex-1 bg-slate-50/50">
                         {isEditing ? (
                            <div className="space-y-4 bg-white p-4 rounded-2xl border border-blue-200 shadow-inner">
                               
                               <div className="grid grid-cols-1 gap-4">
                                  <div className="space-y-2">
                                     <label className="text-[9px] font-black uppercase text-blue-400 block">Label</label>
                                     <input type="text" value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500"/>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[9px] font-black uppercase text-blue-400 block">Color Theme</label>
                                     <select value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500 uppercase">
                                        <option value="slate">Slate (Default)</option>
                                        <option value="rose">Rose (Critical)</option>
                                        <option value="amber">Amber (Warning)</option>
                                        <option value="blue">Blue (Watch)</option>
                                        <option value="emerald">Emerald (Safe)</option>
                                        <option value="indigo">Indigo (Info)</option>
                                        <option value="violet">Violet (Tier 1)</option>
                                     </select>
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                     <label className="text-[9px] font-black uppercase text-blue-400 block">Priority (1=High)</label>
                                     <input type="number" value={editForm.priority} onChange={e => setEditForm({...editForm, priority: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold font-mono outline-none focus:border-blue-500"/>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[9px] font-black uppercase text-blue-400 block">Min. Balance (₹)</label>
                                     <input type="number" value={editForm.minBalance} onChange={e => setEditForm({...editForm, minBalance: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold font-mono outline-none focus:border-blue-500"/>
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                     <label className="text-[9px] font-black uppercase text-blue-400 block">Payment Gap (Days)</label>
                                     <input type="number" value={editForm.daysSincePayment} onChange={e => setEditForm({...editForm, daysSincePayment: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold font-mono outline-none focus:border-blue-500"/>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[9px] font-black uppercase text-rose-500 block flex items-center gap-1"><Clock size={10}/> Anti-Spam</label>
                                     <div className="flex gap-2">
                                       <input 
                                          type="number" 
                                          value={editForm.antiSpamThreshold || 0} 
                                          onChange={e => setEditForm({...editForm, antiSpamThreshold: parseInt(e.target.value)})} 
                                          className="w-2/3 bg-rose-50 border border-rose-200 p-2 rounded-lg text-xs font-bold font-mono outline-none focus:border-rose-500 text-rose-700"
                                       />
                                       <select 
                                          value={editForm.antiSpamUnit || 'days'}
                                          onChange={e => setEditForm({...editForm, antiSpamUnit: e.target.value as any})}
                                          className="w-1/3 bg-rose-50 border border-rose-200 p-2 rounded-lg text-xs font-bold uppercase text-rose-700 outline-none"
                                       >
                                          <option value="hours">Hrs</option>
                                          <option value="days">Days</option>
                                       </select>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="h-px bg-slate-100 my-2"></div>
                               
                               {/* WhatsApp Config */}
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1"><MessageSquare size={10}/> WhatsApp Auto</label>
                                    <input type="checkbox" checked={editForm.whatsapp} onChange={e => setEditForm({...editForm, whatsapp: e.target.checked})} className="accent-emerald-500"/>
                                  </div>
                                  {editForm.whatsapp && (
                                     <select 
                                       value={editForm.whatsappTemplateId || ''} 
                                       onChange={e => setEditForm({...editForm, whatsappTemplateId: e.target.value})}
                                       className="w-full bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-[10px] font-bold text-emerald-800 outline-none"
                                     >
                                        <option value="">Select Template...</option>
                                        {waTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                     </select>
                                  )}
                               </div>

                               {/* SMS Config */}
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1"><Smartphone size={10}/> SMS Fallback</label>
                                    <input type="checkbox" checked={editForm.sms} onChange={e => setEditForm({...editForm, sms: e.target.checked})} className="accent-indigo-500"/>
                                  </div>
                                  {editForm.sms && (
                                     <select 
                                       value={editForm.smsTemplateId || ''} 
                                       onChange={e => setEditForm({...editForm, smsTemplateId: e.target.value})}
                                       className="w-full bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-[10px] font-bold text-indigo-800 outline-none"
                                     >
                                        <option value="">Select Template...</option>
                                        {smsTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                     </select>
                                  )}
                               </div>
                            </div>
                         ) : (
                            <div className="space-y-3">
                               <div className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm ${isSimMatch ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                  <span className="text-[10px] font-bold uppercase text-slate-400 w-24 shrink-0">IF Balance &gt;</span>
                                  <span className="font-mono text-xs font-black text-slate-800">{formatCurrency(g.minBalance)}</span>
                               </div>
                               <div className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm ${isSimMatch ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                  <span className="text-[10px] font-bold uppercase text-slate-400 w-24 shrink-0">AND Unpaid &gt;</span>
                                  <span className="font-mono text-xs font-black text-slate-800">{g.daysSincePayment} Days</span>
                               </div>
                               <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100 shadow-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></div>
                                  <span className="text-[10px] font-bold uppercase text-rose-400 w-24 shrink-0">Cooldown &gt;</span>
                                  <span className="font-mono text-xs font-black text-rose-800">
                                     {g.antiSpamThreshold} {g.antiSpamUnit === 'hours' ? 'Hrs' : 'Days'}
                                  </span>
                               </div>
                            </div>
                         )}

                         <div className="flex items-center justify-center">
                            <ChevronDown size={16} className={`text-slate-300 ${isSimMatch ? 'text-emerald-400' : ''}`}/>
                         </div>

                         {/* Action Block */}
                         <div className={`p-4 rounded-2xl border ${isEditing ? 'bg-blue-50 border-blue-200' : isSimMatch ? 'bg-emerald-100 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
                            <p className={`text-[9px] font-black uppercase mb-3 flex items-center gap-2 ${isSimMatch ? 'text-emerald-600' : 'text-slate-400'}`}>
                               <Zap size={10}/> Automated Protocol:
                            </p>
                            
                            <div className="space-y-2">
                               {g.whatsapp ? (
                                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                     <div className="flex items-center gap-2 text-emerald-700">
                                        <MessageSquare size={12}/> 
                                        <span className="text-[10px] font-black uppercase">WhatsApp</span>
                                     </div>
                                     <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 max-w-[100px] truncate">
                                        {getTemplateName(g.whatsappTemplateId)}
                                     </span>
                                  </div>
                               ) : (
                                  <div className="flex items-center gap-2 text-slate-400 px-2 py-1">
                                     <MessageSquare size={12}/> <span className="text-[10px] uppercase font-bold strike-through decoration-2">WhatsApp Disabled</span>
                                  </div>
                               )}

                               {g.sms ? (
                                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                     <div className="flex items-center gap-2 text-indigo-700">
                                        <Smartphone size={12}/> 
                                        <span className="text-[10px] font-black uppercase">SMS</span>
                                     </div>
                                     <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 max-w-[100px] truncate">
                                        {getTemplateName(g.smsTemplateId)}
                                     </span>
                                  </div>
                               ) : (
                                  <div className="flex items-center gap-2 text-slate-400 px-2 py-1">
                                     <Smartphone size={12}/> <span className="text-[10px] uppercase font-bold strike-through decoration-2">SMS Disabled</span>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Edit Actions */}
                      {isAdmin && (
                         <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                            {isEditing ? (
                               <div className="flex gap-2 w-full">
                                  <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 font-bold"><X size={16} className="mx-auto"/></button>
                                  <button onClick={saveEdit} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg font-bold"><Check size={16} className="mx-auto"/></button>
                               </div>
                            ) : (
                               <button onClick={() => startEdit(g)} className="w-full py-3 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-slate-50">
                                  <Edit2 size={14}/> Modify Logic
                               </button>
                            )}
                         </div>
                      )}
                   </div>
                </div>
             );
          })}
       </div>

      {/* Logic Verification Simulator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 w-full max-w-2xl px-4">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 pl-6">
           <div className="flex items-center gap-3 border-r border-white/10 pr-6 mr-2 hidden md:flex">
             <Calculator className="text-emerald-400"/>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logic Simulator</p>
               <p className="text-xs font-bold text-white">Test Range & Overlap</p>
             </div>
           </div>
           
           <div className="flex items-center gap-4 flex-1">
             <div className="flex flex-col gap-1">
               <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Balance (₹)</label>
               <input 
                 type="number" 
                 value={simBalance} 
                 onChange={e => setSimBalance(parseInt(e.target.value))} 
                 className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-24 text-xs font-bold text-white outline-none focus:border-blue-500"
               />
             </div>
             <div className="flex flex-col gap-1">
               <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Dormancy (Days)</label>
               <input 
                 type="number" 
                 value={simDays} 
                 onChange={e => setSimDays(parseInt(e.target.value))} 
                 className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-20 text-xs font-bold text-white outline-none focus:border-blue-500"
               />
             </div>
             <ArrowRight size={20} className="text-slate-600"/>
             <div className="flex-1 bg-white/5 rounded-2xl p-2 px-4 border border-white/5 relative overflow-hidden">
                <div className="absolute top-1 right-2 flex items-center gap-1">
                   <Network size={8} className="text-emerald-500"/>
                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Kernel Synced</span>
                </div>
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Resulting Segment</p>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${simulationResult.actionColor === 'rose' ? 'bg-rose-500' : simulationResult.actionColor === 'amber' ? 'bg-amber-500' : simulationResult.actionColor === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'} shadow-[0_0_8px_currentColor]`}></div>
                   <span className="font-black text-lg leading-none tracking-tight">Grade {simulationResult.calculatedGrade}</span>
                </div>
             </div>
           </div>
        </div>
      </div>

    </div>
  );
};
