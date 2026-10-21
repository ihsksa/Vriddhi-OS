import React, { useState, useEffect, useMemo } from 'react';
import {
  Tenant,
  Product,
  Customer,
  SalesOrder,
  UserRole,
  EOQResult,
  AuthSession,
} from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import {
  calculateProductEOQ,
  calculateABCAnalysis,
  calculateRFMAnalysis,
  calculatePredictiveSalesForecast,
  formatINR,
} from './utils/analyticsMath';
import { LandingPage } from './components/LandingPage';
import { AuthPortal } from './components/AuthPortal';
import { AdminPortal } from './components/AdminPortal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { DashboardTab } from './components/tenant/DashboardTab';
import { InventoryTab } from './components/tenant/InventoryTab';
import { ABCTab } from './components/tenant/ABCTab';
import { CustomersTab } from './components/tenant/CustomersTab';
import { ForecastTab } from './components/tenant/ForecastTab';
import { SubscriptionTab } from './components/tenant/SubscriptionTab';
import { ReportStudioTab } from './components/tenant/ReportStudioTab';
import { UPIPaymentModal } from './components/UPIPaymentModal';
import { RecordOrderModal } from './components/tenant/RecordOrderModal';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  TrendingUp,
  CreditCard,
  FileText,
  ShieldCheck,
  Building,
  UserCheck,
  ChevronDown,
  RefreshCw,
  QrCode,
  Shield,
  Smartphone,
  LogOut,
  Sparkles,
  Home,
  LogIn,
} from 'lucide-react';

export default function App() {
  // Ensure local multi-tenant storage and auth registries are initialized
  useEffect(() => {
    StorageService.init();
    AuthService.init();

    // Transparent cloud rehydration from Supabase if connected
    StorageService.rehydrateFromSupabase().then((res) => {
      if (res.success && res.count > 0) {
        setTenants(StorageService.getTenants());
      }
    });
  }, []);

  // Authentication State
  const [session, setSession] = useState<AuthSession | null>(() => AuthService.getSession());

  // Unauthenticated Navigation View: 'home' (Landing Page) or 'auth' (Sign In / Register / Admin Login)
  const [publicView, setPublicView] = useState<'home' | 'auth'>('home');
  const [authMode, setAuthMode] = useState<'user_login' | 'user_register' | 'admin_login'>('user_login');

  // Tenants list
  const [tenants, setTenants] = useState<Tenant[]>(() => StorageService.getTenants());

  // Admin audit inspection mode
  const [adminInspectingTenantId, setAdminInspectingTenantId] = useState<string | null>(null);

  // Active Tab for Business Portal
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showRecordOrderModal, setShowRecordOrderModal] = useState<boolean>(false);
  const [isSandboxPreview, setIsSandboxPreview] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Determine active tenant cell:
  // If business owner: strictly locked to session.user.tenantId (Complete Isolation!)
  // If super admin in inspection mode: adminInspectingTenantId
  const activeTenantId = useMemo(() => {
    if (!session) return null;
    if (session.user.role === 'business_owner') {
      return session.user.tenantId || null;
    }
    return adminInspectingTenantId || null;
  }, [session, adminInspectingTenantId]);

  const activeTenant = useMemo(() => {
    if (!activeTenantId) return null;
    return tenants.find((t) => t.id === activeTenantId) || null;
  }, [tenants, activeTenantId]);

  // Strict tenant data state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  // Strict tenant data loader: ensures NO cross-tenant query leaks
  useEffect(() => {
    if (!activeTenant) {
      setProducts([]);
      setCustomers([]);
      setOrders([]);
      return;
    }
    const p = StorageService.getTenantProducts(activeTenant.id);
    const c = StorageService.getTenantCustomers(activeTenant.id);
    const o = StorageService.getTenantOrders(activeTenant.id);
    setProducts(p);
    setCustomers(c);
    setOrders(o);

    // If local storage cell is empty, attempt background cloud hydration from Supabase
    if (p.length === 0 && c.length === 0 && o.length === 0) {
      StorageService.rehydrateTenantCell(activeTenant.id).then((hydrated) => {
        if (hydrated) {
          const hp = StorageService.getTenantProducts(activeTenant.id);
          const hc = StorageService.getTenantCustomers(activeTenant.id);
          const ho = StorageService.getTenantOrders(activeTenant.id);
          if (hp.length > 0 || hc.length > 0 || ho.length > 0) {
            setProducts(hp);
            setCustomers(hc);
            setOrders(ho);
          }
        }
      });
    }
  }, [activeTenant?.id, refreshTrigger]);

  const refreshAllData = () => {
    const list = StorageService.getTenants();
    setTenants(list);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    AuthService.logout();
    setSession(null);
    setAdminInspectingTenantId(null);
    setPublicView('home');
  };

  const handleQuickAddSKU = () => {
    setActiveTab('inventory');
  };

  // --- DETERMINISTIC MATHEMATICAL ENGINES ---
  const eoqMap = useMemo(() => {
    const map = new Map<string, EOQResult>();
    if (!activeTenant) return map;
    products.forEach((prod) => {
      map.set(prod.id, calculateProductEOQ(prod, activeTenant.settings));
    });
    return map;
  }, [products, activeTenant]);

  const abcList = useMemo(() => {
    return calculateABCAnalysis(products);
  }, [products]);

  const rfmList = useMemo(() => {
    return calculateRFMAnalysis(customers, orders);
  }, [customers, orders]);

  const forecast = useMemo(() => {
    return calculatePredictiveSalesForecast(orders, 60);
  }, [orders]);

  // Tenant state mutation handlers
  const handleSaveProduct = (prod: Product) => {
    if (!activeTenant) return;
    StorageService.saveProduct(activeTenant.id, prod);
    refreshAllData();
  };

  const handleDeleteProduct = (productId: string) => {
    if (!activeTenant) return;
    StorageService.deleteProduct(activeTenant.id, productId);
    refreshAllData();
  };

  const handleRestockProduct = (productId: string, quantityToAdd: number) => {
    if (!activeTenant) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    prod.currentStock += quantityToAdd;
    prod.lastRestockedDate = new Date().toISOString().split('T')[0];
    StorageService.saveProduct(activeTenant.id, prod);
    refreshAllData();
  };

  const handleSaveCustomer = (cust: Customer) => {
    if (!activeTenant) return;
    StorageService.saveCustomer(activeTenant.id, cust);
    refreshAllData();
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (!activeTenant) return;
    StorageService.deleteCustomer(activeTenant.id, customerId);
    refreshAllData();
  };

  const handleSaveOrder = (order: SalesOrder) => {
    if (!activeTenant) return;
    StorageService.saveOrder(activeTenant.id, order);
    refreshAllData();
  };

  const isPendingApproval =
    activeTenant?.subscription.status === 'pending_approval' && !isSandboxPreview;

  const navTabs = [
    { id: 'dashboard', label: 'Command Hub', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory & EOQ', icon: Package },
    { id: 'abc', label: 'Pareto ABC Matrix', icon: Layers },
    { id: 'customers', label: 'Customer Cohorts (RFM)', icon: Users },
    { id: 'forecast', label: 'Predictive Studio', icon: TrendingUp },
    { id: 'subscription', label: 'Monthly Plan & UPI', icon: CreditCard },
    { id: 'reports', label: 'Report Studio', icon: FileText },
  ];

  // =========================================================================
  // VIEW A: PUBLIC VISITOR (LANDING PAGE OR AUTHENTICATION PORTAL)
  // =========================================================================
  if (!session) {
    return (
      <div className="min-h-screen bg-[#fcfdfc] text-[#064e3b] font-sans antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        {/* Public Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              <button
                onClick={() => setPublicView('home')}
                className="flex items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-200 shadow-xs">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                    <path d="M4 18L10 12L14 16L20 6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="20" cy="6" r="2" fill="currentColor" />
                    <path d="M4 6V18H20" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold text-emerald-950 tracking-tight">
                    Vridhi OS
                  </span>
                  <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    Indian Business SaaS
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2.5">
                <PWAInstallButton />

                {publicView === 'home' ? (
                  <>
                    <button
                      onClick={() => {
                        setAuthMode('user_login');
                        setPublicView('auth');
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-emerald-300 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('user_register');
                        setPublicView('auth');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-800 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setPublicView('home')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Public Body */}
        <main className="flex-1">
          {publicView === 'home' ? (
            <LandingPage
              onGoToAuth={(chosenMode) => {
                setAuthMode(chosenMode);
                setPublicView('auth');
              }}
            />
          ) : (
            <AuthPortal
              initialMode={authMode}
              onGoHome={() => setPublicView('home')}
              onAuthenticated={(newSession) => setSession(newSession)}
            />
          )}
        </main>

        <footer className="border-t border-emerald-100 bg-white py-6 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-950">Vridhi Business OS</span>
              <span>&bull;</span>
              <span>Deterministic Intelligence &bull; Indian SaaS</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <button
                onClick={() => {
                  setAuthMode('admin_login');
                  setPublicView('auth');
                }}
                className="hover:text-emerald-800 underline"
              >
                Admin Gateway
              </button>
              <span>&bull;</span>
              <span>Zero-AI Non-Hallucinatory Math</span>
              <span>&bull;</span>
              <span>100% Client Privacy Guarantee</span>
            </div>
          </div>
        </footer>

        <OfflineIndicator />
      </div>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED USER (SUPER ADMIN OR BUSINESS MERCHANT CELL)
  // =========================================================================
  const isSuperAdmin = session.user.role === 'super_admin';

  return (
    <div className="min-h-screen bg-[#fcfdfc] text-[#064e3b] font-sans antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-200 shadow-xs">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                  <path d="M4 18L10 12L14 16L20 6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="20" cy="6" r="2" fill="currentColor" />
                  <path d="M4 6V18H20" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-emerald-950 tracking-tight">
                    Vridhi OS
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {isSuperAdmin ? 'Admin Control' : 'Isolated Cell'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 hidden sm:block">
                  {isSuperAdmin
                    ? 'Super Admin Multi-Tenant Governance'
                    : `Sandboxed: ${activeTenant?.businessName || 'Business Cell'}`}
                </p>
              </div>
            </div>

            {/* Admin Return Toggle if Inspecting Cell */}
            {isSuperAdmin && adminInspectingTenantId && (
              <button
                onClick={() => setAdminInspectingTenantId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 transition"
              >
                &larr; Return to Admin Overview
              </button>
            )}

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-3">
              <PWAInstallButton />

              <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-emerald-950">{session.user.name}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{session.user.role.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-red-700 hover:bg-red-50 transition"
                  title="Sign Out of Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs for Business Owner (or Admin inspecting a cell) */}
        {activeTenant && (!isPendingApproval || isSandboxPreview) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-gray-600 hover:text-emerald-950 hover:bg-emerald-50/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isSuperAdmin && !adminInspectingTenantId ? (
          /* SUPER ADMIN MASTER PORTAL */
          <AdminPortal
            onSelectTenantCell={(tenantId) => {
              setAdminInspectingTenantId(tenantId);
              setActiveTab('dashboard');
            }}
            onRefresh={refreshAllData}
          />
        ) : isPendingApproval && activeTenant ? (
          /* ONBOARDING PENDING APPROVAL VIEW */
          <PendingApprovalView
            tenant={activeTenant}
            onOpenPaymentModal={() => setShowPaymentModal(true)}
            onPreviewSandbox={() => setIsSandboxPreview(true)}
          />
        ) : activeTenant ? (
          /* ISOLATED BUSINESS OWNER PORTAL */
          <div>
            {/* Banner for Admin Inspection or Sandbox */}
            {isSuperAdmin && adminInspectingTenantId && (
              <div className="mb-6 p-3.5 rounded-2xl bg-emerald-900 text-white text-xs flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>
                    <strong>Admin Audit Inspection:</strong> Viewing isolated cell <strong>{activeTenant.businessName}</strong> ({activeTenant.id}).
                  </span>
                </div>
                <button
                  onClick={() => setAdminInspectingTenantId(null)}
                  className="font-bold underline text-emerald-200 hover:text-white"
                >
                  Exit Cell Inspection &rarr;
                </button>
              </div>
            )}

            {isSandboxPreview && (
              <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>
                  <strong>Sandbox Exploration Mode:</strong> Previewing cell features while awaiting Admin verification.
                </span>
                <button
                  onClick={() => setIsSandboxPreview(false)}
                  className="font-bold underline ml-2"
                >
                  Exit Sandbox
                </button>
              </div>
            )}

            {/* Empty state prompt for pristine merchant cell */}
            {products.length === 0 && (
              <div className="mb-6 p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Welcome to your pristine business cell!</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your database is completely empty and private with zero dummy data. Add your first inventory SKU or record your first customer order to see the deterministic math engines calculate real-time EOQ and analytics.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleQuickAddSKU}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>+ Add First SKU</span>
                  </button>
                  <button
                    onClick={() => setShowRecordOrderModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition"
                  >
                    <span>Record Order</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab
                tenant={activeTenant}
                products={products}
                customers={customers}
                orders={orders}
                eoqMap={eoqMap}
                abcList={abcList}
                forecast={forecast}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenRecordOrder={() => setShowRecordOrderModal(true)}
                onOpenAddProduct={() => setActiveTab('inventory')}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryTab
                tenant={activeTenant}
                products={products}
                eoqMap={eoqMap}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onRestockProduct={handleRestockProduct}
              />
            )}

            {activeTab === 'abc' && (
              <ABCTab
                tenant={activeTenant}
                abcList={abcList}
                onOpenReportStudio={() => setActiveTab('reports')}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersTab
                tenant={activeTenant}
                customers={customers}
                rfmList={rfmList}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {activeTab === 'forecast' && (
              <ForecastTab tenant={activeTenant} forecast={forecast} />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionTab
                tenant={activeTenant}
                orders={orders}
                onOpenPaymentModal={() => setShowPaymentModal(true)}
              />
            )}

            {activeTab === 'reports' && (
              <ReportStudioTab
                tenant={activeTenant}
                products={products}
                customers={customers}
                orders={orders}
                eoqMap={eoqMap}
                abcList={abcList}
                rfmList={rfmList}
                forecast={forecast}
              />
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            No tenant selected.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white py-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-950">Vridhi Business OS</span>
            <span>&bull;</span>
            <span>Indian SaaS Multi-Tenant Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span>Deterministic Math</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-900">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Supabase Cloud Hosting Active</span>
            </span>
            <span>&bull;</span>
            <span>Strict Cell Isolation</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {activeTenant && (
        <>
          <UPIPaymentModal
            tenant={activeTenant}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onPaymentSubmitted={refreshAllData}
            defaultPlan={activeTenant.subscription.plan}
          />

          <RecordOrderModal
            tenant={activeTenant}
            products={products}
            customers={customers}
            isOpen={showRecordOrderModal}
            onClose={() => setShowRecordOrderModal(false)}
            onSaveOrder={handleSaveOrder}
          />
        </>
      )}

      {/* Offline Connectivity Toast */}
      <OfflineIndicator />
    </div>
  );
}
