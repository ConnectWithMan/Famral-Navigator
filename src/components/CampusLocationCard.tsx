import React from 'react';
import { ExternalLink, MapPin, Navigation, Train } from 'lucide-react';
import type { Institution } from '../types/domain.ts';

interface CampusLocationCardProps {
  institution: Institution;
}

export const CampusLocationCard: React.FC<CampusLocationCardProps> = ({ institution }) => {
  const fullQuery = encodeURIComponent(
    `${institution.name}, ${institution.address || `${institution.city}, ${institution.state}`}, India`
  );
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${fullQuery}`;
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fullQuery}`;

  return (
    <section className="app-panel rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-display font-bold text-[#0B1F3A]">
            Campus Location &amp; Google Maps
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify exact campus gate, hostels, and transit routes directly on Google Maps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B162C] text-white text-xs font-semibold hover:bg-[#132C50] transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 opacity-80" aria-hidden="true" />
          </a>
          <a
            href={mapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Navigation className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
            <span>Get Directions</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Clean Architectural Location Preview Panel (No fabricated coordinates / no unconfigured API key calls) */}
        <div className="lg:col-span-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200/80 p-5 flex flex-col justify-between min-h-[190px] relative overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none text-[#0B1F3A]"
          >
            <defs>
              <pattern id="campus-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#campus-grid)" />
          </svg>

          <div className="relative z-10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1D4ED8]/10 border border-[#1D4ED8]/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#1D4ED8]" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0B1F3A]">{institution.shortName}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {institution.city}, {institution.state}, India
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Interactive embedded map tiles are disabled when Google Maps Platform is not enabled. Use the Google Maps links to inspect live satellite view, campus gates, and travel time.
            </p>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:underline"
            >
              <span>View {institution.shortName} on Google Maps →</span>
            </a>
          </div>
        </div>

        {/* Full Address & Transit Connectivity */}
        <div className="lg:col-span-7 p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#0B1F3A]">Campus Address</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {institution.address || `${institution.city}, ${institution.state}, India`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <div className="text-xs font-semibold text-[#0B1F3A]">City &amp; State</div>
              <p className="text-xs text-slate-600 mt-0.5">
                {institution.city}, {institution.state}
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0B1F3A] inline-flex items-center gap-1.5">
                <Train className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Nearest Rail / Airport Reference</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {institution.nearestTransit || `Verify nearest railway station and airport for ${institution.city} on Google Maps.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
