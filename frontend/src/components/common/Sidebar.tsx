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
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: 'Operations Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Customer Directory',
      path: '/customers',
      icon: Users,
    },
    {
      name: 'Inventory Catalog',
      path: '/inventory',
      icon: Package,
    },
    {
      name: 'Sales Dispatches',
      path: '/sales-challans',
      icon: FileText,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-surface-cardDark text-mono-900 dark:text-white transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-mono-200 dark:border-surface-borderDark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-mono-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-mono-900 dark:text-white tracking-tight text-sm">FUNDSROOM</h1>
            <p className="text-[10px] text-mono-500 dark:text-mono-400 font-mono uppercase tracking-wider">ERP Operations</p>
          </div>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-mono-500 hover:text-mono-900 dark:text-mono-400 dark:hover:text-white rounded-lg border border-mono-200 dark:border-mono-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Role Context Indicator */}
      <div className="px-5 py-2.5 bg-mono-50 dark:bg-mono-950 border-b border-mono-200 dark:border-surface-borderDark flex items-center justify-between">
        <span className="text-[10px] font-mono font-extrabold uppercase text-mono-500 dark:text-mono-400 tracking-wider">Role Context</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-mono-200 dark:bg-mono-900 text-mono-900 dark:text-mono-200 border border-mono-300 dark:border-mono-800 uppercase tracking-wider">
          {user?.role}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="p-4 flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-mono font-extrabold text-mono-400 dark:text-mono-500 uppercase tracking-widest">
          Main Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-mono-900 text-white dark:bg-white dark:text-black font-bold shadow-sm border-l-4 border-mono-900 dark:border-white'
                    : 'text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white hover:bg-mono-100 dark:hover:bg-mono-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Quick Action Button */}
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <div className="pt-6">
            <div className="px-3 pb-1.5 text-[10px] font-mono font-extrabold text-mono-400 dark:text-mono-500 uppercase tracking-widest">
              Quick Action
            </div>
            <NavLink
              to="/sales-challans/new"
              onClick={onMobileClose}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-mono-900 hover:bg-mono-800 dark:bg-white dark:text-black dark:hover:bg-mono-100 rounded-xl shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              New Delivery Order
            </NavLink>
          </div>
        )}
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-mono-200 dark:border-surface-borderDark bg-mono-50 dark:bg-mono-950 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-mono-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-mono-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[10px] font-mono text-mono-500 dark:text-mono-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-mono-500 hover:text-mono-900 dark:text-mono-400 dark:hover:text-white rounded-lg hover:bg-mono-200 dark:hover:bg-mono-800 transition shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-mono-200 dark:border-surface-borderDark h-screen sticky top-0 no-print transition-colors duration-200">
        {content}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative w-64 max-w-xs h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
