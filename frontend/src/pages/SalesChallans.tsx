import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SalesChallan, ChallanStatus } from '../types';
import { FileText, Plus, Search, Filter, Calendar } from 'lucide-react';

export const SalesChallans: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        <span className="font-mono font-bold text-blue-400">{c.challanNumber}</span>
      ),
    },
    {
      header: 'Customer',
      cell: (c: SalesChallan) => (
        <div>
          <p className="font-semibold text-slate-100">{c.customer?.name || 'N/A'}</p>
          <p className="text-xs text-slate-400">{c.customer?.companyName || ''}</p>
        </div>
      ),
    },
    {
      header: 'Line Items',
      cell: (c: SalesChallan) => (
        <span className="text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg text-slate-300">
          {c._count?.items || 0} Products
        </span>
      ),
    },
    {
      header: 'Total Value',
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
      header: 'Created Info',
      cell: (c: SalesChallan) => (
        <div className="text-xs text-slate-400">
          <p>By {c.createdBy?.name || 'Sales Agent'}</p>
          <p className="text-[10px] text-slate-500">
            {new Date(c.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Sales Challan & Dispatch Engine" />

        <main className="p-8 space-y-6 flex-1">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Delivery Challans</h1>
              <p className="text-slate-400 text-sm">
                Generate delivery notes, snapshot line item pricing, and execute stock dispatch
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => navigate('/sales-challans/new')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Sales Challan
              </button>
            )}
          </div>

          {/* Status Tabs & Search Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['ALL', 'DRAFT', 'CONFIRMED', 'CANCELLED'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusTab === tab
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Orders' : tab}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by challan # or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Challans Table */}
          <DataTable
            columns={columns}
            data={challans}
            loading={loading}
            emptyMessage="No sales challans found. Click 'Create Sales Challan' to issue a delivery note."
            onRowClick={(c) => navigate(`/sales-challans/${c.id}`)}
          />
        </main>
      </div>
    </div>
  );
};
