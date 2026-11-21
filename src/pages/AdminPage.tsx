import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  Download,
  RotateCcw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Bell,
  Flag,
  History,
  BarChart3,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { COUNSELLING_SYSTEMS, getSystemConfig, INDIAN_STATES_AND_UTS } from '../config/systems/registry.ts';
import { generateCsvTemplate, validateCutoffCsv } from '../engine/csvValidator.ts';
import {
  adminCommitCsvImport,
  adminResolveDataReport,
  adminRollbackImportBatch,
  adminSeedDemoCatalogToFirestore,
  adminUpsertCutoff,
  adminUpsertInstitution,
  adminUpsertNotice,
  adminUpsertSchedule,
  fetchAdminDashboardData,
  makeSafeId,
} from '../lib/firestoreService.ts';
import {
  SEED_CONTENT_ITEMS,
  SEED_CUTOFFS,
  SEED_INSTITUTIONS,
  SEED_NOTICES,
  SEED_PROGRAMMES,
  SEED_SCHEDULES,
} from '../data/demoSeed.ts';
import { triggerFileDownload } from '../lib/exporters.ts';
import {
  AuditLog,
  CsvValidationResult,
  DataReport,
  ImportLog,
  Institution,
  InstitutionType,
  NoticeItem,
  PublishStatus,
  ScheduleItem,
  UsageMetric,
  VerificationStatus,
} from '../types/domain.ts';
import { usePageSeo } from '../lib/seo.ts';

type AdminTab = 'overview' | 'import' | 'institutions' | 'cutoffs' | 'counselling' | 'reports' | 'audit';

export const AdminPage: React.FC = () => {
  const {
    user,
    authLoading,
    isAdmin,
    institutions,
    programmes,
    cutoffs,
    schedules,
    notices,
    catalogFromCloud,
    refreshCatalog,
    showToast,
  } = useApp();

  usePageSeo({
    title: 'Admin Console | Famral Navigator',
    description: 'Internal Famral Navigator administration, versioned CSV imports, and verification queue.',
    canonicalPath: '/admin',
    noIndex: true,
  });

  const [tab, setTab] = useState<AdminTab>('overview');
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [reports, setReports] = useState<DataReport[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
  const [seeding, setSeeding] = useState(false);

  // CSV Import State
  const [csvSystemCode, setCsvSystemCode] = useState('josaa');
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRawText, setCsvRawText] = useState('');
  const [csvValidation, setCsvValidation] = useState<CsvValidationResult | null>(null);
  const [csvBatchId, setCsvBatchId] = useState('');
  const [committingImport, setCommittingImport] = useState(false);

  // New Institution Form
  const [newInstName, setNewInstName] = useState('');
  const [newInstShort, setNewInstShort] = useState('');
  const [newInstType, setNewInstType] = useState<InstitutionType>('NIT');
  const [newInstState, setNewInstState] = useState('Uttar Pradesh');
  const [newInstCity, setNewInstCity] = useState('');
  const [newInstSource, setNewInstSource] = useState('Official JoSAA Participating Institutes List');
  const [newInstIsDemo, setNewInstIsDemo] = useState(false);

  // New Schedule / Notice Forms
  const [schedSystem, setSchedSystem] = useState('josaa');
  const [schedTitle, setSchedTitle] = useState('');
  const [schedPhase, setSchedPhase] = useState('Round 1');
  const [schedStart, setSchedStart] = useState('2026-06-15');
  const [schedEnd, setSchedEnd] = useState('2026-06-20');
  const [schedSource, setSchedSource] = useState('Official JoSAA Schedule');
  const [schedUrl, setSchedUrl] = useState('https://josaa.nic.in');

  const [noticeSystem, setNoticeSystem] = useState('josaa');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeSource, setNoticeSource] = useState('Official JoSAA Notice');
  const [noticeUrl, setNoticeUrl] = useState('https://josaa.nic.in');

  // Report Note Drafts
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [cutoffSearch, setCutoffSearch] = useState('');

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingAdminData(true);
    try {
      const data = await fetchAdminDashboardData();
      setReports(data.reports);
      setImportLogs(data.importLogs);
      setAuditLogs(data.auditLogs);
      setUsageMetrics(data.usageMetrics);
    } catch (err) {
      console.error('Admin data load failed:', err);
      showToast('Failed to load admin logs. Ensure Firestore rules are deployed.');
    } finally {
      setLoadingAdminData(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    if (isAdmin) {
      void loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  const metricTotals = useMemo(() => {
    return usageMetrics.reduce(
      (acc, m) => {
        acc[m.metricType] = (acc[m.metricType] ?? 0) + m.count;
        return acc;
      },
      { predictor_run: 0, cutoff_search: 0, college_view: 0 } as Record<string, number>
    );
  }, [usageMetrics]);

  const filteredCutoffs = useMemo(() => {
    const q = cutoffSearch.trim().toLowerCase();
    return cutoffs
      .filter((c) => {
        if (!q) return true;
        return (
          c.institutionName.toLowerCase().includes(q) ||
          c.programmeName.toLowerCase().includes(q) ||
          c.seatCategory.toLowerCase().includes(q) ||
          c.systemCode.toLowerCase().includes(q)
        );
      })
      .slice(0, 60);
  }, [cutoffs, cutoffSearch]);

  // Auth / RBAC Gate
  if (authLoading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-600">
        Verifying administrator permissions...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6 text-rose-700" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">403 — Access Denied</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          The Famral Navigator Admin Console is strictly role-gated. Both the UI and Firestore
          security rules block non-admin accounts from accessing administrative datasets, imports,
          or audit logs.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {!user ? (
            <Link
              to="/login"
              state={{ from: '/admin' }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-md"
            >
              Sign in with Admin Account
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-md"
            >
              Return to Student Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  const actor = { uid: user.uid, email: user.email ?? 'admin@navigator.famral.com' };

  const handleSeedDemoCatalog = async () => {
    setSeeding(true);
    try {
      const count = await adminSeedDemoCatalogToFirestore({
        institutions: SEED_INSTITUTIONS,
        programmes: SEED_PROGRAMMES,
        cutoffs: SEED_CUTOFFS,
        schedules: SEED_SCHEDULES,
        notices: SEED_NOTICES,
        contentItems: SEED_CONTENT_ITEMS,
        actor,
      });
      showToast(`Seeded ${count} demo documents into Firestore.`);
      await refreshCatalog();
      await loadAdminData();
    } catch (err) {
      console.error(err);
      showToast('Failed to seed demo catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadTemplate = () => {
    const sys = getSystemConfig(csvSystemCode);
    if (!sys) return;
    const csv = generateCsvTemplate(sys);
    triggerFileDownload(csv, `famral-navigator-${sys.code}-cutoffs-template.csv`, 'text/csv;charset=utf-8;');
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please upload a .csv file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast('CSV file exceeds 4 MB safety limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCsvFileName(file.name);
      setCsvRawText(text);
      runValidation(text, csvSystemCode);
    };
    reader.readAsText(file);
  };

  const runValidation = (text: string, sysCode: string) => {
    const sys = getSystemConfig(sysCode);
    if (!sys) return;
    const batchId = makeSafeId('batch');
    setCsvBatchId(batchId);
    const res = validateCutoffCsv(text, sys, institutions, programmes, batchId);
    setCsvValidation(res);
  };

  const handleCommitCsv = async () => {
    if (!csvValidation || !csvValidation.valid || csvValidation.validRows.length === 0) return;
    setCommittingImport(true);
    try {
      const academicYear = csvValidation.validRows[0].academicYear;
      const result = await adminCommitCsvImport({
        rows: csvValidation.validRows,
        existingCutoffs: cutoffs,
        batchId: csvBatchId,
        fileName: csvFileName || `${csvSystemCode}-manual-upload.csv`,
        systemCode: csvSystemCode,
        academicYear,
        actor,
      });
      showToast(
        `Imported ${result.insertedCount} cutoffs (${result.archivedCount} superseded records archived).`
      );
      setCsvValidation(null);
      setCsvRawText('');
      setCsvFileName('');
      await refreshCatalog();
      await loadAdminData();
    } catch (err) {
      console.error(err);
      showToast('Import failed. Check Firestore connection and try again.');
    } finally {
      setCommittingImport(false);
    }
  };

  const handleRollbackBatch = async (log: ImportLog) => {
    try {
      const archived = await adminRollbackImportBatch(log, actor);
      showToast(`Rolled back batch ${log.batchId} (${archived} records archived).`);
      await refreshCatalog();
      await loadAdminData();
    } catch (err) {
      console.error(err);
      showToast('Rollback failed.');
    }
  };

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim() || !newInstShort.trim() || !newInstCity.trim()) {
      showToast('Institution name, short name, and city are required.');
      return;
    }
    const slug = newInstShort
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const inst: Institution = {
      id: makeSafeId('inst'),
      slug: slug || makeSafeId('college'),
      name: newInstName.trim(),
      shortName: newInstShort.trim(),
      type: newInstType,
      state: newInstState,
      city: newInstCity.trim(),
      systems: ['josaa', 'csab'],
      feeRangeNote: 'Not available — verify on official institute portal',
      sourceName: newInstSource.trim() || 'Admin Entry',
      academicYear: 2025,
      isDemo: newInstIsDemo,
      status: 'published',
      verificationStatus: newInstIsDemo ? 'unverified' : 'verified',
      verifiedAt: new Date().toISOString().slice(0, 10),
    };
    await adminUpsertInstitution(inst, actor);
    setNewInstName('');
    setNewInstShort('');
    setNewInstCity('');
    showToast(`Added ${inst.shortName} to Firestore.`);
    await refreshCatalog();
    await loadAdminData();
  };

  const handleUpdateInstStatus = async (
    inst: Institution,
    status: PublishStatus,
    verificationStatus: VerificationStatus
  ) => {
    await adminUpsertInstitution(
      { ...inst, status, verificationStatus, verifiedAt: new Date().toISOString().slice(0, 10) },
      actor
    );
    showToast(`Updated ${inst.shortName} (${status} / ${verificationStatus}).`);
    await refreshCatalog();
    await loadAdminData();
  };

  const handleUpdateCutoffStatus = async (
    c: (typeof cutoffs)[number],
    status: PublishStatus,
    verificationStatus: VerificationStatus
  ) => {
    await adminUpsertCutoff(
      { ...c, status, verificationStatus, verifiedAt: new Date().toISOString().slice(0, 10) },
      actor
    );
    showToast(`Updated cutoff status to ${status}.`);
    await refreshCatalog();
    await loadAdminData();
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle.trim()) return;
    const item: ScheduleItem = {
      id: makeSafeId('sched'),
      systemCode: schedSystem,
      academicYear: Number(schedStart.slice(0, 4)) || 2026,
      title: schedTitle.trim(),
      phase: schedPhase.trim() || 'Counselling Phase',
      startDate: schedStart,
      endDate: schedEnd,
      description: `Admin-verified schedule entry for ${schedSystem.toUpperCase()}.`,
      sourceName: schedSource.trim() || 'Official Portal',
      sourceUrl: schedUrl.trim(),
      isOutdated: false,
      isDemo: false,
      verifiedAt: new Date().toISOString().slice(0, 10),
    };
    await adminUpsertSchedule(item, actor);
    setSchedTitle('');
    showToast('Schedule date saved.');
    await refreshCatalog();
    await loadAdminData();
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeSummary.trim()) return;
    const item: NoticeItem = {
      id: makeSafeId('notice'),
      systemCode: noticeSystem,
      academicYear: new Date().getFullYear(),
      title: noticeTitle.trim(),
      summary: noticeSummary.trim(),
      publishedDate: new Date().toISOString().slice(0, 10),
      sourceName: noticeSource.trim() || 'Official Notice',
      sourceUrl: noticeUrl.trim(),
      isOutdated: false,
      isDemo: false,
      verifiedAt: new Date().toISOString().slice(0, 10),
    };
    await adminUpsertNotice(item, actor);
    setNoticeTitle('');
    setNoticeSummary('');
    showToast('Notice published.');
    await refreshCatalog();
    await loadAdminData();
  };

  const handleResolveReport = async (rep: DataReport, status: DataReport['status']) => {
    await adminResolveDataReport(rep.id, status, reportNotes[rep.id] ?? '', actor);
    showToast(`Marked report as ${status}.`);
    await loadAdminData();
  };

  const openReportsCount = reports.filter((r) => r.status === 'open').length;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488]">
            <ShieldCheck className="w-4 h-4" />
            Admin Authenticated · {user.email}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] mt-1">
            Famral Navigator Admin Console
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={seeding}
            onClick={() => void handleSeedDemoCatalog()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#132C50] disabled:opacity-60 rounded-md"
          >
            <Database className="w-3.5 h-3.5" />
            {seeding ? 'Seeding Firestore...' : 'Seed Demo Catalog to Firestore'}
          </button>
          <button
            type="button"
            onClick={() => {
              void refreshCatalog();
              void loadAdminData();
            }}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-5 text-xs sm:text-sm font-medium">
        {[
          { id: 'overview', label: 'Overview & Analytics', icon: BarChart3 },
          { id: 'import', label: 'CSV Import Pipeline', icon: Upload },
          { id: 'institutions', label: `Colleges (${institutions.length})`, icon: Building2 },
          { id: 'cutoffs', label: `Cutoffs & Verification (${cutoffs.length})`, icon: CheckCircle2 },
          { id: 'counselling', label: 'Dates & Notices', icon: Calendar },
          { id: 'reports', label: `Error Reports (${openReportsCount} open)`, icon: Flag },
          { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: History },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as AdminTab)}
              className={`pb-3 border-b-2 inline-flex items-center gap-1.5 transition-colors ${
                tab === item.id
                  ? 'border-[#1D4ED8] text-[#0B1F3A] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-[#0B1F3A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview & Privacy-Conscious Aggregate Analytics */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Catalog Persistence</div>
              <div className="font-display text-lg font-bold text-[#0B1F3A] mt-1">
                {catalogFromCloud ? 'Synced with Firestore' : 'Local Demo Seed (Unseeded)'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Click &ldquo;Seed Demo Catalog to Firestore&rdquo; to populate cloud collections.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Published Cutoffs</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[#0B1F3A] mt-1">
                {cutoffs.filter((c) => c.status === 'published').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {cutoffs.filter((c) => !c.isDemo).length} official · {cutoffs.filter((c) => c.isDemo).length} demo
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Open Data Error Reports</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[#0B1F3A] mt-1">
                {openReportsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {reports.length} total submissions
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">CSV Import Batches</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[#0B1F3A] mt-1">
                {importLogs.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Versioned & rollback-ready
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                  Privacy-Conscious Aggregate Usage Metrics
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aggregate daily event counters only — no personal student ranks, emails, or identities are tracked here.
                </p>
              </div>
              {loadingAdminData && <span className="text-xs text-slate-400">Loading...</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Predictor Runs</div>
                <div className="font-mono tabular-nums text-xl font-bold text-[#0B1F3A] mt-1">
                  {metricTotals.predictor_run}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Cutoff Explorer Searches</div>
                <div className="font-mono tabular-nums text-xl font-bold text-[#0B1F3A] mt-1">
                  {metricTotals.cutoff_search}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">College Profile Views</div>
                <div className="font-mono tabular-nums text-xl font-bold text-[#0B1F3A] mt-1">
                  {metricTotals.college_view}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Multi-Step CSV Import Pipeline */}
      {tab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                Versioned Cutoff CSV Import Pipeline
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Every upload passes required-column checks, rank-type guard validation, institute/programme lookup, and duplicate composite-key detection. If any row has an error, nothing is imported. Published rows matching an imported key are archived — never overwritten.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="csv-system" className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                  1. Target Counselling System
                </label>
                <select
                  id="csv-system"
                  value={csvSystemCode}
                  onChange={(e) => {
                    setCsvSystemCode(e.target.value);
                    if (csvRawText) runValidation(csvRawText, e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white"
                >
                  {COUNSELLING_SYSTEMS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.shortName} ({s.status === 'active' ? 'Active' : 'Template'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                  2. Download Template
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#0B1F3A] bg-white border border-slate-300 hover:bg-slate-50 rounded-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download {csvSystemCode.toUpperCase()} CSV Template
                </button>
              </div>

              <div>
                <label htmlFor="csv-upload" className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                  3. Upload CSV File (.csv, max 4 MB)
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:text-xs file:font-semibold file:text-[#0B1F3A]"
                />
              </div>
            </div>

            {/* Paste CSV Option for rapid testing */}
            <div>
              <label htmlFor="csv-paste" className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                Or paste CSV rows directly to validate
              </label>
              <textarea
                id="csv-paste"
                rows={4}
                value={csvRawText}
                onChange={(e) => {
                  setCsvRawText(e.target.value);
                  if (!csvFileName) setCsvFileName(`${csvSystemCode}-pasted.csv`);
                }}
                placeholder="Paste header and CSV rows matching the downloaded template..."
                className="w-full font-mono text-xs p-3 border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8]"
              />
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => runValidation(csvRawText, csvSystemCode)}
                  disabled={!csvRawText.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 rounded-md"
                >
                  Validate & Preview CSV
                </button>
              </div>
            </div>

            {/* Validation Report & Preview */}
            {csvValidation && (
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div
                  className={`p-4 rounded-lg border text-xs flex items-start gap-2.5 ${
                    csvValidation.valid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  {csvValidation.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {csvValidation.valid
                        ? `Validation passed: ${csvValidation.validRows.length} rows ready to import (Batch ID: ${csvBatchId}).`
                        : `Validation failed: ${csvValidation.rowErrors.length} error(s) found across ${csvValidation.totalDataRows} rows. Nothing will be imported until errors are fixed.`}
                    </div>
                    {csvValidation.missingColumns.length > 0 && (
                      <div>Missing columns: {csvValidation.missingColumns.join(', ')}</div>
                    )}
                  </div>
                </div>

                {csvValidation.rowErrors.length > 0 && (
                  <div className="overflow-x-auto border border-rose-200 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-rose-50 text-rose-900">
                        <tr>
                          <th className="px-3 py-2">Row #</th>
                          <th className="px-3 py-2">Column</th>
                          <th className="px-3 py-2">Validation Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 bg-white">
                        {csvValidation.rowErrors.slice(0, 50).map((err, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono tabular-nums">{err.rowNumber}</td>
                            <td className="px-3 py-2 font-mono">{err.column}</td>
                            <td className="px-3 py-2 text-rose-800">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {csvValidation.valid && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2">Institute</th>
                            <th className="px-3 py-2">Programme</th>
                            <th className="px-3 py-2">Year / Round</th>
                            <th className="px-3 py-2">Quota / Category / Pool</th>
                            <th className="px-3 py-2">Rank Type</th>
                            <th className="px-3 py-2 text-right">Opening – Closing</th>
                            <th className="px-3 py-2">Label</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {csvValidation.validRows.slice(0, 15).map((r) => (
                            <tr key={r.id}>
                              <td className="px-3 py-2 font-medium text-[#0B1F3A]">{r.institutionName}</td>
                              <td className="px-3 py-2">{r.programmeName}</td>
                              <td className="px-3 py-2 font-mono tabular-nums">
                                {r.academicYear} · {r.roundLabel}
                              </td>
                              <td className="px-3 py-2">
                                {r.quota} · {r.seatCategory} · {r.seatPool}
                              </td>
                              <td className="px-3 py-2 font-mono">{r.rankType}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">
                                {r.openingRank.toLocaleString()} – {r.closingRank.toLocaleString()}
                              </td>
                              <td className="px-3 py-2">
                                {r.isDemo ? 'Demo data' : 'Official verified'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      disabled={committingImport}
                      onClick={() => void handleCommitCsv()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-md"
                    >
                      <Upload className="w-4 h-4" />
                      {committingImport
                        ? 'Committing Batch to Firestore...'
                        : `Confirm & Publish ${csvValidation.validRows.length} Cutoffs`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Import History & Rollback */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-[#0B1F3A]">
              Import History & Batch Rollback
            </h3>
            {importLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No CSV import batches have been committed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Batch ID</th>
                      <th className="py-2 pr-3">File / System</th>
                      <th className="py-2 pr-3">Inserted / Archived</th>
                      <th className="py-2 pr-3">Imported By</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 pr-3 font-mono">{log.batchId}</td>
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-[#0B1F3A]">{log.fileName}</div>
                          <div className="text-[11px] text-slate-500">
                            {log.systemCode.toUpperCase()} · AY {log.academicYear}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 font-mono tabular-nums">
                          +{log.insertedCount} / {log.archivedCount} archived
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">{log.importedByEmail}</td>
                        <td className="py-2.5 pr-3 font-medium">
                          {log.status === 'completed' ? (
                            <span className="text-emerald-700">Published</span>
                          ) : (
                            <span className="text-amber-700">Rolled Back</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {log.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => void handleRollbackBatch(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-md"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Rollback
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Institutions CRUD & Verification */}
      {tab === 'institutions' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateInstitution}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-[#0B1F3A] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#1D4ED8]" /> Add Participating Institution
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={newInstName}
                onChange={(e) => setNewInstName(e.target.value)}
                placeholder="Full official institute name"
                className="px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
              <input
                type="text"
                required
                value={newInstShort}
                onChange={(e) => setNewInstShort(e.target.value)}
                placeholder="Short name (e.g., NIT Rourkela)"
                className="px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
              <select
                value={newInstType}
                onChange={(e) => setNewInstType(e.target.value as InstitutionType)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white"
              >
                {['IIT', 'NIT', 'IIIT', 'GFTI', 'State University', 'Central University'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={newInstState}
                onChange={(e) => setNewInstState(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white"
              >
                {INDIAN_STATES_AND_UTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={newInstCity}
                onChange={(e) => setNewInstCity(e.target.value)}
                placeholder="City"
                className="px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
              <input
                type="text"
                value={newInstSource}
                onChange={(e) => setNewInstSource(e.target.value)}
                placeholder="Source name"
                className="px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={newInstIsDemo}
                  onChange={(e) => setNewInstIsDemo(e.target.checked)}
                />
                Flag record as Demo data (isDemo = true)
              </label>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md"
              >
                Save Institution
              </button>
            </div>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Type / State</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {institutions.map((inst) => (
                  <tr key={inst.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0B1F3A]">{inst.name}</div>
                      <div className="text-[11px] text-slate-500">
                        slug: {inst.slug} · {inst.isDemo ? 'Demo' : 'Official'} · Verified: {inst.verifiedAt}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {inst.type} · {inst.city}, {inst.state}
                    </td>
                    <td className="px-4 py-3 font-medium">{inst.status}</td>
                    <td className="px-4 py-3">{inst.verificationStatus}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          void handleUpdateInstStatus(
                            inst,
                            inst.status === 'published' ? 'draft' : 'published',
                            inst.verificationStatus
                          )
                        }
                        className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50"
                      >
                        {inst.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleUpdateInstStatus(
                            inst,
                            inst.status,
                            inst.verificationStatus === 'verified' ? 'outdated' : 'verified'
                          )
                        }
                        className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50"
                      >
                        {inst.verificationStatus === 'verified' ? 'Mark Outdated' : 'Mark Verified'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Cutoffs & Verification Queue */}
      {tab === 'cutoffs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                Cutoffs Verification & Publish Controls
              </h2>
              <p className="text-xs text-slate-600">
                Showing up to 60 matching rows. Archive superseded cutoffs instead of deleting history.
              </p>
            </div>
            <input
              type="search"
              value={cutoffSearch}
              onChange={(e) => setCutoffSearch(e.target.value)}
              placeholder="Filter by institute, branch, category..."
              className="px-3 py-2 text-xs border border-slate-200 rounded-md w-full sm:w-72"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Institute & Programme</th>
                  <th className="px-3 py-2">System / Year / Round</th>
                  <th className="px-3 py-2">Quota / Category / Rank Type</th>
                  <th className="px-3 py-2 text-right">OR – CR</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCutoffs.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[#0B1F3A]">{c.institutionName}</div>
                      <div className="text-[11px] text-slate-500">{c.programmeName}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">
                      {c.systemCode.toUpperCase()} · {c.academicYear} · {c.roundLabel}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.quota} · {c.seatCategory} · {c.seatPool} ({c.rankType})
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {c.openingRank.toLocaleString()} – {c.closingRank.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.status} · {c.verificationStatus}
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          void handleUpdateCutoffStatus(
                            c,
                            c.status === 'published' ? 'archived' : 'published',
                            c.verificationStatus
                          )
                        }
                        className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                      >
                        {c.status === 'published' ? 'Archive' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleUpdateCutoffStatus(
                            c,
                            c.status,
                            c.verificationStatus === 'verified' ? 'outdated' : 'verified'
                          )
                        }
                        className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                      >
                        {c.verificationStatus === 'verified' ? 'Outdated' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Counselling Schedules & Notices */}
      {tab === 'counselling' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleAddSchedule}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1F3A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1D4ED8]" /> Publish Counselling Schedule Date
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={schedSystem}
                onChange={(e) => setSchedSystem(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white"
              >
                {COUNSELLING_SYSTEMS.map((s) => (
                  <option key={s.code} value={s.code}>{s.shortName}</option>
                ))}
              </select>
              <input
                type="text"
                value={schedPhase}
                onChange={(e) => setSchedPhase(e.target.value)}
                placeholder="Phase (e.g., Round 1)"
                className="px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </div>
            <input
              type="text"
              required
              value={schedTitle}
              onChange={(e) => setSchedTitle(e.target.value)}
              placeholder="Schedule milestone title"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={schedStart}
                onChange={(e) => setSchedStart(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
              <input
                type="date"
                value={schedEnd}
                onChange={(e) => setSchedEnd(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </div>
            <input
              type="text"
              value={schedSource}
              onChange={(e) => setSchedSource(e.target.value)}
              placeholder="Source name"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
            <input
              type="url"
              value={schedUrl}
              onChange={(e) => setSchedUrl(e.target.value)}
              placeholder="Official source URL (https://...)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-md"
            >
              Publish Schedule Entry ({schedules.length} active)
            </button>
          </form>

          <form
            onSubmit={handleAddNotice}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1F3A] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1D4ED8]" /> Publish Official Notice Summary
            </h2>
            <select
              value={noticeSystem}
              onChange={(e) => setNoticeSystem(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white"
            >
              {COUNSELLING_SYSTEMS.map((s) => (
                <option key={s.code} value={s.code}>{s.shortName}</option>
              ))}
            </select>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="Notice headline"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
            <textarea
              rows={3}
              required
              value={noticeSummary}
              onChange={(e) => setNoticeSummary(e.target.value)}
              placeholder="Plain-language summary of the official notice..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
            <input
              type="text"
              value={noticeSource}
              onChange={(e) => setNoticeSource(e.target.value)}
              placeholder="Source name"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
            <input
              type="url"
              value={noticeUrl}
              onChange={(e) => setNoticeUrl(e.target.value)}
              placeholder="Official portal URL (https://...)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-md"
            >
              Publish Notice ({notices.length} active)
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: Error Reports Inbox */}
      {tab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">
            Student Data Error Reports Inbox
          </h2>
          {reports.length === 0 ? (
            <p className="text-xs text-slate-500">No student error reports submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {reports.map((rep) => (
                <div key={rep.id} className="py-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-semibold text-[#0B1F3A]">
                      {rep.entityLabel} · <span className="text-slate-500">{rep.issueType}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      Status: {rep.status} · {rep.createdAt?.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{rep.details}</p>
                  <div className="text-[11px] text-slate-500">
                    Submitted by: {rep.reporterEmail || rep.reporterUid}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={reportNotes[rep.id] ?? rep.adminNote ?? ''}
                      onChange={(e) =>
                        setReportNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                      }
                      placeholder="Add resolution note..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                    <div className="flex items-center gap-1.5">
                      {(['reviewed', 'resolved', 'dismissed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => void handleResolveReport(rep, st)}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-200 hover:bg-slate-50 rounded-md capitalize"
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: Audit Log */}
      {tab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">
            Admin Audit Log
          </h2>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500">No admin actions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Timestamp</th>
                    <th className="py-2 pr-3">Admin</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {a.createdAt?.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-2 pr-3 text-slate-700">{a.actorEmail}</td>
                      <td className="py-2 pr-3 font-mono font-medium text-[#0B1F3A]">{a.action}</td>
                      <td className="py-2 text-slate-600">{a.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
