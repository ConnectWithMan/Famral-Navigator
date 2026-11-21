import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Bookmark,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  Flag,
  Info,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { COUNSELLING_SYSTEMS, getSystemConfig } from '../config/systems/registry.ts';
import { JOURNEY_STEPS } from '../data/demoSeed.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { exportSchedulesIcs, isSafeHttpUrl } from '../lib/exporters.ts';
import { usePageSeo } from '../lib/seo.ts';
import {
  BreadcrumbItem,
  buildCounsellingHubJsonLd,
  buildCounsellingSystemJsonLd,
} from '../lib/seoSchema.ts';

export const CounsellingPage: React.FC = () => {
  const { system: systemParam } = useParams<{ system?: string }>();
  const {
    user,
    institutions,
    programmes,
    schedules,
    notices,
    contentItems,
    cutoffs,
    tracking,
    toggleFollowSystem,
    toggleSavedSchedule,
    toggleCheckedDoc,
    toggleJourneyStep,
    openReportModal,
  } = useApp();

  const selectedSystem = useMemo(
    () => (systemParam ? getSystemConfig(systemParam) : undefined),
    [systemParam]
  );

  const [activeTab, setActiveTab] = useState<'dates' | 'notices' | 'checklist' | 'journey'>('dates');

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () =>
      selectedSystem
        ? [
            { label: 'Home', to: '/' },
            { label: 'Counselling Hub', to: '/counselling' },
            { label: selectedSystem.shortName },
          ]
        : [{ label: 'Home', to: '/' }, { label: 'Counselling Hub' }],
    [selectedSystem]
  );

  const counsellingJsonLd = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://navigator.famral.com';
    if (selectedSystem) {
      const sysSchedules = schedules.filter(
        (s) => s.systemCode.toLowerCase() === selectedSystem.code.toLowerCase()
      );
      return buildCounsellingSystemJsonLd(selectedSystem, sysSchedules, origin);
    }
    if (!systemParam) {
      return buildCounsellingHubJsonLd(origin);
    }
    return undefined;
  }, [selectedSystem, systemParam, schedules]);

  usePageSeo({
    title: selectedSystem
      ? `${selectedSystem.shortName} Counselling Hub – Dates, Notices & Checklist | Famral Navigator`
      : systemParam
        ? 'Counselling System Not Found | Famral Navigator'
        : 'Counselling Hub – JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET | Famral Navigator',
    description: selectedSystem
      ? `${selectedSystem.name} (${selectedSystem.examName}): important dates, notices, quota rules, document checklist, and calendar export on Famral Navigator.`
      : 'Track JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET counselling timelines, notices, document checklists, and .ics calendar exports.',
    canonicalPath: selectedSystem ? `/counselling/${selectedSystem.code}` : '/counselling',
    ogType: selectedSystem ? 'article' : 'website',
    noIndex: Boolean(systemParam && !selectedSystem),
    breadcrumbs,
    jsonLd: counsellingJsonLd,
  });

  // System Detail View (/counselling/:system)
  if (systemParam) {
    if (!selectedSystem) {
      return (
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
            Counselling system not found
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            We could not find a counselling system matching &ldquo;{systemParam}&rdquo;. Browse available active and configured systems below.
          </p>
          <Link
            to="/counselling"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0B1F3A] rounded-md"
          >
            Back to Counselling Hub
          </Link>
        </div>
      );
    }

    const systemSchedules = schedules
      .filter((s) => s.systemCode.toLowerCase() === selectedSystem.code.toLowerCase())
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const systemNotices = notices
      .filter((n) => n.systemCode.toLowerCase() === selectedSystem.code.toLowerCase())
      .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
    const systemChecklists = contentItems.filter(
      (c) => c.kind === 'checklist' && c.systemCode.toLowerCase() === selectedSystem.code.toLowerCase()
    );
    const systemGuides = contentItems.filter(
      (c) => c.kind === 'guide' && c.systemCode.toLowerCase() === selectedSystem.code.toLowerCase()
    );
    const systemCutoffCount = cutoffs.filter(
      (c) => c.systemCode.toLowerCase() === selectedSystem.code.toLowerCase() && c.status === 'published'
    ).length;

    const isFollowing = tracking.followedSystems.includes(selectedSystem.code);
    const checkedCount = systemChecklists.filter((c) => tracking.checkedDocIds.includes(c.id)).length;
    const checklistPercent =
      systemChecklists.length > 0 ? Math.round((checkedCount / systemChecklists.length) * 100) : 0;
    const journeyCompletedCount = JOURNEY_STEPS.filter((s) =>
      tracking.journeySteps.includes(`${selectedSystem.code}:${s.id}`)
    ).length;
    const journeyPercent = Math.round((journeyCompletedCount / JOURNEY_STEPS.length) * 100);
    const hasDemoData =
      systemSchedules.some((s) => s.isDemo) ||
      systemNotices.some((n) => n.isDemo) ||
      systemChecklists.some((c) => c.isDemo);

    const participatingInstitutions = institutions
      .filter((i) => i.status === 'published' && i.systems.includes(selectedSystem.code))
      .slice(0, 8);

    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Breadcrumb */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="space-y-2 max-w-3xl">
              <div className="text-xs font-medium text-slate-500 flex flex-wrap items-center gap-2">
                <span>{selectedSystem.examName}</span>
                <span>·</span>
                <span>
                  {selectedSystem.status === 'active'
                    ? 'Active Counselling System'
                    : 'Configured System Template'}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums">{systemCutoffCount} published cutoff rows</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
                {selectedSystem.name}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedSystem.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => void toggleFollowSystem(selectedSystem.code)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border transition-colors ${
                  isFollowing
                    ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                    : 'bg-white text-[#0B1F3A] border-slate-300 hover:bg-slate-50'
                }`}
              >
                {isFollowing ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                {isFollowing ? 'Following Updates' : 'Follow System'}
              </button>

              {systemSchedules.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    exportSchedulesIcs(
                      systemSchedules,
                      `famral-navigator-${selectedSystem.code}-dates.ics`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0B1F3A] bg-white border border-slate-300 hover:bg-slate-50 rounded-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Calendar (.ics)
                </button>
              )}

              {isSafeHttpUrl(selectedSystem.officialPortalUrl) && (
                <a
                  href={selectedSystem.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md"
                >
                  Official Portal ({selectedSystem.officialPortalLabel})
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Rules Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
            <div>
              <div className="font-semibold text-[#0B1F3A] mb-1">Eligibility Summary</div>
              <p className="text-slate-600 leading-relaxed">{selectedSystem.eligibilitySummary}</p>
            </div>
            <div>
              <div className="font-semibold text-[#0B1F3A] mb-1">Quotas & Seat Pools</div>
              <p className="text-slate-600 leading-relaxed">
                Quotas: {selectedSystem.allowedQuotas.map((q) => q.code).join(', ')} · Seat Pools:{' '}
                {selectedSystem.allowedSeatPools.join(', ')}
              </p>
              <p className="text-slate-500 mt-1">
                Categories: {selectedSystem.allowedCategories.join(', ')} (+ PwD variants)
              </p>
            </div>
            <div>
              <div className="font-semibold text-[#0B1F3A] mb-1">Rank Comparison Rule</div>
              <p className="text-slate-600 leading-relaxed">
                {Object.values(selectedSystem.rankTypeByCategory).every((rt) => rt === 'CRL')
                  ? `${selectedSystem.shortName} evaluates all seat categories using General / Common Merit Rank (CRL).`
                  : 'OPEN compares against CRL; reserved categories (EWS, OBC-NCL, SC, ST, PwD) compare against matching Category Rank.'}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to={`/predictor/${selectedSystem.code}`}
                  className="text-[#1D4ED8] font-semibold hover:underline"
                >
                  Open {selectedSystem.shortName} Predictor →
                </Link>
                <Link
                  to={`/cutoffs/${selectedSystem.code}`}
                  className="text-[#1D4ED8] font-semibold hover:underline"
                >
                  Explore Cutoffs →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Honest Notification & Demo Banners */}
        <div className="space-y-3">
          {hasDemoData && <DemoDataNotice showHistoricalNote />}
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#1D4ED8] mt-0.5 shrink-0" />
            <div>
              <strong className="text-[#0B1F3A]">Alert delivery notice:</strong> Following a system
              records in-app alerts on your Dashboard whenever new data or notices are published
              here. External automated email/SMS reminders and live government portal syncing are
              not configured — export the <span className="font-mono">.ics</span> calendar file and
              always confirm final deadlines directly on{' '}
              <span className="font-medium text-[#0B1F3A]">{selectedSystem.officialPortalLabel}</span>.
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="border-b border-slate-200 flex flex-wrap gap-6 text-sm font-medium">
          {[
            { id: 'dates', label: `Important Dates (${systemSchedules.length})` },
            { id: 'notices', label: `Notices (${systemNotices.length})` },
            { id: 'checklist', label: `Document Checklist (${checkedCount}/${systemChecklists.length})` },
            { id: 'journey', label: `Journey Tracker (${journeyCompletedCount}/${JOURNEY_STEPS.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1D4ED8] text-[#0B1F3A] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-[#0B1F3A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Dates Timeline */}
        {activeTab === 'dates' && (
          <section className="space-y-4">
            {systemSchedules.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                  No published schedule dates yet for {selectedSystem.shortName}
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {selectedSystem.status === 'configured_template'
                    ? 'This system is configured and ready for Admin schedule & cutoff imports.'
                    : 'Check back once official academic-year dates are added by the Admin team, or verify on the official portal.'}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
                {systemSchedules.map((item) => {
                  const isSaved = tracking.savedScheduleIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono tabular-nums font-semibold text-[#0B1F3A]">
                            {item.startDate} to {item.endDate}
                          </span>
                          <span>·</span>
                          <span>{item.phase}</span>
                          <span>·</span>
                          <span>AY {item.academicYear}</span>
                          {item.isOutdated && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Past / verify current cycle
                              </span>
                            </>
                          )}
                          {item.isDemo && (
                            <>
                              <span>·</span>
                              <span className="text-amber-800 font-medium">
                                Demo data — not an official cutoff/schedule
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display text-base font-semibold text-[#0B1F3A]">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            {item.description}
                          </p>
                        )}
                        <div className="text-[11px] text-slate-500 pt-1">
                          Source: {item.sourceName} · Last verified: {item.verifiedAt}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void toggleSavedSchedule(item.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                            isSaved
                              ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                          {isSaved ? 'Saved' : 'Save Date'}
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSchedulesIcs([item], `${item.id}.ics`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md"
                        >
                          <Download className="w-3.5 h-3.5" />
                          .ics
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openReportModal({
                              entityType: 'schedule',
                              entityId: item.id,
                              entityLabel: `${selectedSystem.shortName} Schedule: ${item.title}`,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                          title="Report incorrect date"
                          aria-label={`Report incorrect date for ${item.title}`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Notices */}
        {activeTab === 'notices' && (
          <section className="space-y-4">
            {systemNotices.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
                <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                  No notices published for {selectedSystem.shortName} yet
                </h2>
                <p className="text-xs text-slate-600">
                  Admin-curated notices and advisories will appear here with verification dates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {systemNotices.map((notice) => (
                  <article
                    key={notice.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono tabular-nums">{notice.publishedDate}</span>
                        <span>·</span>
                        <span>AY {notice.academicYear}</span>
                        {notice.isOutdated && (
                          <>
                            <span>·</span>
                            <span className="text-amber-800 font-semibold">Outdated cycle</span>
                          </>
                        )}
                        {notice.isDemo && (
                          <>
                            <span>·</span>
                            <span className="text-amber-800 font-medium">Demo data</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openReportModal({
                            entityType: 'notice',
                            entityId: notice.id,
                            entityLabel: `Notice: ${notice.title}`,
                          })
                        }
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-[#0B1F3A]"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Report issue
                      </button>
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#0B1F3A]">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{notice.summary}</p>
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        Source: {notice.sourceName} · Verified: {notice.verifiedAt}
                      </span>
                      {isSafeHttpUrl(notice.sourceUrl) && (
                        <a
                          href={notice.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#1D4ED8] font-medium hover:underline"
                        >
                          Verify on official portal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Document Checklist */}
        {activeTab === 'checklist' && (
          <section className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                    {selectedSystem.shortName} Document Readiness Checklist
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tick off documents as you scan and verify them.{' '}
                    {!user && 'Sign in to save checklist progress to your account.'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono tabular-nums text-sm font-bold text-[#0B1F3A]">
                    {checkedCount}/{systemChecklists.length} ready ({checklistPercent}%)
                  </span>
                </div>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0D9488] transition-all duration-300"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              {systemChecklists.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  No document checklist items have been published for {selectedSystem.shortName} yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {systemChecklists.map((docItem) => {
                    const checked = tracking.checkedDocIds.includes(docItem.id);
                    return (
                      <li key={docItem.id} className="py-4 flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => void toggleCheckedDoc(docItem.id)}
                          className="mt-0.5 text-[#0D9488] hover:opacity-80 shrink-0"
                          aria-pressed={checked}
                          aria-label={`Mark ${docItem.title} as ${checked ? 'not ready' : 'ready'}`}
                        >
                          {checked ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                checked ? 'line-through text-slate-400' : 'text-[#0B1F3A]'
                              }`}
                            >
                              {docItem.title}
                            </span>
                            {docItem.category && (
                              <span className="text-xs text-slate-500">· {docItem.category}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">{docItem.body}</p>
                          <div className="text-[11px] text-slate-400">
                            Source: {docItem.sourceName} · Verified: {docItem.verifiedAt}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Tab 4: Counselling Journey Tracker */}
        {activeTab === 'journey' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                  {selectedSystem.shortName} Counselling Journey Tracker
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Personal step-by-step checklist from registration to institute reporting.
                </p>
              </div>
              <span className="font-mono tabular-nums text-sm font-bold text-[#0B1F3A]">
                {journeyCompletedCount}/{JOURNEY_STEPS.length} completed ({journeyPercent}%)
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D4ED8] transition-all duration-300"
                style={{ width: `${journeyPercent}%` }}
              />
            </div>

            <ol className="divide-y divide-slate-200">
              {JOURNEY_STEPS.map((step, idx) => {
                const key = `${selectedSystem.code}:${step.id}`;
                const done = tracking.journeySteps.includes(key);
                return (
                  <li key={step.id} className="py-3.5 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => void toggleJourneyStep(key)}
                      className="flex items-center gap-3 text-left flex-1"
                      aria-pressed={done}
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#1D4ED8] shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span className="font-mono tabular-nums text-xs text-slate-400 w-5">
                        0{idx + 1}
                      </span>
                      <span
                        className={`text-sm ${
                          done ? 'line-through text-slate-400' : 'text-[#0B1F3A] font-medium'
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>
                    <span className="text-xs text-slate-500">
                      {done ? 'Done' : 'Pending'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Process Guides for this System */}
        {systemGuides.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                {selectedSystem.shortName} Process Guides
              </h2>
              <Link to="/guides" className="text-xs font-semibold text-[#1D4ED8] hover:underline">
                View all guides & glossary →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemGuides.map((g) => (
                <div
                  key={g.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">{g.category || 'Process Guide'}</div>
                    <h3 className="font-display text-sm font-semibold text-[#0B1F3A]">
                      {g.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{g.summary}</p>
                  </div>
                  <Link
                    to={`/guides#${g.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:underline"
                  >
                    Read full guide <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Participating Colleges for this Counselling System (Internal Linking) */}
        {participatingInstitutions.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                  Participating {selectedSystem.shortName} Colleges
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explore college profiles, branch lists, and multi-year {selectedSystem.shortName} cutoffs without signing in.
                </p>
              </div>
              <Link
                to={`/cutoffs/${selectedSystem.code}/2025`}
                className="text-xs font-semibold text-[#1D4ED8] hover:underline"
              >
                Explore all {selectedSystem.shortName} cutoffs →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {participatingInstitutions.map((inst) => {
                const firstProg = programmes.find((p) => p.institutionId === inst.id);
                return (
                  <div
                    key={inst.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500">
                        {inst.type} · {inst.city}, {inst.state}
                      </div>
                      <Link
                        to={`/colleges/${inst.slug}`}
                        className="font-display text-sm font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] block leading-snug"
                      >
                        {inst.name}
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
                      <Link to={`/colleges/${inst.slug}`} className="text-[#0B1F3A] hover:text-[#1D4ED8]">
                        Profile →
                      </Link>
                      {firstProg && (
                        <Link
                          to={`/cutoffs/${inst.slug}/${firstProg.code.toLowerCase()}`}
                          className="text-[#1D4ED8] hover:underline"
                        >
                          {firstProg.code} Cutoffs →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Overview Page (/counselling)
  const activeSystems = COUNSELLING_SYSTEMS.filter((s) => s.status === 'active');
  const templateSystems = COUNSELLING_SYSTEMS.filter((s) => s.status === 'configured_template');

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
            Counselling Management Hub
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Follow counselling rounds, track important dates, export calendar reminders (.ics), and
            prepare verification documents — configured per counselling authority without mixing rules.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportSchedulesIcs(schedules, 'famral-navigator-all-counselling-dates.ics')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0B1F3A] bg-white border border-slate-300 hover:bg-slate-50 rounded-md"
          >
            <Download className="w-3.5 h-3.5" />
            Export All Dates (.ics)
          </button>
          <Link
            to="/guides"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#132C50] rounded-md"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Process Guides & Glossary
          </Link>
        </div>
      </div>

      <DemoDataNotice compact showHistoricalNote />

      {/* Active Systems */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
            Supported Counselling Systems ({activeSystems.length})
          </h2>
          <span className="text-xs text-slate-500">
            JoSAA · CSAB · REAP · MHT CET · WBJEE · KCET
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeSystems.map((sys) => {
            const isFollowing = tracking.followedSystems.includes(sys.code);
            const schedCount = schedules.filter((s) => s.systemCode === sys.code).length;
            const noticeCount = notices.filter((n) => n.systemCode === sys.code).length;
            const cutoffCount = cutoffs.filter(
              (c) => c.systemCode === sys.code && c.status === 'published'
            ).length;

            return (
              <div
                key={sys.code}
                className="app-panel rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1D4ED8]">{sys.examName}</span>
                    <button
                      type="button"
                      onClick={() => void toggleFollowSystem(sys.code)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                        isFollowing
                          ? 'bg-[#0B162C] text-white border-[#0B162C]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isFollowing ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#0B1F3A]">{sys.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{sys.description}</p>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums pt-1">
                    {cutoffCount} cutoffs · {schedCount} dates · {noticeCount} notices · Quotas:{' '}
                    {sys.allowedQuotas.map((q) => q.code).join(', ')}
                  </div>
                </div>

                <div className="space-y-2.5 pt-3.5 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <Link
                      to={`/predictor/${sys.code}`}
                      className="font-semibold text-[#1D4ED8] hover:underline"
                    >
                      Predictor →
                    </Link>
                    <Link
                      to={`/cutoffs/${sys.code}`}
                      className="font-semibold text-[#1D4ED8] hover:underline"
                    >
                      Cutoffs →
                    </Link>
                    <Link
                      to={`/counselling/${sys.code}`}
                      className="font-semibold text-[#0B1F3A] hover:text-[#1D4ED8] ml-auto inline-flex items-center gap-1"
                    >
                      Hub <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  {isSafeHttpUrl(sys.officialPortalUrl) && (
                    <a
                      href={sys.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#0B1F3A]"
                    >
                      {sys.officialPortalLabel} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {templateSystems.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
            Configured Multi-System Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateSystems.map((sys) => (
              <div key={sys.code} className="app-panel rounded-xl p-5 space-y-2">
                <h3 className="font-display text-base font-semibold text-[#0B1F3A]">{sys.name}</h3>
                <p className="text-xs text-slate-600">{sys.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Checklist Preview CTA */}
      <section className="app-panel rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckSquare className="w-5 h-5 text-[#0D9488] mt-0.5 shrink-0" />
          <div>
            <h2 className="font-display text-base font-bold text-[#0B1F3A]">
              Preparing for Counselling Document Verification?
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Open any counselling hub (JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE, or KCET) to track verification documents, important dates, and your step-by-step journey.
            </p>
          </div>
        </div>
        <Link
          to="/counselling/josaa"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B162C] hover:bg-[#132C50] rounded-lg shrink-0"
        >
          Open JoSAA Hub <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  );
};
