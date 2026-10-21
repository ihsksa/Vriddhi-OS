import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  ShieldCheck,
  QrCode,
  Layers,
  Users,
  Calculator,
  ArrowRight,
  Download,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
  Smartphone,
  FileText,
  Gift,
} from 'lucide-react';
import { formatINR } from '../utils/analyticsMath';

interface LandingPageProps {
  onGoToAuth: (mode: 'user_login' | 'user_register' | 'admin_login') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToAuth }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'dashboard' | 'inventory' | 'abc' | 'forecast'>('dashboard');

  return (
    <div className="space-y-16 py-6 pb-20">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-semibold border border-emerald-200/80">
          <Gift className="w-3.5 h-3.5 text-emerald-700" />
          <span>Special Offer: ₹0 Trial for 1 Full Month</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-emerald-950 tracking-tight leading-tight">
          Deterministic Business & Inventory Intelligence for Indian Enterprises
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Wilson Economic Order Quantity (EOQ), Pareto 80/15/5 capital classification, and Holt-Winters sales forecasting — strictly coded via non-AI deterministic mathematical algorithms.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onGoToAuth('user_register')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <span>Activate 1-Month ₹0 Trial</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onGoToAuth('user_login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-6 py-3 text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition"
          >
            <span>Merchant Sign In</span>
          </button>

          <button
            onClick={() => onGoToAuth('admin_login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Value Propositions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 text-left">
          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <Calculator className="w-5 h-5 text-emerald-700 mb-2" />
            <h3 className="text-xs font-bold text-emerald-950">Non-AI Pure Math</h3>
            <p className="text-[11px] text-gray-500 mt-1">Wilson EOQ, Pareto 80/15/5, and OLS regression.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <Lock className="w-5 h-5 text-emerald-700 mb-2" />
            <h3 className="text-xs font-bold text-emerald-950">Strict Cell Isolation</h3>
            <p className="text-[11px] text-gray-500 mt-1">Every business operates in an isolated, private database cell.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <Gift className="w-5 h-5 text-emerald-700 mb-2" />
            <h3 className="text-xs font-bold text-emerald-950">₹0 Trial for 1 Month</h3>
            <p className="text-[11px] text-gray-500 mt-1">30 days of full feature access with zero upfront fees.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <Smartphone className="w-5 h-5 text-emerald-700 mb-2" />
            <h3 className="text-xs font-bold text-emerald-950">Offline Local PWA</h3>
            <p className="text-[11px] text-gray-500 mt-1">Runs fast in browser and mobile with zero server logging.</p>
          </div>
        </div>
      </section>

      {/* DUMMY WINDOW SHOWING APPLICATION POST-SIGNIN */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center space-y-2 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Interactive User Interface Showcase
          </span>
          <h2 className="text-2xl font-bold text-emerald-950">
            How the Application Works for Users After Sign-In
          </h2>
          <p className="text-xs text-gray-500 max-w-lg mx-auto">
            Click through the interactive showcase tabs below to preview the live analytics, restock recommendations, and sales forecasts.
          </p>
        </div>

        {/* Dummy Window Container */}
        <div className="rounded-3xl border border-emerald-200/80 bg-white shadow-xl overflow-hidden">
          {/* Mock Browser Title Bar */}
          <div className="bg-emerald-950 text-white px-5 py-3 flex items-center justify-between border-b border-emerald-900">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[11px] font-mono text-emerald-200 ml-2">
                https://vridhi.app/dashboard/sample_preview
              </span>
            </div>
            <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded text-emerald-200 font-semibold uppercase">
              User Signed-In View
            </span>
          </div>

          {/* Interactive Navigation within Showcase Window */}
          <div className="flex border-b border-gray-100 bg-gray-50/60 px-4 pt-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActivePreviewTab('dashboard')}
              className={`pb-2.5 px-3 border-b-2 transition ${
                activePreviewTab === 'dashboard'
                  ? 'border-emerald-800 text-emerald-950 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              1. Real-Time Command Hub
            </button>
            <button
              onClick={() => setActivePreviewTab('inventory')}
              className={`pb-2.5 px-3 border-b-2 transition ${
                activePreviewTab === 'inventory'
                  ? 'border-emerald-800 text-emerald-950 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              2. Wilson EOQ & Reorder Point
            </button>
            <button
              onClick={() => setActivePreviewTab('abc')}
              className={`pb-2.5 px-3 border-b-2 transition ${
                activePreviewTab === 'abc'
                  ? 'border-emerald-800 text-emerald-950 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              3. Pareto ABC Capital Matrix
            </button>
            <button
              onClick={() => setActivePreviewTab('forecast')}
              className={`pb-2.5 px-3 border-b-2 transition ${
                activePreviewTab === 'forecast'
                  ? 'border-emerald-800 text-emerald-950 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              4. 30-Day Predictive Forecast
            </button>
          </div>

          {/* Window Body */}
          <div className="p-6 bg-[#fcfdfc]">
            {activePreviewTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase">Realized Sales</span>
                    <div className="mt-1 text-xl font-bold text-emerald-950">₹1,84,500</div>
                    <span className="text-[10px] text-emerald-700">14 orders recorded</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase">Inventory Value</span>
                    <div className="mt-1 text-xl font-bold text-emerald-950">₹3,40,000</div>
                    <span className="text-[10px] text-gray-500">Across catalog SKUs</span>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-amber-800 uppercase">Restock Urgency</span>
                    <div className="mt-1 text-xl font-bold text-amber-950">1 SKU Alert</div>
                    <span className="text-[10px] text-amber-700">Approaching safety buffer</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase">Next 30D Forecast</span>
                    <div className="mt-1 text-xl font-bold text-emerald-900">₹2,95,000</div>
                    <span className="text-[10px] text-emerald-700">Holt-Winters OLS Math</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-emerald-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950">Automated Inventory Restock Notification:</span>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Tellicherry Black Pepper: Stock has dropped to 8 units. Reorder Point is 18. Recommended Order Quantity is <strong>+34 units</strong>.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                    Warning
                  </span>
                </div>
              </div>
            )}

            {activePreviewTab === 'inventory' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900">
                  <span className="font-bold">Wilson EOQ Algorithm:</span> <code>EOQ = √[(2 × D × S) / H]</code> &bull; Minimizes total inventory holding and order placement costs.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 border-b">
                        <th className="p-2">Item Name</th>
                        <th className="p-2">Current Stock</th>
                        <th className="p-2">Safety Buffer</th>
                        <th className="p-2">Reorder Point (ROP)</th>
                        <th className="p-2">Optimal Batch (EOQ)</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-800">
                      <tr>
                        <td className="p-2 font-semibold">Organic Kashmiri Saffron (10g)</td>
                        <td className="p-2 font-bold">18 units</td>
                        <td className="p-2">15</td>
                        <td className="p-2">24</td>
                        <td className="p-2 font-bold text-emerald-900">+19 units</td>
                        <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">Healthy</span></td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Malabar Black Pepper (1kg)</td>
                        <td className="p-2 font-bold text-amber-800">8 units</td>
                        <td className="p-2">18</td>
                        <td className="p-2">28</td>
                        <td className="p-2 font-bold text-emerald-900">+34 units</td>
                        <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">Warning</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePreviewTab === 'abc' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                    <span className="font-bold text-red-900">Class A (Top 80% Capital)</span>
                    <p className="text-[11px] text-gray-600 mt-1">Requires weekly cycle counts and strict lead-time contracts.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="font-bold text-amber-900">Class B (Next 15% Capital)</span>
                    <p className="text-[11px] text-gray-600 mt-1">Automated fortnightly stock checks and standard buffers.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="font-bold text-emerald-900">Class C (Remaining 5%)</span>
                    <p className="text-[11px] text-gray-600 mt-1">Bulk order replenishment to reduce paperwork costs.</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'forecast' && (
              <div className="p-4 bg-white rounded-xl border border-emerald-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Deterministic Holt-Winters + OLS Regression</span>
                  <span className="font-mono text-emerald-800">R²: 0.941 &bull; Slope: +₹410/day</span>
                </div>
                <div className="h-24 w-full bg-emerald-50/50 rounded-lg flex items-center justify-center text-emerald-800 font-mono text-center px-4">
                  [Predictive SVG Curve with Upper/Lower 95% Confidence Intervals]
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 1-Month ₹0 Trial Plan Card */}
      <section className="max-w-xl mx-auto px-4 text-center space-y-4">
        <div className="rounded-3xl border-2 border-emerald-700 bg-white p-8 shadow-lg space-y-4 relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-white text-[11px] font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            <span>₹0 Trial for a Month</span>
          </span>

          <h3 className="text-2xl font-extrabold text-emerald-950">
            Full Platform Access for 30 Days
          </h3>

          <div className="text-4xl font-extrabold text-emerald-900">
            ₹0 <span className="text-sm font-normal text-gray-500">/ first month</span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
            Experience complete deterministic inventory analytics, Wilson EOQ batches, RFM customer cohorts, and formatted report downloads with zero upfront commitment.
          </p>

          <ul className="text-xs text-gray-700 space-y-2 text-left max-w-xs mx-auto pt-2">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Full Wilson EOQ & Reorder Points</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Pareto 80/15/5 ABC Capital Matrix</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Customer RFM Cohorts & LTV</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 30-Day Predictive Sales Forecast</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Formatted Document & CSV Downloads</li>
          </ul>

          <button
            onClick={() => onGoToAuth('user_register')}
            className="w-full mt-4 rounded-xl bg-emerald-800 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            <span>Activate 1-Month ₹0 Trial Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
