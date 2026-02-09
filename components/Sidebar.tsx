
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, MessageCircle, Briefcase, 
  Layers, ChevronDown, LogOut, X, Bot, HeartPulse, PhoneCall, BrainCircuit, FileText, Ghost,
  ChevronLeft, ChevronRight, Menu
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

  // Helper for tooltip-like behavior or cleaner markup
  const SidebarBtn = ({ icon, label, id, active, onClick }: any) => (
    <button 
      onClick={onClick} 
      title={isCollapsed ? label : ''}
      className={`
        relative flex items-center transition-all duration-200 rounded-xl
        ${isCollapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'gap-4 p-3 w-full'}
        ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <div className="shrink-0">{icon}</div>
      {!isCollapsed && <span className="font-bold uppercase text-[10px] tracking-widest truncate">{label}</span>}
      {isCollapsed && active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full opacity-20"></div>}
    </button>
  );

  const SidebarGroup = ({ icon, label, id, children }: any) => {
    const isOpen = expandedMenus[id];
    return (
      <div className="py-1">
        <button 
          onClick={() => {
            if (isCollapsed) setIsCollapsed(false); // Auto-expand if clicking a group in collapsed mode
            setExpandedMenus(p => ({ ...p, [id]: !p[id] }));
          }} 
          title={isCollapsed ? label : ''}
          className={`
            w-full flex items-center transition-colors
            ${isCollapsed ? 'justify-center p-3' : 'justify-between p-3'}
            text-slate-400 hover:text-slate-900
          `}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
             <div className="shrink-0">{icon}</div> 
             {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest truncate">{label}</span>}
          </div>
          {!isCollapsed && (
             <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
          )}
        </button>
        {isOpen && (
          <div className={`${isCollapsed ? 'hidden' : 'ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-1 duration-200'}`}>
            {children}
          </div>
        )}
      </div>
    );
  };

  const SidebarSubBtn = ({ label, active, onClick, icon }: any) => (
    <button 
      onClick={onClick} 
      className={`
        w-full text-left py-2.5 px-3 rounded-lg transition-all font-bold text-[9px] uppercase tracking-widest flex items-center gap-2
        ${active ? 'bg-blue-50 text-blue-600 font-black' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}
      `}
    >
      {icon && React.cloneElement(icon, { size: 12 })}
      {label}
    </button>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-all duration-300 ease-in-out
        md:relative md:z-auto md:shadow-none md:border-r md:h-screen
        ${isMobileOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}
      `}>
        {/* Header Area */}
        <div className={`
           flex items-center shrink-0 border-b border-slate-100 transition-all duration-300
           ${isCollapsed ? 'justify-center p-4 h-20' : 'justify-between px-6 h-20'}
        `}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`
               rounded-xl flex items-center justify-center shadow-lg text-white font-black italic transition-all
               ${isAdmin ? 'bg-slate-900' : 'bg-blue-600'}
               ${isCollapsed ? 'w-10 h-10 text-sm' : 'w-10 h-10 text-sm'}
            `}>
              AF
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                 <span className="font-black text-slate-900 uppercase text-xs tracking-widest block truncate">ArrearsFlow</span>
                 <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 block">Root Node 139.59.10.70</span>
              </div>
            )}
          </div>
          
          {/* Mobile Close */}
          <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto custom-scrollbar pb-6">
          <SidebarBtn icon={<LayoutDashboard size={18}/>} label="Executive View" active={activeView === 'dashboard'} onClick={() => handleNavigation('dashboard')} />
          <SidebarBtn icon={<BrainCircuit size={18}/>} label="Cortex (Brain)" active={activeView === 'brain'} onClick={() => handleNavigation('brain')} />
          
          <SidebarGroup icon={<Briefcase size={18}/>} label="Ledger & Authority" id="ledger">
            <SidebarSubBtn label="Global Ledger" active={activeView === 'transactions'} onClick={() => handleNavigation('transactions')} />
            <SidebarSubBtn label="Audit Logs" active={activeView === 'payment-logs'} onClick={() => handleNavigation('payment-logs')} />
          </SidebarGroup>

          <SidebarBtn icon={<Users size={18}/>} label="Entity Master" active={activeView === 'customers'} onClick={() => handleNavigation('customers')} />

          <SidebarGroup icon={<MessageCircle size={18}/>} label="Protocol Bridge" id="protocols">
            <SidebarSubBtn label="WhatsApp Hub" active={activeView === 'whatsapp-chat'} onClick={() => handleNavigation('whatsapp-chat')} />
            <SidebarSubBtn label="WhatsApp Logs" active={activeView === 'whatsapp-logs'} onClick={() => handleNavigation('whatsapp-logs')} icon={<FileText/>} />
            <SidebarSubBtn label="Configuration" active={activeView === 'whatsapp-config'} onClick={() => handleNavigation('whatsapp-config')} />
            <SidebarSubBtn label="Call Logs" active={activeView === 'call-logs'} onClick={() => handleNavigation('call-logs')} icon={<PhoneCall/>} />
          </SidebarGroup>

          <SidebarGroup icon={<Layers size={18}/>} label="Risk Architect" id="risk">
            <SidebarSubBtn label="Autoheal™" icon={<HeartPulse/>} active={activeView === 'grades'} onClick={() => handleNavigation('grades')} />
            <SidebarSubBtn label="Templates" icon={<Bot/>} active={activeView === 'template-architect'} onClick={() => handleNavigation('template-architect')} />
            <SidebarSubBtn label="Infrastructure" active={activeView === 'integrations'} onClick={() => handleNavigation('integrations')} />
          </SidebarGroup>

          {isAdmin && (
             <div className="pt-2 mt-2 border-t border-slate-100">
                <SidebarBtn 
                  icon={<Ghost size={18} className="text-blue-500"/>} 
                  label="God Mode" 
                  active={activeView === 'cortex-architect'} 
                  onClick={() => handleNavigation('cortex-architect')} 
                />
             </div>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-white sticky bottom-0 shrink-0 flex flex-col gap-2">
           {/* Collapse Toggle (Desktop Only) */}
           <button 
             onClick={toggleCollapse}
             className="hidden md:flex items-center justify-center w-full py-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
             title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
           >
             {isCollapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
           </button>

           <div className={`
              rounded-xl border bg-slate-50 border-slate-200 transition-all overflow-hidden
              ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}
           `}>
              {isCollapsed ? (
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
              ) : (
                 <>
                    <div className="flex items-center gap-2 mb-0.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 truncate">139.59.10.70</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">ONLINE</p>
                 </>
              )}
           </div>
           
           <button 
             onClick={onLogout} 
             title="Terminate Session"
             className={`
                w-full flex items-center transition-all rounded-xl text-rose-500 hover:bg-rose-50
                ${isCollapsed ? 'justify-center p-3' : 'justify-center gap-2 p-3'}
             `}
           >
             <LogOut size={16}/>
             {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
           </button>
        </div>
      </aside>
    </>
  );
};
