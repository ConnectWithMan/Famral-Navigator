import React from 'react';
import { Info } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface DemoDataNoticeProps {
  compact?: boolean;
  showHistoricalNote?: boolean;
  className?: string;
}

export const DemoDataNotice: React.FC<DemoDataNoticeProps> = ({
  compact = false,
  showHistoricalNote = false,
  className = '',
}) => {
  const { t } = useApp();

  if (compact) {
    return (
      <div
        role="note"
        className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-950 ${className}`}
      >
        <Info className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">{t('demoBanner')}</strong>
          {showHistoricalNote ? ` · ${t('historicalDisclaimer')}` : ''}
        </span>
      </div>
    );
  }

  return (
    <div
      role="note"
      className={`rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-950 space-y-1 ${className}`}
    >
      <div className="flex items-center gap-2 font-semibold text-amber-950">
        <Info className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
        <span>{t('demoBanner')}</span>
      </div>
      <p className="text-amber-900/90 leading-relaxed">{t('demoDetail')}</p>
      {showHistoricalNote && (
        <p className="text-amber-900/80 leading-relaxed pt-0.5">{t('historicalDisclaimer')}</p>
      )}
    </div>
  );
};
