import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Customer, Product } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  DollarSign,
  Package,
} from 'lucide-react';

interface SelectedItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<SelectedItem[]>([
    { productId: '', quantity: 1 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes]: any[] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100'),
        ]);

        if (custRes.success) setCustomers(custRes.data);
        if (prodRes.success) setProducts(prodRes.data);
      } catch (err) {
        console.error('Failed to load customers and products master data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();
  }, []);

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId,
      product: prod,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      quantity: Math.max(1, quantity),
    };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate Overall Grand Total
  const calculateTotal = () => {
    return items.reduce((acc, curr) => {
      if (!curr.product) return acc;
      return acc + Number(curr.product.unitPrice) * curr.quantity;
    }, 0);
  };

  // Check if any line item exceeds available stock
  const hasStockWarning = items.some((item) => {
    if (!item.product) return false;
    return item.quantity > item.product.currentStock;
  });

  const handleSubmitChallan = async (confirmImmediately: boolean = false) => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select a customer for this Delivery Challan');
      return;
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Please add at least 1 valid product line item');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Draft Challan
      const draftRes: any = await api.post('/sales-challans', {
        customerId: selectedCustomerId,
        notes,
        items: validItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (!draftRes.success) {
        throw new Error(draftRes.error?.message || 'Failed to save draft challan');
      }

      const newChallanId = draftRes.data.id;

      // 2. If Confirm Immediately clicked, execute stock deduction transaction
      if (confirmImmediately) {
        const confirmRes: any = await api.patch(`/sales-challans/${newChallanId}/confirm`);
        if (!confirmRes.success) {
          throw new Error(confirmRes.error?.message || 'Failed to confirm delivery dispatch');
        }
      }

      navigate(`/sales-challans/${newChallanId}`);
    } catch (err: any) {
      setError(err.message || 'Error processing sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Sales Challan Builder" />

        <main className="p-8 space-y-6 flex-1 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/sales-challans')}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Challans
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create New Sales Delivery Note
            </h1>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              1. Customer Account & Order Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Select Customer Account *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName || 'Individual'}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Dispatch Instructions / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Handle with care, deliver before 5 PM"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Editor Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                2. Delivery Line Items
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Product Row
              </button>
            </div>

            {/* Line items table */}
            <div className="space-y-3">
              {items.map((item, idx) => {
                const isOverStock =
                  item.product && item.quantity > item.product.currentStock;
                const lineTotal = item.product
                  ? Number(item.product.unitPrice) * item.quantity
                  : 0;

                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    {/* Product Selector */}
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Product Item #{idx + 1}
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100"
                      >
                        <option value="">-- Select SKU Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku}) — Stock: {p.currentStock} | ₹{p.unitPrice}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(idx, parseInt(e.target.value, 10) || 1)
                        }
                        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-xs font-mono font-bold ${
                          isOverStock
                            ? 'border-rose-500 text-rose-400'
                            : 'border-slate-800 text-slate-100'
                        }`}
                      />
                      {isOverStock && (
                        <p className="text-[10px] text-rose-400 mt-1 font-semibold">
                          ⚠️ Exceeds stock ({item.product?.currentStock} available)
                        </p>
                      )}
                    </div>

                    {/* Price & Line Total */}
                    <div className="md:col-span-3 text-right">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Line Total
                      </label>
                      <span className="font-mono font-bold text-sm text-emerald-400 block">
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {item.product && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          @ ₹{item.product.unitPrice} / unit
                        </span>
                      )}
                    </div>

                    {/* Delete row */}
                    <div className="md:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {hasStockWarning && (
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Notice: One or more products exceed current warehouse stock. You can save as Draft, but Confirmation will require restock.
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">
                  Grand Total
                </span>
                <span className="text-2xl font-extrabold font-mono text-white">
                  ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Submission Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitChallan(false)}
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition shadow"
            >
              {submitting ? 'Processing...' : 'Save as Draft (No Stock Impact)'}
            </button>

            <button
              type="button"
              disabled={submitting || hasStockWarning}
              onClick={() => handleSubmitChallan(true)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? 'Deducting Stock...' : 'Confirm Dispatch & Deduct Stock'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
