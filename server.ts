import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COUNSELLING_SYSTEMS, getSystemConfig } from './src/config/systems/registry.ts';
import { SEED_CUTOFFS, SEED_INSTITUTIONS, SEED_PROGRAMMES } from './src/data/demoSeed.ts';
import { runPrediction } from './src/engine/predictor.ts';
import { validateCutoffCsv } from './src/engine/csvValidator.ts';
import { buildAbsoluteUrl, resolveRouteSeoMeta } from './src/lib/seoSchema.ts';
import type { PredictionInput } from './src/types/domain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Simple in-memory sliding-window rate limiter per IP for public API routes
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

function rateLimit(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const ip =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
      : req.ip) || 'local';
  const now = Date.now();
  const entry = rateBucket.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateBucket.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Too many requests. Please wait a minute before trying again.',
    });
    return;
  }
  entry.count += 1;
  next();
}

function resolveBaseUrl(req: express.Request): string {
  if (process.env.APP_URL && /^https?:\/\//i.test(process.env.APP_URL)) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const host = req.get('host') || `localhost:${PORT}`;
  const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : req.protocol || 'http';
  return `${proto}://${host}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeJsonLdSafe(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

function injectSeoIntoHtml(html: string, pathname: string, baseUrl: string): string {
  const meta = resolveRouteSeoMeta(pathname, baseUrl);
  const canonicalUrl = buildAbsoluteUrl(baseUrl, meta.canonicalPath);
  const ogImageUrl = buildAbsoluteUrl(baseUrl, meta.ogImagePath);
  const robotsValue = meta.noIndex ? 'noindex, nofollow' : 'index, follow';

  const seoHeadBlock = [
    `<title>${escapeHtmlAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`,
    `<meta name="robots" content="${robotsValue}" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:site_name" content="Famral Navigator" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(ogImageUrl)}" />`,
    `<meta property="og:image:alt" content="${escapeHtmlAttr(meta.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(ogImageUrl)}" />`,
    ...meta.jsonLd.map(
      (node) =>
        `<script type="application/ld+json" data-famral-seo="true">${serializeJsonLdSafe(node)}</script>`
    ),
  ].join('\n    ');

  // Strip default static SEO tags before injecting route-specific ones
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, '')
    .replace(/<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');

  return cleaned.replace(/<\/head>/i, `    ${seoHeadBlock}\n  </head>`);
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  // Basic security headers (keep iframe-compatible for AI Studio preview)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // SEO: robots.txt
  app.get('/robots.txt', (req, res) => {
    const base = resolveBaseUrl(req);
    const body = [
      'User-agent: *',
      'Allow: /',
      'Allow: /colleges',
      'Allow: /cutoffs',
      'Allow: /counselling',
      'Allow: /predictor',
      'Allow: /branches',
      'Allow: /compare',
      'Allow: /guides',
      'Allow: /glossary',
      'Disallow: /admin',
      'Disallow: /dashboard',
      'Disallow: /saved-colleges',
      'Disallow: /choice-builder',
      'Disallow: /shared/',
      'Disallow: /login',
      'Disallow: /signup',
      'Disallow: /api/',
      '',
      `Sitemap: ${base}/sitemap.xml`,
      '',
    ].join('\n');
    res.type('text/plain; charset=utf-8').send(body);
  });

  // SEO: dynamic XML sitemap
  app.get('/sitemap.xml', (req, res) => {
    const base = resolveBaseUrl(req);
    const today = new Date().toISOString().slice(0, 10);

    interface SitemapEntry {
      loc: string;
      lastmod: string;
      changefreq: 'daily' | 'weekly' | 'monthly';
      priority: string;
    }

    const entries = new Map<string, SitemapEntry>();
    const addEntry = (
      routePath: string,
      priority: string,
      changefreq: 'daily' | 'weekly' | 'monthly' = 'weekly',
      lastmod = today
    ) => {
      if (!entries.has(routePath)) {
        entries.set(routePath, { loc: `${base}${routePath}`, lastmod, changefreq, priority });
      }
    };

    // Core public hubs
    addEntry('/', '1.0', 'daily');
    addEntry('/predictor', '0.95', 'weekly');
    addEntry('/cutoffs', '0.95', 'weekly');
    addEntry('/counselling', '0.9', 'weekly');
    addEntry('/colleges', '0.9', 'weekly');
    addEntry('/branches', '0.85', 'weekly');
    addEntry('/compare', '0.8', 'weekly');
    addEntry('/guides', '0.8', 'monthly');
    addEntry('/glossary', '0.8', 'monthly');
    addEntry('/privacy', '0.3', 'monthly');
    addEntry('/terms', '0.3', 'monthly');
    addEntry('/disclaimer', '0.4', 'monthly');

    // Active counselling systems: Hub, Predictor, Cutoffs, and Year-specific Cutoffs
    for (const sys of COUNSELLING_SYSTEMS) {
      addEntry(`/counselling/${sys.code}`, '0.9', 'weekly');
      if (sys.status === 'active') {
        addEntry(`/predictor/${sys.code}`, '0.9', 'weekly');
        addEntry(`/cutoffs/${sys.code}`, '0.9', 'weekly');
        for (const yr of sys.availableYears) {
          addEntry(`/cutoffs/${sys.code}/${yr}`, '0.85', 'weekly');
        }
      }
    }

    // Participating colleges and their actual programme-level cutoff URLs
    const progsByInst = new Map<string, typeof SEED_PROGRAMMES>();
    for (const prog of SEED_PROGRAMMES) {
      const list = progsByInst.get(prog.institutionId) ?? [];
      list.push(prog);
      progsByInst.set(prog.institutionId, list);
    }

    for (const inst of SEED_INSTITUTIONS) {
      if (inst.status !== 'published') continue;
      const lastmod = inst.verifiedAt || today;
      addEntry(`/colleges/${inst.slug}`, '0.85', 'weekly', lastmod);
      const instProgs = progsByInst.get(inst.id) ?? [];
      for (const prog of instProgs) {
        addEntry(
          `/cutoffs/${inst.slug}/${prog.code.toLowerCase()}`,
          '0.75',
          'weekly',
          lastmod
        );
      }
    }

    const xmlEntries = Array.from(entries.values())
      .map(
        (e) =>
          `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${escapeXml(e.lastmod)}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>\n`;
    res.type('application/xml; charset=utf-8').send(xml);
  });

  // API: Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Famral Navigator',
      systemsActive: COUNSELLING_SYSTEMS.filter((s) => s.status === 'active').map((s) => s.code),
      timestamp: new Date().toISOString(),
    });
  });

  // API: Pure Prediction Engine Endpoint (validated + rate-limited)
  app.post('/api/predict', rateLimit, (req, res) => {
    const body = req.body as Partial<PredictionInput> | null;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object.' });
      return;
    }

    const system = getSystemConfig(String(body.systemCode || 'josaa'));
    if (!system) {
      res.status(400).json({ error: `Unsupported counselling system "${String(body.systemCode)}".` });
      return;
    }

    const input: PredictionInput = {
      examCode: String(body.examCode || system.examCode),
      systemCode: system.code,
      academicYear: Number(body.academicYear),
      roundNumber: Number(body.roundNumber),
      crlRank: body.crlRank != null ? Number(body.crlRank) : null,
      categoryRank: body.categoryRank != null ? Number(body.categoryRank) : null,
      category: String(body.category || 'OPEN'),
      isPwd: Boolean(body.isPwd),
      gender: body.gender === 'Female-only' ? 'Female-only' : 'Gender-Neutral',
      homeState: String(body.homeState || ''),
      nearMarginPercent:
        body.nearMarginPercent != null ? Number(body.nearMarginPercent) : system.defaultNearMarginPercent,
      instituteTypes: Array.isArray(body.instituteTypes) ? body.instituteTypes : undefined,
      preferredBranches: Array.isArray(body.preferredBranches) ? body.preferredBranches : undefined,
      preferredStates: Array.isArray(body.preferredStates) ? body.preferredStates : undefined,
      preferredInstitutionIds: Array.isArray(body.preferredInstitutionIds)
        ? body.preferredInstitutionIds
        : undefined,
    };

    const result = runPrediction(input, SEED_CUTOFFS, system);
    res.status(result.valid ? 200 : 400).json(result);
  });

  // API: Server-side CSV Validation Endpoint (rate-limited, never writes directly)
  app.post('/api/validate-csv', rateLimit, (req, res) => {
    const body = req.body as { systemCode?: string; csvText?: string } | null;
    if (!body || typeof body.csvText !== 'string' || body.csvText.length === 0) {
      res.status(400).json({ error: 'csvText is required.' });
      return;
    }
    const system = getSystemConfig(String(body.systemCode || 'josaa'));
    if (!system) {
      res.status(400).json({ error: 'Invalid counselling systemCode.' });
      return;
    }
    const result = validateCutoffCsv(
      body.csvText,
      system,
      SEED_INSTITUTIONS,
      SEED_PROGRAMMES,
      `api_preview_${Date.now().toString(36)}`
    );
    res.status(result.valid ? 200 : 422).json(result);
  });

  if (!IS_PROD) {
    // In Express middleware mode with HMR disabled, Vite 8 still injects /@vite/client
    // which attempts to open a WebSocket to port 24678. Serve a faithful no-WebSocket
    // client module that preserves CSS style injection and HMR context hooks cleanly.
    const NO_WS_VITE_CLIENT = `
const sheetsMap = new Map();
let lastInsertedStyle;

export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}

export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}

export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (search ? "&" + search.slice(1) : "") + (hash || "");
}

export class ErrorOverlay extends HTMLElement {}
`;
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript; charset=utf-8').send(NO_WS_VITE_CLIENT);
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: false,
        hmr: false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Server-side SEO metadata & JSON-LD injection for SPA routes in dev mode
    app.get('*', async (req, res, next) => {
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        const rawHtml = fs.readFileSync(indexPath, 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        const withSeo = injectSeoIntoHtml(transformed, req.path, resolveBaseUrl(req));
        res.status(200).type('text/html; charset=utf-8').send(withSeo);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        const rawHtml = fs.readFileSync(indexFile, 'utf-8');
        const withSeo = injectSeoIntoHtml(rawHtml, req.path, resolveBaseUrl(req));
        res.status(200).type('text/html; charset=utf-8').send(withSeo);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Famral Navigator listening on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'dev'})`);
  });
}

void startServer();
