
import React, { useState, useRef, useEffect } from 'react';
import { Shield, ShieldAlert, Menu, Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  activeView: string;
  user: User;
  isAdmin: boolean;
  onMenuToggle: () => void;
  systemLogs?: string[];
}

export const Header: React.FC<HeaderProps> = ({ activeView, user, isAdmin, onMenuToggle, systemLogs = [] }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter relevant logs for notifications
  const alerts = systemLogs.filter(log => 
    log.includes('ERR') || 
    log.includes('FAIL') || 
    log.includes('RECOVERY') || 
    log.includes('WEBHOOK')
  ).slice(0, 5); // Show top 5

  const unreadCount = alerts.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 md:h-16 bg-[#F8FAFC] flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-40 border-b border-slate-100 md:border-none md:relative">
       <div className="flex items-center gap-3">
          <button 
            onClick={onMenuToggle}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col justify-center">
             <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">
               {activeView.replace(/-/g, ' ')}
             </h1>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                {isAdmin ? 'System Administrator' : 'Field Agent View'}
             </p>
          </div>
       </div>
       
       <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm transition-all ${isAdmin ? 'bg-slate-900 border-slate-900' : 'bg-white border-blue-100'}`}>
             {isAdmin ? <ShieldAlert size={12} className="text-amber-400" /> : <Shield size={12} className="text-blue-600" />}
             <span className={`text-[8px] font-black uppercase tracking-widest hidden sm:inline ${isAdmin ? 'text-white' : 'text-blue-600'}`}>
               {isAdmin ? 'GOD MODE' : 'AGENT'}
             </span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-full transition-all relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#F8FAFC]"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">System Alerts</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded shadow-sm">
                    {unreadCount} NEW
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={24} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All Systems Nominal</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {alerts.map((log, index) => {
                        const isError = log.includes('ERR') || log.includes('FAIL');
                        const isSuccess = log.includes('RECOVERY') || log.includes('SUCCESS');
                        
                        return (
                          <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start">
                            <div className={`mt-0.5 shrink-0 ${isError ? 'text-rose-500' : isSuccess ? 'text-emerald-500' : 'text-blue-500'}`}>
                              {isError ? <AlertTriangle size={16} /> : isSuccess ? <CheckCircle2 size={16} /> : <Info size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-slate-700 leading-snug line-clamp-3">
                                {log}
                              </p>
                              <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">
                                {isError ? 'Action Required' : 'Status Update'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {alerts.length > 0 && (
                   <div className="bg-slate-50 border-t border-slate-100 p-2 text-center">
                      <button 
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                      >
                         Dismiss All
                      </button>
                   </div>
                )}
              </div>
            )}
          </div>

          <div className="relative group cursor-pointer">
             <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-white flex items-center justify-center font-black text-xs shadow-md transition-transform group-hover:scale-105 ${isAdmin ? 'bg-slate-900' : 'bg-blue-600'}`}>
               {user.name.charAt(0)}
             </div>
             <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#F8FAFC] rounded-full"></div>
          </div>
       </div>
    </header>
  );
};
