import {
  Tenant,
  Product,
  Customer,
  SalesOrder,
  StockMovement,
  SubscriptionTier,
  TenantStatus,
} from '../types';

const STORAGE_KEYS = {
  TENANTS: 'vridhi_tenants_registry_v4',
};

// Isolated storage key generator
function getTenantKey(tenantId: string, resource: string): string {
  return `vridhi_cell_${tenantId}_${resource}`;
}

export const PLAN_PRICING: Record<SubscriptionTier, number> = {
  trial: 0,       // ₹0 Trial for 1 month
  starter: 999,
  pro: 2499,
  enterprise: 4999,
};

export class StorageService {
  /**
   * Initialize local multi-tenant registry.
   * Completely clean state with ZERO dummy tenants.
   */
  public static init(): void {
    // Clean up any legacy dummy fixtures if present
    const legacyKeys = [
      'vridhi_tenants_registry_v1',
      'vridhi_tenants_registry_v2',
      'vridhi_cell_cell_t101_products',
      'vridhi_cell_cell_t101_customers',
      'vridhi_cell_cell_t101_orders',
      'vridhi_cell_cell_t102_products',
      'vridhi_cell_cell_t102_customers',
      'vridhi_cell_cell_t102_orders',
      'vridhi_cell_cell_t103_products',
      'vridhi_cell_cell_t103_customers',
      'vridhi_cell_cell_t103_orders',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));

    if (!localStorage.getItem(STORAGE_KEYS.TENANTS)) {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify([]));
    }
  }

  // --- TENANT MANAGEMENT (Admin & User) ---

  public static getTenants(): Tenant[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TENANTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getTenantById(tenantId: string): Tenant | null {
    const tenants = this.getTenants();
    return tenants.find((t) => t.id === tenantId) || null;
  }

  public static updateTenant(tenant: Tenant): void {
    const tenants = this.getTenants();
    const index = tenants.findIndex((t) => t.id === tenant.id);
    if (index >= 0) {
      tenants[index] = tenant;
    } else {
      tenants.push(tenant);
    }
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
  }

  public static deleteTenant(tenantId: string): void {
    const tenants = this.getTenants().filter((t) => t.id !== tenantId);
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    // Clean isolated keys
    localStorage.removeItem(getTenantKey(tenantId, 'products'));
    localStorage.removeItem(getTenantKey(tenantId, 'customers'));
    localStorage.removeItem(getTenantKey(tenantId, 'orders'));
  }

  /**
   * Edit tenant plan, status, and automatically recalculate expiry date & monthly billing
   */
  public static editTenantSubscription(
    tenantId: string,
    updates: {
      plan?: SubscriptionTier;
      status?: TenantStatus;
      customExpiryDate?: string;
      businessName?: string;
      ownerName?: string;
      phone?: string;
      city?: string;
    }
  ): Tenant | null {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) return null;

    if (updates.businessName) tenant.businessName = updates.businessName.trim();
    if (updates.ownerName) tenant.ownerName = updates.ownerName.trim();
    if (updates.phone) tenant.phone = updates.phone.trim();
    if (updates.city) tenant.city = updates.city.trim();

    if (updates.plan) {
      tenant.subscription.plan = updates.plan;
      tenant.subscription.amountMonthly = PLAN_PRICING[updates.plan];
      // Automatically update 30-day billing cycle expiry when plan is updated
      if (!updates.customExpiryDate) {
        tenant.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    if (updates.status) {
      tenant.subscription.status = updates.status;
      if (updates.status === 'active' && !updates.customExpiryDate) {
        tenant.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        tenant.subscription.lastPaymentDate = new Date().toISOString();
      }
    }

    if (updates.customExpiryDate) {
      tenant.subscription.expiresAt = new Date(updates.customExpiryDate).toISOString();
    }

    this.updateTenant(tenant);
    return tenant;
  }

  public static createTenant(
    tenantData: Omit<Tenant, 'id' | 'createdAt' | 'subscription' | 'settings'> & {
      plan?: SubscriptionTier;
      upiTxnRef?: string;
      status?: TenantStatus;
    }
  ): Tenant {
    const id = `cell_t${Date.now().toString().slice(-4)}`;
    const plan = tenantData.plan || 'trial';

    const newTenant: Tenant = {
      id,
      businessName: tenantData.businessName,
      ownerName: tenantData.ownerName,
      email: tenantData.email,
      phone: tenantData.phone,
      city: tenantData.city,
      state: tenantData.state,
      industry: tenantData.industry || 'Retail & Trade',
      createdAt: new Date().toISOString(),
      subscription: {
        plan,
        amountMonthly: PLAN_PRICING[plan], // ₹0 for trial!
        status: tenantData.status || (plan === 'trial' ? 'active' : 'pending_approval'),
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 Month Trial
        paymentMethod: 'upi_qr',
        lastUpiTransactionRef: tenantData.upiTxnRef || (plan === 'trial' ? 'FREE-TRIAL-30D' : `UPI/${Date.now().toString().slice(-8)}`),
        paymentSubmittedAt: new Date().toISOString(),
        notes: plan === 'trial' ? '₹0 1-Month Free Trial active' : 'Awaiting payment verification',
      },
      settings: {
        currencySymbol: '₹',
        lowStockThreshold: 15,
        defaultGstPercent: 18,
        annualHoldingCostPercent: 20,
        defaultOrderCost: 500,
        targetServiceLevel: 0.95,
      },
    };

    this.updateTenant(newTenant);
    return newTenant;
  }

  public static approveTenantSubscription(tenantId: string): void {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) return;

    tenant.subscription.status = 'active';
    tenant.subscription.lastPaymentDate = new Date().toISOString();
    tenant.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    tenant.subscription.notes = `Approved and activated by Admin on ${new Date().toLocaleDateString('en-IN')}`;

    this.updateTenant(tenant);
  }

  public static rejectTenantSubscription(tenantId: string, reason: string): void {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) return;

    tenant.subscription.status = 'suspended';
    tenant.subscription.notes = `Suspended: ${reason}`;
    this.updateTenant(tenant);
  }

  public static renewTenantSubscription(
    tenantId: string,
    plan: SubscriptionTier,
    upiTxnRef: string
  ): void {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) return;

    tenant.subscription.plan = plan;
    tenant.subscription.amountMonthly = PLAN_PRICING[plan];
    tenant.subscription.lastUpiTransactionRef = upiTxnRef;
    tenant.subscription.paymentSubmittedAt = new Date().toISOString();
    if (plan === 'trial') {
      tenant.subscription.status = 'active';
      tenant.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      tenant.subscription.notes = '₹0 1-Month Trial extended';
    } else {
      tenant.subscription.status = 'pending_approval';
      tenant.subscription.notes = `Renewal payment submitted (${upiTxnRef}). Awaiting Admin verification.`;
    }

    this.updateTenant(tenant);
  }

  // --- STRICT TENANT ISOLATION: PRODUCTS ---

  public static getTenantProducts(tenantId: string): Product[] {
    this.init();
    const key = getTenantKey(tenantId, 'products');
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveProduct(tenantId: string, product: Product): void {
    const products = this.getTenantProducts(tenantId);
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(getTenantKey(tenantId, 'products'), JSON.stringify(products));
  }

  public static deleteProduct(tenantId: string, productId: string): void {
    const products = this.getTenantProducts(tenantId);
    const filtered = products.filter((p) => p.id !== productId);
    localStorage.setItem(getTenantKey(tenantId, 'products'), JSON.stringify(filtered));
  }

  // --- STRICT TENANT ISOLATION: CUSTOMERS ---

  public static getTenantCustomers(tenantId: string): Customer[] {
    this.init();
    const key = getTenantKey(tenantId, 'customers');
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveCustomer(tenantId: string, customer: Customer): void {
    const customers = this.getTenantCustomers(tenantId);
    const index = customers.findIndex((c) => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    localStorage.setItem(getTenantKey(tenantId, 'customers'), JSON.stringify(customers));
  }

  public static deleteCustomer(tenantId: string, customerId: string): void {
    const customers = this.getTenantCustomers(tenantId);
    const filtered = customers.filter((c) => c.id !== customerId);
    localStorage.setItem(getTenantKey(tenantId, 'customers'), JSON.stringify(filtered));
  }

  // --- STRICT TENANT ISOLATION: SALES ORDERS ---

  public static getTenantOrders(tenantId: string): SalesOrder[] {
    this.init();
    const key = getTenantKey(tenantId, 'orders');
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveOrder(tenantId: string, order: SalesOrder): void {
    const orders = this.getTenantOrders(tenantId);
    const index = orders.findIndex((o) => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(getTenantKey(tenantId, 'orders'), JSON.stringify(orders));

    // Deduct stock for products
    const products = this.getTenantProducts(tenantId);
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
        if (!prod.historicalSalesLast30Days) prod.historicalSalesLast30Days = [];
        const lastIdx = prod.historicalSalesLast30Days.length - 1;
        if (lastIdx >= 0) {
          prod.historicalSalesLast30Days[lastIdx] += item.quantity;
        } else {
          prod.historicalSalesLast30Days.push(item.quantity);
        }
      }
    });
    localStorage.setItem(getTenantKey(tenantId, 'products'), JSON.stringify(products));
  }
}
