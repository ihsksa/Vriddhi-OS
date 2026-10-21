import React from 'react';
import { Tenant } from '../types';
import { formatINR } from '../utils/analyticsMath';
import {
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle,
} from 'lucide-react';

interface PendingApprovalViewProps {
  tenant: Tenant;
  onOpenPaymentModal: () => void;
  onPreviewSandbox: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  tenant,
  onOpenPaymentModal,
  onPreviewSandbox,
}) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Calming Welcome Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
          <Clock className="w-4 h-4 text-emerald-700 animate-pulse" />
          <span>Tenant Cell Onboarding in Progress</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-emerald-950 tracking-tight">
          Welcome, {tenant.ownerName}
        </h1>
        <p className="text-sm text-gray-600 max-w-lg mx-auto">
          Your dedicated database cell for <span className="font-semibold text-emerald-900">{tenant.businessName}</span> has been provisioned and is undergoing manual subscription verification.
        </p>
      </div>

      {/* Status Card */}
      <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <div>
            <div className="text-xs text-gray-500 uppercase font-semibold">Selected Subscription</div>
            <div className="text-lg font-bold text-emerald-950 capitalize">
              {tenant.subscription.plan} Tier &bull; {formatINR(tenant.subscription.amountMonthly, true)}/month
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>Awaiting Admin Approval</span>
          </div>
        </div>

        {/* Payment Submission Details */}
        <div className="rounded-xl bg-emerald-50/60 p-4 border border-emerald-100/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span>Submitted UPI Payment Reference</span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs bg-white p-2.5 rounded-lg border border-emerald-200/80">
            <span className="text-emerald-950 font-bold">
              {tenant.subscription.lastUpiTransactionRef || 'Pending submission'}
            </span>
            <span className="text-[11px] text-gray-400">
              {tenant.subscription.paymentSubmittedAt
                ? new Date(tenant.subscription.paymentSubmittedAt).toLocaleDateString('en-IN')
                : 'Just now'}
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Our platform admin manually audits UPI UTRs to guarantee zero fraud and verify isolated cell setup. Approvals are typically completed within 15–30 minutes during business hours.
          </p>
        </div>

        {/* What happens next */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Verification Steps
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. UTR Received</span>
              </div>
              <p className="text-[11px] text-gray-500">Your UPI reference is logged in the Admin queue.</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Admin Verification</span>
              </div>
              <p className="text-[11px] text-gray-500">Bank settlement ledger matched with your cell.</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                <span>3. Instant Activation</span>
              </div>
              <p className="text-[11px] text-gray-500">Full unlock of predictive inventory & RFM tools.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onOpenPaymentModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Re-scan UPI QR / Update UTR</span>
          </button>

          <button
            onClick={onPreviewSandbox}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <span>Explore Sandbox Mode Meanwhile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-emerald-700" />
        <span>Strict isolation: No other merchant or user can ever inspect your business data.</span>
      </div>
    </div>
  );
};
