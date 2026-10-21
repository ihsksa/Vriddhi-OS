import React, { useState } from 'react';
import { PredictiveSalesForecast, Tenant } from '../../types';
import { formatINR } from '../../utils/analyticsMath';
import { TrendingUp, BarChart3, Calculator, ShieldCheck, Layers, Info } from 'lucide-react';

interface ForecastTabProps {
  tenant: Tenant;
  forecast: PredictiveSalesForecast;
}

export const ForecastTab: React.FC<ForecastTabProps> = ({ tenant, forecast }) => {
  const [horizonDays, setHorizonDays] = useState<'30' | '60'>('30');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    sales: number;
    type: 'actual' | 'forecast';
    upper?: number;
    lower?: number;
  } | null>(null);

  const history = forecast.historyPoints;
  const projections = forecast.forecastPoints.slice(0, Number(horizonDays));

  // Determine scaling for SVG chart
  const allValues = [
    ...history.map((h) => h.actualSales),
    ...projections.map((p) => p.upperBound),
  ];
  const maxVal = Math.max(...allValues, 10000) * 1.15;
  const minVal = 0;

  const chartWidth = 800;
  const chartHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const totalPoints = history.length + projections.length;
  const stepX = (chartWidth - paddingX * 2) / Math.max(totalPoints - 1, 1);

  const getY = (val: number) => {
    return chartHeight - paddingY - (val / (maxVal || 1)) * (chartHeight - paddingY * 2);
  };

  // Generate historical path (emerald solid)
  const historyCoords = history.map((pt, i) => {
    const x = paddingX + i * stepX;
    const y = getY(pt.actualSales);
    return { x, y, pt };
  });

  const historyPath = historyCoords.length > 0
    ? `M ${historyCoords[0].x} ${historyCoords[0].y} ` +
      historyCoords.slice(1).map((c) => `L ${c.x} ${c.y}`).join(' ')
    : '';

  // Generate forecast path (dashed emerald/sage)
  const lastHistoryCoord = historyCoords[historyCoords.length - 1];
  const forecastCoords = projections.map((pt, i) => {
    const x = paddingX + (history.length + i) * stepX;
    const y = getY(pt.projectedSales);
    const yUpper = getY(pt.upperBound);
    const yLower = getY(pt.lowerBound);
    return { x, y, yUpper, yLower, pt };
  });

  const forecastPath = lastHistoryCoord && forecastCoords.length > 0
    ? `M ${lastHistoryCoord.x} ${lastHistoryCoord.y} ` +
      forecastCoords.map((c) => `L ${c.x} ${c.y}`).join(' ')
    : '';

  // Upper and Lower confidence interval area
  let confidenceAreaPath = '';
  if (lastHistoryCoord && forecastCoords.length > 0) {
    const topPoints = [`M ${lastHistoryCoord.x} ${lastHistoryCoord.y}`, ...forecastCoords.map((c) => `L ${c.x} ${c.yUpper}`)];
    const bottomPoints = [...forecastCoords.slice().reverse().map((c) => `L ${c.x} ${c.yLower}`), `L ${lastHistoryCoord.x} ${lastHistoryCoord.y}`];
    confidenceAreaPath = `${topPoints.join(' ')} ${bottomPoints.join(' ')} Z`;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-tight">
            Predictive Revenue & Demand Studio
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Ensemble of Holt's Linear Exponential Smoothing & Ordinary Least Squares (OLS) Regression. Strictly verified mathematical algorithms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Projection Horizon:</span>
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs">
            <button
              onClick={() => setHorizonDays('30')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                horizonDays === '30' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Next 30 Days
            </button>
            <button
              onClick={() => setHorizonDays('60')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                horizonDays === '60' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Next 60 Days
            </button>
          </div>
        </div>
      </div>

      {/* Model Transparency & Mathematical Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Model Fit Accuracy (R²)
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-950">
            {forecast.modelMetrics.rSquared}
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Coefficient of determination</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Daily Trend Slope (m)
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-950 font-mono">
            {forecast.modelMetrics.slope >= 0 ? '+' : ''}₹{forecast.modelMetrics.slope}/day
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Least squares velocity</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Standard Error (Se)
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-950 font-mono">
            ±{formatINR(forecast.modelMetrics.standardError, true)}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">95% prediction interval</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Projected {horizonDays}-Day Total
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">
            {formatINR(
              projections.reduce((sum, p) => sum + p.projectedSales, 0),
              true
            )}
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Deterministic expectation</p>
        </div>
      </div>

      {/* Interactive Visual Forecast Chart */}
      <div className="rounded-2xl bg-white p-6 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-emerald-950">
              Daily Realized Revenue vs. Forecast Trajectory
            </h2>
            <p className="text-[11px] text-gray-500">
              Hover over points to inspect date, daily estimate, and 95% confidence bands.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-800" />
              <span>Historical Sales</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <span className="h-0.5 w-4 border-b-2 border-dashed border-emerald-600" />
              <span>Ensemble Forecast</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <span className="h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-300" />
              <span>95% Confidence Band</span>
            </span>
          </div>
        </div>

        {/* Hover Point Tooltip info bar */}
        <div className="h-8 flex items-center text-xs">
          {hoveredPoint ? (
            <div className="flex items-center gap-3 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-mono text-emerald-950">
              <span>Date: <strong>{new Date(hoveredPoint.date).toLocaleDateString('en-IN')}</strong></span>
              <span>&bull;</span>
              <span>
                {hoveredPoint.type === 'actual' ? 'Actual Sales:' : 'Projected Sales:'}{' '}
                <strong>{formatINR(hoveredPoint.sales)}</strong>
              </span>
              {hoveredPoint.upper !== undefined && hoveredPoint.lower !== undefined && (
                <>
                  <span>&bull;</span>
                  <span className="text-gray-500 text-[11px]">
                    Interval: [{formatINR(hoveredPoint.lower, true)} – {formatINR(hoveredPoint.upper, true)}]
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-gray-400 italic">
              Move cursor across the chart line to examine daily deterministic data points.
            </span>
          )}
        </div>

        {/* SVG Chart Graphic */}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-64 select-none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a7f3d0" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#a7f3d0" stop-opacity="0.05" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const val = maxVal * ratio;
              const y = getY(val);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-gray-400 font-mono"
                  >
                    {formatINR(val, true)}
                  </text>
                </g>
              );
            })}

            {/* Vertical Split Indicator (Today) */}
            {lastHistoryCoord && (
              <line
                x1={lastHistoryCoord.x}
                y1={paddingY}
                x2={lastHistoryCoord.x}
                y2={chartHeight - paddingY}
                stroke="#047857"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Confidence Interval Area */}
            {confidenceAreaPath && (
              <path d={confidenceAreaPath} fill="url(#areaGradient)" />
            )}

            {/* Historical Solid Line */}
            {historyPath && (
              <path
                d={historyPath}
                fill="none"
                stroke="#064e3b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Forecast Dashed Line */}
            {forecastPath && (
              <path
                d={forecastPath}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Points - History */}
            {historyCoords.map((c, i) => (
              <circle
                key={`h-${i}`}
                cx={c.x}
                cy={c.y}
                r={hoveredPoint?.date === c.pt.date ? 6 : 3}
                fill="#064e3b"
                className="cursor-pointer transition-all hover:scale-150"
                onMouseEnter={() =>
                  setHoveredPoint({
                    date: c.pt.date,
                    sales: c.pt.actualSales,
                    type: 'actual',
                  })
                }
              />
            ))}

            {/* Interactive Points - Forecast */}
            {forecastCoords.map((c, i) => (
              <circle
                key={`f-${i}`}
                cx={c.x}
                cy={c.y}
                r={hoveredPoint?.date === c.pt.date ? 6 : 3}
                fill="#34d399"
                stroke="#064e3b"
                strokeWidth="1.5"
                className="cursor-pointer transition-all hover:scale-150"
                onMouseEnter={() =>
                  setHoveredPoint({
                    date: c.pt.date,
                    sales: c.pt.projectedSales,
                    type: 'forecast',
                    upper: c.pt.upperBound,
                    lower: c.pt.lowerBound,
                  })
                }
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Algorithm Transparency Card */}
      <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
          <Calculator className="w-4 h-4 text-emerald-700" />
          <span>Manual Deterministic Algorithm Rationale</span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          The forecast combines two established quantitative methods without any external LLM inferences:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 pt-1">
          <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1">
            <span className="font-semibold text-emerald-900">1. Ordinary Least Squares (OLS) Regression:</span>
            <p className="text-[11px] text-gray-600">
              Minimizes squared deviations between historical sales and time index $x$. Calculates slope $m = ₹{forecast.modelMetrics.slope}/day$ and intercept $c = ₹{forecast.modelMetrics.intercept}$.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1">
            <span className="font-semibold text-emerald-900">2. Holt's Double Exponential Smoothing:</span>
            <p className="text-[11px] text-gray-600">
              Recursively computes localized level $L_t$ with weight $\alpha = 0.35$ and trend momentum $T_t$ with weight $\beta = 0.15$ to adapt to recent demand surges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
