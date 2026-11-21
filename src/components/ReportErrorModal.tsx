import React, { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Link } from 'react-router-dom';

const ISSUE_TYPES = [
  'Incorrect opening or closing rank',
  'Wrong quota, category, or rank type',
  'Outdated counselling date or notice',
  'Incorrect institute or programme information',
  'Broken official source link',
  'Other data discrepancy',
];

export const ReportErrorModal: React.FC = () => {
  const { user, reportTarget, closeReportModal, submitDataReport } = useApp();
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reportTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 5) {
      setError('Please provide at least a short explanation (minimum 5 characters).');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitDataReport(issueType, details.trim());
      setDetails('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
            <h2 id="report-modal-title" className="text-base font-display font-semibold text-[#0B1F3A]">
              Report Incorrect Data
            </h2>
          </div>
          <button
            type="button"
            onClick={closeReportModal}
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
          <span className="text-slate-500">Record: </span>
          <strong className="font-medium text-slate-900">{reportTarget.entityLabel}</strong>
        </div>

        {!user ? (
          <div className="space-y-3 text-sm text-slate-600">
            <p>Please sign in to submit an error report so our review team can track and verify it.</p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeReportModal}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-md"
              >
                Cancel
              </button>
              <Link
                to="/login"
                onClick={closeReportModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-md"
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-issue-type" className="block text-xs font-medium text-slate-700 mb-1">
                Issue Category
              </label>
              <select
                id="report-issue-type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-details" className="block text-xs font-medium text-slate-700 mb-1">
                What looks incorrect? Include official reference if available.
              </label>
              <textarea
                id="report-details"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g., Official JoSAA Round 6 closing rank differs from the figure shown here..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>

            {error && <p className="text-xs text-red-700">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeReportModal}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit to Review Queue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
