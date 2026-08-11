import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import api from '../services/api';
import { Product, StockMovement } from '../types';
import {
  Plus,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  History,
  X,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW'>('ALL');

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unitPrice: 0,
    currentStock: 0,
    minStock: 5,
    category: '',
  });

  // Stock Adjustment Modal
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [stockAdjustmentQty, setStockAdjustmentQty] = useState(1);
  const [stockNotes, setStockNotes] = useState('');

  // Stock Movement History Drawer
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = stockFilter === 'LOW' ? '/products/low-stock' : '/products?limit=100';
      if (search && stockFilter !== 'LOW') url += `&search=${encodeURIComponent(search)}`;
      const res: any = await api.get(url);
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, stockFilter]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res: any = await api.post('/products', formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          sku: '',
          name: '',
          description: '',
          unitPrice: 0,
          currentStock: 0,
          minStock: 5,
          category: '',
        });
        fetchProducts();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product SKU');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockAdjustment = async (type: 'IN' | 'OUT') => {
    if (!selectedProductForStock || stockAdjustmentQty <= 0) return;
    setSubmitting(true);
    try {
      const endpoint = type === 'IN' ? '/stock/in' : '/stock/out';
      const res: any = await api.post(endpoint, {
        productId: selectedProductForStock.id,
        quantity: stockAdjustmentQty,
        notes: stockNotes || `Manual ${type} stock adjustment`,
      });

      if (res.success) {
        setSelectedProductForStock(null);
        setStockAdjustmentQty(1);
        setStockNotes('');
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.message || `Failed to record stock ${type}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryDrawer = async (product: Product) => {
    setSelectedProductForHistory(product);
    setLoadingMovements(true);
    try {
      const res: any = await api.get(`/stock/movements?productId=${product.id}`);
      if (res.success) {
        setMovements(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching movement history:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const columns = [
    {
      header: 'SKU / PRODUCT',
      cell: (p: Product) => (
        <div>
          <p className="font-bold text-mono-900 dark:text-white">{p.name}</p>
          <p className="text-xs font-mono text-mono-500">SKU: {p.sku}</p>
        </div>
      ),
    },
    {
      header: 'CATEGORY',
      cell: (p: Product) => (
        <span className="text-xs font-mono text-mono-500 uppercase">{p.category || 'General'}</span>
      ),
    },
    {
      header: 'UNIT PRICE',
      cell: (p: Product) => (
        <span className="font-mono font-semibold text-mono-900 dark:text-white">
          ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'STOCK / MIN',
      cell: (p: Product) => {
        const isLow = p.currentStock <= p.minStock;
        return (
          <div className="font-mono text-xs">
            <span className={`font-bold ${isLow ? 'text-mono-900 dark:text-white underline decoration-mono-400 font-extrabold' : 'text-mono-800 dark:text-mono-200'}`}>
              {p.currentStock}
            </span>
            <span className="text-mono-400"> / {p.minStock} min</span>
          </div>
        );
      },
    },
    {
      header: 'STATUS',
      cell: (p: Product) => {
        const isLow = p.currentStock <= p.minStock;
        return <Badge status={isLow ? 'LOW STOCK' : 'IN STOCK'} size="sm" />;
      },
    },
    {
      header: 'ACTIONS',
      cell: (p: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductForStock(p);
            }}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-mono-900 text-white dark:bg-white dark:text-black rounded-lg shadow-sm hover:bg-mono-800 transition"
          >
            Adjust
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openHistoryDrawer(p);
            }}
            className="p-1 text-mono-500 hover:text-mono-900 dark:hover:text-white rounded-lg border border-mono-200 dark:border-mono-800"
            title="View Audit Log"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-mono-100 dark:bg-surface-dark text-mono-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Inventory Catalog" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-mono-900 dark:text-white">
                INVENTORY MASTER
              </h1>
              <p className="text-xs text-mono-500 dark:text-mono-400">
                SKU product master catalog and stock level control.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-mono-900 hover:bg-mono-800 dark:bg-white dark:hover:bg-mono-100 text-white dark:text-black text-xs sm:text-sm font-extrabold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Product SKU
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-surface-cardDark border border-mono-200 dark:border-surface-borderDark rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-mono-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by SKU code, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs sm:text-sm text-mono-900 dark:text-white placeholder-mono-400 focus:outline-none focus:border-mono-900 dark:focus:border-white transition"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 bg-mono-100 dark:bg-mono-950 p-1 rounded-xl border border-mono-200 dark:border-mono-800 w-full sm:w-auto">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  stockFilter === 'ALL'
                    ? 'bg-mono-900 text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white'
                }`}
              >
                ALL SKUs
              </button>
              <button
                onClick={() => setStockFilter('LOW')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  stockFilter === 'LOW'
                    ? 'bg-mono-900 text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                LOW STOCK WARNINGS
              </button>
            </div>
          </div>

          {/* Inventory Data Workspace */}
          <div className="animate-fade-up">
            <DataTable
              columns={columns}
              data={products}
              loading={loading}
              emptyMessage="No product SKUs found matching your filter criteria."
              onRowClick={(p) => openHistoryDrawer(p)}
            />
          </div>
        </main>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product SKU"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-mono-100 dark:bg-mono-900 border border-mono-300 dark:border-mono-700 text-mono-900 dark:text-mono-100 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                SKU Code *
              </label>
              <input
                type="text"
                required
                placeholder="SKU-HYD-100"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="Hydraulic Cylinder 100mm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="4500.00"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                Initial Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="20"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                Minimum Stock Level *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="5"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="Hydraulics"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-mono-200 dark:border-mono-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-mono font-bold border border-mono-200 dark:border-mono-800 rounded-xl text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-mono-900 hover:bg-mono-800 dark:bg-white dark:hover:bg-mono-100 text-white dark:text-black text-xs font-extrabold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Product SKU'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      {selectedProductForStock && (
        <Modal
          isOpen={!!selectedProductForStock}
          onClose={() => setSelectedProductForStock(null)}
          title={`Stock Adjustment — ${selectedProductForStock.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-mono-50 dark:bg-mono-950 rounded-xl border border-mono-200 dark:border-mono-800 flex items-center justify-between font-mono text-xs">
              <span className="text-mono-500">Current Balance:</span>
              <span className="font-extrabold text-mono-900 dark:text-white">{selectedProductForStock.currentStock} Units</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                Adjustment Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={stockAdjustmentQty}
                onChange={(e) => setStockAdjustmentQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                Adjustment Notes
              </label>
              <input
                type="text"
                placeholder="Reason (e.g. Purchase Receipt, Stock Damage)"
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-mono-200 dark:border-mono-800">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStockAdjustment('IN')}
                className="py-2.5 bg-mono-900 hover:bg-mono-800 dark:bg-white dark:hover:bg-mono-100 text-white dark:text-black text-xs font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <ArrowDownRight className="w-4 h-4" /> Stock IN (+)
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStockAdjustment('OUT')}
                className="py-2.5 border border-mono-300 dark:border-mono-700 bg-mono-100 dark:bg-mono-900 hover:bg-mono-200 dark:hover:bg-mono-800 text-mono-900 dark:text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" /> Stock OUT (-)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Stock Movement Audit Log Drawer */}
      {selectedProductForHistory && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedProductForHistory(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-cardDark border-l border-mono-200 dark:border-surface-borderDark h-full z-10 p-6 flex flex-col justify-between shadow-2xl animate-fade-up">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-mono-200 dark:border-mono-800">
                <div>
                  <h2 className="text-base font-bold text-mono-900 dark:text-white">{selectedProductForHistory.name}</h2>
                  <p className="text-xs text-mono-500 font-mono">SKU: {selectedProductForHistory.sku}</p>
                </div>
                <button
                  onClick={() => setSelectedProductForHistory(null)}
                  className="p-1 text-mono-400 hover:text-mono-900 dark:hover:text-white rounded-lg border border-mono-200 dark:border-mono-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Movement Records List */}
              <div className="mt-6 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                <h3 className="text-xs font-mono font-bold text-mono-500 uppercase tracking-wider">
                  Audit Movement Log ({movements.length})
                </h3>
                {loadingMovements ? (
                  <p className="text-xs text-mono-500 font-mono py-4 text-center">Loading audit log...</p>
                ) : movements.length === 0 ? (
                  <p className="text-xs text-mono-500 font-mono py-4 text-center">No stock movement history found.</p>
                ) : (
                  movements.map((m) => (
                    <div key={m.id} className="p-3 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-extrabold uppercase text-mono-900 dark:text-white">
                          [{m.type}] {m.quantity} Units
                        </span>
                        <span className="text-mono-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-mono-600 dark:text-mono-400">{m.remarks || 'Routine stock record'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
