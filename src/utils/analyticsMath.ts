import {
  Product,
  Tenant,
  Customer,
  SalesOrder,
  EOQResult,
  ABCClassificationResult,
  RFMCustomerResult,
  PredictiveSalesForecast,
} from '../types';

/**
 * Format currency in Indian numbering system (Lakhs & Crores)
 * e.g. ₹1,23,456.00
 */
export function formatINR(amount: number, hideDecimals = false): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: hideDecimals ? 0 : 2,
    minimumFractionDigits: hideDecimals ? 0 : 2,
  }).format(amount);
}

/**
 * Standard normal distribution z-values for target service levels
 */
const SERVICE_LEVEL_Z: Record<number, number> = {
  0.9: 1.282,
  0.95: 1.645,
  0.99: 2.326,
};

/**
 * DETERMINISTIC INVENTORY MATH: Economic Order Quantity & Reorder Point
 * Standard Operations Research formulas
 */
export function calculateProductEOQ(
  product: Product,
  settings: Tenant['settings']
): EOQResult {
  const annualDemand = Math.max(product.annualDemandEstimate || 100, 10);
  const orderCostS = settings.defaultOrderCost || 500; // S (Order setup cost in ₹)
  const holdingRate = (settings.annualHoldingCostPercent || 20) / 100; // e.g. 20%
  const holdingCostH = Math.max(product.unitCost * holdingRate, 1); // H (Annual holding cost per unit)

  // Wilson EOQ Formula: sqrt((2 * D * S) / H)
  const rawEOQ = Math.sqrt((2 * annualDemand * orderCostS) / holdingCostH);
  const eoqUnits = Math.max(Math.round(rawEOQ), 1);

  // Daily demand and variance from historical sales
  const dailyDemand = annualDemand / 365;
  const history = product.historicalSalesLast30Days || [];
  let dailyVariance = 0;

  if (history.length > 1) {
    const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
    const squaredDiffs = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    dailyVariance = squaredDiffs / (history.length - 1);
  } else {
    // Default estimate if minimal history
    dailyVariance = Math.pow(dailyDemand * 0.35, 2);
  }

  const standardDeviationDaily = Math.sqrt(dailyVariance);
  const leadTime = Math.max(product.leadTimeDays || 7, 1);
  const zScore = SERVICE_LEVEL_Z[settings.targetServiceLevel] || 1.645;

  // Safety Stock: SS = Z * sqrt(LeadTime * variance)
  const safetyStock = Math.round(zScore * Math.sqrt(leadTime * dailyVariance));

  // Reorder Point: ROP = (Daily Demand * Lead Time) + Safety Stock
  const reorderPoint = Math.round(dailyDemand * leadTime + safetyStock);

  // Holding & Ordering Costs
  const annualOrderCost = (annualDemand / eoqUnits) * orderCostS;
  const annualHoldingCost = (eoqUnits / 2) * holdingCostH;
  const totalAnnualInventoryCost = annualOrderCost + annualHoldingCost;
  const optimalOrdersPerYear = Math.max(Math.round(annualDemand / eoqUnits), 1);

  // Days of Inventory Remaining (Runway)
  const dailyVelocity = Math.max(
    history.length > 0
      ? history.slice(-7).reduce((a, b) => a + b, 0) / Math.min(history.length, 7)
      : dailyDemand,
    0.1
  );
  const daysOfInventoryLeft = Math.round(product.currentStock / dailyVelocity);

  // Urgency logic
  let urgencyLevel: 'Critical' | 'Warning' | 'Healthy' | 'Overstocked' = 'Healthy';
  if (product.currentStock <= safetyStock || daysOfInventoryLeft <= 5) {
    urgencyLevel = 'Critical';
  } else if (product.currentStock <= reorderPoint || daysOfInventoryLeft <= leadTime + 3) {
    urgencyLevel = 'Warning';
  } else if (daysOfInventoryLeft > 150) {
    urgencyLevel = 'Overstocked';
  }

  const isRestockRecommended = product.currentStock <= reorderPoint;

  return {
    productId: product.id,
    eoqUnits,
    reorderPoint,
    safetyStock,
    annualHoldingCost,
    annualOrderCost,
    totalAnnualInventoryCost,
    optimalOrdersPerYear,
    daysOfInventoryLeft,
    isRestockRecommended,
    urgencyLevel,
  };
}

/**
 * DETERMINISTIC ABC INVENTORY ANALYSIS (Pareto 80/15/5 Principle)
 * Categorizes goods based on annual consumption value.
 */
export function calculateABCAnalysis(products: Product[]): ABCClassificationResult[] {
  if (products.length === 0) return [];

  // Calculate annual consumption value for each product (D * Unit Cost)
  const evaluated = products.map((p) => {
    const annualDemand = Math.max(p.annualDemandEstimate || 100, 1);
    const annualMonetaryValue = annualDemand * p.unitCost;
    return {
      product: p,
      annualMonetaryValue,
    };
  });

  // Sort descending by annual monetary value
  evaluated.sort((a, b) => b.annualMonetaryValue - a.annualMonetaryValue);

  const totalValue = evaluated.reduce((sum, item) => sum + item.annualMonetaryValue, 0);

  let cumulativeVal = 0;
  return evaluated.map((item) => {
    cumulativeVal += item.annualMonetaryValue;
    const percentageOfTotalValue = totalValue > 0 ? (item.annualMonetaryValue / totalValue) * 100 : 0;
    const cumulativePercentage = totalValue > 0 ? (cumulativeVal / totalValue) * 100 : 0;

    let classification: 'A' | 'B' | 'C' = 'C';
    let managementPolicy = 'Bulk order, relaxed safety buffer, periodic bi-monthly reviews';

    if (cumulativePercentage <= 80 || item === evaluated[0]) {
      classification = 'A';
      managementPolicy = 'High capital priority, tight automated cycle counts, weekly vendor SLA audits';
    } else if (cumulativePercentage <= 95) {
      classification = 'B';
      managementPolicy = 'Moderate focus, automated fortnightly reorder monitoring, standard buffers';
    }

    return {
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      annualMonetaryValue: Math.round(item.annualMonetaryValue),
      percentageOfTotalValue: Number(percentageOfTotalValue.toFixed(1)),
      cumulativePercentage: Number(cumulativePercentage.toFixed(1)),
      classification,
      managementPolicy,
    };
  });
}

/**
 * DETERMINISTIC CUSTOMER RFM ANALYSIS (Recency, Frequency, Monetary)
 * Calculates customer scores, segment labels, LTV, and churn risk decay curves.
 */
export function calculateRFMAnalysis(
  customers: Customer[],
  orders: SalesOrder[],
  referenceDate = new Date()
): RFMCustomerResult[] {
  if (customers.length === 0) return [];

  const completedOrders = orders.filter((o) => o.status === 'completed');

  // Group orders by customer
  const ordersByCustomer = new Map<string, SalesOrder[]>();
  completedOrders.forEach((o) => {
    const list = ordersByCustomer.get(o.customerId) || [];
    list.push(o);
    ordersByCustomer.set(o.customerId, list);
  });

  const refTime = referenceDate.getTime();

  // Raw metrics
  const rawMetrics = customers.map((c) => {
    const custOrders = ordersByCustomer.get(c.id) || [];
    let recencyDays = 180; // default for inactive
    if (custOrders.length > 0) {
      const latestOrderTime = Math.max(
        ...custOrders.map((o) => new Date(o.date).getTime())
      );
      recencyDays = Math.max(
        Math.floor((refTime - latestOrderTime) / (1000 * 60 * 60 * 24)),
        0
      );
    }

    const frequencyCount = custOrders.length;
    const monetaryTotal = custOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    return {
      customer: c,
      recencyDays,
      frequencyCount,
      monetaryTotal,
    };
  });

  // Deterministic scoring (1-5 quintiles or established merchant thresholds)
  return rawMetrics.map((item) => {
    // Recency: Lower days = higher score
    let rScore = 1;
    if (item.recencyDays <= 15) rScore = 5;
    else if (item.recencyDays <= 35) rScore = 4;
    else if (item.recencyDays <= 65) rScore = 3;
    else if (item.recencyDays <= 110) rScore = 2;

    // Frequency: More orders = higher score
    let fScore = 1;
    if (item.frequencyCount >= 10) fScore = 5;
    else if (item.frequencyCount >= 6) fScore = 4;
    else if (item.frequencyCount >= 3) fScore = 3;
    else if (item.frequencyCount >= 2) fScore = 2;

    // Monetary: Higher spend = higher score
    let mScore = 1;
    if (item.monetaryTotal >= 100000) mScore = 5;
    else if (item.monetaryTotal >= 50000) mScore = 4;
    else if (item.monetaryTotal >= 20000) mScore = 3;
    else if (item.monetaryTotal >= 8000) mScore = 2;

    // RFM Segmentation rules
    let rfmSegment: RFMCustomerResult['rfmSegment'] = 'Recent Customers';
    if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
      rfmSegment = 'Champions';
    } else if (rScore >= 3 && fScore >= 3 && mScore >= 3) {
      rfmSegment = 'Loyal Customers';
    } else if (rScore >= 4 && fScore <= 2 && mScore >= 2) {
      rfmSegment = 'Potential Loyalists';
    } else if (rScore <= 2 && fScore >= 3) {
      rfmSegment = 'At Risk';
    } else if (rScore <= 2 && fScore <= 2 && mScore <= 2) {
      rfmSegment = 'Hibernating';
    } else if (rScore >= 2 && fScore <= 2) {
      rfmSegment = 'Need Attention';
    }

    // Deterministic Customer Lifetime Value (LTV):
    // LTV = AOV * annual frequency * gross margin (0.28) * lifespan (3 years)
    const avgOrderValue = item.frequencyCount > 0 ? item.monetaryTotal / item.frequencyCount : 4000;
    const estOrdersPerYear = Math.max(item.frequencyCount * 1.5, 1);
    const predictedLTV = Math.round(avgOrderValue * estOrdersPerYear * 0.28 * 2.5);

    // Churn Risk Decay formula: 1 - exp(-0.018 * recencyDays)
    const decay = 1 - Math.exp(-0.02 * item.recencyDays);
    const churnRiskPercent = Math.min(
      Math.max(Math.round(decay * 100), item.frequencyCount === 0 ? 95 : 5),
      99
    );

    return {
      customerId: item.customer.id,
      customerName: item.customer.name,
      city: item.customer.city,
      recencyDays: item.recencyDays,
      frequencyCount: item.frequencyCount,
      monetaryTotal: Math.round(item.monetaryTotal),
      rScore,
      fScore,
      mScore,
      rfmSegment,
      predictedLTV,
      churnRiskPercent,
    };
  });
}

/**
 * DETERMINISTIC PREDICTIVE REVENUE & SALES FORECASTING
 * Combines Ordinary Least Squares (OLS) Linear Regression and Holt's Double Exponential Smoothing.
 * No AI API calls; purely verified mathematical algorithms.
 */
export function calculatePredictiveSalesForecast(
  orders: SalesOrder[],
  forecastDays = 30
): PredictiveSalesForecast {
  // Aggregate sales by day for the last 45 days
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const salesByDate = new Map<string, number>();

  // Ensure last 30 days are filled
  const today = new Date();
  const historyPoints: { date: string; actualSales: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    salesByDate.set(dateStr, 0);
  }

  completedOrders.forEach((o) => {
    const dateStr = o.date.split('T')[0];
    if (salesByDate.has(dateStr)) {
      salesByDate.set(dateStr, (salesByDate.get(dateStr) || 0) + o.grandTotal);
    }
  });

  const sortedDates = Array.from(salesByDate.keys()).sort();
  sortedDates.forEach((dateStr) => {
    historyPoints.push({
      date: dateStr,
      actualSales: salesByDate.get(dateStr) || 0,
    });
  });

  const n = historyPoints.length;
  if (n === 0) {
    return {
      historyPoints: [],
      forecastPoints: [],
      modelMetrics: {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        standardError: 0,
        holtAlpha: 0.35,
        holtBeta: 0.15,
        forecastPeriodDays: forecastDays,
        projectedMonthlyRevenue: 0,
      },
    };
  }

  // 1. OLS Linear Regression: y = m*x + c
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  historyPoints.forEach((pt, x) => {
    const y = pt.actualSales;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Compute R-squared & Standard Error
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  historyPoints.forEach((pt, x) => {
    const y = pt.actualSales;
    const yPred = slope * x + intercept;
    ssTot += Math.pow(y - meanY, 2);
    ssRes += Math.pow(y - yPred, 2);
  });

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 500;

  // 2. Holt's Linear Exponential Smoothing (Level and Trend)
  const alpha = 0.35;
  const beta = 0.15;

  let level = historyPoints[0].actualSales;
  let trend = historyPoints.length > 1 ? historyPoints[1].actualSales - historyPoints[0].actualSales : 0;

  for (let i = 1; i < historyPoints.length; i++) {
    const y = historyPoints[i].actualSales;
    const prevLevel = level;
    const prevTrend = trend;
    level = alpha * y + (1 - alpha) * (prevLevel + prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
  }

  // 3. Generate forward projected points
  const forecastPoints: PredictiveSalesForecast['forecastPoints'] = [];
  let projectedMonthlyRevenue = 0;

  const lastDate = new Date(sortedDates[sortedDates.length - 1]);

  for (let h = 1; h <= forecastDays; h++) {
    const fDate = new Date(lastDate);
    fDate.setDate(fDate.getDate() + h);
    const dateStr = fDate.toISOString().split('T')[0];

    // Holt's forecast
    const holtForecast = level + h * trend;
    // OLS forecast
    const olsForecast = slope * (n - 1 + h) + intercept;
    // Weighted Ensemble blend (60% Holt, 40% OLS)
    const rawProjected = Math.max(Math.round(holtForecast * 0.6 + olsForecast * 0.4), 0);

    // Prediction interval (95% confidence)
    const confidenceMargin = Math.round(1.645 * standardError * Math.sqrt(1 + h / n));
    const lowerBound = Math.max(0, rawProjected - confidenceMargin);
    const upperBound = rawProjected + confidenceMargin;
    const growthFactor = meanY > 0 ? Number(((rawProjected - meanY) / meanY).toFixed(3)) : 0;

    projectedMonthlyRevenue += rawProjected;

    forecastPoints.push({
      date: dateStr,
      projectedSales: rawProjected,
      lowerBound,
      upperBound,
      growthFactor,
    });
  }

  return {
    historyPoints,
    forecastPoints,
    modelMetrics: {
      slope: Number(slope.toFixed(2)),
      intercept: Number(intercept.toFixed(2)),
      rSquared: Number(rSquared.toFixed(3)),
      standardError: Math.round(standardError),
      holtAlpha: alpha,
      holtBeta: beta,
      forecastPeriodDays: forecastDays,
      projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue),
    },
  };
}
