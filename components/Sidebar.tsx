import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, Briefcase, 
  Layers, ChevronDown, LogOut, X, Bot, HeartPulse, PhoneCall, BrainCircuit, FileText, Ghost,
  ChevronLeft, ChevronRight, Landmark, Server, Settings
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  expandedMenus: Record<string, boolean>;
  setExpandedMenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isAdmin: boolean;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, setActiveView, expandedMenus, setExpandedMenus, isAdmin, onLogout, isMobileOpen, onCloseMobile
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavigation = (view: string) => {
    setActiveView(view);
    onCloseMobile();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const SidebarBtn = ({ icon, label, active, onClick }: any) => (
    <button 
      onClick={onClick} 
      className={`
        relative flex items-center transition-all duration-200 rounded-xl
        ${isCollapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'gap-4 p-3 w-full'}
        ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <div className="shrink-0">{icon}</div>
      {!isCollapsed && <span className="font-black uppercase text-[10px] tracking-widest truncate">{label}</span>}
    </button>
  );

  const SidebarGroup = ({ icon, label, id, children }: any) => {
    const isOpen = expandedMenus[id];
    return (
      <div className="py-1">
        <button 
          onClick={() => {
            if (isCollapsed) setIsCollapsed(false);
            setExpandedMenus(p => ({ ...p, [id]: !p[id] }));
          }} 
          className={`
            w-full flex items-center transition-colors
            ${isCollapsed ? 'justify-center p-3' : 'justify-between p-3'}
            text-slate-400 hover:text-slate-900
          `}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
             <div className="shrink-0">{icon}</div> 
             {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest truncate">{label}</span>}
          </div>
          {!isCollapsed && (
             <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          )}
        </button>
        {isOpen && !isCollapsed && (
          <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in" onClick={onCloseMobile}/>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-all duration-300
        md:relative md:z-auto md:shadow-none md:border-r md:h-screen
        ${isMobileOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}
      `}>
        <div className={`flex items-center shrink-0 border-b border-slate-100 ${isCollapsed ? 'justify-center p-4 h-20' : 'justify-between px-6 h-20'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`rounded-xl flex items-center justify-center shadow-lg text-white font-black transition-all ${isAdmin ? 'bg-slate-900' : 'bg-indigo-600'} w-10 h-10 text-sm`}>
              SJ
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                 <span className="font-black text-slate-900 uppercase text-xs tracking-tighter block truncate">Sanghavi Jewellers</span>
                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">Recovery Node 72.61.175.20</span>
              </div>
            )}
          </div>
          <button onClick={onCloseMobile} className="md:hidden text-slate-400 p-2"><X size={20}/></button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto custom-scrollbar pb-6">
          <SidebarBtn icon={<LayoutDashboard size={18}/>} label="Executive View" active={activeView === 'dashboard'} onClick={() => handleNavigation('dashboard')} />
          <SidebarBtn icon={<BrainCircuit size={18}/>} label="Cortex (Brain)" active={activeView === 'brain'} onClick={() => handleNavigation('brain')} />
          
          <SidebarGroup icon={<Briefcase size={18}/>} label="Ledger & Authority" id="ledger">
            <button onClick={() => handleNavigation('transactions')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'transactions' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>Global Ledger</button>
            <button onClick={() => handleNavigation('payment-logs')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'payment-logs' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>Audit Logs</button>
          </SidebarGroup>

          <SidebarBtn icon={<Users size={18}/>} label="Entity Master" active={activeView === 'customers'} onClick={() => handleNavigation('customers')} />

          <SidebarGroup icon={<MessageSquare size={18}/>} label="Protocol Bridge" id="protocols">
            <button onClick={() => handleNavigation('whatsapp-chat')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'whatsapp-chat' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-900'}`}>WhatsApp Hub</button>
            <button onClick={() => handleNavigation('whatsapp-config')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'whatsapp-config' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-900'}`}>WhatsApp Node</button>
            <button onClick={() => handleNavigation('call-logs')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'call-logs' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>Call Logs</button>
          </SidebarGroup>

          <SidebarGroup icon={<Layers size={18}/>} label="Risk Architect" id="risk">
            <button onClick={() => handleNavigation('grades')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'grades' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>Sovereign Logic</button>
            <button onClick={() => handleNavigation('template-architect')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'template-architect' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>Templates</button>
            <button onClick={() => handleNavigation('integrations')} className={`w-full text-left py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest ${activeView === 'integrations' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>Infrastructure</button>
          </SidebarGroup>
          
          {isAdmin && (
             <div className="pt-2 mt-2 border-t border-slate-100">
                <SidebarBtn icon={<Ghost size={18} className="text-indigo-500"/>} label="God Mode" active={activeView === 'cortex-architect'} onClick={() => handleNavigation('cortex-architect')} />
             </div>
          )}
        </nav>

        <div className="p-3 border-t border-slate-100 bg-white sticky bottom-0 flex flex-col gap-2">
           <button onClick={toggleCollapse} className="hidden md:flex items-center justify-center w-full py-2 text-slate-300 hover:text-slate-600">{isCollapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}</button>
           <div className={`rounded-xl border bg-slate-50 p-3 ${isCollapsed ? 'hidden' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase text-slate-600 truncate">72.61.175.20</span>
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase">CONNECTED - u477692720</p>
           </div>
           <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest">
             <LogOut size={16}/> {!isCollapsed && "Terminate Session"}
           </button>
        </div>
      </aside>
    </>
  );
};