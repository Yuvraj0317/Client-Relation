import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SalesChallan } from '../types';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const canConfirm =
    (user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'WAREHOUSE') &&
    challan?.status === 'DRAFT';

  const canCancel =
    (user?.role === 'ADMIN' || user?.role === 'ACCOUNTS') &&
    challan?.status !== 'CANCELLED';

  const fetchChallan = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/sales-challans/${id}`);
      if (res.success) {
        setChallan(res.data);
      }
    } catch (err) {
      console.error('Error fetching challan details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!challan) return;
    setActionError(null);
    setActionSuccess(null);
    setProcessing(true);
    try {
      const res: any = await api.post(`/sales-challans/${challan.id}/confirm`);
      if (res.success) {
        setActionSuccess('Dispatch confirmed successfully! Inventory stock deducted.');
        fetchChallan();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm dispatch');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (!window.confirm('Are you sure you want to cancel this Delivery Order?')) return;
    setActionError(null);
    setActionSuccess(null);
    setProcessing(true);
    try {
      const res: any = await api.post(`/sales-challans/${challan.id}/cancel`);
      if (res.success) {
        setActionSuccess(
          challan.status === 'CONFIRMED'
            ? 'Challan cancelled. Deducted product stock has been restored to inventory.'
            : 'Challan cancelled.'
        );
        fetchChallan();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel challan');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-ocean-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <p className="text-slate-500 dark:text-slate-400">Sales Delivery Challan not found.</p>
          <button
            onClick={() => navigate('/sales-challans')}
            className="mt-4 px-4 py-2 bg-ocean-600 text-white font-semibold rounded-lg text-sm"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={`Delivery Order #${challan.challanNumber}`} onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-4xl mx-auto w-full print-area">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <button
              onClick={() => navigate('/sales-challans')}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Orders Directory
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Delivery Note
              </button>

              {canConfirm && (
                <button
                  disabled={processing}
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {processing ? 'Processing...' : 'Confirm & Deduct Stock'}
                </button>
              )}

              {canCancel && (
                <button
                  disabled={processing}
                  onClick={handleCancel}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {processing ? 'Processing...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {actionError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-400 text-xs sm:text-sm font-medium flex items-center gap-2 no-print">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2 no-print">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Printable Invoice Delivery Note Document Card */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 print-card transition-colors duration-200">
            {/* Delivery Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-ocean-600 text-white rounded-lg font-bold flex items-center justify-center text-xs no-print">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white print:text-black">
                    Fundsroom Enterprise Wholesale
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 print:text-slate-600">
                  Official Delivery Challan & Dispatch Note
                </p>
              </div>

              <div className="sm:text-right">
                <span className="font-mono text-xl font-extrabold text-ocean-600 dark:text-ocean-400 print:text-black block">
                  {challan.challanNumber}
                </span>
                <div className="mt-2">
                  <Badge status={challan.status} />
                </div>
              </div>
            </div>

            {/* Meta Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div>
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 print:text-slate-600">
                  Consignee / Customer Details
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base print:text-black">
                  {challan.customer?.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-700 mt-0.5">
                  {challan.customer?.businessName || challan.customer?.companyName || 'Individual Business Account'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                  📞 {challan.customer?.phone} | ✉️ {challan.customer?.email || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                  📍 {challan.customer?.address}
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-right">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Issue Timestamp: </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 print:text-black">
                    {new Date(challan.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Issued By: </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 print:text-black">
                    {challan.createdBy?.name || 'Sales Agent'} ({challan.createdBy?.email})
                  </span>
                </div>
                {challan.confirmedAt && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Dispatched By: </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
                      {challan.confirmedBy?.name || 'Warehouse Staff'} on{' '}
                      {new Date(challan.confirmedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dispatch Remarks */}
            {challan.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs print:bg-slate-50 print:border-slate-300">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase mr-2">Dispatch Remarks:</span>
                <span className="text-slate-800 dark:text-slate-200 print:text-black">{challan.notes}</span>
              </div>
            )}

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-800 dark:text-slate-200 print:text-black">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800 print:bg-slate-200 print:text-slate-800 print:border-slate-300">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Product Item Name</th>
                    <th className="px-4 py-3">SKU Code</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Snapshot Unit Price</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 print:divide-slate-300">
                  {challan.items?.map((item: any, idx: number) => {
                    const unitPrice = item.unitPriceSnapshot ?? item.unitPrice ?? 0;
                    const lineTotal = item.lineTotal ?? (unitPrice * item.quantity);

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100 print:text-black">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-ocean-600 dark:text-ocean-400 print:text-slate-800">
                          {item.productSku || item.sku}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-right text-slate-900 dark:text-slate-100 print:text-black">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-right text-slate-700 dark:text-slate-300 print:text-black">
                          ₹{Number(unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 print:text-black">
                          ₹{Number(lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800 print:border-slate-400">
              <div className="text-right space-y-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 print:text-slate-600 block tracking-wider">
                  Total Delivery Value
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white print:text-black block">
                  ₹{Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Signatures for Print View Only */}
            <div className="hidden print:grid grid-cols-2 gap-8 pt-16 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-2 font-semibold">
                  Authorized Dispatch Signatory
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-2 font-semibold">
                  Receiver / Consignee Signature & Stamp
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
