import React from 'react';
import {
  Tenant,
  Product,
  Customer,
  SalesOrder,
  EOQResult,
  ABCClassificationResult,
  PredictiveSalesForecast,
} from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  Calendar,
  ArrowUpRight,
  Shield,
  Layers,
  FileSpreadsheet,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DashboardTabProps {
  tenant: Tenant;
  products: Product[];
  customers: Customer[];
  orders: SalesOrder[];
  eoqMap: Map<string, EOQResult>;
  abcList: ABCClassificationResult[];
  forecast: PredictiveSalesForecast;
  onNavigateTab: (tabId: string) => void;
  onOpenRecordOrder: () => void;
  onOpenAddProduct: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  tenant,
  products,
  customers,
  orders,
  eoqMap,
  abcList,
  forecast,
  onNavigateTab,
  onOpenRecordOrder,
  onOpenAddProduct,
}) => {
  // Calculations
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalInventoryValuation = products.reduce((sum, p) => sum + p.currentStock * p.unitCost, 0);

  // Critical restocks
  const criticalItems = products.filter((p) => {
    const res = eoqMap.get(p.id);
    return res && (res.urgencyLevel === 'Critical' || res.urgencyLevel === 'Warning');
  });

  // Calculate monthly inventory turnover velocity
  const avgSalesPerDay =
    forecast.historyPoints.length > 0
      ? forecast.historyPoints.reduce((sum, p) => sum + p.actualSales, 0) / forecast.historyPoints.length
      : 1000;
  const estimatedDaysRunway =
    avgSalesPerDay > 0 ? Math.round(totalInventoryValuation / avgSalesPerDay) : 45;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
              {tenant.businessName}
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
              Cell {tenant.id} &bull; {tenant.subscription.plan.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time business insights, deterministic inventory replenishment, and predictive forecast.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenRecordOrder}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Sale Order</span>
          </button>
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition"
          >
            <Package className="w-3.5 h-3.5 text-emerald-700" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Realized Sales */}
        <div className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold uppercase tracking-wider">
            <span>Total Realized Sales</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">₹</div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-950">
            {formatINR(totalRevenue)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{completedOrders.length} verified orders processed</span>
          </div>
        </div>

        {/* Warehouse Inventory Capital */}
        <div className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold uppercase tracking-wider">
            <span>Inventory Asset Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-950">
            {formatINR(totalInventoryValuation)}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Across {products.length} managed catalog SKUs
          </div>
        </div>

        {/* Restock Warning Alert */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className={`cursor-pointer rounded-2xl bg-white p-5 border transition shadow-xs ${
            criticalItems.length > 0
              ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
              : 'border-emerald-100 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span className={criticalItems.length > 0 ? 'text-amber-800' : 'text-emerald-800'}>
              Restock Needed
            </span>
            <div
              className={`p-2 rounded-xl ${
                criticalItems.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-bold ${
              criticalItems.length > 0 ? 'text-amber-950' : 'text-emerald-950'
            }`}
          >
            {criticalItems.length} {criticalItems.length === 1 ? 'SKU' : 'SKUs'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
            <span>Below calculated safety buffer</span>
            <span className="text-emerald-700 font-semibold">View &rarr;</span>
          </div>
        </div>

        {/* 30-Day Predictive Revenue */}
        <div
          onClick={() => onNavigateTab('forecast')}
          className="cursor-pointer rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs hover:border-emerald-200 transition"
        >
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold uppercase tracking-wider">
            <span>30-Day Revenue Forecast</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-950">
            {formatINR(forecast.modelMetrics.projectedMonthlyRevenue)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700">
            <span>Holt-Winters OLS Math</span>
            <span className="font-semibold">Explore &rarr;</span>
          </div>
        </div>
      </div>

      {/* Critical Restock Alerts Banner if any */}
      {criticalItems.length > 0 && (
        <div className="rounded-2xl bg-white border border-amber-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-950">
                Urgent Inventory Restock Recommendations (Deterministic EOQ)
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-amber-800 font-semibold hover:underline"
            >
              Open Full EOQ Restock Sheet &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {criticalItems.map((item) => {
              const res = eoqMap.get(item.id);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-gray-900">{item.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{item.sku}</div>
                    <div className="mt-2 text-xs text-amber-900 font-medium">
                      Current: <span className="font-bold">{item.currentStock}</span> units &bull; Reorder Point: <span className="font-bold">{res?.reorderPoint}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                      {res?.urgencyLevel}
                    </span>
                    <div className="mt-2 text-[11px] text-emerald-800 font-semibold">
                      Order +{res?.eoqUnits} units
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Sales & ABC Capital Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-emerald-100 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-emerald-950">Recent Real-Time Orders</h2>
              <p className="text-[11px] text-gray-500">Sales orders automatically deduct warehouse stock</p>
            </div>
            <button
              onClick={onOpenRecordOrder}
              className="text-xs text-emerald-800 font-semibold hover:underline"
            >
              + Record Order
            </button>
          </div>

          <div className="divide-y divide-gray-100 mt-2">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-gray-900">{order.customerName}</div>
                  <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>{order.invoiceNumber}</span>
                    <span>&bull;</span>
                    <span>{new Date(order.date).toLocaleDateString('en-IN')}</span>
                    <span>&bull;</span>
                    <span className="text-emerald-700">{order.paymentMode}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs text-gray-900">{formatINR(order.grandTotal)}</div>
                  <div className="text-[10px] text-emerald-700 capitalize">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} &bull; GST incl.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Capital ABC Pareto Snapshot */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-emerald-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-emerald-950">Pareto ABC Inventory Matrix</h2>
                <p className="text-[11px] text-gray-500">Capital distribution by annual consumption</p>
              </div>
              <button
                onClick={() => onNavigateTab('abc')}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                Full Matrix &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Class A */}
              <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
                <div className="flex items-center justify-between text-xs font-semibold text-red-950">
                  <span>Class A (High Value / 80% Capital)</span>
                  <span>{abcList.filter((a) => a.classification === 'A').length} SKUs</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1">
                  Requires strict weekly cycle counts and tight supplier replenishment SLAs.
                </p>
              </div>

              {/* Class B */}
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-950">
                  <span>Class B (Moderate Value / 15% Capital)</span>
                  <span>{abcList.filter((a) => a.classification === 'B').length} SKUs</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1">
                  Standard fortnightly automated monitoring with standard safety buffers.
                </p>
              </div>

              {/* Class C */}
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-950">
                  <span>Class C (Bulk Low Value / 5% Capital)</span>
                  <span>{abcList.filter((a) => a.classification === 'C').length} SKUs</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1">
                  Bulk order replenishment to reduce purchase order overhead costs.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Computed deterministically via Pareto 80/15/5</span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="font-semibold text-emerald-800 hover:underline"
            >
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
