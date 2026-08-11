import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Customer, Product, SalesChallan } from '../types';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

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

          // Calculate revenue & draft count
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
        <span className="font-mono font-bold text-blue-400">{c.challanNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: (c: SalesChallan) => (
        <div>
          <p className="font-semibold text-slate-200">{c.customer?.name || 'N/A'}</p>
          <p className="text-xs text-slate-400">{c.customer?.companyName || ''}</p>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      cell: (c: SalesChallan) => (
        <span className="font-mono font-semibold text-slate-200">
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
        <span className="text-xs text-slate-400">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Operations & CRM Overview" />

        <main className="p-8 space-y-8 flex-1">
          {/* Quick Actions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
              <p className="text-slate-400 text-sm">
                Real-time stock warnings, sales revenue, and customer CRM metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/sales-challans/new')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Sales Challan
              </button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Customers */}
            <div
              onClick={() => navigate('/customers')}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-slate-700 transition shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Customers
                </span>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white mt-4">{customersCount}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                Active CRM Accounts <ArrowRight className="w-3 h-3 text-blue-400" />
              </p>
            </div>

            {/* Total SKU Inventory */}
            <div
              onClick={() => navigate('/inventory')}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-slate-700 transition shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Products in Master
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white mt-4">{productsCount}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                Managed SKUs <ArrowRight className="w-3 h-3 text-indigo-400" />
              </p>
            </div>

            {/* Low Stock Alerts */}
            <div
              onClick={() => navigate('/inventory?filter=low-stock')}
              className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl cursor-pointer hover:border-amber-500/60 transition shadow-lg group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Low Stock Warnings
                </span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-400 mt-4">
                {lowStockProducts.length}
              </p>
              <p className="text-xs text-amber-300/80 mt-1 flex items-center gap-1">
                Items requiring restock <ArrowRight className="w-3 h-3 text-amber-400" />
              </p>
            </div>

            {/* Confirmed Sales Revenue */}
            <div
              onClick={() => navigate('/sales-challans')}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-slate-700 transition shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Confirmed Sales
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white mt-4 font-mono">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {draftCount} Draft orders pending
              </p>
            </div>
          </div>

          {/* Section: Low Stock Warning Banner & Recent Activity Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Challans List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" /> Recent Sales Challans
                </h3>
                <button
                  onClick={() => navigate('/sales-challans')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  View All Challans →
                </button>
              </div>

              <DataTable
                columns={challanColumns}
                data={recentChallans}
                loading={loading}
                emptyMessage="No sales challans found. Create your first delivery note!"
                onRowClick={(c) => navigate(`/sales-challans/${c.id}`)}
              />
            </div>

            {/* Low Stock Warning Sidebar Widget */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" /> Low Stock Alerts
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {lowStockProducts.length} Items
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80 shadow-lg">
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    ✅ All product stock levels are healthy!
                  </p>
                ) : (
                  lowStockProducts.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('/inventory')}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 px-2 rounded-lg transition"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-200">{p.name}</p>
                        <p className="text-xs text-slate-400 font-mono">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-rose-400">
                          {p.currentStock} / {p.minStock} min
                        </span>
                        <p className="text-[10px] text-amber-400 font-medium uppercase">
                          Restock needed
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
