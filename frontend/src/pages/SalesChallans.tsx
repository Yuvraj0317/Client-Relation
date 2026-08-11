import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SalesChallan } from '../types';
import { FileText, Plus, Search } from 'lucide-react';

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
      console.error('Error fetching sales challans:', err);
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
      accessor: 'challanNumber' as keyof SalesChallan,
      cell: (c: SalesChallan) => (
        <span className="font-mono font-bold text-mono-900 dark:text-white">{c.challanNumber}</span>
      ),
    },
    {
      header: 'CUSTOMER',
      cell: (c: SalesChallan) => (
        <div>
          <p className="font-bold text-mono-900 dark:text-white">{c.customer?.name || 'N/A'}</p>
          <p className="text-xs text-mono-500 font-mono">{c.customer?.businessName || c.customer?.companyName || ''}</p>
        </div>
      ),
    },
    {
      header: 'ITEMS',
      cell: (c: SalesChallan) => (
        <span className="font-mono text-xs text-mono-600 dark:text-mono-400">
          {c.items?.length || 0} Products
        </span>
      ),
    },
    {
      header: 'TOTAL AMOUNT',
      cell: (c: SalesChallan) => (
        <span className="font-mono font-bold text-mono-900 dark:text-white">
          ₹{Number(c.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'STATUS',
      cell: (c: SalesChallan) => <Badge status={c.status} size="sm" />,
    },
    {
      header: 'DATE',
      cell: (c: SalesChallan) => (
        <span className="text-xs font-mono text-mono-500">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-mono-100 dark:bg-surface-dark text-mono-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Sales Dispatches" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-mono-900 dark:text-white">
                SALES CHALLANS
              </h1>
              <p className="text-xs text-mono-500 dark:text-mono-400">
                Delivery order dispatches and stock movement documentation.
              </p>
            </div>
            <button
              onClick={() => navigate('/sales-challans/new')}
              className="px-4 py-2.5 bg-mono-900 hover:bg-mono-800 dark:bg-white dark:hover:bg-mono-100 text-white dark:text-black text-xs sm:text-sm font-extrabold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Delivery Order
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-surface-cardDark border border-mono-200 dark:border-surface-borderDark rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-mono-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Challan #, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs sm:text-sm text-mono-900 dark:text-white placeholder-mono-400 focus:outline-none focus:border-mono-900 dark:focus:border-white transition"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 bg-mono-100 dark:bg-mono-950 p-1 rounded-xl border border-mono-200 dark:border-mono-800 w-full sm:w-auto">
              {['ALL', 'DRAFT', 'CONFIRMED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    statusFilter === st
                      ? 'bg-mono-900 text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Challans Directory Table */}
          <div className="animate-fade-up">
            <DataTable
              columns={columns}
              data={challans}
              loading={loading}
              emptyMessage="No delivery challan records found matching your filter criteria."
              onRowClick={(c) => navigate(`/sales-challans/${c.id}`)}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
