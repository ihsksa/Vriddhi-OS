import {
  Tenant,
  Product,
  Customer,
  SalesOrder,
  EOQResult,
  ABCClassificationResult,
  RFMCustomerResult,
  PredictiveSalesForecast,
} from '../types';
import { formatINR } from './analyticsMath';

/**
 * Download a formatted text/CSV file to the user's system
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download Admin Data: Platform Merchants, Subscriptions, and MRR Ledger
 */
export function exportAdminPlatformDataCSV(tenants: Tenant[]) {
  const headers = [
    'Cell ID',
    'Business Name',
    'Owner Name',
    'Email',
    'Phone',
    'City',
    'State',
    'Plan Tier',
    'Monthly Fee (INR)',
    'Subscription Status',
    'Payment Method',
    'UPI Transaction Ref / UTR',
    'Started Date',
    'Expiry / Renewal Date',
    'Created At',
  ];

  const rows = tenants.map((t) => [
    `"${t.id}"`,
    `"${t.businessName.replace(/"/g, '""')}"`,
    `"${t.ownerName.replace(/"/g, '""')}"`,
    `"${t.email}"`,
    `"${t.phone}"`,
    `"${t.city}"`,
    `"${t.state}"`,
    `"${t.subscription.plan.toUpperCase()}"`,
    t.subscription.amountMonthly,
    `"${t.subscription.status.toUpperCase()}"`,
    `"${t.subscription.paymentMethod}"`,
    `"${t.subscription.lastUpiTransactionRef || 'N/A'}"`,
    `"${t.subscription.startedAt.split('T')[0]}"`,
    `"${t.subscription.expiresAt.split('T')[0]}"`,
    `"${t.createdAt.split('T')[0]}"`,
  ].join(','));

  const totalMRR = tenants
    .filter((t) => t.subscription.status === 'active')
    .reduce((sum, t) => sum + t.subscription.amountMonthly, 0);

  const content = [
    `# VRIDHI OS - MASTER SUPER ADMIN PLATFORM AUDIT LEDGER`,
    `# Master Administrator: s26608934archana@gmail.com`,
    `# Exported On: ${new Date().toLocaleString('en-IN')}`,
    `# Total Registered Tenants: ${tenants.length}`,
    `# Total Active Monthly Recurring Revenue (MRR): INR ${totalMRR}`,
    '',
    headers.join(','),
    ...rows,
  ].join('\n');

  downloadFile(`Vridhi_Admin_Platform_Ledger_${new Date().toISOString().split('T')[0]}.csv`, content);
}

/**
 * Generate formatted CSV for Inventory ABC & EOQ Audit
 */
export function exportInventoryAuditCSV(
  tenant: Tenant,
  products: Product[],
  eoqMap: Map<string, EOQResult>,
  abcList: ABCClassificationResult[]
) {
  const abcMap = new Map(abcList.map((a) => [a.productId, a]));

  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'HSN Code',
    'Current Stock',
    'Safety Stock',
    'Reorder Point (ROP)',
    'EOQ Optimal Batch',
    'Stock Runway (Days)',
    'Restock Recommended',
    'Urgency Status',
    'Unit Cost (INR)',
    'Selling Price (INR)',
    'Annual Consumption Value (INR)',
    'ABC Class',
    'Management Policy',
  ];

  const rows = products.map((p) => {
    const eoq = eoqMap.get(p.id);
    const abc = abcMap.get(p.id);

    return [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.hsnCode || 'N/A'}"`,
      p.currentStock,
      eoq?.safetyStock ?? p.minSafetyStock,
      eoq?.reorderPoint ?? 0,
      eoq?.eoqUnits ?? 0,
      eoq?.daysOfInventoryLeft ?? 0,
      eoq?.isRestockRecommended ? 'YES' : 'NO',
      `"${eoq?.urgencyLevel ?? 'Healthy'}"`,
      p.unitCost,
      p.sellingPrice,
      abc?.annualMonetaryValue ?? p.unitCost * p.annualDemandEstimate,
      `"${abc?.classification ?? 'C'}"`,
      `"${(abc?.managementPolicy ?? '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const content = [
    `# Vridhi OS - Deterministic Inventory & EOQ Audit Report`,
    `# Business: ${tenant.businessName}`,
    `# Generated On: ${new Date().toLocaleString('en-IN')}`,
    `# Total SKUs Analyzed: ${products.length}`,
    '',
    headers.join(','),
    ...rows,
  ].join('\n');

  downloadFile(`${tenant.businessName.replace(/\s+/g, '_')}_Inventory_EOQ_Audit.csv`, content);
}

/**
 * Generate formatted CSV for Customer RFM & LTV Ledger
 */
export function exportCustomerRFMCSV(
  tenant: Tenant,
  customers: Customer[],
  rfmList: RFMCustomerResult[]
) {
  const rfmMap = new Map(rfmList.map((r) => [r.customerId, r]));

  const headers = [
    'Customer Name',
    'Phone',
    'Email',
    'City',
    'State',
    'Customer Since',
    'Total Completed Orders',
    'Lifetime Spend (INR)',
    'Recency (Days)',
    'R-Score (1-5)',
    'F-Score (1-5)',
    'M-Score (1-5)',
    'RFM Segment',
    'Deterministic LTV (INR)',
    'Churn Risk %',
  ];

  const rows = customers.map((c) => {
    const rfm = rfmMap.get(c.id);

    return [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.city}"`,
      `"${c.state}"`,
      `"${c.customerSince}"`,
      rfm?.frequencyCount ?? 0,
      rfm?.monetaryTotal ?? 0,
      rfm?.recencyDays ?? 0,
      rfm?.rScore ?? 1,
      rfm?.fScore ?? 1,
      rfm?.mScore ?? 1,
      `"${rfm?.rfmSegment ?? 'New'}"`,
      rfm?.predictedLTV ?? 0,
      `${rfm?.churnRiskPercent ?? 5}%`,
    ].join(',');
  });

  const content = [
    `# Vridhi OS - Customer RFM Segmentation & Lifetime Value Report`,
    `# Business: ${tenant.businessName}`,
    `# Generated On: ${new Date().toLocaleString('en-IN')}`,
    `# Total Customers: ${customers.length}`,
    '',
    headers.join(','),
    ...rows,
  ].join('\n');

  downloadFile(`${tenant.businessName.replace(/\s+/g, '_')}_Customer_RFM_LTV.csv`, content);
}

/**
 * Generate formatted Sales Ledger CSV
 */
export function exportSalesLedgerCSV(tenant: Tenant, orders: SalesOrder[]) {
  const headers = [
    'Invoice Number',
    'Date',
    'Customer Name',
    'Payment Mode',
    'Status',
    'Subtotal Taxable (INR)',
    'CGST (INR)',
    'SGST (INR)',
    'Total Tax (INR)',
    'Grand Total (INR)',
  ];

  const rows = orders.map((o) => {
    const cgst = Math.round(o.totalGst / 2);
    const sgst = o.totalGst - cgst;

    return [
      `"${o.invoiceNumber}"`,
      `"${o.date.split('T')[0]}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.paymentMode}"`,
      `"${o.status}"`,
      o.subtotal,
      cgst,
      sgst,
      o.totalGst,
      o.grandTotal,
    ].join(',');
  });

  const content = [
    `# Vridhi OS - Sales Compliance Ledger`,
    `# Business: ${tenant.businessName}`,
    `# Total Orders: ${orders.length}`,
    `# Generated On: ${new Date().toLocaleString('en-IN')}`,
    '',
    headers.join(','),
    ...rows,
  ].join('\n');

  downloadFile(`${tenant.businessName.replace(/\s+/g, '_')}_Sales_Ledger.csv`, content);
}

/**
 * Generate a complete, beautifully formatted print/download Executive Intelligence Report (HTML Document)
 */
export function generatePrintableExecutiveReport(
  tenant: Tenant,
  products: Product[],
  customers: Customer[],
  orders: SalesOrder[],
  eoqMap: Map<string, EOQResult>,
  abcList: ABCClassificationResult[],
  rfmList: RFMCustomerResult[],
  forecast: PredictiveSalesForecast
) {
  const totalInventoryValuation = products.reduce((sum, p) => sum + p.currentStock * p.unitCost, 0);
  const totalRevenue = orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.grandTotal, 0);
  const criticalRestockCount = Array.from(eoqMap.values()).filter((e) => e.urgencyLevel === 'Critical' || e.urgencyLevel === 'Warning').length;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${tenant.businessName} - Executive Business & Inventory Audit</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #064e3b;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #059669;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      color: #064e3b;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #047857;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #374151;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 14px;
    }
    .kpi-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #047857;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 700;
      color: #064e3b;
      margin-top: 6px;
    }
    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #064e3b;
      border-left: 4px solid #059669;
      padding-left: 10px;
      margin-top: 28px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 24px;
    }
    th {
      background: #f0fdf4;
      color: #064e3b;
      font-weight: 600;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #86efac;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
    }
    .badge-a { background: #fee2e2; color: #991b1b; }
    .badge-b { background: #fef3c7; color: #92400e; }
    .badge-c { background: #e0f2fe; color: #075985; }
    .badge-crit { background: #fee2e2; color: #b91c1c; }
    .badge-warn { background: #fef3c7; color: #d97706; }
    .badge-ok { background: #dcfce7; color: #15803d; }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      font-size: 11px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">${tenant.businessName}</h1>
      <div class="brand-subtitle">Automated Executive Intelligence Report &bull; Powered by Vridhi OS</div>
      <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">
        Owner: <strong>${tenant.ownerName}</strong> &bull; Location: ${tenant.city}, ${tenant.state}
      </div>
    </div>
    <div class="meta-box">
      <div><strong>Report Ref:</strong> VRD-${Date.now().toString().slice(-6)}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
      <div><strong>Tenancy:</strong> Cell ${tenant.id} (${tenant.subscription.plan.toUpperCase()} Tier)</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Realized Revenue</div>
      <div class="kpi-value">${formatINR(totalRevenue)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Warehouse Inventory Value</div>
      <div class="kpi-value">${formatINR(totalInventoryValuation)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Critical / Warning Restocks</div>
      <div class="kpi-value" style="color: ${criticalRestockCount > 0 ? '#b91c1c' : '#064e3b'}">${criticalRestockCount} SKUs</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">30-Day Projected Revenue</div>
      <div class="kpi-value">${formatINR(forecast.modelMetrics.projectedMonthlyRevenue)}</div>
    </div>
  </div>

  <h2>1. Deterministic Inventory Restock Schedule & EOQ (Wilson Formula)</h2>
  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Product Name</th>
        <th>Stock</th>
        <th>Safety Stock</th>
        <th>Reorder Point</th>
        <th>Optimal EOQ</th>
        <th>Runway</th>
        <th>Urgency</th>
      </tr>
    </thead>
    <tbody>
      ${products.map((p) => {
        const eoq = eoqMap.get(p.id);
        const urgencyClass = eoq?.urgencyLevel === 'Critical' ? 'badge-crit' : eoq?.urgencyLevel === 'Warning' ? 'badge-warn' : 'badge-ok';
        return `
          <tr>
            <td><strong>${p.sku}</strong></td>
            <td>${p.name}</td>
            <td><strong>${p.currentStock}</strong></td>
            <td>${eoq?.safetyStock ?? p.minSafetyStock}</td>
            <td>${eoq?.reorderPoint ?? 0}</td>
            <td>${eoq?.eoqUnits ?? 0} units</td>
            <td>${eoq?.daysOfInventoryLeft ?? 0} days</td>
            <td><span class="badge ${urgencyClass}">${eoq?.urgencyLevel ?? 'Healthy'}</span></td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>2. Pareto ABC Classification (80 / 15 / 5 Capital Distribution)</h2>
  <table>
    <thead>
      <tr>
        <th>Class</th>
        <th>Product Name</th>
        <th>SKU</th>
        <th>Annual Value</th>
        <th>% of Total</th>
        <th>Management Policy</th>
      </tr>
    </thead>
    <tbody>
      ${abcList.map((a) => {
        const cls = a.classification === 'A' ? 'badge-a' : a.classification === 'B' ? 'badge-b' : 'badge-c';
        return `
          <tr>
            <td><span class="badge ${cls}">Class ${a.classification}</span></td>
            <td><strong>${a.productName}</strong></td>
            <td>${a.sku}</td>
            <td>${formatINR(a.annualMonetaryValue)}</td>
            <td>${a.percentageOfTotalValue}%</td>
            <td style="font-size: 11px; color: #4b5563;">${a.managementPolicy}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>3. Top Customer Cohorts & Deterministic RFM Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Customer</th>
        <th>City</th>
        <th>Orders</th>
        <th>Lifetime Spend</th>
        <th>Recency</th>
        <th>Segment</th>
        <th>Predicted LTV</th>
        <th>Churn Risk</th>
      </tr>
    </thead>
    <tbody>
      ${rfmList.slice(0, 8).map((r) => `
        <tr>
          <td><strong>${r.customerName}</strong></td>
          <td>${r.city}</td>
          <td>${r.frequencyCount}</td>
          <td>${formatINR(r.monetaryTotal)}</td>
          <td>${r.recencyDays}d ago</td>
          <td><strong>${r.rfmSegment}</strong></td>
          <td>${formatINR(r.predictedLTV)}</td>
          <td style="color: ${r.churnRiskPercent > 60 ? '#b91c1c' : '#047857'}">${r.churnRiskPercent}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>4. Predictive Revenue Forecast (Holt-Winters & OLS Linear Regression)</h2>
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; font-size: 12px; margin-bottom: 20px;">
    <strong>Model Math R²:</strong> ${forecast.modelMetrics.rSquared} &bull; 
    <strong>Trend Slope (m):</strong> ₹${forecast.modelMetrics.slope}/day &bull; 
    <strong>Holt Smoothing α:</strong> ${forecast.modelMetrics.holtAlpha} &bull; 
    <strong>Holt Trend β:</strong> ${forecast.modelMetrics.holtBeta} &bull; 
    <strong>Standard Error:</strong> ±${formatINR(forecast.modelMetrics.standardError)}
    <div style="margin-top: 4px; color: #064e3b;">
      Projected Next 30-Day Revenue: <strong>${formatINR(forecast.modelMetrics.projectedMonthlyRevenue)}</strong> (Confidence Interval: 95%)
    </div>
  </div>

  <div class="footer">
    <div>Generated strictly via deterministic mathematical algorithms. Zero third-party telemetry.</div>
    <div>Confidential &bull; ${tenant.businessName} &bull; Page 1 of 1</div>
  </div>
</body>
</html>
  `;

  downloadFile(`${tenant.businessName.replace(/\s+/g, '_')}_Executive_Audit_Report.html`, html, 'text/html;charset=utf-8;');
}
