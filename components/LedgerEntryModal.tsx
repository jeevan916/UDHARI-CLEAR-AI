
import React, { useState, useEffect } from 'react';
import { XCircle, IndianRupee, Scale, Calendar, AlertCircle, ChevronDown } from 'lucide-react';
import { TransactionType, PaymentMethod, Transaction, TransactionUnit } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (data: any) => void;
  initialData?: Transaction | null;
  defaults?: { type?: TransactionType, unit?: TransactionUnit } | null;
}

export const LedgerEntryModal: React.FC<Props> = ({ isOpen, onClose, onCommit, initialData, defaults }) => {
  const [entry, setEntry] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], // Default to today
    type: 'credit' as TransactionType, 
    unit: 'money' as TransactionUnit, 
    method: 'cash' as PaymentMethod, 
    description: '' 
  });

  useEffect(() => {
    if (initialData) {
      setEntry({
        amount: initialData.amount.toString(),
        date: initialData.date,
        type: initialData.type,
        unit: initialData.unit || 'money',
        method: initialData.method,
        description: initialData.description
      });
    } else {
      const defType = defaults?.type || 'credit';
      const defUnit = defaults?.unit || 'money';
      
      // Determine logical default method based on type/unit
      let defMethod: PaymentMethod = 'cash';
      if (defUnit === 'gold') {
         defMethod = defType === 'debit' ? 'gold_bar' : 'ornament';
      } else {
         defMethod = defType === 'debit' ? 'bill' : 'cash';
      }

      setEntry({ 
        amount: '', 
        date: new Date().toISOString().split('T')[0],
        type: defType, 
        unit: defUnit, 
        method: defMethod, 
        description: '' 
      });
    }
  }, [initialData, isOpen, defaults]);

  const isGold = entry.unit === 'gold';
  const isDebit = entry.type === 'debit';
  
  // Logic to warn if date is in the future
  const isFutureDate = new Date(entry.date) > new Date();

  const handleTypeChange = (newType: TransactionType) => {
     let defaultMethod: PaymentMethod = 'cash';
     if (entry.unit === 'gold') {
        defaultMethod = newType === 'debit' ? 'gold_bar' : 'ornament';
     } else {
        // For Money Ledger: Debit = Bill/Purchase, Credit = Cash/Payment
        defaultMethod = newType === 'debit' ? 'bill' : 'cash';
     }
     setEntry(p => ({...p, type: newType, method: defaultMethod}));
  };

  const handleUnitChange = (newUnit: TransactionUnit) => {
     const newMethod = newUnit === 'gold' 
        ? (entry.type === 'debit' ? 'gold_bar' : 'ornament')
        : (entry.type === 'debit' ? 'bill' : 'cash');
     
     setEntry(p => ({...p, unit: newUnit, method: newMethod}));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Click outside to dismiss */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className={`bg-white w-full sm:max-w-lg rounded-t-[2.5rem] rounded-b-none sm:rounded-[3rem] shadow-2xl overflow-hidden border-t-0 sm:border-4 flex flex-col max-h-[90vh] transition-colors relative z-10 animate-in slide-in-from-bottom-10 duration-300 ${isGold ? 'border-amber-400' : 'border-slate-100'}`}>
        
        {/* Mobile Handle */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
           <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className={`p-6 md:p-8 border-b flex justify-between items-center shrink-0 ${isGold ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
          <div>
            <h3 className={`font-black uppercase tracking-tighter text-lg md:text-xl ${isGold ? 'text-amber-900' : 'text-slate-800'}`}>{initialData ? 'Edit Transaction' : 'New Ledger Entry'}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Book Entry</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors"><XCircle size={28}/></button>
        </div>
        
        <div className="p-6 md:p-10 space-y-5 md:space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Unit Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-2">
             <button 
                onClick={() => handleUnitChange('money')}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${!isGold ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}
             >
                <IndianRupee size={16}/> Rupee Book
             </button>
             <button 
                onClick={() => handleUnitChange('gold')}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isGold ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}
             >
                <Scale size={16}/> Gold Book
             </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
            <button onClick={() => handleTypeChange('credit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entry.type === 'credit' ? (isGold ? 'bg-amber-500 text-white shadow-lg' : 'bg-emerald-500 text-white shadow-lg') : 'text-slate-400'}`}>Credit (Incoming)</button>
            <button onClick={() => handleTypeChange('debit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entry.type === 'debit' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>Debit (Outgoing/Bill)</button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             {/* Date Input */}
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Record Date</label>
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input 
                     type="date" 
                     value={entry.date}
                     onChange={e => setEntry(p => ({...p, date: e.target.value}))}
                     className="w-full pl-12 pr-4 py-4 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-600 transition-all text-sm uppercase tracking-wider"
                   />
                </div>
             </div>

             {/* Amount Input */}
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">{isGold ? 'Weight (Grams)' : (isDebit ? 'Bill Amount (INR)' : 'Amount Received (INR)')}</label>
                <div className="relative">
                  {isGold ? (
                     <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18}/>
                  ) : (
                     <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  )}
                  <input 
                    type="number" 
                    value={entry.amount} 
                    onChange={e => setEntry(p => ({...p, amount: e.target.value}))} 
                    className={`w-full pl-12 pr-6 py-4 md:py-5 border-2 rounded-2xl text-lg md:text-xl font-black outline-none transition-all ${isGold ? 'bg-amber-50 border-amber-100 focus:border-amber-500 text-amber-900' : 'bg-slate-50 border-slate-100 focus:border-blue-600 text-slate-900'}`} 
                    placeholder="0.00" 
                  />
                </div>
             </div>
          </div>
          
          {isFutureDate && (
             <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-bold uppercase">
                <AlertCircle size={14}/> Warning: Future Date Selected
             </div>
          )}
          
          <div>
             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Transaction Mode</label>
             <div className="relative">
                <select value={entry.method} onChange={e => setEntry(p => ({...p, method: e.target.value as PaymentMethod}))} className="w-full p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs tracking-widest outline-none focus:border-blue-600 appearance-none">
                  {isGold ? (
                      <>
                        <option value="gold_bar">Fine Gold Bar (999)</option>
                        <option value="ornament">Ornaments / Jewellery</option>
                        <option value="adjustment">Internal Adjustment</option>
                      </>
                  ) : (
                      isDebit ? (
                        <>
                            <option value="bill">Jewellery Purchase (Udhaar)</option>
                            <option value="cash">Cash Given (Lending)</option>
                            <option value="adjustment">Misc Charge / Adjustment</option>
                        </>
                      ) : (
                        <>
                            <option value="cash">Cash Received</option>
                            <option value="upi">Online / UPI</option>
                            <option value="rtgs">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="adjustment">Discount / Waiver</option>
                        </>
                      )
                  )}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
             </div>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Item Details / Notes</label>
             <textarea 
                value={entry.description} 
                onChange={e => setEntry(p => ({...p, description: e.target.value}))} 
                className="w-full p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-blue-600 h-24 resize-none" 
                placeholder={isDebit && !isGold ? "E.g. Gold Chain 22k (12.5g), Ring, Making Charges..." : "Description / Reference..."} 
             />
          </div>
          
          <button 
            onClick={() => onCommit(entry)} 
            className={`w-full py-5 md:py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl transition-all shrink-0 hover:scale-105 active:scale-95 text-white mb-6 sm:mb-0 ${isGold ? 'bg-amber-600 shadow-amber-600/30' : (isDebit ? 'bg-slate-900 shadow-slate-900/30' : 'bg-emerald-600 shadow-emerald-600/30')}`}
          >
             {initialData ? 'Update Transaction' : `Commit ${isDebit ? 'Debit' : 'Credit'} to ${isGold ? 'Gold' : 'Financial'} Ledger`}
          </button>
        </div>
      </div>
    </div>
  );
};
