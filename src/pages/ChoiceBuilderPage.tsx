import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  GripVertical,
  History,
  Info,
  ListChecks,
  Plus,
  Printer,
  Redo2,
  Search,
  Share2,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { COUNSELLING_SYSTEMS, getLatestRoundNumber, getSystemConfig } from '../config/systems/registry.ts';
import { analyzeChoiceList } from '../engine/analytics.ts';
import { ChoiceList, ChoiceListItem, ChoicePriorityTag } from '../types/domain.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { exportChoiceListCsv } from '../lib/exporters.ts';
import { usePageSeo } from '../lib/seo.ts';

export const ChoiceBuilderPage: React.FC = () => {
  const {
    user,
    profile,
    choiceLists,
    cutoffs,
    createChoiceList,
    saveChoiceList,
    removeChoiceList,
    toggleChoiceListShare,
    showToast,
    t,
  } = useApp();

  usePageSeo({
    title: 'Choice Builder – Counselling Preference Planner',
    description:
      'Build, reorder, tag, analyze, export, and share your JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET preference lists while retaining full manual order control.',
    noIndex: true,
  });

  const [activeListId, setActiveListId] = useState<string>('');
  const [newListTitle, setNewListTitle] = useState('');
  const [newListSystem, setNewListSystem] = useState<string>('josaa');
  const [renamingTitle, setRenamingTitle] = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState('');
  const [viewMode, setViewMode] = useState<'order' | 'branch' | 'college'>('order');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [undoStack, setUndoStack] = useState<ChoiceListItem[][]>([]);
  const [redoStack, setRedoStack] = useState<ChoiceListItem[][]>([]);

  const activeList: ChoiceList | undefined = useMemo(
    () => choiceLists.find((l) => l.id === activeListId) ?? choiceLists[0],
    [choiceLists, activeListId]
  );

  const predominantRankType = activeList?.items[0]?.rankType ?? 'CRL';
  const studentRankForAnalyzer =
    predominantRankType === 'CRL' ? profile?.crlRank : profile?.categoryRank;

  const analysis = useMemo(
    () =>
      activeList
        ? analyzeChoiceList(activeList.items, studentRankForAnalyzer, predominantRankType)
        : null,
    [activeList, studentRankForAnalyzer, predominantRankType]
  );

  const activeSystemConfig = useMemo(
    () => getSystemConfig(activeList?.systemCode || 'josaa') ?? COUNSELLING_SYSTEMS[0],
    [activeList?.systemCode]
  );

  const searchResults = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    const targetSysCode = activeSystemConfig.code.toLowerCase();
    const latestRound = getLatestRoundNumber(activeSystemConfig);
    return cutoffs
      .filter(
        (c) =>
          c.status === 'published' &&
          c.systemCode.toLowerCase() === targetSysCode &&
          c.academicYear === 2025 &&
          c.roundNumber === latestRound &&
          (c.institutionName.toLowerCase().includes(q) ||
            c.programmeName.toLowerCase().includes(q) ||
            c.state.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [addSearch, cutoffs, activeSystemConfig]);

  const commitItems = async (nextItems: ChoiceListItem[], summary: string, recordUndo = true) => {
    if (!activeList) return;
    if (recordUndo) {
      setUndoStack((prev) => [activeList.items, ...prev].slice(0, 20));
      setRedoStack([]);
    }
    await saveChoiceList({ ...activeList, items: nextItems }, summary);
  };

  const handleMove = async (index: number, delta: -1 | 1) => {
    if (!activeList) return;
    const target = index + delta;
    if (target < 0 || target >= activeList.items.length) return;
    const next = [...activeList.items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    await commitItems(next, `Moved "${moved.institutionName}" to #${target + 1}`);
  };

  const handleDrop = async (dropIdx: number) => {
    if (dragIndex == null || !activeList || dragIndex === dropIdx) {
      setDragIndex(null);
      return;
    }
    const next = [...activeList.items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIdx, 0, moved);
    setDragIndex(null);
    await commitItems(next, `Reordered "${moved.institutionName}" to #${dropIdx + 1}`);
  };

  const handleUndo = async () => {
    if (!activeList || undoStack.length === 0) return;
    const [prevItems, ...rest] = undoStack;
    setRedoStack((r) => [activeList.items, ...r].slice(0, 20));
    setUndoStack(rest);
    await saveChoiceList({ ...activeList, items: prevItems }, 'Undo previous change');
    showToast('Undid last change');
  };

  const handleRedo = async () => {
    if (!activeList || redoStack.length === 0) return;
    const [nextItems, ...rest] = redoStack;
    setUndoStack((u) => [activeList.items, ...u].slice(0, 20));
    setRedoStack(rest);
    await saveChoiceList({ ...activeList, items: nextItems }, 'Redo change');
    showToast('Redid change');
  };

  const handleTagChange = async (idx: number, tag: ChoicePriorityTag) => {
    if (!activeList) return;
    const next = activeList.items.map((it, i) => (i === idx ? { ...it, tag } : it));
    await commitItems(next, `Tagged #${idx + 1} as ${tag}`);
  };

  const handleNoteChange = async (idx: number, notes: string) => {
    if (!activeList) return;
    const next = activeList.items.map((it, i) => (i === idx ? { ...it, notes } : it));
    await saveChoiceList({ ...activeList, items: next });
  };

  const handleRemoveItem = async (idx: number) => {
    if (!activeList) return;
    const removed = activeList.items[idx];
    const next = activeList.items.filter((_, i) => i !== idx);
    await commitItems(next, `Removed "${removed.institutionName} — ${removed.programmeName}"`);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const sysCfg = getSystemConfig(newListSystem) ?? COUNSELLING_SYSTEMS[0];
    const created = await createChoiceList(
      newListTitle.trim() || `${sysCfg.shortName} Plan #${choiceLists.length + 1}`,
      sysCfg.code,
      sysCfg.availableYears[0] ?? 2025,
      []
    );
    setActiveListId(created.id);
    setNewListTitle('');
  };

  const handleDuplicateList = async () => {
    if (!activeList) return;
    const dup = await createChoiceList(
      `${activeList.title} (Copy)`,
      activeList.systemCode,
      activeList.academicYear,
      activeList.items
    );
    setActiveListId(dup.id);
  };

  const handleRenameSubmit = async () => {
    if (!activeList || renamingTitle == null) return;
    const clean = renamingTitle.trim();
    if (clean) {
      await saveChoiceList({ ...activeList, title: clean });
      showToast('List renamed');
    }
    setRenamingTitle(null);
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="app-panel rounded-xl p-8 text-center space-y-4">
          <span className="w-10 h-10 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center mx-auto">
            <ListChecks className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-display font-bold text-[#0B1F3A]">Choice List Builder</h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Sign in to create multiple counselling preference lists, reorder choices manually with undo/redo history, inspect Dream/Target/Safer balance, and access lists offline.
          </p>
          <Link
            to="/login"
            className="inline-flex px-5 py-2.5 rounded-lg bg-[#0B162C] hover:bg-[#132C50] text-white text-xs font-semibold transition-colors"
          >
            Sign in to open Choice Builder
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl =
    activeList?.shareEnabled && activeList.shareToken
      ? `${window.location.origin}/shared/${activeList.shareToken}`
      : null;

  const groupedItems = useMemo(() => {
    if (!activeList || viewMode === 'order') return null;
    const map = new Map<string, { originalIndex: number; item: ChoiceListItem }[]>();
    activeList.items.forEach((item, originalIndex) => {
      const key = viewMode === 'branch' ? item.branchGroup : item.institutionName;
      const arr = map.get(key) ?? [];
      arr.push({ originalIndex, item });
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [activeList, viewMode]);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
      {/* Compact Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] tracking-tight">
            Counselling Choice List Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            You control the exact preference order — Famral Navigator never auto-sorts your choices.
          </p>
        </div>

        <form onSubmit={handleCreateList} className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <select
            aria-label="Counselling system for new list"
            value={newListSystem}
            onChange={(e) => setNewListSystem(e.target.value)}
            className="h-9 rounded-lg border border-slate-300/90 bg-white px-2.5 text-xs font-medium text-[#0B1F3A]"
          >
            {COUNSELLING_SYSTEMS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.shortName}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="New preference list title..."
            className="h-9 rounded-lg border border-slate-300/90 bg-white px-3 text-xs w-48"
          />
          <button
            type="submit"
            className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] active:scale-[0.99] transition-all whitespace-nowrap shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> New List
          </button>
        </form>
      </div>

      {/* Planning Tool Notice */}
      <div
        role="note"
        className="rounded-lg border border-blue-200/90 bg-blue-50/60 px-3.5 py-2.5 text-xs text-[#0B1F3A] flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-[#1D4ED8] mt-0.5 shrink-0" aria-hidden="true" />
        <span>{t('planningNotice')}</span>
      </div>

      {activeList?.items.some((i) => i.isDemo) && <DemoDataNotice compact />}

      {/* List Switcher Bar */}
      {choiceLists.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 no-print">
          {choiceLists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => {
                setActiveListId(list.id);
                setUndoStack([]);
                setRedoStack([]);
                setRenamingTitle(null);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                activeList?.id === list.id
                  ? 'bg-[#0B162C] text-white border-[#0B162C]'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              {list.title}{' '}
              <span className="font-mono opacity-75 ml-1">({list.items.length})</span>
            </button>
          ))}
        </div>
      )}

      {!activeList ? (
        <div className="app-panel rounded-xl p-10 text-center space-y-3">
          <h2 className="text-base font-display font-semibold text-[#0B1F3A]">
            Create your first preference list
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Create a list above, or click &ldquo;+ Choice&rdquo; on any result inside the Predictor or Cutoff Explorer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Choice List Workspace */}
          <div className="lg:col-span-8 space-y-5">
            {/* Active List Toolbar */}
            <div className="app-panel rounded-xl p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {renamingTitle != null ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={renamingTitle}
                      onChange={(e) => setRenamingTitle(e.target.value)}
                      className="h-8 rounded-lg border border-slate-300 px-3 text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRenameSubmit()}
                      className="h-8 px-3 rounded-lg bg-[#0B162C] text-white text-xs font-semibold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingTitle(null)}
                      className="h-8 px-3 rounded-lg border border-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-base font-display font-bold text-[#0B1F3A]">
                      {activeList.title}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeList.systemCode.toUpperCase()} · {activeList.academicYear} ·{' '}
                      <span className="font-mono tabular-nums">{activeList.items.length}</span> choices · Autosaved
                    </p>
                  </div>
                )}

                {/* Grouped Toolbar Action Clusters */}
                <div className="flex flex-wrap items-center gap-2 no-print">
                  <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white divide-x divide-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setRenamingTitle(activeList.title)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicateList()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      title="Duplicate list"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" /> Duplicate
                    </button>
                  </div>

                  <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white divide-x divide-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => void handleUndo()}
                      disabled={undoStack.length === 0}
                      className="p-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-35 transition-colors"
                      title="Undo"
                      aria-label="Undo"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRedo()}
                      disabled={redoStack.length === 0}
                      className="p-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-35 transition-colors"
                      title="Redo"
                      aria-label="Redo"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHistory((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        showHistory ? 'bg-blue-50 text-[#1D4ED8]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">{activeList.versions.length}</span>
                    </button>
                  </div>

                  <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white divide-x divide-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => exportChoiceListCsv(activeList)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" /> CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[#0B162C] text-white hover:bg-[#132C50] transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void removeChoiceList(activeList)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Delete list"
                    aria-label="Delete list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* View Mode Toggle + Share Link */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 no-print">
                <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg text-xs">
                  {(
                    [
                      ['order', 'Exact Order'],
                      ['branch', 'By Branch (View)'],
                      ['college', 'By College (View)'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                        viewMode === mode
                          ? 'bg-white text-[#0B1F3A] shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {shareUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
                          showToast('Read-only share link copied');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-300 bg-teal-50/70 text-teal-900 font-medium whitespace-nowrap"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Copy Share Link
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleChoiceListShare(activeList, false)}
                        className="text-red-700 hover:underline font-medium"
                      >
                        Revoke
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void toggleChoiceListShare(activeList, true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium whitespace-nowrap transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share Read-Only Link
                    </button>
                  )}
                </div>
              </div>

              {/* Version History Drawer */}
              {showHistory && (
                <div className="pt-3 border-t border-slate-200 space-y-2 no-print">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0B1F3A]">
                    <span>Saved Snapshots (Revert Anytime)</span>
                    <button
                      type="button"
                      onClick={() => setShowHistory(false)}
                      className="text-slate-500 hover:text-[#0B1F3A]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {activeList.versions.map((ver) => (
                      <div key={ver.versionId} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-medium text-slate-800">{ver.summary}</p>
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {new Date(ver.savedAt).toLocaleString()} · {ver.items.length} choices
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void commitItems(ver.items, `Restored snapshot: ${ver.summary}`)
                          }
                          className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-medium hover:bg-slate-50"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Search to Add Choice */}
              <div className="relative no-print">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder={`Search and add a ${activeSystemConfig.shortName} institute + branch...`}
                  aria-label="Search institute and branch to add"
                  className="w-full h-9 rounded-lg border border-slate-300/90 pl-9 pr-3 text-xs"
                />
                {searchResults.length > 0 && (
                  <div className="mt-1.5 rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {searchResults.map((c) => (
                      <div
                        key={c.id}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-[#0B1F3A]">{c.institutionName}</span>{' '}
                          <span className="text-slate-600">— {c.programmeName}</span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {c.quota} · {c.seatCategory} · {c.seatPool} · Closing:{' '}
                            <strong className="font-mono tabular-nums text-[#0B1F3A]">
                              {c.closingRank.toLocaleString('en-IN')}
                            </strong>{' '}
                            ({c.rankType})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const newItem: ChoiceListItem = {
                              id: `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
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
                            };
                            await commitItems(
                              [...activeList.items, newItem],
                              `Added ${c.institutionName} — ${c.programmeName}`
                            );
                            setAddSearch('');
                          }}
                          className="px-3 py-1.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold shrink-0 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Choice Rows */}
            {activeList.items.length === 0 ? (
              <div className="app-panel rounded-xl p-10 text-center space-y-2">
                <h3 className="text-sm font-display font-semibold text-[#0B1F3A]">
                  This choice list is empty
                </h3>
                <p className="text-xs text-slate-600">
                  Use the search box above or add options directly from the{' '}
                  <Link to="/predictor" className="text-[#1D4ED8] font-medium hover:underline">
                    College Predictor
                  </Link>
                  .
                </p>
              </div>
            ) : viewMode === 'order' ? (
              <div className="app-panel rounded-xl divide-y divide-slate-100 overflow-hidden">
                {activeList.items.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => void handleDrop(idx)}
                    className={`p-4 flex flex-col sm:flex-row sm:items-start gap-3 transition-colors print-break-inside-avoid ${
                      dragIndex === idx ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Order handle + accessible up/down buttons */}
                    <div className="flex sm:flex-col items-center gap-1.5 shrink-0">
                      <span className="font-mono tabular-nums font-bold text-sm text-[#0B1F3A] w-8 text-center">
                        #{idx + 1}
                      </span>
                      <GripVertical
                        className="w-4 h-4 text-slate-300 hidden sm:block cursor-grab no-print"
                        aria-hidden="true"
                      />
                      <div className="flex sm:flex-col gap-1 no-print">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => void handleMove(idx, -1)}
                          className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 min-w-[30px] min-h-[30px] flex items-center justify-center"
                          aria-label={`Move choice ${idx + 1} up`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === activeList.items.length - 1}
                          onClick={() => void handleMove(idx, 1)}
                          className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 min-w-[30px] min-h-[30px] flex items-center justify-center"
                          aria-label={`Move choice ${idx + 1} down`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Choice Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/colleges/${item.institutionSlug}`}
                            className="text-sm font-semibold text-[#0B1F3A] hover:text-[#1D4ED8]"
                          >
                            {item.institutionName}
                          </Link>
                          <p className="text-xs text-slate-800">{item.programmeName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.institutionType} · {item.state} · {item.quota} · {item.seatCategory} · {item.seatPool}
                            {item.isDemo ? ' · Demo data — not official' : ''}
                          </p>
                        </div>

                        <div className="text-right font-mono tabular-nums">
                          <div className="text-xs font-semibold text-[#0B1F3A]">
                            {item.closingRank != null
                              ? `Closing: ${item.closingRank.toLocaleString('en-IN')}`
                              : 'Cutoff: Not available'}
                          </div>
                          <div className="text-[11px] font-sans text-slate-500">
                            {item.academicYear ?? ''} {item.roundLabel ?? ''} · {item.rankType}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <select
                          aria-label={`Priority tag for choice ${idx + 1}`}
                          value={item.tag}
                          onChange={(e) =>
                            void handleTagChange(idx, e.target.value as ChoicePriorityTag)
                          }
                          className="h-8 rounded-md border border-slate-300/90 bg-white px-2 text-xs font-medium"
                        >
                          <option value="Dream">Dream</option>
                          <option value="Target">Target</option>
                          <option value="Safer">Safer</option>
                          <option value="Unassigned">Unassigned</option>
                        </select>

                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => void handleNoteChange(idx, e.target.value)}
                          placeholder="Add private note for this choice..."
                          aria-label={`Notes for choice ${idx + 1}`}
                          className="flex-1 min-w-[180px] h-8 rounded-md border border-slate-200 px-2.5 text-xs text-slate-700"
                        />

                        <button
                          type="button"
                          onClick={() => void handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-700 transition-colors no-print"
                          aria-label={`Remove choice ${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Grouped by <strong>{viewMode === 'branch' ? 'Branch Group' : 'College'}</strong> for inspection only. Preference numbers (#1, #2…) reflect your true unmodified order.
                </p>
                {groupedItems?.map(([groupName, entries]) => (
                  <div key={groupName} className="app-panel rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50/75 border-b border-slate-200/80 text-xs font-display font-semibold text-[#0B1F3A]">
                      {groupName} ({entries.length})
                    </div>
                    <div className="divide-y divide-slate-100">
                      {entries.map(({ originalIndex, item }) => (
                        <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-mono font-bold text-[#1D4ED8] mr-2">
                              #{originalIndex + 1}
                            </span>
                            <span className="font-semibold text-[#0B1F3A]">{item.institutionName}</span>
                            <span className="text-slate-600"> — {item.programmeName}</span>
                            <span className="text-slate-500"> · {item.tag}</span>
                          </div>
                          <span className="font-mono tabular-nums text-slate-700">
                            {item.closingRank != null ? item.closingRank.toLocaleString('en-IN') : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Flattened Single-Elevation Choice List Analyzer */}
          <aside className="lg:col-span-4 space-y-5">
            {analysis && (
              <div className="app-panel rounded-xl overflow-hidden">
                <div className="px-4 py-3.5 border-b border-slate-200/80">
                  <h2 className="text-sm font-display font-bold text-[#0B1F3A]">
                    Choice List Analyzer
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Advisory checks only — never alters your preference order.
                  </p>
                </div>

                {/* Hairline 2x2 metric grid (no nested bordered boxes) */}
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-200/80 border-b border-slate-200/80">
                  <div className="p-3.5">
                    <span className="text-[11px] text-slate-500">Dream</span>
                    <p className="text-xl font-display font-bold text-[#0B1F3A] tabular-nums mt-0.5">
                      {analysis.countsByTag.Dream}
                    </p>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[11px] text-slate-500">Target</span>
                    <p className="text-xl font-display font-bold text-[#1D4ED8] tabular-nums mt-0.5">
                      {analysis.countsByTag.Target}
                    </p>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[11px] text-slate-500">Safer</span>
                    <p className="text-xl font-display font-bold text-teal-700 tabular-nums mt-0.5">
                      {analysis.countsByTag.Safer}
                    </p>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[11px] text-slate-500">Unassigned</span>
                    <p className="text-xl font-display font-bold text-slate-600 tabular-nums mt-0.5">
                      {analysis.countsByTag.Unassigned}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 text-xs text-slate-600 bg-slate-50/50 border-b border-slate-200/80 space-y-1">
                  <p>
                    Profile rank ({predominantRankType}):{' '}
                    <strong className="font-mono text-[#0B1F3A]">
                      {studentRankForAnalyzer
                        ? studentRankForAnalyzer.toLocaleString('en-IN')
                        : 'Not set in Profile'}
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                    Beyond: {analysis.beyondClosingChoices.length} · Duplicates:{' '}
                    {analysis.duplicatePairs.length} · Missing data: {analysis.missingHistoricalData.length}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {analysis.advisories.map((adv) => (
                    <div
                      key={adv.title}
                      className={`px-4 py-3 text-xs space-y-1 ${
                        adv.severity === 'warning' ? 'bg-amber-50/50 text-amber-950' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        {adv.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                        )}
                        <span>{adv.title}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{adv.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
