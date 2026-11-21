import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ExternalLink, Flag, Search, BookMarked } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { COUNSELLING_SYSTEMS } from '../config/systems/registry.ts';
import { isSafeHttpUrl } from '../lib/exporters.ts';
import { usePageSeo } from '../lib/seo.ts';
import {
  BreadcrumbItem,
  buildGlossaryJsonLd,
  buildGuidesJsonLd,
} from '../lib/seoSchema.ts';

export const GuidesGlossaryPage: React.FC<{ initialMode?: 'guides' | 'glossary' }> = ({
  initialMode = 'guides',
}) => {
  const location = useLocation();
  const { contentItems, openReportModal } = useApp();
  const mode = location.pathname.startsWith('/glossary') ? 'glossary' : initialMode;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { label: 'Home', to: '/' },
      { label: 'Counselling Hub', to: '/counselling' },
      { label: mode === 'glossary' ? 'Admissions Glossary' : 'Process Guides' },
    ],
    [mode]
  );

  const guides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contentItems.filter((item) => {
      if (item.kind !== 'guide') return false;
      if (selectedSystem !== 'all' && item.systemCode !== selectedSystem) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q)
      );
    });
  }, [contentItems, searchQuery, selectedSystem]);

  const glossaryTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contentItems.filter((item) => {
      if (item.kind !== 'glossary') return false;
      if (selectedSystem !== 'all' && item.systemCode !== selectedSystem) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        (item.category ?? '').toLowerCase().includes(q)
      );
    });
  }, [contentItems, searchQuery, selectedSystem]);

  const structuredData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://navigator.famral.com';
    return mode === 'glossary'
      ? buildGlossaryJsonLd(glossaryTerms, origin)
      : buildGuidesJsonLd(guides, origin);
  }, [mode, glossaryTerms, guides]);

  usePageSeo({
    title:
      mode === 'glossary'
        ? 'Admissions Glossary – CRL, Category Rank, Quotas & Seat Pools | Famral Navigator'
        : 'Counselling Process Guides – Freeze, Float, Slide & Verification | Famral Navigator',
    description:
      mode === 'glossary'
        ? 'Clear definitions of Indian undergraduate counselling terms including CRL, Category Rank, HS/OS/AI quotas, Female-only seat pools, and counselling rounds.'
        : 'Step-by-step guides to counselling willingness options (Freeze, Float, Slide), online document verification, and round transitions across active systems.',
    canonicalPath: mode === 'glossary' ? '/glossary' : '/guides',
    ogType: 'article',
    breadcrumbs,
    jsonLd: structuredData,
  });

  const hasDemo = contentItems.some((c) => c.isDemo);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      {/* Header & Switcher */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
            {mode === 'glossary' ? 'Admissions Glossary' : 'Counselling Process Guides'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {mode === 'glossary'
              ? 'Plain-language reference for rank types, seat quotas, gender pools, and counselling round rules used across Famral Navigator.'
              : 'Admin-maintained guides covering Freeze/Float/Slide willingness rules, document verification, and JoSAA-to-CSAB transitions.'}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shrink-0">
          <Link
            to="/guides"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'guides' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Process Guides
          </Link>
          <Link
            to="/glossary"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'glossary'
                ? 'bg-[#0B1F3A] text-white'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Admissions Glossary
          </Link>
        </div>
      </div>

      {hasDemo && <DemoDataNotice compact />}

      {/* Search & System Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mode === 'glossary'
                ? 'Search terms (e.g., CRL, Category Rank, HS quota, Female-only)...'
                : 'Search process guides (e.g., Freeze, Float, withdrawal, verification)...'
            }
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>
        <select
          value={selectedSystem}
          onChange={(e) => setSelectedSystem(e.target.value)}
          aria-label="Filter by counselling system"
          className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-[#1D4ED8]"
        >
          <option value="all">All systems</option>
          {COUNSELLING_SYSTEMS.map((sys) => (
            <option key={sys.code} value={sys.code}>
              {sys.shortName}
            </option>
          ))}
        </select>
      </div>

      {/* Process Guides View */}
      {mode === 'guides' && (
        <div className="space-y-5">
          {guides.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              No process guides match your filter.
            </div>
          ) : (
            guides.map((guide) => (
              <article
                id={guide.slug}
                key={guide.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 scroll-mt-24"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">
                      {guide.systemCode.toUpperCase()} · {guide.category || 'Guide'} · Verified:{' '}
                      {guide.verifiedAt}
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#0B1F3A]">{guide.title}</h2>
                    <p className="text-sm text-slate-600">{guide.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openReportModal({
                        entityType: 'guide',
                        entityId: guide.id,
                        entityLabel: `Process Guide: ${guide.title}`,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0B1F3A]"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report incorrect info
                  </button>
                </div>

                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
                  {guide.body}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Source: {guide.sourceName}</span>
                  {isSafeHttpUrl(guide.sourceUrl) && (
                    <a
                      href={guide.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1D4ED8] font-medium hover:underline"
                    >
                      Official Business Rules Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Admissions Glossary View */}
      {mode === 'glossary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossaryTerms.length === 0 ? (
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              No glossary terms match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            glossaryTerms.map((term) => (
              <article
                id={term.slug}
                key={term.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 scroll-mt-24"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      {term.category || 'Definition'} · {term.systemCode.toUpperCase()}
                    </div>
                    <h2 className="font-display text-base font-bold text-[#0B1F3A] mt-0.5">
                      {term.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openReportModal({
                        entityType: 'guide',
                        entityId: term.id,
                        entityLabel: `Glossary Term: ${term.title}`,
                      })
                    }
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Report incorrect definition"
                    aria-label={`Report incorrect definition for ${term.title}`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-700">{term.summary}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{term.body}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Verified: {term.verifiedAt}</span>
                  <Link to="/predictor" className="text-[#1D4ED8] font-medium hover:underline">
                    See in Predictor →
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Internal Linking to Counselling Hubs & Predictors */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
        <h2 className="font-display text-sm font-semibold text-[#0B1F3A]">
          Explore Counselling Hubs &amp; Historical Cutoffs
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          {COUNSELLING_SYSTEMS.map((sys) => (
            <Link
              key={sys.code}
              to={`/counselling/${sys.code}`}
              className="text-[#1D4ED8] hover:underline"
            >
              {sys.shortName} Hub →
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
