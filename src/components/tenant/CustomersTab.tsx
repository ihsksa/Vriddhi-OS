import React, { useState } from 'react';
import { Customer, RFMCustomerResult, Tenant } from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import { Users, Plus, Search, Filter, Phone, Mail, MapPin, X, ArrowUpRight } from 'lucide-react';

interface CustomersTabProps {
  tenant: Tenant;
  customers: Customer[];
  rfmList: RFMCustomerResult[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  tenant,
  customers,
  rfmList,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Customer form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Gujarat');

  const rfmMap = new Map(rfmList.map((r) => [r.customerId, r]));

  const segments = Array.from(new Set(rfmList.map((r) => r.rfmSegment)));

  const filteredCustomers = customers.filter((c) => {
    const rfm = rfmMap.get(c.id);
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());

    const matchesSegment = segmentFilter === 'all' || rfm?.rfmSegment === segmentFilter;

    return matchesSearch && matchesSegment;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      tenantId: tenant.id,
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      city: city || 'Mumbai',
      state,
      customerSince: new Date().toISOString().split('T')[0],
    };

    onSaveCustomer(newCust);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
            Customer Cohorts & Deterministic RFM Matrix
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Recency, Frequency, and Monetary mathematical scoring. Predicts churn risk and deterministic Lifetime Value (LTV).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Segment Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Total Client Base
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-950">{customers.length}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Across Indian cities</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Champions & Loyalists
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">
            {rfmList.filter((r) => r.rfmSegment === 'Champions' || r.rfmSegment === 'Loyal Customers').length}
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">High repeat order cadence</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            At Risk / Churning
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-950">
            {rfmList.filter((r) => r.rfmSegment === 'At Risk' || r.rfmSegment === 'Need Attention').length}
          </div>
          <p className="text-[10px] text-amber-700 mt-0.5">High recency decay gap</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Average LTV
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-950">
            {formatINR(
              rfmList.length > 0
                ? rfmList.reduce((sum, r) => sum + r.predictedLTV, 0) / rfmList.length
                : 0,
              true
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">3-Year Projected Value</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-hidden focus:border-emerald-600"
          >
            <option value="all">All RFM Cohorts</option>
            {segments.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white border border-emerald-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-50/40 text-emerald-900 border-b border-emerald-100">
                <th className="py-3 px-4 font-semibold">Customer & Contact</th>
                <th className="py-3 px-4 font-semibold">City / Location</th>
                <th className="py-3 px-4 font-semibold">Orders Count</th>
                <th className="py-3 px-4 font-semibold">Total Spend (₹)</th>
                <th className="py-3 px-4 font-semibold">RFM Scores (R-F-M)</th>
                <th className="py-3 px-4 font-semibold">Cohort Segment</th>
                <th className="py-3 px-4 font-semibold">Predicted LTV</th>
                <th className="py-3 px-4 font-semibold">Churn Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No customers found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const rfm = rfmMap.get(c.id);
                  const isChamp = rfm?.rfmSegment === 'Champions';
                  const isLoyal = rfm?.rfmSegment === 'Loyal Customers';
                  const isRisk = rfm?.rfmSegment === 'At Risk';
                  const isAttention = rfm?.rfmSegment === 'Need Attention';

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-700" />
                            {c.phone}
                          </span>
                          <span>&bull;</span>
                          <span>{c.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{c.city}</div>
                        <div className="text-[10px] text-gray-400">{c.state}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        {rfm?.frequencyCount ?? 0} orders
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {formatINR(rfm?.monetaryTotal ?? 0)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="bg-emerald-50 px-2 py-0.5 rounded text-emerald-900 font-bold border border-emerald-200">
                          {rfm?.rScore ?? 1}-{rfm?.fScore ?? 1}-{rfm?.mScore ?? 1}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Recency: {rfm?.recencyDays ?? 0}d ago
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isChamp
                              ? 'bg-emerald-100 text-emerald-900'
                              : isLoyal
                              ? 'bg-teal-100 text-teal-900'
                              : isRisk
                              ? 'bg-red-100 text-red-900'
                              : isAttention
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rfm?.rfmSegment || 'Recent'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-950">
                        {formatINR(rfm?.predictedLTV ?? 0, true)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              style={{ width: `${rfm?.churnRiskPercent ?? 10}%` }}
                              className={`h-full ${
                                (rfm?.churnRiskPercent ?? 0) > 60
                                  ? 'bg-red-500'
                                  : (rfm?.churnRiskPercent ?? 0) > 30
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              (rfm?.churnRiskPercent ?? 0) > 60 ? 'text-red-700' : 'text-gray-700'
                            }`}
                          >
                            {rfm?.churnRiskPercent ?? 5}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-emerald-950">Add Business Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Customer / Enterprise Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Sweets & Dryfruits"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@business.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Surat"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Gujarat"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
