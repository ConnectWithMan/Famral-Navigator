import {
  ClassificationBand,
  CounsellingSystemConfig,
  CutoffRecord,
  FieldValidationError,
  PredictionInput,
  PredictionMatch,
  PredictionResult,
  QuotaRuleConfig,
  RankType,
} from '../types/domain.ts';
import { getEffectiveCategory, getExpectedRankType } from '../config/systems/registry.ts';

export const CLASSIFICATION_LABELS: Record<ClassificationBand, string> = {
  within: 'Within historical closing rank',
  near: 'Near historical closing rank',
  beyond: 'Beyond historical closing rank',
};

export function validatePredictionInput(
  input: PredictionInput,
  system: CounsellingSystemConfig | undefined
): {
  errors: FieldValidationError[];
  effectiveCategory: string;
  evaluatedRank: number | null;
  evaluatedRankType: RankType | null;
  marginPercentUsed: number;
} {
  const errors: FieldValidationError[] = [];

  if (!system) {
    errors.push({
      field: 'systemCode',
      message: `Unknown counselling system "${input.systemCode}". Select a configured counselling system.`,
    });
    return {
      errors,
      effectiveCategory: input.category,
      evaluatedRank: null,
      evaluatedRankType: null,
      marginPercentUsed: 10,
    };
  }

  if (!input.examCode || input.examCode.toLowerCase() !== system.examCode.toLowerCase()) {
    errors.push({
      field: 'examCode',
      message: `Selected counselling system ${system.shortName} requires exam ${system.examName}.`,
    });
  }

  if (!Number.isInteger(input.academicYear) || input.academicYear < 2015 || input.academicYear > 2035) {
    errors.push({
      field: 'academicYear',
      message: 'Please select a valid academic year.',
    });
  }

  const roundValid = system.rounds.some((r) => r.number === input.roundNumber);
  if (!Number.isInteger(input.roundNumber) || !roundValid) {
    errors.push({
      field: 'roundNumber',
      message: `Please select a valid round for ${system.shortName}.`,
    });
  }

  if (!system.allowedCategories.includes(input.category)) {
    errors.push({
      field: 'category',
      message: `Category "${input.category}" is not configured for ${system.shortName}.`,
    });
  }

  if (!system.allowedSeatPools.includes(input.gender)) {
    errors.push({
      field: 'gender',
      message: `Seat pool "${input.gender}" is not valid for ${system.shortName}.`,
    });
  }

  if (system.requiresHomeState && (!input.homeState || !input.homeState.trim())) {
    errors.push({
      field: 'homeState',
      message: `Home State of Eligibility is required for ${system.shortName} quota matching.`,
    });
  }

  const effectiveCategory = getEffectiveCategory(system, input.category, input.isPwd);
  const expectedRankType = getExpectedRankType(system, effectiveCategory);

  let evaluatedRank: number | null = null;
  if (expectedRankType === 'CRL') {
    if (input.crlRank == null || !Number.isInteger(input.crlRank) || input.crlRank < 1 || input.crlRank > 5000000) {
      errors.push({
        field: 'crlRank',
        message: `${system.shortName} (${effectiveCategory}) compares against All-India CRL Rank. Enter a positive whole number.`,
      });
    } else {
      evaluatedRank = input.crlRank;
    }
  } else {
    if (
      input.categoryRank == null ||
      !Number.isInteger(input.categoryRank) ||
      input.categoryRank < 1 ||
      input.categoryRank > 5000000
    ) {
      errors.push({
        field: 'categoryRank',
        message: `${system.shortName} (${effectiveCategory}) compares against your ${effectiveCategory} Category Rank (never CRL). Enter a positive whole number.`,
      });
    } else {
      evaluatedRank = input.categoryRank;
    }
  }

  const rawMargin = input.nearMarginPercent ?? system.defaultNearMarginPercent;
  let marginPercentUsed = system.defaultNearMarginPercent;
  if (typeof rawMargin !== 'number' || Number.isNaN(rawMargin) || rawMargin < 0 || rawMargin > system.maxNearMarginPercent) {
    errors.push({
      field: 'nearMarginPercent',
      message: `Near-closing margin must be between 0% and ${system.maxNearMarginPercent}%.`,
    });
  } else {
    marginPercentUsed = rawMargin;
  }

  return {
    errors,
    effectiveCategory,
    evaluatedRank,
    evaluatedRankType: expectedRankType,
    marginPercentUsed,
  };
}

export function evaluateQuotaEligibility(
  quotaRule: QuotaRuleConfig,
  homeState: string,
  cutoff: CutoffRecord
): { eligible: boolean; reason: string } {
  if (!quotaRule.appliesToInstituteTypes.includes(cutoff.institutionType)) {
    return { eligible: false, reason: '' };
  }

  const normalizedHome = homeState.trim().toLowerCase();
  const normalizedInstState = cutoff.state.trim().toLowerCase();

  switch (quotaRule.matchMode) {
    case 'all_india':
      return { eligible: true, reason: `All India (${quotaRule.code}) seat open across states` };

    case 'home_state':
      if (normalizedHome && normalizedHome === normalizedInstState) {
        return {
          eligible: true,
          reason: `Home State (${quotaRule.code}) matches ${cutoff.state}`,
        };
      }
      return { eligible: false, reason: '' };

    case 'other_state':
      if (normalizedHome && normalizedHome !== normalizedInstState) {
        return {
          eligible: true,
          reason: `Other State (${quotaRule.code}) for ${homeState} candidate in ${cutoff.state}`,
        };
      }
      return { eligible: false, reason: '' };

    case 'specific_state': {
      const homeAllowed = (quotaRule.eligibleHomeStates ?? []).some(
        (s) => s.toLowerCase() === normalizedHome
      );
      const instAllowed = (quotaRule.eligibleInstituteStates ?? []).some(
        (s) => s.toLowerCase() === normalizedInstState
      );
      if (homeAllowed && instAllowed) {
        return {
          eligible: true,
          reason: `Special state quota (${quotaRule.code}) applies for ${homeState}`,
        };
      }
      return { eligible: false, reason: '' };
    }

    default:
      return { eligible: false, reason: '' };
  }
}

export function classifyRankAgainstClosing(
  rank: number,
  closingRank: number,
  nearMarginPercent: number
): { band: ClassificationBand; nearUpperBound: number } {
  const nearUpperBound = Math.ceil(closingRank * (1 + nearMarginPercent / 100));
  if (rank <= closingRank) {
    return { band: 'within', nearUpperBound };
  }
  if (rank <= nearUpperBound) {
    return { band: 'near', nearUpperBound };
  }
  return { band: 'beyond', nearUpperBound };
}

export function runPrediction(
  input: PredictionInput,
  cutoffs: CutoffRecord[],
  system: CounsellingSystemConfig | undefined
): PredictionResult {
  const validation = validatePredictionInput(input, system);

  if (validation.errors.length > 0 || !system || validation.evaluatedRank == null || !validation.evaluatedRankType) {
    return {
      valid: false,
      errors: validation.errors,
      systemCode: input.systemCode,
      academicYear: input.academicYear,
      roundNumber: input.roundNumber,
      effectiveCategory: validation.effectiveCategory,
      evaluatedRank: validation.evaluatedRank,
      evaluatedRankType: validation.evaluatedRankType,
      marginPercentUsed: validation.marginPercentUsed,
      matches: [],
      counts: { within: 0, near: 0, beyond: 0, total: 0 },
      emptyReason: null,
      includesDemoData: false,
      sourcesSummary: [],
    };
  }

  const publishedForSystem = cutoffs.filter(
    (c) => c.status === 'published' && c.systemCode.toLowerCase() === system.code.toLowerCase()
  );

  if (publishedForSystem.length === 0) {
    return {
      valid: true,
      errors: [],
      systemCode: system.code,
      academicYear: input.academicYear,
      roundNumber: input.roundNumber,
      effectiveCategory: validation.effectiveCategory,
      evaluatedRank: validation.evaluatedRank,
      evaluatedRankType: validation.evaluatedRankType,
      marginPercentUsed: validation.marginPercentUsed,
      matches: [],
      counts: { within: 0, near: 0, beyond: 0, total: 0 },
      emptyReason: `No published cutoff dataset is currently available for ${system.shortName}. Upload verified records via Admin CSV Import.`,
      includesDemoData: false,
      sourcesSummary: [],
    };
  }

  const forYear = publishedForSystem.filter((c) => c.academicYear === input.academicYear);
  if (forYear.length === 0) {
    return {
      valid: true,
      errors: [],
      systemCode: system.code,
      academicYear: input.academicYear,
      roundNumber: input.roundNumber,
      effectiveCategory: validation.effectiveCategory,
      evaluatedRank: validation.evaluatedRank,
      evaluatedRankType: validation.evaluatedRankType,
      marginPercentUsed: validation.marginPercentUsed,
      matches: [],
      counts: { within: 0, near: 0, beyond: 0, total: 0 },
      emptyReason: `No published ${system.shortName} cutoffs exist for academic year ${input.academicYear}. Try another year.`,
      includesDemoData: false,
      sourcesSummary: [],
    };
  }

  const forRound = forYear.filter((c) => c.roundNumber === input.roundNumber);
  if (forRound.length === 0) {
    return {
      valid: true,
      errors: [],
      systemCode: system.code,
      academicYear: input.academicYear,
      roundNumber: input.roundNumber,
      effectiveCategory: validation.effectiveCategory,
      evaluatedRank: validation.evaluatedRank,
      evaluatedRankType: validation.evaluatedRankType,
      marginPercentUsed: validation.marginPercentUsed,
      matches: [],
      counts: { within: 0, near: 0, beyond: 0, total: 0 },
      emptyReason: `No published ${system.shortName} ${input.academicYear} cutoffs exist for Round ${input.roundNumber}. Select another round.`,
      includesDemoData: false,
      sourcesSummary: [],
    };
  }

  const forCategoryAndRankType = forRound.filter(
    (c) =>
      c.seatCategory === validation.effectiveCategory &&
      c.rankType === validation.evaluatedRankType // strict rank-type guard
  );

  if (forCategoryAndRankType.length === 0) {
    return {
      valid: true,
      errors: [],
      systemCode: system.code,
      academicYear: input.academicYear,
      roundNumber: input.roundNumber,
      effectiveCategory: validation.effectiveCategory,
      evaluatedRank: validation.evaluatedRank,
      evaluatedRankType: validation.evaluatedRankType,
      marginPercentUsed: validation.marginPercentUsed,
      matches: [],
      counts: { within: 0, near: 0, beyond: 0, total: 0 },
      emptyReason: `No published ${system.shortName} ${input.academicYear} Round ${input.roundNumber} records match category "${validation.effectiveCategory}" with rank type "${validation.evaluatedRankType}".`,
      includesDemoData: false,
      sourcesSummary: [],
    };
  }

  const quotaMap = new Map(system.allowedQuotas.map((q) => [q.code, q]));
  const matches: PredictionMatch[] = [];

  for (const cutoff of forCategoryAndRankType) {
    // Seat pool eligibility: Gender-Neutral candidates match only Gender-Neutral;
    // Female-only candidates are eligible for both Female-only and Gender-Neutral seats.
    const poolEligible =
      input.gender === 'Female-only'
        ? cutoff.seatPool === 'Female-only' || cutoff.seatPool === 'Gender-Neutral'
        : cutoff.seatPool === 'Gender-Neutral';

    if (!poolEligible) continue;

    // Config-driven quota check
    const quotaRule = quotaMap.get(cutoff.quota);
    if (!quotaRule) continue;

    const quotaCheck = evaluateQuotaEligibility(quotaRule, input.homeState, cutoff);
    if (!quotaCheck.eligible) continue;

    // Optional student preference filters
    if (input.instituteTypes && input.instituteTypes.length > 0 && !input.instituteTypes.includes(cutoff.institutionType)) {
      continue;
    }
    if (input.preferredBranches && input.preferredBranches.length > 0 && !input.preferredBranches.includes(cutoff.branchGroup)) {
      continue;
    }
    if (input.preferredStates && input.preferredStates.length > 0 && !input.preferredStates.includes(cutoff.state)) {
      continue;
    }
    if (
      input.preferredInstitutionIds &&
      input.preferredInstitutionIds.length > 0 &&
      !input.preferredInstitutionIds.includes(cutoff.institutionId)
    ) {
      continue;
    }

    const { band, nearUpperBound } = classifyRankAgainstClosing(
      validation.evaluatedRank,
      cutoff.closingRank,
      validation.marginPercentUsed
    );

    matches.push({
      cutoff,
      evaluatedRank: validation.evaluatedRank,
      evaluatedRankType: validation.evaluatedRankType,
      classification: band,
      classificationLabel: CLASSIFICATION_LABELS[band],
      rankDeltaFromClosing: cutoff.closingRank - validation.evaluatedRank,
      marginPercentUsed: validation.marginPercentUsed,
      nearUpperBound,
      matchedQuotaReason: quotaCheck.reason,
    });
  }

  // Sort predictably: within -> near -> beyond, then by closest closing rank
  const bandOrder: Record<ClassificationBand, number> = { within: 0, near: 1, beyond: 2 };
  matches.sort((a, b) => {
    if (bandOrder[a.classification] !== bandOrder[b.classification]) {
      return bandOrder[a.classification] - bandOrder[b.classification];
    }
    return a.cutoff.closingRank - b.cutoff.closingRank;
  });

  const within = matches.filter((m) => m.classification === 'within').length;
  const near = matches.filter((m) => m.classification === 'near').length;
  const beyond = matches.filter((m) => m.classification === 'beyond').length;

  const sourcesSummary = Array.from(new Set(matches.map((m) => m.cutoff.sourceName)));
  const includesDemoData = matches.some((m) => m.cutoff.isDemo);

  let emptyReason: string | null = null;
  if (matches.length === 0) {
    emptyReason = `No seats matched your quota (${input.homeState}), seat pool (${input.gender}), and optional branch/state/institute filters for ${system.shortName} ${input.academicYear} Round ${input.roundNumber}. Try clearing optional filters.`;
  }

  return {
    valid: true,
    errors: [],
    systemCode: system.code,
    academicYear: input.academicYear,
    roundNumber: input.roundNumber,
    effectiveCategory: validation.effectiveCategory,
    evaluatedRank: validation.evaluatedRank,
    evaluatedRankType: validation.evaluatedRankType,
    marginPercentUsed: validation.marginPercentUsed,
    matches,
    counts: { within, near, beyond, total: matches.length },
    emptyReason,
    includesDemoData,
    sourcesSummary,
  };
}
