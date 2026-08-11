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
  FileText,
  User,
  Building,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      const res: any = await api.patch(`/sales-challans/${challan.id}/confirm`);
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
    if (!window.confirm('Are you sure you want to cancel this Delivery Challan?')) return;
    setActionError(null);
    setActionSuccess(null);
    setProcessing(true);
    try {
      const res: any = await api.patch(`/sales-challans/${challan.id}/cancel`);
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
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <p className="text-slate-400">Sales Challan not found.</p>
          <button
            onClick={() => navigate('/sales-challans')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm"
          >
            Back to Challans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={`Delivery Note #${challan.challanNumber}`} />

        <main className="p-8 space-y-6 flex-1 max-w-4xl mx-auto w-full">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <button
              onClick={() => navigate('/sales-challans')}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Delivery List
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Delivery Note
              </button>

              {canConfirm && (
                <button
                  disabled={processing}
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {processing ? 'Processing...' : 'Confirm & Deduct Stock'}
                </button>
              )}

              {canCancel && (
                <button
                  disabled={processing}
                  onClick={handleCancel}
                  className="px-4 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {processing ? 'Processing...' : 'Cancel Challan'}
                </button>
              )}
            </div>
          </div>

          {actionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium flex items-center gap-2 print:hidden">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-2 print:hidden">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Printable Invoice Delivery Note Document Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none">
            {/* Delivery Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center text-sm print:hidden">
                    FE
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight print:text-black">
                    Fundsroom Wholesale Enterprise
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                  Official Goods Delivery Challan & Dispatch Audit Note
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-xl font-extrabold text-blue-400 print:text-black block">
                  {challan.challanNumber}
                </span>
                <div className="mt-2">
                  <Badge status={challan.status} />
                </div>
              </div>
            </div>

            {/* Meta Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 print:text-slate-600">
                  Consignee / Customer Details
                </span>
                <p className="font-bold text-slate-100 text-base print:text-black">
                  {challan.customer?.name}
                </p>
                <p className="text-xs text-slate-300 print:text-slate-700 mt-0.5">
                  {challan.customer?.companyName || 'Individual Business Account'}
                </p>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                  📞 {challan.customer?.phone} | ✉️ {challan.customer?.email || 'N/A'}
                </p>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                  📍 {challan.customer?.address}
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-right">
                <div>
                  <span className="text-slate-400 print:text-slate-600">Issue Date: </span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {new Date(challan.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-600">Issued By: </span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {challan.createdBy?.name || 'Sales Agent'} ({challan.createdBy?.email})
                  </span>
                </div>
                {challan.confirmedAt && (
                  <div>
                    <span className="text-slate-400 print:text-slate-600">Confirmed & Dispatched By: </span>
                    <span className="font-semibold text-emerald-400 print:text-emerald-700">
                      {challan.confirmedBy?.name || 'Warehouse Staff'} on{' '}
                      {new Date(challan.confirmedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dispatch Remarks */}
            {challan.notes && (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs print:bg-slate-50 print:border-slate-300">
                <span className="font-bold text-slate-400 uppercase mr-2">Remarks:</span>
                <span className="text-slate-200 print:text-black">{challan.notes}</span>
              </div>
            )}

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 print:text-black">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800 print:bg-slate-200 print:text-slate-800 print:border-slate-300">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU Code</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Snapshot Unit Price</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                  {challan.items?.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3.5 text-xs text-slate-400 print:text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-100 print:text-black">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-blue-400 print:text-slate-800">
                        {item.productSku}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-right text-slate-100 print:text-black">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-right text-slate-300 print:text-black">
                        ₹{Number(item.unitPriceSnapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-right text-emerald-400 print:text-black">
                        ₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-800 print:border-slate-400">
              <div className="text-right space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400 print:text-slate-600 block tracking-wider">
                  Total Delivery Value
                </span>
                <span className="font-mono text-3xl font-extrabold text-white print:text-black block">
                  ₹{Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Signatures for Print */}
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
