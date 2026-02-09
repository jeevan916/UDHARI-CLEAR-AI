import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
  subtext?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, trend, trendColor, subtext }) => (
  <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-2">
      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 ${trendColor || 'text-emerald-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
       <p className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
       <h3 className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1 truncate">{title}</h3>
       {subtext && <p className="text-[9px] md:text-[10px] text-slate-400 mt-2 truncate">{subtext}</p>}
    </div>
  </div>
);