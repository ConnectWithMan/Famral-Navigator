import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Download, FileText, Plus, Printer, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { computePersonalComparisonTable } from '../engine/analytics.ts';
import { ComparisonWeights, Institution, InstitutionOwnership } from '../types/domain.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { InstitutionLogo } from '../components/InstitutionLogo.tsx';
import {
  getLatestRoundNumber,
  getSystemConfig,
  INDIAN_STATES_AND_UTS,
} from '../config/systems/registry.ts';
import { triggerFileDownload } from '../lib/exporters.ts';
import { usePageSeo } from '../lib/seo.ts';
import type { BreadcrumbItem } from '../lib/seoSchema.ts';

interface ComparisonPreset {
  label: string;
  ids: string[];
}

const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    label: 'Top IITs (JEE Advanced)',
    ids: ['inst_iit_bombay', 'inst_iit_delhi', 'inst_iit_madras', 'inst_iit_kanpur'],
  },
  {
    label: 'IIT vs NIT (JoSAA)',
    ids: ['inst_iit_roorkee', 'inst_iit_hyderabad', 'inst_nit_trichy'],
  },
  {
    label: 'Govt vs Private (JoSAA)',
    ids: ['inst_nit_trichy', 'inst_iiit_allahabad', 'inst_bit_mesra'],
  },
  {
    label: 'Govt vs Private (MHT CET)',
    ids: ['inst_coep_pune', 'inst_vjti_mumbai', 'inst_spit_mumbai', 'inst_pict_pune'],
  },
  {
    label: 'Aided vs Private (KCET)',
    ids: ['inst_rvce_bengaluru', 'inst_bmsce_bengaluru', 'inst_pesu_bengaluru'],
  },
  {
    label: 'Govt vs Private (WBJEE)',
    ids: ['inst_jadavpur_univ', 'inst_kgec_kalyani', 'inst_iem_kolkata'],
  },
];

export const ComparePage: React.FC = () => {
  const {
    institutions,
    programmes,
    cutoffs,
    comparisons,
    profile,
    saveComparison,
    removeComparison,
    showToast,
  } = useApp();

  const [searchParams] = useSearchParams();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', to: '/' },
    { label: 'Compare Colleges' },
  ];

  usePageSeo({
    title: 'Compare Engineering Colleges Side by Side — Govt vs Private, Cutoffs & Placements',
    description:
      'Compare 2 to 4 participating JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET government and private colleges across locations, branches, eligibility, cutoffs, fees, median packages, rankings, accreditation, and facilities.',
    canonicalPath: '/compare',
    breadcrumbs,
  });

  const publishedInsts = useMemo(
    () => institutions.filter((i) => i.status === 'published'),
    [institutions]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const parsed = idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4);
      if (parsed.length >= 2) return parsed;
    }
    const addParam = searchParams.get('add');
    const defaults = ['inst_nit_trichy', 'inst_iiit_allahabad', 'inst_bit_mesra'];
    if (addParam && !defaults.includes(addParam)) {
      return [addParam, defaults[0], defaults[1]];
    }
    return defaults;
  });

  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const parsed = idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4);
      if (parsed.length >= 2) {
        setSelectedIds(parsed);
        return;
      }
    }
    const addParam = searchParams.get('add');
    if (addParam && !selectedIds.includes(addParam) && selectedIds.length < 4) {
      setSelectedIds((prev) => [...prev, addParam]);
    }
  }, [searchParams]);

  const [ownershipFilter, setOwnershipFilter] = useState<'all' | InstitutionOwnership>('all');
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [preferredState, setPreferredState] = useState(profile?.homeState || 'Uttar Pradesh');
  const [saveTitle, setSaveTitle] = useState('');
  const [weights, setWeights] = useState<ComparisonWeights>({
    closingRank: 40,
    location: 20,
    fees: 15,
    branch: 25,
  });

  const selectedInsts = useMemo(
    () =>
      selectedIds
        .map((id) => publishedInsts.find((i) => i.id === id))
        .filter((i): i is Institution => Boolean(i)),
    [selectedIds, publishedInsts]
  );

  const pickerOptions = useMemo(
    () =>
      publishedInsts.filter((i) => {
        if (selectedIds.includes(i.id)) return false;
        if (ownershipFilter !== 'all' && i.ownership !== ownershipFilter) return false;
        return true;
      }),
    [publishedInsts, selectedIds, ownershipFilter]
  );

  const progByInst = useMemo(() => {
    const map: Record<string, typeof programmes> = {};
    for (const p of programmes) {
      if (!map[p.institutionId]) map[p.institutionId] = [];
      map[p.institutionId].push(p);
    }
    return map;
  }, [programmes]);

  const progCountByInst = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [id, list] of Object.entries(progByInst)) {
      counts[id] = list.length;
    }
    return counts;
  }, [progByInst]);

  const personalRows = useMemo(
    () =>
      computePersonalComparisonTable(
        selectedInsts,
        cutoffs,
        progCountByInst,
        weights,
        preferredState
      ),
    [selectedInsts, cutoffs, progCountByInst, weights, preferredState]
  );

  const addInstitution = (id: string) => {
    if (!id || selectedIds.includes(id)) return;
    if (selectedIds.length >= 4) {
      showToast('You can compare up to 4 colleges at once.');
      return;
    }
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeInstitution = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const getCseClosing = (inst: Institution) => {
    const primarySys = inst.systems[0] ?? 'josaa';
    const latestRound = getLatestRoundNumber(getSystemConfig(primarySys));
    const matching = cutoffs.filter(
      (c) =>
        c.status === 'published' &&
        c.systemCode === primarySys &&
        c.academicYear === 2025 &&
        c.roundNumber === latestRound &&
        c.institutionId === inst.id &&
        (c.programmeName.includes('Computer Science') ||
          c.programmeName.includes('Information Technology')) &&
        c.seatCategory === 'OPEN' &&
        c.seatPool === 'Gender-Neutral'
    );
    const row = matching.find((c) => c.quota === 'OS' || c.quota === 'AI') ?? matching[0];
    return row
      ? `${row.closingRank.toLocaleString('en-IN')} (${row.systemCode.toUpperCase()} · ${row.quota} · ${row.rankType})`
      : 'Not available';
  };

  const getBestOverallClosing = (inst: Institution) => {
    const primarySys = inst.systems[0] ?? 'josaa';
    const latestRound = getLatestRoundNumber(getSystemConfig(primarySys));
    const matching = cutoffs.filter(
      (c) =>
        c.status === 'published' &&
        c.systemCode === primarySys &&
        c.academicYear === 2025 &&
        c.roundNumber === latestRound &&
        c.institutionId === inst.id &&
        c.seatCategory === 'OPEN' &&
        c.seatPool === 'Gender-Neutral'
    );
    if (matching.length === 0) return 'Not available';
    const sorted = [...matching].sort((a, b) => a.closingRank - b.closingRank);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    return `${min.closingRank.toLocaleString('en-IN')} – ${max.closingRank.toLocaleString('en-IN')} (${min.systemCode.toUpperCase()} 2025)`;
  };

  const comparisonRows: { section: string; label: string; values: string[] }[] = [
    {
      section: 'Identity & Ownership',
      label: 'Ownership (Govt / Private)',
      values: selectedInsts.map(
        (i) => `${i.ownership || 'Not available'}${i.ownershipDetails ? ` — ${i.ownershipDetails}` : ''}`
      ),
    },
    {
      section: 'Identity & Ownership',
      label: 'Institution Type & Est. Year',
      values: selectedInsts.map(
        (i) => `${i.type} · ${i.establishedYear ? `Est. ${i.establishedYear}` : 'Year N/A'}`
      ),
    },
    {
      section: 'Location',
      label: 'City & State',
      values: selectedInsts.map((i) => `${i.city}, ${i.state}`),
    },
    {
      section: 'Location',
      label: 'Campus Address',
      values: selectedInsts.map((i) => i.address || `${i.city}, ${i.state}`),
    },
    {
      section: 'Rankings & Accreditation',
      label: 'NIRF Ranking',
      values: selectedInsts.map(
        (i) => i.nirfRanking || 'Verify latest ranking on nirfindia.org'
      ),
    },
    {
      section: 'Rankings & Accreditation',
      label: 'Accreditation',
      values: selectedInsts.map(
        (i) => i.accreditation || 'Verify accreditation on official website'
      ),
    },
    {
      section: 'Admissions & Eligibility',
      label: 'Counselling & Entrance Exams',
      values: selectedInsts.map((i) => {
        const exams =
          i.entranceExams && i.entranceExams.length > 0
            ? i.entranceExams.join(', ')
            : i.systems.map((s) => s.toUpperCase()).join(', ');
        return `${i.systems.map((s) => s.toUpperCase()).join('/')} · ${exams}`;
      }),
    },
    {
      section: 'Admissions & Eligibility',
      label: 'Admission Eligibility',
      values: selectedInsts.map(
        (i) => i.eligibilitySummary || 'Verify official counselling brochure'
      ),
    },
    {
      section: 'Courses & Branches',
      label: 'Available Courses',
      values: selectedInsts.map((i) =>
        i.coursesOffered && i.coursesOffered.length > 0
          ? i.coursesOffered.join(', ')
          : 'B.Tech / Undergraduate'
      ),
    },
    {
      section: 'Courses & Branches',
      label: 'Available Branches',
      values: selectedInsts.map((i) => {
        const progs = progByInst[i.id] ?? [];
        if (progs.length === 0) return 'Not available';
        return `${progs.length} listed: ${progs.map((p) => p.code).join(', ')}`;
      }),
    },
    {
      section: 'Historical Cutoffs',
      label: '2025 Latest CSE/IT Closing (OPEN)',
      values: selectedInsts.map((i) => getCseClosing(i)),
    },
    {
      section: 'Historical Cutoffs',
      label: '2025 Closing Rank Span (All Branches)',
      values: selectedInsts.map((i) => getBestOverallClosing(i)),
    },
    {
      section: 'Fees & Placements',
      label: 'Total Estimated Fees (4-Year)',
      values: selectedInsts.map(
        (i) => i.estimatedTotalFee || i.feeRangeNote || 'Not available'
      ),
    },
    {
      section: 'Fees & Placements',
      label: 'Median Package',
      values: selectedInsts.map(
        (i) => i.placements?.medianPackage || 'Not available — verify NIRF report'
      ),
    },
    {
      section: 'Fees & Placements',
      label: 'Average / Highest Package (Where Reliably Reported)',
      values: selectedInsts.map((i) => {
        const avg = i.placements?.averagePackage || 'Avg: Not reliably reported';
        const high = i.placements?.highestPackage || 'Highest: Not reliably reported';
        return `${avg} | ${high}`;
      }),
    },
    {
      section: 'Fees & Placements',
      label: 'Placement Statistics Overview',
      values: selectedInsts.map(
        (i) => i.placements?.placementSummary || 'Verify official institute placement cell'
      ),
    },
    {
      section: 'Facilities',
      label: 'Campus Facilities',
      values: selectedInsts.map((i) =>
        i.campusFacilities && i.campusFacilities.length > 0
          ? i.campusFacilities.slice(0, 4).join(' · ')
          : 'Not available'
      ),
    },
    {
      section: 'Facilities',
      label: 'Student Facilities',
      values: selectedInsts.map((i) =>
        i.studentFacilities && i.studentFacilities.length > 0
          ? i.studentFacilities.slice(0, 4).join(' · ')
          : 'Not available'
      ),
    },
    {
      section: 'Verification',
      label: 'Data Status & Verification',
      values: selectedInsts.map((i) =>
        i.isDemo ? `Demo data — not official (${i.verifiedAt})` : `Verified ${i.verifiedAt}`
      ),
    },
  ];

  const visibleRows = useMemo(() => {
    if (!onlyDifferences) return comparisonRows;
    return comparisonRows.filter((r) => new Set(r.values).size > 1);
  }, [comparisonRows, onlyDifferences]);

  const diffCount = useMemo(
    () => comparisonRows.filter((r) => new Set(r.values).size > 1).length,
    [comparisonRows]
  );

  const handleExportCsv = () => {
    const header = ['Section', 'Attribute', ...selectedInsts.map((i) => i.name)];
    const body = comparisonRows.map((r) => [r.section, r.label, ...r.values]);
    const csv = [
      '# Famral Navigator — College Comparison Report',
      '# Notice: Demo data — not an official cutoff, fee schedule, or placement disclosure. Always verify on official counselling and institute portals.',
      header.map((c) => `"${c.replace(/"/g, '""')}"`).join(','),
      ...body.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    triggerFileDownload(csv, 'famral-navigator-college-comparison.csv', 'text/csv;charset=utf-8;');
    showToast('Downloaded CSV comparison report.');
  };

  const handleExportMarkdownReport = () => {
    const lines: string[] = [
      `# Famral Navigator — College Comparison Report`,
      ``,
      `Generated on: ${new Date().toISOString().slice(0, 10)}`,
      `Colleges Compared (${selectedInsts.length}): ${selectedInsts.map((i) => i.name).join(' vs ')}`,
      ``,
      `> **Disclaimer:** Seeded records carry Demo data — not official cutoffs, fees, rankings, or placement figures. Historical comparison only — admission is never guaranteed.`,
      ``,
      `## Side-by-Side Comparison Matrix`,
      ``,
      `| Attribute | ${selectedInsts.map((i) => i.shortName).join(' | ')} |`,
      `| --- | ${selectedInsts.map(() => '---').join(' | ')} |`,
      ...comparisonRows.map(
        (r) =>
          `| **${r.label}** | ${r.values.map((v) => v.replace(/\|/g, '/')).join(' | ')} |`
      ),
      ``,
      `## Personal Priority Weights View (Not an Official Ranking)`,
      ``,
      `Weights used: Cutoff ${weights.closingRank}% · Preferred State (${preferredState}) ${weights.location}% · Fee Info ${weights.fees}% · Branch Breadth ${weights.branch}%`,
      ``,
      `| Institution | Best Stored CRL Cutoff | Personal Weighted Index |`,
      `| --- | --- | --- |`,
      ...personalRows.map(
        (r) =>
          `| ${r.institutionName} | ${r.bestClosingRank != null ? r.bestClosingRank.toLocaleString('en-IN') : 'N/A'} | ${r.weightedPersonalScore != null ? `${r.weightedPersonalScore} / 100` : 'Insufficient data'} |`
      ),
    ];
    triggerFileDownload(
      lines.join('\n'),
      'famral-navigator-comparison-report.md',
      'text/markdown;charset=utf-8;'
    );
    showToast('Downloaded formatted Markdown comparison report.');
  };

  const handleSaveComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInsts.length < 2) {
      showToast('Select at least 2 colleges to save a comparison.');
      return;
    }
    const title = saveTitle.trim() || selectedInsts.map((i) => i.shortName).join(' vs ');
    await saveComparison(title, selectedIds, weights);
    setSaveTitle('');
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
      <Breadcrumbs items={breadcrumbs} />

      {/* Compact Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] tracking-tight">
            Compare Colleges Side by Side
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
            Compare 2–4 government and private institutions across location, branches, admission eligibility, historical cutoffs, estimated fees, placements, rankings, accreditation, and facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={selectedInsts.length < 2}
            className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>CSV Report</span>
          </button>
          <button
            type="button"
            onClick={handleExportMarkdownReport}
            disabled={selectedInsts.length < 2}
            className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Full Report (.md)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={selectedInsts.length < 2}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold text-white bg-[#0B162C] rounded-lg hover:bg-[#132C50] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      <DemoDataNotice compact showHistoricalNote />

      {/* College Selector, Ownership Filter & Quick Govt-vs-Private Presets */}
      <div className="app-panel rounded-xl p-4 space-y-3.5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {selectedInsts.map((inst) => (
              <span
                key={inst.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-[#0B1F3A]"
              >
                <span>{inst.shortName}</span>
                <span className="text-[10px] text-slate-500">
                  {inst.ownership === 'Private'
                    ? 'Private'
                    : inst.ownership === 'Government Aided'
                      ? 'Aided'
                      : inst.ownership === 'Public-Private (PPP)'
                        ? 'PPP'
                        : 'Govt'}
                </span>
                <button
                  type="button"
                  onClick={() => removeInstitution(inst.id)}
                  className="text-slate-500 hover:text-red-700"
                  aria-label={`Remove ${inst.shortName}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {selectedIds.length < 4 && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter colleges by ownership"
                  value={ownershipFilter}
                  onChange={(e) =>
                    setOwnershipFilter(e.target.value as 'all' | InstitutionOwnership)
                  }
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                >
                  <option value="all">All Ownership</option>
                  <option value="Government">Government</option>
                  <option value="Government Aided">Government Aided</option>
                  <option value="Public-Private (PPP)">Public-Private (PPP)</option>
                  <option value="Private">Private</option>
                </select>

                <div className="inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <select
                    aria-label="Add a college to compare"
                    value=""
                    onChange={(e) => addInstitution(e.target.value)}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                  >
                    <option value="">Add college ({selectedIds.length}/4)...</option>
                    {pickerOptions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.shortName} — {i.ownership || i.type} ({i.state})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={highlightDiff}
                onChange={(e) => setHighlightDiff(e.target.checked)}
                className="rounded border-slate-300 text-[#1D4ED8]"
              />
              <span>Highlight differences ({diffCount})</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyDifferences}
                onChange={(e) => setOnlyDifferences(e.target.checked)}
                className="rounded border-slate-300 text-[#1D4ED8]"
              />
              <span>Show differing rows only</span>
            </label>
          </div>
        </div>

        {/* One-Click Presets for Government vs Private Comparisons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Quick presets:</span>
          {COMPARISON_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setSelectedIds(preset.ids);
                showToast(`Loaded "${preset.label}" comparison.`);
              }}
              className="px-2.5 py-1 rounded-md border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Comparison Matrix */}
      {selectedInsts.length < 2 ? (
        <div className="app-panel rounded-xl p-10 text-center space-y-2">
          <h2 className="text-base font-display font-semibold text-[#0B1F3A]">
            Select at least 2 colleges to compare
          </h2>
          <p className="text-xs text-slate-600">
            Use the ownership filter and selector above (or pick a quick preset) to compare up to 4 institutions.
          </p>
        </div>
      ) : (
        <div className="app-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="py-3.5 px-4 font-semibold text-slate-500 w-56 align-top">
                    Comparison Criteria
                  </th>
                  {selectedInsts.map((inst) => (
                    <th
                      key={inst.id}
                      className="py-3.5 px-4 font-display font-bold text-sm text-[#0B1F3A] align-top min-w-[210px]"
                    >
                      <div className="flex items-start gap-2.5">
                        <InstitutionLogo institution={inst} size="sm" />
                        <div className="min-w-0">
                          <Link
                            to={`/colleges/${inst.slug}`}
                            className="hover:text-[#1D4ED8] block leading-tight"
                          >
                            {inst.shortName}
                          </Link>
                          <div className="text-[11px] font-sans font-normal text-slate-500 mt-0.5 leading-snug">
                            {inst.name}
                          </div>
                          <div className="text-[11px] font-sans font-medium text-[#1D4ED8] mt-1">
                            {inst.ownership || inst.type} · {inst.city}, {inst.state}
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row) => {
                  const isDifferent = new Set(row.values).size > 1;
                  return (
                    <tr
                      key={row.label}
                      className={highlightDiff && isDifferent ? 'bg-blue-50/35' : ''}
                    >
                      <td className="py-3 px-4 align-top">
                        <div className="text-[10px] font-medium text-slate-400">
                          {row.section}
                        </div>
                        <div className="font-semibold text-[#0B1F3A] mt-0.5">{row.label}</div>
                        {highlightDiff && isDifferent && (
                          <span className="block text-[10px] font-medium text-[#1D4ED8] mt-0.5">
                            Differs across colleges
                          </span>
                        )}
                      </td>
                      {row.values.map((val, idx) => (
                        <td
                          key={`${row.label}-${idx}`}
                          className="py-3 px-4 text-slate-800 align-top leading-relaxed tabular-nums"
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Personal Comparison Weights */}
      {selectedInsts.length >= 2 && (
        <section className="app-panel rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[#1D4ED8]">
                Personal View — Not an Official Ranking
              </p>
              <h2 className="text-base font-display font-bold text-[#0B1F3A] mt-0.5">
                Personal Priority Weights
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Adjust how much each factual criterion matters to you. Every factor below is calculated transparently from stored records only.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs no-print shrink-0">
              <label htmlFor="pref-state" className="text-slate-600">
                Preferred state:
              </label>
              <select
                id="pref-state"
                value={preferredState}
                onChange={(e) => setPreferredState(e.target.value)}
                className="h-8 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs"
              >
                {INDIAN_STATES_AND_UTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 border-b border-slate-200/80 bg-slate-50/50 no-print">
            {(
              [
                ['closingRank', 'Historical Closing Rank'],
                ['location', 'Preferred State Match'],
                ['fees', 'Fee Info Available'],
                ['branch', 'Programme Breadth'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="px-4 py-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="font-mono font-semibold text-[#0B1F3A] tabular-nums">
                    {weights[key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[key]}
                  onChange={(e) =>
                    setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  className="w-full accent-[#1D4ED8]"
                />
              </div>
            ))}
          </div>

          <div className="p-5 space-y-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Institution</th>
                    <th className="py-2.5 px-3 font-medium text-right">Best Stored CRL Cutoff</th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Cutoff Factor ({weights.closingRank})
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      State Factor ({weights.location})
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Branch Factor ({weights.branch})
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">Personal Weighted Index</th>
                    <th className="py-2.5 pl-3 font-medium">Insufficient Factors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {personalRows.map((r) => (
                    <tr key={r.institutionId}>
                      <td className="py-2.5 pr-4 font-semibold text-[#0B1F3A]">
                        {r.institutionName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {r.bestClosingRank != null
                          ? r.bestClosingRank.toLocaleString('en-IN')
                          : 'Not available'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {r.closingRankFactor != null ? r.closingRankFactor : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{r.locationMatchFactor}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{r.branchBreadthFactor}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1D4ED8]">
                        {r.weightedPersonalScore != null
                          ? `${r.weightedPersonalScore} / 100`
                          : 'Insufficient data'}
                      </td>
                      <td className="py-2.5 pl-3 text-[11px] text-slate-500">
                        {r.insufficientFactors.length > 0
                          ? r.insufficientFactors.join(', ')
                          : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save Comparison Form */}
            <form
              onSubmit={handleSaveComparison}
              className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 no-print"
            >
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Name this comparison (optional)..."
                className="rounded-md border border-slate-300 px-3 py-2 text-xs flex-1 min-w-[200px]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF]"
              >
                <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Comparison</span>
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Saved Comparisons List */}
      {comparisons.length > 0 && (
        <section className="app-panel rounded-xl p-5 space-y-3 no-print">
          <h2 className="text-sm font-display font-semibold text-[#0B1F3A]">
            Your Saved Comparisons ({comparisons.length})
          </h2>
          <div className="divide-y divide-slate-100">
            {comparisons.map((cmp) => (
              <div
                key={cmp.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds(cmp.institutionIds);
                      setWeights(cmp.weights);
                      showToast(`Loaded "${cmp.title}"`);
                    }}
                    className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] text-left"
                  >
                    {cmp.title}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    {cmp.institutionIds.length} institutes · Weights: Cutoff {cmp.weights.closingRank}, State {cmp.weights.location}, Fees {cmp.weights.fees}, Branch {cmp.weights.branch}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeComparison(cmp.id)}
                  className="p-1.5 text-slate-400 hover:text-red-700"
                  aria-label="Delete saved comparison"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
