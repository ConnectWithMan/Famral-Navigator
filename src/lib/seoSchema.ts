import { COUNSELLING_SYSTEMS, getSystemConfig } from '../config/systems/registry.ts';
import {
  SEED_CONTENT_ITEMS,
  SEED_INSTITUTIONS,
  SEED_PROGRAMMES,
  SEED_SCHEDULES,
} from '../data/demoSeed.ts';
import type {
  ContentItem,
  CounsellingSystemConfig,
  Institution,
  Programme,
  ScheduleItem,
} from '../types/domain.ts';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface RouteSeoMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  ogType: 'website' | 'article';
  ogImagePath: string;
  ogImageAlt: string;
  noIndex: boolean;
  jsonLd: Record<string, unknown>[];
}

export const SITE_NAME = 'Famral Navigator';
export const DEFAULT_OG_IMAGE_PATH = '/pwa-512x512.png';
export const DEFAULT_OG_IMAGE_ALT =
  'Famral Navigator — College Admission Intelligence for JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET';

export function buildAbsoluteUrl(baseUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${cleanBase}${cleanPath}`;
}

export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
  baseUrl: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: idx + 1,
        name: item.label,
      };
      if (item.to) {
        entry.item = buildAbsoluteUrl(baseUrl, item.to);
      }
      return entry;
    }),
  };
}

export function buildHomeJsonLd(baseUrl: string): Record<string, unknown>[] {
  const siteUrl = buildAbsoluteUrl(baseUrl, '/');
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
      description:
        'From your entrance-exam rank to your counselling preference list, compare historical JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET cutoffs with clarity.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${buildAbsoluteUrl(baseUrl, '/colleges')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: siteUrl,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      inLanguage: 'en-IN',
      description:
        'Historical cutoff comparisons, multi-year rank trends, college comparisons, and counselling preference list builder for Indian undergraduate admissions.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl,
      logo: buildAbsoluteUrl(baseUrl, DEFAULT_OG_IMAGE_PATH),
    },
  ];
}

export function buildCollegeJsonLd(
  inst: Institution,
  progs: Programme[],
  baseUrl: string
): Record<string, unknown> {
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressLocality: inst.city,
    addressRegion: inst.state,
    addressCountry: 'IN',
  };
  if (inst.address) {
    address.streetAddress = inst.address;
  }

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: inst.name,
    alternateName: inst.shortName,
    url: buildAbsoluteUrl(baseUrl, `/colleges/${inst.slug}`),
    description:
      inst.description ||
      inst.overview ||
      `${inst.name} (${inst.type}) in ${inst.city}, ${inst.state}.`,
    address,
  };

  if (inst.establishedYear) {
    node.foundingDate = String(inst.establishedYear);
  }
  if (inst.websiteUrl && /^https?:\/\//i.test(inst.websiteUrl)) {
    node.sameAs = inst.websiteUrl;
  }
  if (inst.imageUrl && /^https?:\/\//i.test(inst.imageUrl)) {
    node.image = inst.imageUrl;
  }
  if (inst.contactPhone) {
    node.telephone = inst.contactPhone.split(' ')[0];
  }
  if (inst.contactEmail) {
    node.email = inst.contactEmail.split(' ')[0];
  }
  if (progs.length > 0) {
    node.department = progs.map((p) => ({
      '@type': 'Organization',
      name: `${p.name} (${p.degree})`,
      url: buildAbsoluteUrl(baseUrl, `/cutoffs/${inst.slug}/${p.code.toLowerCase()}`),
    }));
  }
  return node;
}

export function buildCutoffDatasetJsonLd(opts: {
  name: string;
  description: string;
  canonicalPath: string;
  baseUrl: string;
  academicYear?: string;
  systemName: string;
  isDemo?: boolean;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: opts.name,
    description: opts.isDemo
      ? `${opts.description} Note: Seeded records are labelled Demo data — not an official cutoff.`
      : opts.description,
    url: buildAbsoluteUrl(opts.baseUrl, opts.canonicalPath),
    isAccessibleForFree: true,
    inLanguage: 'en-IN',
    temporalCoverage: opts.academicYear && opts.academicYear !== 'all' ? opts.academicYear : '2023/2025',
    keywords: [
      opts.systemName,
      'Opening Rank',
      'Closing Rank',
      'Historical Cutoffs',
      'Indian Engineering Admissions',
    ],
    variableMeasured: ['Opening Rank', 'Closing Rank', 'Quota', 'Seat Category', 'Seat Pool'],
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: buildAbsoluteUrl(opts.baseUrl, '/'),
    },
  };
}

export function buildCounsellingSystemJsonLd(
  sys: CounsellingSystemConfig,
  schedules: ScheduleItem[],
  baseUrl: string
): Record<string, unknown>[] {
  const pageUrl = buildAbsoluteUrl(baseUrl, `/counselling/${sys.code}`);
  const nodes: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${sys.shortName} Counselling Hub — Dates, Notices & Checklist`,
      url: pageUrl,
      description: `${sys.name}: schedules, notices, eligibility rules, quotas, and document checklist.`,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: buildAbsoluteUrl(baseUrl, '/'),
      },
    },
  ];

  const eventNodes = schedules.slice(0, 8).map((s) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${sys.shortName}: ${s.title}`,
    startDate: s.startDate,
    endDate: s.endDate,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    description: s.description || `${s.phase} milestone for ${sys.name} (AY ${s.academicYear}).`,
    location: {
      '@type': 'VirtualLocation',
      url: sys.officialPortalUrl || pageUrl,
    },
    organizer: {
      '@type': 'Organization',
      name: sys.name,
      url: sys.officialPortalUrl || pageUrl,
    },
  }));

  return [...nodes, ...eventNodes];
}

export function buildCounsellingHubJsonLd(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Counselling Management Hub — JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET',
    url: buildAbsoluteUrl(baseUrl, '/counselling'),
    description:
      'Schedules, notices, eligibility summaries, and document checklists for JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: COUNSELLING_SYSTEMS.map((sys, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: sys.name,
        url: buildAbsoluteUrl(baseUrl, `/counselling/${sys.code}`),
      })),
    },
  };
}

export function buildGlossaryJsonLd(
  terms: ContentItem[],
  baseUrl: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Famral Navigator Admissions Glossary',
    url: buildAbsoluteUrl(baseUrl, '/glossary'),
    description:
      'Plain-language definitions of Indian undergraduate counselling terms including CRL, Category Rank, HS/OS/AI quotas, Female-only seat pools, and counselling rounds.',
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      name: term.title,
      description: term.summary,
      url: buildAbsoluteUrl(baseUrl, `/glossary#${term.slug}`),
    })),
  };
}

export function buildGuidesJsonLd(
  guides: ContentItem[],
  baseUrl: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Counselling Process Guides',
    url: buildAbsoluteUrl(baseUrl, '/guides'),
    itemListElement: guides.map((g, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Article',
        headline: g.title,
        description: g.summary,
        dateModified: g.verifiedAt,
        url: buildAbsoluteUrl(baseUrl, `/guides#${g.slug}`),
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
      },
    })),
  };
}

/**
 * Resolves unique, crawlable SEO metadata & JSON-LD for any pathname on the server
 * (used for SSR/HTML meta injection so crawlers and link unfurlers see exact tags without JS).
 */
export function resolveRouteSeoMeta(pathname: string, baseUrl: string): RouteSeoMetadata {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  // Private / non-indexed routes
  const noIndexPrefixes = [
    '/admin',
    '/dashboard',
    '/saved-colleges',
    '/choice-builder',
    '/shared',
    '/login',
    '/signup',
  ];
  if (noIndexPrefixes.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`))) {
    const labelMap: Record<string, string> = {
      '/admin': 'Admin Console | Famral Navigator',
      '/dashboard': 'My Workspace & Dashboard | Famral Navigator',
      '/saved-colleges': 'Saved Colleges | Famral Navigator',
      '/choice-builder': 'Choice List Builder | Famral Navigator',
      '/login': 'Sign In | Famral Navigator',
      '/signup': 'Create Account | Famral Navigator',
    };
    const title = cleanPath.startsWith('/shared/')
      ? 'Shared Preference List | Famral Navigator'
      : labelMap[cleanPath] || 'Workspace | Famral Navigator';
    return {
      title,
      description: 'Personal student admission planning workspace on Famral Navigator.',
      canonicalPath: cleanPath,
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: true,
      jsonLd: [],
    };
  }

  // Home
  if (cleanPath === '/') {
    return {
      title: 'Famral Navigator – College Predictor & Cutoff Explorer',
      description:
        'Compare historical JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET opening and closing ranks, explore colleges, and build your preference list.',
      canonicalPath: '/',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: buildHomeJsonLd(baseUrl),
    };
  }

  // Predictor: /predictor and /predictor/:system
  if (segments[0] === 'predictor') {
    const sys = segments[1] ? getSystemConfig(segments[1]) : undefined;
    const crumbs: BreadcrumbItem[] = sys
      ? [
          { label: 'Home', to: '/' },
          { label: 'College Predictor', to: '/predictor' },
          { label: sys.shortName },
        ]
      : [{ label: 'Home', to: '/' }, { label: 'College Predictor' }];
    const canonicalPath = sys ? `/predictor/${sys.code}` : '/predictor';
    const title = sys
      ? `${sys.shortName} College Predictor (${sys.examName}) | Famral Navigator`
      : 'College Predictor – JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET | Famral Navigator';
    const description = sys
      ? `Compare your ${sys.examName} rank against historical ${sys.shortName} opening and closing ranks by quota, category, and seat pool.`
      : 'Compare your entrance-exam rank against historical JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET opening and closing ranks.';
    return {
      title,
      description,
      canonicalPath,
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [
        buildBreadcrumbJsonLd(crumbs, baseUrl),
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: sys ? `${sys.shortName} College Predictor` : 'Famral Navigator College Predictor',
          url: buildAbsoluteUrl(baseUrl, canonicalPath),
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'All',
          description,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        },
      ],
    };
  }

  // Colleges Directory & Detail: /colleges, /colleges/:slug, /branches
  if (segments[0] === 'colleges') {
    if (segments[1]) {
      const inst = SEED_INSTITUTIONS.find((i) => i.slug === segments[1]);
      if (inst) {
        const progs = SEED_PROGRAMMES.filter((p) => p.institutionId === inst.id);
        const crumbs: BreadcrumbItem[] = [
          { label: 'Home', to: '/' },
          { label: 'Colleges', to: '/colleges' },
          { label: inst.shortName },
        ];
        const systemsLabel = inst.systems.map((s) => s.toUpperCase()).join('/');
        return {
          title: `${inst.name} Cutoffs, Branches & Admissions | Famral Navigator`,
          description: `Explore ${inst.name} (${inst.type}, ${inst.city}, ${inst.state}) undergraduate B.Tech branches, admission process, and multi-year ${systemsLabel} historical cutoffs.`,
          canonicalPath: `/colleges/${inst.slug}`,
          ogType: 'article',
          ogImagePath: inst.imageUrl || DEFAULT_OG_IMAGE_PATH,
          ogImageAlt: `${inst.name} campus and admission cutoffs`,
          noIndex: false,
          jsonLd: [
            buildBreadcrumbJsonLd(crumbs, baseUrl),
            buildCollegeJsonLd(inst, progs, baseUrl),
          ],
        };
      }
    }
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Colleges Directory' }];
    return {
      title: 'Participating Colleges – IITs, NITs, IIITs, GFTIs & State Universities | Famral Navigator',
      description:
        'Browse and filter participating IITs, NITs, IIITs, GFTIs, and State Universities across JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE, and KCET with historical cutoffs.',
      canonicalPath: '/colleges',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [
        buildBreadcrumbJsonLd(crumbs, baseUrl),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Participating Colleges Directory',
          url: buildAbsoluteUrl(baseUrl, '/colleges'),
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: SEED_INSTITUTIONS.length,
            itemListElement: SEED_INSTITUTIONS.slice(0, 20).map((inst, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: inst.name,
              url: buildAbsoluteUrl(baseUrl, `/colleges/${inst.slug}`),
            })),
          },
        },
      ],
    };
  }

  if (cleanPath === '/branches') {
    const crumbs: BreadcrumbItem[] = [
      { label: 'Home', to: '/' },
      { label: 'Colleges', to: '/colleges' },
      { label: 'Browse by Branch' },
    ];
    return {
      title: 'Browse Engineering Colleges by Branch – CSE, ECE, EE & More | Famral Navigator',
      description:
        'Select an engineering branch and compare participating JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET institutes by historical closing ranks.',
      canonicalPath: '/branches',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl)],
    };
  }

  // Cutoffs Explorer: /cutoffs, /cutoffs/:system, /cutoffs/:system/:year, /cutoffs/:collegeSlug/:courseCode
  if (segments[0] === 'cutoffs') {
    const p1 = segments[1];
    const p2 = segments[2];
    const matchedSys = p1 ? getSystemConfig(p1) : undefined;
    if (matchedSys) {
      const year = p2 && /^\d{4}$/.test(p2) ? p2 : undefined;
      const canonicalPath = year ? `/cutoffs/${matchedSys.code}/${year}` : `/cutoffs/${matchedSys.code}`;
      const crumbs: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Cutoffs', to: '/cutoffs' },
        ...(year
          ? [
              { label: matchedSys.shortName, to: `/cutoffs/${matchedSys.code}` },
              { label: `${year} Cutoffs` },
            ]
          : [{ label: `${matchedSys.shortName} Cutoffs` }]),
      ];
      const title = year
        ? `${matchedSys.shortName} ${year} Opening & Closing Ranks | Famral Navigator`
        : `${matchedSys.shortName} Opening & Closing Ranks Explorer | Famral Navigator`;
      const description = `Explore historical ${matchedSys.shortName}${year ? ` ${year}` : ''} opening and closing ranks across rounds, quotas, and categories with YoY trend charts.`;
      return {
        title,
        description,
        canonicalPath,
        ogType: 'website',
        ogImagePath: DEFAULT_OG_IMAGE_PATH,
        ogImageAlt: DEFAULT_OG_IMAGE_ALT,
        noIndex: false,
        jsonLd: [
          buildBreadcrumbJsonLd(crumbs, baseUrl),
          buildCutoffDatasetJsonLd({
            name: `${matchedSys.shortName}${year ? ` ${year}` : ''} Historical Cutoffs`,
            description,
            canonicalPath,
            baseUrl,
            academicYear: year,
            systemName: matchedSys.shortName,
            isDemo: true,
          }),
        ],
      };
    }

    if (p1) {
      const inst = SEED_INSTITUTIONS.find((i) => i.slug === p1);
      if (inst) {
        const prog = p2
          ? SEED_PROGRAMMES.find(
              (pr) =>
                pr.institutionId === inst.id &&
                (pr.code.toLowerCase() === p2.toLowerCase() ||
                  pr.name.toLowerCase().includes(p2.replace(/-/g, ' ').toLowerCase()))
            )
          : undefined;
        const canonicalPath = prog
          ? `/cutoffs/${inst.slug}/${prog.code.toLowerCase()}`
          : `/cutoffs/${inst.slug}`;
        const sys = getSystemConfig(inst.systems[0] ?? 'josaa');
        const crumbs: BreadcrumbItem[] = [
          { label: 'Home', to: '/' },
          { label: 'Cutoffs', to: '/cutoffs' },
          { label: inst.shortName, to: `/colleges/${inst.slug}` },
          ...(prog ? [{ label: `${prog.code} Cutoffs` }] : [{ label: 'Cutoffs' }]),
        ];
        const title = prog
          ? `${inst.shortName} ${prog.name} Cutoffs (${sys?.shortName ?? 'Counselling'}) | Famral Navigator`
          : `${inst.name} Opening & Closing Ranks | Famral Navigator`;
        const description = prog
          ? `Inspect historical ${sys?.shortName ?? ''} opening and closing ranks, YoY shifts, and round-wise movement for ${prog.name} at ${inst.name}.`
          : `Inspect multi-year historical opening and closing ranks and round movement for ${inst.name} (${inst.city}, ${inst.state}).`;
        return {
          title,
          description,
          canonicalPath,
          ogType: 'article',
          ogImagePath: inst.imageUrl || DEFAULT_OG_IMAGE_PATH,
          ogImageAlt: `${inst.name} historical cutoffs`,
          noIndex: false,
          jsonLd: [
            buildBreadcrumbJsonLd(crumbs, baseUrl),
            buildCutoffDatasetJsonLd({
              name: title.replace(' | Famral Navigator', ''),
              description,
              canonicalPath,
              baseUrl,
              systemName: sys?.shortName ?? 'Counselling',
              isDemo: inst.isDemo,
            }),
          ],
        };
      }
    }

    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Cutoff Explorer' }];
    return {
      title: 'Opening & Closing Rank Explorer – JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET | Famral Navigator',
      description:
        'Filter multi-year opening and closing ranks, year-over-year changes, and round-by-round movement across JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET.',
      canonicalPath: '/cutoffs',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [
        buildBreadcrumbJsonLd(crumbs, baseUrl),
        buildCutoffDatasetJsonLd({
          name: 'Indian Engineering Admissions Historical Cutoffs',
          description:
            'Historical opening and closing ranks across JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET.',
          canonicalPath: '/cutoffs',
          baseUrl,
          systemName: 'JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE, KCET',
          isDemo: true,
        }),
      ],
    };
  }

  // Counselling Hub & System Pages: /counselling, /counselling/:system
  if (segments[0] === 'counselling') {
    const sys = segments[1] ? getSystemConfig(segments[1]) : undefined;
    if (sys) {
      const sysSchedules = SEED_SCHEDULES.filter(
        (s) => s.systemCode.toLowerCase() === sys.code.toLowerCase()
      );
      const crumbs: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Counselling Hub', to: '/counselling' },
        { label: sys.shortName },
      ];
      return {
        title: `${sys.shortName} Counselling Hub – Dates, Notices & Checklist | Famral Navigator`,
        description: `${sys.name} (${sys.examName}): important counselling dates, notices, quota rules, document checklist, and calendar export on Famral Navigator.`,
        canonicalPath: `/counselling/${sys.code}`,
        ogType: 'article',
        ogImagePath: DEFAULT_OG_IMAGE_PATH,
        ogImageAlt: `${sys.shortName} Counselling Hub on Famral Navigator`,
        noIndex: false,
        jsonLd: [
          buildBreadcrumbJsonLd(crumbs, baseUrl),
          ...buildCounsellingSystemJsonLd(sys, sysSchedules, baseUrl),
        ],
      };
    }
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Counselling Hub' }];
    return {
      title: 'Counselling Hub – JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE & KCET | Famral Navigator',
      description:
        'Track JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET counselling timelines, official notices, document checklists, and .ics calendar exports.',
      canonicalPath: '/counselling',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl), buildCounsellingHubJsonLd(baseUrl)],
    };
  }

  // Compare
  if (cleanPath === '/compare') {
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Compare Colleges' }];
    return {
      title: 'Compare Engineering Colleges Side by Side | Famral Navigator',
      description:
        'Compare 2 to 4 participating JoSAA, JEE Advanced (IITs), CSAB, REAP, MHT CET, WBJEE, and KCET colleges side by side using stored cutoffs and personal priority weights.',
      canonicalPath: '/compare',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl)],
    };
  }

  // Guides & Glossary
  if (cleanPath === '/guides') {
    const guides = SEED_CONTENT_ITEMS.filter((c) => c.kind === 'guide');
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Process Guides' }];
    return {
      title: 'Counselling Process Guides – Freeze, Float, Slide & Verification | Famral Navigator',
      description:
        'Step-by-step counselling guides covering Freeze/Float/Slide willingness rules, document verification, and multi-round transitions.',
      canonicalPath: '/guides',
      ogType: 'article',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl), buildGuidesJsonLd(guides, baseUrl)],
    };
  }

  if (cleanPath === '/glossary') {
    const terms = SEED_CONTENT_ITEMS.filter((c) => c.kind === 'glossary');
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Admissions Glossary' }];
    return {
      title: 'Admissions Glossary – CRL, Category Rank, Quotas & Seat Pools | Famral Navigator',
      description:
        'Clear definitions of Indian engineering counselling terms including CRL, Category Rank, HS/OS/AI quotas, Female-only seat pools, and counselling rounds.',
      canonicalPath: '/glossary',
      ogType: 'article',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl), buildGlossaryJsonLd(terms, baseUrl)],
    };
  }

  // Legal pages
  if (cleanPath === '/privacy') {
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }];
    return {
      title: 'Privacy Policy & Student Data Control | Famral Navigator',
      description:
        'How Famral Navigator protects student ranks, saved colleges, and preference lists with zero data selling and full export or deletion controls.',
      canonicalPath: '/privacy',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl)],
    };
  }

  if (cleanPath === '/terms') {
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Terms of Use' }];
    return {
      title: 'Terms of Use | Famral Navigator',
      description:
        'Terms governing use of the Famral Navigator college admission intelligence and preference list planning platform.',
      canonicalPath: '/terms',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl)],
    };
  }

  if (cleanPath === '/disclaimer') {
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }, { label: 'Data Disclaimer' }];
    return {
      title: 'Data & Historical Comparison Disclaimer | Famral Navigator',
      description:
        'Important disclaimer regarding demo datasets, historical cutoff comparisons, rank-type separation, and admission uncertainty.',
      canonicalPath: '/disclaimer',
      ogType: 'website',
      ogImagePath: DEFAULT_OG_IMAGE_PATH,
      ogImageAlt: DEFAULT_OG_IMAGE_ALT,
      noIndex: false,
      jsonLd: [buildBreadcrumbJsonLd(crumbs, baseUrl)],
    };
  }

  // Fallback / 404
  return {
    title: 'Page Not Found | Famral Navigator',
    description: 'The requested page on Famral Navigator could not be found.',
    canonicalPath: cleanPath,
    ogType: 'website',
    ogImagePath: DEFAULT_OG_IMAGE_PATH,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    noIndex: true,
    jsonLd: [],
  };
}
