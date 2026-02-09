
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Smartphone, Zap, Save, RefreshCw, 
  Braces, Play, CheckCircle2, AlertTriangle, FileText, Bot, Sparkles,
  Server, ShieldCheck, Hash, LayoutTemplate, Copy, Globe, Signal, Scan,
  Image as ImageIcon, Link, Type, MousePointerClick, Send, ExternalLink, Trash2, Plus, Cloud, ArrowUpRight, Tag, Code
} from 'lucide-react';
import { Template } from '../types';
import { generateSmartTemplate, optimizeTemplateContent } from '../services/geminiService';
import { whatsappService } from '../services/whatsappService';

interface TemplateArchitectViewProps {
  templates: Template[];
  onUpdateTemplates: (templates: Template[]) => void;
}

export const TemplateArchitectView: React.FC<TemplateArchitectViewProps> = ({ templates, onUpdateTemplates }) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [testPreview, setTestPreview] = useState('');
  
  // States for Meta Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  
  // AI State
  const [aiIntent, setAiIntent] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Filter templates based on active tab
  const visibleTemplates = templates.filter(t => t.channel === activeTab);

  useEffect(() => {
     if (visibleTemplates.length > 0) {
        setSelectedTemplate(visibleTemplates[0]);
        setTestPreview('');
     } else {
        setSelectedTemplate(null);
     }
  }, [activeTab]);

  // LIVE META SYNC ACTION
  const handleSyncMeta = async () => {
    if (activeTab !== 'whatsapp') return;
    setIsSyncing(true);
    try {
      const liveTemplates = await whatsappService.fetchWabaTemplates();
      // Merge live templates with existing, preferring live data for status updates
      const merged = [...templates];
      liveTemplates.forEach(liveT => {
         const idx = merged.findIndex(t => t.name === liveT.name && t.channel === 'whatsapp');
         if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...liveT }; // Update existing
         } else {
            // New template from Meta - Assign default context if missing
            merged.push({ 
               ...liveT, 
               context: 'Imported from Meta',
               label: liveT.name.replace(/_/g, ' ') 
            });
         }
      });
      onUpdateTemplates(merged);
    } catch (e) {
      console.error("Sync Failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdate = (updates: Partial<Template>) => {
    if (!selectedTemplate) return;
    const updated = { ...selectedTemplate, ...updates };
    setSelectedTemplate(updated);
    onUpdateTemplates(templates.map(t => t.id === updated.id ? updated : t));
  };

  const createNewTemplate = () => {
     const newId = `TPL_${Math.floor(Math.random() * 10000)}`;
     const newT: Template = {
        id: newId,
        label: 'New Payment Reminder',
        name: 'credit_flow_new_payment_reminder', // Auto-generated default
        context: 'General Follow-up',
        channel: activeTab,
        content: activeTab === 'whatsapp' ? 'Hello {{1}}, ...' : 'Dear Customer, ...',
        variables: ['1'],
        status: 'draft',
        category: 'UTILITY',
        ...(activeTab === 'sms' ? { senderId: 'AURAGD', msg91Route: 'transactional', dltTemplateId: '' } : {
           waHeader: { type: 'NONE' },
           waFooter: '',
           waButtons: []
        })
     };
     onUpdateTemplates([...templates, newT]);
     setSelectedTemplate(newT);
  };

  const generatePreview = () => {
    if (!selectedTemplate) return;
    let text = selectedTemplate.content;
    text = text.replace('{{1}}', 'Rahul');
    text = text.replace('{{2}}', '45,200');
    text = text.replace('{{3}}', 'https://setu.co/pay/xj9s8');
    text = text.replace('{{customer_name}}', 'Rahul'); // Fallback for old vars
    text = text.replace('{#var#}', '45,200'); // SMS Var
    setTestPreview(text);
  };

  const handleAiGenerate = async () => {
    if (!aiIntent) return;
    setIsAiGenerating(true);
    const result = await generateSmartTemplate(aiIntent, selectedTemplate?.category || 'UTILITY');
    
    const newButtons = result.suggestedButtons.map(btnText => ({
       type: 'QUICK_REPLY',
       text: btnText
    }));

    handleUpdate({ 
       content: result.content,
       waButtons: newButtons as any,
       // If generated, also suggest a name
       name: result.suggestedName || selectedTemplate?.name,
       label: aiIntent
    });
    setIsAiGenerating(false);
  };

  const handleAiOptimize = async () => {
     if(!selectedTemplate) return;
     setIsOptimizing(true);
     const optimizedContent = await optimizeTemplateContent(selectedTemplate.content, selectedTemplate.context || 'Debt Collection');
     handleUpdate({ content: optimizedContent });
     setIsOptimizing(false);
  };

  const handleLabelChange = (newLabel: string) => {
     // Auto-generate snake_case name based on label
     const generatedName = 'credit_flow_' + newLabel.trim().toLowerCase()
        .replace(/[^a-z0-9 ]/g, '') // remove special chars
        .replace(/\s+/g, '_')       // replace spaces with underscores
        .substring(0, 50);          // limit length

     handleUpdate({ label: newLabel, name: generatedName });
  };

  // WhatsApp Component Handlers
  const addButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
     if (!selectedTemplate?.waButtons) return;
     const newBtns = [...selectedTemplate.waButtons, { type, text: 'New Button', value: '' }];
     handleUpdate({ waButtons: newBtns });
  };

  const removeButton = (index: number) => {
     if (!selectedTemplate?.waButtons) return;
     const newBtns = [...selectedTemplate.waButtons];
     newBtns.splice(index, 1);
     handleUpdate({ waButtons: newBtns });
  };

  const pushToMeta = async () => {
     if (!selectedTemplate || activeTab !== 'whatsapp') return;
     setIsPushing(true);
     try {
        const result = await whatsappService.createWabaTemplate(selectedTemplate);
        if (result.success) {
           handleUpdate({ 
              status: 'PENDING', // Meta usually puts new templates in pending review
              name: result.mappedName 
           });
        }
     } catch (e) {
        alert("Failed to push to Meta. Check console for details.");
     } finally {
        setIsPushing(false);
     }
  };

  const getStatusColor = (status: string) => {
     switch (status) {
        case 'APPROVED': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
        case 'REJECTED': return 'text-rose-500 bg-rose-50 border-rose-200';
        case 'PENDING': return 'text-amber-500 bg-amber-50 border-amber-200';
        case 'active': return 'text-emerald-500 bg-emerald-50 border-emerald-200'; // Legacy
        default: return 'text-slate-500 bg-slate-50 border-slate-200';
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in h-full flex flex-col">
       
       {/* Top Navigation / Channel Switcher */}
       <div className="flex justify-between items-center">
         <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex gap-2 w-fit mx-auto md:mx-0">
            <button 
               onClick={() => setActiveTab('whatsapp')}
               className={`px-8 py-3 rounded-[1.5rem] flex items-center gap-3 transition-all ${activeTab === 'whatsapp' ? 'bg-[#075E54] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <MessageSquare size={18}/>
               <div className="text-left">
                  <span className="block text-[10px] font-black uppercase tracking-widest leading-none">WhatsApp</span>
                  <span className="block text-[9px] font-bold opacity-80 mt-1">Meta Business</span>
               </div>
            </button>
            <button 
               onClick={() => setActiveTab('sms')}
               className={`px-8 py-3 rounded-[1.5rem] flex items-center gap-3 transition-all ${activeTab === 'sms' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <Server size={18}/>
               <div className="text-left">
                  <span className="block text-[10px] font-black uppercase tracking-widest leading-none">MSG91 SMS</span>
                  <span className="block text-[9px] font-bold opacity-80 mt-1">DLT Gateway</span>
               </div>
            </button>
         </div>

         {/* Meta Sync Button */}
         {activeTab === 'whatsapp' && (
            <button 
               onClick={handleSyncMeta}
               disabled={isSyncing}
               className="px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-400 transition-all flex items-center gap-3"
            >
               <RefreshCw size={18} className={`${isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-400'}`}/>
               <div className="text-left">
                   <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {isSyncing ? 'Syncing...' : 'Sync Meta Cloud'}
                   </span>
               </div>
               <Cloud size={16} className="text-emerald-500"/>
            </button>
         )}
       </div>

       <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[600px]">
          
          {/* Left Panel: Template List */}
          <div className="w-full xl:w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col shrink-0">
             <div className={`p-6 border-b flex justify-between items-center ${activeTab === 'whatsapp' ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <div>
                   <h2 className={`text-lg font-black uppercase tracking-tighter flex items-center gap-2 ${activeTab === 'whatsapp' ? 'text-emerald-800' : 'text-indigo-800'}`}>
                     {activeTab === 'whatsapp' ? <Bot size={18}/> : <Hash size={18}/>}
                     {activeTab === 'whatsapp' ? 'Templates' : 'DLT Records'}
                   </h2>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold ${activeTab === 'whatsapp' ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-200 text-indigo-800'}`}>
                   {visibleTemplates.length}
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {visibleTemplates.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t); setTestPreview(''); }}
                    className={`w-full p-4 rounded-2xl text-left border transition-all group relative overflow-hidden ${selectedTemplate?.id === t.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-100 hover:border-blue-300'}`}
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                       <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${selectedTemplate?.id === t.id ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                         {t.context || 'General'}
                       </span>
                       <span className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase border ${getStatusColor(t.status)}`}>
                          {t.status}
                       </span>
                    </div>
                    <h4 className="font-bold text-xs uppercase truncate mb-1 relative z-10">{t.label || t.name}</h4>
                    <p className="text-[9px] font-medium opacity-60 line-clamp-1 relative z-10">{t.content}</p>
                    {selectedTemplate?.id === t.id && (
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeTab === 'whatsapp' ? 'bg-[#075E54]' : 'bg-indigo-500'}`}></div>
                    )}
                  </button>
                ))}
             </div>
             
             <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={createNewTemplate}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 font-black uppercase text-xs hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                   <Zap size={16}/> Create New
                </button>
             </div>
          </div>

          {/* Center Panel: Editor */}
          {selectedTemplate ? (
             <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
                {/* AI & Config Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-6">
                   <div className="flex flex-col md:flex-row gap-6 mb-6">
                      <div className="flex-1 space-y-4">
                         {/* LABEL & AUTO-NAME */}
                         <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Template Label (Internal)</label>
                            <input 
                              type="text" 
                              value={selectedTemplate.label || ''}
                              onChange={(e) => handleLabelChange(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-300"
                              placeholder="e.g. Friendly Payment Reminder"
                              disabled={selectedTemplate.status === 'APPROVED'}
                            />
                         </div>
                         <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                               <Code size={10}/> Meta System Name (Auto-Generated)
                            </label>
                            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-500 break-all">
                               {selectedTemplate.name}
                            </div>
                         </div>
                      </div>

                      <div className="w-full md:w-48 space-y-4">
                         {/* CONTEXT / SCENARIO */}
                         <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block flex items-center gap-2">
                               <Tag size={10}/> Scenario Context
                            </label>
                            <input 
                              type="text" 
                              value={selectedTemplate.context || ''}
                              onChange={(e) => handleUpdate({ context: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                              placeholder="e.g. Legal Notice"
                            />
                         </div>
                         <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Category</label>
                            <select 
                               value={selectedTemplate.category}
                               onChange={(e) => handleUpdate({ category: e.target.value })}
                               className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none"
                               disabled={selectedTemplate.status === 'APPROVED'}
                            >
                               <option value="UTILITY">Utility</option>
                               <option value="TRANSACTIONAL">Transactional</option>
                               <option value="MARKETING">Marketing</option>
                            </select>
                         </div>
                      </div>
                   </div>

                   {/* AI Generator - Only available for drafts or edits */}
                   {selectedTemplate.status !== 'APPROVED' && (
                      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${activeTab === 'whatsapp' ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
                         <div className={`p-2 rounded-lg ${activeTab === 'whatsapp' ? 'bg-emerald-200 text-emerald-700' : 'bg-indigo-200 text-indigo-700'}`}>
                            <Sparkles size={16}/>
                         </div>
                         <input 
                           type="text" 
                           value={aiIntent}
                           onChange={(e) => setAiIntent(e.target.value)}
                           placeholder={`Ask Gemini to generate a "${selectedTemplate.context || 'generic'}" template...`}
                           className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-600 placeholder:text-slate-400"
                         />
                         <button 
                            onClick={handleAiGenerate}
                            disabled={isAiGenerating || !aiIntent}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all ${activeTab === 'whatsapp' ? 'bg-[#075E54] hover:bg-[#064e46]' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                         >
                            {isAiGenerating ? <RefreshCw size={12} className="animate-spin"/> : 'Generate'}
                         </button>
                      </div>
                   )}
                </div>

                {/* Editor Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                   
                   {/* WhatsApp Rich Header */}
                   {activeTab === 'whatsapp' && (
                     <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                           <label className="text-[10px] font-black uppercase text-slate-400 block">Header Type</label>
                           <div className="flex gap-2">
                              {['NONE', 'TEXT', 'IMAGE'].map(type => (
                                 <button 
                                   key={type}
                                   disabled={selectedTemplate.status === 'APPROVED'}
                                   onClick={() => handleUpdate({ waHeader: { type: type as any, content: '' } })}
                                   className={`px-3 py-1 rounded text-[9px] font-bold ${selectedTemplate.waHeader?.type === type ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                                 >
                                    {type}
                                 </button>
                              ))}
                           </div>
                        </div>
                        {selectedTemplate.waHeader?.type !== 'NONE' && (
                           <input 
                              type="text" 
                              placeholder={selectedTemplate.waHeader?.type === 'IMAGE' ? "Image URL..." : "Header Text..."}
                              value={selectedTemplate.waHeader?.content || ''}
                              onChange={(e) => handleUpdate({ waHeader: { ...selectedTemplate.waHeader!, content: e.target.value } })}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                              disabled={selectedTemplate.status === 'APPROVED'}
                           />
                        )}
                     </div>
                   )}

                   <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 block flex items-center gap-2">
                        <Braces size={14}/> 
                        {activeTab === 'whatsapp' ? 'Message Body' : 'DLT Content (Variable: {#var#})'}
                      </label>
                      {selectedTemplate.status !== 'APPROVED' && (
                         <button 
                           onClick={handleAiOptimize}
                           disabled={isOptimizing}
                           className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                         >
                            {isOptimizing ? <RefreshCw size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                            Optimize Language
                         </button>
                      )}
                   </div>
                   
                   <div className="relative">
                      <textarea 
                        value={selectedTemplate.content}
                        onChange={(e) => handleUpdate({ content: e.target.value })}
                        className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] font-mono text-sm text-slate-700 leading-relaxed outline-none focus:border-blue-500 transition-all resize-none"
                        disabled={selectedTemplate.status === 'APPROVED'}
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                         {activeTab === 'whatsapp' && (
                            <>
                              <button className="px-2 py-1 bg-slate-200 text-slate-600 text-[9px] font-bold rounded" onClick={() => handleUpdate({ content: selectedTemplate.content + ' *bold*' })}>B</button>
                              <button className="px-2 py-1 bg-slate-200 text-slate-600 text-[9px] font-bold rounded" onClick={() => handleUpdate({ content: selectedTemplate.content + ' _italic_' })}>I</button>
                            </>
                         )}
                         <button className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-md text-[9px] font-bold text-slate-600 font-mono transition-colors" onClick={() => handleUpdate({ content: selectedTemplate.content + ' {{1}}' })}>
                             {`{{1}}`}
                         </button>
                      </div>
                   </div>

                   {/* WhatsApp Rich Footer & Buttons */}
                   {activeTab === 'whatsapp' && (
                     <div className="mt-6 space-y-6">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                           <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Footer Text (Optional)</label>
                           <input 
                              type="text" 
                              value={selectedTemplate.waFooter || ''}
                              onChange={(e) => handleUpdate({ waFooter: e.target.value })}
                              placeholder="e.g. Reply STOP to unsubscribe"
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-bold outline-none"
                              disabled={selectedTemplate.status === 'APPROVED'}
                           />
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                           <div className="flex justify-between items-center mb-4">
                              <label className="text-[10px] font-black uppercase text-slate-400 block">Interactive Buttons</label>
                              <div className="flex gap-2">
                                 <button onClick={() => addButton('QUICK_REPLY')} disabled={selectedTemplate.status === 'APPROVED'} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold flex items-center gap-1"><Plus size={10}/> Reply</button>
                                 <button onClick={() => addButton('URL')} disabled={selectedTemplate.status === 'APPROVED'} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[9px] font-bold flex items-center gap-1"><Plus size={10}/> URL</button>
                                 <button onClick={() => addButton('PHONE_NUMBER')} disabled={selectedTemplate.status === 'APPROVED'} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[9px] font-bold flex items-center gap-1"><Plus size={10}/> Phone</button>
                              </div>
                           </div>
                           <div className="space-y-3">
                              {selectedTemplate.waButtons?.map((btn, idx) => (
                                 <div key={idx} className="flex gap-2 items-center">
                                    <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                       {btn.type === 'URL' ? <Link size={14}/> : btn.type === 'PHONE_NUMBER' ? <Smartphone size={14}/> : <MousePointerClick size={14}/>}
                                    </div>
                                    <input 
                                       type="text" 
                                       value={btn.text} 
                                       onChange={(e) => {
                                          const newBtns = [...selectedTemplate.waButtons!];
                                          newBtns[idx].text = e.target.value;
                                          handleUpdate({ waButtons: newBtns });
                                       }}
                                       className="flex-1 p-2 border rounded-lg text-xs font-bold"
                                       placeholder="Button Text"
                                       disabled={selectedTemplate.status === 'APPROVED'}
                                    />
                                    {btn.type !== 'QUICK_REPLY' && (
                                       <input 
                                          type="text" 
                                          value={btn.value} 
                                          onChange={(e) => {
                                             const newBtns = [...selectedTemplate.waButtons!];
                                             newBtns[idx].value = e.target.value;
                                             handleUpdate({ waButtons: newBtns });
                                          }}
                                          className="flex-1 p-2 border rounded-lg text-xs font-bold"
                                          placeholder={btn.type === 'URL' ? "https://..." : "+91..."}
                                          disabled={selectedTemplate.status === 'APPROVED'}
                                       />
                                    )}
                                    <button onClick={() => removeButton(idx)} disabled={selectedTemplate.status === 'APPROVED'} className="text-rose-400 hover:text-rose-600"><Trash2 size={16}/></button>
                                 </div>
                              ))}
                              {(!selectedTemplate.waButtons || selectedTemplate.waButtons.length === 0) && (
                                 <p className="text-center text-[10px] text-slate-400 py-2">No buttons added.</p>
                              )}
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          ) : (
             <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-center text-center p-10">
                <div>
                   <LayoutTemplate size={48} className="text-slate-200 mx-auto mb-4"/>
                   <h3 className="text-xl font-black uppercase text-slate-300">Select a Template</h3>
                </div>
             </div>
          )}

          {/* Right Panel: Preview & Validation */}
          {selectedTemplate && (
             <div className={`w-full xl:w-80 rounded-[2.5rem] shadow-2xl p-6 flex flex-col relative overflow-hidden shrink-0 border border-white/10 ${activeTab === 'whatsapp' ? 'bg-[#111b21] text-white' : 'bg-slate-900 text-white'}`}>
                <div className="flex justify-between items-center mb-6">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Device Simulator</h4>
                   {activeTab === 'whatsapp' && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                         <CheckCircle2 size={10}/> Meta API
                      </span>
                   )}
                </div>
                
                {/* Phone Screen */}
                <div className="flex-1 bg-white rounded-[2rem] overflow-hidden relative border-8 border-slate-800 flex flex-col">
                   {/* Phone Status Bar */}
                   <div className={`h-6 w-full flex justify-between items-center px-4 text-[8px] font-bold text-white ${activeTab === 'whatsapp' ? 'bg-[#008069]' : 'bg-slate-800'}`}>
                      <span>10:30</span>
                      <div className="flex gap-1">
                         <Signal size={8}/>
                         <div className="w-3 h-2 bg-white rounded-[1px]"></div>
                      </div>
                   </div>

                   {/* Phone Header */}
                   <div className={`h-12 w-full flex items-center px-4 gap-3 ${activeTab === 'whatsapp' ? 'bg-[#008069] text-white' : 'bg-slate-100 text-slate-800 border-b border-slate-200'}`}>
                      <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-xs text-slate-600">
                         {activeTab === 'whatsapp' ? 'RJ' : 'A'}
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-bold leading-none">{activeTab === 'whatsapp' ? 'Rahul Jewellers' : (selectedTemplate.senderId || 'AURAGD')}</p>
                         {activeTab === 'whatsapp' && <p className="text-[8px] opacity-80">Business Account</p>}
                      </div>
                   </div>

                   {/* Chat Area */}
                   <div className={`flex-1 p-3 ${activeTab === 'whatsapp' ? 'bg-[#e5ddd5]' : 'bg-white'}`}>
                      {testPreview ? (
                         <div className={`max-w-[95%] rounded-lg text-[10px] leading-relaxed relative animate-in zoom-in-95 ${activeTab === 'whatsapp' ? 'bg-white text-slate-900 shadow-sm rounded-tl-none ml-0 p-1' : 'bg-slate-100 text-slate-800 mb-2 p-3'}`}>
                            
                            {/* WA Header Image */}
                            {activeTab === 'whatsapp' && selectedTemplate.waHeader?.type === 'IMAGE' && (
                               <div className="rounded-lg overflow-hidden mb-1">
                                  <img src={selectedTemplate.waHeader.content || "https://via.placeholder.com/300x150"} alt="Header" className="w-full h-24 object-cover"/>
                               </div>
                            )}
                            {/* WA Header Text */}
                            {activeTab === 'whatsapp' && selectedTemplate.waHeader?.type === 'TEXT' && (
                               <p className="font-bold text-slate-900 mb-1 px-2 pt-2 text-xs">{selectedTemplate.waHeader.content}</p>
                            )}

                            {/* Body */}
                            <div className={activeTab === 'whatsapp' ? "px-2 pb-1" : ""}>
                               {testPreview}
                            </div>
                            
                            {/* WA Footer */}
                            {activeTab === 'whatsapp' && selectedTemplate.waFooter && (
                               <p className="text-[9px] text-slate-400 px-2 pb-1">{selectedTemplate.waFooter}</p>
                            )}

                            {activeTab === 'whatsapp' && <span className="text-[8px] text-slate-400 block text-right px-2 pb-1">10:30 AM</span>}

                            {/* WA Buttons */}
                            {activeTab === 'whatsapp' && selectedTemplate.waButtons && selectedTemplate.waButtons.length > 0 && (
                               <div className="border-t border-slate-100 mt-2">
                                  {selectedTemplate.waButtons.map((btn, idx) => (
                                     <div key={idx} className="py-2 text-center text-blue-500 font-bold border-b border-slate-100 last:border-0 flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-50">
                                        {btn.type === 'URL' && <ExternalLink size={10}/>}
                                        {btn.type === 'PHONE_NUMBER' && <Smartphone size={10}/>}
                                        {btn.type === 'QUICK_REPLY' && <Send size={10}/>}
                                        {btn.text}
                                     </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      ) : (
                         <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                            <Play size={24} className="mb-2"/>
                            <span className="text-[8px] font-bold uppercase">Run Simulation</span>
                         </div>
                      )}
                   </div>
                </div>

                <div className="mt-6 flex gap-2">
                   <button 
                     onClick={generatePreview}
                     className="flex-1 py-3 bg-blue-600 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-500 transition-all"
                   >
                      Test Render
                   </button>
                   {activeTab === 'whatsapp' && selectedTemplate.status === 'draft' && (
                      <button 
                        onClick={pushToMeta}
                        disabled={isPushing}
                        className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isPushing ? 'bg-amber-500' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                      >
                         {isPushing ? (
                             <>
                                <RefreshCw size={12} className="animate-spin"/> Pushing...
                             </>
                         ) : (
                             <>
                                <ArrowUpRight size={14}/> Push to Meta
                             </>
                         )}
                      </button>
                   )}
                </div>
             </div>
          )}
       </div>
    </div>
  );
};
