import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, Theme } from '../../context/ThemeContext';
import { LogOut, Sun, Moon, Monitor, Shield, Menu } from 'lucide-react';
import { Role } from '../../types';

interface NavbarProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onMobileMenuToggle }) => {
  const { user, logout, loginAsDemoRole } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleRoleSwitch = async (role: Role) => {
    try {
      await loginAsDemoRole(role);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    }
  };

  return (
    <header className="bg-white/90 dark:bg-surface-cardDark/90 backdrop-blur-md border-b border-slate-200 dark:border-surface-borderDark px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 no-print">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Operations & Delivery Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Professional Environment Demo Role Switcher */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-ocean-600 dark:text-ocean-400" /> Session Role:
          </span>
          {(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleSwitch(r)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                user?.role === r
                  ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Theme Selector (System / Light / Dark) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setTheme('light')}
            title="Light Mode"
            className={`p-1.5 rounded-md transition ${
              theme === 'light'
                ? 'bg-white dark:bg-slate-800 text-ocean-600 dark:text-ocean-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Dark Mode"
            className={`p-1.5 rounded-md transition ${
              theme === 'dark'
                ? 'bg-white dark:bg-slate-800 text-ocean-600 dark:text-ocean-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('system')}
            title="System Preference"
            className={`p-1.5 rounded-md transition ${
              theme === 'system'
                ? 'bg-white dark:bg-slate-800 text-ocean-600 dark:text-ocean-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-ocean-600 dark:text-ocean-400 font-mono tracking-wide font-bold">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
