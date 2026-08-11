import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { Shield, KeyRound, ArrowRight, Layers } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loginAsDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Desktop Pointer Tilt (Max 1 Degree)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateX = Math.max(-1, Math.min(1, (-y / rect.height) * 2));
    const rotateY = Math.max(-1, Math.min(1, (x / rect.width) * 2));

    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemoRole(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const rolesList: { role: Role; label: string }[] = [
    { role: 'ADMIN', label: 'System Admin' },
    { role: 'SALES', label: 'Sales Officer' },
    { role: 'WAREHOUSE', label: 'Warehouse Mgr' },
    { role: 'ACCOUNTS', label: 'Accounts Officer' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-abstract-grid transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-up">
        {/* Brand Tag */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-ocean-600 flex items-center justify-center text-white font-bold shadow-md shadow-ocean-600/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            FUNDSROOM OPERATIONS
          </span>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sign In to Workspace
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Enter your credentials to access inventory & CRM operations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg animate-fade-up">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition: tilt.rotateX === 0 && tilt.rotateY === 0 ? 'transform 0.4s ease-out' : 'transform 0.1s ease-out',
          }}
          className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark py-8 px-6 sm:px-10 shadow-2xl rounded-2xl preserve-3d"
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fundsroom.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-ocean-600 dark:focus:border-ocean-500 focus:ring-1 focus:ring-ocean-600 transition text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-ocean-600 dark:focus:border-ocean-500 focus:ring-1 focus:ring-ocean-600 transition text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-ocean-600 hover:bg-ocean-700 text-white font-semibold rounded-xl shadow-md shadow-ocean-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Visually Secondary Demo Role Selector */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-ocean-600 dark:text-ocean-400" /> Demo Testing Roles
              </span>
              <span className="text-[9px] text-slate-400">1-Click Presets</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              {rolesList.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleDemoLogin(item.role)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-ocean-50/50 dark:hover:bg-ocean-950/40 hover:border-ocean-300 dark:hover:border-ocean-800 text-left transition flex items-center justify-between group"
                >
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 group-hover:text-ocean-600 dark:group-hover:text-ocean-400">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    {item.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
