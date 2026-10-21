import React, { useState } from 'react';
import { Product, Tenant, EOQResult } from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  RotateCw,
  Edit2,
  Trash2,
  Calculator,
  CheckCircle2,
  X,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface InventoryTabProps {
  tenant: Tenant;
  products: Product[];
  eoqMap: Map<string, EOQResult>;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestockProduct: (productId: string, quantityToAdd: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  tenant,
  products,
  eoqMap,
  onSaveProduct,
  onDeleteProduct,
  onRestockProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Restock modal state
  const [restockModalItem, setRestockModalItem] = useState<{
    product: Product;
    eoq: EOQResult;
  } | null>(null);
  const [customRestockQty, setCustomRestockQty] = useState<number>(0);

  // Form fields
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    category: 'General',
    hsnCode: '',
    currentStock: 50,
    minSafetyStock: 15,
    leadTimeDays: 7,
    unitCost: 500,
    sellingPrice: 850,
    gstRate: 18,
    supplierName: '',
    annualDemandEstimate: 500,
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    const res = eoqMap.get(p.id);
    const matchesUrgency = urgencyFilter === 'all' || res?.urgencyLevel === urgencyFilter;

    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'General Spices',
      hsnCode: '091000',
      currentStock: 30,
      minSafetyStock: 15,
      leadTimeDays: 7,
      unitCost: 500,
      sellingPrice: 800,
      gstRate: tenant.settings.defaultGstPercent,
      supplierName: 'Direct Regional Supplier',
      annualDemandEstimate: 600,
      historicalSalesLast30Days: [2, 1, 3, 2, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 2],
    });
    setShowProductModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowProductModal(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
      tenantId: tenant.id,
      sku: formData.sku || 'SKU-UNKNOWN',
      name: formData.name || 'Unnamed Product',
      category: formData.category || 'General',
      hsnCode: formData.hsnCode || '9999',
      currentStock: Number(formData.currentStock) || 0,
      minSafetyStock: Number(formData.minSafetyStock) || 10,
      leadTimeDays: Number(formData.leadTimeDays) || 7,
      unitCost: Number(formData.unitCost) || 100,
      sellingPrice: Number(formData.sellingPrice) || 150,
      gstRate: Number(formData.gstRate) || 18,
      supplierName: formData.supplierName || 'Primary Supplier',
      annualDemandEstimate: Number(formData.annualDemandEstimate) || 400,
      historicalSalesLast30Days: editingProduct?.historicalSalesLast30Days || [2, 2, 1, 3, 2, 2, 1, 3, 2, 2, 1, 3, 2, 2, 1, 3, 2, 2, 1, 3, 2, 2, 1, 3, 2, 2, 1, 3, 2, 2],
      lastRestockedDate: new Date().toISOString().split('T')[0],
      notes: formData.notes,
    };

    onSaveProduct(newProd);
    setShowProductModal(false);
  };

  const handleOpenRestock = (product: Product) => {
    const eoq = eoqMap.get(product.id);
    if (!eoq) return;
    setRestockModalItem({ product, eoq });
    setCustomRestockQty(eoq.eoqUnits);
  };

  const handleConfirmRestock = () => {
    if (!restockModalItem || customRestockQty <= 0) return;
    onRestockProduct(restockModalItem.product.id, customRestockQty);
    setRestockModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
            Inventory & Deterministic EOQ Engine
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Calculated via Wilson's Economic Order Quantity & Safety Stock formulas. Zero AI hallucinations.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product SKU</span>
        </button>
      </div>

      {/* Deterministic Math Explainer Box */}
      <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-200/60 text-emerald-900 shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">Wilson EOQ Formula:</span>{' '}
            <code className="bg-white/80 px-2 py-0.5 rounded font-mono font-semibold">
              EOQ = √[(2 × D × S) / H]
            </code>{' '}
            &bull; <span className="font-bold">Reorder Point:</span>{' '}
            <code className="bg-white/80 px-2 py-0.5 rounded font-mono font-semibold">
              ROP = (d × L) + SafetyStock
            </code>
            <p className="text-[11px] text-emerald-800/90 mt-0.5">
              Where D = Annual Demand, S = Setup Cost (₹{tenant.settings.defaultOrderCost}), H = Annual Holding Cost ({tenant.settings.annualHoldingCostPercent}%), L = Vendor Lead Time, d = Daily Velocity.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SKU, product title, HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-hidden focus:border-emerald-600"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-hidden focus:border-emerald-600"
          >
            <option value="all">All Restock Statuses</option>
            <option value="Critical">Critical Only</option>
            <option value="Warning">Warning Only</option>
            <option value="Healthy">Healthy Stock</option>
            <option value="Overstocked">Overstocked</option>
          </select>
        </div>
      </div>

      {/* Inventory & EOQ Table */}
      <div className="rounded-2xl bg-white border border-emerald-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-50/40 text-emerald-900 border-b border-emerald-100">
                <th className="py-3 px-4 font-semibold">SKU & Product</th>
                <th className="py-3 px-4 font-semibold">Current Stock</th>
                <th className="py-3 px-4 font-semibold">Safety Stock</th>
                <th className="py-3 px-4 font-semibold">Reorder Point (ROP)</th>
                <th className="py-3 px-4 font-semibold">Optimal EOQ Batch</th>
                <th className="py-3 px-4 font-semibold">Runway</th>
                <th className="py-3 px-4 font-semibold">Pricing (₹)</th>
                <th className="py-3 px-4 font-semibold">Restock Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const eoq = eoqMap.get(p.id);
                  const isCrit = eoq?.urgencyLevel === 'Critical';
                  const isWarn = eoq?.urgencyLevel === 'Warning';
                  const isOver = eoq?.urgencyLevel === 'Overstocked';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {p.sku} &bull; HSN: {p.hsnCode} &bull; {p.category}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold text-sm ${isCrit ? 'text-red-700' : isWarn ? 'text-amber-700' : 'text-emerald-950'}`}>
                          {p.currentStock}
                        </span>{' '}
                        <span className="text-[11px] text-gray-400">units</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {eoq?.safetyStock ?? p.minSafetyStock} units
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        {eoq?.reorderPoint ?? 0} units
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{eoq?.eoqUnits ?? 0} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${eoq && eoq.daysOfInventoryLeft <= 10 ? 'text-red-600' : 'text-gray-700'}`}>
                          {eoq?.daysOfInventoryLeft ?? 0} days
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{formatINR(p.sellingPrice)}</div>
                        <div className="text-[10px] text-gray-400">Cost: {formatINR(p.unitCost)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isCrit
                              ? 'bg-red-100 text-red-800'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800'
                              : isOver
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCrit ? 'bg-red-600' : isWarn ? 'bg-amber-600' : isOver ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          />
                          {eoq?.urgencyLevel || 'Healthy'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRestock(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs transition"
                            title="Restock optimal EOQ batch"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 rounded-lg text-gray-500 hover:text-emerald-800 hover:bg-gray-100"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete SKU ${p.sku} (${p.name})?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-700 hover:bg-red-50"
                            title="Delete SKU"
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

      {/* Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-700" />
                <h3 className="text-base font-bold text-emerald-950">Restock Warehouse Stock</h3>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-gray-500">Product SKU</span>
                <div className="font-semibold text-gray-900">{restockModalItem.product.name}</div>
                <div className="font-mono text-xs text-gray-400">{restockModalItem.product.sku}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                <div>
                  <span className="text-gray-500">Current Stock:</span>
                  <div className="font-bold text-emerald-950">{restockModalItem.product.currentStock} units</div>
                </div>
                <div>
                  <span className="text-gray-500">Optimal Wilson EOQ:</span>
                  <div className="font-bold text-emerald-900">+{restockModalItem.eoq.eoqUnits} units</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Quantity to Add (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={customRestockQty}
                  onChange={(e) => setCustomRestockQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-emerald-600 focus:outline-hidden"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  New resulting stock level will be {restockModalItem.product.currentStock + customRestockQty} units.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestock}
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Confirm Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-emerald-950">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Inventory SKU'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Annual Demand Est.</label>
                  <input
                    type="number"
                    min="10"
                    value={formData.annualDemandEstimate}
                    onChange={(e) => setFormData({ ...formData, annualDemandEstimate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Commodities & Food)</option>
                    <option value="12">12% (Standard Spices/Goods)</option>
                    <option value="18">18% (Manufactured/Electronics)</option>
                    <option value="28">28% (Luxury)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Inventory SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
