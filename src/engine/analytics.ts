import {
  ChoiceListAnalysis,
  ChoiceListItem,
  ChoicePriorityTag,
  ComparisonWeights,
  CounsellingSystemConfig,
  CutoffRecord,
  Institution,
  PredictionInput,
  RankType,
  RoundMovementPoint,
  SeatPool,
  WhatIfDeltaSummary,
  YoYChangePoint,
} from '../types/domain.ts';
import { runPrediction } from './predictor.ts';

/**
 * Round-wise movement: tracks opening and closing ranks across counselling rounds
 * for an exact (system, year, institution, programme, quota, category, seatPool, rankType) tuple.
 * Computed strictly from stored records.
 */
export function computeRoundWiseMovement(
  cutoffs: CutoffRecord[],
  filter: {
    systemCode: string;
    academicYear: number;
    institutionId: string;
    programmeId: string;
    quota: string;
    seatCategory: string;
    seatPool: SeatPool;
    rankType?: RankType;
  }
): RoundMovementPoint[] {
  const matching = cutoffs
    .filter(
      (c) =>
        c.status === 'published' &&
        c.systemCode.toLowerCase() === filter.systemCode.toLowerCase() &&
        c.academicYear === filter.academicYear &&
        c.institutionId === filter.institutionId &&
        c.programmeId === filter.programmeId &&
        c.quota === filter.quota &&
        c.seatCategory === filter.seatCategory &&
        c.seatPool === filter.seatPool &&
        (!filter.rankType || c.rankType === filter.rankType)
    )
    .sort((a, b) => a.roundNumber - b.roundNumber);

  return matching.map((c) => ({
    roundNumber: c.roundNumber,
    roundLabel: c.roundLabel,
    openingRank: c.openingRank,
    closingRank: c.closingRank,
    isDemo: c.isDemo,
    sourceName: c.sourceName,
  }));
}

/**
 * Year-over-Year closing rank change:
 * Plain numeric difference and percentage change vs previous stored year.
 * No hidden volatility score or invented formula.
 */
export function computeYoYChange(
  cutoffs: CutoffRecord[],
  filter: {
    systemCode: string;
    roundNumber: number;
    institutionId: string;
    programmeId: string;
    quota: string;
    seatCategory: string;
    seatPool: SeatPool;
    rankType?: RankType;
  }
): YoYChangePoint[] {
  const matching = cutoffs
    .filter(
      (c) =>
        c.status === 'published' &&
        c.systemCode.toLowerCase() === filter.systemCode.toLowerCase() &&
        c.roundNumber === filter.roundNumber &&
        c.institutionId === filter.institutionId &&
        c.programmeId === filter.programmeId &&
        c.quota === filter.quota &&
        c.seatCategory === filter.seatCategory &&
        c.seatPool === filter.seatPool &&
        (!filter.rankType || c.rankType === filter.rankType)
    )
    .sort((a, b) => a.academicYear - b.academicYear);

  return matching.map((record, idx) => {
    if (idx === 0) {
      return {
        academicYear: record.academicYear,
        roundNumber: record.roundNumber,
        openingRank: record.openingRank,
        closingRank: record.closingRank,
        yoyPercentChange: null,
        yoyRankDiff: null,
        isDemo: record.isDemo,
        sourceName: record.sourceName,
      };
    }

    const prev = matching[idx - 1];
    const diff = record.closingRank - prev.closingRank;
    const pct = prev.closingRank > 0 ? Number(((diff / prev.closingRank) * 100).toFixed(1)) : null;

    return {
      academicYear: record.academicYear,
      roundNumber: record.roundNumber,
      openingRank: record.openingRank,
      closingRank: record.closingRank,
      yoyPercentChange: pct,
      yoyRankDiff: diff,
      isDemo: record.isDemo,
      sourceName: record.sourceName,
    };
  });
}

/**
 * What-If Explorer: simulates rank adjustments (±%) without mutating student profile.
 */
export function computeWhatIfScenarios(
  baseInput: PredictionInput,
  cutoffs: CutoffRecord[],
  system: CounsellingSystemConfig | undefined,
  percentShifts: number[] = [-15, -5, 0, 5, 15]
): WhatIfDeltaSummary[] {
  if (!system) return [];
  const baseResult = runPrediction(baseInput, cutoffs, system);
  if (!baseResult.valid || baseResult.evaluatedRank == null || !baseResult.evaluatedRankType) {
    return [];
  }

  const baseRank = baseResult.evaluatedRank;
  const isCrl = baseResult.evaluatedRankType === 'CRL';

  return percentShifts.map((shift) => {
    const adjustedRank = Math.max(1, Math.round(baseRank * (1 + shift / 100)));
    const nextInput: PredictionInput = {
      ...baseInput,
      crlRank: isCrl ? adjustedRank : baseInput.crlRank,
      categoryRank: !isCrl ? adjustedRank : baseInput.categoryRank,
    };
    const res = runPrediction(nextInput, cutoffs, system);
    const label =
      shift === 0
        ? 'Current rank'
        : shift < 0
          ? `${shift}% better rank`
          : `+${shift}% rank shift`;

    return {
      label,
      adjustedRank,
      category: baseResult.effectiveCategory,
      within: res.counts.within,
      near: res.counts.near,
      beyond: res.counts.beyond,
      total: res.counts.total,
    };
  });
}

/**
 * Read-only Choice List Analyzer:
 * Inspects a student's preference list and reports transparent advisory findings
 * without ever auto-sorting or altering the student's order.
 */
export function analyzeChoiceList(
  items: ChoiceListItem[],
  studentRank: number | null | undefined,
  studentRankType: RankType | null | undefined
): ChoiceListAnalysis {
  const countsByTag: Record<ChoicePriorityTag, number> = {
    Dream: 0,
    Target: 0,
    Safer: 0,
    Unassigned: 0,
  };

  const beyondClosingChoices: { index: number; item: ChoiceListItem; studentRank: number }[] = [];
  const duplicatePairs: { firstIndex: number; duplicateIndex: number; label: string }[] = [];
  const missingHistoricalData: { index: number; item: ChoiceListItem }[] = [];
  const seenPairs = new Map<string, number>();

  items.forEach((item, index) => {
    countsByTag[item.tag] = (countsByTag[item.tag] ?? 0) + 1;

    const pairKey = `${item.institutionId}::${item.programmeId}::${item.quota}::${item.seatPool}`;
    if (seenPairs.has(pairKey)) {
      duplicatePairs.push({
        firstIndex: seenPairs.get(pairKey)!,
        duplicateIndex: index,
        label: `${item.institutionName} — ${item.programmeName} (${item.quota})`,
      });
    } else {
      seenPairs.set(pairKey, index);
    }

    if (item.closingRank == null) {
      missingHistoricalData.push({ index, item });
    } else if (
      studentRank != null &&
      studentRank > 0 &&
      studentRankType != null &&
      item.rankType === studentRankType &&
      studentRank > item.closingRank
    ) {
      beyondClosingChoices.push({ index, item, studentRank });
    }
  });

  const hasNoSaferOptions = items.length > 0 && countsByTag.Safer === 0;
  const advisories: { severity: 'info' | 'warning'; title: string; detail: string }[] = [];

  if (duplicatePairs.length > 0) {
    advisories.push({
      severity: 'warning',
      title: `${duplicatePairs.length} duplicate institute + branch ${duplicatePairs.length === 1 ? 'entry' : 'entries'} detected`,
      detail: 'Removing duplicate entries keeps your counselling preference list clean before filling choices on the official portal.',
    });
  }

  if (hasNoSaferOptions) {
    advisories.push({
      severity: 'warning',
      title: 'No choices tagged as Safer',
      detail: 'Consider including options whose historical closing ranks are comfortably higher than your rank and tagging them as Safer.',
    });
  }

  if (beyondClosingChoices.length > 0) {
    advisories.push({
      severity: 'info',
      title: `${beyondClosingChoices.length} ${beyondClosingChoices.length === 1 ? 'choice sits' : 'choices sit'} beyond historical closing rank`,
      detail: 'Having aspirational choices near the top is normal, as long as you also include options within historical closing ranks below them.',
    });
  }

  if (missingHistoricalData.length > 0) {
    advisories.push({
      severity: 'info',
      title: `${missingHistoricalData.length} ${missingHistoricalData.length === 1 ? 'entry lacks' : 'entries lack'} historical cutoff data`,
      detail: 'Historical closing ranks are unavailable for these rows; verify recent rounds directly on the official portal.',
    });
  }

  if (items.length > 0 && advisories.length === 0) {
    advisories.push({
      severity: 'info',
      title: 'No structural issues detected',
      detail: 'Your list has no duplicate entries, includes Safer options, and has historical reference ranks attached. Final order remains entirely your choice.',
    });
  }

  return {
    totalChoices: items.length,
    countsByTag,
    beyondClosingChoices,
    duplicatePairs,
    missingHistoricalData,
    hasNoSaferOptions,
    advisories,
  };
}

export interface PersonalComparisonFactorRow {
  institutionId: string;
  institutionName: string;
  bestClosingRank: number | null;
  closingRankFactor: number | null;
  locationMatchFactor: number;
  feesInfoFactor: number;
  branchBreadthFactor: number;
  programmeCount: number;
  weightedPersonalScore: number | null;
  insufficientFactors: string[];
}

/**
 * Personal Comparison Weights calculator:
 * Transparent per-factor comparison derived strictly from stored records and student-chosen weights.
 * Labelled explicitly in the UI as a personal view — NOT an official ranking.
 */
export function computePersonalComparisonTable(
  institutions: Institution[],
  cutoffs: CutoffRecord[],
  programmeCountByInst: Record<string, number>,
  weights: ComparisonWeights,
  preferredState?: string
): PersonalComparisonFactorRow[] {
  if (institutions.length === 0) return [];

  const totalWeight = weights.closingRank + weights.location + weights.fees + weights.branch;
  const bestRankByInst = new Map<string, number | null>();

  for (const inst of institutions) {
    const instCutoffs = cutoffs.filter(
      (c) => c.status === 'published' && c.institutionId === inst.id && c.rankType === 'CRL'
    );
    if (instCutoffs.length === 0) {
      bestRankByInst.set(inst.id, null);
    } else {
      bestRankByInst.set(
        inst.id,
        Math.min(...instCutoffs.map((c) => c.closingRank))
      );
    }
  }

  const validRanks = Array.from(bestRankByInst.values()).filter((r): r is number => r != null);
  const minRank = validRanks.length > 0 ? Math.min(...validRanks) : null;
  const maxRank = validRanks.length > 0 ? Math.max(...validRanks) : null;

  const maxProgrammes = Math.max(
    1,
    ...institutions.map((i) => programmeCountByInst[i.id] ?? 0)
  );

  return institutions.map((inst) => {
    const bestRank = bestRankByInst.get(inst.id) ?? null;
    const progCount = programmeCountByInst[inst.id] ?? 0;
    const insufficientFactors: string[] = [];

    // 0-100 transparent normalized factors derived only from stored facts
    let closingRankFactor: number | null = null;
    if (bestRank == null || minRank == null || maxRank == null) {
      insufficientFactors.push('Historical CRL closing rank');
    } else if (minRank === maxRank) {
      closingRankFactor = 100;
    } else {
      closingRankFactor = Math.round(((maxRank - bestRank) / (maxRank - minRank)) * 70 + 30);
    }

    const locationMatchFactor =
      preferredState && preferredState.trim().toLowerCase() === inst.state.trim().toLowerCase()
        ? 100
        : 60;

    const feesInfoFactor = inst.feeRangeNote && inst.feeRangeNote !== 'Not available' ? 80 : 0;
    if (feesInfoFactor === 0) {
      insufficientFactors.push('Verified fee data');
    }

    const branchBreadthFactor = Math.round((progCount / maxProgrammes) * 100);

    let weightedPersonalScore: number | null = null;
    if (totalWeight > 0) {
      let activeWeight = 0;
      let sum = 0;
      if (closingRankFactor != null) {
        sum += closingRankFactor * weights.closingRank;
        activeWeight += weights.closingRank;
      }
      sum += locationMatchFactor * weights.location;
      activeWeight += weights.location;

      if (feesInfoFactor > 0) {
        sum += feesInfoFactor * weights.fees;
        activeWeight += weights.fees;
      }

      sum += branchBreadthFactor * weights.branch;
      activeWeight += weights.branch;

      weightedPersonalScore = activeWeight > 0 ? Math.round(sum / activeWeight) : null;
    }

    return {
      institutionId: inst.id,
      institutionName: inst.name,
      bestClosingRank: bestRank,
      closingRankFactor,
      locationMatchFactor,
      feesInfoFactor,
      branchBreadthFactor,
      programmeCount: progCount,
      weightedPersonalScore,
      insufficientFactors,
    };
  });
}
