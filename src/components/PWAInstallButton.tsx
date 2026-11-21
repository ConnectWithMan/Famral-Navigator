import React, { useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../lib/usePWAInstall.ts';
import { useApp } from '../context/AppContext.tsx';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-[#0B1F3A] hover:bg-slate-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
        <span>Install Navigator App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-[#0B1F3A] hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 border border-slate-200 shadow-xl space-y-3">
              <h3 className="text-base font-display font-semibold text-[#0B1F3A]">
                Install Famral Navigator on iOS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari.<br />
                2. Scroll down and choose <strong>Add to Home Screen</strong> to access your saved choice lists offline.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-md bg-[#0B1F3A] py-2 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useApp();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-900 px-3.5 py-2 text-xs font-medium text-white shadow-lg no-print"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{t('offlineNotice')}</span>
    </div>
  );
};
