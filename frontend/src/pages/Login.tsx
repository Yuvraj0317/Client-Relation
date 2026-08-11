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

  // Subtle 1-2 degree mouse tilt state for desktop hover
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if user prefers reduced motion or is on touch device
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Constrain tilt strictly to max 1.5 degrees
    const rotateX = Math.max(-1.5, Math.min(1.5, (-y / rect.height) * 3));
    const rotateY = Math.max(-1.5, Math.min(1.5, (x / rect.width) * 3));

    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    // Return naturally to original position
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

  const rolesList: { role: Role; label: string; desc: string }[] = [
    {
      role: 'ADMIN',
      label: 'System Admin',
      desc: 'Full access across CRM, Inventory, Stock Movements, & Orders',
    },
    {
      role: 'SALES',
      label: 'Sales Officer',
      desc: 'Create Customers, add Follow-ups, Create & Confirm Challans',
    },
    {
      role: 'WAREHOUSE',
      label: 'Warehouse Manager',
      desc: 'Setup SKU master, log Stock IN/OUT, Confirm Dispatches',
    },
    {
      role: 'ACCOUNTS',
      label: 'Accounts Officer',
      desc: 'Read-only financial views & capability to Cancel Orders',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ambient-glow transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-ocean-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-ocean-600/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Fundsroom ERP Operations
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Mini ERP + CRM Platform for Wholesale Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition: tilt.rotateX === 0 && tilt.rotateY === 0 ? 'transform 0.4s ease-out' : 'transform 0.1s ease-out',
          }}
          className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark py-8 px-6 shadow-xl rounded-2xl sm:px-10 preserve-3d"
        >
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-ocean-600 dark:focus:border-ocean-500 focus:ring-1 focus:ring-ocean-600 transition text-sm"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-ocean-600 dark:focus:border-ocean-500 focus:ring-1 focus:ring-ocean-600 transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-ocean-600 hover:bg-ocean-700 text-white font-semibold rounded-xl shadow-md shadow-ocean-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In to ERP Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Login Roles Box */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
              Demo Testing Role Presets
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rolesList.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleDemoLogin(item.role)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/60 hover:bg-ocean-50/60 dark:hover:bg-ocean-950/40 hover:border-ocean-300 dark:hover:border-ocean-800/80 text-left transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-200 group-hover:text-ocean-600 dark:group-hover:text-ocean-400">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
