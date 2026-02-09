import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
  subtext?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, value, icon, trend, trendColor, subtext 
}) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
    <div className="absolute -bottom-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 100 }) : null}
    </div>
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm ${trendColor || 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
       <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none mb-1.5">{value}</p>
       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{title}</h3>
       {subtext && <div className="h-px bg-slate-100 w-full mb-3"></div>}
       {subtext && <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight italic opacity-70">{subtext}</p>}
    </div>
  </div>
);