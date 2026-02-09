
import React, { useState } from 'react';
import { XCircle, Link, Copy, CheckCircle2, IndianRupee, Scale, Calculator, ArrowRight } from 'lucide-react';
import { Customer } from '../types';
import { formatCurrency, formatGold } from '../utils/debtUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

export const SharePaymentLinkModal: React.FC<Props> = ({ isOpen, onClose, customer }) => {
  const [amountType, setAmountType] = useState<'financial' | 'gold'>('financial');
  const [goldRate, setGoldRate] = useState(7250); // Default daily rate mock
  const [customAmount, setCustomAmount] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate equivalent Rs for Gold Balance
  const goldEquivalent = Math.round(customer.currentGoldBalance * goldRate);
  
  // Determine final link value
  const finalLinkAmount = amountType === 'financial' 
     ? (customAmount || customer.currentBalance)
     : (customAmount || goldEquivalent);

  const paymentLink = `https://pay.arrearsflow.com/${customer.uniquePaymentCode}?amt=${finalLinkAmount}&type=${amountType}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-black uppercase tracking-tighter text-lg text-slate-800 flex items-center gap-2">
             <Link size={20} className="text-blue-600"/> Generate Private Link
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><XCircle size={24}/></button>
        </div>

        <div className="p-8 space-y-6">
           {/* Ledger Selector */}
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                 onClick={() => { setAmountType('financial'); setCustomAmount(''); }}
                 className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${amountType === 'financial' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <IndianRupee size={14}/> Financial
              </button>
              <button 
                 onClick={() => { setAmountType('gold'); setCustomAmount(''); }}
                 className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${amountType === 'gold' ? 'bg-white text-amber-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <Scale size={14}/> Gold Settlement
              </button>
           </div>

           {/* Dynamic Content based on Type */}
           {amountType === 'financial' ? (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                 <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Current Ledger Balance</p>
                 <p className="text-3xl font-black text-slate-900">{formatCurrency(customer.currentBalance)}</p>
              </div>
           ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
                 <div className="flex justify-between items-center">
                    <div>
                       <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Gold Liability</p>
                       <p className="text-2xl font-black text-slate-900">{formatGold(customer.currentGoldBalance)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Today's Rate</p>
                       <div className="flex items-center gap-2">
                          <input 
                             type="number" 
                             value={goldRate}
                             onChange={e => setGoldRate(parseInt(e.target.value))}
                             className="w-20 bg-white border border-amber-200 rounded-lg px-2 py-1 text-sm font-bold text-right outline-none focus:border-amber-500"
                          />
                          <span className="text-xs font-bold text-amber-700">/g</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="h-px bg-amber-200/50"></div>
                 
                 <div className="flex items-center gap-3 text-amber-800">
                    <Calculator size={16}/>
                    <span className="text-xs font-bold">Equivalent Value:</span>
                    <span className="text-xl font-black">{formatCurrency(goldEquivalent)}</span>
                 </div>
              </div>
           )}

           {/* Custom Amount Override */}
           <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Link Payment Amount (INR)</label>
              <input 
                 type="number"
                 value={customAmount}
                 onChange={e => setCustomAmount(e.target.value)}
                 placeholder={amountType === 'financial' ? customer.currentBalance.toString() : goldEquivalent.toString()}
                 className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
              />
           </div>

           {/* Generated Link Display */}
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block">Private Portal Link</label>
              <div className="flex gap-2">
                 <div className="flex-1 bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-xs truncate border border-slate-700">
                    {paymentLink}
                 </div>
                 <button 
                    onClick={handleCopy}
                    className={`px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                 >
                    {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                    {copied ? 'Copied' : 'Copy'}
                 </button>
              </div>
              <p className="text-[9px] text-slate-400 font-medium ml-2">
                 * This link enables {amountType === 'gold' ? 'gold settlement via equivalent cash' : 'direct ledger payment'} via Razorpay/Setu.
              </p>
           </div>

        </div>
      </div>
    </div>
  );
};
