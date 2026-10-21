import React, { useState } from 'react';
import {
  Tenant,
  Product,
  Customer,
  SalesOrder,
  EOQResult,
  ABCClassificationResult,
  RFMCustomerResult,
  PredictiveSalesForecast,
} from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import {
  exportInventoryAuditCSV,
  exportCustomerRFMCSV,
  exportSalesLedgerCSV,
  generatePrintableExecutiveReport,
} from '../../utils/reportExporter';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Users,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface ReportStudioTabProps {
  tenant: Tenant;
  products: Product[];
  customers: Customer[];
  orders: SalesOrder[];
  eoqMap: Map<string, EOQResult>;
  abcList: ABCClassificationResult[];
  rfmList: RFMCustomerResult[];
  forecast: PredictiveSalesForecast;
}

export const ReportStudioTab: React.FC<ReportStudioTabProps> = ({
  tenant,
  products,
  customers,
  orders,
  eoqMap,
  abcList,
  rfmList,
  forecast,
}) => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const notify = (msg: string) => {
    setDownloadNotice(msg);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const handleDownloadExecutiveReport = () => {
    generatePrintableExecutiveReport(
      tenant,
      products,
      customers,
      orders,
      eoqMap,
      abcList,
      rfmList,
      forecast
    );
    notify('Executive Intelligence Document generated and downloaded.');
  };

  const handleDownloadInventoryCSV = () => {
    exportInventoryAuditCSV(tenant, products, eoqMap, abcList);
    notify('Inventory & Wilson EOQ Audit CSV downloaded.');
  };

  const handleDownloadCustomerCSV = () => {
    exportCustomerRFMCSV(tenant, customers, rfmList);
    notify('Customer RFM Segmentation & LTV CSV downloaded.');
  };

  const handleDownloadSalesCSV = () => {
    exportSalesLedgerCSV(tenant, orders);
    notify('Sales & GST Tax Ledger CSV downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
            Report Studio & Formatted Document Exporter
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Export production-ready audit sheets, tax ledgers, and printable executive summaries.
          </p>
        </div>
      </div>

      {downloadNotice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Featured: Executive Printable Intelligence Report */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 sm:p-8 shadow-md">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span>Primary Formatted Document</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Complete Executive Business & Inventory Audit
          </h2>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            A comprehensive, professionally styled multi-section intelligence brief formatted for A4 printing and PDF export. Includes Wilson EOQ inventory replenishment tables, 80/15/5 Pareto capital distribution, top customer RFM matrices, and 30-day deterministic revenue forecasts.
          </p>

          <div className="pt-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadExecutiveReport}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-emerald-950 font-bold px-5 py-2.5 text-xs shadow-sm hover:bg-emerald-400 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Formatted Executive Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Structured CSV & Excel Exports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Inventory & EOQ CSV */}
        <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-emerald-950">
              Inventory & EOQ Audit Sheet
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Complete inventory valuation, safety stocks, Wilson EOQ batches, HSN codes, and days of runway for all {products.length} SKUs.
            </p>
          </div>
          <button
            onClick={handleDownloadInventoryCSV}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Spreadsheet</span>
          </button>
        </div>

        {/* Customer RFM & LTV CSV */}
        <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-emerald-950">
              Customer RFM & LTV Ledger
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Customer order frequency, lifetime spend in ₹, recency days, 1-5 cohort scoring, churn risk %, and deterministic Lifetime Value.
            </p>
          </div>
          <button
            onClick={handleDownloadCustomerCSV}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Spreadsheet</span>
          </button>
        </div>

        {/* Sales & GST Ledger CSV */}
        <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-emerald-950">
              Sales & GST Compliance Ledger
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              All processed customer invoices with taxable subtotal, CGST, SGST, grand total, and payment modes for monthly Indian tax filing.
            </p>
          </div>
          <button
            onClick={handleDownloadSalesCSV}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* Local Privacy Assurance */}
      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-gray-600 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
        <span>
          <strong>Zero Server Logging:</strong> All calculations, documents, and reports are formatted and constructed directly in your browser. No business data leaves your local device.
        </span>
      </div>
    </div>
  );
};
