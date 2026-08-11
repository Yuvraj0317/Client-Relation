import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const normalizedStatus = status.toUpperCase();

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case 'CONFIRMED':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'IN STOCK':
        return {
          bg: 'bg-slate-900 text-white dark:bg-white dark:text-black font-extrabold border border-slate-800 dark:border-slate-200',
          icon: CheckCircle2,
        };
      case 'DRAFT':
      case 'PENDING':
      case 'LEAD':
        return {
          bg: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 font-semibold',
          icon: Clock,
        };
      case 'CANCELLED':
      case 'INACTIVE':
        return {
          bg: 'bg-slate-200 text-slate-900 border border-slate-400 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 font-medium line-through decoration-slate-400',
          icon: XCircle,
        };
      case 'LOW STOCK':
      case 'WARNING':
        return {
          bg: 'bg-slate-100 text-slate-900 border border-slate-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-extrabold',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 font-medium',
          icon: Clock,
        };
    }
  };

  const { bg, icon: Icon } = getStatusStyles();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider font-mono ${sizeClasses} ${bg}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{normalizedStatus}</span>
    </span>
  );
};
