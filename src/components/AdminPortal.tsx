import React, { useState } from 'react';
import { Tenant, SubscriptionTier, TenantStatus } from '../types';
import { StorageService, PLAN_PRICING } from '../services/storageService';
import { AuthService } from '../services/authService';
import { formatINR } from '../utils/analyticsMath';
import { exportAdminPlatformDataCSV, exportAdminPlatformDataPDF } from '../utils/reportExporter';
import { supabaseService } from '../services/supabaseClient';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  CreditCard,
  Building,
  Check,
  X,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  Calendar,
  Database,
  Server,
  Copy,
  Lock,
  Eye,
  EyeOff,
  Cloud,
  Layers,
  Activity,
  Cpu,
  FileCode,
} from 'lucide-react';

interface AdminPortalProps {
  onSelectTenantCell: (tenantId: string) => void;
  onRefresh: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onSelectTenantCell,
  onRefresh,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => StorageService.getTenants());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_approval' | 'suspended'>('all');
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Edit Tenant State
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionTier>('pro');
  const [editStatus, setEditStatus] = useState<TenantStatus>('active');
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');
  const [editBizName, setEditBizName] = useState<string>('');
  const [editOwnerName, setEditOwnerName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');

  // Form for manual merchant creation (Zero GSTIN)
  const [newBizName, setNewBizName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Maharashtra');
  const [newPlan, setNewPlan] = useState<SubscriptionTier>('trial');

  // Navigation View: 'tenants' (Directory & Subscriptions) vs 'hosting' (Cloud Infrastructure & Supabase Collections)
  const [adminView, setAdminView] = useState<'tenants' | 'hosting'>('tenants');

  // Supabase Platform Hosting State
  const [supabaseConfig, setSupabaseConfig] = useState(() => supabaseService.getConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => supabaseService.getConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => supabaseService.getConfig().anonKey);
  const [showKey, setShowKey] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [cloudStats, setCloudStats] = useState<{ isConnected: boolean; tenantCount: number; productCount: number; customerCount: number; orderCount: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  const loadCloudStats = async () => {
    const stats = await supabaseService.getStats();
    setCloudStats(stats);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    const res = await supabaseService.testConnection(supabaseUrlInput.trim(), supabaseKeyInput.trim());
    setIsTestingConn(false);
    setSupabaseConfig(supabaseService.getConfig());
    if (res.success) {
      loadCloudStats();
    }
    setActionNotice(res.message);
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleSaveSupabaseConfig = async () => {
    supabaseService.saveConfig({
      url: supabaseUrlInput.trim(),
      anonKey: supabaseKeyInput.trim(),
    });
    setSupabaseConfig(supabaseService.getConfig());
    await handleTestConnection();
  };

  const handleSyncAllToSupabase = async () => {
    setIsSyncingAll(true);
    const result = await StorageService.syncAllPlatformToSupabase();
    setIsSyncingAll(false);
    if (result.success) {
      loadCloudStats();
    }
    setActionNotice(result.message);
    setTimeout(() => setActionNotice(null), 7000);
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    const result = await StorageService.rehydrateFromSupabase();
    setIsPulling(false);
    if (result.success) {
      refreshData();
      loadCloudStats();
    }
    setActionNotice(result.message);
    setTimeout(() => setActionNotice(null), 7000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseService.getSqlMigrationScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const refreshData = () => {
    const list = StorageService.getTenants();
    setTenants(list);
    onRefresh();
  };

  const handleApprove = (tenantId: string, bizName: string) => {
    StorageService.approveTenantSubscription(tenantId);
    setActionNotice(`Approved and activated subscription for "${bizName}".`);
    refreshData();
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = (tenantId: string, bizName: string) => {
    const reason = prompt('Please enter the reason for rejection:', 'Payment UTR verification pending or mismatched');
    if (reason) {
      StorageService.rejectTenantSubscription(tenantId, reason);
      setActionNotice(`Suspended subscription for "${bizName}".`);
      refreshData();
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleDeleteTenant = (tenantId: string, bizName: string) => {
    if (confirm(`Are you sure you want to permanently remove tenant "${bizName}" (${tenantId}) and all their isolated database records?`)) {
      StorageService.deleteTenant(tenantId);
      setActionNotice(`Tenant "${bizName}" deleted successfully.`);
      refreshData();
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setEditPlan(t.subscription.plan);
    setEditStatus(t.subscription.status);
    setEditExpiryDate(t.subscription.expiresAt.split('T')[0]);
    setEditBizName(t.businessName);
    setEditOwnerName(t.ownerName);
    setEditPhone(t.phone);
    setEditCity(t.city);
  };

  // When plan changes in Edit modal, automatically update expiry date (adds 30 days)
  const handlePlanChangeInEdit = (newPlanChoice: SubscriptionTier) => {
    setEditPlan(newPlanChoice);
    const autoNewExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setEditExpiryDate(autoNewExpiry);
  };

  const handleSaveEditTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    StorageService.editTenantSubscription(editingTenant.id, {
      plan: editPlan,
      status: editStatus,
      customExpiryDate: editExpiryDate ? new Date(editExpiryDate).toISOString() : undefined,
      businessName: editBizName,
      ownerName: editOwnerName,
      phone: editPhone,
      city: editCity,
    });

    setEditingTenant(null);
    setActionNotice(`Tenant "${editBizName}" subscription updated. Expiry set to ${editExpiryDate}.`);
    refreshData();
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName || !newOwnerName || !newEmail) return;

    const createdTenant = StorageService.createTenant({
      businessName: newBizName,
      ownerName: newOwnerName,
      email: newEmail,
      phone: newPhone || '+91 98000 00000',
      city: newCity || 'Mumbai',
      state: newState,
      industry: 'Wholesale & Retail Trade',
      plan: newPlan,
      upiTxnRef: `ADMIN-PROVISION-${Date.now().toString().slice(-6)}`,
    });

    // Register user account in AuthService
    const users = AuthService.getUsers();
    users.push({
      id: `usr_${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      passwordHash: 'welcome123',
      name: newOwnerName,
      role: 'business_owner',
      tenantId: createdTenant.id,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('vridhi_users_registry_v3', JSON.stringify(users));

    setShowAddTenantModal(false);
    setNewBizName('');
    setNewOwnerName('');
    setNewEmail('');
    setNewPhone('');
    setNewCity('');
    setActionNotice(`New tenant cell created. Merchant credentials generated.`);
    refreshData();
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleDownloadAdminData = () => {
    exportAdminPlatformDataCSV(tenants);
    setActionNotice('Platform administrative ledger CSV downloaded successfully.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDownloadAdminPDF = () => {
    exportAdminPlatformDataPDF(tenants);
    setActionNotice('Platform administrative audit PDF generated & downloaded (Zero Codex).');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Calculations for Admin KPIs
  const totalTenantsCount = tenants.length;
  const activeTenants = tenants.filter((t) => t.subscription.status === 'active');
  const pendingApprovals = tenants.filter((t) => t.subscription.status === 'pending_approval');
  const totalMRR = activeTenants.reduce((sum, t) => sum + (t.subscription.amountMonthly || 0), 0);
  const totalProductsAcrossCells = tenants.reduce((sum, t) => sum + StorageService.getTenantProducts(t.id).length, 0);
  const totalCustomersAcrossCells = tenants.reduce((sum, t) => sum + StorageService.getTenantCustomers(t.id).length, 0);
  const totalOrdersAcrossCells = tenants.reduce((sum, t) => sum + StorageService.getTenantOrders(t.id).length, 0);

  // Filtered tenants list
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.subscription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Master Super Admin & Platform Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Platform Tenant Management</h1>
          <p className="text-xs text-gray-600 mt-1">
            Audit monthly UPI subscriptions, modify plans, update expiry cycles, and govern platform recurring revenue.
          </p>
        </div>

        {/* Admin Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadAdminPDF}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-800 text-white px-3.5 py-2 text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
            title="Generate and download complete administrative audit report in PDF format (Pure client-side, Zero Codex)"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Download Audit PDF</span>
          </button>

          <button
            onClick={handleDownloadAdminData}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition shadow-2xs"
            title="Download complete administrative data of all tenants & subscriptions in CSV format"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Download CSV Ledger</span>
          </button>

          <button
            onClick={() => setShowAddTenantModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Tenant Cell</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setAdminView('tenants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminView === 'tenants'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-emerald-950 hover:bg-emerald-50 border border-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Tenant Cells & Subscriptions ({totalTenantsCount})</span>
        </button>

        <button
          onClick={() => {
            setAdminView('hosting');
            loadCloudStats();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminView === 'hosting'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-emerald-950 hover:bg-emerald-50 border border-gray-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase Cloud Hosting Engine</span>
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </button>
      </div>

      {adminView === 'tenants' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold uppercase tracking-wider">
            <span>Monthly Recurring Revenue (MRR)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">₹</div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-950">{formatINR(totalMRR, true)}</div>
          <p className="mt-1 text-[11px] text-gray-500">From {activeTenants.length} active paying businesses</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold uppercase tracking-wider">
            <span>Active Tenant Cells</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-950">{activeTenants.length}</div>
          <p className="mt-1 text-[11px] text-gray-500">Total registered: {totalTenantsCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold uppercase tracking-wider">
            <span>Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-950">{pendingApprovals.length}</div>
          <p className="mt-1 text-[11px] text-amber-700/90">Awaiting manual admin activation</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold uppercase tracking-wider">
            <span>Average Revenue / Merchant</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-950">
            {formatINR(activeTenants.length > 0 ? totalMRR / activeTenants.length : 0, true)}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">ARPU per active cell</p>
        </div>
      </div>

      {/* Pending Approvals Queue */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-2xl bg-white border border-amber-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <h2 className="text-sm font-bold text-amber-950">
                Action Required: Pending UPI Subscription Onboarding ({pendingApprovals.length})
              </h2>
            </div>
            <span className="text-[11px] text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-medium">
              Manual Onboarding Verification
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {pendingApprovals.map((t) => (
              <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">{t.businessName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium capitalize">
                      {t.subscription.plan} Tier ({formatINR(t.subscription.amountMonthly, true)}/mo)
                    </span>
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Cell: {t.id}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-3 flex-wrap">
                    <span>Owner: <strong>{t.ownerName}</strong> ({t.phone})</span>
                    <span>&bull;</span>
                    <span>City: {t.city}, {t.state}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-amber-900 text-xs border border-amber-200/60 font-mono">
                    <CreditCard className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      Submitted UPI UTR / Ref: <strong>{t.subscription.lastUpiTransactionRef || 'N/A'}</strong>
                    </span>
                    {t.subscription.paymentSubmittedAt && (
                      <span className="text-[11px] text-gray-500 ml-auto">
                        {new Date(t.subscription.paymentSubmittedAt).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => handleReject(t.id, t.businessName)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-100 text-xs font-semibold transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(t.id, t.businessName)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Activate Cell</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenants Registry & Management Table */}
      <div className="rounded-2xl bg-white border border-emerald-100 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-emerald-950">Merchant Tenants Directory</h2>
            <p className="text-xs text-gray-500">Directly manage status, edit plans with auto-updating expiry, or inspect isolated cells.</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search business, owner, cell..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-hidden focus:border-emerald-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-50/40 text-emerald-900 border-b border-emerald-100">
                <th className="py-3 px-4 font-semibold">Tenant Cell</th>
                <th className="py-3 px-4 font-semibold">Business / Owner</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Monthly Plan</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Expiry / Renewal Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Building className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <div>No registered business tenants yet.</div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      New sign-ups will appear here automatically for manual verification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isActive = t.subscription.status === 'active';
                  const isPending = t.subscription.status === 'pending_approval';

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-mono font-medium text-emerald-900">
                        {t.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{t.businessName}</div>
                        <div className="text-[11px] text-gray-500">{t.ownerName} &bull; {t.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{t.city}, {t.state}</div>
                        <div className="text-[10px] text-gray-400">{t.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-medium text-gray-900">{t.subscription.plan}</span>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          {formatINR(t.subscription.amountMonthly, true)}/mo
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-600' : isPending ? 'bg-amber-600' : 'bg-red-600'
                            }`}
                          />
                          {isActive ? 'Active' : isPending ? 'Pending Approval' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {new Date(t.subscription.expiresAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Tenant Button */}
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium transition"
                            title="Edit Plan, Status & Expiry Date"
                          >
                            <Edit className="w-3 h-3 text-emerald-700" />
                            <span>Edit</span>
                          </button>

                          {/* Inspect Cell */}
                          <button
                            onClick={() => onSelectTenantCell(t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium transition"
                            title="Inspect Isolated Tenant Cell View"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {/* Delete Tenant */}
                          <button
                            onClick={() => handleDeleteTenant(t.id, t.businessName)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-700 hover:bg-red-50"
                            title="Delete Tenant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </>
  ) : (
    /* CLOUD HOSTING & SUPABASE COLLECTIONS INFRASTRUCTURE CONTROL CENTER */
    <div className="space-y-6">
      {/* Hosting Architecture Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>Central Platform Database Infrastructure</span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  supabaseConfig.isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{supabaseConfig.isConnected ? 'Cloud Host Connected' : 'Ready to Connect'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Multi-Tenant Supabase Cloud Hosting Engine
            </h2>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Engineered on PostgreSQL 15 with strict Row Level Security (RLS). Every merchant tenant is allocated an isolated cell partitioned by <code className="bg-emerald-800/80 px-1.5 py-0.5 rounded text-emerald-200">tenant_id</code>. Zero cross-tenant data leaks, automated background replication, and pure client-side deterministic execution.
            </p>
          </div>

          {/* Master Hosting Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={handleSyncAllToSupabase}
              disabled={isSyncingAll}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 text-emerald-950 font-bold px-5 py-2.5 text-xs shadow-sm hover:bg-emerald-300 active:scale-95 transition disabled:opacity-50"
              title="Replicate all platform tenants, products, customers, and orders to Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Replicating Data...' : 'Sync Everything to Supabase'}</span>
            </button>

            <button
              onClick={handlePullFromSupabase}
              disabled={isPulling}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-900/60 text-emerald-100 font-semibold px-4 py-2 text-xs hover:bg-emerald-800/80 transition disabled:opacity-50"
              title="Pull latest remote tenant cells from Supabase"
            >
              <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Pulling Remote State...' : 'Pull & Rehydrate from Cloud'}</span>
            </button>

            <button
              onClick={handleCopySql}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-900/40 text-emerald-200 font-semibold px-4 py-2 text-xs hover:bg-emerald-800/50 transition"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-300" />
              <span>{copiedSql ? 'Copied Migration SQL!' : 'Copy Multi-Tenant SQL Schema'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Credentials & Connection Settings */}
      <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-700" />
              <span>Supabase Host Connection Settings</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure your platform's central Supabase instance URL and public Anon Key.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConfig.isConnected ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
              <span>{supabaseConfig.isConnected ? 'Verified Connection' : 'Not Connected'}</span>
            </span>
            {supabaseConfig.lastTestedAt && (
              <span className="text-[11px] text-gray-400 font-mono">
                Last tested: {new Date(supabaseConfig.lastTestedAt).toLocaleTimeString('en-IN')}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Supabase Project URL *
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrlInput}
              onChange={(e) => setSupabaseUrlInput(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Find under Supabase Project Settings &rarr; API &rarr; Project URL
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Project Anon / Public API Key *
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-3 pr-10 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showKey ? 'Hide Key' : 'Show Key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Safe public client key. Row Level Security policies enforce multi-tenant isolation.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5 pt-4 border-t border-gray-100 flex-wrap">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 text-gray-500 ${isTestingConn ? 'animate-spin' : ''}`} />
            <span>{isTestingConn ? 'Testing Connection...' : 'Test Connection'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSupabaseConfig}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save & Connect Engine</span>
          </button>
        </div>
      </div>

      {/* Database Collections Overview (4 Core Multi-Tenant Tables) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-emerald-950">
              Hosted Multi-Tenant Database Collections
            </h3>
            <p className="text-xs text-gray-500">
              Live data collections synchronized with continuous background replication.
            </p>
          </div>
          <button
            onClick={loadCloudStats}
            className="flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-950 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Live Counts</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Collection 1: Tenants Registry */}
          <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  vridhi_tenants
                </span>
                <Building className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mt-2">Platform Tenants Registry</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Master directory, subscription tiers, ₹0 trial cycles, and tenant profiles.
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Local Cells: <strong>{totalTenantsCount}</strong></span>
              <span className="text-emerald-800 font-mono">
                Cloud: <strong>{cloudStats ? cloudStats.tenantCount : 'Ready'}</strong>
              </span>
            </div>
          </div>

          {/* Collection 2: Products Catalog */}
          <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  vridhi_products
                </span>
                <Layers className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mt-2">Tenant Inventory & EOQ</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Catalog SKUs, safety stock, lead times, Wilson EOQ batches, strictly keyed by tenant_id.
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Local SKUs: <strong>{totalProductsAcrossCells}</strong></span>
              <span className="text-emerald-800 font-mono">
                Cloud: <strong>{cloudStats ? cloudStats.productCount : 'Ready'}</strong>
              </span>
            </div>
          </div>

          {/* Collection 3: Customers Directory */}
          <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  vridhi_customers
                </span>
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mt-2">Customer CRM & RFM</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Customer contact details, RFM cohorts, and order history partitioned by tenant_id.
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Local Contacts: <strong>{totalCustomersAcrossCells}</strong></span>
              <span className="text-emerald-800 font-mono">
                Cloud: <strong>{cloudStats ? cloudStats.customerCount : 'Ready'}</strong>
              </span>
            </div>
          </div>

          {/* Collection 4: Sales Orders & Tax Invoices */}
          <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  vridhi_orders
                </span>
                <CreditCard className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-xs font-bold text-gray-900 mt-2">Sales & GST Tax Ledgers</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Invoice items, taxable subtotal, CGST, SGST, grand total, and payment modes.
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Local Orders: <strong>{totalOrdersAcrossCells}</strong></span>
              <span className="text-emerald-800 font-mono">
                Cloud: <strong>{cloudStats ? cloudStats.orderCount : 'Ready'}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hosting Architecture & Security Hardening (RLS Isolation) */}
      <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-emerald-950">
              Strict Multi-Tenant Row Level Security (RLS) Protocol
            </h3>
          </div>
          <button
            onClick={() => setShowSqlPreview(!showSqlPreview)}
            className="text-xs text-emerald-800 font-semibold hover:underline"
          >
            {showSqlPreview ? 'Hide SQL Script' : 'View SQL Migration Script'}
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Every query made by any merchant or tenant is constrained by Row Level Security in PostgreSQL. Even if a tenant knows another tenant's ID or attempts manual table queries, PostgreSQL rejects access at the database kernel layer:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="font-bold text-gray-900 block">1. Cell Partitioning</span>
            <span className="text-gray-500 text-[11px]">
              All tables enforce foreign keys to <code className="text-emerald-800">public.vridhi_tenants(id)</code> with cascade deletion.
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="font-bold text-gray-900 block">2. Zero Cross-Tenant Leaks</span>
            <span className="text-gray-500 text-[11px]">
              RLS policy <code className="text-emerald-800">Tenant Products Isolation</code> guarantees merchant isolation across all CRUD calls.
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="font-bold text-gray-900 block">3. Transparent Cloud Sync</span>
            <span className="text-gray-500 text-[11px]">
              StorageService mirrors saves/deletes directly to Supabase without annoying modal popups.
            </span>
          </div>
        </div>

        {showSqlPreview && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-gray-700 font-mono">
                supabase_multi_tenant_schema.sql
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Schema'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-gray-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-80 scrollbar-thin">
              {supabaseService.getSqlMigrationScript()}
            </pre>
          </div>
        )}
      </div>
    </div>
  )}

      {/* EDIT TENANT MODAL: Edits plan, status, and automatically recalculates expiry date */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-emerald-950">Edit Tenant Subscription & Status</h3>
                <p className="text-[11px] text-gray-500 font-mono">Cell: {editingTenant.id}</p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTenant} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Monthly Plan Tier *
                  </label>
                  <select
                    value={editPlan}
                    onChange={(e) => handlePlanChangeInEdit(e.target.value as SubscriptionTier)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-hidden font-semibold"
                  >
                    <option value="trial">₹0 Trial (1 Month)</option>
                    <option value="starter">Starter (₹999 / mo)</option>
                    <option value="pro">Pro / Growth (₹2,499 / mo)</option>
                    <option value="enterprise">Enterprise (₹4,999 / mo)</option>
                  </select>
                  <span className="text-[10px] text-emerald-800 mt-1 block">
                    Selecting a new plan automatically resets a 30-day billing cycle.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Subscription Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TenantStatus)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-hidden font-semibold"
                  >
                    <option value="active">Active (Verified)</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Expiry / Renewal Date (Auto-Updated by Plan) *
                </label>
                <input
                  type="date"
                  required
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  You can also manually override the date if extending custom grace periods.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editBizName}
                    onChange={(e) => setEditBizName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL PROVISION TENANT MODAL (Zero GSTIN) */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-emerald-950">Manual Tenant Onboarding</h3>
              <button
                onClick={() => setShowAddTenantModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M/s Patel Cotton & Agro Corp"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chetan Patel"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="chetan@patelagro.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98250 00000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Ahmedabad"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Plan Tier</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as SubscriptionTier)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="trial">₹0 Trial (1 Month)</option>
                  <option value="starter">Starter (₹999/mo)</option>
                  <option value="pro">Pro / Growth (₹2,499/mo)</option>
                  <option value="enterprise">Enterprise (₹4,999/mo)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Create Isolated Cell
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
