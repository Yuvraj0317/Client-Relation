import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  PlusCircle,
  X,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { user } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Customer CRM',
      path: '/customers',
      icon: Users,
    },
    {
      name: 'Inventory & SKUs',
      path: '/inventory',
      icon: Package,
    },
    {
      name: 'Sales Challans',
      path: '/sales-challans',
      icon: FileText,
    },
  ];

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-surface-borderDark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ocean-600 flex items-center justify-center text-white font-bold shadow-md shadow-ocean-600/30">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white tracking-wide text-sm">Fundsroom ERP</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Operations & Logistics</p>
          </div>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Role Indicator */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-surface-borderDark flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Active Role</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-ocean-100 dark:bg-ocean-950 text-ocean-700 dark:text-ocean-400 border border-ocean-200 dark:border-ocean-800 uppercase tracking-wider">
          {user?.role}
        </span>
      </div>

      {/* Navigation Items */}
      <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Main Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-ocean-600 text-white shadow-md shadow-ocean-600/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Quick Shortcut for Sales/Admin */}
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <div className="pt-5">
            <div className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Quick Operations
            </div>
            <NavLink
              to="/sales-challans/new"
              onClick={onMobileClose}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-ocean-700 dark:text-ocean-300 bg-ocean-50 dark:bg-ocean-950/60 border border-ocean-200 dark:border-ocean-800/80 rounded-lg hover:bg-ocean-100 dark:hover:bg-ocean-900/60 transition"
            >
              <PlusCircle className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
              New Sales Delivery Order
            </NavLink>
          </div>
        )}
      </div>

      {/* User Footer Identity */}
      <div className="p-4 border-t border-slate-200 dark:border-surface-borderDark bg-slate-50/50 dark:bg-surface-dark/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ocean-100 dark:bg-slate-800 flex items-center justify-center font-bold text-ocean-700 dark:text-ocean-300 border border-ocean-200 dark:border-slate-700 text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 bg-white dark:bg-surface-cardDark border-r border-slate-200 dark:border-surface-borderDark h-screen sticky top-0 no-print transition-colors duration-200">
        {content}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative w-64 max-w-xs bg-white dark:bg-surface-cardDark border-r border-slate-200 dark:border-surface-borderDark h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
