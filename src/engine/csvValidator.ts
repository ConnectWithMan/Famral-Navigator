import {
  CounsellingSystemConfig,
  CsvRowValidationError,
  CsvValidationResult,
  CutoffRecord,
  Institution,
  Programme,
  RankType,
  SeatPool,
} from '../types/domain.ts';
import { getExpectedRankType } from '../config/systems/registry.ts';

/**
 * RFC-4180 compliant CSV line parser (handles quoted fields and escaped quotes).
 */
export function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows.filter((r) => r.some((cell) => cell.length > 0));
}

export function buildCutoffCompositeKey(parts: {
  systemCode: string;
  academicYear: number;
  roundNumber: number;
  institutionId: string;
  programmeId: string;
  quota: string;
  seatCategory: string;
  seatPool: string;
  rankType: string;
}): string {
  const raw = [
    parts.systemCode.toLowerCase(),
    parts.academicYear,
    `r${parts.roundNumber}`,
    parts.institutionId,
    parts.programmeId,
    parts.quota.toLowerCase(),
    parts.seatCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parts.seatPool.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parts.rankType.toLowerCase(),
  ].join('_');

  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
}

/**
 * Multi-stage CSV validation pipeline for Admin cutoff imports:
 * 1. Required-column check
 * 2. Type, rank, quota, category, seat-pool & rank-type rule validation
 * 3. Institution & programme reference integrity check
 * 4. Duplicate composite-key detection
 *
 * If ANY error or duplicate is detected, valid = false so nothing is imported.
 */
export function validateCutoffCsv(
  csvText: string,
  system: CounsellingSystemConfig,
  institutions: Institution[],
  programmes: Programme[],
  importBatchId: string
): CsvValidationResult {
  const parsed = parseCsvText(csvText);

  if (parsed.length < 2) {
    return {
      valid: false,
      missingColumns: parsed.length === 0 ? system.csvColumns : [],
      rowErrors: [
        {
          rowNumber: 1,
          column: 'file',
          message: 'CSV file must contain a header row and at least one data row.',
        },
      ],
      duplicateRows: [],
      validRows: [],
      totalDataRows: 0,
    };
  }

  const headers = parsed[0].map((h) => h.trim().toLowerCase());
  const missingColumns = system.csvColumns.filter((col) => !headers.includes(col));

  if (missingColumns.length > 0) {
    return {
      valid: false,
      missingColumns,
      rowErrors: [
        {
          rowNumber: 1,
          column: missingColumns.join(', '),
          message: `Missing required columns: ${missingColumns.join(', ')}`,
        },
      ],
      duplicateRows: [],
      validRows: [],
      totalDataRows: parsed.length - 1,
    };
  }

  const colIndex = new Map<string, number>();
  headers.forEach((h, i) => colIndex.set(h, i));
  const cell = (row: string[], col: string) => (row[colIndex.get(col) ?? -1] ?? '').trim();

  const instBySlug = new Map(institutions.map((i) => [i.slug.toLowerCase(), i]));
  const progByInstAndCode = new Map(
    programmes.map((p) => [`${p.institutionId}::${p.code.toLowerCase()}`, p])
  );

  const allowedQuotas = new Set(system.allowedQuotas.map((q) => q.code));
  const allowedCategoriesWithPwd = new Set<string>();
  for (const cat of system.allowedCategories) {
    allowedCategoriesWithPwd.add(cat);
    allowedCategoriesWithPwd.add(`${cat}${system.pwdSuffix}`);
  }
  const allowedSeatPools = new Set<string>(system.allowedSeatPools);

  const rowErrors: CsvRowValidationError[] = [];
  const duplicateRows: { rowNumber: number; key: string }[] = [];
  const validRows: CutoffRecord[] = [];
  const seenKeys = new Set<string>();

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    const rowNumber = i + 1;
    let rowHasError = false;

    const addError = (column: string, message: string) => {
      rowHasError = true;
      rowErrors.push({ rowNumber, column, message });
    };

    const sysCode = cell(row, 'system_code').toLowerCase();
    if (sysCode !== system.code.toLowerCase()) {
      addError('system_code', `Expected "${system.code}", got "${sysCode || '(empty)'}".`);
    }

    const examCode = cell(row, 'exam_code').toLowerCase();
    if (examCode !== system.examCode.toLowerCase()) {
      addError('exam_code', `Expected "${system.examCode}", got "${examCode || '(empty)'}".`);
    }

    const academicYear = Number(cell(row, 'academic_year'));
    if (!Number.isInteger(academicYear) || academicYear < 2015 || academicYear > 2035) {
      addError('academic_year', `Invalid academic year "${cell(row, 'academic_year')}".`);
    }

    const roundNumber = Number(cell(row, 'round_number'));
    if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > 12) {
      addError('round_number', `Invalid round number "${cell(row, 'round_number')}".`);
    }

    const roundLabel = cell(row, 'round_label');
    if (!roundLabel) {
      addError('round_label', 'Round label is required (e.g., "Round 1").');
    }

    const instSlug = cell(row, 'institution_slug').toLowerCase();
    const institution = instBySlug.get(instSlug);
    if (!institution) {
      addError('institution_slug', `Unknown institution slug "${instSlug}". Add the college first.`);
    }

    const progCode = cell(row, 'programme_code').toLowerCase();
    const programme = institution
      ? progByInstAndCode.get(`${institution.id}::${progCode}`)
      : undefined;
    if (institution && !programme) {
      addError(
        'programme_code',
        `Unknown programme code "${cell(row, 'programme_code')}" for ${institution.shortName}.`
      );
    }

    const quota = cell(row, 'quota');
    if (!allowedQuotas.has(quota)) {
      addError('quota', `Quota "${quota}" is not allowed in ${system.shortName}. Allowed: ${Array.from(allowedQuotas).join(', ')}.`);
    }

    const seatCategory = cell(row, 'seat_category');
    if (!allowedCategoriesWithPwd.has(seatCategory)) {
      addError('seat_category', `Category "${seatCategory}" is not allowed in ${system.shortName}.`);
    }

    const seatPool = cell(row, 'seat_pool') as SeatPool;
    if (!allowedSeatPools.has(seatPool)) {
      addError('seat_pool', `Seat pool "${seatPool}" must be one of: ${system.allowedSeatPools.join(', ')}.`);
    }

    const rankType = cell(row, 'rank_type') as RankType;
    if (rankType !== 'CRL' && rankType !== 'CATEGORY_RANK') {
      addError('rank_type', `Rank type must be "CRL" or "CATEGORY_RANK", got "${rankType}".`);
    } else if (allowedCategoriesWithPwd.has(seatCategory)) {
      const expected = getExpectedRankType(system, seatCategory);
      if (rankType !== expected) {
        addError(
          'rank_type',
          `Rank-type guard: ${system.shortName} requires "${expected}" for category "${seatCategory}", got "${rankType}".`
        );
      }
    }

    const openingRank = Number(cell(row, 'opening_rank'));
    const closingRank = Number(cell(row, 'closing_rank'));
    if (!Number.isInteger(openingRank) || openingRank < 1) {
      addError('opening_rank', `Opening rank must be a positive integer, got "${cell(row, 'opening_rank')}".`);
    }
    if (!Number.isInteger(closingRank) || closingRank < 1) {
      addError('closing_rank', `Closing rank must be a positive integer, got "${cell(row, 'closing_rank')}".`);
    }
    if (Number.isInteger(openingRank) && Number.isInteger(closingRank) && closingRank < openingRank) {
      addError('closing_rank', `Closing rank (${closingRank}) cannot be lower than opening rank (${openingRank}).`);
    }

    const sourceName = cell(row, 'source_name');
    if (!sourceName) {
      addError('source_name', 'Source name is required for data provenance.');
    }

    const sourceUrl = cell(row, 'source_url');
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
      addError('source_url', 'Source URL must begin with http:// or https://.');
    }

    const isDemoRaw = cell(row, 'is_demo').toLowerCase();
    if (isDemoRaw !== 'true' && isDemoRaw !== 'false') {
      addError('is_demo', 'is_demo must be explicitly "true" or "false".');
    }

    const verifiedAt = cell(row, 'verified_at');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) {
      addError('verified_at', 'verified_at must be an ISO date (YYYY-MM-DD).');
    }

    if (!rowHasError && institution && programme) {
      const compositeKey = buildCutoffCompositeKey({
        systemCode: system.code,
        academicYear,
        roundNumber,
        institutionId: institution.id,
        programmeId: programme.id,
        quota,
        seatCategory,
        seatPool,
        rankType,
      });

      if (seenKeys.has(compositeKey)) {
        duplicateRows.push({ rowNumber, key: compositeKey });
        rowErrors.push({
          rowNumber,
          column: 'duplicate',
          message: `Duplicate cutoff row detected for key "${compositeKey}".`,
        });
      } else {
        seenKeys.add(compositeKey);
        validRows.push({
          id: compositeKey,
          systemCode: system.code,
          examCode: system.examCode,
          academicYear,
          roundNumber,
          roundLabel,
          institutionId: institution.id,
          institutionSlug: institution.slug,
          institutionName: institution.name,
          institutionType: institution.type,
          state: institution.state,
          programmeId: programme.id,
          programmeName: programme.name,
          branchGroup: programme.branchGroup,
          quota,
          seatCategory,
          seatPool,
          rankType,
          openingRank,
          closingRank,
          sourceName,
          sourceUrl: sourceUrl || system.officialPortalUrl,
          isDemo: isDemoRaw === 'true',
          status: 'published',
          verificationStatus: isDemoRaw === 'true' ? 'unverified' : 'verified',
          importBatchId,
          verifiedAt,
        });
      }
    }
  }

  return {
    valid: rowErrors.length === 0 && duplicateRows.length === 0 && validRows.length > 0,
    missingColumns,
    rowErrors,
    duplicateRows,
    validRows,
    totalDataRows: parsed.length - 1,
  };
}

export function generateCsvTemplate(system: CounsellingSystemConfig): string {
  const header = system.csvColumns.join(',');
  const latestRound = system.rounds[system.rounds.length - 1] ?? { number: 1, label: 'Round 1' };
  const sampleBySystem: Record<
    string,
    { slug: string; prog: string; quota: string; open1: string; close1: string; open2: string; close2: string }
  > = {
    'jee-advanced': {
      slug: 'iit-bombay',
      prog: 'CSE',
      quota: 'AI',
      open1: '1',
      close1: '68',
      open2: '12',
      close2: '52',
    },
    reap: {
      slug: 'mbm-university-jodhpur',
      prog: 'CSE',
      quota: 'HS',
      open1: '28000',
      close1: '48000',
      open2: '38000',
      close2: '66000',
    },
    'mht-cet': {
      slug: 'coep-pune',
      prog: 'CSE',
      quota: 'HS',
      open1: '95',
      close1: '180',
      open2: '140',
      close2: '250',
    },
    wbjee: {
      slug: 'jadavpur-university',
      prog: 'CSE',
      quota: 'HS',
      open1: '60',
      close1: '140',
      open2: '90',
      close2: '195',
    },
    kcet: {
      slug: 'rvce-bengaluru',
      prog: 'CSE',
      quota: 'HS',
      open1: '210',
      close1: '420',
      open2: '310',
      close2: '580',
    },
  };
  const sample = sampleBySystem[system.code.toLowerCase()] ?? {
    slug: 'nit-trichy',
    prog: 'CSE',
    quota: 'OS',
    open1: '1150',
    close1: '1480',
    open2: '380',
    close2: '540',
  };
  const sampleRow1 = [
    system.code,
    system.examCode,
    '2025',
    String(latestRound.number),
    latestRound.label,
    sample.slug,
    sample.prog,
    sample.quota,
    'OPEN',
    'Gender-Neutral',
    getExpectedRankType(system, 'OPEN'),
    sample.open1,
    sample.close1,
    `Demo ${system.shortName} Sample Dataset`,
    system.officialPortalUrl,
    'true',
    '2025-07-20',
  ].join(',');
  const sampleRow2 = [
    system.code,
    system.examCode,
    '2025',
    String(latestRound.number),
    latestRound.label,
    sample.slug,
    sample.prog,
    sample.quota,
    'OBC-NCL',
    'Gender-Neutral',
    getExpectedRankType(system, 'OBC-NCL'),
    sample.open2,
    sample.close2,
    `Demo ${system.shortName} Sample Dataset`,
    system.officialPortalUrl,
    'true',
    '2025-07-20',
  ].join(',');
  return `${header}\n${sampleRow1}\n${sampleRow2}\n`;
}
