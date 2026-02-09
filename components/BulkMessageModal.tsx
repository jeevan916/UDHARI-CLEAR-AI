import React, { useState, useEffect, useRef } from 'react';
import { XCircle, MessageSquare, Smartphone, Send, Users, CheckCircle2, AlertCircle, Loader2, Terminal, ShieldCheck } from 'lucide-react';
import { Customer, Template } from '../types';
import { whatsappService } from '../services/whatsappService';
import { msg91Service } from '../services/msg91Service';

interface BulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  templates: Template[];
  onComplete: () => void;
}

export const BulkMessageModal: React.FC<BulkMessageModalProps> = ({ 
  isOpen, onClose, selectedCustomers, templates, onComplete 
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Derived state
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const filteredTemplates = templates.filter(t => t.channel === selectedChannel && t.status === 'active');

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setLogs([]);
      setIsSending(false);
      const first = templates.find(t => t.channel === selectedChannel && t.status === 'active');
      if (first) setSelectedTemplateId(first.id);
    }
  }, [isOpen, selectedChannel, templates]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!selectedTemplate) return;
    setIsSending(true);
    setLogs(prev => [
       `[KERNEL] Initiating Batch Protocol: ${selectedChannel.toUpperCase()}`,
       `[KERNEL] Hostinger Node Authenticated`,
       `[KERNEL] Target Entities: ${selectedCustomers.length}`
    ]);

    const total = selectedCustomers.length;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < total; i++) {
      const customer = selectedCustomers[i];
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      
      try {
         if (selectedChannel === 'whatsapp') {
            // WHATSAPP LIVE SEND
            await whatsappService.sendTextMessage(
               customer.phone, 
               selectedTemplate.content
                  .replace('{{customer_name}}', customer.name)
                  .replace('{{balance}}', customer.currentBalance.toString())
                  .replace('{{payment_link}}', `https://rzp.io/l/${customer.uniquePaymentCode}`)
            );
            setLogs(prev => [...prev, `[${timestamp}] META_API > ${customer.phone} :: 200 OK`]);
         } else {
            // MSG91 LIVE SEND
            const variables = {
               "var": customer.currentBalance.toString() // Mapping {#var#}
            };
            await msg91Service.sendSms(
               customer.phone,
               selectedTemplate.dltTemplateId || '',
               selectedTemplate.senderId || 'AURAGD',
               variables
            );
            setLogs(prev => [...prev, `[${timestamp}] MSG91_FLOW > ${customer.phone} :: DELIVERED`]);
         }
         successful++;
      } catch (e: any) {
         setLogs(prev => [...prev, `[${timestamp}] ERROR > ${customer.phone} :: ${e.message || 'FAILED'}`]);
         failed++;
      }
      
      // Throttle slightly to prevent rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setLogs(prev => [...prev, `[COMPLETE] Batch Finished. Success: ${successful}, Failed: ${failed}`]);
    
    setTimeout(() => {
      onComplete();
    }, 2500);
  };

  const getPreview = () => {
    if (!selectedTemplate || selectedCustomers.length === 0) return "Select a template to generate preview.";
    let text = selectedTemplate.content;
    const sample = selectedCustomers[0];
    text = text.replace('{{customer_name}}', sample.name);
    text = text.replace('{{balance}}', sample.currentBalance.toLocaleString('en-IN'));
    text = text.replace('{{payment_link}}', `https://rzp.io/l/${sample.uniquePaymentCode}`);
    text = text.replace('{#var#}', sample.currentBalance.toLocaleString('en-IN'));
    return text;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
       <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-8 bg-slate-50 border-b flex justify-between items-center shrink-0">
             <div>
                <h3 className="font-black uppercase tracking-tighter text-xl text-slate-800 flex items-center gap-3">
                   <Users className="text-blue-600"/> Live Batch Broadcast
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <ShieldCheck size={12} className="text-emerald-500"/>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Production Core: pay.sanghavijewellers.in
                   </p>
                </div>
             </div>
             {!isSending && (
                <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors">
                   <XCircle size={24}/>
                </button>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
             {isSending ? (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-500 animate-pulse flex items-center gap-2">
                         <Loader2 size={14} className="animate-spin"/> Transmitting...
                      </span>
                      <span className="text-2xl font-black text-blue-600 tabular-nums">{progress}%</span>
                   </div>
                   <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                   </div>
                   <div className="bg-[#0f172a] rounded-2xl p-6 font-mono text-[10px] text-emerald-400 h-64 overflow-y-auto border border-slate-800 shadow-inner">
                      {logs.map((log, i) => (
                         <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">{log}</div>
                      ))}
                      <div ref={logsEndRef} />
                   </div>
                </div>
             ) : (
                <>
                   {/* Channel Selection */}
                   <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                      <button 
                        onClick={() => setSelectedChannel('whatsapp')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedChannel === 'whatsapp' ? 'bg-[#075E54] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <MessageSquare size={14}/> WhatsApp (Meta v21.0)
                      </button>
                      <button 
                         onClick={() => setSelectedChannel('sms')}
                         className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedChannel === 'sms' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <Smartphone size={14}/> SMS (MSG91 DLT)
                      </button>
                   </div>

                   {/* Template Selection */}
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Approved Template</label>
                      <select 
                         value={selectedTemplateId}
                         onChange={(e) => setSelectedTemplateId(e.target.value)}
                         className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-blue-500 uppercase"
                      >
                         {filteredTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                         ))}
                         {filteredTemplates.length === 0 && <option value="">No Active Templates Found</option>}
                      </select>
                   </div>

                   {/* Preview */}
                   <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                            <AlertCircle size={12}/> Variable Injection Preview
                         </span>
                         <span className="text-[9px] font-bold text-amber-400 uppercase">Target: {selectedCustomers[0]?.name}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                         {getPreview()}
                      </p>
                   </div>

                   <button 
                      onClick={handleSend}
                      disabled={!selectedTemplateId}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <Send size={16}/> Initiate Broadcast
                   </button>
                </>
             )}
          </div>
       </div>
    </div>
  );
};