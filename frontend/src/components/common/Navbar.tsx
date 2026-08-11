import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor, Menu, UserCheck } from 'lucide-react';
import { Role } from '../../types';

interface NavbarProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onMobileMenuToggle }) => {
  const { user, loginAsDemoRole } = useAuth();
  const { theme, setTheme } = useTheme();

  const demoRoles: { role: Role; label: string }[] = [
    { role: 'ADMIN', label: 'Admin' },
    { role: 'SALES', label: 'Sales' },
    { role: 'WAREHOUSE', label: 'Warehouse' },
    { role: 'ACCOUNTS', label: 'Accounts' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-surface-cardDark/90 backdrop-blur-md border-b border-slate-200 dark:border-surface-borderDark px-4 sm:px-6 py-3.5 transition-colors duration-200 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Context */}
        <div className="flex items-center gap-3">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Fundsroom ERP + CRM Workspace
            </p>
          </div>
        </div>

        {/* Right: Demo Role Switcher & Theme Control */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Role Testing Pills */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-apple-blue" /> Role:
            </span>
            {demoRoles.map((r) => {
              const isActive = user?.role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => loginAsDemoRole(r.role)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setTheme('light')}
              title="Light Theme"
              className={`p-1.5 rounded-lg transition ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Dark Theme"
              className={`p-1.5 rounded-lg transition ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('system')}
              title="System Theme"
              className={`p-1.5 rounded-lg transition ${
                theme === 'system'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Active User Pill */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
