
import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Download, ShieldCheck, Trash2, Calendar, IndianRupee, Scale } from 'lucide-react';
import { Customer, Transaction } from '../types';
import { formatCurrency, formatGold } from '../utils/debtUtils';

interface TransactionsViewProps {
  customers: Customer[];
  isAdmin: boolean;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ customers, isAdmin }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten transactions from all customers into a single chronological ledger
  const allTransactions = useMemo(() => {
    let txs = customers.flatMap(c => 
      c.transactions.map(t => ({ 
        ...t, 
        customerName: c.name, 
        customerId: c.id, 
        uniquePaymentCode: c.uniquePaymentCode 
      }))
    );

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      txs = txs.filter(t => t.description.toLowerCase().includes(lower) || t.customerName.toLowerCase().includes(lower) || t.amount.toString().includes(searchTerm));
    }
    if (dateRange.start) txs = txs.filter(t => t.date >= dateRange.start);
    if (dateRange.end) txs = txs.filter(t => t.date <= dateRange.end);

    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customers, searchTerm, dateRange]);

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Global Ledger</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500"/> Immutable Audit Trail • Node 139.59.10.70
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full lg:w-auto">
             <Search size={16} className="text-slate-400 ml-2"/>
             <input type="text" placeholder="Search entries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent text-xs font-bold uppercase outline-none text-slate-700 w-full md:w-48"/>
          </div>
          <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full lg:w-auto overflow-hidden">
             <Calendar size={16} className="text-slate-400 ml-2 shrink-0"/>
             <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-transparent text-xs font-bold uppercase p-1 outline-none text-slate-600 w-full md:w-28"/>
             <span className="text-slate-400">-</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-transparent text-xs font-bold uppercase p-1 outline-none text-slate-600 w-full md:w-28"/>
          </div>
          <button className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-colors w-full lg:w-auto">
             <Download size={16}/> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="p-8">Timestamp / Ref</th>
                <th className="p-8">Entity</th>
                <th className="p-8">Movement</th>
                <th className="p-8">Description</th>
                <th className="p-8 text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="p-8">
                    <p className="font-bold text-slate-700 text-sm">{t.date}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">REF: {t.id}</p>
                  </td>
                  <td className="p-8">
                    <p className="font-black text-slate-900 uppercase text-sm">{t.customerName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.uniquePaymentCode}</p>
                  </td>
                  <td className="p-8">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'debit' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {t.type === 'debit' ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}
                        </div>
                        <div>
                           <span className={`text-[11px] font-black uppercase tracking-wider block ${t.type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                             {t.type === 'debit' ? 'Liability' : 'Recovery'}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                              {(t.unit || 'money') === 'gold' ? <Scale size={10}/> : <IndianRupee size={10}/>}
                              {(t.unit || 'money').toUpperCase()}
                           </span>
                        </div>
                     </div>
                  </td>
                  <td className="p-8">
                    <p className="font-bold text-slate-700 text-sm truncate max-w-xs">{t.description}</p>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2 inline-block">
                      {t.method}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <p className={`text-xl font-black tracking-tight tabular-nums ${t.type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {t.type === 'debit' ? '-' : '+'}
                      {(t.unit || 'money') === 'gold' ? formatGold(t.amount) : formatCurrency(t.amount)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
