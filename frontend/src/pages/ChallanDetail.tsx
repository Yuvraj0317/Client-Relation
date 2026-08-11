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
  Building,
  Calendar,
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

  const fetchChallanDetail = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/sales-challans/${id}`);
      if (res.success) {
        setChallan(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery challan document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallanDetail();
  }, [id]);

  const handleConfirmChallan = async () => {
    if (!id || !challan) return;
    if (!window.confirm(`Are you sure you want to CONFIRM dispatch for Challan #${challan.challanNumber}? This will deduct inventory balance.`)) return;

    setActionLoading(true);
    setError(null);
    try {
      const res: any = await api.post(`/sales-challans/${id}/confirm`);
      if (res.success) {
        fetchChallanDetail();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm delivery dispatch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelChallan = async () => {
    if (!id || !challan) return;
    if (!window.confirm(`Are you sure you want to CANCEL Challan #${challan.challanNumber}?`)) return;

    setActionLoading(true);
    setError(null);
    try {
      const res: any = await api.post(`/sales-challans/${id}/cancel`);
      if (res.success) {
        fetchChallanDetail();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel delivery challan');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar title="Delivery Document" />
          <main className="p-8 text-center text-xs font-mono text-slate-500">
            Loading delivery note document...
          </main>
        </div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar title="Delivery Document" />
          <main className="p-8 text-center text-xs font-mono text-slate-500 space-y-4">
            <p>{error || 'Challan record not found.'}</p>
            <button
              onClick={() => navigate('/sales-challans')}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Back to Dispatches
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={`Challan #${challan.challanNumber}`} onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-4xl mx-auto w-full">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print animate-fade-up">
            <button
              onClick={() => navigate('/sales-challans')}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dispatches
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-mono font-bold rounded-xl shadow-sm hover:opacity-90 transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Delivery Note
              </button>

              {challan.status === 'DRAFT' && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={handleConfirmChallan}
                    className="px-3.5 py-2 bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-extrabold rounded-xl shadow-md shadow-apple-blue/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm Dispatch
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={handleCancelChallan}
                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-900 dark:text-white text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold no-print">
              {error}
            </div>
          )}

          {/* Printable Delivery Document Canvas */}
          <div className="print-area print-card bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-6 sm:p-10 shadow-lg space-y-8 animate-fade-up">
            {/* Header Document Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-6 h-6 text-apple-blue" />
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">FUNDSROOM</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">DELIVERY CHALLAN & DISPATCH NOTE</p>
                <p className="text-[10px] text-slate-400 font-mono">Original for Consignee / Transport Copy</p>
              </div>

              <div className="text-left sm:text-right space-y-1 font-mono">
                <div className="inline-block mb-1">
                  <Badge status={challan.status} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{challan.challanNumber}</h2>
                <p className="text-xs text-slate-500 flex items-center sm:justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date: {new Date(challan.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Consignee / Customer Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  CONSIGNEE / DELIVER TO:
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {challan.customer?.name}
                </p>
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" /> {challan.customer?.businessName || challan.customer?.companyName || 'Individual Buyer'}
                </p>
                <p className="text-slate-500">GSTIN: {challan.customer?.gstNumber || 'Unregistered'}</p>
                <p className="text-slate-500">Phone: {challan.customer?.mobile || challan.customer?.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  DISPATCH DETAILS:
                </span>
                <p className="text-slate-600 dark:text-slate-400">Address: {challan.customer?.address || 'N/A'}</p>
                <p className="text-slate-500">Dispatch Status: <span className="font-extrabold text-slate-900 dark:text-white">{challan.status}</span></p>
                <p className="text-slate-500">Remarks: {challan.notes || 'Routine sales dispatch'}</p>
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">PRODUCT / SKU</th>
                    <th className="p-3 text-center">QUANTITY</th>
                    <th className="p-3 text-right">UNIT PRICE</th>
                    <th className="p-3 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono">
                  {challan.items?.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-sans">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {item.productName || item.product?.name || 'Product'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          SKU: {item.productSku || item.product?.sku || 'N/A'}
                        </p>
                      </td>
                      <td className="p-3 text-center font-extrabold text-slate-900 dark:text-white">
                        {item.quantity} Units
                      </td>
                      <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                        ₹{Number(item.unitPriceSnapshot || item.product?.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹{Number(item.lineTotal || item.quantity * Number(item.unitPriceSnapshot || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Document Totals & Signatures */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 font-mono">
              <div className="text-xs text-slate-500 space-y-8">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Terms & Conditions:</p>
                  <p className="text-[10px]">1. Goods once dispatched cannot be returned without authorization.</p>
                  <p className="text-[10px]">2. Discrepancies must be notified within 24 hours of receipt.</p>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 w-48 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Receiver Signature</p>
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Total Quantity:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {challan.items?.reduce((acc, curr) => acc + curr.quantity, 0)} Units
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Grand Total:</span>
                    <span>₹{Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized Signatory</p>
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">Fundsroom ERP Operations</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
