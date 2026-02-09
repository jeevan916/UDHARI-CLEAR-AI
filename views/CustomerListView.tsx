
import React, { useState } from 'react';
import { 
  Search, Phone, MapPin, BrainCircuit, CheckSquare, Square, MessageSquare, 
  X, ChevronDown, ChevronUp, ArrowRight, History, TrendingUp, AlertTriangle, 
  PhoneCall, CreditCard, ExternalLink, MoreHorizontal, UserPlus 
} from 'lucide-react';
import { Customer, Template, GradeRule, CommunicationLog } from '../types';
import { formatCurrency, analyzeCustomerBehavior } from '../utils/debtUtils';
import { BulkMessageModal } from '../components/BulkMessageModal';
import { AddCustomerModal } from '../components/AddCustomerModal';

interface CustomerListViewProps {
  customers: Customer[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterGrade: string;
  setFilterGrade: (grade: string) => void;
  onView: (id: string) => void;
  templates?: Template[];
  gradeRules: GradeRule[];
  callLogs: CommunicationLog[];
  onAddCustomer: (data: any) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({ 
  customers, searchTerm, setSearchTerm, filterGrade, setFilterGrade, onView, templates = [], gradeRules, callLogs, onAddCustomer
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAccordion = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const selectedCustomers = customers.filter(c => selectedIds.has(c.id));

  return (
    <div className="space-y-6 animate-in fade-in pb-24 relative">
      {/* Search & Filter Header (Compact) */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-xl z-20 relative">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search Entity ID, Phone, Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] shadow-inner font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm uppercase tracking-widest placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 w-full xl:w-auto custom-scrollbar items-center">
            {['all', 'A', 'B', 'C', 'D'].map(g => (
              <button 
                key={g} 
                onClick={() => setFilterGrade(g)}
                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filterGrade === g ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
              >
                Grade {g.toUpperCase()}
              </button>
            ))}
            <div className="w-px h-8 bg-slate-200 mx-1 hidden xl:block"></div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-600/30 flex items-center gap-2 shrink-0"
            >
              <UserPlus size={14}/> Onboard
            </button>
          </div>
      </div>
      
      {/* Smart Accordion List (Denser) */}
      <div className="space-y-3">
          {/* List Header */}
          <div className="hidden md:grid grid-cols-[60px_2fr_1.5fr_1.5fr_60px] px-8 pb-1 text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
             <div className="pl-2">Select</div>
             <div>Entity Identity</div>
             <div>Risk Intelligence</div>
             <div>Net Exposure</div>
             <div className="text-center">Expand</div>
          </div>

          {customers.map(c => {
            const b = analyzeCustomerBehavior(c, gradeRules, callLogs);
            const isSelected = selectedIds.has(c.id);
            const isExpanded = expandedId === c.id;

            return (
              <div 
                key={c.id} 
                className={`bg-white rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-xl border-blue-200 ring-2 ring-blue-50/50' : 'shadow-sm border-slate-100 hover:shadow-md hover:border-slate-200'}`}
              >
                {/* Collapsed Header Row */}
                <div 
                  className="grid grid-cols-1 md:grid-cols-[60px_2fr_1.5fr_1.5fr_60px] p-4 md:p-5 items-center cursor-pointer gap-3 md:gap-0"
                  onClick={() => toggleAccordion(c.id)}
                >
                    {/* Checkbox */}
                    <div className="flex justify-between md:block">
                      <div className="md:pl-2" onClick={(e) => e.stopPropagation()}>
                         <button onClick={(e) => toggleSelectOne(c.id, e)} className={`transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}>
                            {isSelected ? <CheckSquare size={20}/> : <Square size={20}/>}
                         </button>
                      </div>
                      <div className="md:hidden">
                        <button className={`p-1.5 rounded-full ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                           {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                      </div>
                    </div>

                    {/* Identity */}
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 ${b.score > 70 ? 'bg-emerald-500 text-white' : b.score > 40 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {c.name.charAt(0)}
                       </div>
                       <div className="overflow-hidden">
                          <p className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tighter leading-none mb-1 truncate">{c.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                             <span className="font-mono text-slate-500">{c.uniquePaymentCode}</span>
                          </p>
                       </div>
                    </div>

                    {/* Risk Stats */}
                    <div className="flex flex-wrap gap-2 mt-1 md:mt-0">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border shadow-sm ${b.calculatedGrade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : b.calculatedGrade === 'B' ? 'bg-blue-50 text-blue-600 border-blue-100' : b.calculatedGrade === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          Grade {b.calculatedGrade}
                        </span>
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200">
                          {b.daysInactive}d Dormancy
                        </span>
                    </div>

                    {/* Exposure */}
                    <div className="mt-1 md:mt-0">
                       <p className="font-black text-slate-900 text-lg md:text-xl tabular-nums tracking-tighter">{formatCurrency(c.currentBalance)}</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</p>
                    </div>

                    {/* Chevron (Desktop) */}
                    <div className="hidden md:flex justify-center">
                       <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                          {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                       </div>
                    </div>
                </div>

                {/* Collapsible Detail Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 1. Quick Communication */}
                        <div className="space-y-3">
                           <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                              <PhoneCall size={10}/> Quick Connect
                           </h4>
                           <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => window.open(`https://wa.me/91${c.phone.replace(/\D/g, '').slice(-10)}`, '_blank')}
                                className="flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                              >
                                 <MessageSquare size={14}/>
                                 <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                              </button>
                              <button 
                                onClick={() => window.location.href = `tel:${c.phone}`}
                                className="flex items-center justify-center gap-2 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                              >
                                 <Phone size={14}/>
                                 <span className="text-[9px] font-black uppercase tracking-widest">Call</span>
                              </button>
                           </div>
                           <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                              <MapPin size={14} className="text-slate-300 mt-0.5"/>
                              <div>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase">Registered Address</p>
                                 <p className="text-[10px] font-bold text-slate-700 mt-0.5">{c.address}</p>
                              </div>
                           </div>
                        </div>

                        {/* 2. Mini Ledger Snapshot */}
                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                 <History size={10}/> Recent Activity
                              </h4>
                              <span className="text-[8px] font-bold text-slate-400">{c.transactions.length} Records</span>
                           </div>
                           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              {c.transactions.slice(0, 3).length > 0 ? (
                                 <div className="divide-y divide-slate-50">
                                    {c.transactions.slice(0, 3).map(t => (
                                       <div key={t.id} className="p-2.5 flex justify-between items-center">
                                          <div>
                                             <p className="text-[9px] font-bold text-slate-700 uppercase">{t.date}</p>
                                             <p className="text-[8px] text-slate-400 font-bold truncate max-w-[100px]">{t.description}</p>
                                          </div>
                                          <span className={`text-[10px] font-black tabular-nums ${t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                             {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                          </span>
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 <div className="p-4 text-center text-[9px] font-bold text-slate-400 uppercase">
                                    No Recent Transactions
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* 3. Deep Navigation */}
                        <div className="space-y-3 flex flex-col justify-between">
                           <div>
                              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3">
                                 <BrainCircuit size={10}/> Intelligence Node
                              </h4>
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <TrendingUp size={16}/>
                                 </div>
                                 <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Propensity</p>
                                    <p className="text-xs font-black text-slate-800 uppercase">{c.deepvueInsights?.financialPropensity || 'Unknown'}</p>
                                 </div>
                              </div>
                           </div>
                           
                           <button 
                              onClick={() => onView(c.id)}
                              className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                           >
                              Open Authority Node <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                           </button>
                        </div>

                     </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Bulk Action Bar - Sticky Bottom */}
      {selectedIds.size > 0 && (
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-slate-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl shadow-slate-900/40 flex items-center gap-6 border border-white/10">
               <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckSquare size={14} className="text-blue-400"/> {selectedIds.size} Selected
               </span>
               <div className="flex items-center gap-2">
                  <button 
                     onClick={() => setSelectedIds(new Set())}
                     className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                     title="Clear Selection"
                  >
                     <X size={16}/>
                  </button>
                  <button 
                     onClick={() => setIsBulkModalOpen(true)}
                     className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-600/30 flex items-center gap-2"
                  >
                     <MessageSquare size={12}/> Send Message
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Bulk Message Modal */}
      <BulkMessageModal 
         isOpen={isBulkModalOpen}
         onClose={() => setIsBulkModalOpen(false)}
         selectedCustomers={selectedCustomers}
         templates={templates}
         onComplete={() => {
            setIsBulkModalOpen(false);
            setSelectedIds(new Set());
         }}
      />

      <AddCustomerModal 
         isOpen={isAddModalOpen} 
         onClose={() => setIsAddModalOpen(false)} 
         onAdd={(data) => {
            onAddCustomer(data);
            setIsAddModalOpen(false);
         }} 
      />
    </div>
  );
};
