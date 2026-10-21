import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseClient';
import { SupabaseConfig, Tenant, Product, Customer, SalesOrder } from '../types';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  FileCode,
} from 'lucide-react';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
  products?: Product[];
  orders?: SalesOrder[];
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  tenant,
  products = [],
  orders = [],
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(() => supabaseService.getConfig());
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    const result = await supabaseService.testConnection(url, anonKey);
    setIsTesting(false);
    setConfig(supabaseService.getConfig());

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleSyncData = async () => {
    if (!tenant) return;
    setIsSyncing(true);
    setStatusMessage(null);

    const prodOk = await supabaseService.syncTenantProducts(tenant.id, products);
    const ordOk = await supabaseService.syncTenantOrders(tenant.id, orders);

    setIsSyncing(false);
    if (prodOk && ordOk) {
      setStatusMessage({
        type: 'success',
        text: `Successfully synced ${products.length} products and ${orders.length} orders for ${tenant.businessName} to Supabase!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Sync encountered table errors. Please ensure you have run the SQL schema migration in Supabase.',
      });
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(supabaseService.getSqlMigrationScript());
    setIsCopiedSql(true);
    setTimeout(() => setIsCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Supabase Cloud Database Integration</h3>
              <p className="text-xs text-emerald-200/80">Connect your Supabase PostgreSQL project with Row Level Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-100 bg-gray-50 px-6 pt-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-3 border-b-2 transition ${
              activeTab === 'config'
                ? 'border-emerald-800 text-emerald-950 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Connection Settings & Sync
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-800 text-emerald-950 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>SQL Schema Migration (RLS)</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'config' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      config.isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-emerald-950">
                    Status: {config.isConnected ? 'Connected to Supabase' : 'Offline / Local-Only Mode'}
                  </span>
                </div>
                {config.lastTestedAt && (
                  <span className="text-[11px] text-gray-500 font-mono">
                    Last tested: {new Date(config.lastTestedAt).toLocaleTimeString('en-IN')}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Supabase Anon (Public) Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {isTesting ? 'Verifying...' : 'Save & Test Connection'}
                </button>

                {tenant && config.isConnected && (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncData}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Current Tenant ({tenant.businessName})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  Execute this SQL in Supabase SQL Editor to enable strict tenant isolation:
                </span>
                <button
                  type="button"
                  onClick={copySql}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {isCopiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedSql ? 'Copied SQL' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="p-3 bg-gray-900 text-emerald-300 font-mono text-[11px] rounded-xl max-h-72 overflow-y-auto leading-relaxed select-all">
                <pre>{supabaseService.getSqlMigrationScript()}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
