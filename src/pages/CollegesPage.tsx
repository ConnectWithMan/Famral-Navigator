import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, Check, LayoutGrid, List, Scale, Search } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { InstitutionLogo } from '../components/InstitutionLogo.tsx';
import { getLatestRoundNumber, getSystemConfig } from '../config/systems/registry.ts';
import { usePageSeo } from '../lib/seo.ts';
import { BreadcrumbItem, buildAbsoluteUrl } from '../lib/seoSchema.ts';

const PAGE_SIZE = 12;

export const CollegesPage: React.FC<{ branchFirst?: boolean }> = ({ branchFirst = false }) => {
  const { institutions, programmes, cutoffs, savedColleges, toggleSaveCollege, t } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [branchGroup, setBranchGroup] = useState('Computer Science & IT');
  const [branchFilter, setBranchFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);

  const publishedInsts = useMemo(
    () => institutions.filter((i) => i.status === 'published'),
    [institutions]
  );

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () =>
      branchFirst
        ? [
            { label: 'Home', to: '/' },
            { label: 'Colleges', to: '/colleges' },
            { label: 'Browse by Branch' },
          ]
        : [{ label: 'Home', to: '/' }, { label: 'Colleges Directory' }],
    [branchFirst]
  );

  const directoryJsonLd = useMemo(() => {
    if (branchFirst) return undefined;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://navigator.famral.com';
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Participating Colleges Directory',
      url: buildAbsoluteUrl(origin, '/colleges'),
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: publishedInsts.length,
        itemListElement: publishedInsts.slice(0, 20).map((inst, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: inst.name,
          url: buildAbsoluteUrl(origin, `/colleges/${inst.slug}`),
        })),
      },
    };
  }, [branchFirst, publishedInsts]);

  usePageSeo({
    title: branchFirst
      ? 'Browse Engineering Colleges by Branch – CSE, ECE, EE & More'
      : 'Participating Colleges – IITs, NITs, IIITs, GFTIs & State Universities',
    description: branchFirst
      ? 'Select an engineering branch and compare participating JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET institutes with historical closing ranks.'
      : 'Search and filter participating IITs, NITs, IIITs, GFTIs, and State Universities across JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE, and KCET.',
    canonicalPath: branchFirst ? '/branches' : '/colleges',
    breadcrumbs,
    jsonLd: directoryJsonLd,
  });

  const states = useMemo(
    () => Array.from(new Set(publishedInsts.map((i) => i.state))).sort(),
    [publishedInsts]
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      IIT: 0,
      NIT: 0,
      IIIT: 0,
      GFTI: 0,
      'State University': 0,
    };
    for (const inst of publishedInsts) {
      counts[inst.type] = (counts[inst.type] ?? 0) + 1;
    }
    return counts;
  }, [publishedInsts]);

  const branchGroups = useMemo(
    () => Array.from(new Set(programmes.map((p) => p.branchGroup))).sort(),
    [programmes]
  );

  const instIdsWithBranch = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of programmes) {
      const set = map.get(p.branchGroup) ?? new Set<string>();
      set.add(p.institutionId);
      map.set(p.branchGroup, set);
    }
    return map;
  }, [programmes]);

  // Branch-First Discovery rows
  const branchDiscoveryRows = useMemo(() => {
    if (!branchFirst) return [];
    const matchingProgs = programmes.filter((p) => p.branchGroup === branchGroup);
    const instMap = new Map(publishedInsts.map((i) => [i.id, i]));
    return matchingProgs
      .map((prog) => {
        const inst = instMap.get(prog.institutionId);
        if (!inst) return null;
        const primarySys = inst.systems[0] ?? 'josaa';
        const latestRound = getLatestRoundNumber(getSystemConfig(primarySys));
        const latestCutoffs = cutoffs.filter(
          (c) =>
            c.status === 'published' &&
            c.systemCode === primarySys &&
            c.academicYear === 2025 &&
            c.roundNumber === latestRound &&
            c.institutionId === inst.id &&
            c.programmeId === prog.id &&
            c.seatCategory === 'OPEN' &&
            c.seatPool === 'Gender-Neutral'
        );
        const osOrAi = latestCutoffs.find((c) => c.quota === 'OS' || c.quota === 'AI');
        const hsOrSpecial = latestCutoffs.find(
          (c) => c.quota === 'HS' || c.quota === 'GO' || c.quota === 'JK'
        );
        return { inst, prog, osOrAi, hsOrSpecial };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort(
        (a, b) =>
          (a.osOrAi?.closingRank ?? 999999) - (b.osOrAi?.closingRank ?? 999999)
      );
  }, [branchFirst, branchGroup, programmes, publishedInsts, cutoffs]);

  const filteredInsts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return publishedInsts.filter((i) => {
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      if (ownershipFilter !== 'all' && i.ownership !== ownershipFilter) return false;
      if (stateFilter !== 'all' && i.state !== stateFilter) return false;
      if (branchFilter !== 'all') {
        const allowed = instIdsWithBranch.get(branchFilter);
        if (!allowed || !allowed.has(i.id)) return false;
      }
      if (
        q &&
        !i.name.toLowerCase().includes(q) &&
        !i.shortName.toLowerCase().includes(q) &&
        !i.city.toLowerCase().includes(q) &&
        !i.state.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [publishedInsts, search, typeFilter, ownershipFilter, stateFilter, branchFilter, instIdsWithBranch]);

  const totalPages = Math.max(1, Math.ceil(filteredInsts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedInsts = filteredInsts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
      <Breadcrumbs items={breadcrumbs} />

      {/* Compact Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] tracking-tight">
            {branchFirst ? 'Branch-First Discovery' : 'Participating Colleges Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
            {branchFirst
              ? 'Compare participating IITs, NITs, IIITs, GFTIs, and State Universities side by side for a chosen branch with historical final-round OPEN closing ranks.'
              : 'Search and filter participating IITs, NITs, IIITs, GFTIs, and State Universities across JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE, and KCET.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!branchFirst && (
            <div
              role="group"
              aria-label="Directory layout view"
              className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-[#0B162C] text-white' : 'text-slate-500 hover:text-[#0B1F3A]'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-[#0B162C] text-white' : 'text-slate-500 hover:text-[#0B1F3A]'
                }`}
                title="Table view"
                aria-label="Table view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs">
            <Link
              to="/colleges"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                !branchFirst ? 'bg-[#0B162C] text-white' : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              By College
            </Link>
            <Link
              to="/branches"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                branchFirst ? 'bg-[#0B162C] text-white' : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              By Branch
            </Link>
          </div>
        </div>
      </div>

      <DemoDataNotice compact showHistoricalNote />

      {branchFirst ? (
        <div className="space-y-5">
          {/* Branch Group Selector */}
          <div className="flex flex-wrap gap-2">
            {branchGroups.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setBranchGroup(bg)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  branchGroup === bg
                    ? 'bg-[#0B162C] text-white border-[#0B162C]'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>

          {/* Branch-First Table */}
          <div className="app-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-4 sm:px-5">Institute</th>
                    <th className="py-2.5 px-3">Exact Programme</th>
                    <th className="py-2.5 px-3">Type · State</th>
                    <th className="py-2.5 px-3 text-right">2025 Latest Closing (OS/AI)</th>
                    <th className="py-2.5 px-3 text-right">2025 Latest Closing (HS/State)</th>
                    <th className="py-2.5 px-4 sm:px-5 text-right">Explore</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchDiscoveryRows.map(({ inst, prog, osOrAi, hsOrSpecial }) => (
                    <tr key={prog.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-3 px-4 sm:px-5">
                        <Link
                          to={`/colleges/${inst.slug}`}
                          className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8]"
                        >
                          {inst.name}
                        </Link>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          {inst.isDemo ? 'Demo data — not an official cutoff' : `Verified ${inst.verifiedAt}`}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-800">
                        {prog.name} ({prog.degree}, {prog.durationYears} yrs)
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {inst.type} · {inst.state}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#0B1F3A] whitespace-nowrap">
                        {osOrAi
                          ? `${osOrAi.closingRank.toLocaleString('en-IN')} (${osOrAi.quota})`
                          : 'Not available'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {hsOrSpecial
                          ? `${hsOrSpecial.closingRank.toLocaleString('en-IN')} (${hsOrSpecial.quota})`
                          : 'Not applicable'}
                      </td>
                      <td className="py-3 px-4 sm:px-5 text-right whitespace-nowrap">
                        <Link
                          to={`/cutoffs/${inst.slug}/${prog.code.toLowerCase()}`}
                          className="text-[#1D4ED8] font-semibold hover:underline"
                        >
                          Trends →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* College Directory Filters */}
          <div className="app-panel rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by college name, city, or state..."
                aria-label="Search colleges"
                className="w-full h-9 rounded-lg border border-slate-300/90 pl-9 pr-3 text-xs sm:text-sm"
              />
            </div>

            <select
              aria-label="Ownership"
              value={ownershipFilter}
              onChange={(e) => {
                setOwnershipFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-300/90 bg-white px-3 text-xs sm:text-sm"
            >
              <option value="all">All Ownership</option>
              <option value="Government">Government</option>
              <option value="Government Aided">Government Aided</option>
              <option value="Public-Private (PPP)">Public-Private (PPP)</option>
              <option value="Private">Private</option>
            </select>

            <select
              aria-label="Institute type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-300/90 bg-white px-3 text-xs sm:text-sm"
            >
              <option value="all">All Types ({publishedInsts.length})</option>
              <option value="IIT">IIT ({typeCounts.IIT})</option>
              <option value="NIT">NIT ({typeCounts.NIT})</option>
              <option value="IIIT">IIIT ({typeCounts.IIIT})</option>
              <option value="GFTI">GFTI ({typeCounts.GFTI})</option>
              <option value="State University">State University ({typeCounts['State University']})</option>
            </select>

            <select
              aria-label="State"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-300/90 bg-white px-3 text-xs sm:text-sm"
            >
              <option value="all">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              aria-label="Branch group"
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-300/90 bg-white px-3 text-xs sm:text-sm"
            >
              <option value="all">All Branches</option>
              {branchGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Directory Results Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-0.5">
            <span>
              Showing{' '}
              <strong className="font-semibold text-[#0B1F3A] tabular-nums">
                {filteredInsts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredInsts.length)}
              </strong>{' '}
              of{' '}
              <strong className="font-semibold text-[#0B1F3A] tabular-nums">
                {filteredInsts.length}
              </strong>{' '}
              institutes
            </span>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {typeCounts.IIT} IITs · {typeCounts.NIT} NIT+ · {typeCounts.IIIT} IIITs ·{' '}
              {typeCounts.GFTI} GFTIs · {typeCounts['State University']} State Universities
            </span>
          </div>

          {/* Empty State, Table View, or Grid View */}
          {paginatedInsts.length === 0 ? (
            <div className="app-panel rounded-xl p-10 text-center space-y-2">
              <h3 className="text-base font-display font-semibold text-[#0B1F3A]">
                No colleges match your filters
              </h3>
              <p className="text-xs text-slate-600">Try clearing search or filter criteria.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="app-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-4 sm:px-5">Institute</th>
                      <th className="py-2.5 px-3">Type · Location</th>
                      <th className="py-2.5 px-3 text-right">Programmes</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInsts.map((inst) => {
                      const isSaved = savedColleges.some(
                        (s) => s.institutionId === inst.id && !s.programmeId
                      );
                      const progCount = programmes.filter((p) => p.institutionId === inst.id).length;
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-3 px-4 sm:px-5">
                            <div className="flex items-center gap-2.5">
                              <InstitutionLogo institution={inst} size="sm" />
                              <div>
                                <Link
                                  to={`/colleges/${inst.slug}`}
                                  className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] block"
                                >
                                  {inst.name}
                                </Link>
                                <span className="text-[11px] text-slate-500">
                                  {inst.ownership || inst.type}
                                  {inst.establishedYear ? ` · Est. ${inst.establishedYear}` : ''} ·{' '}
                                  {inst.systems.map((s) => s.toUpperCase()).join(', ')}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {inst.type} · {inst.city}, {inst.state}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                            {progCount}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                            {inst.isDemo ? 'Demo data — not official' : `Verified ${inst.verifiedAt}`}
                          </td>
                          <td className="py-3 px-4 sm:px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => void toggleSaveCollege({ institution: inst })}
                                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-[#1D4ED8]"
                                title={isSaved ? t('saved') : t('saveCollege')}
                              >
                                {isSaved ? (
                                  <Check className="w-3.5 h-3.5 text-teal-700" />
                                ) : (
                                  <Bookmark className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/compare?add=${inst.id}`)}
                                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-[#1D4ED8]"
                                title={t('compareAction')}
                              >
                                <Scale className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                to={`/colleges/${inst.slug}`}
                                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-[#1D4ED8] hover:bg-blue-50/40"
                              >
                                Open →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedInsts.map((inst) => {
                const isSaved = savedColleges.some(
                  (s) => s.institutionId === inst.id && !s.programmeId
                );
                const progCount = programmes.filter((p) => p.institutionId === inst.id).length;
                return (
                  <div
                    key={inst.id}
                    className="app-panel rounded-xl overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      <Link
                        to={`/colleges/${inst.slug}`}
                        className="block aspect-[16/9] bg-gradient-to-br from-[#0B162C] to-[#1E3A5F] overflow-hidden"
                      >
                        {inst.imageUrl ? (
                          <img
                            src={inst.imageUrl}
                            alt={`${inst.name} campus`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 font-display font-semibold text-sm">
                            {inst.shortName}
                          </div>
                        )}
                      </Link>
                      <div className="p-4 sm:p-5 space-y-2">
                        <div className="flex items-start gap-2.5">
                          <InstitutionLogo institution={inst} size="sm" />
                          <div className="min-w-0">
                            <div className="text-[11px] text-slate-500 truncate">
                              {inst.ownership || inst.type} · {inst.city}, {inst.state}
                            </div>
                            <Link
                              to={`/colleges/${inst.slug}`}
                              className="block text-sm sm:text-base font-display font-semibold text-[#0B1F3A] group-hover:text-[#1D4ED8] leading-snug transition-colors mt-0.5"
                            >
                              {inst.name}
                            </Link>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {inst.overview}
                        </p>
                        <p className="text-[11px] text-slate-500 pt-1">
                          <span className="font-mono tabular-nums">{progCount}</span> branches ·{' '}
                          {inst.isDemo ? 'Demo data — not official' : `Verified ${inst.verifiedAt}`}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/55 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void toggleSaveCollege({ institution: inst })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {isSaved ? (
                            <Check className="w-3.5 h-3.5 text-teal-700" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                          <span>{isSaved ? t('saved') : t('saveCollege')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/compare?add=${inst.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>{t('compareAction')}</span>
                        </button>
                      </div>
                      <Link
                        to={`/colleges/${inst.slug}`}
                        className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap"
                      >
                        Profile →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1 text-xs">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="font-mono tabular-nums text-slate-600">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
