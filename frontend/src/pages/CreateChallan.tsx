import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Customer, Product } from '../types';
import {
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building,
  Package,
} from 'lucide-react';

interface SelectedItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  productName: string;
  sku: string;
  availableStock: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [custRes, prodRes]: any[] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100'),
        ]);

        if (custRes.success) setCustomers(custRes.data || []);
        if (prodRes.success) setProducts(prodRes.data || []);
      } catch (err) {
        console.error('Error initializing challan form data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIndex = items.findIndex((i) => i.productId === productId);
    if (existingIndex > -1) return;

    setItems([
      ...items,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: Number(prod.unitPrice),
        quantity: 1,
        availableStock: prod.currentStock,
      },
    ]);
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setItems(
      items.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const grandTotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleSaveChallan = async (autoConfirm: boolean = false) => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select a valid customer account');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product line item to dispatch');
      return;
    }

    // Client-side stock check warning before submission
    for (const item of items) {
      if (autoConfirm && item.quantity > item.availableStock) {
        setError(`Insufficient stock for ${item.productName} (Available: ${item.availableStock}, Requested: ${item.quantity})`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Create Draft
      const res: any = await api.post('/sales-challans', {
        customerId: selectedCustomerId,
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      if (res.success && res.data?.id) {
        const challanId = res.data.id;
        // 2. If auto confirm requested
        if (autoConfirm) {
          await api.post(`/sales-challans/${challanId}/confirm`);
        }
        navigate(`/sales-challans/${challanId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate delivery order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="New Delivery Order" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between animate-fade-up">
            <button
              onClick={() => navigate('/sales-challans')}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dispatches
            </button>
            <span className="text-xs font-mono text-slate-400">GUIDED CHALLAN WORKFLOW</span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-4 shadow-sm font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between overflow-x-auto animate-fade-up">
            <span className={selectedCustomerId ? 'text-slate-900 dark:text-white font-extrabold' : ''}>01 CUSTOMER</span>
            <span>→</span>
            <span className={items.length > 0 ? 'text-slate-900 dark:text-white font-extrabold' : ''}>02 PRODUCTS</span>
            <span>→</span>
            <span className={items.length > 0 ? 'text-slate-900 dark:text-white font-extrabold' : ''}>03 QUANTITY</span>
            <span>→</span>
            <span>04 STOCK CHECK</span>
            <span>→</span>
            <span className={grandTotal > 0 ? 'text-slate-900 dark:text-white font-extrabold' : ''}>05 TOTAL</span>
            <span>→</span>
            <span>06 CONFIRM</span>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-900 dark:text-white shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection Card */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-6 shadow-sm space-y-4 animate-fade-up">
            <h2 className="text-sm font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
              <Building className="w-4 h-4" /> 01 Select Dispatch Customer Account *
            </h2>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition font-sans"
            >
              <option value="">-- Choose Customer Account --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ''} — Mobile: {c.mobile || c.phone}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
                <p className="font-extrabold text-slate-900 dark:text-white">{selectedCustomer.name}</p>
                <p className="text-slate-500">GSTIN: {selectedCustomer.gstNumber || 'Unregistered'}</p>
                <p className="text-slate-500">Delivery Address: {selectedCustomer.address || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Product Items Picker & Table */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-6 shadow-sm space-y-4 animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                <Package className="w-4 h-4" /> 02 & 03 Add Product Line Items *
              </h2>

              {/* Product Select Picker */}
              <div className="w-full sm:w-80">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition font-sans"
                >
                  <option value="">+ Add Product from Master Catalog</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.currentStock}) — ₹{p.unitPrice}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items Table */}
            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 font-mono">
                No products added to delivery note. Select items above.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">PRODUCT</th>
                      <th className="p-3">AVAILABLE STOCK</th>
                      <th className="p-3">UNIT PRICE</th>
                      <th className="p-3 w-28">QUANTITY</th>
                      <th className="p-3 text-right">TOTAL</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {items.map((i) => {
                      const isLow = i.quantity > i.availableStock;
                      return (
                        <tr key={i.productId} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                          <td className="p-3">
                            <p className="font-bold text-slate-900 dark:text-white">{i.productName}</p>
                            <p className="text-[10px] font-mono text-slate-500">SKU: {i.sku}</p>
                          </td>
                          <td className="p-3 font-mono">
                            <span className={isLow ? 'text-slate-900 dark:text-white font-extrabold underline' : 'text-slate-700 dark:text-slate-300'}>
                              {i.availableStock} Units
                            </span>
                          </td>
                          <td className="p-3 font-mono">₹{i.unitPrice.toFixed(2)}</td>
                          <td className="p-3 font-mono">
                            <input
                              type="number"
                              min="1"
                              value={i.quantity}
                              onChange={(e) => handleQuantityChange(i.productId, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs text-center focus:outline-none focus:border-apple-blue"
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{(i.quantity * i.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(i.productId)}
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Remarks & Order Summary Footer */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-6 animate-fade-up">
            <div className="w-full sm:w-1/2 space-y-2">
              <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase">
                Dispatch Remarks / Order Notes
              </label>
              <textarea
                rows={3}
                placeholder="Special dispatch instructions, vehicle #..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition"
              />
            </div>

            <div className="w-full sm:w-1/2 space-y-3 flex flex-col justify-between">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 font-mono">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Payable:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveChallan(false)}
                  className="flex-1 py-2.5 px-3 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold rounded-xl transition disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveChallan(true)}
                  className="flex-1 py-2.5 px-3 bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-extrabold rounded-xl shadow-md shadow-apple-blue/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save & Confirm
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
