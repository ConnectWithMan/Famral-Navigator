import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  ListChecks,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { INDIAN_STATES_AND_UTS } from '../config/systems/registry.ts';
import { JOURNEY_STEPS } from '../data/demoSeed.ts';
import { SeatPool } from '../types/domain.ts';
import { usePageSeo } from '../lib/seo.ts';

export const DashboardPage: React.FC = () => {
  const {
    user,
    authLoading,
    profile,
    updateProfile,
    savedColleges,
    choiceLists,
    savedPredictions,
    schedules,
    tracking,
    notifications,
    myReports,
    toggleJourneyStep,
    markNotificationRead,
    exportMyAccountData,
    deleteMyAccount,
    t,
  } = useApp();

  usePageSeo({
    title: 'Student Dashboard',
    description: 'Your private Famral Navigator dashboard for saved predictions, colleges, deadlines, and counselling progress.',
    noIndex: true,
  });

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [homeState, setHomeState] = useState(profile?.homeState || 'Uttar Pradesh');
  const [category, setCategory] = useState(profile?.category || 'OPEN');
  const [gender, setGender] = useState<SeatPool>(profile?.gender || 'Gender-Neutral');
  const [isPwd, setIsPwd] = useState(Boolean(profile?.isPwd));
  const [crlRank, setCrlRank] = useState(profile?.crlRank ? String(profile.crlRank) : '');
  const [categoryRank, setCategoryRank] = useState(
    profile?.categoryRank ? String(profile.categoryRank) : ''
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setHomeState(profile.homeState || 'Uttar Pradesh');
      setCategory(profile.category || 'OPEN');
      setGender(profile.gender || 'Gender-Neutral');
      setIsPwd(Boolean(profile.isPwd));
      setCrlRank(profile.crlRank ? String(profile.crlRank) : '');
      setCategoryRank(profile.categoryRank ? String(profile.categoryRank) : '');
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Loading your workspace...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-display font-bold text-[#0B1F3A]">Student Dashboard</h1>
        <p className="text-sm text-slate-600">
          Sign in to access your saved exam profile, historical predictions, choice lists, and counselling checklist.
        </p>
        <Link
          to="/login"
          className="inline-flex px-5 py-2.5 rounded-md bg-[#0B1F3A] text-white text-sm font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || user.displayName || 'Student',
        homeState,
        category,
        gender,
        isPwd,
        crlRank: crlRank.trim() ? Number(crlRank) : null,
        categoryRank: categoryRank.trim() ? Number(categoryRank) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const savedDates = schedules.filter((s) => tracking.savedScheduleIds.includes(s.id));
  const journeyPct = Math.round((tracking.journeySteps.length / JOURNEY_STEPS.length) * 100);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] tracking-tight">
            Welcome back, {profile?.displayName || user.displayName || 'Student'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user.email} · Private student workspace
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/predictor"
            className="h-9 inline-flex items-center px-3.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors whitespace-nowrap"
          >
            Run Predictor
          </Link>
          <Link
            to="/choice-builder"
            className="h-9 inline-flex items-center px-3.5 rounded-lg border border-slate-200/90 bg-white text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Open Choice Builder
          </Link>
        </div>
      </div>

      {/* Unified Overview Metrics Bar */}
      <div className="app-panel rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200/80 overflow-hidden">
        <Link to="/saved-colleges" className="p-4 hover:bg-slate-50/80 transition-colors block">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Saved Colleges</span>
            <Bookmark className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <p className="text-2xl font-display font-bold text-[#0B1F3A] tabular-nums mt-1.5">
            {savedColleges.length}
          </p>
        </Link>

        <Link to="/choice-builder" className="p-4 hover:bg-slate-50/80 transition-colors block">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Choice Lists</span>
            <ListChecks className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-2xl font-display font-bold text-[#0B1F3A] tabular-nums mt-1.5">
            {choiceLists.length}
          </p>
        </Link>

        <Link to="/counselling" className="p-4 hover:bg-slate-50/80 transition-colors block">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Saved Deadlines</span>
            <Calendar className="w-4 h-4 text-[#0B1F3A]" />
          </div>
          <p className="text-2xl font-display font-bold text-[#0B1F3A] tabular-nums mt-1.5">
            {savedDates.length}
          </p>
        </Link>

        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Counselling Journey</span>
            <span className="font-mono font-semibold text-teal-700 tabular-nums">{journeyPct}%</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#0D9488] transition-all" style={{ width: `${journeyPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Exam Profile + Saved Predictions */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-display font-bold text-[#0B1F3A]">
              Student &amp; Exam Profile
            </h2>
            <p className="text-xs text-slate-500">
              Pre-fills your Predictor inputs and powers the My-Rank overlay on cutoff charts. Stored privately under your account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="block text-xs font-medium text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="prof-state" className="block text-xs font-medium text-slate-700 mb-1">
                  Home State (Class 12)
                </label>
                <select
                  id="prof-state"
                  value={homeState}
                  onChange={(e) => setHomeState(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {INDIAN_STATES_AND_UTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prof-cat" className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="prof-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {['OPEN', 'EWS', 'OBC-NCL', 'SC', 'ST'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prof-gender" className="block text-xs font-medium text-slate-700 mb-1">
                  Seat Pool
                </label>
                <select
                  id="prof-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as SeatPool)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Gender-Neutral">Gender-Neutral</option>
                  <option value="Female-only">Female-only</option>
                </select>
              </div>

              <div>
                <label htmlFor="prof-crl" className="block text-xs font-medium text-slate-700 mb-1">
                  JEE Main CRL Rank
                </label>
                <input
                  id="prof-crl"
                  type="number"
                  min={1}
                  value={crlRank}
                  onChange={(e) => setCrlRank(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="prof-catrank" className="block text-xs font-medium text-slate-700 mb-1">
                  Category Rank (if applicable)
                </label>
                <input
                  id="prof-catrank"
                  type="number"
                  min={1}
                  value={categoryRank}
                  onChange={(e) => setCategoryRank(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPwd}
                  onChange={(e) => setIsPwd(e.target.checked)}
                  className="rounded border-slate-300 text-[#1D4ED8]"
                />
                <span>PwD Candidate</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#132C50] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Saved Predictions */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-[#0B1F3A]">
                Saved Predictor Runs ({savedPredictions.length})
              </h2>
              <Link to="/predictor" className="text-xs font-semibold text-[#1D4ED8] hover:underline">
                New run →
              </Link>
            </div>

            {savedPredictions.length === 0 ? (
              <p className="text-xs text-slate-500">
                No saved predictions yet. Click "Save Run" after running the College Predictor.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {savedPredictions.map((p) => (
                  <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-[#0B1F3A]">
                        {p.systemCode.toUpperCase()} {p.academicYear} Round {p.roundNumber} · Rank{' '}
                        <span className="font-mono">{p.rank.toLocaleString('en-IN')}</span> ({p.rankType})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.category} · {p.gender} · {p.homeState}
                        {p.isDemo ? ' · Demo data' : ''}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-[11px] text-slate-700">
                      Within: <strong className="text-teal-700">{p.withinCount}</strong> · Near:{' '}
                      <strong className="text-[#1D4ED8]">{p.nearCount}</strong> · Beyond: {p.beyondCount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Journey Tracker, Notifications, Reports, Privacy Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Counselling Journey Tracker */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-bold text-[#0B1F3A]">
                Counselling Journey Tracker
              </h2>
              <span className="text-xs font-mono font-semibold text-teal-700">
                {tracking.journeySteps.length} / {JOURNEY_STEPS.length}
              </span>
            </div>
            <div className="space-y-2">
              {JOURNEY_STEPS.map((step) => {
                const done = tracking.journeySteps.includes(step.id);
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => void toggleJourneyStep(step.id)}
                    className="w-full flex items-center gap-2.5 text-left py-1.5 px-2 rounded hover:bg-slate-50 text-xs"
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={done ? 'line-through text-slate-400' : 'text-slate-700'}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
              <h2 className="text-sm font-display font-bold text-[#0B1F3A]">
                In-App Notifications
              </h2>
            </div>
            <p className="text-[11px] text-slate-500">{t('emailNotice')}</p>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500">
                Follow JoSAA or CSAB on the Counselling page to receive change alerts here.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 6).map((n) => (
                  <div key={n.id} className="py-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className={n.isRead ? 'text-slate-600 font-medium' : 'text-[#0B1F3A] font-semibold'}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => void markNotificationRead(n.id)}
                          className="text-[11px] text-[#1D4ED8] hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Submitted Data Reports */}
          {myReports.length > 0 && (
            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-2">
              <h2 className="text-sm font-display font-bold text-[#0B1F3A]">
                Your Data Error Reports ({myReports.length})
              </h2>
              <div className="divide-y divide-slate-100 text-xs">
                {myReports.slice(0, 5).map((r) => (
                  <div key={r.id} className="py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800 truncate">{r.entityLabel}</span>
                      <span className="font-mono text-[11px] text-slate-500 capitalize">{r.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{r.issueType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & Account Control */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#0B1F3A]">
              Privacy &amp; Data Control
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export a complete copy of your stored profile, choice lists, saved colleges, and predictions anytime, or permanently erase your account data.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportMyAccountData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 text-xs font-medium text-[#0B1F3A] hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" /> Download My Data (JSON)
              </button>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Account
                </button>
              ) : (
                <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 space-y-2 text-xs text-red-900">
                  <p className="font-semibold">Permanently erase all your saved data and account?</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void deleteMyAccount()}
                      className="px-3 py-1.5 rounded bg-red-700 text-white font-semibold"
                    >
                      Confirm Permanent Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded border border-red-300 bg-white text-red-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
