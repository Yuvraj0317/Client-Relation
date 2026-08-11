import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Product, SalesChallan } from '../types';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [customersCount, setCustomersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<SalesChallan[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes, lowStockRes, challanRes]: any[] = await Promise.all([
          api.get('/customers?limit=1'),
          api.get('/products?limit=1'),
          api.get('/products/low-stock'),
          api.get('/sales-challans?limit=10'),
        ]);

        if (custRes.success) setCustomersCount(custRes.meta.total || 0);
        if (prodRes.success) setProductsCount(prodRes.meta.total || 0);
        if (lowStockRes.success) setLowStockProducts(lowStockRes.data || []);
        if (challanRes.success) {
          const list: SalesChallan[] = challanRes.data || [];
          setRecentChallans(list);

          const confirmed = list.filter((c) => c.status === 'CONFIRMED');
          const revenue = confirmed.reduce(
            (acc, curr) => acc + Number(curr.totalAmount || 0),
            0
          );
          setTotalRevenue(revenue);

          const drafts = list.filter((c) => c.status === 'DRAFT');
          setDraftCount(drafts.length);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const challanColumns = [
    {
      header: 'Challan #',
      accessor: 'challanNumber' as keyof SalesChallan,
      cell: (c: SalesChallan) => (
        <span className="font-mono font-bold text-ocean-600 dark:text-ocean-400">{c.challanNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: (c: SalesChallan) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-200">{c.customer?.name || 'N/A'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{c.customer?.businessName || c.customer?.companyName || ''}</p>
        </div>
      ),
    },
    {
      header: 'Total Amount',
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
      header: 'Created Date',
      cell: (c: SalesChallan) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Operations Overview" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          {/* Section 1: Quick Actions & Operations Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-section-reveal">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Operations Workspace Summary</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                Real-time stock warnings, sales revenue, and customer CRM metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/sales-challans/new')}
                className="px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-ocean-600/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Delivery Order
              </button>
            </div>
          </div>

          {/* Section 2: Metric KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-section-reveal">
            {/* Total Customers */}
            <div
              onClick={() => navigate('/customers')}
              className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark p-5 sm:p-6 rounded-2xl cursor-pointer hover:border-ocean-400 dark:hover:border-ocean-600 transition shadow-sm tilt-card-subtle group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Customers
                </span>
                <div className="p-2.5 rounded-xl bg-ocean-50 dark:bg-ocean-950 text-ocean-600 dark:text-ocean-400 group-hover:scale-105 transition">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3 font-mono">{customersCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                Active CRM Accounts <ArrowRight className="w-3 h-3 text-ocean-600 dark:text-ocean-400" />
              </p>
            </div>

            {/* Total SKU Inventory */}
            <div
              onClick={() => navigate('/inventory')}
              className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark p-5 sm:p-6 rounded-2xl cursor-pointer hover:border-ocean-400 dark:hover:border-ocean-600 transition shadow-sm tilt-card-subtle group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Master Products
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3 font-mono">{productsCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                Active Product SKUs <ArrowRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              </p>
            </div>

            {/* Low Stock Warnings */}
            <div
              onClick={() => navigate('/inventory')}
              className="bg-white dark:bg-surface-cardDark border border-amber-300 dark:border-amber-500/40 p-5 sm:p-6 rounded-2xl cursor-pointer hover:border-amber-500 transition shadow-sm tilt-card-subtle group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Low Stock Warnings
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-3 font-mono">
                {lowStockProducts.length}
              </p>
              <p className="text-xs text-amber-600/90 dark:text-amber-300/80 mt-1.5 flex items-center gap-1">
                Items requiring restock <ArrowRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </p>
            </div>

            {/* Confirmed Sales Revenue */}
            <div
              onClick={() => navigate('/sales-challans')}
              className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark p-5 sm:p-6 rounded-2xl cursor-pointer hover:border-ocean-400 dark:hover:border-ocean-600 transition shadow-sm tilt-card-subtle group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Confirmed Sales
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3 font-mono">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {draftCount} Draft orders pending
              </p>
            </div>
          </div>

          {/* Section 3: Recent Activity Table & Restock Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-section-reveal">
            {/* Recent Challans List */}
            <div className="lg:col-span-2 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ocean-600 dark:text-ocean-400" /> Recent Sales Delivery Orders
                </h3>
                <button
                  onClick={() => navigate('/sales-challans')}
                  className="text-xs font-semibold text-ocean-600 dark:text-ocean-400 hover:underline transition"
                >
                  View All Orders →
                </button>
              </div>

              <DataTable
                columns={challanColumns}
                data={recentChallans}
                loading={loading}
                emptyMessage="No delivery orders found. Create your first sales delivery note!"
                onRowClick={(c) => navigate(`/sales-challans/${c.id}`)}
              />
            </div>

            {/* Low Stock Warning Sidebar Widget */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Restock Callouts
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {lowStockProducts.length} Items
                </span>
              </div>

              <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-xl p-4 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm">
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                    ✅ All inventory levels are healthy!
                  </p>
                ) : (
                  lowStockProducts.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('/inventory')}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition"
                    >
                      <div>
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-200">{p.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                          {p.currentStock} / {p.minStock} min
                        </span>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">
                          Low Stock
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
