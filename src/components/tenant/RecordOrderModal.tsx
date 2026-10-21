import React, { useState } from 'react';
import { Customer, Product, SalesOrder, Tenant } from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react';

interface RecordOrderModalProps {
  tenant: Tenant;
  products: Product[];
  customers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (order: SalesOrder) => void;
}

export const RecordOrderModal: React.FC<RecordOrderModalProps> = ({
  tenant,
  products,
  customers,
  isOpen,
  onClose,
  onSaveOrder,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NEFT' | 'Cash' | 'Card'>('UPI');
  const [items, setItems] = useState<
    { productId: string; quantity: number }[]
  >([
    {
      productId: products[0]?.id || '',
      quantity: 1,
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { productId: products[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'productId' | 'quantity',
    value: string | number
  ) => {
    const updated = [...items];
    if (field === 'productId') {
      updated[index].productId = String(value);
    } else {
      updated[index].quantity = Math.max(1, Number(value));
    }
    setItems(updated);
  };

  // Compute live totals
  let subtotal = 0;
  let totalGst = 0;

  const orderItems = items
    .map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return null;
      const itemSubtotal = prod.sellingPrice * item.quantity;
      const itemGst = (itemSubtotal * prod.gstRate) / 100;
      subtotal += itemSubtotal;
      totalGst += itemGst;

      return {
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitPrice: prod.sellingPrice,
        gstRate: prod.gstRate,
        total: Math.round(itemSubtotal + itemGst),
      };
    })
    .filter(Boolean) as SalesOrder['items'];

  const grandTotal = Math.round(subtotal + totalGst);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) return;

    const matchedCust = customers.find((c) => c.id === selectedCustomerId);
    const customerName = matchedCust ? matchedCust.name : (customCustomerName || 'Walk-in Retail Buyer');

    const newOrder: SalesOrder = {
      id: `ord_${Date.now()}`,
      tenantId: tenant.id,
      invoiceNumber: `INV/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      customerId: selectedCustomerId || 'walk_in',
      customerName,
      date: new Date().toISOString(),
      items: orderItems,
      subtotal: Math.round(subtotal),
      totalGst: Math.round(totalGst),
      grandTotal,
      status: 'completed',
      paymentMode,
    };

    onSaveOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100 my-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-700" />
            <h3 className="text-base font-bold text-emerald-950">Record Real-Time Sales Order</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Select Client / Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-hidden"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
                <option value="custom">Other / Walk-in Buyer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="NEFT">NEFT / RTGS Bank Transfer</option>
                <option value="Cash">Cash on Delivery / Direct</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          {selectedCustomerId === 'custom' && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Buyer Name</label>
              <input
                type="text"
                placeholder="Enter customer name..."
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Order Items & Inventory Deduction
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                  >
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.currentStock} in stock &bull; {formatINR(p.sellingPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        max={prod?.currentStock || 9999}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold text-center"
                        title="Quantity"
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-xs font-semibold text-emerald-950">
                      {prod ? formatINR(prod.sellingPrice * item.quantity) : '₹0'}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-gray-400 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="rounded-xl bg-emerald-50/60 p-4 border border-emerald-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-gray-600">
              <span>Taxable Subtotal:</span>
              <span className="font-mono font-medium">{formatINR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>GST (CGST + SGST):</span>
              <span className="font-mono font-medium">{formatINR(totalGst)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-emerald-950 pt-1.5 border-t border-emerald-200/60">
              <span>Grand Total Payable:</span>
              <span className="font-mono">{formatINR(grandTotal)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              Confirm & Deduct Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
