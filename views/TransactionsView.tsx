
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Search, Download, ShieldCheck, 
  Calendar, IndianRupee, Scale, ChevronLeft, ChevronRight, Loader2 
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency, formatGold } from '../utils/debtUtils';

export const TransactionsView: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchLedger = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/ledger/global', {
        params: {
          page,
          limit: 50,
          search: search || undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        }
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Ledger Fetch Error", err);
    } finally {
      setLoading(false);
    }
  }, [search, dateRange]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => fetchLedger(1), 500);
    return () => clearTimeout(timer);
  }, [search, dateRange, fetchLedger]);

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Global Ledger</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500"/> Scaled Data Engine • Optimized for 50k+ Records
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full lg:w-auto">
             <Search size={16} className="text-slate-400 ml-2"/>
             <input 
               type="text" 
               placeholder="Search entries..." 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
               className="bg-transparent text-xs font-bold uppercase outline-none text-slate-700 w-full md:w-48"
             />
          </div>
          <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full lg:w-auto overflow-hidden">
             <Calendar size={16} className="text-slate-400 ml-2 shrink-0"/>
             <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-transparent text-xs font-bold uppercase p-1 outline-none text-slate-600 w-full md:w-28"/>
             <span className="text-slate-400">-</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-transparent text-xs font-bold uppercase p-1 outline-none text-slate-600 w-full md:w-28"/>
          </div>
          <button className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-colors w-full lg:w-auto">
             <Download size={16}/> Export All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
             <Loader2 size={40} className="animate-spin text-blue-600"/>
          </div>
        )}
        
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
              {data.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="p-8">
                    <p className="font-bold text-slate-700 text-sm">{new Date(t.date).toLocaleDateString()}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">REF: {t.id}</p>
                  </td>
                  <td className="p-8">
                    <p className="font-black text-slate-900 uppercase text-sm">{t.customerName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.upc}</p>
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
                              {t.unit === 'gold' ? <Scale size={10}/> : <IndianRupee size={10}/>}
                              {t.unit.toUpperCase()}
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
                      {t.unit === 'gold' ? formatGold(Number(t.amount)) : formatCurrency(Number(t.amount))}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{(meta.page - 1) * meta.limit + 1}</span> to <span className="text-slate-900">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-slate-900">{meta.total}</span> entries
           </p>
           <div className="flex gap-2">
              <button 
                onClick={() => fetchLedger(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-40 transition-all shadow-sm"
              >
                 <ChevronLeft size={20}/>
              </button>
              <div className="flex items-center px-4 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 tabular-nums">
                 PAGE {meta.page} / {meta.totalPages}
              </div>
              <button 
                onClick={() => fetchLedger(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-40 transition-all shadow-sm"
              >
                 <ChevronRight size={20}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
