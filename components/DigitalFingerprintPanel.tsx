
import React from 'react';
import { 
  Globe, Smartphone, Wifi, MapPin, ShieldCheck, Activity, Search, 
  Terminal, Lock, Eye, ScanFace, CreditCard, AlertTriangle, Fingerprint, FileText, CheckCircle2,
  FileBadge
} from 'lucide-react';
import { Customer, DigitalFingerprint } from '../types';

interface Props {
  customer: Customer;
  onEnrich: () => void;
  isAdmin: boolean;
}

export const DigitalFingerprintPanel: React.FC<Props> = ({ customer, onEnrich, isAdmin }) => {
  const fps = customer.fingerprints || [];
  const deepvue = customer.deepvueInsights;

  return (
    <div className={`p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden ${isAdmin ? 'bg-slate-900 text-white' : 'bg-[#0f172a] text-white'}`}>
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
             <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                <Fingerprint className="text-blue-500" size={32}/>
                Digital Forensic Audit
             </h3>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mt-2 flex items-center gap-3">
                <Activity size={14} className="animate-pulse"/> Live Tracking Enabled
             </p>
          </div>
          {!deepvue && (
             <button 
               onClick={onEnrich}
               className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-900/50 transition-all"
             >
                <ScanFace size={16}/> Fetch Deepvue Intelligence
             </button>
          )}
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
          
          {/* Left Column: Access Logs */}
          <div className="space-y-6">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Access & Payment Telemetry</span>
                <span className="px-2 py-1 bg-white/10 rounded text-[9px] font-mono text-emerald-400">{fps.length} EVENTS</span>
             </div>
             
             <div className="h-[400px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {fps.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-700 rounded-2xl">
                      <Globe size={32} className="mb-3 opacity-50"/>
                      <p className="text-[10px] font-black uppercase tracking-widest">No Digital Footprint Detected</p>
                   </div>
                )}
                {fps.map((fp) => (
                   <div key={fp.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors group relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                               fp.eventType === 'PAYMENT_SUCCESS' ? 'text-emerald-400' : 
                               fp.eventType === 'UPI_INTENT' ? 'text-amber-400' : 'text-blue-400'
                            }`}>
                               {fp.eventType.replace('_', ' ')}
                            </p>
                            <p className="font-mono text-xs text-slate-300">{fp.timestamp.replace('T', ' ')}</p>
                         </div>
                         <div className="text-right">
                            <div className="flex items-center gap-2 justify-end text-[10px] font-bold text-slate-400 uppercase">
                               <MapPin size={10}/> {fp.location.city}, {fp.location.country}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 mt-1">{fp.ipAddress}</div>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-medium text-slate-400 bg-black/20 p-3 rounded-xl">
                         <div className="flex items-center gap-2">
                            <Smartphone size={12}/> {fp.device.model} ({fp.device.os})
                         </div>
                         <div className="flex items-center gap-2">
                            <Wifi size={12}/> {fp.network.isp} ({fp.network.type.toUpperCase()})
                         </div>
                      </div>

                      {fp.metadata?.upiId && (
                         <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center animate-in slide-in-from-left-2">
                            <span className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-2">
                               <CreditCard size={12}/> Setu UPI Verified
                            </span>
                            <span className="font-mono text-xs font-bold text-white bg-emerald-500/20 px-2 py-1 rounded">
                               {fp.metadata.upiId}
                            </span>
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </div>

          {/* Right Column: Deepvue Insights */}
          <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Deepvue Intelligence Layer</span>
                {deepvue && <span className="text-[10px] font-mono text-slate-400">REFRESHED: {deepvue.lastRefresh}</span>}
             </div>

             {deepvue ? (
                <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5">
                      <ScanFace size={120}/>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-8 mb-8">
                      <div>
                         <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">KYC Status</p>
                         <div className="flex items-center gap-2 text-emerald-400 font-black text-xl">
                            <ShieldCheck size={24}/> {deepvue.kycStatus}
                         </div>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Proprietary Risk Score</p>
                         <div className={`text-3xl font-black tabular-nums ${deepvue.riskScore > 700 ? 'text-emerald-400' : deepvue.riskScore > 600 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {deepvue.riskScore}
                         </div>
                      </div>
                   </div>

                   {/* Credit & Financials */}
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Credit Score (CIBIL)</p>
                         <div className={`text-xl font-black tabular-nums ${deepvue.creditScore > 750 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {deepvue.creditScore}
                         </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black uppercase text-slate-400 mb-2">GST Filing Behavior</p>
                         <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{deepvue.gstFilingStatus}</span>
                            <div className="flex gap-1">
                               {[1,2,3,4,5].map(i => (
                                  <div key={i} className={`w-1.5 h-3 rounded-sm ${deepvue.gstFilingStatus === 'REGULAR' ? 'bg-emerald-500' : i%2===0 ? 'bg-rose-500' : 'bg-slate-700'}`}></div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* NEW: Verified Document Vault (Arranged Data) */}
                   <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black uppercase text-blue-400 mb-2 flex items-center gap-2">
                         <FileBadge size={12}/> Verified Document Vault
                      </p>
                      
                      <div className="space-y-2">
                         {(deepvue.verifiedDocuments || []).map((doc) => (
                            <div key={doc.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                               <div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-black text-slate-300 uppercase">{doc.type}</span>
                                     {doc.status === 'VALID' ? <CheckCircle2 size={10} className="text-emerald-500"/> : <AlertTriangle size={10} className="text-rose-500"/>}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{doc.documentNumber}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-[9px] font-bold text-slate-500 uppercase">Extracted Name</div>
                                  <div className="text-[10px] font-bold text-white uppercase">{doc.nameOnDocument}</div>
                               </div>
                            </div>
                         ))}
                         {(!deepvue.verifiedDocuments || deepvue.verifiedDocuments.length === 0) && (
                            <div className="text-center text-[10px] text-slate-600 py-2">No documents in vault</div>
                         )}
                      </div>
                   </div>

                   <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Associated Entities</p>
                      <div className="flex flex-wrap gap-2">
                         {deepvue.associatedEntities.map(e => (
                            <span key={e} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-[9px] font-bold uppercase border border-blue-500/30">
                               {e}
                            </span>
                         ))}
                      </div>
                   </div>

                </div>
             ) : (
                <div className="flex-1 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-8">
                   <Lock size={48} className="text-slate-600 mb-4"/>
                   <h4 className="text-lg font-black uppercase text-slate-400">Intelligence Locked</h4>
                   <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                      Deepvue API connection required to fetch KYC, Credit Score, and verify PAN/Aadhar submitted via Payment Link.
                   </p>
                   <button 
                     onClick={onEnrich}
                     className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                   >
                      Initialize Deepvue
                   </button>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
