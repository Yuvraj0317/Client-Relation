import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SalesChallan } from '../types';
import { Plus, Search } from 'lucide-react';

export const SalesChallans: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<string>('ALL');

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchChallans = async () => {
    setLoading(true);
    try {
      let query = `/sales-challans?search=${encodeURIComponent(search)}`;
      if (statusTab !== 'ALL') {
        query += `&status=${statusTab}`;
      }

      const res: any = await api.get(query);
      if (res.success) {
        setChallans(res.data);
      }
    } catch (err) {
      console.error('Error fetching sales challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusTab]);

  const columns = [
    {
      header: 'Challan #',
      cell: (c: SalesChallan) => (
        <span className="font-mono font-bold text-ocean-600 dark:text-ocean-400">{c.challanNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: (c: SalesChallan) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{c.customer?.name || 'N/A'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{c.customer?.businessName || c.customer?.companyName || ''}</p>
        </div>
      ),
    },
    {
      header: 'Line Items',
      cell: (c: SalesChallan) => (
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {c._count?.items || (c.items ? c.items.length : 0)} Items
        </span>
      ),
    },
    {
      header: 'Total Order Value',
      cell: (c: SalesChallan) => (
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
          ₹{Number(c.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (c: SalesChallan) => <Badge status={c.status} />,
    },
    {
      header: 'Created Info',
      cell: (c: SalesChallan) => (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p>By {c.createdBy?.name || 'Sales Agent'}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {new Date(c.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Sales Delivery Dispatches" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Delivery Challan Orders</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                Generate delivery notes, snapshot line item pricing, and execute stock dispatch
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => navigate('/sales-challans/new')}
                className="px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-ocean-600/30 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Delivery Order
              </button>
            )}
          </div>

          {/* Status Tabs & Search Bar */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark p-4 rounded-xl space-y-4 shadow-sm transition-colors duration-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {['ALL', 'DRAFT', 'CONFIRMED', 'CANCELLED'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusTab === tab
                        ? 'bg-ocean-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Orders' : tab}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by challan # or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ocean-600"
                />
              </div>
            </div>
          </div>

          {/* Challans Table */}
          <DataTable
            columns={columns}
            data={challans}
            loading={loading}
            emptyMessage="No sales challans found. Click 'New Delivery Order' to issue a delivery note."
            onRowClick={(c) => navigate(`/sales-challans/${c.id}`)}
          />
        </main>
      </div>
    </div>
  );
};
