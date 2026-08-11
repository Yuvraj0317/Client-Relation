import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Customer, Product } from '../types';
import {
  Plus,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface LineItemInput {
  productId: string;
  quantity: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItemInput[]>([
    { productId: '', quantity: 1 },
  ]);

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes]: any[] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100'),
        ]);

        if (custRes.success) setCustomers(custRes.data || []);
        if (prodRes.success) setProducts(prodRes.data || []);
      } catch (err) {
        console.error('Error fetching master data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemInput, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const price = prod ? Number(prod.unitPrice) : 0;
      return sum + price * (item.quantity || 0);
    }, 0);
  };

  const checkStockWarnings = () => {
    return items.map((item) => {
      if (!item.productId) return null;
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return null;
      const isInsufficient = prod.currentStock < item.quantity;
      return {
        product: prod,
        requested: item.quantity,
        available: prod.currentStock,
        isInsufficient,
      };
    }).filter(Boolean);
  };

  const handleCreateChallan = async (confirmImmediately: boolean = false) => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select a customer for the delivery note');
      return;
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Please select at least one product item');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Draft
      const res: any = await api.post('/sales-challans', {
        customerId: selectedCustomerId,
        notes,
        items: validItems,
      });

      if (!res.success) throw new Error(res.message || 'Failed to create challan draft');

      const challanId = res.data.id;

      // 2. If Confirm Immediately is requested
      if (confirmImmediately) {
        const confirmRes: any = await api.post(`/sales-challans/${challanId}/confirm`);
        if (!confirmRes.success) throw new Error(confirmRes.message || 'Failed to confirm dispatch');
      }

      navigate(`/sales-challans/${challanId}`);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const stockWarnings = checkStockWarnings();
  const hasStockError = stockWarnings.some((w) => w?.isInsufficient);

  return (
    <div className="flex min-h-screen bg-mono-100 dark:bg-surface-dark text-mono-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Create Delivery Order" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between animate-fade-up">
            <button
              onClick={() => navigate('/sales-challans')}
              className="px-3 py-1.5 text-xs font-mono font-bold text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white transition flex items-center gap-1 border border-mono-200 dark:border-mono-800 rounded-xl bg-white dark:bg-mono-950"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dispatches
            </button>
            <span className="text-xs font-mono font-extrabold text-mono-500 uppercase">
              CHALLAN BUILDER WORKFLOW
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-mono-100 dark:bg-mono-900 border border-mono-300 dark:border-mono-700 text-mono-900 dark:text-mono-100 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Guided Workflow Container */}
          <div className="bg-white dark:bg-surface-cardDark border border-mono-200 dark:border-surface-borderDark rounded-2xl p-6 shadow-sm space-y-8 animate-fade-up">
            {/* Step 1: Customer Selection */}
            <div className="space-y-3 pb-6 border-b border-mono-200 dark:border-mono-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-mono-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-mono font-bold text-xs">
                  1
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-mono-900 dark:text-white">
                  Customer & Delivery Metadata
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                    Select Customer Account *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs sm:text-sm text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition font-sans"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.mobile}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-mono-500 uppercase mb-1">
                    Dispatch / Transport Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vehicle MH-12-AB-1234, Driver: Ramesh"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs sm:text-sm text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 dark:focus:border-white transition font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Line Items Selection */}
            <div className="space-y-4 pb-6 border-b border-mono-200 dark:border-mono-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-mono-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-mono font-bold text-xs">
                    2
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-mono-900 dark:text-white">
                    Order Products Itemization
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-mono-100 dark:bg-mono-900 hover:bg-mono-200 dark:hover:bg-mono-800 text-mono-900 dark:text-white text-xs font-mono font-bold rounded-xl border border-mono-300 dark:border-mono-700 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product Row
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => {
                  const selectedProd = products.find((p) => p.id === item.productId);
                  const price = selectedProd ? Number(selectedProd.unitPrice) : 0;
                  const itemTotal = price * (item.quantity || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl flex flex-col sm:flex-row items-center gap-3"
                    >
                      {/* Product Dropdown */}
                      <div className="flex-1 w-full">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-lg text-xs text-mono-900 dark:text-white focus:outline-none focus:border-mono-900 font-sans"
                        >
                          <option value="">-- Choose Product SKU --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (SKU: {p.sku}) — Available: {p.currentStock}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-full sm:w-28">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-lg text-xs font-mono text-mono-900 dark:text-white focus:outline-none focus:border-mono-900"
                        />
                      </div>

                      {/* Line Item Pricing Total */}
                      <div className="w-full sm:w-36 text-right font-mono text-xs font-bold text-mono-900 dark:text-white">
                        ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>

                      {/* Remove Row */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="p-2 text-mono-400 hover:text-mono-900 dark:hover:text-white rounded-lg transition disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Summary & Confirmation CTAs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-mono-500 uppercase tracking-widest block">
                  ORDER TOTAL VALUE
                </span>
                <span className="text-3xl font-extrabold font-mono text-mono-900 dark:text-white">
                  ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCreateChallan(false)}
                  className="px-4 py-2.5 border border-mono-300 dark:border-mono-700 bg-mono-100 dark:bg-mono-900 hover:bg-mono-200 dark:hover:bg-mono-800 text-mono-900 dark:text-white text-xs sm:text-sm font-mono font-bold rounded-xl transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Save Draft
                </button>

                <button
                  type="button"
                  disabled={submitting || hasStockError}
                  onClick={() => handleCreateChallan(true)}
                  className="px-5 py-2.5 bg-mono-900 hover:bg-mono-800 dark:bg-white dark:hover:bg-mono-100 text-white dark:text-black text-xs sm:text-sm font-extrabold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
