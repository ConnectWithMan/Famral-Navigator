import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Building2,
  CalendarClock,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { COUNSELLING_SYSTEMS } from '../config/systems/registry.ts';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  group: 'Tools' | 'Institutes' | 'Counselling Systems';
  title: string;
  subtitle: string;
  to: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const { institutions, isAdmin } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = useMemo<CommandItem[]>(() => {
    const tools: CommandItem[] = [
      {
        id: 'tool-home',
        group: 'Tools',
        title: 'Overview Workspace',
        subtitle: 'Quick rank evaluator, readiness metrics, and timeline',
        to: '/',
        keywords: 'home overview dashboard workspace command center',
        icon: LayoutDashboard,
      },
      {
        id: 'tool-predictor',
        group: 'Tools',
        title: 'College Predictor',
        subtitle: 'Compare CRL or category rank across JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET',
        to: '/predictor',
        keywords: 'predict rank jee main jee advanced iit josaa csab reap mht cet wbjee kcet nit iiit gfti',
        icon: SlidersHorizontal,
      },
      {
        id: 'tool-cutoffs',
        group: 'Tools',
        title: 'Cutoff Explorer',
        subtitle: 'Filter multi-year opening & closing ranks across all 7 counselling systems',
        to: '/cutoffs',
        keywords: 'cutoff opening closing rank trends history round josaa jee advanced iit csab reap mht cet wbjee kcet',
        icon: LineChart,
      },
      {
        id: 'tool-choice-builder',
        group: 'Tools',
        title: 'Choice List Builder',
        subtitle: 'Order Dream, Target, and Safer choices for JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET',
        to: '/choice-builder',
        keywords: 'choice preference list order export pdf csv share josaa jee advanced iit csab reap mht cet wbjee kcet',
        icon: ListChecks,
      },
      {
        id: 'tool-colleges',
        group: 'Tools',
        title: 'Colleges Directory',
        subtitle: 'Browse participating IITs, NITs, IIITs, GFTIs, and State Universities',
        to: '/colleges',
        keywords: 'institutes colleges directory iit nit iiit gfti state university iit bombay iit delhi iit madras coep vjti rvce jadavpur mbm',
        icon: Building2,
      },
      {
        id: 'tool-branches',
        group: 'Tools',
        title: 'Branch-First Discovery',
        subtitle: 'Compare CSE, ECE, Mechanical, and more across institutes',
        to: '/branches',
        keywords: 'branches programmes cse ece electrical mechanical civil',
        icon: GitBranch,
      },
      {
        id: 'tool-compare',
        group: 'Tools',
        title: 'Compare Colleges',
        subtitle: 'Side-by-side institute comparison with custom priority weights',
        to: '/compare',
        keywords: 'compare side by side colleges institutes',
        icon: Scale,
      },
      {
        id: 'tool-saved',
        group: 'Tools',
        title: 'Saved Colleges',
        subtitle: 'Review your shortlisted institutes and private notes',
        to: '/saved-colleges',
        keywords: 'saved shortlist bookmarks notes',
        icon: Bookmark,
      },
      {
        id: 'tool-counselling',
        group: 'Tools',
        title: 'Counselling Hub & Dates',
        subtitle: 'JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET schedules, notices & .ics export',
        to: '/counselling',
        keywords: 'dates timeline schedule notices josaa jee advanced iit csab reap mht cet wbjee kcet calendar ics',
        icon: CalendarClock,
      },
      {
        id: 'tool-guides',
        group: 'Tools',
        title: 'Process Guides',
        subtitle: 'Step-by-step counselling procedures and document checklists',
        to: '/guides',
        keywords: 'guides checklist float freeze slide documents',
        icon: BookOpen,
      },
      {
        id: 'tool-glossary',
        group: 'Tools',
        title: 'Admissions Glossary',
        subtitle: 'Clear definitions for CRL, HS/OS quota, PwD, and seat pools',
        to: '/glossary',
        keywords: 'glossary definitions crl quota hs os ai supernumerary',
        icon: FileText,
      },
      {
        id: 'tool-dashboard',
        group: 'Tools',
        title: 'My Workspace',
        subtitle: 'Profile, saved prediction runs, journey tracker, and alerts',
        to: '/dashboard',
        keywords: 'dashboard profile account notifications journey',
        icon: FolderKanban,
      },
    ];

    if (isAdmin) {
      tools.push({
        id: 'tool-admin',
        group: 'Tools',
        title: 'Admin Console',
        subtitle: 'CSV cutoff import, dataset versioning, and error reports',
        to: '/admin',
        keywords: 'admin import csv datasets reports moderation',
        icon: ShieldCheck,
      });
    }

    const instituteItems: CommandItem[] = institutions
      .filter((inst) => inst.status === 'published')
      .map((inst) => ({
        id: `inst-${inst.id}`,
        group: 'Institutes',
        title: inst.name,
        subtitle: `${inst.type} · ${inst.city}, ${inst.state}`,
        to: `/colleges/${inst.slug}`,
        keywords: `${inst.name} ${inst.shortName} ${inst.city} ${inst.state} ${inst.type}`,
        icon: Building2,
      }));

    const systemItems: CommandItem[] = COUNSELLING_SYSTEMS.map((sys) => ({
      id: `sys-${sys.code}`,
      group: 'Counselling Systems',
      title: `${sys.shortName} — ${sys.name}`,
      subtitle: `${sys.examName} · ${sys.status === 'active' ? 'Active (Demo Seed)' : 'Template Ready'}`,
      to: `/counselling/${sys.code}`,
      keywords: `${sys.code} ${sys.shortName} ${sys.name} ${sys.examName}`,
      icon: CalendarClock,
    }));

    return [...tools, ...instituteItems, ...systemItems];
  }, [institutions, isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        ...allItems.filter((i) => i.group === 'Tools').slice(0, 8),
        ...allItems.filter((i) => i.group === 'Institutes').slice(0, 5),
      ];
    }
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [allItems, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((idx) => (filtered.length === 0 ? 0 : (idx + 1) % filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((idx) =>
          filtered.length === 0 ? 0 : (idx - 1 + filtered.length) % filtered.length
        );
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        navigate(filtered[selectedIndex].to);
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, selectedIndex, navigate, onClose]);

  if (!open) return null;

  const grouped: { group: CommandItem['group']; items: { item: CommandItem; flatIndex: number }[] }[] = [];
  filtered.forEach((item, flatIndex) => {
    let bucket = grouped.find((g) => g.group === item.group);
    if (!bucket) {
      bucket = { group: item.group, items: [] };
      grouped.push(bucket);
    }
    bucket.items.push({ item, flatIndex });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 backdrop-blur-[2px] pt-[12vh] px-4 no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick navigation and search"
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 h-13 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a tool, college, or system (JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE, KCET)..."
            className="flex-1 bg-transparent text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center space-y-1">
              <p className="text-sm font-medium text-[#0B1F3A]">No matching tools or institutes</p>
              <p className="text-xs text-slate-500">
                Try searching for &ldquo;IIT&rdquo;, &ldquo;NIT&rdquo;, &ldquo;Cutoffs&rdquo;, &ldquo;Choice Builder&rdquo;, or &ldquo;JEE Advanced&rdquo;.
              </p>
            </div>
          ) : (
            grouped.map((section) => (
              <div key={section.group} className="mb-2 last:mb-0">
                <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.group}
                </div>
                <div>
                  {section.items.map(({ item, flatIndex }) => {
                    const Icon = item.icon;
                    const active = flatIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        onClick={() => {
                          navigate(item.to);
                          onClose();
                        }}
                        className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors ${
                          active ? 'bg-blue-50/90 text-[#1D4ED8]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${active ? 'text-[#1D4ED8]' : 'text-slate-400'}`}
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                active ? 'text-[#0B1F3A]' : 'text-[#0F172A]'
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                            active ? 'opacity-100 text-[#1D4ED8]' : 'opacity-0'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Keyboard hint bar */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Use ↑↓ to navigate · Enter to open</span>
          <span className="font-mono">Famral Navigator</span>
        </div>
      </div>
    </div>
  );
};
