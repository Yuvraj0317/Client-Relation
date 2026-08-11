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
          bg: 'bg-mono-900 text-white dark:bg-white dark:text-black font-extrabold border border-mono-800 dark:border-mono-200',
          icon: CheckCircle2,
        };
      case 'DRAFT':
      case 'PENDING':
      case 'LEAD':
        return {
          bg: 'bg-mono-100 text-mono-700 border border-mono-300 dark:bg-mono-900 dark:text-mono-300 dark:border-mono-800 font-semibold',
          icon: Clock,
        };
      case 'CANCELLED':
      case 'INACTIVE':
        return {
          bg: 'bg-mono-200 text-mono-900 border border-mono-400 dark:bg-mono-950 dark:text-mono-400 dark:border-mono-800 font-medium line-through decoration-mono-400',
          icon: XCircle,
        };
      case 'LOW STOCK':
      case 'WARNING':
        return {
          bg: 'bg-mono-100 text-mono-900 border border-mono-400 dark:bg-mono-900 dark:text-white dark:border-mono-700 font-extrabold',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-mono-100 text-mono-800 border border-mono-300 dark:bg-mono-900 dark:text-mono-200 dark:border-mono-800 font-medium',
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
