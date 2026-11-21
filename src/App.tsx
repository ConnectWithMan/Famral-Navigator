import React, { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { Layout } from './components/Layout.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PredictorPage } from './pages/PredictorPage.tsx';
import { CutoffsPage } from './pages/CutoffsPage.tsx';
import { CollegesPage } from './pages/CollegesPage.tsx';
import { CollegeDetailPage } from './pages/CollegeDetailPage.tsx';
import { ComparePage } from './pages/ComparePage.tsx';
import { SavedCollegesPage } from './pages/SavedCollegesPage.tsx';
import { ChoiceBuilderPage } from './pages/ChoiceBuilderPage.tsx';
import { SharedChoiceListPage } from './pages/SharedChoiceListPage.tsx';
import { CounsellingPage } from './pages/CounsellingPage.tsx';
import { GuidesGlossaryPage } from './pages/GuidesGlossaryPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { DisclaimerPage, PrivacyPage, TermsPage } from './pages/LegalPages.tsx';
import { usePageSeo } from './lib/seo.ts';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
};

const NotFoundPage: React.FC = () => {
  usePageSeo({
    title: 'Page Not Found',
    description: 'The requested page on Famral Navigator does not exist or may have moved.',
    noIndex: true,
  });

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
    <p className="font-mono text-xs font-semibold text-[#1D4ED8]">404</p>
    <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">Page not found</h1>
    <p className="text-sm text-slate-600">
      The Famral Navigator page you requested does not exist or may have moved.
    </p>
    <div className="flex items-center justify-center gap-3 pt-2">
      <Link
        to="/"
        className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#132C50] rounded-md"
      >
        Back to Home
      </Link>
      <Link
        to="/predictor"
        className="px-4 py-2 text-xs font-semibold text-[#0B1F3A] border border-slate-300 hover:bg-slate-50 rounded-md"
      >
        Open College Predictor
      </Link>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/predictor" element={<PredictorPage />} />
              <Route path="/predictor/:system" element={<PredictorPage />} />

              {/* Cutoff Explorer & SEO Routes */}
              <Route path="/cutoffs" element={<CutoffsPage />} />
              <Route path="/cutoffs/:param1" element={<CutoffsPage />} />
              <Route path="/cutoffs/:param1/:param2" element={<CutoffsPage />} />

              {/* Colleges & Branch-First Discovery */}
              <Route path="/colleges" element={<CollegesPage />} />
              <Route path="/colleges/:slug" element={<CollegeDetailPage />} />
              <Route path="/branches" element={<CollegesPage branchFirst />} />

              {/* Planning Tools */}
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/saved-colleges" element={<SavedCollegesPage />} />
              <Route path="/choice-builder" element={<ChoiceBuilderPage />} />
              <Route path="/shared/:token" element={<SharedChoiceListPage />} />

              {/* Counselling Management & Knowledge */}
              <Route path="/counselling" element={<CounsellingPage />} />
              <Route path="/counselling/:system" element={<CounsellingPage />} />
              <Route path="/guides" element={<GuidesGlossaryPage initialMode="guides" />} />
              <Route path="/glossary" element={<GuidesGlossaryPage initialMode="glossary" />} />

              {/* Account, Dashboard & Role-Gated Admin */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/login" element={<AuthPage initialMode="login" />} />
              <Route path="/signup" element={<AuthPage initialMode="signup" />} />
              <Route path="/admin" element={<AdminPage />} />

              {/* Legal & Trust */}
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
