import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Plus, Scale, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { getLatestRoundNumber, getSystemConfig } from '../config/systems/registry.ts';
import { usePageSeo } from '../lib/seo.ts';

export const SavedCollegesPage: React.FC = () => {
  const {
    user,
    savedColleges,
    institutions,
    cutoffs,
    updateSavedNotes,
    removeSavedCollege,
    addItemToChoiceList,
  } = useApp();
  const navigate = useNavigate();
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  usePageSeo({
    title: 'Saved Colleges',
    description: 'Manage your shortlisted NITs, IIITs, GFTIs, and branches with personal notes.',
    noIndex: true,
  });

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Bookmark className="w-8 h-8 text-[#1D4ED8] mx-auto" />
        <h1 className="text-2xl font-display font-bold text-[#0B1F3A]">Saved Colleges</h1>
        <p className="text-sm text-slate-600">
          Sign in to save institutions or specific branches, write private notes, and move them directly into Compare or Choice Builder.
        </p>
        <Link
          to="/login"
          className="inline-flex px-5 py-2.5 rounded-md bg-[#0B1F3A] text-white text-sm font-semibold"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">
            <Link to="/dashboard" className="hover:text-[#1D4ED8]">Dashboard</Link> / <span>Saved Colleges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] mt-1">
            Saved Colleges &amp; Branches ({savedColleges.length})
          </h1>
        </div>
        <Link
          to="/colleges"
          className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap"
        >
          Browse more colleges →
        </Link>
      </div>

      {savedColleges.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center space-y-3">
          <h2 className="text-base font-display font-semibold text-[#0B1F3A]">No saved colleges yet</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Click "Save college" or "Save Branch" from the Predictor or Colleges Directory to build your private shortlist.
          </p>
          <Link
            to="/colleges"
            className="inline-flex px-4 py-2 rounded-md bg-[#1D4ED8] text-white text-xs font-semibold"
          >
            Explore Colleges
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedColleges.map((item) => {
            const inst = institutions.find((i) => i.id === item.institutionId);
            const noteVal = editingNotes[item.id] ?? item.notes ?? '';
            const primarySys = inst?.systems[0] ?? 'josaa';
            const latestRound = getLatestRoundNumber(getSystemConfig(primarySys));
            const sampleCutoff = cutoffs.find(
              (c) =>
                c.status === 'published' &&
                c.institutionId === item.institutionId &&
                c.systemCode === primarySys &&
                (!item.programmeId || c.programmeId === item.programmeId) &&
                c.academicYear === 2025 &&
                c.roundNumber === latestRound &&
                c.seatCategory === 'OPEN'
            );

            return (
              <div
                key={item.id}
                className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/colleges/${item.institutionSlug}`}
                        className="text-base font-display font-semibold text-[#0B1F3A] hover:text-[#1D4ED8]"
                      >
                        {item.institutionName}
                      </Link>
                      {item.programmeName && (
                        <p className="text-xs font-medium text-[#1D4ED8] mt-0.5">{item.programmeName}</p>
                      )}
                      {inst && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inst.type} · {inst.city}, {inst.state}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeSavedCollege(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-700 rounded"
                      aria-label="Remove saved college"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label htmlFor={`note-${item.id}`} className="block text-[11px] font-medium text-slate-500">
                      Personal Notes
                    </label>
                    <textarea
                      id={`note-${item.id}`}
                      rows={2}
                      value={noteVal}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Add campus, hostel, travel, or branch notes..."
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void updateSavedNotes(item.id, noteVal)}
                      className="px-3 py-1.5 rounded bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132C50]"
                    >
                      Save Note
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/compare?add=${item.institutionId}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Scale className="w-3.5 h-3.5" /> Compare
                    </button>
                  </div>

                  {sampleCutoff && (
                    <button
                      type="button"
                      onClick={() =>
                        void addItemToChoiceList(
                          {
                            id: `item_${Date.now().toString(36)}`,
                            institutionId: sampleCutoff.institutionId,
                            institutionSlug: sampleCutoff.institutionSlug,
                            institutionName: sampleCutoff.institutionName,
                            institutionType: sampleCutoff.institutionType,
                            state: sampleCutoff.state,
                            programmeId: sampleCutoff.programmeId,
                            programmeName: sampleCutoff.programmeName,
                            branchGroup: sampleCutoff.branchGroup,
                            quota: sampleCutoff.quota,
                            seatCategory: sampleCutoff.seatCategory,
                            seatPool: sampleCutoff.seatPool,
                            rankType: sampleCutoff.rankType,
                            closingRank: sampleCutoff.closingRank,
                            academicYear: sampleCutoff.academicYear,
                            roundLabel: sampleCutoff.roundLabel,
                            sourceName: sampleCutoff.sourceName,
                            isDemo: sampleCutoff.isDemo,
                            tag: 'Unassigned',
                            notes: noteVal,
                          },
                          undefined,
                          sampleCutoff.systemCode
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Choice List
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
