import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  Check,
  Download,
  Flag,
  Plus,
  Printer,
  RotateCcw,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  COUNSELLING_SYSTEMS,
  getEffectiveCategory,
  getExpectedRankType,
  getSystemConfig,
  INDIAN_STATES_AND_UTS,
} from '../config/systems/registry.ts';
import { runPrediction } from '../engine/predictor.ts';
import { computeWhatIfScenarios } from '../engine/analytics.ts';
import {
  ClassificationBand,
  PredictionInput,
  PredictionMatch,
  SeatPool,
} from '../types/domain.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { exportPredictionMatchesCsv } from '../lib/exporters.ts';
import { usePageSeo } from '../lib/seo.ts';
import { BreadcrumbItem, buildAbsoluteUrl } from '../lib/seoSchema.ts';

export const PredictorPage: React.FC = () => {
  const {
    cutoffs,
    institutions,
    profile,
    savedColleges,
    toggleSaveCollege,
    addItemToChoiceList,
    savePredictionRun,
    openReportModal,
    showToast,
    trackMetric,
    t,
  } = useApp();

  const { system: systemParam } = useParams<{ system?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const matchedParamSystem = systemParam ? getSystemConfig(systemParam) : undefined;

  // Form state initialized from SEO route param, URL query params, or user profile
  const [systemCode, setSystemCode] = useState(
    matchedParamSystem?.code || searchParams.get('system') || profile?.systemCode || 'josaa'
  );
  const selectedSystem = useMemo(
    () => getSystemConfig(systemCode) ?? COUNSELLING_SYSTEMS[0],
    [systemCode]
  );

  useEffect(() => {
    if (matchedParamSystem && matchedParamSystem.code !== systemCode) {
      setSystemCode(matchedParamSystem.code);
      setAcademicYear(matchedParamSystem.availableYears[0] ?? 2025);
      setRoundNumber(
        matchedParamSystem.rounds[matchedParamSystem.rounds.length - 1]?.number ?? 1
      );
    }
  }, [matchedParamSystem?.code]);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () =>
      matchedParamSystem
        ? [
            { label: 'Home', to: '/' },
            { label: 'College Predictor', to: '/predictor' },
            { label: matchedParamSystem.shortName },
          ]
        : [{ label: 'Home', to: '/' }, { label: 'College Predictor' }],
    [matchedParamSystem]
  );

  const canonicalPath = matchedParamSystem ? `/predictor/${matchedParamSystem.code}` : '/predictor';
  const seoTitle = matchedParamSystem
    ? `${matchedParamSystem.shortName} College Predictor (${matchedParamSystem.examName})`
    : 'College Predictor – JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET';
  const seoDescription = matchedParamSystem
    ? `Compare your ${matchedParamSystem.examName} rank against historical ${matchedParamSystem.shortName} opening and closing ranks by quota, category, and seat pool.`
    : 'Compare your entrance-exam rank against historical JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET opening and closing ranks.';

  const predictorJsonLd = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://navigator.famral.com';
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: matchedParamSystem
        ? `${matchedParamSystem.shortName} College Predictor`
        : 'Famral Navigator College Predictor',
      url: buildAbsoluteUrl(origin, canonicalPath),
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      description: seoDescription,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    };
  }, [matchedParamSystem, canonicalPath, seoDescription]);

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath,
    breadcrumbs,
    jsonLd: predictorJsonLd,
  });

  const [academicYear, setAcademicYear] = useState<number>(
    Number(searchParams.get('year')) || selectedSystem.availableYears[0] || 2025
  );
  const [roundNumber, setRoundNumber] = useState<number>(
    Number(searchParams.get('round')) ||
      selectedSystem.rounds[selectedSystem.rounds.length - 1]?.number ||
      6
  );
  const [category, setCategory] = useState(
    searchParams.get('category') || profile?.category || 'OPEN'
  );
  const [isPwd, setIsPwd] = useState(
    searchParams.get('pwd') === '1' || Boolean(profile?.isPwd)
  );
  const [gender, setGender] = useState<SeatPool>(
    (searchParams.get('gender') as SeatPool) || profile?.gender || 'Gender-Neutral'
  );
  const [homeState, setHomeState] = useState(
    searchParams.get('state') || profile?.homeState || 'Uttar Pradesh'
  );
  const [crlInput, setCrlInput] = useState(
    searchParams.get('crl') || (profile?.crlRank ? String(profile.crlRank) : '12500')
  );
  const [catRankInput, setCatRankInput] = useState(
    searchParams.get('catRank') || (profile?.categoryRank ? String(profile.categoryRank) : '')
  );
  const [nearMarginPercent, setNearMarginPercent] = useState<number>(
    Number(searchParams.get('margin')) || selectedSystem.defaultNearMarginPercent
  );

  // Result filters & sorting
  const [bandFilter, setBandFilter] = useState<'all' | ClassificationBand>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [quotaFilter, setQuotaFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'closing_asc' | 'closing_desc' | 'name_asc'>('closing_asc');

  // Always live on open so users immediately see an interactive workspace
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(true);
  const [whatIfCategory, setWhatIfCategory] = useState<string>(category);

  // Sync round/year when system changes
  useEffect(() => {
    if (!selectedSystem.availableYears.includes(academicYear)) {
      setAcademicYear(selectedSystem.availableYears[0] ?? 2025);
    }
    if (!selectedSystem.rounds.some((r) => r.number === roundNumber)) {
      setRoundNumber(selectedSystem.rounds[selectedSystem.rounds.length - 1]?.number ?? 1);
    }
  }, [selectedSystem, academicYear, roundNumber]);

  const effectiveCategory = getEffectiveCategory(selectedSystem, category, isPwd);
  const expectedRankType = getExpectedRankType(selectedSystem, effectiveCategory);

  const predictionInput: PredictionInput = useMemo(
    () => ({
      examCode: selectedSystem.examCode,
      systemCode: selectedSystem.code,
      academicYear,
      roundNumber,
      crlRank: crlInput.trim() === '' ? null : Number(crlInput),
      categoryRank: catRankInput.trim() === '' ? null : Number(catRankInput),
      category,
      isPwd,
      gender,
      homeState,
      nearMarginPercent,
    }),
    [
      selectedSystem,
      academicYear,
      roundNumber,
      crlInput,
      catRankInput,
      category,
      isPwd,
      gender,
      homeState,
      nearMarginPercent,
    ]
  );

  const result = useMemo(
    () => (hasSubmitted ? runPrediction(predictionInput, cutoffs, selectedSystem) : null),
    [hasSubmitted, predictionInput, cutoffs, selectedSystem]
  );

  const whatIfRows = useMemo(() => {
    if (!result || !result.valid) return [];
    return computeWhatIfScenarios(
      { ...predictionInput, category: whatIfCategory },
      cutoffs,
      selectedSystem,
      [-15, -5, 0, 5, 15]
    );
  }, [result, predictionInput, whatIfCategory, cutoffs, selectedSystem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setWhatIfCategory(category);
    const nextParams = new URLSearchParams({
      system: selectedSystem.code,
      year: String(academicYear),
      round: String(roundNumber),
      category,
      pwd: isPwd ? '1' : '0',
      gender,
      state: homeState,
      margin: String(nearMarginPercent),
    });
    if (expectedRankType === 'CRL' && crlInput.trim()) nextParams.set('crl', crlInput.trim());
    if (expectedRankType === 'CATEGORY_RANK' && catRankInput.trim())
      nextParams.set('catRank', catRankInput.trim());
    setSearchParams(nextParams, { replace: true });
    trackMetric('predictor_run', selectedSystem.code);
  };

  const hasActiveResultFilters =
    bandFilter !== 'all' ||
    typeFilter !== 'all' ||
    stateFilter !== 'all' ||
    branchFilter !== 'all' ||
    quotaFilter !== 'all';

  const resetResultFilters = () => {
    setBandFilter('all');
    setTypeFilter('all');
    setStateFilter('all');
    setBranchFilter('all');
    setQuotaFilter('all');
  };

  const filteredMatches = useMemo(() => {
    if (!result || !result.valid) return [];
    let list = result.matches;
    if (bandFilter !== 'all') list = list.filter((m) => m.classification === bandFilter);
    if (typeFilter !== 'all') list = list.filter((m) => m.cutoff.institutionType === typeFilter);
    if (stateFilter !== 'all') list = list.filter((m) => m.cutoff.state === stateFilter);
    if (branchFilter !== 'all') list = list.filter((m) => m.cutoff.branchGroup === branchFilter);
    if (quotaFilter !== 'all') list = list.filter((m) => m.cutoff.quota === quotaFilter);

    const sorted = [...list];
    if (sortBy === 'closing_asc') {
      sorted.sort((a, b) => a.cutoff.closingRank - b.cutoff.closingRank);
    } else if (sortBy === 'closing_desc') {
      sorted.sort((a, b) => b.cutoff.closingRank - a.cutoff.closingRank);
    } else {
      sorted.sort((a, b) => a.cutoff.institutionName.localeCompare(b.cutoff.institutionName));
    }
    return sorted;
  }, [result, bandFilter, typeFilter, stateFilter, branchFilter, quotaFilter, sortBy]);

  const distinctBranches = useMemo(
    () => Array.from(new Set((result?.matches ?? []).map((m) => m.cutoff.branchGroup))).sort(),
    [result]
  );
  const distinctStates = useMemo(
    () => Array.from(new Set((result?.matches ?? []).map((m) => m.cutoff.state))).sort(),
    [result]
  );
  const distinctQuotas = useMemo(
    () => Array.from(new Set((result?.matches ?? []).map((m) => m.cutoff.quota))).sort(),
    [result]
  );

  const fieldError = (field: string) =>
    result && !result.valid ? result.errors.find((e) => e.field === field)?.message : undefined;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Shareable result summary link copied (includes provenance & demo notice).');
    } catch {
      showToast('Copy the URL from your browser address bar to share this result.');
    }
  };

  const handleAddToChoice = async (m: PredictionMatch) => {
    const tag =
      m.classification === 'within'
        ? 'Safer'
        : m.classification === 'near'
          ? 'Target'
          : 'Dream';
    await addItemToChoiceList(
      {
        id: `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        institutionId: m.cutoff.institutionId,
        institutionSlug: m.cutoff.institutionSlug,
        institutionName: m.cutoff.institutionName,
        institutionType: m.cutoff.institutionType,
        state: m.cutoff.state,
        programmeId: m.cutoff.programmeId,
        programmeName: m.cutoff.programmeName,
        branchGroup: m.cutoff.branchGroup,
        quota: m.cutoff.quota,
        seatCategory: m.cutoff.seatCategory,
        seatPool: m.cutoff.seatPool,
        rankType: m.cutoff.rankType,
        closingRank: m.cutoff.closingRank,
        academicYear: m.cutoff.academicYear,
        roundLabel: m.cutoff.roundLabel,
        sourceName: m.cutoff.sourceName,
        isDemo: m.cutoff.isDemo,
        tag,
        notes: '',
      },
      undefined,
      m.cutoff.systemCode
    );
  };

  const instMap = useMemo(() => new Map(institutions.map((i) => [i.id, i])), [institutions]);

  const totalCount = Math.max(1, result?.counts.total ?? 0);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
      <Breadcrumbs items={breadcrumbs} />

      {/* Compact Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] tracking-tight">
            {matchedParamSystem
              ? `${matchedParamSystem.shortName} Historical Cutoff Predictor`
              : 'Historical Cutoff Predictor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Compare your rank against stored opening and closing ranks using per-system quota and rank-type rules. Historical comparison only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold shrink-0 no-print">
          <Link to={`/cutoffs/${selectedSystem.code}/2025`} className="text-[#1D4ED8] hover:underline whitespace-nowrap">
            {selectedSystem.shortName} Cutoffs →
          </Link>
          <Link to={`/counselling/${selectedSystem.code}`} className="text-[#1D4ED8] hover:underline whitespace-nowrap">
            {selectedSystem.shortName} Counselling Hub →
          </Link>
          <Link
            to="/glossary"
            className="text-slate-600 hover:text-[#0B1F3A] hover:underline whitespace-nowrap"
          >
            Rank &amp; Quota Glossary →
          </Link>
        </div>
      </div>

      {/* Search-Friendly System Switcher Links */}
      <div className="flex flex-wrap items-center gap-2 text-xs no-print">
        <span className="text-slate-500 font-medium">Predictors:</span>
        {COUNSELLING_SYSTEMS.map((sys) => (
          <Link
            key={sys.code}
            to={`/predictor/${sys.code}`}
            className={`px-2.5 py-1 rounded-md border transition-colors ${
              selectedSystem.code === sys.code
                ? 'bg-[#0B162C] text-white border-[#0B162C] font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
            }`}
          >
            {sys.shortName}
          </Link>
        ))}
      </div>

      {/* Predictor Parameters Panel */}
      <form
        onSubmit={handleSubmit}
        className="app-panel rounded-xl overflow-hidden no-print"
        noValidate
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#0B1F3A]">
            <SlidersHorizontal className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
            <span>Counselling Parameters</span>
          </div>
          <span className="text-xs text-slate-500">
            Active Rank Guard:{' '}
            <strong className="font-mono text-[#0B1F3A]">{expectedRankType}</strong> for{' '}
            <strong className="text-[#0B1F3A]">{effectiveCategory}</strong>
          </span>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label htmlFor="pred-system" className="block text-[11px] font-medium text-slate-600 mb-1">
              Counselling System
            </label>
            <select
              id="pred-system"
              value={systemCode}
              onChange={(e) => {
                const nextCode = e.target.value;
                setSystemCode(nextCode);
                const nextSys = getSystemConfig(nextCode);
                if (nextSys) {
                  setAcademicYear(nextSys.availableYears[0] ?? 2025);
                  setRoundNumber(nextSys.rounds[nextSys.rounds.length - 1]?.number ?? 1);
                  setTypeFilter('all');
                  setStateFilter('all');
                  setBranchFilter('all');
                  setQuotaFilter('all');
                  setBandFilter('all');
                }
              }}
              className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm"
            >
              {COUNSELLING_SYSTEMS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.shortName} — {s.examName}
                </option>
              ))}
            </select>
            {fieldError('systemCode') && (
              <p className="text-xs text-red-700 mt-1">{fieldError('systemCode')}</p>
            )}
          </div>

          <div>
            <label htmlFor="pred-year" className="block text-[11px] font-medium text-slate-600 mb-1">
              Reference Academic Year
            </label>
            <select
              id="pred-year"
              value={academicYear}
              onChange={(e) => setAcademicYear(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm font-mono tabular-nums"
            >
              {selectedSystem.availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {fieldError('academicYear') && (
              <p className="text-xs text-red-700 mt-1">{fieldError('academicYear')}</p>
            )}
          </div>

          <div>
            <label htmlFor="pred-round" className="block text-[11px] font-medium text-slate-600 mb-1">
              Counselling Round
            </label>
            <select
              id="pred-round"
              value={roundNumber}
              onChange={(e) => setRoundNumber(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm"
            >
              {selectedSystem.rounds.map((r) => (
                <option key={r.number} value={r.number}>
                  {r.label}
                </option>
              ))}
            </select>
            {fieldError('roundNumber') && (
              <p className="text-xs text-red-700 mt-1">{fieldError('roundNumber')}</p>
            )}
          </div>

          <div>
            <label htmlFor="pred-state" className="block text-[11px] font-medium text-slate-600 mb-1">
              {selectedSystem.requiresHomeState ? 'Home State (Class 12 Eligibility)' : 'Quota Scope'}
            </label>
            {selectedSystem.requiresHomeState ? (
              <select
                id="pred-state"
                value={homeState}
                onChange={(e) => setHomeState(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm"
              >
                <option value="">Select state...</option>
                {INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            ) : (
              <div
                id="pred-state"
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 flex items-center text-xs font-medium text-slate-600"
              >
                All India (AI) — No State Quota
              </div>
            )}
            {fieldError('homeState') && (
              <p className="text-xs text-red-700 mt-1">{fieldError('homeState')}</p>
            )}
          </div>

          <div>
            <label htmlFor="pred-category" className="block text-[11px] font-medium text-slate-600 mb-1">
              Seat Category
            </label>
            <select
              id="pred-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm"
            >
              {selectedSystem.allowedCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {fieldError('category') && (
              <p className="text-xs text-red-700 mt-1">{fieldError('category')}</p>
            )}
          </div>

          <div>
            <label htmlFor="pred-gender" className="block text-[11px] font-medium text-slate-600 mb-1">
              Gender / Seat Pool
            </label>
            <select
              id="pred-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as SeatPool)}
              className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm"
            >
              {selectedSystem.allowedSeatPools.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Rank Field with Rank-Type Guard */}
          {expectedRankType === 'CRL' ? (
            <div>
              <label htmlFor="pred-crl" className="block text-[11px] font-medium text-slate-600 mb-1">
                All-India CRL Rank (Required)
              </label>
              <input
                id="pred-crl"
                type="number"
                min={1}
                max={5000000}
                value={crlInput}
                onChange={(e) => setCrlInput(e.target.value)}
                placeholder="Enter CRL rank"
                className="w-full h-9 rounded-lg border border-slate-300/90 px-2.5 text-xs sm:text-sm font-mono font-medium tabular-nums text-[#0B1F3A]"
              />
              {fieldError('crlRank') && (
                <p className="text-xs text-red-700 mt-1">{fieldError('crlRank')}</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="pred-catrank" className="block text-[11px] font-medium text-slate-600 mb-1">
                {effectiveCategory} Category Rank (Required)
              </label>
              <input
                id="pred-catrank"
                type="number"
                min={1}
                max={5000000}
                value={catRankInput}
                onChange={(e) => setCatRankInput(e.target.value)}
                placeholder={`Enter ${effectiveCategory} rank (not CRL)`}
                className="w-full h-9 rounded-lg border border-slate-300/90 px-2.5 text-xs sm:text-sm font-mono font-medium tabular-nums text-[#0B1F3A]"
              />
              {fieldError('categoryRank') && (
                <p className="text-xs text-red-700 mt-1">{fieldError('categoryRank')}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="pred-margin" className="block text-[11px] font-medium text-slate-600 mb-1">
              Near-Closing Margin:{' '}
              <span className="font-mono font-semibold text-[#0B1F3A]">{nearMarginPercent}%</span>
            </label>
            <input
              id="pred-margin"
              type="range"
              min={0}
              max={selectedSystem.maxNearMarginPercent}
              step={1}
              value={nearMarginPercent}
              onChange={(e) => setNearMarginPercent(Number(e.target.value))}
              className="w-full accent-[#1D4ED8] mt-1.5"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span>Default 10%</span>
              <span>{selectedSystem.maxNearMarginPercent}%</span>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-slate-200/80 bg-slate-50/45 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPwd}
              onChange={(e) => setIsPwd(e.target.checked)}
              className="rounded border-slate-300 text-[#1D4ED8]"
            />
            <span>Person with Disability (PwD) — switches seat category to {category} (PwD)</span>
          </label>

          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 shadow-2xs"
          >
            Update &amp; Sync URL
          </button>
        </div>
      </form>

      {/* Validation Errors Summary */}
      {result && !result.valid && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/80 p-4 space-y-1.5 text-sm text-red-900"
        >
          <h2 className="font-display font-semibold text-xs">Please fix the following input issues:</h2>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            {result.errors.map((err) => (
              <li key={`${err.field}-${err.message}`}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Results Dashboard */}
      {result && result.valid && (
        <div className="space-y-5">
          {result.includesDemoData && <DemoDataNotice compact showHistoricalNote />}

          {/* Unified Summary + Single-Elevation Interactive Band Strip */}
          <div className="app-panel rounded-xl overflow-hidden">
            <div className="px-4 sm:px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-display font-bold text-[#0B1F3A]">
                  Historical Comparison — {selectedSystem.shortName} {result.academicYear} (Round {result.roundNumber})
                </h2>
                <p className="text-xs text-slate-600">
                  Evaluated Rank:{' '}
                  <strong className="font-mono text-[#0B1F3A] tabular-nums">
                    {result.evaluatedRank?.toLocaleString('en-IN')} ({result.evaluatedRankType})
                  </strong>{' '}
                  · {result.effectiveCategory} · {gender} · {homeState} · Near margin:{' '}
                  <strong className="font-mono">+{result.marginPercentUsed}%</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 no-print">
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white divide-x divide-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      void savePredictionRun({
                        systemCode: selectedSystem.code,
                        academicYear: result.academicYear,
                        roundNumber: result.roundNumber,
                        rank: result.evaluatedRank ?? 1,
                        rankType: result.evaluatedRankType ?? 'CRL',
                        category: result.effectiveCategory,
                        gender,
                        homeState: selectedSystem.requiresHomeState ? (homeState || 'All India') : 'All India',
                        isPwd,
                        withinCount: result.counts.within,
                        nearCount: result.counts.near,
                        beyondCount: result.counts.beyond,
                        isDemo: result.includesDemoData,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopyShareLink()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportPredictionMatchesCsv(filteredMatches, {
                        systemCode: selectedSystem.code,
                        academicYear: result.academicYear,
                        roundNumber: result.roundNumber,
                        category: result.effectiveCategory,
                        evaluatedRank: result.evaluatedRank ?? 0,
                        rankType: result.evaluatedRankType ?? 'CRL',
                        includesDemoData: result.includesDemoData,
                      })
                    }
                    disabled={filteredMatches.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B1F3A] hover:bg-slate-50 disabled:opacity-45 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    CSV
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B162C] rounded-lg hover:bg-[#132C50] transition-colors whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t('printView')}
                </button>
              </div>
            </div>

            {/* Flat hairline-divided classification filter strip (no nested cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-slate-200/80 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
              <button
                type="button"
                onClick={() => setBandFilter(bandFilter === 'within' ? 'all' : 'within')}
                className={`text-left px-4 sm:px-5 py-3.5 transition-colors ${
                  bandFilter === 'within' ? 'bg-teal-50/75' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-teal-800">{t('withinLabel')}</p>
                  <span className="font-mono text-[11px] text-teal-700">
                    {bandFilter === 'within' ? 'Active filter' : `${Math.round((result.counts.within / totalCount) * 100)}%`}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-[#0B1F3A] tabular-nums mt-0.5">
                  {result.counts.within}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Rank ≤ historical closing rank</p>
              </button>

              <button
                type="button"
                onClick={() => setBandFilter(bandFilter === 'near' ? 'all' : 'near')}
                className={`text-left px-4 sm:px-5 py-3.5 transition-colors ${
                  bandFilter === 'near' ? 'bg-blue-50/75' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#1D4ED8]">{t('nearLabel')}</p>
                  <span className="font-mono text-[11px] text-[#1D4ED8]">
                    {bandFilter === 'near' ? 'Active filter' : `${Math.round((result.counts.near / totalCount) * 100)}%`}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-[#0B1F3A] tabular-nums mt-0.5">
                  {result.counts.near}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Within +{result.marginPercentUsed}% above closing rank
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBandFilter(bandFilter === 'beyond' ? 'all' : 'beyond')}
                className={`text-left px-4 sm:px-5 py-3.5 transition-colors ${
                  bandFilter === 'beyond' ? 'bg-slate-100/90' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">{t('beyondLabel')}</p>
                  <span className="font-mono text-[11px] text-slate-500">
                    {bandFilter === 'beyond' ? 'Active filter' : `${Math.round((result.counts.beyond / totalCount) * 100)}%`}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-[#0B1F3A] tabular-nums mt-0.5">
                  {result.counts.beyond}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Above near-margin threshold</p>
              </button>
            </div>

            {result.counts.total > 0 && (
              <div className="h-1.5 w-full flex bg-slate-200/80" aria-hidden="true">
                {result.counts.within > 0 && (
                  <div
                    className="h-full bg-[#0D9488]"
                    style={{ width: `${(result.counts.within / totalCount) * 100}%` }}
                  />
                )}
                {result.counts.near > 0 && (
                  <div
                    className="h-full bg-[#1D4ED8]"
                    style={{ width: `${(result.counts.near / totalCount) * 100}%` }}
                  />
                )}
                {result.counts.beyond > 0 && (
                  <div
                    className="h-full bg-slate-300"
                    style={{ width: `${(result.counts.beyond / totalCount) * 100}%` }}
                  />
                )}
              </div>
            )}
          </div>

          {/* What-If Explorer (Flattened hairline-divided strip, no nested boxes) */}
          {whatIfRows.length > 0 && (
            <div className="app-panel rounded-xl overflow-hidden no-print">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-display font-semibold text-[#0B1F3A]">
                    What-If Rank Explorer (Preview Only)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspect how counts shift at ±5% and ±15% rank deltas under {result.academicYear} Round {result.roundNumber} data. Does not edit your profile.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <label htmlFor="whatif-cat" className="text-slate-600 whitespace-nowrap">
                    Preview category:
                  </label>
                  <select
                    id="whatif-cat"
                    value={whatIfCategory}
                    onChange={(e) => setWhatIfCategory(e.target.value)}
                    className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
                  >
                    {selectedSystem.allowedCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
                {whatIfRows.map((row) => (
                  <div
                    key={row.label}
                    className={`px-4 py-3 text-xs ${
                      row.label === 'Current rank' ? 'bg-blue-50/45' : 'bg-white'
                    }`}
                  >
                    <p
                      className={`text-[11px] font-medium ${
                        row.label === 'Current rank' ? 'text-[#1D4ED8] font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {row.label}
                    </p>
                    <p className="font-mono font-bold text-[#0B1F3A] tabular-nums text-sm mt-0.5">
                      {row.adjustedRank.toLocaleString('en-IN')}
                    </p>
                    <div className="mt-2 flex items-center gap-2.5 text-[11px] font-mono tabular-nums text-slate-600">
                      <span title="Within">
                        W:<strong className="text-teal-700 ml-0.5">{row.within}</strong>
                      </span>
                      <span title="Near">
                        N:<strong className="text-[#1D4ED8] ml-0.5">{row.near}</strong>
                      </span>
                      <span title="Beyond">
                        B:<strong className="ml-0.5">{row.beyond}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State or Results Table */}
          {result.emptyReason ? (
            <div className="app-panel rounded-xl p-10 text-center space-y-2">
              <h3 className="text-base font-display font-semibold text-[#0B1F3A]">
                No Matching Cutoffs Found
              </h3>
              <p className="text-xs text-slate-600 max-w-xl mx-auto">{result.emptyReason}</p>
            </div>
          ) : (
            <div className="app-panel rounded-xl overflow-hidden">
              {/* Filter Bar */}
              <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 flex flex-wrap items-center gap-2.5 bg-slate-50/60 no-print">
                <select
                  aria-label="Filter by institute type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
                >
                  <option value="all">All Institute Types</option>
                  {selectedSystem.instituteTypes.map((it) => (
                    <option key={it} value={it}>{it}</option>
                  ))}
                </select>

                <select
                  aria-label="Filter by state"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
                >
                  <option value="all">All States</option>
                  {distinctStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  aria-label="Filter by branch group"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
                >
                  <option value="all">All Branches</option>
                  {distinctBranches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <select
                  aria-label="Filter by quota"
                  value={quotaFilter}
                  onChange={(e) => setQuotaFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
                >
                  <option value="all">All Matched Quotas</option>
                  {distinctQuotas.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>

                {hasActiveResultFilters && (
                  <button
                    type="button"
                    onClick={resetResultFilters}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-[#1D4ED8] hover:bg-blue-50 transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}

                <select
                  aria-label="Sort results"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:ml-auto"
                >
                  <option value="closing_asc">Sort: Closing Rank (Lowest first)</option>
                  <option value="closing_desc">Sort: Closing Rank (Highest first)</option>
                  <option value="name_asc">Sort: Institute Name (A–Z)</option>
                </select>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-4 sm:px-5">Institute &amp; Programme</th>
                      <th className="py-2.5 px-3">Quota / Pool / Rank</th>
                      <th className="py-2.5 px-3 text-right">Opening</th>
                      <th className="py-2.5 px-3 text-right">Closing</th>
                      <th className="py-2.5 px-3">Historical Status &amp; Delta</th>
                      <th className="py-2.5 px-4 sm:px-5 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMatches.map((m) => {
                      const inst = instMap.get(m.cutoff.institutionId);
                      const isSaved = savedColleges.some(
                        (s) => s.institutionId === m.cutoff.institutionId && !s.programmeId
                      );
                      const delta = m.rankDeltaFromClosing;
                      return (
                        <tr key={m.cutoff.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-3 px-4 sm:px-5">
                            <Link
                              to={`/colleges/${m.cutoff.institutionSlug}`}
                              className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] block"
                            >
                              {m.cutoff.institutionName}
                            </Link>
                            <p className="text-slate-700 mt-0.5">{m.cutoff.programmeName}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {m.cutoff.institutionType} · {m.cutoff.state} · {m.cutoff.academicYear}{' '}
                              {m.cutoff.roundLabel}
                              {m.cutoff.isDemo ? ' · Demo data — not an official cutoff' : ''}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            <div className="font-medium text-slate-900">
                              {m.cutoff.quota} · {m.cutoff.seatCategory}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.cutoff.seatPool} · {m.cutoff.rankType}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                            {m.cutoff.openingRank.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#0B1F3A] whitespace-nowrap">
                            {m.cutoff.closingRank.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-semibold ${
                                  m.classification === 'within'
                                    ? 'text-teal-700'
                                    : m.classification === 'near'
                                      ? 'text-[#1D4ED8]'
                                      : 'text-slate-600'
                                }`}
                              >
                                {m.classificationLabel}
                              </span>
                              <span className="font-mono text-[11px] tabular-nums text-slate-400">
                                ({delta >= 0 ? `+${delta.toLocaleString('en-IN')}` : delta.toLocaleString('en-IN')})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{m.matchedQuotaReason}</div>
                          </td>
                          <td className="py-3 px-4 sm:px-5 text-right whitespace-nowrap no-print">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => void handleAddToChoice(m)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B1F3A] hover:border-[#1D4ED8] hover:text-[#1D4ED8] hover:bg-blue-50/40 transition-colors"
                                title={t('addToChoiceList')}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Choice</span>
                              </button>
                              {inst && (
                                <button
                                  type="button"
                                  onClick={() => void toggleSaveCollege({ institution: inst })}
                                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-[#1D4ED8] hover:bg-slate-50 transition-colors"
                                  title={isSaved ? t('saved') : t('saveCollege')}
                                  aria-label={isSaved ? t('saved') : t('saveCollege')}
                                >
                                  {isSaved ? (
                                    <Check className="w-3.5 h-3.5 text-teal-700" />
                                  ) : (
                                    <Bookmark className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  openReportModal({
                                    entityType: 'cutoff',
                                    entityId: m.cutoff.id,
                                    entityLabel: `${m.cutoff.institutionName} — ${m.cutoff.programmeName} (${m.cutoff.academicYear} ${m.cutoff.roundLabel})`,
                                  })
                                }
                                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-amber-700 hover:bg-slate-50 transition-colors"
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

              <div className="px-4 sm:px-5 py-3 border-t border-slate-200/80 bg-slate-50/60 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Sources: {result.sourcesSummary.join(' | ')} · Verified date shown per record.
                </span>
                <span className="font-mono tabular-nums">
                  Showing {filteredMatches.length} of {result.counts.total} matched records
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
