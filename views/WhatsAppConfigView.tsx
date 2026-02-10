import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Globe, Activity, Key, Hash, Code, Lock, CheckCircle2, Save, RefreshCw } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';

export const WhatsAppConfigView: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const { state, actions } = useAppStore();
  
  // Find the WhatsApp integration from the store
  const waIntegration = state.integrations.find(n => n.id === 'whatsapp_meta') || {
    id: 'whatsapp_meta',
    name: 'WhatsApp Meta API',
    category: 'Protocol Bridge',
    fields: [
      { key: 'app_id', label: 'Meta App ID', type: 'text', value: '1062930964364496' },
      { key: 'phone_id', label: 'Phone Number ID', type: 'text', value: '101607512732681' },
      { key: 'waba_id', label: 'WABA ID', type: 'text', value: '105647948987401' },
      { key: 'access_token', label: 'Live System Token', type: 'password', value: '' }
    ]
  };

  const [localFields, setLocalFields] = useState(waIntegration.fields);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalFields(waIntegration.fields);
  }, [waIntegration]);

  const handleFieldChange = (key: string, value: string) => {
    setLocalFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    // Simulate API persistence delay
    await new Promise(r => setTimeout(r, 1000));
    actions.updateIntegrationConfig('whatsapp_meta', localFields);
    setIsSaving(false);
  };

  const webhook = {
    url: 'https://dawn-shiny-week.glitch.me/webhook',
    token: 'WEBHOOK_VERIFIED'
  };

  return (
    <div className="max-w-5xl space-y-10 animate-in fade-in">
      <div className="bg-slate-900 text-white p-12 rounded-[4rem] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Smartphone size={100}/>
        </div>
        <div className="p-10 rounded-[2.5rem] shadow-2xl bg-emerald-500 text-white">
          <Smartphone size={56}/>
        </div>
        <div className="flex-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">WhatsApp Infrastructure</h2>
          <div className="flex items-center gap-4 mt-4">
             <p className="text-emerald-400 font-bold uppercase text-[11px] tracking-[0.4em] flex items-center gap-3">
                <Activity size={16} className="animate-pulse"/> Status: LIVE_CONNECTED
             </p>
             <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase text-slate-400">v21.0 CLOUD_API</span>
          </div>
        </div>
        {isAdmin && (
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-10 py-5 bg-white text-slate-900 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
           >
              {isSaving ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>}
              {isSaving ? 'Synchronizing...' : 'Update Node'}
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 relative overflow-hidden">
          <h3 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900">
            <ShieldCheck className="text-blue-600" size={24}/> Cloud Credentials
          </h3>
          <div className="space-y-5">
            {localFields.map(field => (
              <div key={field.key}>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">{field.label}</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl group hover:border-emerald-400 transition-colors">
                  <span className="text-slate-400">
                    {field.key === 'access_token' ? <Key size={18}/> : <Code size={18}/>}
                  </span>
                  <input 
                    type={field.type}
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    readOnly={!isAdmin}
                    className="bg-transparent font-mono text-xs font-bold text-slate-700 w-full outline-none"
                    placeholder={`Enter ${field.label}...`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
          <h3 className="text-xl font-black uppercase flex items-center gap-3 text-slate-900">
            <Activity className="text-emerald-500" size={24}/> Webhook Listener
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Callback URL</label>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl font-mono text-xs font-bold text-emerald-800 flex justify-between items-center">
                {webhook.url}
                <CheckCircle2 size={14}/>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Verify Token</label>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl font-mono text-xs font-bold text-emerald-800 flex justify-between items-center">
                {webhook.token}
                <CheckCircle2 size={14}/>
              </div>
            </div>
            <div className="pt-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                System Node is actively receiving payloads. Inbound messages from Meta are being parsed and committed to the communication ledger in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};