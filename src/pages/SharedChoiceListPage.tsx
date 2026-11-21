import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { fetchSharedChoiceListByToken } from '../lib/firestoreService.ts';
import { SharedChoiceList } from '../types/domain.ts';
import { DemoDataNotice } from '../components/DemoDataNotice.tsx';
import { usePageSeo } from '../lib/seo.ts';

export const SharedChoiceListPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [shared, setShared] = useState<SharedChoiceList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageSeo({
    title: shared ? `${shared.title} – Shared Preference List` : 'Shared Choice List',
    description: 'Read-only shared counselling preference list on Famral Navigator.',
    noIndex: true,
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSharedChoiceListByToken(token)
      .then((res) => {
        setShared(res);
        setLoading(false);
      })
      .catch(() => {
        setError('This share link is invalid or has been revoked by its owner.');
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Loading shared choice list...
      </div>
    );
  }

  if (error || !shared) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="text-2xl font-display font-bold text-[#0B1F3A]">Share Link Unavailable</h1>
        <p className="text-sm text-slate-600">
          {error || 'This preference list link has been revoked or does not exist.'}
        </p>
        <Link to="/" className="inline-block text-sm font-semibold text-[#1D4ED8] hover:underline">
          Go to Famral Navigator →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#1D4ED8]">
            Read-Only Shared Choice List · {shared.systemCode.toUpperCase()} {shared.academicYear}
          </p>
          <h1 className="text-2xl font-display font-bold text-[#0B1F3A] mt-1">{shared.title}</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0B1F3A] text-white text-xs font-semibold no-print"
        >
          <Printer className="w-3.5 h-3.5" /> Print / PDF
        </button>
      </div>

      {shared.includesDemoData && <DemoDataNotice compact showHistoricalNote />}

      <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs text-[#0B1F3A]">
        Planning list only — final choices must always be entered and locked on the official counselling portal.
      </div>

      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="py-3 px-4 font-medium">Order</th>
              <th className="py-3 px-3 font-medium">Tag</th>
              <th className="py-3 px-3 font-medium">Institute &amp; Programme</th>
              <th className="py-3 px-3 font-medium">Quota / Category</th>
              <th className="py-3 px-4 font-medium text-right">Historical Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shared.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-3 px-4 font-mono font-bold text-[#0B1F3A]">#{idx + 1}</td>
                <td className="py-3 px-3 font-medium text-slate-700">{item.tag}</td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-[#0B1F3A]">{item.institutionName}</div>
                  <div className="text-slate-600">{item.programmeName}</div>
                  {item.notes && <div className="text-[11px] text-slate-500 mt-0.5">Note: {item.notes}</div>}
                </td>
                <td className="py-3 px-3 text-slate-600">
                  {item.quota} · {item.seatCategory} · {item.seatPool}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0B1F3A]">
                  {item.closingRank != null ? item.closingRank.toLocaleString('en-IN') : 'Not available'}
                  {item.isDemo && (
                    <div className="text-[10px] font-sans font-normal text-amber-700">Demo data</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
