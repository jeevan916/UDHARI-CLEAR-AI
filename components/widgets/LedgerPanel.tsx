
import React, { useState, useMemo } from 'react';
import { Columns, List, Plus, ArrowRight, ArrowUpRight, ArrowDownLeft, Edit, Trash2, IndianRupee, Scale, Book, Wallet } from 'lucide-react';
import { Customer, Transaction, TransactionUnit } from '../../types';
import { formatCurrency, formatGold } from '../../utils/debtUtils';

interface LedgerPanelProps {
  customer: Customer;
  onAddEntry: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  embedded?: boolean; // New Prop for Tab View
}

export const LedgerPanel: React.FC<LedgerPanelProps> = ({ customer, onAddEntry, onEditTransaction, onDeleteTransaction, embedded = false }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [ledgerMode, setLedgerMode] = useState<'t-format' | 'list'>('t-format');
  const [ledgerUnit, setLedgerUnit] = useState<TransactionUnit>('money');

  const isGold = ledgerUnit === 'gold';
  
  const filteredTransactions = useMemo(() => {
    let txs = [...customer.transactions];
    txs = txs.filter(t => (t.unit || 'money') === ledgerUnit);
    if (dateRange.start) txs = txs.filter(t => t.date >= dateRange.start);
    if (dateRange.end) txs = txs.filter(t => t.date <= dateRange.end);
    return txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customer.transactions, dateRange, ledgerUnit]);

  const debits = filteredTransactions.filter(t => t.type === 'debit');
  const credits = filteredTransactions.filter(t => t.type === 'credit');
  const totalDebit = debits.reduce((s, t) => s + t.amount, 0);
  const totalCredit = credits.reduce((s, t) => s + t.amount, 0);
  const closingBalance = totalDebit - totalCredit;

  const formatVal = (val: number) => isGold ? formatGold(val) : formatCurrency(val);

  return (
    <div className={`transition-colors duration-500 overflow-hidden relative ${embedded ? 'bg-transparent' : `bg-white rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-10 shadow-2xl border ${isGold ? 'border-amber-100' : 'border-slate-100'}`}`}>
         
         {/* Ledger Switcher Header */}
         <div className="flex flex-col gap-3 mb-4">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-black uppercase text-slate-900 tracking-tighter flex items-center gap-2">
                 <Book size={16} className={isGold ? "text-amber-500" : "text-blue-500"}/>
                 {isGold ? 'Gold Book' : 'Rupee Ledger'}
               </h3>
               
               {/* Mode Toggles */}
               <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                  <button onClick={() => setLedgerUnit('money')} className={`p-1.5 rounded-md transition-all ${!isGold ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                     <IndianRupee size={14}/>
                  </button>
                  <button onClick={() => setLedgerUnit('gold')} className={`p-1.5 rounded-md transition-all ${isGold ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}>
                     <Scale size={14}/>
                  </button>
               </div>
            </div>
            
            <div className="flex gap-2 w-full overflow-x-auto pb-1">
               <button onClick={() => setLedgerMode('t-format')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex-1 justify-center whitespace-nowrap ${ledgerMode === 't-format' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Columns size={12}/> T-Format
               </button>
               <button onClick={() => setLedgerMode('list')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex-1 justify-center whitespace-nowrap ${ledgerMode === 'list' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <List size={12}/> List
               </button>
            </div>
         </div>

         {/* Conditional Ledger View */}
         <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${isGold ? 'border-amber-100' : 'border-slate-200'}`}>
         {ledgerMode === 't-format' ? (
            <div className="grid grid-cols-2 gap-0 min-h-[300px]">
                {/* Left: DEBITS (Dr) */}
                <div className={`border-r bg-slate-50/30 ${isGold ? 'border-amber-100' : 'border-slate-200'}`}>
                   <div className="p-2 bg-rose-50 border-b border-rose-100 text-rose-700 font-black uppercase text-[9px] tracking-widest flex justify-between">
                      <span>Dr. (Liability)</span>
                      <ArrowRight size={10}/>
                   </div>
                   <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                      {debits.length === 0 && <div className="p-6 text-center text-slate-300 text-[9px] font-bold uppercase">No Debits</div>}
                      {debits.map(t => (
                        <div key={t.id} className="p-3 hover:bg-white transition-all group relative">
                           <div className="flex flex-col">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.date}</p>
                              <p className="font-bold text-slate-800 text-[10px] leading-tight mb-1">{t.description}</p>
                              <p className="font-black text-rose-600 text-xs tabular-nums">{formatVal(t.amount)}</p>
                           </div>
                           <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                              <button onClick={() => onEditTransaction(t)} className="text-blue-400 p-1"><Edit size={10}/></button>
                              <button onClick={() => onDeleteTransaction(t.id)} className="text-rose-400 p-1"><Trash2 size={10}/></button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Right: CREDITS (Cr) */}
                <div className="bg-slate-50/30">
                   <div className={`p-2 border-b font-black uppercase text-[9px] tracking-widest flex justify-between ${isGold ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                      <span>Cr. (Recovery)</span>
                      <ArrowRight size={10} className="rotate-180"/>
                   </div>
                   <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                      {credits.length === 0 && <div className="p-6 text-center text-slate-300 text-[9px] font-bold uppercase">No Credits</div>}
                      {credits.map(t => (
                        <div key={t.id} className="p-3 hover:bg-white transition-all group relative">
                           <div className="flex flex-col">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.date}</p>
                              <p className="font-bold text-slate-800 text-[10px] leading-tight mb-1">{t.description}</p>
                              <p className={`font-black text-xs tabular-nums ${isGold ? 'text-amber-600' : 'text-emerald-600'}`}>{formatVal(t.amount)}</p>
                           </div>
                           <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                              <button onClick={() => onEditTransaction(t)} className="text-blue-400 p-1"><Edit size={10}/></button>
                              <button onClick={() => onDeleteTransaction(t.id)} className="text-rose-400 p-1"><Trash2 size={10}/></button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className={`text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-b ${isGold ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <tr>
                      <th className="p-3 whitespace-nowrap">Date</th>
                      <th className="p-3 whitespace-nowrap">Description</th>
                      <th className="p-3 text-right whitespace-nowrap">Dr</th>
                      <th className="p-3 text-right whitespace-nowrap">Cr</th>
                      <th className="p-3 text-right whitespace-nowrap">Bal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-blue-50/20 transition-colors" onClick={() => onEditTransaction(t)}>
                        <td className="p-3">
                           <p className="font-bold text-slate-700 text-[10px]">{t.date}</p>
                        </td>
                        <td className="p-3">
                           <p className="font-bold text-slate-800 text-[10px] truncate max-w-[100px]">{t.description}</p>
                        </td>
                        <td className="p-3 text-right font-mono text-[10px] text-rose-600 font-bold">
                           {t.type === 'debit' ? formatVal(t.amount) : '-'}
                        </td>
                        <td className={`p-3 text-right font-mono text-[10px] font-bold ${isGold ? 'text-amber-600' : 'text-emerald-600'}`}>
                           {t.type === 'credit' ? formatVal(t.amount) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-[10px] text-slate-900 font-black">
                           {formatVal(t.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
         )}
         </div>

         {/* Totals Footer */}
         <div className={`mt-3 p-3 rounded-xl grid grid-cols-2 gap-4 ${isGold ? 'bg-amber-950 text-amber-50' : 'bg-slate-900 text-white'}`}>
            <div className="flex flex-col">
               <span className={`text-[8px] font-black uppercase tracking-widest ${isGold ? 'text-amber-400' : 'text-slate-400'}`}>Total Liability</span>
               <span className="text-xs font-black text-rose-400 tabular-nums">{formatVal(totalDebit)}</span>
            </div>
            <div className="flex flex-col text-right">
               <span className={`text-[8px] font-black uppercase tracking-widest ${isGold ? 'text-amber-400' : 'text-slate-400'}`}>Total Paid</span>
               <span className={`text-xs font-black tabular-nums ${isGold ? 'text-amber-400' : 'text-emerald-400'}`}>{formatVal(totalCredit)}</span>
            </div>
         </div>
      </div>
  );
};
