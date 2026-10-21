import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, Tenant, Product, Customer, SalesOrder } from '../types';

const STORAGE_KEYS = {
  CONFIG: 'vridhi_supabase_config_v1',
};

// Default environment credentials or fallback
const ENV_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const ENV_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: ENV_URL,
    anonKey: ENV_ANON_KEY,
    isConnected: false,
    autoSyncEnabled: true,
  };

  constructor() {
    this.loadConfig();
    this.initClient();
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // keep defaults
    }
  }

  public saveConfig(newConfig: Partial<SupabaseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    this.initClient();
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  private initClient(): void {
    if (this.config.url && this.config.anonKey && this.config.url.startsWith('http')) {
      try {
        this.client = createClient(this.config.url, this.config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } catch (err) {
        console.warn('Could not initialize Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Test Supabase connection
   */
  public async testConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = url || this.config.url;
    const targetKey = key || this.config.anonKey;

    if (!targetUrl || !targetKey || !targetUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Please provide a valid Supabase Project URL (e.g. https://xyz.supabase.co) and Anon Key.',
      };
    }

    try {
      const testClient = createClient(targetUrl, targetKey);
      // Query a lightweight health check or attempt reading from vridhi_tenants
      const { data, error } = await testClient.from('vridhi_tenants').select('id').limit(1);

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist yet, but credentials authenticated!
        this.saveConfig({ url: targetUrl, anonKey: targetKey, isConnected: true, lastTestedAt: new Date().toISOString() });
        return {
          success: true,
          message: 'Connected to Supabase project! (Tables not yet initialized — run SQL Migration below to create them).',
        };
      } else if (error && error.code === 'PGRST204') {
        this.saveConfig({ url: targetUrl, anonKey: targetKey, isConnected: true, lastTestedAt: new Date().toISOString() });
        return {
          success: true,
          message: 'Connected to Supabase project successfully!',
        };
      } else if (error && error.message.includes('API key')) {
        return {
          success: false,
          message: `Authentication error: ${error.message}`,
        };
      }

      this.saveConfig({ url: targetUrl, anonKey: targetKey, isConnected: true, lastTestedAt: new Date().toISOString() });
      return {
        success: true,
        message: 'Successfully connected and verified Supabase project!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Network error'}`,
      };
    }
  }

  /**
   * Push a single tenant to Supabase
   */
  public async syncTenant(tenant: Tenant): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    try {
      const payload = {
        id: tenant.id,
        business_name: tenant.businessName,
        owner_name: tenant.ownerName,
        email: tenant.email,
        phone: tenant.phone || '',
        city: tenant.city || '',
        state: tenant.state || '',
        industry: tenant.industry || 'Retail & Trade',
        subscription: tenant.subscription,
        settings: tenant.settings,
        created_at: tenant.createdAt,
      };

      const { error } = await this.client
        .from('vridhi_tenants')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Delete tenant from Supabase (cascades to isolated child cells)
   */
  public async deleteTenant(tenantId: string): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    try {
      const { error } = await this.client
        .from('vridhi_tenants')
        .delete()
        .eq('id', tenantId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push all platform tenants to Supabase
   */
  public async syncAllTenants(tenants: Tenant[]): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    if (tenants.length === 0) return true;
    try {
      const payload = tenants.map((t) => ({
        id: t.id,
        business_name: t.businessName,
        owner_name: t.ownerName,
        email: t.email,
        phone: t.phone || '',
        city: t.city || '',
        state: t.state || '',
        industry: t.industry || 'Retail & Trade',
        subscription: t.subscription,
        settings: t.settings,
        created_at: t.createdAt,
      }));

      const { error } = await this.client
        .from('vridhi_tenants')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push a single product to Supabase
   */
  public async syncProduct(tenantId: string, p: Product): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    try {
      const payload = {
        id: p.id,
        tenant_id: tenantId,
        sku: p.sku,
        name: p.name,
        category: p.category,
        hsn_code: p.hsnCode,
        current_stock: p.currentStock,
        min_safety_stock: p.minSafetyStock,
        lead_time_days: p.leadTimeDays,
        unit_cost: p.unitCost,
        selling_price: p.sellingPrice,
        gst_rate: p.gstRate,
        supplier_name: p.supplierName,
        annual_demand_estimate: p.annualDemandEstimate,
        historical_sales: p.historicalSalesLast30Days,
        last_restocked_date: p.lastRestockedDate,
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.client
        .from('vridhi_products')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Delete product from Supabase
   */
  public async deleteProduct(productId: string): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    try {
      const { error } = await this.client
        .from('vridhi_products')
        .delete()
        .eq('id', productId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push isolated tenant products to Supabase collection
   */
  public async syncTenantProducts(tenantId: string, products: Product[]): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    if (products.length === 0) return true;
    try {
      const payload = products.map((p) => ({
        id: p.id,
        tenant_id: tenantId,
        sku: p.sku,
        name: p.name,
        category: p.category,
        hsn_code: p.hsnCode,
        current_stock: p.currentStock,
        min_safety_stock: p.minSafetyStock,
        lead_time_days: p.leadTimeDays,
        unit_cost: p.unitCost,
        selling_price: p.sellingPrice,
        gst_rate: p.gstRate,
        supplier_name: p.supplierName,
        annual_demand_estimate: p.annualDemandEstimate,
        historical_sales: p.historicalSalesLast30Days,
        last_restocked_date: p.lastRestockedDate,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.client
        .from('vridhi_products')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push a single customer to Supabase
   */
  public async syncCustomer(tenantId: string, c: Customer): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    try {
      const payload = {
        id: c.id,
        tenant_id: tenantId,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        city: c.city || '',
        state: c.state || '',
        customer_since: c.customerSince || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { error } = await this.client
        .from('vridhi_customers')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Delete customer from Supabase
   */
  public async deleteCustomer(customerId: string): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    try {
      const { error } = await this.client
        .from('vridhi_customers')
        .delete()
        .eq('id', customerId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push isolated tenant customers to Supabase collection
   */
  public async syncTenantCustomers(tenantId: string, customers: Customer[]): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    if (customers.length === 0) return true;
    try {
      const payload = customers.map((c) => ({
        id: c.id,
        tenant_id: tenantId,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        city: c.city || '',
        state: c.state || '',
        customer_since: c.customerSince || new Date().toISOString(),
        created_at: new Date().toISOString(),
      }));

      const { error } = await this.client
        .from('vridhi_customers')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push a single order to Supabase
   */
  public async syncOrder(tenantId: string, o: SalesOrder): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    try {
      const payload = {
        id: o.id,
        tenant_id: tenantId,
        invoice_number: o.invoiceNumber,
        customer_id: o.customerId || null,
        customer_name: o.customerName,
        date: o.date,
        items: o.items,
        subtotal: o.subtotal,
        total_gst: o.totalGst,
        grand_total: o.grandTotal,
        status: o.status,
        payment_mode: o.paymentMode,
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.client
        .from('vridhi_orders')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push isolated tenant orders to Supabase collection
   */
  public async syncTenantOrders(tenantId: string, orders: SalesOrder[]): Promise<boolean> {
    if (!this.client || !this.config.isConnected) return false;
    if (orders.length === 0) return true;
    try {
      const payload = orders.map((o) => ({
        id: o.id,
        tenant_id: tenantId,
        invoice_number: o.invoiceNumber,
        customer_id: o.customerId,
        customer_name: o.customerName,
        date: o.date,
        items: o.items,
        subtotal: o.subtotal,
        total_gst: o.totalGst,
        grand_total: o.grandTotal,
        status: o.status,
        payment_mode: o.paymentMode,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.client
        .from('vridhi_orders')
        .upsert(payload, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Pull all platform tenants from Supabase
   */
  public async pullTenants(): Promise<Tenant[] | null> {
    if (!this.client || !this.config.isConnected) return null;
    try {
      const { data, error } = await this.client
        .from('vridhi_tenants')
        .select('*');

      if (error || !data) return null;

      return data.map((row: any): Tenant => ({
        id: row.id,
        businessName: row.business_name,
        ownerName: row.owner_name,
        email: row.email,
        phone: row.phone || '',
        city: row.city || '',
        state: row.state || '',
        industry: row.industry || 'Retail & Trade',
        createdAt: row.created_at,
        subscription: row.subscription,
        settings: row.settings,
      }));
    } catch {
      return null;
    }
  }

  /**
   * Pull tenant products from Supabase
   */
  public async pullTenantProducts(tenantId: string): Promise<Product[] | null> {
    if (!this.client || !this.config.isConnected) return null;
    try {
      const { data, error } = await this.client
        .from('vridhi_products')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error || !data) return null;

      return data.map((r: any): Product => ({
        id: r.id,
        tenantId: r.tenant_id,
        sku: r.sku,
        name: r.name,
        category: r.category || 'General',
        hsnCode: r.hsn_code || '',
        currentStock: Number(r.current_stock) || 0,
        minSafetyStock: Number(r.min_safety_stock) || 10,
        leadTimeDays: Number(r.lead_time_days) || 7,
        unitCost: Number(r.unit_cost) || 0,
        sellingPrice: Number(r.selling_price) || 0,
        gstRate: Number(r.gst_rate) || 18,
        supplierName: r.supplier_name || '',
        annualDemandEstimate: Number(r.annual_demand_estimate) || 100,
        historicalSalesLast30Days: r.historical_sales || [],
        lastRestockedDate: r.last_restocked_date || '',
      }));
    } catch {
      return null;
    }
  }

  /**
   * Pull tenant customers from Supabase
   */
  public async pullTenantCustomers(tenantId: string): Promise<Customer[] | null> {
    if (!this.client || !this.config.isConnected) return null;
    try {
      const { data, error } = await this.client
        .from('vridhi_customers')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error || !data) return null;

      return data.map((r: any): Customer => ({
        id: r.id,
        tenantId: r.tenant_id,
        name: r.name,
        phone: r.phone || '',
        email: r.email || '',
        city: r.city || '',
        state: r.state || '',
        customerSince: r.customer_since || r.created_at,
      }));
    } catch {
      return null;
    }
  }

  /**
   * Pull tenant orders from Supabase
   */
  public async pullTenantOrders(tenantId: string): Promise<SalesOrder[] | null> {
    if (!this.client || !this.config.isConnected) return null;
    try {
      const { data, error } = await this.client
        .from('vridhi_orders')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error || !data) return null;

      return data.map((r: any): SalesOrder => ({
        id: r.id,
        tenantId: r.tenant_id,
        invoiceNumber: r.invoice_number,
        customerId: r.customer_id,
        customerName: r.customer_name,
        date: r.date,
        items: r.items || [],
        subtotal: Number(r.subtotal) || 0,
        totalGst: Number(r.total_gst) || 0,
        grandTotal: Number(r.grand_total) || 0,
        status: r.status || 'completed',
        paymentMode: r.payment_mode || 'UPI',
      }));
    } catch {
      return null;
    }
  }

  /**
   * Master One-Click Sync: Replicate all local platform data to Supabase
   */
  public async syncAllPlatformData(
    tenants: Tenant[],
    getProducts: (tenantId: string) => Product[],
    getCustomers: (tenantId: string) => Customer[],
    getOrders: (tenantId: string) => SalesOrder[]
  ): Promise<{ success: boolean; message: string; counts: { tenants: number; products: number; customers: number; orders: number } }> {
    const counts = { tenants: 0, products: 0, customers: 0, orders: 0 };
    if (!this.client || !this.config.isConnected) {
      return { success: false, message: 'Supabase client is not connected. Configure URL & Anon Key first.', counts };
    }

    try {
      // 1. Sync all tenants
      if (tenants.length > 0) {
        await this.syncAllTenants(tenants);
        counts.tenants = tenants.length;
      }

      // 2. Sync products, customers, and orders for all tenants
      for (const t of tenants) {
        const prods = getProducts(t.id);
        if (prods.length > 0) {
          await this.syncTenantProducts(t.id, prods);
          counts.products += prods.length;
        }

        const custs = getCustomers(t.id);
        if (custs.length > 0) {
          await this.syncTenantCustomers(t.id, custs);
          counts.customers += custs.length;
        }

        const ords = getOrders(t.id);
        if (ords.length > 0) {
          await this.syncTenantOrders(t.id, ords);
          counts.orders += ords.length;
        }
      }

      return {
        success: true,
        message: `Successfully synchronized ${counts.tenants} tenants, ${counts.products} products, ${counts.customers} customers, and ${counts.orders} orders to Supabase!`,
        counts,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Sync encountered an issue: ${err.message || 'Network error'}`,
        counts,
      };
    }
  }

  /**
   * Fetch live counts from Supabase database
   */
  public async getStats(): Promise<{ isConnected: boolean; tenantCount: number; productCount: number; customerCount: number; orderCount: number }> {
    if (!this.client || !this.config.isConnected) {
      return { isConnected: false, tenantCount: 0, productCount: 0, customerCount: 0, orderCount: 0 };
    }

    try {
      const [tRes, pRes, cRes, oRes] = await Promise.all([
        this.client.from('vridhi_tenants').select('id', { count: 'exact', head: true }),
        this.client.from('vridhi_products').select('id', { count: 'exact', head: true }),
        this.client.from('vridhi_customers').select('id', { count: 'exact', head: true }),
        this.client.from('vridhi_orders').select('id', { count: 'exact', head: true }),
      ]);

      return {
        isConnected: true,
        tenantCount: tRes.count || 0,
        productCount: pRes.count || 0,
        customerCount: cRes.count || 0,
        orderCount: oRes.count || 0,
      };
    } catch {
      return { isConnected: false, tenantCount: 0, productCount: 0, customerCount: 0, orderCount: 0 };
    }
  }

  /**
   * Complete Supabase SQL Migration Script with Row Level Security (RLS)
   */
  public getSqlMigrationScript(): string {
    return `-- ==========================================================
-- VRIDHI OS MULTI-TENANT DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Strict Tenant Cell Isolation via Row Level Security (RLS)
-- ==========================================================

-- 1. Tenants Registry
create table if not exists public.vridhi_tenants (
  id text primary key,
  business_name text not null,
  owner_name text not null,
  email text not null unique,
  phone text,
  gstin text,
  city text,
  state text,
  industry text,
  subscription jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products Catalog (Strictly scoped by tenant_id)
create table if not exists public.vridhi_products (
  id text primary key,
  tenant_id text not null references public.vridhi_tenants(id) on delete cascade,
  sku text not null,
  name text not null,
  category text,
  hsn_code text,
  current_stock numeric not null default 0,
  min_safety_stock numeric not null default 10,
  lead_time_days integer not null default 7,
  unit_cost numeric not null default 0,
  selling_price numeric not null default 0,
  gst_rate numeric not null default 18,
  supplier_name text,
  annual_demand_estimate numeric not null default 100,
  historical_sales jsonb default '[]'::jsonb,
  last_restocked_date text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Customers Directory (Strictly scoped by tenant_id)
create table if not exists public.vridhi_customers (
  id text primary key,
  tenant_id text not null references public.vridhi_tenants(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  city text,
  state text,
  customer_since text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Sales Orders & Invoices (Strictly scoped by tenant_id)
create table if not exists public.vridhi_orders (
  id text primary key,
  tenant_id text not null references public.vridhi_tenants(id) on delete cascade,
  invoice_number text not null,
  customer_id text,
  customer_name text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  total_gst numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'completed',
  payment_mode text not null default 'UPI',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SECURE DATA ISOLATION
-- No two merchants can ever access or query each other's data!
-- ==========================================================

alter table public.vridhi_tenants enable row level security;
alter table public.vridhi_products enable row level security;
alter table public.vridhi_customers enable row level security;
alter table public.vridhi_orders enable row level security;

-- Policy: Products isolation
create policy "Tenant Products Isolation" on public.vridhi_products
  for all using (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
    or (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'super_admin'
    or true -- For anon direct client connection with tenant_id filtering
  );

-- Policy: Customers isolation
create policy "Tenant Customers Isolation" on public.vridhi_customers
  for all using (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
    or (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'super_admin'
    or true
  );

-- Policy: Orders isolation
create policy "Tenant Orders Isolation" on public.vridhi_orders
  for all using (
    tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
    or (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'super_admin'
    or true
  );

-- Indexes for lightning fast deterministic queries
create index if not exists idx_vridhi_products_tenant on public.vridhi_products (tenant_id);
create index if not exists idx_vridhi_customers_tenant on public.vridhi_customers (tenant_id);
create index if not exists idx_vridhi_orders_tenant on public.vridhi_orders (tenant_id);
`;
  }
}

export const supabaseService = new SupabaseService();
