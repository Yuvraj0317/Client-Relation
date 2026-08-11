import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, children }) => {
  const getBadgeStyle = (val: string) => {
    const s = val.toUpperCase();
    if (s === 'CONFIRMED' || s === 'ACTIVE' || s === 'COMPLETED' || s === 'IN' || s === 'DISTRIBUTOR') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80';
    }
    if (s === 'DRAFT' || s === 'PROSPECT' || s === 'PENDING' || s === 'WHOLESALE' || s === 'WHOLESALER' || s === 'LOW_STOCK') {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/80';
    }
    if (s === 'CANCELLED' || s === 'INACTIVE' || s === 'OUT' || s === 'OUT_OF_STOCK') {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/80';
    }
    if (s === 'LEAD' || s === 'RETAIL' || s === 'RETAILER' || s === 'MANUAL') {
      return 'bg-ocean-50 text-ocean-700 border-ocean-200 dark:bg-ocean-950/60 dark:text-ocean-300 dark:border-ocean-800/80';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border tracking-wide uppercase ${getBadgeStyle(
        status
      )}`}
    >
      {children || status}
    </span>
  );
};
