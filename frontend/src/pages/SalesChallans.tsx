import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SalesChallan, ChallanStatus } from '../types';
import { Plus, Search, FileText } from 'lucide-react';

export const SalesChallans: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchChallans = async () => {
    setLoading(true);
    try {
      let url = '/sales-challans?limit=100';
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res: any = await api.get(url);
      if (res.success) {
        setChallans(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching sales delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const columns = [
    {
      header: 'CHALLAN #',
      cell: (c: SalesChallan) => (
        <span className="font-mono font-extrabold text-apple-blue hover:underline cursor-pointer">
          {c.challanNumber}
        </span>
      ),
    },
    {
      header: 'CUSTOMER',
      cell: (c: SalesChallan) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{c.customer?.name || 'N/A'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {c.customer?.businessName || c.customer?.companyName || ''}
          </p>
        </div>
      ),
    },
    {
      header: 'LINE ITEMS',
      cell: (c: SalesChallan) => (
        <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
          {c.items?.length || 0} Products
        </span>
      ),
    },
    {
      header: 'TOTAL AMOUNT',
      cell: (c: SalesChallan) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          ₹{Number(c.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'STATUS',
      cell: (c: SalesChallan) => <Badge status={c.status} size="sm" />,
    },
    {
      header: 'DISPATCH DATE',
      cell: (c: SalesChallan) => (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Sales Dispatches" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Sales Dispatches
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Delivery order management, dispatch confirmations, and printable challans.
              </p>
            </div>
            <button
              onClick={() => navigate('/sales-challans/new')}
              className="px-4 py-2.5 bg-apple-blue hover:bg-apple-blueHover text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-apple-blue/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Delivery Order
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by challan #, customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-apple-blue transition"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
              {['ALL', 'DRAFT', 'CONFIRMED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Delivery Workspace Table */}
          <div className="animate-fade-up">
            <DataTable
              columns={columns}
              data={challans}
              loading={loading}
              emptyMessage="No sales delivery orders match your filter criteria."
              onRowClick={(c) => navigate(`/sales-challans/${c.id}`)}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
