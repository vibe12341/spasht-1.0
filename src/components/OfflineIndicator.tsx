import React, { useEffect, useState } from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-lg bg-emerald-900/90 text-emerald-200 border border-emerald-600/50 px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-xs animate-bounce">
      <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
      <span>Airplane Mode Active — 100% Offline with Gemma 4 & Local SQLite</span>
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-1" />
    </div>
  );
};
