import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Customer, CustomerStatus, CustomerType, CustomerFollowUp } from '../types';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Clock,
  Send,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // New Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    customerType: 'RETAILER' as CustomerType,
    status: 'LEAD' as CustomerStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Selected Customer Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = `/customers?search=${encodeURIComponent(search)}`;
      if (typeFilter) query += `&customerType=${typeFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res: any = await api.get(query);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, statusFilter]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res: any = await api.post('/customers', newCustomer);
      if (res.success) {
        setIsModalOpen(false);
        setNewCustomer({
          name: '',
          companyName: '',
          email: '',
          phone: '',
          address: '',
          customerType: 'RETAILER',
          status: 'LEAD',
        });
        fetchCustomers();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer');
    }
  };

  const openCustomerDetail = async (cust: Customer) => {
    setSelectedCustomer(cust);
    try {
      const res: any = await api.get(`/customers/${cust.id}/follow-ups`);
      if (res.success) {
        setFollowUps(res.data);
      }
    } catch (err) {
      console.error('Failed to load followups:', err);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote || !newFollowUpDate) return;
    try {
      const res: any = await api.post(`/customers/${selectedCustomer.id}/follow-ups`, {
        note: newNote,
        followUpDate: new Date(newFollowUpDate).toISOString(),
        status: 'PENDING',
      });
      if (res.success) {
        setNewNote('');
        setNewFollowUpDate('');
        openCustomerDetail(selectedCustomer);
      }
    } catch (err) {
      console.error('Failed to add follow-up:', err);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      cell: (c: Customer) => (
        <div>
          <p className="font-bold text-slate-100">{c.name}</p>
          <p className="text-xs text-slate-400">{c.companyName || 'Individual'}</p>
        </div>
      ),
    },
    {
      header: 'Contact Information',
      cell: (c: Customer) => (
        <div className="space-y-0.5 text-xs text-slate-300">
          <p className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-blue-400" /> {c.phone}
          </p>
          {c.email && (
            <p className="flex items-center gap-1.5 text-slate-400">
              <Mail className="w-3 h-3 text-slate-400" /> {c.email}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Customer Tier',
      cell: (c: Customer) => <Badge status={c.customerType} />,
    },
    {
      header: 'Status',
      cell: (c: Customer) => <Badge status={c.status} />,
    },
    {
      header: 'Follow-ups',
      cell: (c: Customer) => (
        <span className="text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg text-slate-300">
          {c._count?.followUps || 0} Notes
        </span>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Customer CRM Directory" />

        <main className="p-8 space-y-6 flex-1">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Customer Database</h1>
              <p className="text-slate-400 text-sm">
                Manage accounts, buyer classifications, and follow-up interaction timelines
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Customer
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-lg">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by customer name, company, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Tiers (Type)</option>
                <option value="RETAILER">Retailer</option>
                <option value="WHOLESALER">Wholesaler</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="DIRECT">Direct Buyer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="LEAD">Lead</option>
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Customer Table */}
          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            emptyMessage="No customer records found. Click 'Add New Customer' to add your first buyer."
            onRowClick={(cust) => openCustomerDetail(cust)}
          />

          {/* New Customer Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Create New Customer Account"
          >
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Apex Logistics"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCustomer.companyName}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, companyName: e.target.value })
                    }
                    placeholder="Apex Trading Corp"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="sales@apex.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Building 4, Commercial Hub, Mumbai"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Customer Tier (Type)
                  </label>
                  <select
                    value={newCustomer.customerType}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, customerType: e.target.value as CustomerType })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  >
                    <option value="RETAILER">Retailer</option>
                    <option value="WHOLESALER">Wholesaler</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="DIRECT">Direct Buyer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newCustomer.status}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, status: e.target.value as CustomerStatus })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  >
                    <option value="LEAD">Lead</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/30"
                >
                  Create Account
                </button>
              </div>
            </form>
          </Modal>

          {/* Selected Customer Follow-up Timeline Drawer */}
          {selectedCustomer && (
            <Modal
              isOpen={!!selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
              title={`Customer Account: ${selectedCustomer.name}`}
              maxWidth="xl"
            >
              <div className="space-y-6">
                {/* Account Summary Banner */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Phone</span>
                    <span className="font-semibold text-slate-200">{selectedCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-200">
                      {selectedCustomer.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tier</span>
                    <Badge status={selectedCustomer.customerType} />
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status</span>
                    <Badge status={selectedCustomer.status} />
                  </div>
                </div>

                {/* Add Follow-up Note Form */}
                {canEdit && (
                  <form
                    onSubmit={handleAddFollowUp}
                    className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3"
                  >
                    <p className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-400" /> Log Follow-up Note
                    </p>

                    <div>
                      <textarea
                        required
                        rows={2}
                        placeholder="Write conversation details, quote updates, or customer feedback..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                          type="datetime-local"
                          required
                          value={newFollowUpDate}
                          onChange={(e) => setNewFollowUpDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Save Note
                      </button>
                    </div>
                  </form>
                )}

                {/* Follow-up Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Interaction Timeline ({followUps.length})
                  </h4>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {followUps.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        No follow-up notes logged yet.
                      </p>
                    ) : (
                      followUps.map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span className="font-semibold text-blue-400">
                              By {f.createdBy?.name || 'Sales Agent'}
                            </span>
                            <span>Target Date: {new Date(f.followUpDate).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed font-normal">{f.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </main>
      </div>
    </div>
  );
};
