
import React, { useState } from 'react';
import { 
  Smartphone, MapPin, Landmark, TrendingUp, Copy, 
  Search, ShieldCheck, User, Wifi, Zap, BadgeCheck, Car, Briefcase, RefreshCw, AlertTriangle,
  History, Calendar, AlertCircle, Link, Check, ExternalLink, Download, QrCode, FileText, ScanFace
} from 'lucide-react';
import { DeepvueInsight, DeepvueLibrary } from '../types';
import { formatCurrency } from '../utils/debtUtils';
import { deepvueService } from '../services/deepvueService';

interface Props {
  insight: DeepvueInsight;
  customerName: string;
  customerPhone: string;
  onUpdate: (updates: Partial<DeepvueInsight>) => void;
}

export const DeepvueLibraryPanel: React.FC<Props> = ({ insight, customerName, customerPhone, onUpdate }) => {
  const [activeSection, setActiveSection] = useState<'contacts' | 'kyc' | 'assets' | 'loans'>('contacts');
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  
  // KYC Inputs
  const [inputAadhaar, setInputAadhaar] = useState('');
  const [inputPan, setInputPan] = useState('');
  const [kycResults, setKycResults] = useState<any[]>([]);

  // Equifax Session State
  const [equifaxSession, setEquifaxSession] = useState<{ txnId: string, url: string } | null>(null);
  const [pdfReportUrl, setPdfReportUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const library = insight.library;

  const setLoad = (key: string, state: boolean) => setLoadingMap(p => ({ ...p, [key]: state }));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyLink = () => {
     if(equifaxSession?.url) {
        copyToClipboard(equifaxSession.url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
     }
  };

  // --- MOBILE INTELLIGENCE HANDLERS ---

  const handleScanNetwork = async () => {
     setLoad('network', true);
     try {
        const net = await deepvueService.fetchMobileNetwork(customerPhone);
        const updatedContacts = library.contacts.map(c => {
           if (c.value === customerPhone) {
              return { ...c, carrier: net.carrier, circle: net.circle, dndStatus: net.dnd };
           }
           return c;
        });
        // Save to Database
        onUpdate({ library: { ...library, contacts: updatedContacts } });
     } finally { setLoad('network', false); }
  };

  const handleTraceName = async () => {
     setLoad('name', true);
     try {
        const res = await deepvueService.fetchMobileToName(customerPhone);
        // Save to Database
        onUpdate({ library: { ...library, mobileIdentityName: res.name } });
     } finally { setLoad('name', false); }
  };

  const handleTracePan = async () => {
     setLoad('pan', true);
     try {
        const doc = await deepvueService.fetchPanFromMobile(customerPhone);
        if (doc) {
           setKycResults(prev => [
              { type: 'Mobile-to-PAN', id: doc.documentNumber, name: doc.nameOnDocument, status: 'Success' },
              ...prev
           ]);
           alert(`Found Linked PAN: ${doc.documentNumber} (${doc.nameOnDocument})`);
           // Save to Database
           onUpdate({ 
              verifiedDocuments: [...(insight.verifiedDocuments || []), doc] 
           });
        } else {
           alert("No PAN linked to this mobile number.");
        }
     } catch (e) {
        alert("Failed to trace PAN.");
     } finally { setLoad('pan', false); }
  };

  const handleScanUpi = async () => {
     setLoad('upi', true);
     try {
        const upis = await deepvueService.fetchUpiHandles(customerPhone);
        // Save to Database
        onUpdate({ library: { ...library, bankAccounts: [...library.bankAccounts, ...upis] } });
        if (upis.length === 0) alert("No UPI Handles found linked to this mobile.");
     } finally { setLoad('upi', false); }
  };

  const handleFindVehicles = async () => {
     setLoad('rc', true);
     try {
        const rcs = await deepvueService.fetchRcFromMobile(customerPhone);
        // Save to Database
        onUpdate({ library: { ...library, rcDetails: [...(library.rcDetails || []), ...rcs] } });
        if (rcs.length === 0) alert("No Vehicles found linked to this mobile.");
     } finally { setLoad('rc', false); }
  };

  const handleCheckEmployment = async () => {
     setLoad('uan', true);
     try {
        const uans = await deepvueService.fetchUanDetails(customerPhone);
        // Save to Database
        onUpdate({ library: { ...library, uanDetails: uans } });
        if (uans.length === 0) alert("No Employment/UAN records found.");
     } finally { setLoad('uan', false); }
  };

  // --- NEW KYC HANDLERS (V1 APIs) ---

  const handleVerifyAadhaar = async () => {
     if (!inputAadhaar) return alert("Enter Aadhaar Number");
     setLoad('aadhaar_verify', true);
     try {
        const res = await deepvueService.verifyAadhaar(inputAadhaar);
        setKycResults(prev => [{ type: 'Aadhaar', id: inputAadhaar, status: 'Verified', raw: res }, ...prev]);
        // NOTE: Verification API doesn't return full doc, but status. We could log this if needed.
     } catch (e) {
        alert("Aadhaar Verification Failed");
     } finally { setLoad('aadhaar_verify', false); }
  };

  const handleVerifyPanBasic = async () => {
     if (!inputPan) return alert("Enter PAN Number");
     setLoad('pan_basic', true);
     try {
        const res = await deepvueService.verifyPanBasic(inputPan);
        setKycResults(prev => [{ type: 'PAN Basic', id: inputPan, status: 'Valid', raw: res }, ...prev]);
     } catch (e) {
        alert("PAN Verification Failed");
     } finally { setLoad('pan_basic', false); }
  };

  const handleVerifyPanPlus = async () => {
     if (!inputPan) return alert("Enter PAN Number");
     setLoad('pan_plus', true);
     try {
        const res = await deepvueService.verifyPanPlus(inputPan);
        setKycResults(prev => [{ type: 'PAN Plus', id: inputPan, status: 'Valid', raw: res }, ...prev]);
        
        // Save Verified Document if valid
        const doc = {
           id: `doc_pan_plus_${Date.now()}`,
           type: 'PAN',
           documentNumber: inputPan,
           status: 'VALID',
           nameOnDocument: res.full_name || 'Verified Entity',
           verificationDate: new Date().toISOString(),
           source: 'DEEPVUE_API',
           extractedFields: { entityType: res.category }
        };
        // Save to Database
        onUpdate({ verifiedDocuments: [...(insight.verifiedDocuments || []), doc as any] });

     } catch (e) {
        alert("PAN Plus Verification Failed");
     } finally { setLoad('pan_plus', false); }
  };

  // --- EQUIFAX FLOW ---

  const handleInitiateEquifax = async () => {
     setLoad('credit_init', true);
     try {
        // Step 1: Initiate Session to get URL
        const response = await deepvueService.initiateEquifaxSession(customerPhone, customerName);
        
        if (response.transaction_id && response.data?.redirect_url) {
           setEquifaxSession({ 
              txnId: response.transaction_id, 
              url: response.data.redirect_url 
           });
           setPdfReportUrl(null); // Reset report if starting new session
        } else {
           throw new Error("Invalid response from Deepvue Session API");
        }
     } catch (e) {
        console.error("Equifax Init Error", e);
        alert("Failed to initiate session.");
     } finally { 
        setLoad('credit_init', false); 
     }
  };

  const handleDownloadReport = async () => {
     if (!equifaxSession) return;
     setLoad('credit_fetch', true);
     try {
        // Step 2: Download Report using Transaction ID (after user authorizes)
        const report = await deepvueService.fetchEquifaxReport(equifaxSession.txnId);
        
        const newLoans = [...library.loans, ...report.loans];
        const newAddrs = [...library.addresses, ...report.addresses];
        const newContacts = [...library.contacts, ...report.phones];
        const newEnquiries = [...(library.creditEnquiries || []), ...(report.enquiries || [])];

        // Save to Database
        onUpdate({ 
           library: {
              ...library,
              loans: newLoans, 
              addresses: newAddrs as any, 
              contacts: newContacts as any,
              creditEnquiries: newEnquiries
           },
           creditScore: report.score 
        });
        
        if (report.pdf_url) {
           setPdfReportUrl(report.pdf_url);
        }
        
     } catch (e) {
        console.error("Equifax Fetch Error", e);
        alert("Report not ready. Ensure customer has authorized via the link.");
     } finally { 
        setLoad('credit_fetch', false); 
     }
  };

  const ActionButton = ({ label, icon: Icon, loadingKey, onClick, color = 'blue' }: any) => (
     <button 
        onClick={onClick}
        disabled={loadingMap[loadingKey]}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
           loadingMap[loadingKey] ? 'bg-slate-100 text-slate-400 border-slate-200' : 
           color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' :
           color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' :
           color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' :
           'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
        }`}
     >
        {loadingMap[loadingKey] ? <RefreshCw size={12} className="animate-spin"/> : <Icon size={12}/>}
        {label}
     </button>
  );

  const getScoreColor = (score: number) => {
     if (score >= 750) return 'text-emerald-500 border-emerald-500';
     if (score >= 650) return 'text-amber-500 border-amber-500';
     return 'text-rose-500 border-rose-500';
  };

  if (!library) return <div className="p-8 text-center text-slate-400">No Library Data Available</div>;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 shrink-0">
         <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 pl-2">Forensic Modules</h3>
         
         <button 
            onClick={() => setActiveSection('contacts')}
            className={`text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'contacts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
         >
            <Smartphone size={18}/>
            <div>
               <span className="block text-[10px] font-black uppercase tracking-widest">Mobile Intel</span>
               <span className="block text-xs font-medium opacity-80">Network & Identity</span>
            </div>
         </button>

         <button 
            onClick={() => setActiveSection('kyc')}
            className={`text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'kyc' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
         >
            <ScanFace size={18}/>
            <div>
               <span className="block text-[10px] font-black uppercase tracking-widest">Identity & KYC</span>
               <span className="block text-xs font-medium opacity-80">Aadhaar / PAN APIs</span>
            </div>
         </button>

         <button 
            onClick={() => setActiveSection('assets')}
            className={`text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'assets' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
         >
            <Landmark size={18}/>
            <div>
               <span className="block text-[10px] font-black uppercase tracking-widest">Assets & Emp</span>
               <span className="block text-xs font-medium opacity-80">Banking, RC, EPFO</span>
            </div>
         </button>

         <button 
            onClick={() => setActiveSection('loans')}
            className={`text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'loans' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
         >
            <TrendingUp size={18}/>
            <div>
               <span className="block text-[10px] font-black uppercase tracking-widest">Credit Bureau</span>
               <span className="block text-xs font-medium opacity-80">Equifax Report</span>
            </div>
         </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 bg-white overflow-y-auto custom-scrollbar">
         
         {/* --- MOBILE INTEL --- */}
         {activeSection === 'contacts' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               {/* Controls */}
               <div className="flex flex-wrap gap-3 pb-6 border-b border-slate-100">
                  <ActionButton label="Scan Network" icon={Wifi} loadingKey="network" onClick={handleScanNetwork} />
                  <ActionButton label="Trace Name" icon={User} loadingKey="name" onClick={handleTraceName} />
                  <ActionButton label="Trace PAN (Mobile)" icon={BadgeCheck} loadingKey="pan" onClick={handleTracePan} color="amber" />
               </div>

               <div className="flex justify-between items-end">
                  <div>
                     <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                        <Smartphone className="text-blue-600"/> Mobile Forensics
                     </h2>
                     <p className="text-slate-400 text-xs mt-2 font-medium max-w-lg">
                        Deep trace analysis on <strong>{customerPhone}</strong>.
                     </p>
                  </div>
               </div>

               {/* Discovered Name Card */}
               {library.mobileIdentityName && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4">
                     <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><User size={20}/></div>
                     <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Telco Registered Name</p>
                        <p className="text-sm font-black text-slate-800 uppercase">{library.mobileIdentityName}</p>
                     </div>
                     <span className="ml-auto px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">95% Match</span>
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {library.contacts.map((contact, idx) => (
                     <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group relative">
                        <div className="flex justify-between items-start mb-2">
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${contact.type === 'mobile' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {contact.type}
                           </span>
                           {contact.dndStatus !== undefined && (
                              <span className={`flex items-center gap-1 text-[9px] font-bold uppercase border px-2 py-0.5 rounded ${contact.dndStatus ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-emerald-600 border-emerald-200 bg-emerald-50'}`}>
                                 {contact.dndStatus ? 'DND Active' : 'DND Off'}
                              </span>
                           )}
                        </div>
                        <div className="flex items-center gap-3 my-2">
                           <p className="text-lg font-black text-slate-800 tracking-tight">{contact.value}</p>
                           <button onClick={() => copyToClipboard(contact.value)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                              <Copy size={14}/>
                           </button>
                        </div>
                        
                        {/* Carrier Info Bar */}
                        {contact.carrier && (
                           <div className="flex items-center gap-2 mb-3 bg-white border border-slate-100 p-2 rounded-lg">
                              <Wifi size={12} className="text-blue-400"/>
                              <span className="text-[10px] font-bold text-slate-600 uppercase">{contact.carrier} {contact.circle ? `(${contact.circle})` : ''}</span>
                              <span className={`ml-auto w-2 h-2 rounded-full ${contact.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                           </div>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                           <div className="flex items-center gap-2 text-slate-500">
                              <User size={12}/>
                              <span className="text-[10px] font-bold uppercase">{contact.ownerName}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-400">
                              <Search size={12}/>
                              <span className="text-[9px] font-mono uppercase">{contact.source}</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* --- KYC VERIFICATION (NEW) --- */}
         {activeSection === 'kyc' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                     <ShieldCheck className="text-indigo-600"/> Identity Verification
                  </h2>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Verify documents against Central Repositories (UIDAI/NSDL).</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhaar Input */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                     <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Aadhaar Number</label>
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           value={inputAadhaar} 
                           onChange={e => setInputAadhaar(e.target.value)} 
                           placeholder="12-digit UID"
                           className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                        />
                        <button 
                           onClick={handleVerifyAadhaar}
                           disabled={loadingMap['aadhaar_verify']}
                           className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50"
                        >
                           {loadingMap['aadhaar_verify'] ? <RefreshCw className="animate-spin" size={14}/> : 'Verify'}
                        </button>
                     </div>
                  </div>

                  {/* PAN Input */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                     <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">PAN Number</label>
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           value={inputPan} 
                           onChange={e => setInputPan(e.target.value)} 
                           placeholder="ABCDE1234F"
                           className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 uppercase"
                        />
                        <button 
                           onClick={handleVerifyPanBasic}
                           disabled={loadingMap['pan_basic']}
                           className="bg-white border border-slate-200 text-slate-600 px-3 rounded-xl font-bold text-[10px] uppercase hover:bg-slate-50"
                        >
                           Basic
                        </button>
                        <button 
                           onClick={handleVerifyPanPlus}
                           disabled={loadingMap['pan_plus']}
                           className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50"
                        >
                           {loadingMap['pan_plus'] ? <RefreshCw className="animate-spin" size={14}/> : 'Plus'}
                        </button>
                     </div>
                  </div>
               </div>

               {/* Results Log */}
               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification Log</h3>
                  {kycResults.length === 0 && <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-xl">No active verifications this session.</p>}
                  {kycResults.map((res, i) => (
                     <div key={i} className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center animate-in slide-in-from-top-1">
                        <div>
                           <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">{res.type} Verified</p>
                           <p className="font-mono text-sm font-bold text-slate-800">{res.id}</p>
                           {res.name && <p className="text-xs font-bold text-slate-600 mt-1">{res.name}</p>}
                        </div>
                        <Check size={20} className="text-emerald-500"/>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* --- ASSETS & EMPLOYMENT --- */}
         {activeSection === 'assets' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               {/* Controls */}
               <div className="flex flex-wrap gap-3 pb-6 border-b border-slate-100">
                  <ActionButton label="Scan UPI" icon={Zap} loadingKey="upi" onClick={handleScanUpi} />
                  <ActionButton label="Find Vehicles" icon={Car} loadingKey="rc" onClick={handleFindVehicles} color="amber"/>
                  <ActionButton label="Check EPFO" icon={Briefcase} loadingKey="uan" onClick={handleCheckEmployment} color="emerald"/>
               </div>

               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                     <Landmark className="text-emerald-600"/> Asset Registry
                  </h2>
               </div>

               {/* RC Details */}
               {library.rcDetails && library.rcDetails.length > 0 && (
                  <div className="space-y-3">
                     <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Car size={12}/> Registered Vehicles</h3>
                     {library.rcDetails.map((rc, i) => (
                        <div key={i} className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex justify-between items-center">
                           <div>
                              <p className="font-black text-sm text-slate-800">{rc.rcNumber}</p>
                              <p className="text-[10px] font-bold text-amber-600">{rc.model} • {rc.fuelType}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500">OWNER: {rc.ownerName}</p>
                              <p className="text-[9px] font-mono text-slate-400">REG: {rc.registrationDate}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {/* UAN Details */}
               {library.uanDetails && library.uanDetails.length > 0 && (
                  <div className="space-y-3">
                     <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Briefcase size={12}/> Employment History</h3>
                     {library.uanDetails.map((uan, i) => (
                        <div key={i} className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
                           <div>
                              <p className="font-black text-sm text-slate-800">{uan.employerName}</p>
                              <p className="text-[10px] font-bold text-emerald-600">UAN: {uan.uanNumber}</p>
                           </div>
                           <div className="text-right">
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">Active Member</span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               <div className="grid grid-cols-1 gap-4">
                  {library.bankAccounts.map((bank, idx) => (
                     <div key={idx} className="flex flex-col md:flex-row justify-between items-center p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden group">
                        <div className="flex items-center gap-5 z-10">
                           <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                              {bank.accountType === 'UPI_LINKED' ? <Zap size={24} className="text-yellow-400"/> : <Landmark size={24} className="text-emerald-400"/>}
                           </div>
                           <div>
                              <h4 className="font-black uppercase text-lg tracking-wider">{bank.bankName}</h4>
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{bank.accountType} ACCOUNT</p>
                           </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 z-10 mt-4 md:mt-0 w-full md:w-auto text-right">
                           <p className="font-mono text-xl font-bold tracking-widest">{bank.accountNumber}</p>
                           
                           {bank.upiId ? (
                              <p className="text-[10px] font-mono text-yellow-300 flex items-center gap-1">
                                 <Zap size={10}/> {bank.upiId}
                              </p>
                           ) : (
                              <p className="text-[10px] font-mono text-slate-400">IFSC: {bank.ifsc}</p>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* --- LOAN LIABILITY & EQUIFAX --- */}
         {activeSection === 'loans' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               {/* Controls */}
               <div className="flex flex-wrap gap-3 pb-6 border-b border-slate-100">
                  {/* If session not started, show Initiate */}
                  {!equifaxSession && (
                     <ActionButton 
                        label="Initiate Bureau Session" 
                        icon={TrendingUp} 
                        loadingKey="credit_init" 
                        onClick={handleInitiateEquifax} 
                        color="rose"
                     />
                  )}
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Score & Summary */}
                  <div>
                     <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3 mb-6">
                        <TrendingUp className="text-rose-600"/> Bureau Analysis
                     </h2>
                     
                     {equifaxSession ? (
                        /* Consent Required State */
                        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 animate-in slide-in-from-top-2">
                           <div className="flex items-center gap-3 mb-4">
                              <AlertCircle size={20} className="text-amber-600"/>
                              <h3 className="font-black text-amber-800 uppercase tracking-widest text-sm">Customer Consent Required</h3>
                           </div>
                           
                           <div className="flex flex-col md:flex-row gap-6">
                              {/* QR Code */}
                              <div className="flex-1 bg-white p-4 rounded-2xl border border-amber-100 flex flex-col items-center text-center">
                                 <div className="w-32 h-32 bg-slate-900 rounded-xl flex items-center justify-center mb-3">
                                    <img 
                                       src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(equifaxSession.url)}`} 
                                       alt="Scan for Consent" 
                                       className="w-28 h-28 rounded-lg"
                                    />
                                 </div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scan to Authorize</p>
                              </div>

                              <div className="flex-1 flex flex-col justify-between">
                                 <p className="text-xs text-amber-700 mb-4 leading-relaxed font-bold">
                                    Share this link with <strong>{customerName}</strong>. Once they authorize via OTP, click download.
                                 </p>
                                 <div className="space-y-2">
                                    <div className="flex gap-2">
                                       <div className="flex-1 bg-white border border-amber-200 rounded-xl p-3 font-mono text-[10px] text-slate-600 truncate">
                                          {equifaxSession.url}
                                       </div>
                                       <button 
                                          onClick={handleCopyLink}
                                          className="p-3 bg-white border border-amber-200 rounded-xl hover:bg-amber-100 text-amber-700 transition-colors"
                                       >
                                          {linkCopied ? <Check size={14}/> : <Copy size={14}/>}
                                       </button>
                                       <button 
                                          onClick={() => window.open(equifaxSession.url, '_blank')}
                                          className="p-3 bg-white border border-amber-200 rounded-xl hover:bg-amber-100 text-amber-700 transition-colors"
                                       >
                                          <ExternalLink size={14}/>
                                       </button>
                                    </div>

                                    <button 
                                       onClick={handleDownloadReport}
                                       disabled={loadingMap['credit_fetch']}
                                       className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
                                    >
                                       {loadingMap['credit_fetch'] ? <RefreshCw size={14} className="animate-spin"/> : <Download size={14}/>}
                                       Check Status / Download
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        /* Standard Score Display */
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-6">
                           <div className="flex items-center gap-6">
                              <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center bg-white shadow-sm ${insight.creditScore ? getScoreColor(insight.creditScore) : 'border-slate-200 text-slate-300'}`}>
                                 {insight.creditScore ? (
                                    <div className="text-center">
                                       <span className="block text-2xl font-black leading-none">{insight.creditScore}</span>
                                       <span className="block text-[8px] font-bold uppercase mt-1">CIBIL</span>
                                    </div>
                                 ) : (
                                    <span className="text-xs font-bold uppercase">N/A</span>
                                 )}
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Financial Health</p>
                                 <p className="text-sm font-bold text-slate-700 leading-relaxed mt-1">
                                    {insight.creditScore ? (
                                       insight.creditScore > 750 ? "Excellent standing. Low probability of default." : 
                                       insight.creditScore > 650 ? "Moderate risk. Monitor payment behavior." : 
                                       "High Risk. Critical delinquency markers found."
                                    ) : "No report generated. Initiate session to assess risk."}
                                 </p>
                              </div>
                           </div>
                           
                           {pdfReportUrl && (
                              <a 
                                 href={pdfReportUrl} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="w-full py-3 bg-white border-2 border-slate-200 hover:border-rose-500 hover:text-rose-600 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                              >
                                 <FileText size={14}/> Download Official PDF
                              </a>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Recent Enquiries (Risk Indicator) */}
                  <div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Search size={14}/> Recent Enquiries (Hard Pulls)
                     </h3>
                     <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                        {(library.creditEnquiries || []).length === 0 ? (
                           <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-bold uppercase">
                              No recent enquiries found
                           </div>
                        ) : (
                           (library.creditEnquiries || []).map((enq, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                                 <div>
                                    <p className="text-[10px] font-black uppercase text-slate-700">{enq.institution}</p>
                                    <p className="text-[9px] font-bold text-slate-400">{enq.purpose}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-mono font-bold text-slate-600">{enq.enquiryDate}</p>
                                    <p className="text-[9px] font-black text-rose-500">{formatCurrency(enq.amount)}</p>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>

               {/* Tradelines Table */}
               <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                     <History size={14}/> Active Tradelines
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                           <tr>
                              <th className="p-4">Lender / Type</th>
                              <th className="p-4">Disbursed</th>
                              <th className="p-4 text-right">Sanctioned</th>
                              <th className="p-4 text-right">Outstanding</th>
                              <th className="p-4 text-center">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                           {library.loans.map((loan, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-4">
                                    <div className="font-black text-slate-900 uppercase">{loan.lender}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">{loan.type} LOAN</div>
                                 </td>
                                 <td className="p-4 font-mono text-slate-500">
                                    {loan.disbursalDate}
                                 </td>
                                 <td className="p-4 text-right">
                                    {formatCurrency(loan.amount)}
                                 </td>
                                 <td className="p-4 text-right text-rose-600 font-black">
                                    {loan.status === 'CLOSED' ? '-' : formatCurrency(loan.outstanding)}
                                 </td>
                                 <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                                       loan.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                       loan.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                       'bg-rose-50 text-rose-600 border border-rose-100'
                                    }`}>
                                       {loan.status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

      </div>
    </div>
  );
};
