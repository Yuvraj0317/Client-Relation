import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Product, StockMovement } from '../types';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  History,
  MapPin,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(
    searchParams.get('filter') === 'low-stock'
  );

  // New Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unitPrice: 1000,
    currentStock: 10,
    minStock: 5,
    location: 'Main Warehouse - Rack 1',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Stock Movement Modal
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [movementQty, setMovementQty] = useState(1);
  const [movementRemarks, setMovementRemarks] = useState('');
  const [stockError, setStockError] = useState<string | null>(null);

  // Stock Movement History Drawer
  const [selectedProductLogs, setSelectedProductLogs] = useState<Product | null>(null);
  const [logsList, setLogsList] = useState<StockMovement[]>([]);

  const canManageStock = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = `/products?search=${encodeURIComponent(search)}`;
      if (categoryFilter) query += `&category=${encodeURIComponent(categoryFilter)}`;
      if (lowStockOnly) query += `&lowStockOnly=true`;

      const res: any = await api.get(query);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockOnly]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res: any = await api.post('/products', newProduct);
      if (res.success) {
        setIsProductModalOpen(false);
        setNewProduct({
          name: '',
          sku: '',
          category: 'Electronics',
          unitPrice: 1000,
          currentStock: 10,
          minStock: 5,
          location: 'Main Warehouse - Rack 1',
        });
        fetchProducts();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product');
    }
  };

  const handleLogStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    setStockError(null);

    try {
      const res: any = await api.post(`/products/${stockModalProduct.id}/stock-movement`, {
        type: movementType,
        quantity: Number(movementQty),
        remarks: movementRemarks,
      });

      if (res.success) {
        setStockModalProduct(null);
        setMovementQty(1);
        setMovementRemarks('');
        fetchProducts();
      }
    } catch (err: any) {
      setStockError(err.message || 'Stock movement update failed');
    }
  };

  const openLogsDrawer = async (p: Product) => {
    setSelectedProductLogs(p);
    try {
      const res: any = await api.get(`/products/${p.id}/stock-logs`);
      if (res.success) {
        setLogsList(res.data);
      }
    } catch (err) {
      console.error('Failed to load stock audit logs:', err);
    }
  };

  const columns = [
    {
      header: 'Product Details',
      cell: (p: Product) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono font-bold text-ocean-600 dark:text-ocean-400">SKU: {p.sku}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• {p.category}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Unit Price',
      cell: (p: Product) => (
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
          ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Current Stock',
      cell: (p: Product) => {
        const isLow = p.currentStock <= p.minStock;
        return (
          <div>
            <span
              className={`font-mono font-extrabold text-sm ${
                isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {p.currentStock} Units
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Min Alert: {p.minStock}</p>
          </div>
        );
      },
    },
    {
      header: 'Stock Status',
      cell: (p: Product) => {
        const isLow = p.currentStock <= p.minStock;
        return isLow ? (
          <Badge status="LOW_STOCK">⚠️ Low Stock</Badge>
        ) : (
          <Badge status="ACTIVE">In Stock</Badge>
        );
      },
    },
    {
      header: 'Warehouse Location',
      cell: (p: Product) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" /> {p.location}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (p: Product) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {canManageStock && (
            <button
              onClick={() => setStockModalProduct(p)}
              className="px-2.5 py-1 text-xs font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200 dark:bg-ocean-950 dark:text-ocean-300 dark:border-ocean-800 rounded-lg hover:bg-ocean-100 dark:hover:bg-ocean-900 transition"
            >
              Stock IN/OUT
            </button>
          )}
          <button
            onClick={() => openLogsDrawer(p)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Audit Movement History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Product & Inventory Control" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Master Inventory Catalog</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                SKU master catalog, minimum stock guardrails, and audit log movement tracking
              </p>
            </div>
            {canManageStock && (
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-ocean-600/30 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Product SKU
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-sm transition-colors duration-200">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by product name, SKU code, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ocean-600"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  lowStockOnly
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Low Stock Alerts Only
              </button>
            </div>
          </div>

          {/* Product Data Table */}
          <DataTable
            columns={columns}
            data={products}
            loading={loading}
            emptyMessage="No SKU products found in inventory."
            onRowClick={(p) => openLogsDrawer(p)}
          />

          {/* New Product Modal */}
          <Modal
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            title="Add Product SKU to Catalog"
          >
            <form onSubmit={handleCreateProduct} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-400 text-xs font-medium rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Wireless Laser Scanner"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-ocean-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="SKU-SCAN-1001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm uppercase font-mono focus:outline-none focus:border-ocean-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Barcode Systems"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-ocean-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.unitPrice}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:border-ocean-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.currentStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, currentStock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:border-ocean-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Minimum Alert Threshold
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.minStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, minStock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:border-ocean-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Warehouse Location / Shelf
                </label>
                <input
                  type="text"
                  value={newProduct.location}
                  onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                  placeholder="Warehouse B - Shelf 12"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-ocean-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-surface-borderDark">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-ocean-600/30 transition"
                >
                  Add Product SKU
                </button>
              </div>
            </form>
          </Modal>

          {/* Stock IN / OUT Adjustment Modal */}
          {stockModalProduct && (
            <Modal
              isOpen={!!stockModalProduct}
              onClose={() => setStockModalProduct(null)}
              title={`Stock Adjustment: ${stockModalProduct.name}`}
              maxWidth="md"
            >
              <form onSubmit={handleLogStockMovement} className="space-y-4">
                {stockError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-400 text-xs font-medium rounded-lg">
                    {stockError}
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex justify-between">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">SKU Code</span>
                    <span className="font-mono font-bold text-ocean-600 dark:text-ocean-400">
                      {stockModalProduct.sku}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Available Stock</span>
                    <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {stockModalProduct.currentStock} Units
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-2">
                    Movement Operation Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMovementType('IN')}
                      className={`p-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 ${
                        movementType === 'IN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Stock IN (Receive)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('OUT')}
                      className={`p-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 ${
                        movementType === 'OUT'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Stock OUT (Dispatch)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movementQty}
                    onChange={(e) => setMovementQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-ocean-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Audit Remarks / Reference Note
                  </label>
                  <input
                    type="text"
                    value={movementRemarks}
                    onChange={(e) => setMovementRemarks(e.target.value)}
                    placeholder="Supplier restock shipment note"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-ocean-600"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-surface-borderDark">
                  <button
                    type="button"
                    onClick={() => setStockModalProduct(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-ocean-600/30 transition"
                  >
                    Submit Stock Movement
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Stock Movement Audit Log Drawer */}
          {selectedProductLogs && (
            <Modal
              isOpen={!!selectedProductLogs}
              onClose={() => setSelectedProductLogs(null)}
              title={`Stock Movement Audit Log: ${selectedProductLogs.name}`}
              maxWidth="xl"
            >
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-mono text-ocean-600 dark:text-ocean-400 font-bold">
                    SKU: {selectedProductLogs.sku}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                    Current Stock: {selectedProductLogs.currentStock} Units
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {logsList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No stock movement audit records found.
                    </p>
                  ) : (
                    logsList.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <Badge status={log.type}>{log.type}</Badge>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-200">
                              {log.remarks || 'Stock movement'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Logged by {log.createdBy?.name || 'Warehouse Staff'} •{' '}
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono font-bold ${
                              log.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {log.type === 'IN' ? '+' : '-'}
                            {log.quantity} Units
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Modal>
          )}
        </main>
      </div>
    </div>
  );
};
