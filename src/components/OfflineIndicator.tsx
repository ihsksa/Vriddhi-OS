import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-900/95 text-emerald-100 px-4 py-2.5 text-xs shadow-lg backdrop-blur-xs border border-emerald-700/60 transition-all">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-800 text-emerald-300">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div>
        <div className="font-medium text-white flex items-center gap-1.5">
          <span>Offline Privacy Mode Active</span>
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
        </div>
        <p className="text-[11px] text-emerald-300/90">
          All inventory math and local database queries run 100% locally.
        </p>
      </div>
    </div>
  );
};
