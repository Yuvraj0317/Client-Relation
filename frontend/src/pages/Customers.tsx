import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import api from '../services/api';
import { Customer, CustomerFollowUp, CustomerType } from '../types';
import {
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  X,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // New Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    gstNumber: '',
    address: '',
    customerType: 'RETAILER' as CustomerType,
  });

  // Slide-over Timeline Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingFollowUp, setAddingFollowUp] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = '/customers?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res: any = await api.get(url);
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res: any = await api.post('/customers', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.phone,
        businessName: formData.businessName,
        gstin: formData.gstNumber,
        address: formData.address,
        tier: formData.customerType,
      });
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          businessName: '',
          gstNumber: '',
          address: '',
          customerType: 'RETAILER',
        });
        fetchCustomers();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer record');
    } finally {
      setSubmitting(false);
    }
  };

  const openFollowUpDrawer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingFollowUps(true);
    try {
      const res: any = await api.get(`/customers/${customer.id}/followups`);
      if (res.success) {
        setFollowUps(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setLoadingFollowUps(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote.trim()) return;
    setAddingFollowUp(true);
    try {
      const res: any = await api.post(`/customers/${selectedCustomer.id}/followups`, {
        notes: newNote,
      });
      if (res.success) {
        setNewNote('');
        openFollowUpDrawer(selectedCustomer);
      }
    } catch (err) {
      console.error('Error adding follow-up note:', err);
    } finally {
      setAddingFollowUp(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (tierFilter === 'ALL') return true;
    return c.customerType === tierFilter;
  });

  const columns = [
    {
      header: 'NAME / BUSINESS',
      cell: (c: Customer) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
          <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Building className="w-3 h-3" /> {c.businessName || c.companyName || 'Individual Buyer'}
          </p>
        </div>
      ),
    },
    {
      header: 'CONTACT',
      cell: (c: Customer) => (
        <div className="space-y-0.5 font-mono text-xs">
          <p className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
            <Phone className="w-3 h-3 text-slate-500" /> {c.mobile || c.phone}
          </p>
          <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Mail className="w-3 h-3" /> {c.email}
          </p>
        </div>
      ),
    },
    {
      header: 'TYPE',
      cell: (c: Customer) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700">
          {c.customerType || 'RETAILER'}
        </span>
      ),
    },
    {
      header: 'ADDRESS',
      cell: (c: Customer) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-xs">
          <MapPin className="w-3 h-3 text-slate-400" /> {c.address || 'N/A'}
        </span>
      ),
    },
    {
      header: 'STATUS',
      cell: (c: Customer) => <Badge status={c.status || 'ACTIVE'} size="sm" />,
    },
    {
      header: 'ACTIONS',
      cell: (c: Customer) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openFollowUpDrawer(c);
          }}
          className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 transition flex items-center gap-1"
        >
          <MessageSquare className="w-3 h-3" /> Timeline
        </button>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-white font-sans transition-colors duration-200">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Customer Directory" onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Customer Directory
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage customer relationships, accounts, and interaction follow-ups.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-apple-blue hover:bg-apple-blueHover text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-apple-blue/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Customer Account
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-surface-cardDark border border-slate-200 dark:border-surface-borderDark rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, business, mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-apple-blue transition"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
              {['ALL', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    tierFilter === tier
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Customers Data Workspace */}
          <div className="animate-fade-up">
            <DataTable
              columns={columns}
              data={filteredCustomers}
              loading={loading}
              emptyMessage="No customer accounts found matching your query."
              onRowClick={(c) => openFollowUpDrawer(c)}
            />
          </div>
        </main>
      </div>

      {/* New Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer Account"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                required
                placeholder="Apex Global"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                Business Name
              </label>
              <input
                type="text"
                placeholder="Apex Logistics Ltd"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                Mobile / Phone *
              </label>
              <input
                type="text"
                required
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="contact@apex.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                GSTIN
              </label>
              <input
                type="text"
                placeholder="27AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-500 uppercase mb-1">
                Customer Type
              </label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition font-mono"
              >
                <option value="RETAILER">RETAILER</option>
                <option value="WHOLESALER">WHOLESALER</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                <option value="DIRECT">DIRECT</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-extrabold rounded-xl shadow-md shadow-apple-blue/20 transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Slide-over Follow-up Timeline Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-cardDark border-l border-slate-200 dark:border-surface-borderDark h-full z-10 p-6 flex flex-col justify-between shadow-2xl animate-fade-up">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</h2>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.businessName || 'Individual Buyer'}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Follow-up Notes Timeline List */}
              <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Timeline History ({followUps.length})
                </h3>
                {loadingFollowUps ? (
                  <p className="text-xs text-slate-500 font-mono py-4 text-center">Loading interactions...</p>
                ) : followUps.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-4 text-center">No recorded follow-up interactions.</p>
                ) : (
                  followUps.map((f) => (
                    <div key={f.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <p className="text-xs text-slate-900 dark:text-slate-200">{f.note}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                        <span>By: {f.createdBy?.name || 'System User'}</span>
                        <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Follow-up Form */}
            <form onSubmit={handleAddFollowUp} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <textarea
                rows={2}
                required
                placeholder="Log interaction note or follow-up status..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-apple-blue transition"
              />
              <button
                type="submit"
                disabled={addingFollowUp}
                className="w-full py-2.5 bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-apple-blue/20 disabled:opacity-50"
              >
                {addingFollowUp ? 'Logging...' : 'Log Interaction Note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
