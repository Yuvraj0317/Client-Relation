import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children }) => {
  const getBadgeStyle = (val: string) => {
    const s = val.toUpperCase();
    if (s === 'CONFIRMED' || s === 'ACTIVE' || s === 'COMPLETED' || s === 'IN' || s === 'DISTRIBUTOR') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (s === 'DRAFT' || s === 'PROSPECT' || s === 'PENDING' || s === 'WHOLESALER' || s === 'LOW_STOCK') {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (s === 'CANCELLED' || s === 'INACTIVE' || s === 'OUT' || s === 'OUT_OF_STOCK') {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (s === 'LEAD' || s === 'RETAILER' || s === 'MANUAL') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
        status
      )}`}
    >
      {children || status}
    </span>
  );
};
