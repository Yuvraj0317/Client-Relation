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
      header: 'CHALLAN #',
      accessor: 'challanNumber' as keyof SalesChallan,
      cell: (c: SalesChallan) => (
        <span className="font-mono font-bold text-apple-blue hover:underline cursor-pointer">{c.challanNumber}</span>
      ),
    },
    {
      header: 'CUSTOMER',
      cell: (c: SalesChallan) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{c.customer?.name || 'N/A'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{c.customer?.businessName || c.customer?.companyName || ''}</p>
        </div>
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
      header: 'CREATED DATE',
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
        <Navbar title="Operations Overview" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          {/* Section 1: Intro Hero Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-black border border-slate-800 dark:border-slate-200">
                  REAL-TIME WORKSPACE
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">• Logistics & CRM</span>
              </div>
              <h1 className="text-xl sm:text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                Operations Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                Monitor customers, inventory and delivery activity from one calm operations workspace.
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/sales-challans/new')}
                className="px-4 py-2.5 bg-apple-blue hover:bg-apple-blueHover text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-apple-blue/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Delivery Order
              </button>
            </div>
          </div>

          {/* Section 2: Quiet Horizontal Metric Strip */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-6 shadow-sm animate-fade-up">
            <div className="text-[10px] font-mono font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              KEY METRICS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 gap-4 sm:gap-0">
              {/* Metric 1: Total Customers */}
              <div
                onClick={() => navigate('/customers')}
                className="sm:px-6 py-2 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    TOTAL CUSTOMERS
                  </span>
                  <Users className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">{customersCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  Active CRM accounts <ArrowRight className="w-3 h-3 text-apple-blue" />
                </p>
              </div>

              {/* Metric 2: Master Products */}
              <div
                onClick={() => navigate('/inventory')}
                className="sm:px-6 py-2 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    MASTER PRODUCTS
                  </span>
                  <Package className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">{productsCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  Active SKU master <ArrowRight className="w-3 h-3 text-apple-blue" />
                </p>
              </div>

              {/* Metric 3: Low Stock Warnings */}
              <div
                onClick={() => navigate('/inventory')}
                className="sm:px-6 py-2 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    LOW STOCK
                  </span>
                  <AlertTriangle className="w-4 h-4 text-slate-900 dark:text-white" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">
                  {lowStockProducts.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  Requires attention <ArrowRight className="w-3 h-3 text-apple-blue" />
                </p>
              </div>

              {/* Metric 4: Confirmed Sales */}
              <div
                onClick={() => navigate('/sales-challans')}
                className="sm:px-6 py-2 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    CONFIRMED SALES
                  </span>
                  <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">
                  ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Confirmed delivery value
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Sales Activity & Inventory Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
            {/* Sales Activity Table */}
            <div className="lg:col-span-2 space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" /> Sales Orders Activity
                </h3>
                <button
                  onClick={() => navigate('/sales-challans')}
                  className="text-xs font-mono font-bold text-apple-blue hover:underline transition"
                >
                  View All Orders →
                </button>
              </div>

              <DataTable
                columns={challanColumns}
                data={recentChallans}
                loading={loading}
                emptyMessage="No sales delivery orders found."
                onRowClick={(c) => navigate(`/sales-challans/${c.id}`)}
              />
            </div>

            {/* Inventory Intelligence Callouts */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Inventory Intelligence
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700">
                  {lowStockProducts.length} Items
                </span>
              </div>

              <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-xl p-4 divide-y divide-slate-100 dark:divide-slate-900/60 shadow-sm">
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                    All inventory levels healthy.
                  </p>
                ) : (
                  lowStockProducts.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('/inventory')}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 px-2 rounded-lg transition"
                    >
                      <div>
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-200">{p.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {p.currentStock} / {p.minStock} min
                        </span>
                        <p className="text-[9px] font-mono font-extrabold text-slate-600 dark:text-slate-400 uppercase">
                          LOW STOCK
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
