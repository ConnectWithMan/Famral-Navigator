import { useEffect } from 'react';
import {
  BreadcrumbItem,
  buildAbsoluteUrl,
  buildBreadcrumbJsonLd,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
} from './seoSchema.ts';

export interface PageSeoOptions {
  title: string;
  description: string;
  noIndex?: boolean;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  breadcrumbs?: BreadcrumbItem[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DYNAMIC_LD_SELECTOR = 'script[type="application/ld+json"][data-famral-seo="true"]';

export function usePageSeo({
  title,
  description,
  noIndex = false,
  canonicalPath,
  ogType = 'website',
  ogImage,
  ogImageAlt,
  breadcrumbs,
  jsonLd,
}: PageSeoOptions) {
  const serializedBreadcrumbs = breadcrumbs ? JSON.stringify(breadcrumbs) : '';
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const setMeta = (selector: string, attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const origin = window.location.origin;
    const resolvedPath = canonicalPath ?? window.location.pathname;
    const canonicalUrl = buildAbsoluteUrl(origin, resolvedPath);
    const imageUrl = buildAbsoluteUrl(origin, ogImage || DEFAULT_OG_IMAGE_PATH);
    const imageAlt = ogImageAlt || DEFAULT_OG_IMAGE_ALT;

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_IN');
    setMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', imageAlt);

    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

    // Canonical URL
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Robots directive
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = noIndex ? 'noindex, nofollow' : 'index, follow';

    // Replace page-level JSON-LD blocks cleanly on route transitions
    document.querySelectorAll(DYNAMIC_LD_SELECTOR).forEach((el) => el.remove());

    const nodes: Record<string, unknown>[] = [];
    if (serializedBreadcrumbs) {
      const parsedCrumbs = JSON.parse(serializedBreadcrumbs) as BreadcrumbItem[];
      if (parsedCrumbs.length > 0) {
        nodes.push(buildBreadcrumbJsonLd(parsedCrumbs, origin));
      }
    }
    if (serializedJsonLd) {
      const parsed = JSON.parse(serializedJsonLd) as
        | Record<string, unknown>
        | Record<string, unknown>[];
      if (Array.isArray(parsed)) {
        nodes.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        nodes.push(parsed);
      }
    }

    for (const node of nodes) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-famral-seo', 'true');
      script.textContent = JSON.stringify(node);
      document.head.appendChild(script);
    }

    return () => {
      document.querySelectorAll(DYNAMIC_LD_SELECTOR).forEach((el) => el.remove());
    };
  }, [
    title,
    description,
    noIndex,
    canonicalPath,
    ogType,
    ogImage,
    ogImageAlt,
    serializedBreadcrumbs,
    serializedJsonLd,
  ]);
}
