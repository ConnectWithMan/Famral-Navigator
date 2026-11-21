export type LanguageCode = 'en' | 'hi';

export type RankType = 'CRL' | 'CATEGORY_RANK';

export type SeatPool = 'Gender-Neutral' | 'Female-only';

export type InstitutionType =
  | 'NIT'
  | 'IIIT'
  | 'GFTI'
  | 'IIT'
  | 'State University'
  | 'Central University';

export type PublishStatus = 'published' | 'draft' | 'archived';

export type VerificationStatus = 'verified' | 'unverified' | 'outdated';

export type ClassificationBand = 'within' | 'near' | 'beyond';

export type ChoicePriorityTag = 'Dream' | 'Target' | 'Safer' | 'Unassigned';

export interface QuotaRuleConfig {
  code: string;
  label: string;
  description: string;
  appliesToInstituteTypes: InstitutionType[];
  matchMode: 'home_state' | 'other_state' | 'all_india' | 'specific_state';
  eligibleHomeStates?: string[];
  eligibleInstituteStates?: string[];
}

export interface CounsellingSystemConfig {
  code: string;
  name: string;
  shortName: string;
  examCode: string;
  examName: string;
  status: 'active' | 'configured_template';
  officialPortalUrl: string;
  officialPortalLabel: string;
  description: string;
  eligibilitySummary: string;
  instituteTypes: InstitutionType[];
  allowedQuotas: QuotaRuleConfig[];
  allowedCategories: string[];
  allowedSeatPools: SeatPool[];
  pwdSuffix: string;
  defaultNearMarginPercent: number;
  maxNearMarginPercent: number;
  rounds: { number: number; label: string }[];
  availableYears: number[];
  /**
   * Determines which rank type is used to compare cutoffs for a given category.
   * For JoSAA: OPEN uses CRL; EWS/OBC-NCL/SC/ST and PwD variants use CATEGORY_RANK.
   * For CSAB Special Rounds: all categories compare against CRL.
   */
  rankTypeByCategory: Record<string, RankType>;
  defaultRankType: RankType;
  requiresHomeState: boolean;
  csvColumns: string[];
  statesList: string[];
}

export type InstitutionOwnership =
  | 'Government'
  | 'Government Aided'
  | 'Public-Private (PPP)'
  | 'Private';

export interface InstitutionPlacementStats {
  medianPackage: string;
  averagePackage?: string | null;
  highestPackage?: string | null;
  placementSummary: string;
  sourceNote: string;
  isDemo: boolean;
}

export interface InstitutionGalleryImage {
  url: string;
  caption: string;
}

export interface Institution {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  ownership?: InstitutionOwnership;
  ownershipDetails?: string;
  logoMonogram?: string;
  logoAccent?: string;
  state: string;
  city: string;
  address?: string;
  nearestTransit?: string;
  establishedYear?: number | null;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  overview?: string;
  description?: string;
  nirfRanking?: string;
  otherRankings?: string[];
  accreditation?: string;
  coursesOffered?: string[];
  entranceExams?: string[];
  eligibilitySummary?: string;
  admissionProcess?: string;
  feeRangeNote?: string;
  estimatedTotalFee?: string;
  placements?: InstitutionPlacementStats;
  campusFacilities?: string[];
  studentFacilities?: string[];
  galleryImages?: InstitutionGalleryImage[];
  systems: string[];
  imageUrl?: string;
  sourceName: string;
  academicYear: number;
  isDemo: boolean;
  status: PublishStatus;
  verificationStatus: VerificationStatus;
  verifiedAt: string;
  updatedAt?: string;
}

export interface Programme {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  degree: string;
  durationYears: number;
  branchGroup: string;
  seatMatrixNote?: string;
  isDemo: boolean;
  verifiedAt: string;
  updatedAt?: string;
}

export interface CutoffRecord {
  id: string;
  systemCode: string;
  examCode: string;
  academicYear: number;
  roundNumber: number;
  roundLabel: string;
  institutionId: string;
  institutionSlug: string;
  institutionName: string;
  institutionType: InstitutionType;
  state: string;
  programmeId: string;
  programmeName: string;
  branchGroup: string;
  quota: string;
  seatCategory: string;
  seatPool: SeatPool;
  rankType: RankType;
  openingRank: number;
  closingRank: number;
  sourceName: string;
  sourceUrl?: string;
  isDemo: boolean;
  status: PublishStatus;
  verificationStatus: VerificationStatus;
  importBatchId?: string;
  verifiedAt: string;
  updatedAt?: string;
}

export interface PredictionInput {
  examCode: string;
  systemCode: string;
  academicYear: number;
  roundNumber: number;
  crlRank?: number | null;
  categoryRank?: number | null;
  category: string;
  isPwd: boolean;
  gender: SeatPool;
  homeState: string;
  nearMarginPercent?: number;
  instituteTypes?: InstitutionType[];
  preferredBranches?: string[];
  preferredStates?: string[];
  preferredInstitutionIds?: string[];
}

export interface FieldValidationError {
  field: string;
  message: string;
}

export interface PredictionMatch {
  cutoff: CutoffRecord;
  evaluatedRank: number;
  evaluatedRankType: RankType;
  classification: ClassificationBand;
  classificationLabel: string;
  rankDeltaFromClosing: number; // closingRank - evaluatedRank (positive means within)
  marginPercentUsed: number;
  nearUpperBound: number;
  matchedQuotaReason: string;
}

export interface PredictionResult {
  valid: boolean;
  errors: FieldValidationError[];
  systemCode: string;
  academicYear: number;
  roundNumber: number;
  effectiveCategory: string;
  evaluatedRank: number | null;
  evaluatedRankType: RankType | null;
  marginPercentUsed: number;
  matches: PredictionMatch[];
  counts: {
    within: number;
    near: number;
    beyond: number;
    total: number;
  };
  emptyReason: string | null;
  includesDemoData: boolean;
  sourcesSummary: string[];
}

export interface RoundMovementPoint {
  roundNumber: number;
  roundLabel: string;
  openingRank: number;
  closingRank: number;
  isDemo: boolean;
  sourceName: string;
}

export interface YoYChangePoint {
  academicYear: number;
  roundNumber: number;
  openingRank: number;
  closingRank: number;
  yoyPercentChange: number | null; // plain % change vs previous year
  yoyRankDiff: number | null;
  isDemo: boolean;
  sourceName: string;
}

export interface WhatIfDeltaSummary {
  label: string;
  adjustedRank: number;
  category: string;
  within: number;
  near: number;
  beyond: number;
  total: number;
}

export interface ChoiceListItem {
  id: string;
  institutionId: string;
  institutionSlug: string;
  institutionName: string;
  institutionType: InstitutionType;
  state: string;
  programmeId: string;
  programmeName: string;
  branchGroup: string;
  quota: string;
  seatCategory: string;
  seatPool: SeatPool;
  rankType: RankType;
  closingRank: number | null;
  academicYear: number | null;
  roundLabel: string | null;
  sourceName: string | null;
  isDemo: boolean;
  tag: ChoicePriorityTag;
  notes: string;
}

export interface ChoiceListVersion {
  versionId: string;
  savedAt: string;
  summary: string;
  items: ChoiceListItem[];
}

export interface ChoiceList {
  id: string;
  userId: string;
  title: string;
  systemCode: string;
  academicYear: number;
  items: ChoiceListItem[];
  versions: ChoiceListVersion[];
  shareToken?: string;
  shareEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SharedChoiceList {
  shareToken: string;
  listId: string;
  ownerId: string;
  title: string;
  systemCode: string;
  academicYear: number;
  items: ChoiceListItem[];
  includesDemoData: boolean;
  updatedAt?: string;
}

export interface ChoiceListAnalysis {
  totalChoices: number;
  countsByTag: Record<ChoicePriorityTag, number>;
  beyondClosingChoices: { index: number; item: ChoiceListItem; studentRank: number }[];
  duplicatePairs: { firstIndex: number; duplicateIndex: number; label: string }[];
  missingHistoricalData: { index: number; item: ChoiceListItem }[];
  hasNoSaferOptions: boolean;
  advisories: { severity: 'info' | 'warning'; title: string; detail: string }[];
}

export interface SavedCollege {
  id: string;
  userId: string;
  institutionId: string;
  institutionSlug: string;
  institutionName: string;
  programmeId?: string;
  programmeName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComparisonWeights {
  closingRank: number;
  location: number;
  fees: number;
  branch: number;
}

export interface SavedComparison {
  id: string;
  userId: string;
  title: string;
  institutionIds: string[];
  weights: ComparisonWeights;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedPrediction {
  id: string;
  userId: string;
  systemCode: string;
  academicYear: number;
  roundNumber: number;
  rank: number;
  rankType: RankType;
  category: string;
  gender: SeatPool;
  homeState: string;
  isPwd: boolean;
  withinCount: number;
  nearCount: number;
  beyondCount: number;
  isDemo: boolean;
  createdAt?: string;
}

export interface ScheduleItem {
  id: string;
  systemCode: string;
  academicYear: number;
  title: string;
  phase: string;
  startDate: string;
  endDate: string;
  description?: string;
  sourceName: string;
  sourceUrl?: string;
  isOutdated: boolean;
  isDemo: boolean;
  verifiedAt: string;
  updatedAt?: string;
}

export interface NoticeItem {
  id: string;
  systemCode: string;
  academicYear: number;
  title: string;
  summary: string;
  publishedDate: string;
  sourceName: string;
  sourceUrl?: string;
  isOutdated: boolean;
  isDemo: boolean;
  verifiedAt: string;
  updatedAt?: string;
}

export interface ContentItem {
  id: string;
  kind: 'guide' | 'checklist' | 'glossary';
  systemCode: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category?: string;
  sourceName: string;
  sourceUrl?: string;
  isDemo: boolean;
  verifiedAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  consentAccepted: boolean;
  consentAt?: string;
  language: LanguageCode;
  homeState?: string;
  gender?: SeatPool;
  category?: string;
  isPwd?: boolean;
  examCode?: string;
  systemCode?: string;
  academicYear?: number;
  crlRank?: number | null;
  categoryRank?: number | null;
  preferredBranches?: string[];
  preferredStates?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserTracking {
  uid: string;
  followedSystems: string[];
  savedScheduleIds: string[];
  checkedDocIds: string[];
  journeySteps: string[];
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  systemCode: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt?: string;
}

export interface DataReport {
  id: string;
  reporterUid: string;
  reporterEmail?: string;
  entityType: 'cutoff' | 'institution' | 'schedule' | 'notice' | 'guide';
  entityId: string;
  entityLabel: string;
  issueType: string;
  details: string;
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed';
  adminNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportLog {
  id: string;
  batchId: string;
  importedByUid: string;
  importedByEmail: string;
  fileName: string;
  systemCode: string;
  academicYear: number;
  totalRows: number;
  insertedCount: number;
  archivedCount: number;
  errorCount: number;
  status: 'completed' | 'rolled_back';
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt?: string;
}

export interface UsageMetric {
  id: string;
  metricType: 'predictor_run' | 'cutoff_search' | 'college_view';
  systemCode: string;
  dateKey: string;
  count: number;
  updatedAt?: string;
}

export interface CsvRowValidationError {
  rowNumber: number;
  column: string;
  message: string;
}

export interface CsvValidationResult {
  valid: boolean;
  missingColumns: string[];
  rowErrors: CsvRowValidationError[];
  duplicateRows: { rowNumber: number; key: string }[];
  validRows: CutoffRecord[];
  totalDataRows: number;
}
