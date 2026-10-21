import React, { useState } from 'react';
import { generateQRCodeMatrix } from '../utils/qrCodeGenerator';
import { SubscriptionTier, Tenant } from '../types';
import { formatINR } from '../utils/analyticsMath';
import { StorageService } from '../services/storageService';
import {
  X,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Building2,
  Clock,
  ExternalLink,
  Gift,
} from 'lucide-react';

interface UPIPaymentModalProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmitted: () => void;
  defaultPlan?: SubscriptionTier;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onPaymentSubmitted,
  defaultPlan = 'trial',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(defaultPlan);
  const [upiRef, setUpiRef] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const planDetails: Record<
    SubscriptionTier,
    { name: string; price: number; desc: string; features: string[] }
  > = {
    trial: {
      name: '₹0 Trial (1 Month)',
      price: 0,
      desc: '30-day full access with zero upfront fees',
      features: ['All Wilson EOQ algorithms', 'Pareto ABC classification', 'Predictive demand forecasting'],
    },
    starter: {
      name: 'Starter Tier',
      price: 999,
      desc: 'Ideal for small Indian retailers and emerging shops',
      features: ['Up to 250 SKUs', 'Basic EOQ Restock Alerts', 'Standard Sales Report', 'Local Offline Cache'],
    },
    pro: {
      name: 'Growth / Pro Tier',
      price: 2499,
      desc: 'For scaling distributors and multi-channel merchants',
      features: [
        'Up to 1,500 SKUs',
        'Deterministic Holt-Winters Demand Forecasting',
        'Pareto ABC Inventory Classification',
        'RFM Customer Cohort Segmentation',
        'Executive PDF & Audit Export',
      ],
    },
    enterprise: {
      name: 'Enterprise Cell',
      price: 4999,
      desc: 'Unlimited scale with isolated custom warehouse matrices',
      features: [
        'Unlimited Products & Orders',
        'Custom Service-Level (99% Z-factor)',
        'Multi-Warehouse Reorder Optimization',
        'Dedicated Priority Onboarding',
      ],
    },
  };

  const amount = planDetails[selectedPlan]?.price ?? 0;
  const merchantVpa = 'vridhi.pay@icici';
  const merchantName = 'Vridhi Business OS';
  const upiPayload = `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
    `Vridhi ${selectedPlan.toUpperCase()} Monthly Sub`
  )}`;

  // Generate QR Code matrix
  const qrMatrix = generateQRCodeMatrix(upiPayload);
  const matrixSize = qrMatrix.length;

  const copyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount > 0 && (!upiRef.trim() || upiRef.trim().length < 6)) {
      setErrorMsg('Please enter a valid 12-digit UPI Reference / UTR number from your payment app.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const txnRef = amount === 0 ? 'FREE-TRIAL-30D' : upiRef.trim();
      StorageService.renewTenantSubscription(tenant.id, selectedPlan, txnRef);
      setSuccessMsg(amount === 0 ? '₹0 1-Month Trial activated successfully!' : 'Payment reference submitted! Verification underway.');
      setTimeout(() => {
        setIsSubmitting(false);
        onPaymentSubmitted();
        onClose();
      }, 1200);
    } catch {
      setErrorMsg('Could not update subscription. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-emerald-200">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Plan Selection & UPI Payment</h3>
              <p className="text-xs text-emerald-200/80">Select plan or renew via direct merchant settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Plan Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-emerald-900 block mb-2.5">
              Select Subscription Plan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['trial', 'starter', 'pro', 'enterprise'] as SubscriptionTier[]).map((tier) => {
                const isSelected = selectedPlan === tier;
                const info = planDetails[tier];
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedPlan(tier)}
                    className={`relative text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-700'
                        : 'border-gray-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    {tier === 'trial' && (
                      <span className="absolute -top-2 right-2 bg-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        ₹0 Trial
                      </span>
                    )}
                    <div className="text-xs font-semibold text-emerald-950">{info.name}</div>
                    <div className="mt-1 text-sm font-bold text-emerald-900">
                      {info.price === 0 ? '₹0' : formatINR(info.price, true)}
                      <span className="text-[10px] font-normal text-gray-500">/mo</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {amount === 0 ? (
            /* TRIAL 1-MONTH FREE DISPLAY */
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <Gift className="w-4 h-4 text-emerald-700" />
                <span>₹0 1-Month Free Trial Selected</span>
              </div>
              <p className="text-gray-600">
                No payment or UPI transfer required. Clicking activate below extends your trial for 30 full days immediately.
              </p>
            </div>
          ) : (
            /* PAID PLAN UPI QR DISPLAY */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-xl bg-emerald-50/50 p-5 border border-emerald-100">
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-emerald-200/80">
                  <svg
                    viewBox={`0 0 ${matrixSize} ${matrixSize}`}
                    className="w-40 h-40 shape-rendering-crispEdges"
                  >
                    {qrMatrix.map((row, r) =>
                      row.map((cell, c) =>
                        cell ? (
                          <rect
                            key={`${r}-${c}`}
                            x={c}
                            y={r}
                            width="1"
                            height="1"
                            fill="#064e3b"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
                <span className="mt-2 text-[10px] font-medium text-emerald-800 text-center">
                  Scan via GPay / PhonePe / Paytm / BHIM
                </span>
              </div>

              <div className="md:col-span-7 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                  <span className="text-xs text-gray-600">Total Payable:</span>
                  <span className="text-lg font-bold text-emerald-950">{formatINR(amount, true)}</span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Merchant UPI VPA</span>
                  <div className="mt-1 flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-emerald-200">
                    <span className="font-mono text-xs font-semibold text-emerald-950">{merchantVpa}</span>
                    <button
                      type="button"
                      onClick={copyVpa}
                      className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 hover:text-emerald-950"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    After paying, enter the <strong>12-digit UTR reference</strong> below to submit for verification.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {amount > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-800 block mb-1">
                  12-Digit UPI Transaction Reference (UTR) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 428901239845"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
                {successMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {isSubmitting
                  ? 'Saving...'
                  : amount === 0
                  ? 'Activate 1-Month ₹0 Trial'
                  : 'Submit UPI Reference'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
