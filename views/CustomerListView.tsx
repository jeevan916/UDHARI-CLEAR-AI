
import React, { useState } from 'react';
import { Search, Phone, UserPlus, CheckSquare, Square, MessageSquare, ChevronDown, Activity } from 'lucide-react';
import { Customer, GradeRule, CommunicationLog } from '../types';
import { formatCurrency, analyzeCustomerBehavior } from '../utils/debtUtils';

export const CustomerListView: React.FC<{ 
  customers: Customer[]; onView: (id: string) => void; gradeRules: GradeRule[]; callLogs: CommunicationLog[] 
}> = ({ customers, onView, gradeRules, callLogs }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = customers.filter(c => {
    const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesGrade = filter === 'all' || b.calculatedGrade === filter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-[1600px] mx-auto pb-24">
      {/* Toolbar */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Entity Name, Phone, Code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm uppercase tracking-widest placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-2 items-center">
            {['all', 'A', 'B', 'C', 'D'].map(g => (
              <button 
                key={g} onClick={() => setFilter(g)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === g ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
              >
                {g.toUpperCase()}
              </button>
            ))}
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <UserPlus size={14}/> Onboard
            </button>
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filtered.map(c => {
           const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
           return (
             <div 
               key={c.id} onClick={() => onView(c.id)}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
             >
                <div className={`absolute top-0 right-0 p-4 px-6 rounded-bl-[1.5rem] text-[9px] font-black uppercase text-white shadow-lg ${b.calculatedGrade === 'A' ? 'bg-emerald-500' : b.calculatedGrade === 'B' ? 'bg-blue-600' : b.calculatedGrade === 'C' ? 'bg-amber-500' : 'bg-rose-600'}`}>
                   Grade {b.calculatedGrade}
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all">{c.name.charAt(0)}</div>
                   <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{c.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-end border-b border-slate-50 pb-3">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Outstanding</span>
                      <span className="text-2xl font-black text-slate-900 tabular-nums">{formatCurrency(c.currentBalance)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500">
                      <span className="flex items-center gap-1"><Activity size={12} className="text-amber-500"/> {b.daysInactive}d Dormancy</span>
                      <span className="text-emerald-600">{Math.round(b.score)}% Health</span>
                   </div>
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
};
