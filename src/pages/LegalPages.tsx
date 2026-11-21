import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { usePageSeo } from '../lib/seo.ts';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import type { BreadcrumbItem } from '../lib/seoSchema.ts';

export const PrivacyPage: React.FC = () => {
  const { user, exportMyAccountData } = useApp();
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }];

  usePageSeo({
    title: 'Privacy Policy & Student Data Control | Famral Navigator',
    description:
      'How Famral Navigator stores your exam rank, category, home state, saved colleges, and choice lists — with zero data selling and full export/deletion controls.',
    canonicalPath: '/privacy',
    breadcrumbs,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1D4ED8]">
          <ShieldCheck className="w-4 h-4" />
          Privacy & Data Control
        </div>
        <h1 className="font-display text-3xl font-bold text-[#0B1F3A]">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Effective for Famral Navigator (navigator.famral.com)</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">1. Information You Provide</h2>
          <p>
            When you create an account, Famral Navigator stores only the information you explicitly enter to
            personalize historical cutoff comparisons: your name, email address, entrance exam rank (CRL and/or
            category rank), seat category, gender/seat pool, home state, saved colleges, comparisons, choice lists,
            and counselling checklist progress.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">2. Zero Data Selling & Private by Default</h2>
          <p>
            We never sell, rent, or trade student ranks, contact details, or preference lists to coaching
            institutes, colleges, or third-party marketers. Your saved colleges, predictions, and preference lists
            are private to your authenticated account unless you explicitly turn on a read-only share link for a
            specific choice list (which you can revoke at any time).
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">3. Aggregate Product Metrics</h2>
          <p>
            Internal usage analytics record only non-identifying aggregate counts (such as total predictor runs per
            counselling system per day) and never log individual student ranks or identities.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">4. Export & Permanent Deletion</h2>
          <p>
            You may download a complete JSON copy of your account data or permanently delete your account and all
            associated saved records directly from your{' '}
            <Link to="/dashboard" className="text-[#1D4ED8] font-medium hover:underline">
              Student Dashboard
            </Link>
            .
          </p>
          {user && (
            <div className="pt-2">
              <button
                type="button"
                onClick={exportMyAccountData}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#132C50] rounded-md"
              >
                Download My Account Data (JSON)
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Terms of Use' }];

  usePageSeo({
    title: 'Terms of Use | Famral Navigator',
    description: 'Terms governing use of the Famral Navigator college admission planning platform.',
    canonicalPath: '/terms',
    breadcrumbs,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1D4ED8]">
          <FileText className="w-4 h-4" />
          Platform Terms
        </div>
        <h1 className="font-display text-3xl font-bold text-[#0B1F3A]">Terms of Use</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">1. Planning Tool Only</h2>
          <p>
            Famral Navigator is an independent educational planning tool. It is not affiliated with, endorsed by, or
            integrated with JoSAA, CSAB, NTA, or any state counselling authority. Filling preferences in the Choice
            Builder does not submit or lock choices on any official admission portal.
          </p>
        </section>
        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">2. User Responsibility</h2>
          <p>
            Students and parents are solely responsible for verifying official counselling schedules, seat matrices,
            eligibility criteria, fee structures, and final choice locking directly on official portals such as{' '}
            <a
              href="https://josaa.nic.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1D4ED8] hover:underline"
            >
              josaa.nic.in
            </a>{' '}
            and{' '}
            <a
              href="https://csab.nic.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1D4ED8] hover:underline"
            >
              csab.nic.in
            </a>
            .
          </p>
        </section>
        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">3. Acceptable Use</h2>
          <p>
            Automated scraping, abusive API traffic, unauthorized admin access attempts, or submitting false data
            reports are prohibited.
          </p>
        </section>
      </div>
    </div>
  );
};

export const DisclaimerPage: React.FC = () => {
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Data Disclaimer' }];

  usePageSeo({
    title: 'Data & Historical Comparison Disclaimer | Famral Navigator',
    description:
      'Important disclaimer regarding demo datasets, historical cutoff comparisons, rank-type separation, and admission uncertainty.',
    canonicalPath: '/disclaimer',
    breadcrumbs,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800">
          <AlertCircle className="w-4 h-4" />
          Data Transparency & Limitations
        </div>
        <h1 className="font-display text-3xl font-bold text-[#0B1F3A]">
          Data & Historical Comparison Disclaimer
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">
            1. Historical Comparison Only — Never a Guarantee
          </h2>
          <p>
            All predictor results, &ldquo;Within / Near / Beyond historical closing rank&rdquo; labels, round-wise
            charts, and year-over-year comparisons reflect past rank positions only. Actual seat allocation in any
            upcoming cycle depends on applicant volume, seat matrix changes, branch demand, and official business
            rules. Famral Navigator never implies guaranteed admission or calculates admission probability.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">
            2. Demo Data Labelling
          </h2>
          <p>
            Records seeded for demonstration carry an explicit{' '}
            <strong className="text-[#0B1F3A]">Demo data — not an official cutoff</strong> notice across cards,
            tables, charts, CSV exports, and print views. Administrators can import verified official datasets via
            the versioned CSV pipeline, which archives superseded records rather than overwriting history.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">
            3. Strict Rank-Type Separation
          </h2>
          <p>
            A JEE Main Common Rank List (CRL) rank is never compared against a Category Rank cutoff, and a Category
            Rank is never compared against a CRL cutoff. Under JoSAA rules, OPEN seats use CRL while EWS, OBC-NCL,
            SC, ST, and PwD seats use their respective Category Rank. Under CSAB Special Rounds, all categories use
            CRL.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">
            4. Unverified Institutional Fields
          </h2>
          <p>
            Fee schedules, placement figures, and seat capacities that have not been officially verified are
            displayed as &ldquo;Not available&rdquo; rather than estimated.
          </p>
        </section>
      </div>
    </div>
  );
};
