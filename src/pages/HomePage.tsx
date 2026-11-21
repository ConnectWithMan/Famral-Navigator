import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  GitBranch,
  LineChart,
  Plus,
  Scale,
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
import { exportSchedulesIcs } from '../lib/exporters.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { usePageSeo } from '../lib/seo.ts';
import { buildHomeJsonLd } from '../lib/seoSchema.ts';
import { InstitutionType, PredictionMatch, SeatPool } from '../types/domain.ts';

export const HomePage: React.FC = () => {
  const {
    user,
    profile,
    institutions,
    programmes,
    schedules,
    cutoffs,
    savedColleges,
    choiceLists,
    savedPredictions,
    comparisons,
    addItemToChoiceList,
    t,
  } = useApp();
  const navigate = useNavigate();

  const homeJsonLd = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://navigator.famral.com';
    return buildHomeJsonLd(origin);
  }, []);

  usePageSeo({
    title: 'Famral Navigator – College Predictor & Cutoff Explorer',
    description:
      'Compare historical JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET opening and closing ranks, explore colleges, and build your preference list.',
    canonicalPath: '/',
    jsonLd: homeJsonLd,
  });

  const activeSystems = useMemo(
    () => COUNSELLING_SYSTEMS.filter((s) => s.status === 'active'),
    []
  );
  const templateSystems = useMemo(
    () => COUNSELLING_SYSTEMS.filter((s) => s.status !== 'active'),
    []
  );

  const [systemCode, setSystemCode] = useState<string>(profile?.systemCode || 'josaa');
  const selectedSystem = getSystemConfig(systemCode) ?? COUNSELLING_SYSTEMS[0];

  const [academicYear, setAcademicYear] = useState<number>(
    selectedSystem.availableYears[0] ?? 2025
  );
  const [rankValue, setRankValue] = useState<string>(
    profile?.crlRank ? String(profile.crlRank) : '12500'
  );
  const [category, setCategory] = useState<string>(profile?.category || 'OPEN');
  const [isPwd, setIsPwd] = useState<boolean>(Boolean(profile?.isPwd));
  const [gender, setGender] = useState<SeatPool>(profile?.gender || 'Gender-Neutral');
  const [homeState, setHomeState] = useState<string>(profile?.homeState || 'Uttar Pradesh');
  const [instFilter, setInstFilter] = useState<'ALL' | InstitutionType>('ALL');

  const handleSystemSwitch = (nextCode: string) => {
    setSystemCode(nextCode);
    const nextSys = getSystemConfig(nextCode);
    if (nextSys) {
      if (!nextSys.availableYears.includes(academicYear)) {
        setAcademicYear(nextSys.availableYears[0] ?? 2025);
      }
      if (!nextSys.allowedCategories.includes(category)) {
        setCategory(nextSys.allowedCategories[0] ?? 'OPEN');
      }
    }
  };

  const latestRound = selectedSystem.rounds[selectedSystem.rounds.length - 1];
  const effectiveCat = getEffectiveCategory(selectedSystem, category, isPwd);
  const expectedRankType = getExpectedRankType(selectedSystem, effectiveCat);
  const hasDemoCutoffs = cutoffs.some((c) => c.isDemo);

  // Live historical evaluation directly on the workspace canvas
  const livePrediction = useMemo(() => {
    const parsed = Number.parseInt(rankValue.trim(), 10);
    const validNum = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    return runPrediction(
      {
        examCode: selectedSystem.examCode,
        systemCode: selectedSystem.code,
        academicYear,
        roundNumber: latestRound?.number ?? 6,
        crlRank: expectedRankType === 'CRL' ? validNum : null,
        categoryRank: expectedRankType === 'CATEGORY_RANK' ? validNum : null,
        category,
        isPwd,
        gender,
        homeState,
        nearMarginPercent: selectedSystem.defaultNearMarginPercent,
      },
      cutoffs,
      selectedSystem
    );
  }, [
    rankValue,
    selectedSystem,
    academicYear,
    latestRound,
    expectedRankType,
    category,
    isPwd,
    gender,
    homeState,
    cutoffs,
  ]);

  const previewMatches = useMemo(() => livePrediction.matches.slice(0, 6), [livePrediction.matches]);

  const totalMatches = Math.max(1, livePrediction.counts.total);
  const withinPct = Math.round((livePrediction.counts.within / totalMatches) * 100);
  const nearPct = Math.round((livePrediction.counts.near / totalMatches) * 100);
  const beyondPct = Math.max(0, 100 - withinPct - nearPct);

  const buildPredictorUrl = () => {
    const params = new URLSearchParams({
      system: selectedSystem.code,
      year: String(academicYear),
      round: String(latestRound?.number ?? 6),
      category,
      pwd: isPwd ? '1' : '0',
      gender,
      state: homeState,
    });
    if (expectedRankType === 'CRL') {
      params.set('crl', rankValue.trim());
    } else {
      params.set('catRank', rankValue.trim());
    }
    return `/predictor?${params.toString()}`;
  };

  const handleOpenFullPredictor = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(buildPredictorUrl());
  };

  const handleQuickAddChoice = async (match: PredictionMatch) => {
    const c = match.cutoff;
    await addItemToChoiceList(
      {
        id: `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
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
        tag: match.classification === 'within' ? 'Safer' : match.classification === 'near' ? 'Target' : 'Dream',
        notes: '',
      },
      undefined,
      c.systemCode
    );
  };

  const programmeCountByInst = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of programmes) {
      counts.set(p.institutionId, (counts.get(p.institutionId) ?? 0) + 1);
    }
    return counts;
  }, [programmes]);

  const publishedInstitutions = useMemo(
    () => institutions.filter((i) => i.status === 'published'),
    [institutions]
  );

  const filteredInstitutions = useMemo(() => {
    const base =
      instFilter === 'ALL'
        ? publishedInstitutions
        : publishedInstitutions.filter((i) => i.type === instFilter);
    return base.slice(0, 8);
  }, [publishedInstitutions, instFilter]);

  const filteredSchedules = useMemo(() => {
    const matching = schedules.filter(
      (s) => s.systemCode.toLowerCase() === selectedSystem.code.toLowerCase()
    );
    return (matching.length > 0 ? matching : schedules).slice(0, 5);
  }, [schedules, selectedSystem.code]);

  const displayName = profile?.displayName || user?.displayName || '';
  const firstName = displayName ? displayName.split(/\s+/)[0] : '';

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
      {/* Compact Workspace Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] tracking-tight truncate">
            {firstName ? `Welcome back, ${firstName}` : 'Admission Workspace'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {selectedSystem.examName} · {selectedSystem.shortName} historical cutoff evaluation and choice-list planning
          </p>
        </div>

        {/* Interactive System Switcher & Quick Action */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Active counselling system"
            className="inline-flex flex-wrap items-center rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs"
          >
            {activeSystems.map((sys) => {
              const active = sys.code === selectedSystem.code;
              return (
                <button
                  key={sys.code}
                  type="button"
                  onClick={() => handleSystemSwitch(sys.code)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0B162C] text-white'
                      : 'text-slate-600 hover:text-[#0B1F3A]'
                  }`}
                >
                  {sys.shortName}
                </button>
              );
            })}
          </div>

          <Link
            to="/cutoffs"
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            <LineChart className="w-3.5 h-3.5 text-[#1D4ED8]" aria-hidden="true" />
            <span>{t('navCutoffs')}</span>
          </Link>
        </div>
      </div>

      {/* Mandatory Demo Data Notice */}
      {hasDemoCutoffs && <DemoDataNotice compact showHistoricalNote />}

      {/* Primary 12-Column App Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 Cols: Live Interactive Rank Evaluator */}
        <section className="lg:col-span-8 app-panel rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
              <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">
                {t('quickPredictorTitle')}
              </h2>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>
                Rank type: <strong className="font-mono text-[#0B1F3A]">{expectedRankType}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {academicYear} {latestRound?.label ?? 'Final Round'}
              </span>
            </div>
          </div>

          {/* Interactive Evaluator Controls */}
          <form onSubmit={handleOpenFullPredictor}>
            <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="ws-category" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Category
                </label>
                <select
                  id="ws-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm text-slate-900"
                >
                  {selectedSystem.allowedCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ws-rank" className="block text-[11px] font-medium text-slate-600 mb-1">
                  {expectedRankType === 'CRL' ? 'All-India CRL Rank' : `${effectiveCat} Category Rank`}
                </label>
                <input
                  id="ws-rank"
                  type="number"
                  min={1}
                  max={5000000}
                  required
                  value={rankValue}
                  onChange={(e) => setRankValue(e.target.value)}
                  placeholder="e.g. 12500"
                  className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm font-mono tabular-nums font-medium text-[#0B1F3A]"
                />
              </div>

              <div>
                <label htmlFor="ws-state" className="block text-[11px] font-medium text-slate-600 mb-1">
                  {selectedSystem.requiresHomeState ? 'Home State (Class 12)' : 'Quota Scope'}
                </label>
                {selectedSystem.requiresHomeState ? (
                  <select
                    id="ws-state"
                    value={homeState}
                    onChange={(e) => setHomeState(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm text-slate-900"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    id="ws-state"
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 flex items-center text-xs font-medium text-slate-600 truncate"
                    title="IITs allocate 100% of seats under All India (AI) quota with no Home State split."
                  >
                    All India (AI only)
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="ws-gender" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Seat Pool
                </label>
                <select
                  id="ws-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as SeatPool)}
                  className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm text-slate-900"
                >
                  {selectedSystem.allowedSeatPools.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ws-year" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Reference Year
                </label>
                <select
                  id="ws-year"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs sm:text-sm font-mono tabular-nums text-slate-900"
                >
                  {selectedSystem.availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 h-9 px-3 rounded-lg border border-slate-300/90 bg-slate-50/60 hover:bg-slate-100/70 transition-colors w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPwd}
                    onChange={(e) => setIsPwd(e.target.checked)}
                    className="rounded border-slate-300 text-[#1D4ED8]"
                  />
                  <span className="truncate">PwD Candidate</span>
                </label>
              </div>
            </div>

            {/* Live KPI Comparison Strip + Proportional Distribution Bar (flat, single-elevation) */}
            <div className="border-y border-slate-200/80 bg-slate-50/55">
              <div className="grid grid-cols-3 divide-x divide-slate-200/80">
                <div className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Within Closing</span>
                    <span className="font-mono tabular-nums text-[#0F766E]">
                      {livePrediction.counts.total > 0 ? `${withinPct}%` : '—'}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-bold tabular-nums text-[#0F766E] mt-0.5">
                    {livePrediction.counts.within}
                  </p>
                </div>
                <div className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Near (+{livePrediction.marginPercentUsed}%)</span>
                    <span className="font-mono tabular-nums text-[#1D4ED8]">
                      {livePrediction.counts.total > 0 ? `${nearPct}%` : '—'}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-bold tabular-nums text-[#1D4ED8] mt-0.5">
                    {livePrediction.counts.near}
                  </p>
                </div>
                <div className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Beyond Closing</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {livePrediction.counts.total > 0 ? `${beyondPct}%` : '—'}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-bold tabular-nums text-slate-700 mt-0.5">
                    {livePrediction.counts.beyond}
                  </p>
                </div>
              </div>

              {/* Clean proportional ratio bar */}
              {livePrediction.counts.total > 0 && (
                <div
                  className="h-1.5 w-full flex overflow-hidden bg-slate-200/80"
                  aria-hidden="true"
                >
                  {livePrediction.counts.within > 0 && (
                    <div
                      className="h-full bg-[#0D9488] transition-all duration-200"
                      style={{ width: `${(livePrediction.counts.within / totalMatches) * 100}%` }}
                    />
                  )}
                  {livePrediction.counts.near > 0 && (
                    <div
                      className="h-full bg-[#1D4ED8] transition-all duration-200"
                      style={{ width: `${(livePrediction.counts.near / totalMatches) * 100}%` }}
                    />
                  )}
                  {livePrediction.counts.beyond > 0 && (
                    <div
                      className="h-full bg-slate-300 transition-all duration-200"
                      style={{ width: `${(livePrediction.counts.beyond / totalMatches) * 100}%` }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Instant Preview Table (flat inside panel — no nested bordered cards) */}
            {!livePrediction.valid ? (
              <div className="px-5 py-4 bg-amber-50/60 text-xs text-amber-900">
                {livePrediction.errors[0]?.message || 'Enter a valid rank to evaluate historical cutoffs.'}
              </div>
            ) : previewMatches.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-slate-600">
                {livePrediction.emptyReason || 'No matching historical cutoff rows for this selection.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-4 sm:px-5">Institute &amp; Programme</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Quota</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Closing</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Historical Margin</th>
                      <th className="py-2.5 px-4 sm:px-5 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {previewMatches.map((m) => {
                      const delta = m.rankDeltaFromClosing;
                      return (
                        <tr key={m.cutoff.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-2.5 px-4 sm:px-5 max-w-[270px]">
                            <Link
                              to={`/colleges/${m.cutoff.institutionSlug}`}
                              className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] block truncate"
                            >
                              {m.cutoff.institutionName}
                            </Link>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {m.cutoff.programmeName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {m.cutoff.quota} · {m.cutoff.seatCategory}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[#0B1F3A] whitespace-nowrap">
                            {m.cutoff.closingRank.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-semibold ${
                                m.classification === 'within'
                                  ? 'text-[#0F766E]'
                                  : m.classification === 'near'
                                  ? 'text-[#1D4ED8]'
                                  : 'text-slate-500'
                              }`}
                            >
                              {m.classification === 'within'
                                ? 'Within'
                                : m.classification === 'near'
                                ? 'Near'
                                : 'Beyond'}
                            </span>
                            <span className="font-mono tabular-nums text-[11px] text-slate-400 ml-1.5">
                              ({delta >= 0 ? `+${delta.toLocaleString('en-IN')}` : delta.toLocaleString('en-IN')})
                            </span>
                          </td>
                          <td className="py-2.5 px-4 sm:px-5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => void handleQuickAddChoice(m)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:border-[#1D4ED8] hover:text-[#1D4ED8] hover:bg-blue-50/40 text-[11px] font-medium text-slate-700 bg-white transition-colors whitespace-nowrap shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Choice</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Footer */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Historical comparison only (strictly matching {expectedRankType} &amp; HS/OS/AI rules). Never implies guaranteed admission.
              </p>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] px-4 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 shadow-2xs"
              >
                <span>
                  {livePrediction.counts.total > 0
                    ? `Inspect All ${livePrediction.counts.total} Matches`
                    : t('runPredictor')}
                </span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>

        {/* Right 4 Cols: Student Workspace Readiness & Quick Tools */}
        <aside className="lg:col-span-4 space-y-5">
          {/* My Workspace Summary */}
          <div className="app-panel rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">My Workspace</h2>
              <Link
                to="/dashboard"
                className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap"
              >
                Dashboard →
              </Link>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-200/80">
              <Link
                to="/saved-colleges"
                className="p-3.5 hover:bg-slate-50/90 transition-colors block"
              >
                <p className="text-[11px] text-slate-500">Saved Colleges</p>
                <p className="text-xl font-display font-bold tabular-nums text-[#0B1F3A] mt-0.5">
                  {savedColleges.length}
                </p>
              </Link>
              <Link
                to="/choice-builder"
                className="p-3.5 hover:bg-slate-50/90 transition-colors block"
              >
                <p className="text-[11px] text-slate-500">Choice Lists</p>
                <p className="text-xl font-display font-bold tabular-nums text-[#0B1F3A] mt-0.5">
                  {choiceLists.length}
                </p>
              </Link>
              <Link
                to="/dashboard"
                className="p-3.5 hover:bg-slate-50/90 transition-colors block"
              >
                <p className="text-[11px] text-slate-500">Saved Runs</p>
                <p className="text-xl font-display font-bold tabular-nums text-[#0B1F3A] mt-0.5">
                  {savedPredictions.length}
                </p>
              </Link>
              <Link
                to="/compare"
                className="p-3.5 hover:bg-slate-50/90 transition-colors block"
              >
                <p className="text-[11px] text-slate-500">Comparisons</p>
                <p className="text-xl font-display font-bold tabular-nums text-[#0B1F3A] mt-0.5">
                  {comparisons.length}
                </p>
              </Link>
            </div>

            {!user && (
              <div className="px-4 py-2.5 bg-slate-50/75 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600">Sync lists &amp; checklists</span>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap"
                >
                  Sign in →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Tools Launcher */}
          <div className="app-panel rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200/80">
              <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">Planning Tools</h2>
            </div>
            <div className="divide-y divide-slate-100">
              <Link
                to="/branches"
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/90 transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <GitBranch className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#0B1F3A] truncate">
                      Branch-First Discovery
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      Compare CSE, ECE, EE across institutes
                    </span>
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>

              <Link
                to="/compare"
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/90 transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Scale className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#0B1F3A] truncate">
                      Compare Institutes
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      Weighted side-by-side matrix
                    </span>
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>

              <Link
                to="/guides"
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/90 transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#0B1F3A] truncate">
                      Counselling Guides &amp; Glossary
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      Float/Freeze/Slide, quotas, checklists
                    </span>
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            </div>
          </div>

          {/* Counselling Systems Coverage */}
          <div className="app-panel rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">
                Counselling Systems
              </h2>
              <Link to="/counselling" className="text-xs font-semibold text-[#1D4ED8] hover:underline">
                All ({COUNSELLING_SYSTEMS.length}) →
              </Link>
            </div>
            <div className="space-y-1.5 text-xs">
              {activeSystems.map((sys) => (
                <Link
                  key={sys.code}
                  to={`/counselling/${sys.code}`}
                  className="flex items-center justify-between py-1 text-slate-700 hover:text-[#1D4ED8] transition-colors"
                >
                  <span className="font-medium text-[#0B1F3A]">{sys.shortName}</span>
                  <span className="text-[11px] text-[#0F766E] font-medium">
                    Active · Demo Seed
                  </span>
                </Link>
              ))}
              {templateSystems.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Templates ready: {templateSystems.map((s) => s.shortName).join(' · ')}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom 12-Column Data Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Cols: Institutes Directory Snapshot */}
        <section className="lg:col-span-7 app-panel rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">
                Participating Institutes
              </h2>
              <p className="text-[11px] text-slate-500">
                {publishedInstitutions.length} institutes ·{' '}
                {cutoffs.filter((c) => c.status === 'published').length.toLocaleString('en-IN')} historical cutoff rows (Demo catalog)
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                role="group"
                aria-label="Filter institutes by type"
                className="inline-flex items-center rounded-lg border border-slate-200/90 bg-slate-100/80 p-0.5"
              >
                {(['ALL', 'IIT', 'NIT', 'IIIT', 'GFTI', 'State University'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInstFilter(type)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      instFilter === type
                        ? 'bg-white text-[#0B1F3A] shadow-2xs'
                        : 'text-slate-500 hover:text-[#0B1F3A]'
                    }`}
                  >
                    {type === 'ALL' ? 'All' : type === 'State University' ? 'State' : type}
                  </button>
                ))}
              </div>

              <Link
                to="/colleges"
                className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0"
              >
                All →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-4 sm:px-5">Institute</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Type · State</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Branches</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right whitespace-nowrap">Explore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-2.5 px-4 sm:px-5">
                      <Link
                        to={`/colleges/${inst.slug}`}
                        className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] block"
                      >
                        {inst.name}
                      </Link>
                      <span className="text-[11px] text-slate-500">
                        {inst.city}
                        {inst.establishedYear ? ` · Est. ${inst.establishedYear}` : ''}
                        {inst.isDemo ? ' · Demo data' : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {inst.type} · {inst.state}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {programmeCountByInst.get(inst.id) ?? 0}
                    </td>
                    <td className="py-2.5 px-4 sm:px-5 text-right whitespace-nowrap">
                      <Link
                        to={`/colleges/${inst.slug}`}
                        className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                      >
                        Cutoffs →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right 5 Cols: Counselling Timeline */}
        <section className="lg:col-span-5 app-panel rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">
                {selectedSystem.shortName} Timeline
              </h2>
              <p className="text-[11px] text-slate-500">
                Key counselling rounds &amp; calendar export
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  exportSchedulesIcs(
                    filteredSchedules,
                    `famral-navigator-${selectedSystem.code}-timeline.ics`
                  )
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3 h-3 text-[#1D4ED8]" aria-hidden="true" />
                <span>.ics</span>
              </button>
              <Link
                to={`/counselling/${selectedSystem.code}`}
                className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0"
              >
                Full hub →
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSchedules.map((sched) => (
              <div key={sched.id} className="px-4 sm:px-5 py-3 space-y-1 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="truncate">
                    <strong className="text-[#0B1F3A]">{sched.systemCode.toUpperCase()}</strong> ·{' '}
                    {sched.academicYear} · {sched.phase}
                    {sched.isDemo ? ' · Demo data' : ''}
                  </span>
                  {sched.isOutdated && (
                    <span className="text-amber-700 font-medium shrink-0">Past cycle</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#0B1F3A]">{sched.title}</p>
                <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-slate-600">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    {sched.startDate} → {sched.endDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
