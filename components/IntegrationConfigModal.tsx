
import React, { useState, useEffect } from 'react';
import { XCircle, Save, Shield, Key } from 'lucide-react';
import { IntegrationNode, IntegrationField } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  node: IntegrationNode | null;
  onSave: (nodeId: string, fields: IntegrationField[]) => void;
}

export const IntegrationConfigModal: React.FC<Props> = ({ isOpen, onClose, node, onSave }) => {
  const [formFields, setFormFields] = useState<IntegrationField[]>([]);

  useEffect(() => {
    if (node) {
      setFormFields(JSON.parse(JSON.stringify(node.fields))); // Deep copy
    }
  }, [node, isOpen]);

  if (!isOpen || !node) return null;

  const handleChange = (key: string, value: string) => {
    setFormFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  };

  const handleSave = () => {
    onSave(node.id, formFields);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center shrink-0">
          <div>
             <h3 className="font-black uppercase tracking-tighter text-lg md:text-xl text-slate-800 flex items-center gap-2">
                <Key size={20} className="text-blue-600"/> {node.name} Configuration
             </h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Infrastructure Handshake Protocol
             </p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><XCircle size={24}/></button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
             <Shield className="text-blue-600 shrink-0" size={16}/>
             <p className="text-[10px] font-bold text-blue-800 uppercase leading-relaxed">
                Credentials entered here are encrypted using AES-256 before being stored in the secure vault. They are only decrypted during active API calls.
             </p>
          </div>

          <div className="space-y-5">
             {formFields.map(field => (
                <div key={field.key}>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 block">{field.label}</label>
                   <input 
                     type={field.type} 
                     value={field.value}
                     onChange={(e) => handleChange(field.key, e.target.value)}
                     placeholder={field.placeholder}
                     className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                   />
                </div>
             ))}
          </div>

          <button 
             onClick={handleSave}
             className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
             <Save size={16}/> Encrypt & Commit
          </button>
        </div>
      </div>
    </div>
  );
};
