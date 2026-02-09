
import React from 'react';
import { Shield, ShieldAlert, Menu } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  activeView: string;
  user: User;
  isAdmin: boolean;
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, user, isAdmin, onMenuToggle }) => {
  return (
    <header className="h-14 md:h-16 bg-[#F8FAFC] flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30 md:static border-b border-slate-100 md:border-none">
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
       
       <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm transition-all ${isAdmin ? 'bg-slate-900 border-slate-900' : 'bg-white border-blue-100'}`}>
             {isAdmin ? <ShieldAlert size={12} className="text-amber-400" /> : <Shield size={12} className="text-blue-600" />}
             <span className={`text-[8px] font-black uppercase tracking-widest hidden sm:inline ${isAdmin ? 'text-white' : 'text-blue-600'}`}>
               {isAdmin ? 'GOD MODE' : 'AGENT'}
             </span>
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
