import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronRight,
  Compass,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { PWAInstallButton, OfflineIndicator } from './PWAInstallButton.tsx';
import { ReportErrorModal } from './ReportErrorModal.tsx';
import { CommandPalette } from './CommandPalette.tsx';

interface SidebarNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  count?: number;
}

interface SidebarSection {
  title: string;
  items: SidebarNavItem[];
}

function getRouteMeta(pathname: string): { section: string; title: string } {
  if (pathname === '/') return { section: 'Workspace', title: 'Overview' };
  if (pathname.startsWith('/predictor')) return { section: 'Workspace', title: 'College Predictor' };
  if (pathname.startsWith('/cutoffs')) return { section: 'Workspace', title: 'Cutoff Explorer' };
  if (pathname.startsWith('/choice-builder')) return { section: 'Workspace', title: 'Choice Builder' };
  if (pathname.startsWith('/shared/')) return { section: 'Workspace', title: 'Shared Choice List' };
  if (pathname === '/colleges') return { section: 'Explore', title: 'Colleges Directory' };
  if (pathname.startsWith('/colleges/')) return { section: 'Explore', title: 'Institute Profile' };
  if (pathname.startsWith('/branches')) return { section: 'Explore', title: 'Branch Discovery' };
  if (pathname.startsWith('/compare')) return { section: 'Explore', title: 'Compare Colleges' };
  if (pathname.startsWith('/saved-colleges')) return { section: 'Explore', title: 'Saved Colleges' };
  if (pathname.startsWith('/counselling')) return { section: 'Counselling', title: 'Counselling Hub' };
  if (pathname.startsWith('/guides')) return { section: 'Counselling', title: 'Process Guides' };
  if (pathname.startsWith('/glossary')) return { section: 'Counselling', title: 'Admissions Glossary' };
  if (pathname.startsWith('/dashboard')) return { section: 'Account', title: 'My Workspace' };
  if (pathname.startsWith('/admin')) return { section: 'Admin', title: 'Admin Console' };
  if (pathname.startsWith('/login')) return { section: 'Account', title: 'Sign In' };
  if (pathname.startsWith('/signup')) return { section: 'Account', title: 'Create Account' };
  if (pathname.startsWith('/privacy')) return { section: 'Legal', title: 'Privacy Policy' };
  if (pathname.startsWith('/terms')) return { section: 'Legal', title: 'Terms of Use' };
  if (pathname.startsWith('/disclaimer')) return { section: 'Legal', title: 'Data Disclaimer' };
  return { section: 'Navigator', title: 'Workspace' };
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    profile,
    isAdmin,
    t,
    logout,
    toastMessage,
    notifications,
    savedColleges,
    choiceLists,
  } = useApp();

  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('famral_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalChoiceItems = useMemo(
    () => choiceLists.reduce((acc, l) => acc + l.items.length, 0),
    [choiceLists]
  );

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('famral_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // ignore storage restrictions
      }
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const routeMeta = getRouteMeta(location.pathname);

  const sections = useMemo<SidebarSection[]>(() => {
    const accountItems: SidebarNavItem[] = [
      { to: '/dashboard', label: t('navDashboard'), icon: FolderKanban },
    ];
    if (isAdmin) {
      accountItems.push({ to: '/admin', label: t('navAdmin'), icon: ShieldCheck });
    }

    return [
      {
        title: 'Workspace',
        items: [
          { to: '/', label: t('navHome'), icon: LayoutDashboard, end: true },
          { to: '/predictor', label: t('navPredictor'), icon: SlidersHorizontal },
          { to: '/cutoffs', label: t('navCutoffs'), icon: LineChart },
          {
            to: '/choice-builder',
            label: t('navChoiceBuilder'),
            icon: ListChecks,
            count: user && totalChoiceItems > 0 ? totalChoiceItems : undefined,
          },
        ],
      },
      {
        title: 'Explore',
        items: [
          { to: '/colleges', label: t('navColleges'), icon: Building2 },
          { to: '/branches', label: t('branchDiscovery'), icon: GitBranch },
          { to: '/compare', label: t('navCompare'), icon: Scale },
          {
            to: '/saved-colleges',
            label: 'Saved Colleges',
            icon: Bookmark,
            count: user && savedColleges.length > 0 ? savedColleges.length : undefined,
          },
        ],
      },
      {
        title: 'Counselling',
        items: [
          { to: '/counselling', label: t('navCounselling'), icon: CalendarClock },
          { to: '/guides', label: 'Process Guides', icon: BookOpen },
          { to: '/glossary', label: 'Glossary', icon: FileText },
        ],
      },
      {
        title: 'Account',
        items: accountItems,
      },
    ];
  }, [t, isAdmin, user, totalChoiceItems, savedColleges.length]);

  const userDisplayName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Student';
  const userInitials = userDisplayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isOnPredictor = location.pathname.startsWith('/predictor');

  const renderSidebarNav = (isCompact: boolean, onItemClick?: () => void) => (
    <nav
      aria-label="Workspace Navigation"
      className="flex-1 overflow-y-auto app-sidebar-scroll py-3.5 px-2.5 space-y-5"
    >
      {sections.map((section) => (
        <div key={section.title} className="space-y-0.5">
          {!isCompact && (
            <div className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-slate-400/80">
              {section.title}
            </div>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onItemClick}
                title={isCompact ? item.label : undefined}
                aria-label={isCompact ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center ${
                    isCompact ? 'justify-center px-2' : 'justify-between px-2.5'
                  } py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                    isActive
                      ? 'bg-white/[0.12] text-white font-semibold'
                      : 'text-slate-300/90 hover:bg-white/[0.06] hover:text-white font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#60A5FA]' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!isCompact && <span className="truncate">{item.label}</span>}
                    </span>
                    {!isCompact && item.count !== undefined && (
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isActive ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F7FA] text-[#0F172A]">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[#0B1F3A] focus:text-white focus:px-4 focus:py-2 focus:rounded-md text-sm font-medium"
      >
        Skip to main content
      </a>

      {/* Desktop Architectural Navy Sidebar Rail */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen shrink-0 bg-[#0B162C] text-slate-200 border-r border-slate-900/20 transition-[width] duration-200 no-print ${
          collapsed ? 'w-[68px]' : 'w-[248px]'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-14 border-b border-white/[0.08] flex items-center shrink-0 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
          }`}
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 min-w-0"
            title="Famral Navigator"
          >
            <span className="w-7 h-7 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            {!collapsed && (
              <span className="font-display font-bold text-[15px] text-white tracking-tight truncate">
                Famral Navigator
              </span>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        {renderSidebarNav(collapsed)}

        {/* Sidebar Bottom Utility Dock */}
        <div className="border-t border-white/[0.08] p-2.5 space-y-2 shrink-0 bg-[#081021]/60">
          {collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="w-full h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {!collapsed && (
            <div className="empty:hidden">
              <PWAInstallButton />
            </div>
          )}

          {/* User Account / Sign In */}
          {user ? (
            <div
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'justify-between gap-2 px-1.5'
              } pt-1`}
            >
              <Link
                to="/dashboard"
                title={userDisplayName}
                className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity"
              >
                <span className="w-7 h-7 rounded-md bg-[#1D4ED8]/90 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {userInitials}
                </span>
                {!collapsed && (
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-white truncate">
                      {userDisplayName}
                    </span>
                    <span className="block text-[11px] text-slate-400 truncate">
                      {user.email}
                    </span>
                  </span>
                )}
              </Link>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
                  title={t('navLogout')}
                  aria-label={t('navLogout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              state={{ from: location.pathname }}
              title={t('navLogin')}
              className={`w-full flex items-center justify-center gap-2 ${
                collapsed ? 'h-9 px-0' : 'py-2 px-3'
              } rounded-lg bg-[#1D4ED8] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors whitespace-nowrap`}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{t('navLogin')}</span>}
            </Link>
          )}

          {!collapsed && (
            <div className="pt-1.5 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Link to="/privacy" className="hover:text-slate-200 transition-colors">Privacy</Link>
              <span aria-hidden="true">·</span>
              <Link to="/terms" className="hover:text-slate-200 transition-colors">Terms</Link>
              <span aria-hidden="true">·</span>
              <Link to="/disclaimer" className="hover:text-slate-200 transition-colors">Disclaimer</Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation Drawer (matches dark architectural rail) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print" role="dialog" aria-modal="true" aria-label="App Menu">
          <div
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] bg-[#0B162C] text-slate-200 h-full flex flex-col border-r border-white/10 shadow-2xl">
            <div className="h-14 px-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center">
                  <Compass className="w-4 h-4 text-white" aria-hidden="true" />
                </span>
                <span className="font-display font-bold text-[15px] text-white">
                  Famral Navigator
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08]"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderSidebarNav(false, () => setMobileOpen(false))}

            <div className="border-t border-white/[0.08] p-3 space-y-2.5 bg-[#081021]/70">
              <div className="empty:hidden">
                <PWAInstallButton />
              </div>

              {user ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <span className="w-7 h-7 rounded-md bg-[#1D4ED8] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {userInitials}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {userDisplayName}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void logout();
                    }}
                    className="px-2.5 py-1.5 rounded-md border border-white/15 bg-white/[0.06] text-xs font-medium text-slate-200"
                  >
                    {t('navLogout')}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('navLogin')}</span>
                </Link>
              )}

              <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Link to="/privacy" onClick={() => setMobileOpen(false)}>Privacy</Link>
                <span>·</span>
                <Link to="/terms" onClick={() => setMobileOpen(false)}>Terms</Link>
                <span>·</span>
                <Link to="/disclaimer" onClick={() => setMobileOpen(false)}>Disclaimer</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Main App Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Slim App Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-3 no-print">
          {/* Left: Mobile Drawer Toggle + Contextual Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Open workspace menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="lg:hidden flex items-center gap-2 shrink-0">
              <span className="w-6 h-6 rounded-md bg-[#1D4ED8] text-white flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              </span>
            </Link>

            <div className="flex items-center gap-1.5 text-[13px] min-w-0">
              <span className="hidden sm:inline text-slate-400 font-medium truncate">
                {routeMeta.section}
              </span>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
              <span className="font-display font-semibold text-[#0B1F3A] truncate">
                {routeMeta.title}
              </span>
            </div>
          </div>

          {/* Right: Command Palette Trigger + Alerts + 1 Primary App Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center justify-between gap-3 w-56 md:w-72 h-9 px-3 rounded-lg border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/90 hover:border-slate-300 text-xs text-slate-500 transition-colors"
              aria-label="Open quick search (Command K)"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">Search institutes, cutoffs, tools...</span>
              </span>
              <kbd className="font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              aria-label="Search colleges and tools"
            >
              <Search className="w-4 h-4" />
            </button>

            {user && (
              <Link
                to="/dashboard"
                className="relative h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0B1F3A] text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                title="Notifications & Workspace"
                aria-label="Notifications and Workspace"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-[#1D4ED8]">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              to={isOnPredictor ? '/choice-builder' : '/predictor'}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] text-white text-xs font-semibold transition-all whitespace-nowrap shrink-0 shadow-xs"
            >
              {isOnPredictor ? (
                <>
                  <ListChecks className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Choice Builder</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{t('navPredictor')}</span>
                </>
              )}
            </Link>
          </div>
        </header>

        {/* Scrollable Workspace Canvas */}
        <main id="main-content" className="flex-1 flex flex-col pb-16 lg:pb-0">
          <div className="flex-1">{children}</div>

          {/* Quiet App Attribution Strip */}
          <footer className="max-w-[1320px] w-full mx-auto px-4 sm:px-6 pt-5 pb-5 mt-8 border-t border-slate-200/75 text-[11px] text-slate-400 no-print">
            <span>
              Famral Navigator · Independent planning workspace (not affiliated with JoSAA, CSAB, or state counselling authorities). Historical comparisons only.
            </span>
          </footer>
        </main>
      </div>

      {/* Mobile Native-Style Bottom Tab Bar */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 no-print"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#1D4ED8] font-semibold' : 'text-slate-500'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </NavLink>
        <NavLink
          to="/predictor"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#1D4ED8] font-semibold' : 'text-slate-500'
            }`
          }
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Predictor</span>
        </NavLink>
        <NavLink
          to="/cutoffs"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#1D4ED8] font-semibold' : 'text-slate-500'
            }`
          }
        >
          <LineChart className="w-4 h-4" />
          <span>Cutoffs</span>
        </NavLink>
        <NavLink
          to="/choice-builder"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#1D4ED8] font-semibold' : 'text-slate-500'
            }`
          }
        >
          <ListChecks className="w-4 h-4" />
          <span>Choices</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-500"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <ReportErrorModal />
      <OfflineIndicator />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-5 right-5 z-50 bg-[#0B162C] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl border border-white/10 no-print"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
