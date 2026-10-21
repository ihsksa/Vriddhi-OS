import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

/**
 * Format currency for PDF outputs cleanly without font glyph encoding issues
 */
function formatPdfCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'INR 0';
  return `INR ${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Download a generic blob file
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
 * GENERATE PURE CLIENT-SIDE EXECUTIVE PDF REPORT
 * (Zero Codex, Zero AI, Pure Deterministic Client-Side Engine via jsPDF)
 */
export function generateExecutivePDFReport(
  tenant: Tenant,
  products: Product[],
  customers: Customer[],
  orders: SalesOrder[],
  eoqMap: Map<string, EOQResult>,
  abcList: ABCClassificationResult[],
  rfmList: RFMCustomerResult[],
  forecast: PredictiveSalesForecast
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalInventoryValuation = products.reduce((sum, p) => sum + p.currentStock * p.unitCost, 0);
  const totalRevenue = orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.grandTotal, 0);
  const criticalRestockCount = Array.from(eoqMap.values()).filter(
    (e) => e.urgencyLevel === 'Critical' || e.urgencyLevel === 'Warning'
  ).length;

  const primaryEmerald: [number, number, number] = [6, 78, 59]; // #064e3b
  const accentGreen: [number, number, number] = [5, 150, 105]; // #059669
  const lightMint: [number, number, number] = [240, 253, 244]; // #f0fdf4
  const darkText: [number, number, number] = [31, 41, 55]; // #1f2937

  // --- HEADER BANNER ---
  doc.setFillColor(...primaryEmerald);
  doc.rect(0, 0, 210, 26, 'F');

  // Title in banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VRIDHI OS  |  EXECUTIVE INTELLIGENCE AUDIT', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text(
    'Deterministic Non-AI Business & Inventory Analytics • Pure Client-Side Generation',
    14,
    18
  );

  // Tenant Metadata Card
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(tenant.businessName, 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Proprietor: ${tenant.ownerName}  |  Location: ${tenant.city}, ${tenant.state}`, 14, 39);
  doc.text(
    `Isolated Cell ID: ${tenant.id}  |  Monthly Plan: ${tenant.subscription.plan.toUpperCase()}  |  Cycle Expiry: ${tenant.subscription.expiresAt.split('T')[0]}`,
    14,
    44
  );

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated On: ${dateStr}  |  Currency: INR (Rs.)`, 196, 39, { align: 'right' });
  doc.text(`Report Ref: VRD-${Date.now().toString().slice(-6)}`, 196, 44, { align: 'right' });

  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 47, 196, 47);

  // --- KPI CARDS (4 Columns) ---
  const kpiY = 51;
  const kpiW = 43;
  const kpiH = 18;

  const kpis = [
    { label: 'REALIZED REVENUE', value: formatPdfCurrency(totalRevenue), sub: `${orders.length} orders recorded` },
    { label: 'WAREHOUSE VALUE', value: formatPdfCurrency(totalInventoryValuation), sub: `${products.length} SKUs total` },
    {
      label: 'RESTOCK URGENCY',
      value: `${criticalRestockCount} SKUs`,
      sub: criticalRestockCount > 0 ? 'Approaching safety stock' : 'Optimal levels',
      alert: criticalRestockCount > 0,
    },
    {
      label: '30-DAY FORECAST',
      value: formatPdfCurrency(forecast.modelMetrics.projectedMonthlyRevenue),
      sub: `OLS R² = ${forecast.modelMetrics.rSquared}`,
    },
  ];

  kpis.forEach((kpi, index) => {
    const x = 14 + index * (kpiW + 2.5);
    doc.setFillColor(kpi.alert ? 254 : lightMint[0], kpi.alert ? 242 : lightMint[1], kpi.alert ? 242 : lightMint[2]);
    doc.setDrawColor(kpi.alert ? 252 : 187, kpi.alert ? 165 : 247, kpi.alert ? 165 : 208);
    doc.roundedRect(x, kpiY, kpiW, kpiH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(kpi.alert ? 185 : primaryEmerald[0], kpi.alert ? 28 : primaryEmerald[1], kpi.alert ? 28 : primaryEmerald[2]);
    doc.text(kpi.label, x + 3, kpiY + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(kpi.alert ? 185 : darkText[0], kpi.alert ? 28 : darkText[1], kpi.alert ? 28 : darkText[2]);
    doc.text(kpi.value, x + 3, kpiY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(107, 114, 128);
    doc.text(kpi.sub, x + 3, kpiY + 15);
  });

  let currentY = 74;

  // --- SECTION 1: WILSON EOQ RESTOCK SCHEDULE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryEmerald);
  doc.text('1. Deterministic Inventory Restock Schedule (Wilson EOQ Formulation)', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text('EOQ = sqrt((2 * D * S) / H) • Minimizes annual holding vs order placement friction', 14, currentY + 4);

  const inventoryRows = products.map((p) => {
    const eoq = eoqMap.get(p.id);
    return [
      p.sku,
      p.name,
      `${p.currentStock}`,
      `${eoq?.safetyStock ?? p.minSafetyStock}`,
      `${eoq?.reorderPoint ?? 0}`,
      `+${eoq?.eoqUnits ?? 0}`,
      `${eoq?.daysOfInventoryLeft ?? 0}d`,
      formatPdfCurrency(p.unitCost),
      eoq?.urgencyLevel || 'Healthy',
    ];
  });

  autoTable(doc, {
    startY: currentY + 6,
    head: [['SKU', 'Product Name', 'Stock', 'Safety', 'ROP', 'EOQ Batch', 'Runway', 'Unit Cost', 'Status']],
    body: inventoryRows.length > 0 ? inventoryRows : [['-', 'No products cataloged in this cell yet.', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryEmerald,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: lightMint,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: darkText,
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // Check page break
  if (currentY + 50 > 275) {
    doc.addPage();
    currentY = 16;
  }

  // --- SECTION 2: PARETO ABC MATRIX (80 / 15 / 5) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryEmerald);
  doc.text('2. Pareto ABC Capital Allocation Matrix (80 / 15 / 5 Rule)', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text('Class A (Top 80% Capital), Class B (Next 15%), Class C (Remaining 5% Bulk Velocity)', 14, currentY + 4);

  const abcRows = abcList.map((a) => [
    `Class ${a.classification}`,
    a.productName,
    a.sku,
    formatPdfCurrency(a.annualMonetaryValue),
    `${a.percentageOfTotalValue}%`,
    a.managementPolicy,
  ]);

  autoTable(doc, {
    startY: currentY + 6,
    head: [['Class', 'Product Name', 'SKU', 'Annual Consumption', '% Capital', 'Inventory Management Policy']],
    body: abcRows.length > 0 ? abcRows : [['-', 'No inventory data for ABC computation', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: accentGreen,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: darkText,
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 46 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // Check page break
  if (currentY + 50 > 275) {
    doc.addPage();
    currentY = 16;
  }

  // --- SECTION 3: TOP CUSTOMER RFM & COHORTS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryEmerald);
  doc.text('3. Top Customer Cohorts & Deterministic RFM Matrix', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text('Scored across Recency, Frequency, and Monetary parameters with Churn Decay Risk %', 14, currentY + 4);

  const rfmRows = rfmList.slice(0, 10).map((r) => [
    r.customerName,
    r.city,
    `${r.frequencyCount}`,
    formatPdfCurrency(r.monetaryTotal),
    `${r.recencyDays}d`,
    r.rfmSegment,
    formatPdfCurrency(r.predictedLTV),
    `${r.churnRiskPercent}%`,
  ]);

  autoTable(doc, {
    startY: currentY + 6,
    head: [['Customer', 'City', 'Orders', 'Total Spend', 'Recency', 'Cohort Segment', 'Predicted LTV', 'Churn Risk']],
    body: rfmRows.length > 0 ? rfmRows : [['-', 'No customer records yet', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryEmerald,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: lightMint,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: darkText,
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 25 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 30, fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 15, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // Check page break
  if (currentY + 50 > 275) {
    doc.addPage();
    currentY = 16;
  }

  // --- SECTION 4: PREDICTIVE SALES FORECAST ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryEmerald);
  doc.text('4. Predictive Sales Forecast & Mathematical Parameters', 14, currentY);

  const m = forecast.modelMetrics;
  const forecastParams = [
    ['OLS Regression R-Squared (R²)', `${m.rSquared}`, 'Holt Smoothing Level (Alpha)', `${m.holtAlpha}`],
    ['Trend Line Slope (m)', `INR ${m.slope}/day`, 'Holt Trend Smoothing (Beta)', `${m.holtBeta}`],
    ['Baseline Intercept (c)', `INR ${Math.round(m.intercept)}`, 'Regression Standard Error (SE)', `± ${formatPdfCurrency(m.standardError)}`],
    ['Projected 30-Day Revenue', formatPdfCurrency(m.projectedMonthlyRevenue), 'Model Statistical Confidence', '95% (2-Sigma Confidence Bands)'],
  ];

  autoTable(doc, {
    startY: currentY + 4,
    body: forecastParams,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: darkText,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: primaryEmerald },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { fontStyle: 'bold', cellWidth: 50, textColor: primaryEmerald },
      3: { cellWidth: 40, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // --- FOOTER ACROSS ALL PAGES ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(229, 231, 235);
    doc.line(14, 286, 196, 286);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      'Vridhi OS • Generated strictly via deterministic mathematical algorithms (Zero Codex / Zero AI) • 100% Client Privacy',
      14,
      290
    );
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
  }

  // Trigger immediate PDF file download
  const cleanFilename = `${tenant.businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Executive_Audit_Report.pdf`;
  doc.save(cleanFilename);
}

/**
 * GENERATE ADMIN PLATFORM AUDIT PDF
 * (Zero Codex, Zero AI, Pure Client-Side Generation for Super Admin)
 */
export function exportAdminPlatformDataPDF(tenants: Tenant[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryEmerald: [number, number, number] = [6, 78, 59];
  const activeTenants = tenants.filter((t) => t.subscription.status === 'active');
  const totalMRR = activeTenants.reduce((sum, t) => sum + (t.subscription.amountMonthly || 0), 0);

  // Header Banner
  doc.setFillColor(...primaryEmerald);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('VRIDHI OS  |  PLATFORM TENANT REGISTRY & MRR AUDIT LEDGER', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  doc.text(
    `Super Admin Platform Governance Ledger • Total Registered Cells: ${tenants.length} • Active Paying Cells: ${activeTenants.length} • MRR: INR ${totalMRR.toLocaleString('en-IN')}`,
    14,
    18
  );

  const rows = tenants.map((t) => [
    t.id,
    t.businessName,
    t.ownerName,
    `${t.city}, ${t.state}`,
    t.subscription.plan.toUpperCase(),
    `INR ${t.subscription.amountMonthly.toLocaleString('en-IN')}`,
    t.subscription.status.toUpperCase(),
    t.subscription.lastUpiTransactionRef || 'N/A',
    t.subscription.expiresAt.split('T')[0],
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['Cell ID', 'Business Name', 'Owner Name', 'Location', 'Plan', 'Monthly Fee', 'Status', 'Last UTR / Ref', 'Cycle Expiry']],
    body: rows.length > 0 ? rows : [['-', 'No tenants registered yet in database', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryEmerald,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244],
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Vridhi OS Platform Governance • Generated On: ${new Date().toLocaleDateString('en-IN')} • Page ${i} of ${pageCount}`,
      14,
      202
    );
  }

  doc.save(`Vridhi_Platform_Admin_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Download Admin Data: Platform Merchants, Subscriptions, and MRR Ledger (CSV)
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

  const rows = tenants.map((t) =>
    [
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
    ].join(',')
  );

  const totalMRR = tenants
    .filter((t) => t.subscription.status === 'active')
    .reduce((sum, t) => sum + t.subscription.amountMonthly, 0);

  const content = [
    `# VRIDHI OS - MASTER SUPER ADMIN PLATFORM AUDIT LEDGER`,
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
 * Also keep HTML printable brief option
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
  generateExecutivePDFReport(
    tenant,
    products,
    customers,
    orders,
    eoqMap,
    abcList,
    rfmList,
    forecast
  );
}
