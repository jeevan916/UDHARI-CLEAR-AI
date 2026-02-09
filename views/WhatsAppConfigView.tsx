import React from 'react';
import { Smartphone, ShieldCheck, Globe, Activity, Key, Hash, Code, Lock, CheckCircle2 } from 'lucide-react';

export const WhatsAppConfigView: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const credentials = [
    { label: 'Meta App ID', value: '1062930964364496', icon: <Code size={18}/> },
    { label: 'Phone Number ID', value: '101607512732681', icon: <Hash size={18}/> },
    { label: 'WABA ID', value: '105647948987401', icon: <Globe size={18}/> },
    { label: 'Live Token', value: 'EAAPG...SskAkgZDZD', icon: <Key size={18}/>, secret: true }
  ];

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
        <div className={`p-10 rounded-[2.5rem] shadow-2xl bg-emerald-500 text-white`}>
          <Smartphone size={56}/>
        </div>
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">WhatsApp Infrastructure</h2>
          <div className="flex items-center gap-4 mt-4">
             <p className="text-emerald-400 font-bold uppercase text-[11px] tracking-[0.4em] flex items-center gap-3">
                <Activity size={16} className="animate-pulse"/> Status: LIVE_CONNECTED
             </p>
             <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase text-slate-400">v21.0</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-emerald-500">
             <Lock size={20}/>
          </div>
          <h3 className="text-xl font-black uppercase flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={24}/> Production Credentials
          </h3>
          <div className="space-y-5">
            {credentials.map(c => (
              <div key={c.label}>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">{c.label}</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl group hover:border-emerald-400 transition-colors">
                  <span className="text-slate-400">{c.icon}</span>
                  <span className="font-mono text-xs font-bold text-slate-600 truncate">
                    {c.secret ? '••••••••••••••••••••••••' : c.value}
                  </span>
                  {c.secret && <span className="ml-auto text-[9px] text-emerald-500 font-black uppercase bg-emerald-50 px-2 py-0.5 rounded">Active</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
          <h3 className="text-xl font-black uppercase flex items-center gap-3">
            <Activity className="text-emerald-500" size={24}/> Webhook Handshake
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
                Glitch Node is actively listening. Inbound messages from 101607512732681 are being processed in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};