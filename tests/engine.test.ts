import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { COUNSELLING_SYSTEMS, getSystemConfig } from '../src/config/systems/registry.ts';
import { SEED_CUTOFFS, SEED_INSTITUTIONS, SEED_PROGRAMMES } from '../src/data/demoSeed.ts';
import {
  classifyRankAgainstClosing,
  evaluateQuotaEligibility,
  runPrediction,
  validatePredictionInput,
} from '../src/engine/predictor.ts';
import {
  analyzeChoiceList,
  computePersonalComparisonTable,
  computeRoundWiseMovement,
  computeWhatIfScenarios,
  computeYoYChange,
} from '../src/engine/analytics.ts';
import { generateCsvTemplate, validateCutoffCsv } from '../src/engine/csvValidator.ts';
import { resolveRouteSeoMeta } from '../src/lib/seoSchema.ts';
import type { ChoiceListItem, CutoffRecord, PredictionInput } from '../src/types/domain.ts';

const josaa = getSystemConfig('josaa')!;
const jeeAdv = getSystemConfig('jee-advanced')!;
const csab = getSystemConfig('csab')!;
const reap = getSystemConfig('reap')!;

describe('Prediction Engine — Classification & Boundary Ranks', () => {
  it('classifies within, near, and beyond closing rank accurately at boundaries', () => {
    // Closing rank 10000 with 10% near margin -> nearUpperBound = 11000
    expect(classifyRankAgainstClosing(10000, 10000, 10)).toEqual({
      band: 'within',
      nearUpperBound: 11000,
    });
    expect(classifyRankAgainstClosing(10001, 10000, 10)).toEqual({
      band: 'near',
      nearUpperBound: 11000,
    });
    expect(classifyRankAgainstClosing(11000, 10000, 10)).toEqual({
      band: 'near',
      nearUpperBound: 11000,
    });
    expect(classifyRankAgainstClosing(11001, 10000, 10)).toEqual({
      band: 'beyond',
      nearUpperBound: 11000,
    });
  });

  it('respects custom nearMarginPercent configuration', () => {
    expect(classifyRankAgainstClosing(11500, 10000, 20).band).toBe('near');
    expect(classifyRankAgainstClosing(10500, 10000, 0).band).toBe('beyond');
  });
});

describe('Prediction Engine — Validation & Strict Rank-Type Guard', () => {
  it('rejects missing categoryRank for OBC-NCL in JoSAA (never falls back to CRL)', () => {
    const input: PredictionInput = {
      examCode: 'jee-main',
      systemCode: 'josaa',
      academicYear: 2025,
      roundNumber: 6,
      crlRank: 15000,
      categoryRank: null,
      category: 'OBC-NCL',
      isPwd: false,
      gender: 'Gender-Neutral',
      homeState: 'Uttar Pradesh',
    };
    const result = runPrediction(input, SEED_CUTOFFS, josaa);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'categoryRank')).toBe(true);
    expect(result.matches).toHaveLength(0);
  });

  it('uses CRL for OBC-NCL in CSAB Special Rounds per CSAB config', () => {
    const input: PredictionInput = {
      examCode: 'jee-main',
      systemCode: 'csab',
      academicYear: 2025,
      roundNumber: 2,
      crlRank: 18000,
      categoryRank: null,
      category: 'OBC-NCL',
      isPwd: false,
      gender: 'Gender-Neutral',
      homeState: 'Uttar Pradesh',
    };
    const result = runPrediction(input, SEED_CUTOFFS, csab);
    expect(result.valid).toBe(true);
    expect(result.evaluatedRankType).toBe('CRL');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.every((m) => m.cutoff.rankType === 'CRL')).toBe(true);
  });

  it('uses CATEGORY_RANK for OPEN (PwD) in JoSAA', () => {
    const validation = validatePredictionInput(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 6,
        crlRank: 50000,
        categoryRank: 180,
        category: 'OPEN',
        isPwd: true,
        gender: 'Gender-Neutral',
        homeState: 'Tamil Nadu',
      },
      josaa
    );
    expect(validation.errors).toHaveLength(0);
    expect(validation.effectiveCategory).toBe('OPEN (PwD)');
    expect(validation.evaluatedRankType).toBe('CATEGORY_RANK');
    expect(validation.evaluatedRank).toBe(180);
  });

  it('rejects invalid rank, missing home state, and out-of-range margin with specific field errors', () => {
    const validation = validatePredictionInput(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 6,
        crlRank: -5,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: '',
        nearMarginPercent: 40,
      },
      josaa
    );
    const fields = validation.errors.map((e) => e.field);
    expect(fields).toContain('crlRank');
    expect(fields).toContain('homeState');
    expect(fields).toContain('nearMarginPercent');
  });
});

describe('Prediction Engine — Quotas, Seat Pools & Empty-State Explanations', () => {
  it('matches HS seats for home-state NITs, OS seats for out-of-state NITs, and AI seats for IIITs', () => {
    const result = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 6,
        crlRank: 12000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Tamil Nadu',
      },
      SEED_CUTOFFS,
      josaa
    );
    expect(result.valid).toBe(true);
    const nitTrichyMatches = result.matches.filter((m) => m.cutoff.institutionSlug === 'nit-trichy');
    expect(nitTrichyMatches.length).toBeGreaterThan(0);
    expect(nitTrichyMatches.every((m) => m.cutoff.quota === 'HS')).toBe(true);

    const nitWarangalMatches = result.matches.filter((m) => m.cutoff.institutionSlug === 'nit-warangal');
    expect(nitWarangalMatches.length).toBeGreaterThan(0);
    expect(nitWarangalMatches.every((m) => m.cutoff.quota === 'OS')).toBe(true);

    const iiitMatches = result.matches.filter((m) => m.cutoff.institutionType === 'IIIT');
    expect(iiitMatches.length).toBeGreaterThan(0);
    expect(iiitMatches.every((m) => m.cutoff.quota === 'AI')).toBe(true);
  });

  it('applies special state quota GO only to Goa candidates at Goa institutes', () => {
    const goaRule = josaa.allowedQuotas.find((q) => q.code === 'GO')!;
    const nitGoaCutoff = SEED_CUTOFFS.find(
      (c) => c.institutionSlug === 'nit-goa' && c.quota === 'GO'
    )!;
    expect(evaluateQuotaEligibility(goaRule, 'Goa', nitGoaCutoff).eligible).toBe(true);
    expect(evaluateQuotaEligibility(goaRule, 'Maharashtra', nitGoaCutoff).eligible).toBe(false);
  });

  it('grants Female-only candidates access to both Female-only and Gender-Neutral pools', () => {
    const femaleResult = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 6,
        crlRank: 10000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Female-only',
        homeState: 'Uttar Pradesh',
      },
      SEED_CUTOFFS,
      josaa
    );
    const pools = new Set(femaleResult.matches.map((m) => m.cutoff.seatPool));
    expect(pools.has('Female-only')).toBe(true);
    expect(pools.has('Gender-Neutral')).toBe(true);

    const gnResult = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 6,
        crlRank: 10000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Uttar Pradesh',
      },
      SEED_CUTOFFS,
      josaa
    );
    expect(gnResult.matches.every((m) => m.cutoff.seatPool === 'Gender-Neutral')).toBe(true);
  });

  it('returns clear emptyReason when dataset, year, or round has no published records', () => {
    const noSystemData = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'reap',
        academicYear: 2025,
        roundNumber: 1,
        crlRank: 10000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Rajasthan',
      },
      [],
      reap
    );
    expect(noSystemData.valid).toBe(true);
    expect(noSystemData.emptyReason).toContain('REAP');

    const missingYear = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2020,
        roundNumber: 6,
        crlRank: 10000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Uttar Pradesh',
      },
      SEED_CUTOFFS,
      josaa
    );
    expect(missingYear.emptyReason).toContain('2020');

    const missingRound = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 5,
        crlRank: 10000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Uttar Pradesh',
      },
      SEED_CUTOFFS,
      josaa
    );
    expect(missingRound.emptyReason).toContain('Round 5');
  });
});

describe('Active 7-System Coverage — JoSAA, JEE Advanced, CSAB, REAP, MHT CET, WBJEE, KCET', () => {
  it('registers strictly the 7 active counselling systems and excludes unrequested systems', () => {
    expect(COUNSELLING_SYSTEMS.map((s) => s.code)).toEqual([
      'josaa',
      'jee-advanced',
      'csab',
      'reap',
      'mht-cet',
      'wbjee',
      'kcet',
    ]);
    expect(COUNSELLING_SYSTEMS.every((s) => s.status === 'active')).toBe(true);
    expect(getSystemConfig('cuet')).toBeUndefined();
  });

  it('runs JEE Advanced (IIT) prediction without homeState using AI quota only and strict CRL vs Category Rank guards', () => {
    expect(jeeAdv.requiresHomeState).toBe(false);

    const openRes = runPrediction(
      {
        examCode: 'jee-advanced',
        systemCode: 'jee-advanced',
        academicYear: 2025,
        roundNumber: 5,
        crlRank: 1800,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: '',
      },
      SEED_CUTOFFS,
      jeeAdv
    );
    expect(openRes.valid).toBe(true);
    expect(openRes.evaluatedRankType).toBe('CRL');
    expect(openRes.matches.length).toBeGreaterThan(0);
    expect(openRes.matches.every((m) => m.cutoff.systemCode === 'jee-advanced')).toBe(true);
    expect(openRes.matches.every((m) => m.cutoff.institutionType === 'IIT')).toBe(true);
    expect(openRes.matches.every((m) => m.cutoff.quota === 'AI')).toBe(true);
    expect(openRes.matches.every((m) => m.cutoff.isDemo === true)).toBe(true);

    // OBC-NCL without category rank must fail (never fall back to CRL)
    const missingCatRank = runPrediction(
      {
        examCode: 'jee-advanced',
        systemCode: 'jee-advanced',
        academicYear: 2025,
        roundNumber: 5,
        crlRank: 3000,
        categoryRank: null,
        category: 'OBC-NCL',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: '',
      },
      SEED_CUTOFFS,
      jeeAdv
    );
    expect(missingCatRank.valid).toBe(false);
    expect(missingCatRank.errors.some((e) => e.field === 'categoryRank')).toBe(true);

    // OBC-NCL Female-only with category rank matches both Female-only and Gender-Neutral pools
    const femaleObcRes = runPrediction(
      {
        examCode: 'jee-advanced',
        systemCode: 'jee-advanced',
        academicYear: 2025,
        roundNumber: 5,
        crlRank: 5500,
        categoryRank: 1200,
        category: 'OBC-NCL',
        isPwd: false,
        gender: 'Female-only',
        homeState: '',
      },
      SEED_CUTOFFS,
      jeeAdv
    );
    expect(femaleObcRes.valid).toBe(true);
    expect(femaleObcRes.evaluatedRankType).toBe('CATEGORY_RANK');
    expect(femaleObcRes.evaluatedRank).toBe(1200);
    const pools = new Set(femaleObcRes.matches.map((m) => m.cutoff.seatPool));
    expect(pools.has('Female-only')).toBe(true);
    expect(pools.has('Gender-Neutral')).toBe(true);
  });

  it.each([
    { code: 'reap', state: 'Rajasthan', expectedQuota: 'HS', round: 3 },
    { code: 'reap', state: 'Uttar Pradesh', expectedQuota: 'OS', round: 3 },
    { code: 'mht-cet', state: 'Maharashtra', expectedQuota: 'HS', round: 3 },
    { code: 'mht-cet', state: 'Gujarat', expectedQuota: 'AI', round: 3 },
    { code: 'wbjee', state: 'West Bengal', expectedQuota: 'HS', round: 3 },
    { code: 'wbjee', state: 'Bihar', expectedQuota: 'AI', round: 3 },
    { code: 'kcet', state: 'Karnataka', expectedQuota: 'HS', round: 3 },
    { code: 'kcet', state: 'Tamil Nadu', expectedQuota: 'AI', round: 3 },
  ])(
    'runs historical prediction for $code ($state -> $expectedQuota quota) with demo flags preserved',
    ({ code, state, expectedQuota, round }) => {
      const sys = getSystemConfig(code)!;
      const res = runPrediction(
        {
          examCode: sys.examCode,
          systemCode: sys.code,
          academicYear: 2025,
          roundNumber: round,
          crlRank: 8000,
          category: 'OPEN',
          isPwd: false,
          gender: 'Gender-Neutral',
          homeState: state,
        },
        SEED_CUTOFFS,
        sys
      );
      expect(res.valid).toBe(true);
      expect(res.evaluatedRankType).toBe('CRL');
      expect(res.matches.length).toBeGreaterThan(0);
      expect(res.matches.every((m) => m.cutoff.systemCode === code)).toBe(true);
      expect(res.matches.every((m) => m.cutoff.isDemo === true)).toBe(true);
      expect(res.matches.some((m) => m.cutoff.quota === expectedQuota)).toBe(true);
    }
  );
});

describe('Admin CSV Validation Pipeline', () => {
  it('validates generated CSV template with zero errors for JoSAA and JEE Advanced', () => {
    const csv = generateCsvTemplate(josaa);
    const res = validateCutoffCsv(csv, josaa, SEED_INSTITUTIONS, SEED_PROGRAMMES, 'batch_test_1');
    expect(res.valid).toBe(true);
    expect(res.rowErrors).toHaveLength(0);
    expect(res.validRows).toHaveLength(2);

    const jeeAdvCsv = generateCsvTemplate(jeeAdv);
    const jeeAdvRes = validateCutoffCsv(
      jeeAdvCsv,
      jeeAdv,
      SEED_INSTITUTIONS,
      SEED_PROGRAMMES,
      'batch_test_jee_adv'
    );
    expect(jeeAdvRes.valid).toBe(true);
    expect(jeeAdvRes.rowErrors).toHaveLength(0);
    expect(jeeAdvRes.validRows).toHaveLength(2);
  });

  it('rejects missing required columns', () => {
    const badCsv = 'system_code,academic_year\njosaa,2025';
    const res = validateCutoffCsv(badCsv, josaa, SEED_INSTITUTIONS, SEED_PROGRAMMES, 'batch_test_2');
    expect(res.valid).toBe(false);
    expect(res.missingColumns.length).toBeGreaterThan(0);
  });

  it('rejects inverted ranks, rank-type mismatch, unknown institution, and duplicate composite keys', () => {
    const header = josaa.csvColumns.join(',');
    const rows = [
      // Inverted rank (opening 5000 > closing 2000)
      'josaa,jee-main,2025,6,Round 6,nit-trichy,CSE,OS,OPEN,Gender-Neutral,CRL,5000,2000,Official,https://josaa.nic.in,false,2025-07-20',
      // Rank-type mismatch (OBC-NCL in JoSAA must be CATEGORY_RANK, not CRL)
      'josaa,jee-main,2025,6,Round 6,nit-trichy,CSE,OS,OBC-NCL,Gender-Neutral,CRL,300,500,Official,https://josaa.nic.in,false,2025-07-20',
      // Unknown institution slug
      'josaa,jee-main,2025,6,Round 6,unknown-college,CSE,OS,OPEN,Gender-Neutral,CRL,300,500,Official,https://josaa.nic.in,false,2025-07-20',
      // Valid row + duplicate of same composite key
      'josaa,jee-main,2025,6,Round 6,nit-trichy,CSE,HS,OPEN,Gender-Neutral,CRL,2000,3500,Official,https://josaa.nic.in,false,2025-07-20',
      'josaa,jee-main,2025,6,Round 6,nit-trichy,CSE,HS,OPEN,Gender-Neutral,CRL,2000,3600,Official,https://josaa.nic.in,false,2025-07-20',
    ];
    const res = validateCutoffCsv(
      [header, ...rows].join('\n'),
      josaa,
      SEED_INSTITUTIONS,
      SEED_PROGRAMMES,
      'batch_test_3'
    );
    expect(res.valid).toBe(false);
    expect(res.rowErrors.some((e) => e.column === 'closing_rank')).toBe(true);
    expect(res.rowErrors.some((e) => e.column === 'rank_type')).toBe(true);
    expect(res.rowErrors.some((e) => e.column === 'institution_slug')).toBe(true);
    expect(res.duplicateRows).toHaveLength(1);
  });
});

describe('Derived Features — Round Movement, YoY, What-If & Choice List Analyzer', () => {
  const sampleCutoff: CutoffRecord = SEED_CUTOFFS.find(
    (c) =>
      c.systemCode === 'josaa' &&
      c.academicYear === 2025 &&
      c.roundNumber === 6 &&
      c.institutionSlug === 'nit-trichy' &&
      c.seatCategory === 'OPEN' &&
      c.seatPool === 'Gender-Neutral' &&
      c.quota === 'OS'
  )!;

  it('computes round-wise movement strictly in ascending round order', () => {
    const pts = computeRoundWiseMovement(SEED_CUTOFFS, {
      systemCode: 'josaa',
      academicYear: 2025,
      institutionId: sampleCutoff.institutionId,
      programmeId: sampleCutoff.programmeId,
      quota: sampleCutoff.quota,
      seatCategory: sampleCutoff.seatCategory,
      seatPool: sampleCutoff.seatPool,
      rankType: sampleCutoff.rankType,
    });
    expect(pts.map((p) => p.roundNumber)).toEqual([1, 3, 6]);
    expect(pts[2].closingRank).toBeGreaterThanOrEqual(pts[0].closingRank);
  });

  it('computes plain-number year-over-year differences across stored years', () => {
    const yoy = computeYoYChange(SEED_CUTOFFS, {
      systemCode: 'josaa',
      roundNumber: 6,
      institutionId: sampleCutoff.institutionId,
      programmeId: sampleCutoff.programmeId,
      quota: sampleCutoff.quota,
      seatCategory: sampleCutoff.seatCategory,
      seatPool: sampleCutoff.seatPool,
      rankType: sampleCutoff.rankType,
    });
    expect(yoy.map((y) => y.academicYear)).toEqual([2023, 2024, 2025]);
    expect(yoy[0].yoyPercentChange).toBeNull();
    expect(yoy[1].yoyRankDiff).toBe(yoy[1].closingRank - yoy[0].closingRank);
  });

  it('computes What-If explorer scenarios across rank shifts', () => {
    const scenarios = computeWhatIfScenarios(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 6,
        crlRank: 15000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Uttar Pradesh',
      },
      SEED_CUTOFFS,
      josaa
    );
    expect(scenarios).toHaveLength(5);
    // Better rank (-15%) should have >= within matches compared to worse rank (+15%)
    expect(scenarios[0].within).toBeGreaterThanOrEqual(scenarios[4].within);
  });

  it('analyzes choice list without altering order (duplicates, no safer options, beyond closing, missing data)', () => {
    const item1: ChoiceListItem = {
      id: 'c1',
      institutionId: 'inst_nit_trichy',
      institutionSlug: 'nit-trichy',
      institutionName: 'NIT Trichy',
      institutionType: 'NIT',
      state: 'Tamil Nadu',
      programmeId: 'prog_1',
      programmeName: 'Computer Science and Engineering',
      branchGroup: 'Computer Science & IT',
      quota: 'OS',
      seatCategory: 'OPEN',
      seatPool: 'Gender-Neutral',
      rankType: 'CRL',
      closingRank: 1500,
      academicYear: 2025,
      roundLabel: 'Round 6',
      sourceName: 'Demo',
      isDemo: true,
      tag: 'Dream',
      notes: '',
    };
    const item2Dup: ChoiceListItem = { ...item1, id: 'c2', tag: 'Target' };
    const item3Missing: ChoiceListItem = {
      ...item1,
      id: 'c3',
      institutionId: 'inst_bit_mesra',
      programmeId: 'prog_99',
      closingRank: null,
      tag: 'Unassigned',
    };

    const items = [item1, item2Dup, item3Missing];
    const analysis = analyzeChoiceList(items, 12000, 'CRL');

    expect(analysis.totalChoices).toBe(3);
    expect(analysis.countsByTag.Dream).toBe(1);
    expect(analysis.countsByTag.Target).toBe(1);
    expect(analysis.countsByTag.Safer).toBe(0);
    expect(analysis.hasNoSaferOptions).toBe(true);
    expect(analysis.duplicatePairs).toHaveLength(1);
    expect(analysis.beyondClosingChoices).toHaveLength(2);
    expect(analysis.missingHistoricalData).toHaveLength(1);
    // Verify original order was never mutated
    expect(items.map((i) => i.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('computes personal comparison table transparently from stored data', () => {
    const pair = SEED_INSTITUTIONS.slice(0, 2);
    const progCounts: Record<string, number> = {};
    for (const p of SEED_PROGRAMMES) {
      progCounts[p.institutionId] = (progCounts[p.institutionId] ?? 0) + 1;
    }
    const rows = computePersonalComparisonTable(
      pair,
      SEED_CUTOFFS,
      progCounts,
      { closingRank: 40, location: 20, fees: 20, branch: 20 },
      pair[0].state
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].locationMatchFactor).toBe(100);
    expect(rows[0].weightedPersonalScore).not.toBeNull();
  });
});

describe('Security & RBAC Verification — Firestore Rules Contract', () => {
  const rulesText = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

  it('enforces default-deny catch-all and strict email_verified admin gating', () => {
    expect(rulesText).toContain('match /{document=**}');
    expect(rulesText).toContain('allow read, write: if false;');
    expect(rulesText).toContain('request.auth.token.email_verified == true');
    expect(rulesText).toContain('function isAdmin()');
  });

  it('blocks listing sharedLists tokens and scopes private collections to owner', () => {
    expect(rulesText).toContain('match /sharedLists/{shareToken}');
    expect(rulesText).toContain('allow list: if false;');
    expect(rulesText).toContain('match /choiceLists/{listId}');
    expect(rulesText).toContain('isOwner(existing().userId)');
    expect(rulesText).toContain('match /auditLogs/{logId}');
    expect(rulesText).toContain('allow get: if isValidId(logId) && isAdmin();');
    expect(rulesText).toContain('allow list: if isAdmin();');
  });
});

describe('SEO Metadata, Canonical URLs & Schema.org Structured Data', () => {
  const BASE = 'https://navigator.famral.com';

  it('produces unique titles, descriptions, canonical paths, and JSON-LD for college, cutoff, counselling & predictor routes', () => {
    const routes = [
      '/',
      '/colleges',
      '/colleges/iit-bombay',
      '/colleges/nit-trichy',
      '/colleges/coep-pune',
      '/cutoffs',
      '/cutoffs/jee-advanced/2025',
      '/cutoffs/mht-cet/2025',
      '/cutoffs/rvce-bengaluru/cse',
      '/counselling',
      '/counselling/jee-advanced',
      '/counselling/kcet',
      '/predictor',
      '/predictor/jee-advanced',
      '/predictor/wbjee',
      '/guides',
      '/glossary',
    ];

    const metas = routes.map((r) => resolveRouteSeoMeta(r, BASE));
    const uniqueTitles = new Set(metas.map((m) => m.title));
    const uniqueCanonicals = new Set(metas.map((m) => m.canonicalPath));

    expect(uniqueTitles.size).toBe(routes.length);
    expect(uniqueCanonicals.size).toBe(routes.length);
    expect(metas.every((m) => !m.noIndex)).toBe(true);
    expect(metas.every((m) => m.description.length >= 60)).toBe(true);
    expect(metas.every((m) => m.jsonLd.length > 0)).toBe(true);
  });

  it('emits domain-appropriate Schema.org types (CollegeOrUniversity, Dataset, Event, DefinedTermSet, BreadcrumbList)', () => {
    const iitMeta = resolveRouteSeoMeta('/colleges/iit-bombay', BASE);
    expect(iitMeta.jsonLd.some((n) => n['@type'] === 'CollegeOrUniversity')).toBe(true);
    expect(iitMeta.jsonLd.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
    expect(iitMeta.canonicalPath).toBe('/colleges/iit-bombay');

    const collegeMeta = resolveRouteSeoMeta('/colleges/coep-pune', BASE);
    expect(collegeMeta.jsonLd.some((n) => n['@type'] === 'CollegeOrUniversity')).toBe(true);
    expect(collegeMeta.jsonLd.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
    expect(collegeMeta.canonicalPath).toBe('/colleges/coep-pune');

    const cutoffMeta = resolveRouteSeoMeta('/cutoffs/rvce-bengaluru/cse', BASE);
    expect(cutoffMeta.jsonLd.some((n) => n['@type'] === 'Dataset')).toBe(true);
    expect(cutoffMeta.jsonLd.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
    expect(cutoffMeta.title).toContain('RVCE');

    const counsellingMeta = resolveRouteSeoMeta('/counselling/kcet', BASE);
    expect(counsellingMeta.jsonLd.some((n) => n['@type'] === 'Event')).toBe(true);
    expect(counsellingMeta.jsonLd.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);

    const glossaryMeta = resolveRouteSeoMeta('/glossary', BASE);
    expect(glossaryMeta.jsonLd.some((n) => n['@type'] === 'DefinedTermSet')).toBe(true);
  });

  it('marks private account, dashboard, admin, and shared routes as noIndex', () => {
    const privateRoutes = [
      '/admin',
      '/dashboard',
      '/saved-colleges',
      '/choice-builder',
      '/shared/token123',
      '/login',
      '/signup',
    ];
    for (const r of privateRoutes) {
      expect(resolveRouteSeoMeta(r, BASE).noIndex).toBe(true);
    }
  });
});

describe('Detailed Institution Profiles & Complete Central Institute Catalog (23 IITs, 31+ NITs, 26 IIITs, 40+ GFTIs)', () => {
  it('includes all 23 IITs, 31+ NITs (with IIEST Shibpur), 26 IIITs, and 40+ GFTIs with zero duplicate IDs or slugs', () => {
    const iits = SEED_INSTITUTIONS.filter((i) => i.type === 'IIT');
    const nits = SEED_INSTITUTIONS.filter((i) => i.type === 'NIT');
    const iiits = SEED_INSTITUTIONS.filter((i) => i.type === 'IIIT');
    const gftis = SEED_INSTITUTIONS.filter((i) => i.type === 'GFTI');
    const stateUnivs = SEED_INSTITUTIONS.filter((i) => i.type === 'State University');

    expect(iits).toHaveLength(23);
    expect(nits.length).toBeGreaterThanOrEqual(31);
    expect(iiits).toHaveLength(26);
    expect(gftis.length).toBeGreaterThanOrEqual(40);
    expect(stateUnivs.length).toBeGreaterThanOrEqual(16);
    expect(SEED_INSTITUTIONS.length).toBeGreaterThanOrEqual(144);

    // Unique IDs and slugs across institutions, programmes, and cutoffs
    expect(new Set(SEED_INSTITUTIONS.map((i) => i.id)).size).toBe(SEED_INSTITUTIONS.length);
    expect(new Set(SEED_INSTITUTIONS.map((i) => i.slug)).size).toBe(SEED_INSTITUTIONS.length);
    expect(new Set(SEED_PROGRAMMES.map((p) => p.id)).size).toBe(SEED_PROGRAMMES.length);
    expect(new Set(SEED_CUTOFFS.map((c) => c.id)).size).toBe(SEED_CUTOFFS.length);

    // Every institution has at least 1 programme and every programme points to a valid institution
    const instIds = new Set(SEED_INSTITUTIONS.map((i) => i.id));
    for (const prog of SEED_PROGRAMMES) {
      expect(instIds.has(prog.institutionId)).toBe(true);
    }
    const progsByInst = new Map<string, string[]>();
    for (const prog of SEED_PROGRAMMES) {
      const list = progsByInst.get(prog.institutionId) ?? [];
      list.push(prog.code);
      progsByInst.set(prog.institutionId, list);
    }
    for (const inst of SEED_INSTITUTIONS) {
      expect((progsByInst.get(inst.id) ?? []).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('exposes website-verified specialized departments across IITs, NITs, IIITs, and GFTIs', () => {
    const getCodes = (slug: string) => {
      const inst = SEED_INSTITUTIONS.find((i) => i.slug === slug);
      expect(inst, `Missing institution ${slug}`).toBeTruthy();
      return new Set(
        SEED_PROGRAMMES.filter((p) => p.institutionId === inst!.id).map((p) => p.code)
      );
    };

    // Flagship & newly added IITs
    expect(getCodes('iit-kharagpur').has('BARCH')).toBe(true);
    expect(getCodes('iit-kharagpur').has('NAOE')).toBe(true);
    expect(getCodes('iit-kharagpur').has('AGRI')).toBe(true);
    expect(getCodes('iit-bombay').has('AE')).toBe(true);
    expect(getCodes('iit-bombay').has('EP')).toBe(true);
    expect(getCodes('iit-ism-dhanbad').has('MIN')).toBe(true);
    expect(getCodes('iit-ism-dhanbad').has('PETRO')).toBe(true);
    expect(getCodes('iit-bhu-varanasi').has('CER')).toBe(true);
    expect(getCodes('iit-bhu-varanasi').has('PHARM')).toBe(true);
    expect(getCodes('iit-gandhinagar').has('AI')).toBe(true);

    // NITs & IIEST Shibpur
    expect(getCodes('nit-trichy').has('EEE')).toBe(true);
    expect(getCodes('nit-trichy').has('ICE')).toBe(true);
    expect(getCodes('nit-trichy').has('BARCH')).toBe(true);
    expect(getCodes('nit-rourkela').has('CER')).toBe(true);
    expect(getCodes('nit-rourkela').has('FOOD')).toBe(true);
    expect(getCodes('nit-rourkela').has('INDDES')).toBe(true);
    expect(getCodes('iiest-shibpur').has('AE')).toBe(true);
    expect(getCodes('nit-srinagar').has('META')).toBe(true);

    // IIITs (Central + PPP)
    expect(getCodes('iiit-allahabad').has('ITBI')).toBe(true);
    expect(getCodes('iiitdm-jabalpur').has('SMFG')).toBe(true);
    expect(getCodes('iiitdm-jabalpur').has('BDES')).toBe(true);
    expect(getCodes('iiit-nagpur').has('CSHCI')).toBe(true);
    expect(getCodes('iiit-lucknow').has('CSB')).toBe(true);

    // GFTIs
    expect(getCodes('pec-chandigarh').has('AE')).toBe(true);
    expect(getCodes('spa-new-delhi').has('BARCH')).toBe(true);
    expect(getCodes('spa-new-delhi').has('BPLAN')).toBe(true);
    expect(getCodes('niftem-kundli').has('FOOD')).toBe(true);
    expect(getCodes('iict-bhadohi').has('CARPET')).toBe(true);
    expect(getCodes('gati-shakti-vishwavidyalaya').has('RAIL')).toBe(true);
    expect(getCodes('gati-shakti-vishwavidyalaya').has('AIDS')).toBe(true);
  });

  it('reaches all 23 IITs in JEE Advanced and NITs/IIITs/GFTIs in JoSAA & CSAB predictions', () => {
    const advRes = runPrediction(
      {
        examCode: 'jee-advanced',
        systemCode: 'jee-advanced',
        academicYear: 2025,
        roundNumber: 5,
        crlRank: 15000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: '',
      },
      SEED_CUTOFFS,
      jeeAdv
    );
    expect(advRes.valid).toBe(true);
    const matchedIitIds = new Set(advRes.matches.map((m) => m.cutoff.institutionId));
    expect(matchedIitIds.size).toBe(23);

    const josaaRes = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'josaa',
        academicYear: 2025,
        roundNumber: 6,
        crlRank: 35000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Gujarat',
      },
      SEED_CUTOFFS,
      josaa
    );
    expect(josaaRes.valid).toBe(true);
    const josaaSlugs = new Set(josaaRes.matches.map((m) => m.cutoff.institutionSlug));
    expect(josaaSlugs.has('svnit-surat')).toBe(true);
    expect(josaaSlugs.has('iiitdm-jabalpur')).toBe(true);
    expect(josaaSlugs.has('gati-shakti-vishwavidyalaya')).toBe(true);

    const csabRes = runPrediction(
      {
        examCode: 'jee-main',
        systemCode: 'csab',
        academicYear: 2025,
        roundNumber: 2,
        crlRank: 45000,
        category: 'OPEN',
        isPwd: false,
        gender: 'Gender-Neutral',
        homeState: 'Odisha',
      },
      SEED_CUTOFFS,
      csab
    );
    expect(csabRes.valid).toBe(true);
    const csabSlugs = new Set(csabRes.matches.map((m) => m.cutoff.institutionSlug));
    expect(csabSlugs.has('nit-rourkela')).toBe(true);
    expect(csabSlugs.has('iiit-bhubaneswar')).toBe(true);
  });

  it('populates complete structured profile fields for all 144 seeded institutions with explicit demo labeling', () => {
    expect(SEED_INSTITUTIONS.length).toBeGreaterThanOrEqual(144);
    for (const inst of SEED_INSTITUTIONS) {
      expect(inst.ownership).toBeTruthy();
      expect(inst.ownershipDetails).toBeTruthy();
      expect(inst.logoMonogram).toBeTruthy();
      expect(inst.description && inst.description.length).toBeGreaterThan(40);
      expect(inst.address && inst.address.length).toBeGreaterThan(10);
      expect(inst.contactEmail).toBeTruthy();
      expect(inst.contactPhone).toBeTruthy();
      expect(inst.nirfRanking).toBeTruthy();
      expect(inst.accreditation).toBeTruthy();
      expect(inst.coursesOffered && inst.coursesOffered.length).toBeGreaterThan(0);
      expect(inst.entranceExams && inst.entranceExams.length).toBeGreaterThan(0);
      expect(inst.eligibilitySummary).toBeTruthy();
      expect(inst.estimatedTotalFee).toBeTruthy();
      expect(inst.placements?.medianPackage).toBeTruthy();
      expect(inst.placements?.sourceNote).toBeTruthy();
      expect(inst.placements?.isDemo).toBe(true);
      expect(inst.campusFacilities && inst.campusFacilities.length).toBeGreaterThanOrEqual(4);
      expect(inst.studentFacilities && inst.studentFacilities.length).toBeGreaterThanOrEqual(4);
      expect(inst.galleryImages && inst.galleryImages.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('includes both Government and Private institutions for side-by-side comparison', () => {
    const ownerships = new Set(SEED_INSTITUTIONS.map((i) => i.ownership));
    expect(ownerships.has('Government')).toBe(true);
    expect(ownerships.has('Government Aided')).toBe(true);
    expect(ownerships.has('Public-Private (PPP)')).toBe(true);
    expect(ownerships.has('Private')).toBe(true);
  });

  it('includes streetAddress, telephone, and email in CollegeOrUniversity structured data', () => {
    const meta = resolveRouteSeoMeta('/colleges/nit-trichy', 'https://navigator.famral.com');
    const collegeNode = meta.jsonLd.find((n) => n['@type'] === 'CollegeOrUniversity') as
      | Record<string, unknown>
      | undefined;
    expect(collegeNode).toBeTruthy();
    const addr = collegeNode?.address as Record<string, unknown> | undefined;
    expect(addr?.streetAddress).toBeTruthy();
    expect(collegeNode?.telephone).toBeTruthy();
    expect(collegeNode?.email).toBeTruthy();
  });

  it('validates new optional Institution profile fields inside firestore.rules', () => {
    const rulesText = fs.readFileSync(path.resolve('firestore.rules'), 'utf-8');
    expect(rulesText).toContain('function isValidPlacementMap(p)');
    expect(rulesText).toContain('function isValidGalleryList(val)');
    expect(rulesText).toContain("'ownership', 'ownershipDetails'");
    expect(rulesText).toContain("'placements', 'campusFacilities'");
  });
});

