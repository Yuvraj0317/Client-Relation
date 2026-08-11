import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SalesChallan } from '../types';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallan = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/sales-challans/${id}`);
      if (res.success) {
        setChallan(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery challan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    try {
      const res: any = await api.post(`/sales-challans/${id}/confirm`);
      if (res.success) {
        fetchChallan();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm delivery dispatch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to cancel this delivery order? Stock will be restored if previously confirmed.')) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res: any = await api.post(`/sales-challans/${id}/cancel`);
      if (res.success) {
        fetchChallan();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel delivery order');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-mono-100 dark:bg-surface-dark text-mono-900 dark:text-white font-sans items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block w-8 h-8 border-2 border-mono-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-mono-500">Loading delivery document...</p>
        </div>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="flex min-h-screen bg-mono-100 dark:bg-surface-dark text-mono-900 dark:text-white font-sans">
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Delivery Document Error" onMobileMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="p-8 text-center space-y-4">
            <p className="text-sm text-mono-600 dark:text-mono-400">{error || 'Challan document not found'}</p>
            <button
              onClick={() => navigate('/sales-challans')}
              className="px-4 py-2 bg-mono-900 text-white font-mono text-xs font-bold rounded-xl"
            >
              Back to Sales Dispatches
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-mono-100 dark:bg-surface-dark text-mono-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={`Challan: ${challan.challanNumber}`} onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-4xl mx-auto w-full">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print animate-fade-up">
            <button
              onClick={() => navigate('/sales-challans')}
              className="px-3 py-1.5 text-xs font-mono font-bold text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white transition flex items-center gap-1 border border-mono-200 dark:border-mono-800 rounded-xl bg-white dark:bg-mono-950 self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dispatches
            </button>

            <div className="flex items-center gap-3">
              {challan.status === 'DRAFT' && (
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-mono-900 hover:bg-mono-800 dark:bg-white dark:hover:bg-mono-100 text-white dark:text-black text-xs font-extrabold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Dispatch
                </button>
              )}

              {challan.status !== 'CANCELLED' && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-3.5 py-2 border border-mono-300 dark:border-mono-700 bg-mono-100 dark:bg-mono-900 hover:bg-mono-200 dark:hover:bg-mono-800 text-mono-900 dark:text-white text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Cancel Order
                </button>
              )}

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-mono-900 text-white dark:bg-white dark:text-black text-xs font-extrabold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>

          {/* Printable Enterprise Delivery Note Surface */}
          <div className="print-area print-card bg-white dark:bg-surface-cardDark border border-mono-200 dark:border-surface-borderDark rounded-2xl p-6 sm:p-10 shadow-lg space-y-8 animate-fade-up">
            {/* Header Identity */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-mono-200 dark:border-mono-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-mono-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-base tracking-tight text-mono-900 dark:text-white">
                    FUNDSROOM ERP LOGISTICS
                  </span>
                </div>
                <p className="text-xs text-mono-500 font-mono">Official Sales Delivery Note</p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="font-mono text-xl font-extrabold text-mono-900 dark:text-white block">
                  {challan.challanNumber}
                </span>
                <div className="flex items-center sm:justify-end gap-2">
                  <Badge status={challan.status} size="sm" />
                </div>
                <p className="text-xs font-mono text-mono-500 pt-1">
                  Issued Date: {new Date(challan.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl">
              <div>
                <h3 className="text-[10px] font-mono font-extrabold text-mono-500 uppercase tracking-widest mb-1.5">
                  DELIVERY RECIPIENT
                </h3>
                <p className="font-extrabold text-sm text-mono-900 dark:text-white">{challan.customer?.name}</p>
                <p className="text-xs font-mono text-mono-600 dark:text-mono-400">
                  {challan.customer?.businessName || challan.customer?.companyName || 'Individual Buyer'}
                </p>
                <p className="text-xs text-mono-500 mt-1">Mobile: {challan.customer?.mobile || challan.customer?.phone}</p>
                <p className="text-xs text-mono-500">Email: {challan.customer?.email}</p>
              </div>

              <div>
                <h3 className="text-[10px] font-mono font-extrabold text-mono-500 uppercase tracking-widest mb-1.5">
                  GST & DISPATCH METADATA
                </h3>
                <p className="text-xs font-mono text-mono-800 dark:text-mono-200">
                  GSTIN: {challan.customer?.gstNumber || 'NOT PROVIDED'}
                </p>
                <p className="text-xs font-mono text-mono-800 dark:text-mono-200">
                  Address: {challan.customer?.address || 'N/A'}
                </p>
                <p className="text-xs text-mono-500 mt-1">
                  Transport Notes: {challan.notes || 'None'}
                </p>
              </div>
            </div>

            {/* Snapshot Line Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-extrabold text-mono-500 uppercase tracking-wider">
                ITEMIZED DELIVERED PRODUCTS
              </h3>
              <div className="overflow-x-auto border border-mono-200 dark:border-mono-800 rounded-xl">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-mono-100 dark:bg-mono-950 border-b border-mono-200 dark:border-mono-800 text-mono-600 dark:text-mono-400 font-mono uppercase text-[10px]">
                      <th className="p-3">ITEM DESCRIPTION</th>
                      <th className="p-3 font-mono">SKU</th>
                      <th className="p-3 font-mono text-right">UNIT PRICE</th>
                      <th className="p-3 font-mono text-right">QUANTITY</th>
                      <th className="p-3 font-mono text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mono-100 dark:divide-mono-900">
                    {challan.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-semibold text-mono-900 dark:text-white">
                          {item.productName || item.product?.name || 'Product'}
                        </td>
                        <td className="p-3 font-mono text-xs text-mono-500">
                          {item.productSku || item.product?.sku || 'N/A'}
                        </td>
                        <td className="p-3 font-mono text-right">
                          ₹{Number(item.unitPriceSnapshot || item.product?.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-mono font-bold text-right">{item.quantity}</td>
                        <td className="p-3 font-mono font-extrabold text-right text-mono-900 dark:text-white">
                          ₹{Number(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Value Bar */}
            <div className="flex justify-end pt-4 border-t border-mono-200 dark:border-mono-800">
              <div className="text-right">
                <span className="text-[10px] font-mono font-extrabold text-mono-500 uppercase tracking-widest block">
                  GRAND TOTAL VALUE
                </span>
                <span className="text-3xl font-extrabold font-mono text-mono-900 dark:text-white">
                  ₹{Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Signature Blocks for Print */}
            <div className="pt-12 grid grid-cols-2 gap-8 border-t border-mono-200 dark:border-mono-800 text-center font-mono text-xs">
              <div>
                <div className="border-b border-mono-300 dark:border-mono-700 mb-2 h-12" />
                <span className="text-mono-500">Authorized Signatory</span>
              </div>
              <div>
                <div className="border-b border-mono-300 dark:border-mono-700 mb-2 h-12" />
                <span className="text-mono-500">Customer Receiver Signature</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
