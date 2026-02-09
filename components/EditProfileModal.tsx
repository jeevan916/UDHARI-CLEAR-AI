
import React, { useState, useEffect } from 'react';
import { XCircle, Globe, CreditCard, ShieldCheck, User, Phone, MapPin, Plus, Trash2, CheckCircle2, ScanFace, ArrowDown } from 'lucide-react';
import { Customer, ProfileContact, ProfileAddress } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSave: (updates: Partial<Customer>) => void;
}

export const EditProfileModal: React.FC<Props> = ({ isOpen, onClose, customer, onSave }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'addresses' | 'gateways'>('info');
  const [formData, setFormData] = useState<Partial<Customer>>({});
  
  // Local state for list management (synced with formData on save)
  const [contacts, setContacts] = useState<ProfileContact[]>([]);
  const [addresses, setAddresses] = useState<ProfileAddress[]>([]);

  useEffect(() => {
    if (isOpen) {
       setFormData(customer);
       setContacts(customer.contactList || [{ id: 'init', type: 'mobile', value: customer.phone, isPrimary: true, source: 'MANUAL' }]);
       setAddresses(customer.addressList || (customer.address ? [{ id: 'init', type: 'registered', value: customer.address, isPrimary: true, source: 'MANUAL' }] : []));
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleSave = () => {
     onSave({
        ...formData,
        contactList: contacts,
        addressList: addresses
     });
  };

  const toggleGateway = (key: 'razorpay' | 'setu') => {
     setFormData(prev => ({
        ...prev,
        enabledGateways: {
           ...prev.enabledGateways!,
           [key]: !prev.enabledGateways![key]
        }
     }));
  };

  // Contacts Logic
  const addContact = () => {
     setContacts([...contacts, { id: `cnt_${Date.now()}`, type: 'mobile', value: '', isPrimary: false, source: 'MANUAL' }]);
  };
  const updateContact = (id: string, field: keyof ProfileContact, val: any) => {
     setContacts(contacts.map(c => c.id === id ? { ...c, [field]: val } : c));
  };
  const setPrimaryContact = (id: string) => {
     setContacts(contacts.map(c => ({ ...c, isPrimary: c.id === id })));
  };
  const removeContact = (id: string) => {
     setContacts(contacts.filter(c => c.id !== id));
  };
  const linkDeepvueContact = (contact: any) => {
     // Prevent duplicates
     if (contacts.some(c => c.value === contact.value)) return;
     setContacts([...contacts, {
        id: `dv_${Date.now()}`,
        type: contact.type,
        value: contact.value,
        isPrimary: false,
        source: 'DEEPVUE_IMPORT',
        label: contact.ownerName
     }]);
  };

  // Addresses Logic
  const addAddress = () => {
     setAddresses([...addresses, { id: `adr_${Date.now()}`, type: 'registered', value: '', isPrimary: false, source: 'MANUAL' }]);
  };
  const updateAddress = (id: string, field: keyof ProfileAddress, val: any) => {
     setAddresses(addresses.map(a => a.id === id ? { ...a, [field]: val } : a));
  };
  const setPrimaryAddress = (id: string) => {
     setAddresses(addresses.map(a => ({ ...a, isPrimary: a.id === id })));
  };
  const removeAddress = (id: string) => {
     setAddresses(addresses.filter(a => a.id !== id));
  };
  const linkDeepvueAddress = (addr: any) => {
     if (addresses.some(a => a.value === addr.fullAddress)) return;
     setAddresses([...addresses, {
        id: `dv_adr_${Date.now()}`,
        type: addr.type || 'registered',
        value: addr.fullAddress,
        isPrimary: false,
        source: 'DEEPVUE_IMPORT'
     }]);
  };

  // Deepvue Data
  const dvContacts = customer.deepvueInsights?.library?.contacts || [];
  const dvAddresses = customer.deepvueInsights?.library?.addresses || [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
          <div>
             <h3 className="font-black uppercase tracking-tighter text-lg md:text-xl text-slate-800">Edit Entity Profile</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Node ID: {customer.uniquePaymentCode}
             </p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><XCircle size={24}/></button>
        </div>

        {/* Tab Nav */}
        <div className="flex bg-white border-b px-6 py-2 overflow-x-auto no-scrollbar gap-2 shrink-0">
           {['info', 'contacts', 'addresses', 'gateways'].map((tab: any) => (
              <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                 {tab === 'info' ? 'Basic Info' : tab}
              </button>
           ))}
        </div>

        <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          
          {/* INFO TAB */}
          {activeTab === 'info' && (
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Entity Name</label>
                   <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                      <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Group ID</label>
                      <input 
                        type="text" 
                        value={formData.groupId || ''} 
                        onChange={e => setFormData({...formData, groupId: e.target.value})} 
                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 text-xs"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Tax / GST</label>
                      <input 
                        type="text" 
                        value={formData.taxNumber || ''} 
                        onChange={e => setFormData({...formData, taxNumber: e.target.value})} 
                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 text-xs"
                      />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Credit Limit</label>
                   <input 
                     type="number" 
                     value={formData.creditLimit || ''} 
                     onChange={e => setFormData({...formData, creditLimit: parseInt(e.target.value)})} 
                     className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 text-xs"
                   />
                </div>
             </div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'contacts' && (
             <div className="space-y-8">
                <div className="space-y-3">
                   {contacts.map((c, i) => (
                      <div key={c.id} className={`flex items-center gap-2 p-2 rounded-2xl border ${c.isPrimary ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-100 border-transparent'}`}>
                         <button 
                           onClick={() => setPrimaryContact(c.id)}
                           className={`p-3 rounded-xl transition-all ${c.isPrimary ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-blue-400'}`}
                           title="Set Primary"
                         >
                            <CheckCircle2 size={16}/>
                         </button>
                         <div className="flex-1 grid grid-cols-[80px_1fr] gap-2">
                            <select 
                              value={c.type}
                              onChange={e => updateContact(c.id, 'type', e.target.value)}
                              className="bg-transparent text-[10px] font-bold uppercase outline-none"
                            >
                               <option value="mobile">Mobile</option>
                               <option value="email">Email</option>
                               <option value="work">Work</option>
                               <option value="home">Home</option>
                            </select>
                            <input 
                              type="text" 
                              value={c.value}
                              onChange={e => updateContact(c.id, 'value', e.target.value)}
                              className="bg-transparent font-mono text-xs font-bold text-slate-700 outline-none w-full"
                              placeholder="Value..."
                            />
                         </div>
                         {c.source === 'DEEPVUE_IMPORT' && (
                            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold" title="Verified Source"><ScanFace size={14}/></span>
                         )}
                         <button onClick={() => removeContact(c.id)} className="p-2 text-rose-300 hover:text-rose-500"><Trash2 size={16}/></button>
                      </div>
                   ))}
                   <button onClick={addContact} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-colors">
                      <Plus size={16}/> Add Contact
                   </button>
                </div>

                {/* Discovery Section */}
                {dvContacts.length > 0 && (
                   <div className="pt-6 border-t border-slate-200">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                         <ScanFace size={12} className="text-emerald-500"/> Discovered Intelligence
                      </h4>
                      <div className="space-y-2">
                         {dvContacts.filter(dc => !contacts.some(c => c.value === dc.value)).map((dc, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                               <div>
                                  <p className="text-xs font-bold text-emerald-900">{dc.value}</p>
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase">{dc.type} • {dc.ownerName}</p>
                               </div>
                               <button onClick={() => linkDeepvueContact(dc)} className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-100 transition-colors"><ArrowDown size={14}/></button>
                            </div>
                         ))}
                         {dvContacts.every(dc => contacts.some(c => c.value === dc.value)) && (
                            <p className="text-[10px] text-slate-400 italic">All discovered contacts linked.</p>
                         )}
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
             <div className="space-y-8">
                <div className="space-y-3">
                   {addresses.map((a, i) => (
                      <div key={a.id} className={`flex items-start gap-2 p-2 rounded-2xl border ${a.isPrimary ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-100 border-transparent'}`}>
                         <button 
                           onClick={() => setPrimaryAddress(a.id)}
                           className={`p-3 rounded-xl transition-all mt-1 ${a.isPrimary ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-blue-400'}`}
                           title="Set Primary"
                         >
                            <MapPin size={16}/>
                         </button>
                         <div className="flex-1 flex flex-col gap-2 p-1">
                            <select 
                              value={a.type}
                              onChange={e => updateAddress(a.id, 'type', e.target.value)}
                              className="bg-transparent text-[10px] font-bold uppercase outline-none w-full"
                            >
                               <option value="registered">Registered</option>
                               <option value="office">Office</option>
                               <option value="residential">Residential</option>
                               <option value="warehouse">Warehouse</option>
                            </select>
                            <textarea 
                              value={a.value}
                              onChange={e => updateAddress(a.id, 'value', e.target.value)}
                              className="bg-transparent font-medium text-xs text-slate-700 outline-none w-full resize-none h-16"
                              placeholder="Full Address..."
                            />
                         </div>
                         <button onClick={() => removeAddress(a.id)} className="p-2 text-rose-300 hover:text-rose-500 mt-1"><Trash2 size={16}/></button>
                      </div>
                   ))}
                   <button onClick={addAddress} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-colors">
                      <Plus size={16}/> Add Address
                   </button>
                </div>

                {/* Discovery Section */}
                {dvAddresses.length > 0 && (
                   <div className="pt-6 border-t border-slate-200">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                         <ScanFace size={12} className="text-emerald-500"/> Discovered Locations
                      </h4>
                      <div className="space-y-2">
                         {dvAddresses.filter(da => !addresses.some(a => a.value === da.fullAddress)).map((da, idx) => (
                            <div key={idx} className="flex justify-between items-start p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                               <div className="flex-1 mr-4">
                                  <p className="text-xs font-bold text-emerald-900 leading-tight">{da.fullAddress}</p>
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">{da.type} • Verified {da.lastVerified}</p>
                               </div>
                               <button onClick={() => linkDeepvueAddress(da)} className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-100 transition-colors shrink-0"><ArrowDown size={14}/></button>
                            </div>
                         ))}
                         {dvAddresses.every(da => addresses.some(a => a.value === da.fullAddress)) && (
                            <p className="text-[10px] text-slate-400 italic">All discovered addresses linked.</p>
                         )}
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* GATEWAYS TAB */}
          {activeTab === 'gateways' && (
             <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${formData.enabledGateways?.razorpay ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                         <CreditCard size={18}/>
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase text-slate-800">Razorpay</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">Card / Netbanking</p>
                      </div>
                   </div>
                   <button onClick={() => toggleGateway('razorpay')} className={`w-12 h-6 rounded-full relative transition-colors ${formData.enabledGateways?.razorpay ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.enabledGateways?.razorpay ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${formData.enabledGateways?.setu ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                         <Globe size={18}/>
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase text-slate-800">Setu UPI</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">DeepLink Intent</p>
                      </div>
                   </div>
                   <button onClick={() => toggleGateway('setu')} className={`w-12 h-6 rounded-full relative transition-colors ${formData.enabledGateways?.setu ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.enabledGateways?.setu ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>
          )}

        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end shrink-0">
           <button 
             onClick={handleSave}
             className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all"
           >
              Update Profile Node
           </button>
        </div>
      </div>
    </div>
  );
};
