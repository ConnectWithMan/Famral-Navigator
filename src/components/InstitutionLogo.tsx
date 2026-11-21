import React from 'react';
import type { Institution } from '../types/domain.ts';

interface InstitutionLogoProps {
  institution: Pick<Institution, 'shortName' | 'name' | 'logoMonogram' | 'logoAccent' | 'ownership'>;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', { box: string; text: string; sub: string }> = {
  sm: { box: 'w-9 h-9 rounded-lg', text: 'text-[10px]', sub: 'hidden' },
  md: { box: 'w-12 h-12 rounded-xl', text: 'text-xs', sub: 'text-[8px]' },
  lg: { box: 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl', text: 'text-sm sm:text-base', sub: 'text-[9px]' },
};

export const InstitutionLogo: React.FC<InstitutionLogoProps> = ({ institution, size = 'md' }) => {
  const monogram = (
    institution.logoMonogram ||
    institution.shortName.replace(/[^A-Za-z0-9]/g, '').slice(0, 5)
  ).toUpperCase();

  const accent = institution.logoAccent || '#0B1F3A';
  const styles = SIZE_CLASSES[size];

  return (
    <div
      className={`${styles.box} shrink-0 flex flex-col items-center justify-center border border-slate-900/10 text-white font-display font-bold tracking-tight select-none shadow-2xs relative overflow-hidden`}
      style={{ backgroundColor: accent }}
      aria-label={`${institution.shortName} institutional emblem`}
      title={institution.name}
    >
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.65) 0%, transparent 55%)',
        }}
      />
      <span className={`${styles.text} leading-none relative z-10`}>{monogram}</span>
      {size !== 'sm' && (
        <span className={`${styles.sub} font-sans font-medium opacity-75 mt-1 tracking-wide relative z-10`}>
          {institution.ownership === 'Private'
            ? 'PVT'
            : institution.ownership === 'Government Aided'
              ? 'AIDED'
              : institution.ownership === 'Public-Private (PPP)'
                ? 'PPP'
                : 'GOVT'}
        </span>
      )}
    </div>
  );
};
