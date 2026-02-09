
import React, { useState } from 'react';
import { XCircle, User, Phone, Briefcase, Hash, IndianRupee, ChevronDown } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    groupId: 'Retail Client',
    taxNumber: '',
    openingBalance: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
       <div className="absolute inset-0" onClick={onClose}></div>
       
       <div className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] rounded-b-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative z-10 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh]">
          
          {/* Mobile Handle */}
          <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
             <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
          </div>

          <div className="p-8 bg-slate-50 border-b flex justify-between items-center shrink-0">
             <h3 className="font-black uppercase tracking-tighter text-lg text-slate-800">Onboard New Entity</h3>
             <button onClick={onClose} className="text-slate-300 hover:text-slate-900"><XCircle size={28}/></button>
          </div>
          
          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
             {/* Fields */}
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Entity Name</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                   <input 
                     type="text" 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})} 
                     className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                     placeholder="e.g. Acme Corp"
                   />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Phone</label>
                   <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                      <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                        placeholder="98..."
                      />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Group ID</label>
                   <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                      <select 
                        value={formData.groupId} 
                        onChange={e => setFormData({...formData, groupId: e.target.value})} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                      >
                         <option>Retail Client</option>
                         <option>Wholesale Group</option>
                         <option>Corporate</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14}/>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">GST / Tax ID</label>
                    <div className="relative">
                       <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                       <input 
                         type="text" 
                         value={formData.taxNumber} 
                         onChange={e => setFormData({...formData, taxNumber: e.target.value})} 
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                         placeholder="Optional"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">Opening Balance</label>
                    <div className="relative">
                       <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                       <input 
                         type="number" 
                         value={formData.openingBalance} 
                         onChange={e => setFormData({...formData, openingBalance: e.target.value})} 
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                         placeholder="0.00"
                       />
                    </div>
                 </div>
             </div>

             <button 
                onClick={() => onAdd(formData)}
                disabled={!formData.name || !formData.phone}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6 sm:mb-0"
             >
                Create Entity Node
             </button>
          </div>
       </div>
    </div>
  );
};
