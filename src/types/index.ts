export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'enterprise';

export type TenantStatus = 'active' | 'pending_approval' | 'suspended' | 'expired';

export type UserRole = 'super_admin' | 'business_owner';

export interface TenantSubscription {
  plan: SubscriptionTier;
  amountMonthly: number; // in INR ₹
  status: TenantStatus;
  startedAt: string; // ISO date
  expiresAt: string; // ISO date
  lastPaymentDate?: string;
  paymentMethod: 'upi_qr' | 'bank_transfer' | 'manual_admin';
  lastUpiTransactionRef?: string;
  paymentSubmittedAt?: string;
  notes?: string;
}

export interface Tenant {
  id: string; // unique cell id, e.g. "cell_t101"
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  industry: string;
  createdAt: string;
  subscription: TenantSubscription;
  settings: {
    currencySymbol: string;
    lowStockThreshold: number;
    defaultGstPercent: number;
    annualHoldingCostPercent: number; // e.g. 20% of unit cost
    defaultOrderCost: number; // S in EOQ, e.g. ₹500
    targetServiceLevel: 0.90 | 0.95 | 0.99;
  };
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  tenantId?: string; // Present only for business_owner
  createdAt: string;
  lastLoginAt?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
  autoSyncEnabled: boolean;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId?: string;
  };
  token: string;
  expiresAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: string;
  hsnCode: string;
  currentStock: number;
  minSafetyStock: number;
  leadTimeDays: number;
  unitCost: number; // Purchase / Holding basis in ₹
  sellingPrice: number; // in ₹
  gstRate: number; // e.g. 5, 12, 18, 28%
  supplierName: string;
  supplierContact?: string;
  annualDemandEstimate: number; // units/year for deterministic EOQ
  historicalSalesLast30Days: number[]; // daily units sold array
  lastRestockedDate: string;
  notes?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  customerSince: string;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    total: number;
  }[];
  subtotal: number;
  totalGst: number;
  grandTotal: number; // ₹ INR
  status: 'completed' | 'pending' | 'cancelled';
  paymentMode: 'UPI' | 'NEFT' | 'Cash' | 'Card';
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'damage';
  quantityChange: number;
  date: string;
  referenceId?: string;
  notes?: string;
}

// Deterministic Analytical Outputs
export interface EOQResult {
  productId: string;
  eoqUnits: number;
  reorderPoint: number;
  safetyStock: number;
  annualHoldingCost: number;
  annualOrderCost: number;
  totalAnnualInventoryCost: number;
  optimalOrdersPerYear: number;
  daysOfInventoryLeft: number;
  isRestockRecommended: boolean;
  urgencyLevel: 'Critical' | 'Warning' | 'Healthy' | 'Overstocked';
}

export interface ABCClassificationResult {
  productId: string;
  productName: string;
  sku: string;
  annualMonetaryValue: number;
  percentageOfTotalValue: number;
  cumulativePercentage: number;
  classification: 'A' | 'B' | 'C';
  managementPolicy: string;
}

export interface RFMCustomerResult {
  customerId: string;
  customerName: string;
  city: string;
  recencyDays: number;
  frequencyCount: number;
  monetaryTotal: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmSegment:
    | 'Champions'
    | 'Loyal Customers'
    | 'Potential Loyalists'
    | 'Recent Customers'
    | 'Need Attention'
    | 'At Risk'
    | 'Hibernating';
  predictedLTV: number;
  churnRiskPercent: number;
}

export interface PredictiveSalesForecast {
  historyPoints: { date: string; actualSales: number }[];
  forecastPoints: {
    date: string;
    projectedSales: number;
    lowerBound: number;
    upperBound: number;
    growthFactor: number;
  }[];
  modelMetrics: {
    slope: number;
    intercept: number;
    rSquared: number;
    standardError: number;
    holtAlpha: number;
    holtBeta: number;
    forecastPeriodDays: number;
    projectedMonthlyRevenue: number;
  };
}
