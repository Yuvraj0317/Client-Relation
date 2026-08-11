import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { Role } from '../../types';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user, logout, loginAsDemoRole } = useAuth();

  const handleRoleSwitch = async (role: Role) => {
    try {
      await loginAsDemoRole(role);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    }
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Demo Mode Role Switcher Buttons */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Switch Role:
          </span>
          {(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleSwitch(r)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                user?.role === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-blue-400 font-mono tracking-wide">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border border-slate-800 hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
