import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Flag, Plus, RotateCcw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { COUNSELLING_SYSTEMS, getSystemConfig } from '../config/systems/registry.ts';
import { computeRoundWiseMovement, computeYoYChange } from '../engine/analytics.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { RoundMovementChart, YoYCutoffChart } from '../components/CutoffCharts.tsx';
import { exportCutoffsCsv } from '../lib/exporters.ts';
import { usePageSeo } from '../lib/seo.ts';
import { BreadcrumbItem, buildCutoffDatasetJsonLd } from '../lib/seoSchema.ts';
import { CutoffRecord, SeatPool } from '../types/domain.ts';

const PAGE_SIZE = 20;

export const CutoffsPage: React.FC = () => {
  const params = useParams<{
    param1?: string;
    param2?: string;
  }>();

  const resolvedRoute = useMemo(() => {
    const p1 = params.param1;
    const p2 = params.param2;
    if (!p1) return { system: undefined, year: undefined, college: undefined, course: undefined };
    const matchedSystem = getSystemConfig(p1);
    if (matchedSystem) {
      const isYear = p2 && /^\d{4}$/.test(p2);
      return {
        system: matchedSystem.code,
        year: isYear ? p2 : undefined,
        college: undefined,
        course: !isYear ? p2 : undefined,
      };
    }
    return {
      system: undefined,
      year: undefined,
      college: p1,
      course: p2,
    };
  }, [params.param1, params.param2]);

  const {
    cutoffs,
    institutions,
    programmes,
    profile,
    addItemToChoiceList,
    openReportModal,
    trackMetric,
    t,
  } = useApp();

  const matchedInstitution = useMemo(
    () =>
      resolvedRoute.college
        ? institutions.find((i) => i.slug.toLowerCase() === resolvedRoute.college!.toLowerCase())
        : undefined,
    [resolvedRoute.college, institutions]
  );

  const matchedProgramme = useMemo(() => {
    if (!matchedInstitution || !resolvedRoute.course) return undefined;
    const slug = resolvedRoute.course.toLowerCase();
    return programmes.find(
      (p) =>
        p.institutionId === matchedInstitution.id &&
        (p.code.toLowerCase() === slug ||
          p.name.toLowerCase().includes(slug.replace(/-/g, ' ')))
    );
  }, [matchedInstitution, resolvedRoute.course, programmes]);

  const initialSystemCode =
    resolvedRoute.system || matchedInstitution?.systems[0] || 'josaa';
  const initialSystemCfg = getSystemConfig(initialSystemCode) ?? COUNSELLING_SYSTEMS[0];

  const [systemCode, setSystemCode] = useState(initialSystemCode);
  const [academicYear, setAcademicYear] = useState<string>(resolvedRoute.year || '2025');
  const [roundFilter, setRoundFilter] = useState<string>(
    String(initialSystemCfg.rounds[initialSystemCfg.rounds.length - 1]?.number ?? 6)
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('OPEN');
  const [poolFilter, setPoolFilter] = useState<string>('Gender-Neutral');
  const [quotaFilter, setQuotaFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(
    matchedInstitution
      ? matchedInstitution.slug
      : [resolvedRoute.college, resolvedRoute.course]
          .filter(Boolean)
          .join(' ')
          .replace(/-/g, ' ')
  );
  const [myRankOverlay, setMyRankOverlay] = useState<string>(
    profile?.crlRank ? String(profile.crlRank) : ''
  );
  const [page, setPage] = useState(1);
  const [selectedChartRowId, setSelectedChartRowId] = useState<string>('');

  const system = getSystemConfig(systemCode) ?? COUNSELLING_SYSTEMS[0];

  useEffect(() => {
    if (resolvedRoute.system) {
      setSystemCode(resolvedRoute.system);
    } else if (matchedInstitution?.systems[0]) {
      setSystemCode(matchedInstitution.systems[0]);
    }
    if (resolvedRoute.year) setAcademicYear(resolvedRoute.year);
    if (matchedInstitution) {
      setSearchQuery(matchedInstitution.slug);
    } else if (resolvedRoute.college || resolvedRoute.course) {
      setSearchQuery(
        [resolvedRoute.college, resolvedRoute.course]
          .filter(Boolean)
          .join(' ')
          .replace(/-/g, ' ')
      );
    } else if (!params.param1) {
      setSearchQuery('');
    }
  }, [
    resolvedRoute.system,
    resolvedRoute.year,
    resolvedRoute.college,
    resolvedRoute.course,
    matchedInstitution,
    params.param1,
  ]);

  useEffect(() => {
    const cfg = getSystemConfig(systemCode);
    if (!cfg) return;
    const latestRound = String(cfg.rounds[cfg.rounds.length - 1]?.number ?? 1);
    if (roundFilter !== 'all' && !cfg.rounds.some((r) => String(r.number) === roundFilter)) {
      setRoundFilter(latestRound);
    }
    if (academicYear !== 'all' && !cfg.availableYears.includes(Number(academicYear))) {
      setAcademicYear(String(cfg.availableYears[0] ?? 2025));
    }
    if (quotaFilter !== 'all' && !cfg.allowedQuotas.some((q) => q.code === quotaFilter)) {
      setQuotaFilter('all');
    }
    if (typeFilter !== 'all' && !cfg.instituteTypes.includes(typeFilter as typeof cfg.instituteTypes[number])) {
      setTypeFilter('all');
    }
  }, [systemCode]);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    if (matchedInstitution) {
      return [
        { label: 'Home', to: '/' },
        { label: 'Cutoffs', to: '/cutoffs' },
        { label: matchedInstitution.shortName, to: `/colleges/${matchedInstitution.slug}` },
        { label: matchedProgramme ? `${matchedProgramme.code} Cutoffs` : 'Cutoffs' },
      ];
    }
    if (resolvedRoute.system) {
      if (resolvedRoute.year) {
        return [
          { label: 'Home', to: '/' },
          { label: 'Cutoffs', to: '/cutoffs' },
          { label: system.shortName, to: `/cutoffs/${system.code}` },
          { label: `${resolvedRoute.year} Cutoffs` },
        ];
      }
      return [
        { label: 'Home', to: '/' },
        { label: 'Cutoffs', to: '/cutoffs' },
        { label: `${system.shortName} Cutoffs` },
      ];
    }
    return [{ label: 'Home', to: '/' }, { label: 'Cutoff Explorer' }];
  }, [matchedInstitution, matchedProgramme, resolvedRoute.system, resolvedRoute.year, system]);

  const canonicalPath = useMemo(() => {
    if (matchedInstitution) {
      return matchedProgramme
        ? `/cutoffs/${matchedInstitution.slug}/${matchedProgramme.code.toLowerCase()}`
        : `/cutoffs/${matchedInstitution.slug}`;
    }
    if (resolvedRoute.system) {
      return resolvedRoute.year
        ? `/cutoffs/${system.code}/${resolvedRoute.year}`
        : `/cutoffs/${system.code}`;
    }
    return '/cutoffs';
  }, [matchedInstitution, matchedProgramme, resolvedRoute.system, resolvedRoute.year, system.code]);

  const seoTitle = matchedInstitution
    ? matchedProgramme
      ? `${matchedInstitution.shortName} ${matchedProgramme.name} Cutoffs (${system.shortName})`
      : `${matchedInstitution.name} Opening & Closing Ranks (${system.shortName})`
    : `${system.shortName}${academicYear !== 'all' ? ` ${academicYear}` : ''} Opening & Closing Ranks`;

  const seoDescription = matchedInstitution
    ? `Inspect historical ${system.shortName} opening and closing ranks, year-over-year changes, and round movement for ${matchedProgramme ? `${matchedProgramme.name} at ` : ''}${matchedInstitution.name}.`
    : `Explore historical ${system.shortName}${academicYear !== 'all' ? ` ${academicYear}` : ''} opening and closing ranks, year-over-year trends, and round-wise movement with full source attribution.`;

  const datasetJsonLd = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://navigator.famral.com';
    return buildCutoffDatasetJsonLd({
      name: seoTitle,
      description: seoDescription,
      canonicalPath,
      baseUrl: origin,
      academicYear,
      systemName: system.shortName,
      isDemo: true,
    });
  }, [seoTitle, seoDescription, canonicalPath, academicYear, system.shortName]);

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath,
    ogType: matchedInstitution ? 'article' : 'website',
    ogImage: matchedInstitution?.imageUrl,
    breadcrumbs,
    jsonLd: datasetJsonLd,
  });

  const publishedCutoffs = useMemo(
    () => cutoffs.filter((c) => c.status === 'published'),
    [cutoffs]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const courseSlug = resolvedRoute.course?.toLowerCase() ?? '';
    return publishedCutoffs
      .filter((c) => {
        if (c.systemCode.toLowerCase() !== systemCode.toLowerCase()) return false;
        if (academicYear !== 'all' && c.academicYear !== Number(academicYear)) return false;
        if (roundFilter !== 'all' && c.roundNumber !== Number(roundFilter)) return false;
        if (categoryFilter !== 'all' && c.seatCategory !== categoryFilter) return false;
        if (poolFilter !== 'all' && c.seatPool !== poolFilter) return false;
        if (quotaFilter !== 'all' && c.quota !== quotaFilter) return false;
        if (typeFilter !== 'all' && c.institutionType !== typeFilter) return false;
        if (
          courseSlug &&
          !c.programmeName.toLowerCase().includes(courseSlug.replace(/-/g, ' ')) &&
          !c.programmeId.toLowerCase().includes(courseSlug)
        ) {
          return false;
        }
        if (
          q &&
          !c.institutionName.toLowerCase().includes(q) &&
          !c.institutionSlug.toLowerCase().includes(q) &&
          !c.programmeName.toLowerCase().includes(q) &&
          !c.state.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.closingRank - b.closingRank);
  }, [
    publishedCutoffs,
    systemCode,
    academicYear,
    roundFilter,
    categoryFilter,
    poolFilter,
    quotaFilter,
    typeFilter,
    searchQuery,
    resolvedRoute.course,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeChartRecord: CutoffRecord | undefined = useMemo(() => {
    if (selectedChartRowId) {
      const found = filtered.find((c) => c.id === selectedChartRowId);
      if (found) return found;
    }
    return filtered[0];
  }, [filtered, selectedChartRowId]);

  const yoyPoints = useMemo(() => {
    if (!activeChartRecord) return [];
    return computeYoYChange(publishedCutoffs, {
      systemCode: activeChartRecord.systemCode,
      roundNumber: activeChartRecord.roundNumber,
      institutionId: activeChartRecord.institutionId,
      programmeId: activeChartRecord.programmeId,
      quota: activeChartRecord.quota,
      seatCategory: activeChartRecord.seatCategory,
      seatPool: activeChartRecord.seatPool as SeatPool,
      rankType: activeChartRecord.rankType,
    });
  }, [activeChartRecord, publishedCutoffs]);

  const roundPoints = useMemo(() => {
    if (!activeChartRecord) return [];
    return computeRoundWiseMovement(publishedCutoffs, {
      systemCode: activeChartRecord.systemCode,
      academicYear: activeChartRecord.academicYear,
      institutionId: activeChartRecord.institutionId,
      programmeId: activeChartRecord.programmeId,
      quota: activeChartRecord.quota,
      seatCategory: activeChartRecord.seatCategory,
      seatPool: activeChartRecord.seatPool as SeatPool,
      rankType: activeChartRecord.rankType,
    });
  }, [activeChartRecord, publishedCutoffs]);

  const parsedOverlayRank =
    myRankOverlay.trim() !== '' && Number(myRankOverlay) > 0 ? Number(myRankOverlay) : null;

  const hasDemo = filtered.some((c) => c.isDemo);

  const hasCustomFilters =
    searchQuery.trim() !== '' ||
    quotaFilter !== 'all' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'OPEN' ||
    poolFilter !== 'Gender-Neutral';

  const resetFilters = () => {
    setSearchQuery('');
    setQuotaFilter('all');
    setTypeFilter('all');
    setCategoryFilter('OPEN');
    setPoolFilter('Gender-Neutral');
    setAcademicYear(String(system.availableYears[0] ?? 2025));
    setRoundFilter(String(system.rounds[system.rounds.length - 1]?.number ?? 1));
    setPage(1);
  };

  const systemInstitutions = useMemo(
    () =>
      institutions
        .filter((i) => i.status === 'published' && i.systems.includes(system.code))
        .slice(0, 6),
    [institutions, system.code]
  );

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
      <Breadcrumbs items={breadcrumbs} />

      {/* Compact Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] tracking-tight">
            {matchedInstitution
              ? `${matchedInstitution.shortName}${matchedProgramme ? ` — ${matchedProgramme.name}` : ''} Cutoffs`
              : `${system.shortName}${academicYear !== 'all' ? ` ${academicYear}` : ''} Opening & Closing Rank Explorer`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Click any row below to inspect its multi-year and round-by-round trajectory in the charts.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print shrink-0">
          <button
            type="button"
            onClick={() => exportCutoffsCsv(filtered, `famral-cutoffs-${systemCode}-${academicYear}.csv`)}
            disabled={filtered.length === 0}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold text-[#0B1F3A] bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#1D4ED8]" />
            {t('downloadCsv')}
          </button>
        </div>
      </div>

      {hasDemo && <DemoDataNotice compact showHistoricalNote />}

      {/* Filter Toolbar Panel */}
      <div className="app-panel rounded-xl p-4 space-y-3.5 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
                trackMetric('cutoff_search', systemCode);
              }}
              placeholder="Search institute, branch, or state (e.g., NIT Trichy, CSE, Karnataka)..."
              aria-label="Search cutoffs"
              className="w-full h-9 rounded-lg border border-slate-300/90 pl-9 pr-3 text-xs sm:text-sm"
            />
          </div>

          <select
            aria-label="Counselling system"
            value={systemCode}
            onChange={(e) => {
              setSystemCode(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-slate-300/90 bg-white px-3 text-xs sm:text-sm"
          >
            {COUNSELLING_SYSTEMS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.shortName} ({s.examName})
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            value={myRankOverlay}
            onChange={(e) => setMyRankOverlay(e.target.value)}
            placeholder="Overlay My Rank on charts..."
            aria-label="My rank overlay on charts"
            className="w-full h-9 rounded-lg border border-slate-300/90 px-3 text-xs sm:text-sm font-mono tabular-nums"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <select
            aria-label="Academic year"
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs font-mono"
          >
            <option value="all">All Years</option>
            {system.availableYears.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>

          <select
            aria-label="Round"
            value={roundFilter}
            onChange={(e) => {
              setRoundFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
          >
            <option value="all">All Rounds</option>
            {system.rounds.map((r) => (
              <option key={r.number} value={String(r.number)}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Seat category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
          >
            <option value="all">All Categories</option>
            {system.allowedCategories.flatMap((c) => [c, `${c}${system.pwdSuffix}`]).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Seat pool"
            value={poolFilter}
            onChange={(e) => {
              setPoolFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
          >
            <option value="all">All Seat Pools</option>
            {system.allowedSeatPools.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            aria-label="Quota"
            value={quotaFilter}
            onChange={(e) => {
              setQuotaFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
          >
            <option value="all">All Quotas</option>
            {system.allowedQuotas.map((q) => (
              <option key={q.code} value={q.code}>
                {q.code} — {q.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Institute type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
          >
            <option value="all">All Types</option>
            {system.instituteTypes.map((it) => (
              <option key={it} value={it}>
                {it}
              </option>
            ))}
          </select>
        </div>

        {/* Quick views + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <span>Systems:</span>
            {COUNSELLING_SYSTEMS.map((s) => (
              <Link
                key={s.code}
                to={`/cutoffs/${s.code}/2025`}
                className={`hover:underline font-medium ${
                  systemCode.toLowerCase() === s.code ? 'text-[#0B1F3A] font-semibold' : 'text-[#1D4ED8]'
                }`}
              >
                {s.shortName} 2025
              </Link>
            ))}
          </div>
          {hasCustomFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] hover:underline whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Interactive Trend Charts for Selected Record */}
      {activeChartRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="app-panel rounded-xl p-5 space-y-3">
            <div>
              <p className="text-[11px] text-slate-500">
                Selected Row · {activeChartRecord.quota} · {activeChartRecord.seatCategory} · {activeChartRecord.seatPool} · {activeChartRecord.rankType}
              </p>
              <h2 className="text-sm sm:text-base font-display font-semibold text-[#0B1F3A] mt-0.5">
                {activeChartRecord.institutionName} — {activeChartRecord.programmeName}
              </h2>
            </div>
            <YoYCutoffChart
              points={yoyPoints}
              studentRank={parsedOverlayRank}
              rankTypeLabel={activeChartRecord.rankType}
            />
          </div>

          <div className="app-panel rounded-xl p-5 space-y-3">
            <div>
              <p className="text-[11px] text-slate-500">
                Round-by-Round Progression · {activeChartRecord.systemCode.toUpperCase()} {activeChartRecord.academicYear}
              </p>
              <h2 className="text-sm sm:text-base font-display font-semibold text-[#0B1F3A] mt-0.5">
                How Ranks Moved Across Rounds
              </h2>
            </div>
            <RoundMovementChart
              points={roundPoints}
              studentRank={parsedOverlayRank}
              academicYear={activeChartRecord.academicYear}
            />
          </div>
        </div>
      )}

      {/* Cutoffs Table */}
      <div className="app-panel rounded-xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <h3 className="text-base font-display font-semibold text-[#0B1F3A]">
              No Cutoff Records Match These Filters
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Try changing the academic year, round, category, or search term. Systems marked as templates will display cutoffs once imported via Admin CSV Import.
            </p>
            {hasCustomFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B162C] text-white text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-4 sm:px-5">Institute &amp; Programme</th>
                    <th className="py-2.5 px-3">Year / Round</th>
                    <th className="py-2.5 px-3">Quota / Category / Pool</th>
                    <th className="py-2.5 px-3">Rank Type</th>
                    <th className="py-2.5 px-3 text-right">Opening</th>
                    <th className="py-2.5 px-3 text-right">Closing</th>
                    <th className="py-2.5 px-3">Source &amp; Status</th>
                    <th className="py-2.5 px-4 sm:px-5 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((c) => {
                    const isSelected = activeChartRecord?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedChartRowId(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/90'
                        }`}
                      >
                        <td className="py-3 px-4 sm:px-5">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/colleges/${c.institutionSlug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8]"
                            >
                              {c.institutionName}
                            </Link>
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-[#1D4ED8] whitespace-nowrap">
                                · Viewing trends
                              </span>
                            )}
                          </div>
                          <span className="text-slate-600 block mt-0.5">{c.programmeName}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums">
                          <div className="font-semibold text-slate-900">{c.academicYear}</div>
                          <div className="text-[11px] font-sans text-slate-500">{c.roundLabel}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {c.quota} · {c.seatCategory}
                          </div>
                          <div className="text-[11px] text-slate-500">{c.seatPool}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {c.rankType}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {c.openingRank.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#0B1F3A] whitespace-nowrap">
                          {c.closingRank.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500 max-w-[190px]">
                          <div className="truncate" title={c.sourceName}>{c.sourceName}</div>
                          <div className={c.isDemo ? 'text-amber-700 font-medium' : 'text-teal-700'}>
                            {c.isDemo ? 'Demo data — not official' : `Verified ${c.verifiedAt}`}
                          </div>
                        </td>
                        <td
                          className="py-3 px-4 sm:px-5 text-right whitespace-nowrap no-print"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                void addItemToChoiceList(
                                  {
                                    id: `item_${Date.now().toString(36)}`,
                                    institutionId: c.institutionId,
                                    institutionSlug: c.institutionSlug,
                                    institutionName: c.institutionName,
                                    institutionType: c.institutionType,
                                    state: c.state,
                                    programmeId: c.programmeId,
                                    programmeName: c.programmeName,
                                    branchGroup: c.branchGroup,
                                    quota: c.quota,
                                    seatCategory: c.seatCategory,
                                    seatPool: c.seatPool,
                                    rankType: c.rankType,
                                    closingRank: c.closingRank,
                                    academicYear: c.academicYear,
                                    roundLabel: c.roundLabel,
                                    sourceName: c.sourceName,
                                    isDemo: c.isDemo,
                                    tag: 'Unassigned',
                                    notes: '',
                                  },
                                  undefined,
                                  c.systemCode
                                )
                              }
                              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors"
                              title={t('addToChoiceList')}
                              aria-label={t('addToChoiceList')}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openReportModal({
                                  entityType: 'cutoff',
                                  entityId: c.id,
                                  entityLabel: `${c.institutionName} — ${c.programmeName} (${c.academicYear} ${c.roundLabel} ${c.seatCategory})`,
                                })
                              }
                              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-amber-700 transition-colors"
                              title={t('reportError')}
                              aria-label={t('reportError')}
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 sm:px-5 py-3 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono tabular-nums text-[11px]">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length.toLocaleString('en-IN')} rows
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="font-mono tabular-nums text-[11px]">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* SEO Internal Linking Strip: System Years, Participating Colleges & Planning Tools */}
      <section className="app-panel rounded-xl p-5 space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">
            Explore {system.shortName} Cutoff Archives &amp; Planning Tools
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            {system.availableYears.map((yr) => (
              <Link
                key={yr}
                to={`/cutoffs/${system.code}/${yr}`}
                className="text-[#1D4ED8] hover:underline"
              >
                {system.shortName} {yr} Cutoffs
              </Link>
            ))}
            <span className="text-slate-300" aria-hidden="true">|</span>
            <Link to={`/predictor/${system.code}`} className="text-[#1D4ED8] hover:underline">
              {system.shortName} Predictor →
            </Link>
            <Link to={`/counselling/${system.code}`} className="text-[#1D4ED8] hover:underline">
              {system.shortName} Counselling Hub →
            </Link>
          </div>
        </div>

        {systemInstitutions.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Top {system.shortName} Colleges:</span>
            {systemInstitutions.map((inst) => (
              <Link
                key={inst.id}
                to={`/colleges/${inst.slug}`}
                className="text-[#0B1F3A] hover:text-[#1D4ED8] hover:underline font-medium"
              >
                {inst.shortName}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
