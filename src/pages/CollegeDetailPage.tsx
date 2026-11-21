import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  Bookmark,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  Flag,
  GraduationCap,
  Image as ImageIcon,
  ListPlus,
  Mail,
  MapPin,
  Phone,
  Plus,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { computeRoundWiseMovement, computeYoYChange } from '../engine/analytics.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { RoundMovementChart, YoYCutoffChart } from '../components/CutoffCharts.tsx';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { InstitutionLogo } from '../components/InstitutionLogo.tsx';
import { CampusLocationCard } from '../components/CampusLocationCard.tsx';
import {
  getExpectedRankType,
  getLatestRoundNumber,
  getSystemConfig,
} from '../config/systems/registry.ts';
import { isSafeHttpUrl } from '../lib/exporters.ts';
import { usePageSeo } from '../lib/seo.ts';
import { BreadcrumbItem, buildCollegeJsonLd } from '../lib/seoSchema.ts';
import { Programme, SeatPool } from '../types/domain.ts';

export const CollegeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    institutions,
    programmes,
    cutoffs,
    profile,
    savedColleges,
    toggleSaveCollege,
    addItemToChoiceList,
    openReportModal,
    trackMetric,
    t,
  } = useApp();

  const inst = institutions.find((i) => i.slug === slug);
  const primarySysCode = inst?.systems[0] ?? 'josaa';
  const primarySys = getSystemConfig(primarySysCode);
  const latestRound = getLatestRoundNumber(primarySys);

  const instProgs = useMemo(
    () => (inst ? programmes.filter((p) => p.institutionId === inst.id) : []),
    [inst, programmes]
  );

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () =>
      inst
        ? [
            { label: 'Home', to: '/' },
            { label: 'Colleges', to: '/colleges' },
            { label: inst.shortName },
          ]
        : [
            { label: 'Home', to: '/' },
            { label: 'Colleges', to: '/colleges' },
            { label: 'Not Found' },
          ],
    [inst]
  );

  const collegeJsonLd = useMemo(() => {
    if (!inst) return undefined;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://navigator.famral.com';
    return buildCollegeJsonLd(inst, instProgs, origin);
  }, [inst, instProgs]);

  usePageSeo({
    title: inst ? `${inst.name} — Cutoffs, Branches, Placements & Profile` : 'Institution Not Found',
    description: inst
      ? `Detailed profile for ${inst.name} (${inst.ownership ?? inst.type}, ${inst.city}, ${inst.state}): courses, branches, admission eligibility, historical ${inst.systems.map((s) => s.toUpperCase()).join('/')} cutoffs, placements, facilities, and location.`
      : 'Institution profile on Famral Navigator.',
    canonicalPath: inst ? `/colleges/${inst.slug}` : undefined,
    ogType: 'article',
    ogImage: inst?.imageUrl,
    ogImageAlt: inst ? `${inst.name} campus and admission cutoffs` : undefined,
    noIndex: !inst,
    breadcrumbs,
    jsonLd: collegeJsonLd,
  });

  useEffect(() => {
    if (inst) trackMetric('college_view', inst.systems[0] ?? 'josaa');
  }, [inst?.id]);

  const instCutoffs = useMemo(
    () =>
      inst
        ? cutoffs.filter((c) => c.status === 'published' && c.institutionId === inst.id)
        : [],
    [inst, cutoffs]
  );

  const [selectedProgId, setSelectedProgId] = useState<string>('');
  const [selectedQuota, setSelectedQuota] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('OPEN');
  const [selectedPool, setSelectedPool] = useState<SeatPool>('Gender-Neutral');
  const [myRankInput, setMyRankInput] = useState<string>(
    profile?.crlRank ? String(profile.crlRank) : ''
  );
  const [choicePickerOpen, setChoicePickerOpen] = useState(false);
  const [choiceBranchId, setChoiceBranchId] = useState<string>('');
  const [branchSearch, setBranchSearch] = useState('');
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);

  // Reset per-institution UI state when navigating between similar colleges
  useEffect(() => {
    setSelectedProgId('');
    setSelectedQuota('');
    setChoiceBranchId('');
    setBranchSearch('');
    setChoicePickerOpen(false);
    setActiveGalleryIdx(0);
  }, [inst?.id]);

  const activeProgId = selectedProgId || instProgs[0]?.id || '';
  const activeChoiceProgId = choiceBranchId || instProgs[0]?.id || '';

  const availableQuotas = useMemo(
    () => Array.from(new Set(instCutoffs.map((c) => c.quota))),
    [instCutoffs]
  );
  const activeQuota = selectedQuota || availableQuotas[0] || 'OS';

  const yoyPoints = useMemo(() => {
    if (!inst || !activeProgId) return [];
    return computeYoYChange(instCutoffs, {
      systemCode: primarySysCode,
      roundNumber: latestRound,
      institutionId: inst.id,
      programmeId: activeProgId,
      quota: activeQuota,
      seatCategory: selectedCategory,
      seatPool: selectedPool,
    });
  }, [
    inst,
    instCutoffs,
    primarySysCode,
    latestRound,
    activeProgId,
    activeQuota,
    selectedCategory,
    selectedPool,
  ]);

  const roundPoints = useMemo(() => {
    if (!inst || !activeProgId) return [];
    return computeRoundWiseMovement(instCutoffs, {
      systemCode: primarySysCode,
      academicYear: 2025,
      institutionId: inst.id,
      programmeId: activeProgId,
      quota: activeQuota,
      seatCategory: selectedCategory,
      seatPool: selectedPool,
    });
  }, [inst, instCutoffs, primarySysCode, activeProgId, activeQuota, selectedCategory, selectedPool]);

  const handleAddProgrammeToChoiceList = async (prog: Programme) => {
    if (!inst) return;
    const latestMatch = instCutoffs.find(
      (c) =>
        c.systemCode === primarySysCode &&
        c.academicYear === 2025 &&
        c.roundNumber === latestRound &&
        c.programmeId === prog.id &&
        c.seatCategory === 'OPEN' &&
        c.seatPool === 'Gender-Neutral'
    );
    await addItemToChoiceList(
      {
        id: `item_${Date.now().toString(36)}_${prog.code.toLowerCase()}`,
        institutionId: inst.id,
        institutionSlug: inst.slug,
        institutionName: inst.name,
        institutionType: inst.type,
        state: inst.state,
        programmeId: prog.id,
        programmeName: prog.name,
        branchGroup: prog.branchGroup,
        quota: latestMatch?.quota ?? availableQuotas[0] ?? 'AI',
        seatCategory: latestMatch?.seatCategory ?? 'OPEN',
        seatPool: latestMatch?.seatPool ?? 'Gender-Neutral',
        rankType: latestMatch?.rankType ?? 'CRL',
        closingRank: latestMatch?.closingRank ?? null,
        academicYear: latestMatch?.academicYear ?? 2025,
        roundLabel: latestMatch?.roundLabel ?? `Round ${latestRound}`,
        sourceName: latestMatch?.sourceName ?? inst.sourceName,
        isDemo: latestMatch?.isDemo ?? inst.isDemo,
        tag: 'Unassigned',
        notes: '',
      },
      undefined,
      primarySysCode
    );
    setChoicePickerOpen(false);
  };

  if (!inst) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-16 text-center space-y-3">
        <h1 className="text-2xl font-display font-bold text-[#0B1F3A]">Institution not found</h1>
        <p className="text-sm text-slate-600">
          The requested college profile does not exist or is not published.
        </p>
        <Link
          to="/colleges"
          className="inline-block text-sm font-semibold text-[#1D4ED8] hover:underline"
        >
          Return to Colleges Directory →
        </Link>
      </div>
    );
  }

  const isSaved = savedColleges.some((s) => s.institutionId === inst.id && !s.programmeId);
  const parsedOverlay = myRankInput.trim() && Number(myRankInput) > 0 ? Number(myRankInput) : null;

  const latestRoundCutoffs = instCutoffs
    .filter(
      (c) =>
        c.systemCode === primarySysCode &&
        c.academicYear === 2025 &&
        c.roundNumber === latestRound
    )
    .sort((a, b) => a.closingRank - b.closingRank);

  const gallery =
    inst.galleryImages && inst.galleryImages.length > 0
      ? inst.galleryImages
      : inst.imageUrl
        ? [{ url: inst.imageUrl, caption: `${inst.shortName} Campus` }]
        : [];
  const safeGalleryIdx = Math.min(activeGalleryIdx, Math.max(0, gallery.length - 1));
  const activeGalleryItem = gallery[safeGalleryIdx];

  const similarInstitutions = institutions
    .filter((other) => other.status === 'published' && other.id !== inst.id)
    .map((other) => {
      let score = 0;
      if (other.systems.includes(primarySysCode)) score += 4;
      if (other.type === inst.type) score += 2;
      if (other.ownership && inst.ownership && other.ownership === inst.ownership) score += 2;
      if (other.state === inst.state) score += 3;
      return { other, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.other);

  const sectionAnchors = [
    { href: '#overview', label: 'Overview' },
    { href: '#admissions', label: 'Admissions & Contact' },
    { href: '#courses', label: 'Courses & Branches' },
    { href: '#cutoffs', label: 'Historical Cutoffs' },
    { href: '#placements', label: 'Placements' },
    { href: '#facilities', label: 'Facilities' },
    { href: '#gallery', label: 'Images & Map' },
    { href: '#similar', label: 'Similar Colleges' },
  ];

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      {inst.isDemo && <DemoDataNotice compact showHistoricalNote />}

      {/* Hero Profile Header */}
      <section className="app-panel rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0B162C] to-[#1E3A5F] min-h-[240px] relative">
          {inst.imageUrl ? (
            <img
              src={inst.imageUrl}
              alt={`${inst.name} campus`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 font-display font-semibold text-base">
              {inst.shortName}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-start gap-3.5">
              <InstitutionLogo institution={inst} size="lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-semibold text-[#1D4ED8]">{inst.type}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">
                    {inst.ownership || 'Not available'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {inst.city}, {inst.state}
                  </span>
                  {inst.establishedYear && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Est. {inst.establishedYear}</span>
                    </>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-[#0B1F3A] leading-tight">
                  {inst.name}
                </h1>

                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>
                    Counselling: <strong className="font-semibold text-[#0B1F3A]">{inst.systems.map((s) => s.toUpperCase()).join(', ')}</strong>
                  </span>
                  {inst.accreditation && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{inst.accreditation.split('·')[0].trim()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {inst.overview || 'Not available'}
            </p>
          </div>

          {/* Primary Profile Actions: Save College, Add to Comparison, Add to Choice List, Official Website */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleSaveCollege({ institution: inst })}
                className={`h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                  isSaved
                    ? 'border-teal-300 bg-teal-50/70 text-teal-800'
                    : 'border-slate-300 bg-white text-[#0B1F3A] hover:bg-slate-50'
                }`}
              >
                {isSaved ? (
                  <Check className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isSaved ? t('saved') : t('saveCollege')}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/compare?add=${inst.id}`)}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add to Comparison</span>
              </button>

              <button
                type="button"
                onClick={() => setChoicePickerOpen((prev) => !prev)}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors whitespace-nowrap"
              >
                <ListPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add to Choice List</span>
              </button>

              {isSafeHttpUrl(inst.websiteUrl) && (
                <a
                  href={inst.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[#0B162C] text-white text-xs font-semibold hover:bg-[#132C50] transition-colors whitespace-nowrap"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}

              <button
                type="button"
                onClick={() =>
                  openReportModal({
                    entityType: 'institution',
                    entityId: inst.id,
                    entityLabel: inst.name,
                  })
                }
                className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs text-slate-500 hover:text-amber-700 hover:bg-slate-100 ml-auto whitespace-nowrap"
              >
                <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('reportError')}</span>
              </button>
            </div>

            {choicePickerOpen && instProgs.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 flex flex-wrap items-center gap-2">
                <label htmlFor="hero-choice-branch" className="text-xs font-semibold text-[#0B1F3A]">
                  Select branch to add:
                </label>
                <select
                  id="hero-choice-branch"
                  value={activeChoiceProgId}
                  onChange={(e) => setChoiceBranchId(e.target.value)}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs flex-1 min-w-[200px]"
                >
                  {instProgs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.degree})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const targetProg = instProgs.find((p) => p.id === activeChoiceProgId);
                    if (targetProg) void handleAddProgrammeToChoiceList(targetProg);
                  }}
                  className="h-8 px-3 rounded-md bg-[#0B162C] text-white text-xs font-semibold hover:bg-[#132C50] whitespace-nowrap"
                >
                  Confirm Add
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
              <span>Source: {inst.sourceName}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Academic Year: {inst.academicYear}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Last verified: {inst.verifiedAt}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Section Navigation Strip */}
      <nav
        aria-label="Institution profile sections"
        className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200/80 no-print"
      >
        {sectionAnchors.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Overview & Full Institutional Description */}
      <section id="overview" className="app-panel rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-display font-bold text-[#0B1F3A]">
            College Overview &amp; Institutional Description
          </h2>
          <span className="text-xs text-slate-500">
            {inst.ownership || 'Institution'} · {inst.type} · Est. {inst.establishedYear ?? 'N/A'}
          </span>
        </div>

        <div className="space-y-3 text-sm text-slate-700 leading-relaxed max-w-4xl">
          <p>{inst.overview || 'Overview not available.'}</p>
          {inst.description && <p className="text-slate-600">{inst.description}</p>}
        </div>

        {/* Key Institutional Facts Bar */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <dt className="text-slate-500 font-medium">Ownership &amp; Governance</dt>
            <dd className="font-semibold text-[#0B1F3A] mt-1">{inst.ownership || 'Not available'}</dd>
            {inst.ownershipDetails && (
              <dd className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {inst.ownershipDetails}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-slate-500 font-medium">College Type &amp; Est. Year</dt>
            <dd className="font-semibold text-[#0B1F3A] mt-1 tabular-nums">
              {inst.type} · {inst.establishedYear ? `Established ${inst.establishedYear}` : 'Year not available'}
            </dd>
            <dd className="text-[11px] text-slate-500 mt-0.5">
              {inst.city}, {inst.state}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Accreditation &amp; Statutory Status</dt>
            <dd className="font-semibold text-[#0B1F3A] mt-1 leading-snug">
              {inst.accreditation || 'Verify on official institute website'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Estimated 4-Year Total Fees</dt>
            <dd className="font-semibold text-[#0B1F3A] mt-1 leading-snug">
              {inst.estimatedTotalFee || inst.feeRangeNote || 'Not available'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Admissions, Rankings & Contact Grid */}
      <section id="admissions" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Entrance Exams, Eligibility & Admission Process */}
        <div className="lg:col-span-7 app-panel rounded-xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-display font-bold text-[#0B1F3A]">
              Entrance Examinations &amp; Admission Process
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Counselling channels and eligibility rules governing undergraduate seat allotment.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-[#0B1F3A]">Entrance Examinations Accepted</div>
              <p className="text-slate-700 leading-relaxed">
                {inst.entranceExams && inst.entranceExams.length > 0
                  ? inst.entranceExams.join(' · ')
                  : inst.systems.map((s) => s.toUpperCase()).join(' · ')}
              </p>
            </div>

            <div className="space-y-1 pt-3 border-t border-slate-100">
              <div className="font-semibold text-[#0B1F3A]">Admission Eligibility Summary</div>
              <p className="text-slate-600 leading-relaxed">
                {inst.eligibilitySummary || 'Verify official counselling authority eligibility brochure.'}
              </p>
            </div>

            <div className="space-y-1 pt-3 border-t border-slate-100">
              <div className="font-semibold text-[#0B1F3A]">Counselling &amp; Admission Process</div>
              <p className="text-slate-600 leading-relaxed">
                {inst.admissionProcess || 'Not available'}
              </p>
            </div>

            <div className="space-y-1 pt-3 border-t border-slate-100">
              <div className="font-semibold text-[#0B1F3A]">Official Fee Schedule Note</div>
              <p className="text-slate-600 leading-relaxed">
                {inst.feeRangeNote || 'Verify current semester fee circular on official institute website.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: NIRF Rankings & Contact Details */}
        <div className="lg:col-span-5 app-panel rounded-xl p-5 sm:p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
              <h2 className="text-base font-display font-bold text-[#0B1F3A]">
                NIRF &amp; Published Rankings
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="text-slate-500 font-medium">NIRF Engineering Ranking</div>
                <div className="font-semibold text-[#0B1F3A] mt-0.5 leading-snug">
                  {inst.nirfRanking || 'Verify latest ranking directly on nirfindia.org'}
                </div>
              </div>

              {inst.otherRankings && inst.otherRankings.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-slate-500 font-medium">Other Published Listings</div>
                  <ul className="mt-1 space-y-1 text-slate-700">
                    {inst.otherRankings.map((rk) => (
                      <li key={rk} className="leading-snug">
                        • {rk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <h3 className="text-sm font-display font-bold text-[#0B1F3A]">
              Address &amp; Contact Details
            </h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="sr-only">Address</dt>
                  <dd className="text-slate-700 leading-snug">
                    {inst.address || `${inst.city}, ${inst.state}, India`}
                  </dd>
                </div>
              </div>

              {inst.contactPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="sr-only">Phone</dt>
                    <dd className="text-slate-700 font-mono tabular-nums">{inst.contactPhone}</dd>
                  </div>
                </div>
              )}

              {inst.contactEmail && (
                <div className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="sr-only">Email</dt>
                    <dd className="text-slate-700 break-all">{inst.contactEmail}</dd>
                  </div>
                </div>
              )}

              {isSafeHttpUrl(inst.websiteUrl) && (
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="sr-only">Official Website</dt>
                    <dd>
                      <a
                        href={inst.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#1D4ED8] hover:underline break-all"
                      >
                        {inst.websiteUrl}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* Available Courses & Available Branches */}
      <section id="courses" className="app-panel rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-display font-bold text-[#0B1F3A]">
              Available Courses &amp; Branches ({instProgs.length} listed UG branches)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect multi-year cutoffs by branch, bookmark programmes, or add directly to your preference list.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {inst.isDemo
              ? `Demo catalog — verify full intake matrix on official ${primarySys?.shortName ?? 'counselling'} portal`
              : `Verified ${inst.verifiedAt}`}
          </span>
        </div>

        {/* Degree Courses Offered */}
        {inst.coursesOffered && inst.coursesOffered.length > 0 && (
          <div className="pb-4 border-b border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B1F3A]">
              <GraduationCap className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
              Degree Courses Offered:
            </span>
            <span className="text-slate-700">{inst.coursesOffered.join(' · ')}</span>
          </div>
        )}

        {/* Available Branches Filter (for multi-department institutes) & Verification Note */}
        {instProgs.length > 8 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              placeholder={`Filter ${instProgs.length} branches (e.g. CSE, Electrical, Architecture)...`}
              aria-label="Filter offered branches"
              className="h-8 w-full sm:w-80 rounded-lg border border-slate-300/90 bg-white px-3 text-xs text-slate-800"
            />
            {instProgs[0]?.seatMatrixNote && (
              <span className="text-[11px] text-slate-500">{instProgs[0].seatMatrixNote}</span>
            )}
          </div>
        )}
        {instProgs.length <= 8 && instProgs[0]?.seatMatrixNote && (
          <p className="text-[11px] text-slate-500 -mt-2">{instProgs[0].seatMatrixNote}</p>
        )}

        {/* Available Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {instProgs
            .filter((p) => {
              const q = branchSearch.trim().toLowerCase();
              if (!q) return true;
              return (
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                p.branchGroup.toLowerCase().includes(q) ||
                p.degree.toLowerCase().includes(q)
              );
            })
            .map((p) => {
            const isProgSaved = savedColleges.some(
              (s) => s.institutionId === inst.id && s.programmeId === p.id
            );
            return (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {p.degree} · {p.durationYears} Years · {p.branchGroup} · Code: {p.code}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    to={`/cutoffs/${inst.slug}/${p.code.toLowerCase()}`}
                    className="px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-[#1D4ED8] hover:bg-blue-50/50 whitespace-nowrap"
                  >
                    Cutoffs →
                  </Link>
                  <button
                    type="button"
                    onClick={() => void toggleSaveCollege({ institution: inst, programme: p })}
                    className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    {isProgSaved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAddProgrammeToChoiceList(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0B162C] text-white text-xs font-medium hover:bg-[#132C50] whitespace-nowrap"
                    title="Add branch to Choice List"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                    <span>Choice</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historical Cutoffs: Trend Charts & Final Round Table */}
      <section id="cutoffs" className="space-y-5">
        <div className="app-panel rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-bold text-[#0B1F3A]">
                Historical Rank Trends &amp; Round Movement
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Compare multi-year final-round closing ranks and round-by-round progression with your own rank overlay.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Select programme"
                value={activeProgId}
                onChange={(e) => setSelectedProgId(e.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
              >
                {instProgs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Select quota"
                value={activeQuota}
                onChange={(e) => setSelectedQuota(e.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
              >
                {availableQuotas.map((q) => (
                  <option key={q} value={q}>
                    Quota: {q}
                  </option>
                ))}
              </select>
              <select
                aria-label="Select category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
              >
                {['OPEN', 'EWS', 'OBC-NCL', 'SC', 'ST', 'OPEN (PwD)'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                aria-label="Select seat pool"
                value={selectedPool}
                onChange={(e) => setSelectedPool(e.target.value as SeatPool)}
                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
              >
                <option value="Gender-Neutral">Gender-Neutral</option>
                <option value="Female-only">Female-only</option>
              </select>
              <input
                type="number"
                min={1}
                value={myRankInput}
                onChange={(e) => setMyRankInput(e.target.value)}
                placeholder="My Rank"
                aria-label="My rank overlay"
                className="h-8 w-28 rounded-md border border-slate-300 px-2.5 text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
            <YoYCutoffChart
              points={yoyPoints}
              studentRank={parsedOverlay}
              rankTypeLabel={
                primarySys
                  ? getExpectedRankType(primarySys, selectedCategory)
                  : selectedCategory === 'OPEN'
                    ? 'CRL'
                    : 'CATEGORY_RANK'
              }
            />
            <RoundMovementChart
              points={roundPoints}
              studentRank={parsedOverlay}
              academicYear={2025}
            />
          </div>
        </div>

        {/* Latest Final Round Cutoff Table */}
        <div className="app-panel rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <h3 className="text-base font-display font-bold text-[#0B1F3A]">
              {primarySys?.shortName ?? primarySysCode.toUpperCase()} 2025 Final Round Cutoffs ({latestRoundCutoffs.length} rows)
            </h3>
            <Link
              to={`/cutoffs/${primarySysCode}`}
              className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap"
            >
              Open full explorer →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Programme</th>
                  <th className="py-2.5 px-3">Quota</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Seat Pool</th>
                  <th className="py-2.5 px-3">Rank Type</th>
                  <th className="py-2.5 px-3 text-right">Opening</th>
                  <th className="py-2.5 px-3 text-right">Closing</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latestRoundCutoffs.slice(0, 30).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-medium text-[#0B1F3A]">{c.programmeName}</td>
                    <td className="py-2.5 px-3">{c.quota}</td>
                    <td className="py-2.5 px-3">{c.seatCategory}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.seatPool}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {c.rankType}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {c.openingRank.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#0B1F3A]">
                      {c.closingRank.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right">
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
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 text-[11px] font-medium text-[#0B1F3A] hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" /> Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Placement Statistics */}
      <section id="placements" className="app-panel rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-display font-bold text-[#0B1F3A]">
              Placement Statistics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Median package benchmark plus average and highest packages strictly where reliably reported.
            </p>
          </div>
          <span className="text-[11px] font-medium text-amber-800">
            {inst.placements?.isDemo !== false
              ? 'Demo reference — not official placement disclosure'
              : `Verified ${inst.verifiedAt}`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 bg-slate-50/40">
          <div className="p-5 space-y-1">
            <div className="text-xs font-medium text-slate-500">Median Package</div>
            <div className="text-base sm:text-lg font-display font-bold text-[#0B1F3A] tabular-nums leading-snug">
              {inst.placements?.medianPackage || 'Not available — verify official NIRF report'}
            </div>
            <p className="text-[11px] text-slate-500">
              NIRF disclosures standardize median salary across graduating batches.
            </p>
          </div>

          <div className="p-5 space-y-1">
            <div className="text-xs font-medium text-slate-500">
              Average Package (where reliably reported)
            </div>
            <div className="text-base sm:text-lg font-display font-bold text-[#0B1F3A] tabular-nums leading-snug">
              {inst.placements?.averagePackage || 'Not reliably reported'}
            </div>
            <p className="text-[11px] text-slate-500">
              Shown only when reliably disclosed; branch-wise averages can vary widely.
            </p>
          </div>

          <div className="p-5 space-y-1">
            <div className="text-xs font-medium text-slate-500">
              Highest Package (where reliably reported)
            </div>
            <div className="text-base sm:text-lg font-display font-bold text-[#0B1F3A] tabular-nums leading-snug">
              {inst.placements?.highestPackage || 'Not reliably reported'}
            </div>
            <p className="text-[11px] text-slate-500">
              Outlier offers vary year to year and are never fabricated without verification.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200/80 space-y-1.5 text-xs">
          <p className="text-slate-700 leading-relaxed">
            {inst.placements?.placementSummary ||
              'Consult the official institute Training & Placement Cell and NIRF Engineering data sheets for verified branch-wise placement statistics.'}
          </p>
          <p className="text-[11px] text-slate-500">
            Source note: {inst.placements?.sourceNote || inst.sourceName}
          </p>
        </div>
      </section>

      {/* Campus Facilities & Student Facilities */}
      <section id="facilities" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="app-panel rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
            <h2 className="text-base font-display font-bold text-[#0B1F3A]">
              Campus Facilities
            </h2>
          </div>
          {inst.campusFacilities && inst.campusFacilities.length > 0 ? (
            <ul className="space-y-2.5 text-xs text-slate-700">
              {inst.campusFacilities.map((fac) => (
                <li key={fac} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="leading-snug">{fac}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              Campus infrastructure details not available — verify on official institute website.
            </p>
          )}
        </div>

        <div className="app-panel rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
            <h2 className="text-base font-display font-bold text-[#0B1F3A]">
              Student Facilities &amp; Residential Support
            </h2>
          </div>
          {inst.studentFacilities && inst.studentFacilities.length > 0 ? (
            <ul className="space-y-2.5 text-xs text-slate-700">
              {inst.studentFacilities.map((fac) => (
                <li key={fac} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="leading-snug">{fac}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              Student support details not available — verify on official institute website.
            </p>
          )}
        </div>
      </section>

      {/* College Images Gallery */}
      {gallery.length > 0 && (
        <section id="gallery" className="app-panel rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
              <h2 className="text-base font-display font-bold text-[#0B1F3A]">
                College Images ({gallery.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Illustrative campus visuals — visit official website for latest campus photo gallery.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-8 rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100">
              <div className="aspect-[16/9] bg-gradient-to-br from-[#0B162C] to-[#1E3A5F] overflow-hidden">
                {activeGalleryItem && (
                  <img
                    src={activeGalleryItem.url}
                    alt={activeGalleryItem.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {activeGalleryItem && (
                <div className="px-4 py-2.5 bg-white border-t border-slate-100 text-xs text-slate-600">
                  {activeGalleryItem.caption}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              {gallery.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveGalleryIdx(idx)}
                  className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-colors ${
                    idx === safeGalleryIdx
                      ? 'border-[#1D4ED8] bg-blue-50/40'
                      : 'border-slate-200/90 bg-white hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.caption}
                    referrerPolicy="no-referrer"
                    className="w-16 h-11 rounded object-cover shrink-0 bg-slate-100"
                  />
                  <span className="text-xs text-slate-700 line-clamp-2 leading-snug">
                    {img.caption}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Google Maps Location & Address Card */}
      <CampusLocationCard institution={inst} />

      {/* Similar College Suggestions & Internal Links */}
      <section id="similar" className="app-panel rounded-xl p-5 sm:p-6 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-display font-bold text-[#0B1F3A]">
              Similar College Suggestions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparable institutions across {primarySys?.shortName ?? primarySysCode.toUpperCase()}, {inst.state}, and {inst.ownership ?? inst.type} profiles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <Link to={`/predictor/${primarySysCode}`} className="text-[#1D4ED8] hover:underline">
              {primarySys?.shortName ?? primarySysCode.toUpperCase()} Predictor →
            </Link>
            <Link to={`/cutoffs/${primarySysCode}/2025`} className="text-[#1D4ED8] hover:underline">
              {primarySys?.shortName ?? primarySysCode.toUpperCase()} 2025 Cutoffs →
            </Link>
            <Link to={`/counselling/${primarySysCode}`} className="text-[#1D4ED8] hover:underline">
              {primarySys?.shortName ?? primarySysCode.toUpperCase()} Counselling Hub →
            </Link>
          </div>
        </div>

        {similarInstitutions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {similarInstitutions.map((rel) => (
              <div
                key={rel.id}
                className="rounded-lg border border-slate-200/90 p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <InstitutionLogo institution={rel} size="sm" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 truncate">
                        {rel.ownership || rel.type} · {rel.state}
                      </div>
                      <Link
                        to={`/colleges/${rel.slug}`}
                        className="text-xs font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] line-clamp-2 leading-snug mt-0.5 block"
                      >
                        {rel.name}
                      </Link>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {rel.placements?.medianPackage
                      ? `Median ref: ${rel.placements.medianPackage}`
                      : rel.overview}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] font-semibold">
                  <Link
                    to={`/colleges/${rel.slug}`}
                    className="text-[#1D4ED8] hover:underline"
                  >
                    Profile →
                  </Link>
                  <Link
                    to={`/compare?ids=${inst.id},${rel.id}`}
                    className="text-slate-600 hover:text-[#0B1F3A] inline-flex items-center gap-1"
                  >
                    <Scale className="w-3 h-3" aria-hidden="true" />
                    <span>Compare</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
