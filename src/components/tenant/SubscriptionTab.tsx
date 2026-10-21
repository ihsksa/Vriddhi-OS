import React from 'react';
import { Tenant, SalesOrder } from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import {
  CreditCard,
  QrCode,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  Building2,
  Sparkles,
} from 'lucide-react';

interface SubscriptionTabProps {
  tenant: Tenant;
  orders: SalesOrder[];
  onOpenPaymentModal: () => void;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({
  tenant,
  orders,
  onOpenPaymentModal,
}) => {
  const sub = tenant.subscription;
  const expiryDate = new Date(sub.expiresAt);
  const now = new Date();
  const daysRemaining = Math.max(
    Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

  const isActive = sub.status === 'active';
  const isPending = sub.status === 'pending_approval';

  // Indian GST calculations from orders
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalTaxable = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalGst = completedOrders.reduce((sum, o) => sum + o.totalGst, 0);
  const cgstLiability = Math.round(totalGst / 2);
  const sgstLiability = totalGst - cgstLiability;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
            Monthly Subscription & Business Tax Overview
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your cell's monthly recurring plan, renew via direct UPI QR, and inspect Indian GST liabilities.
          </p>
        </div>

        <button
          onClick={onOpenPaymentModal}
          className="flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          <QrCode className="w-4 h-4" />
          <span>Renew / Upgrade via UPI QR</span>
        </button>
      </div>

      {/* Subscription Status Card */}
      <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Current Active Cell Plan
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold text-emerald-950">
                {sub.plan === 'trial' ? '₹0 Trial (1 Month)' : `${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} Tier`}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${
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
                {isActive ? 'Active & Verified' : isPending ? 'Pending Admin Approval' : 'Suspended'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Dedicated Cell: {tenant.id} &bull; {formatINR(sub.amountMonthly, true)} billed monthly
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-400 font-medium">Billing Cycle Expiry</span>
            <div className="text-lg font-bold text-gray-900 font-mono mt-0.5">
              {expiryDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining in monthly cycle
            </div>
          </div>
        </div>

        {/* Payment Ref and Security Ledger */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Payment Method</div>
            <div className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Direct Merchant UPI QR</span>
            </div>
            <div className="text-[11px] text-gray-500">Zero surcharge, instant settlement</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Last Verified UTR</div>
            <div className="font-mono font-bold text-xs text-emerald-900 truncate">
              {sub.lastUpiTransactionRef || 'Pending initial entry'}
            </div>
            <div className="text-[11px] text-gray-500">
              Submitted: {sub.paymentSubmittedAt ? new Date(sub.paymentSubmittedAt).toLocaleDateString('en-IN') : 'N/A'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Tenant Cell Isolation</div>
            <div className="font-semibold text-sm text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Encrypted & Sandboxed</span>
            </div>
            <div className="text-[11px] text-gray-500">Zero data shared with other tenants</div>
          </div>
        </div>

        {/* Admin Notes if any */}
        {sub.notes && (
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Subscription Audit Log:</span> {sub.notes}
            </div>
          </div>
        )}
      </div>

      {/* Indian GST Tax Summary for Merchant */}
      <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-emerald-950">
              GST Tax Ledger Breakdown (GSTR-1 Ready)
            </h2>
            <p className="text-[11px] text-gray-500">
              Computed deterministically from sales orders for {tenant.businessName}
            </p>
          </div>
          <Receipt className="w-4 h-4 text-emerald-700" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Taxable Sales</div>
            <div className="mt-2 text-xl font-bold text-emerald-950">{formatINR(totalTaxable)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Net base revenue</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">CGST Collected</div>
            <div className="mt-2 text-xl font-bold text-emerald-950">{formatINR(cgstLiability)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Central GST liability</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">SGST Collected</div>
            <div className="mt-2 text-xl font-bold text-emerald-950">{formatINR(sgstLiability)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">State GST liability</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-100/50 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-900 uppercase">Total GST Output</div>
            <div className="mt-2 text-xl font-bold text-emerald-950">{formatINR(totalGst)}</div>
            <div className="text-[10px] text-emerald-800 mt-0.5">Ready for monthly filing</div>
          </div>
        </div>
      </div>
    </div>
  );
};
