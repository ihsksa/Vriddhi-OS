import React from 'react';
import { ABCClassificationResult, Tenant } from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import { Layers, ShieldCheck, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';

interface ABCTabProps {
  tenant: Tenant;
  abcList: ABCClassificationResult[];
  onOpenReportStudio: () => void;
}

export const ABCTab: React.FC<ABCTabProps> = ({ tenant, abcList, onOpenReportStudio }) => {
  const classA = abcList.filter((a) => a.classification === 'A');
  const classB = abcList.filter((a) => a.classification === 'B');
  const classC = abcList.filter((a) => a.classification === 'C');

  const totalMonetaryValue = abcList.reduce((sum, a) => sum + a.annualMonetaryValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
            Pareto ABC Inventory Classification
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Deterministic 80/15/5 capital distribution analysis. Prioritize warehouse attention where the money is.
          </p>
        </div>
        <button
          onClick={onOpenReportStudio}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-700" />
          <span>Export ABC Audit Sheet</span>
        </button>
      </div>

      {/* 3 Tier Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class A */}
        <div className="rounded-2xl bg-white p-5 border border-red-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-900">
              Class A Items
            </span>
            <span className="text-xs font-semibold text-gray-500">{classA.length} SKUs</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatINR(classA.reduce((sum, i) => sum + i.annualMonetaryValue, 0), true)}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Accounts for ~<strong>80% of total annual capital</strong>. Demands highest managerial control, weekly physical cycle counts, and tight supplier lead-time contracts.
          </p>
        </div>

        {/* Class B */}
        <div className="rounded-2xl bg-white p-5 border border-amber-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900">
              Class B Items
            </span>
            <span className="text-xs font-semibold text-gray-500">{classB.length} SKUs</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatINR(classB.reduce((sum, i) => sum + i.annualMonetaryValue, 0), true)}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Accounts for ~<strong>15% of total capital</strong>. Fortnightly automated monitoring with moderate safety stock buffers and standard order cycles.
          </p>
        </div>

        {/* Class C */}
        <div className="rounded-2xl bg-white p-5 border border-emerald-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-900">
              Class C Items
            </span>
            <span className="text-xs font-semibold text-gray-500">{classC.length} SKUs</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatINR(classC.reduce((sum, i) => sum + i.annualMonetaryValue, 0), true)}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Accounts for ~<strong>5% of capital</strong> despite representing large volume. Simple periodic review, bulk ordering to reduce paperwork and administrative fees.
          </p>
        </div>
      </div>

      {/* Visual Cumulative Capital Distribution Progress Bar */}
      <div className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-950">Cumulative Annual Capital Allocation</span>
          <span className="text-gray-500">Total: {formatINR(totalMonetaryValue)}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 flex overflow-hidden">
          <div
            style={{ width: `${(classA.reduce((s, i) => s + i.annualMonetaryValue, 0) / (totalMonetaryValue || 1)) * 100}%` }}
            className="bg-red-500 h-full"
            title="Class A Capital"
          />
          <div
            style={{ width: `${(classB.reduce((s, i) => s + i.annualMonetaryValue, 0) / (totalMonetaryValue || 1)) * 100}%` }}
            className="bg-amber-500 h-full"
            title="Class B Capital"
          />
          <div
            style={{ width: `${(classC.reduce((s, i) => s + i.annualMonetaryValue, 0) / (totalMonetaryValue || 1)) * 100}%` }}
            className="bg-emerald-500 h-full"
            title="Class C Capital"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>Class A (Tight Control)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Class B (Moderate Control)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Class C (Bulk Buffer)</span>
          </span>
        </div>
      </div>

      {/* Detailed Classification Table */}
      <div className="rounded-2xl bg-white border border-emerald-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-50/40 text-emerald-900 border-b border-emerald-100">
                <th className="py-3 px-4 font-semibold">Classification</th>
                <th className="py-3 px-4 font-semibold">SKU & Product Name</th>
                <th className="py-3 px-4 font-semibold">Annual Monetary Value (₹)</th>
                <th className="py-3 px-4 font-semibold">% of Capital</th>
                <th className="py-3 px-4 font-semibold">Cumulative %</th>
                <th className="py-3 px-4 font-semibold">Deterministic Management Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {abcList.map((item) => {
                const isA = item.classification === 'A';
                const isB = item.classification === 'B';

                return (
                  <tr key={item.productId} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          isA
                            ? 'bg-red-100 text-red-900'
                            : isB
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        Class {item.classification}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {formatINR(item.annualMonetaryValue)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-700">
                      {item.percentageOfTotalValue}%
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">
                      {item.cumulativePercentage}%
                    </td>
                    <td className="py-3 px-4 text-gray-600 leading-relaxed text-[11px]">
                      {item.managementPolicy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
