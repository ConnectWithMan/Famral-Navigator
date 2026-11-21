import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import {
  AuditLog,
  ChoiceList,
  ContentItem,
  CutoffRecord,
  DataReport,
  ImportLog,
  Institution,
  NoticeItem,
  NotificationItem,
  Programme,
  SavedCollege,
  SavedComparison,
  SavedPrediction,
  ScheduleItem,
  SharedChoiceList,
  UsageMetric,
  UserProfile,
  UserTracking,
} from '../types/domain.ts';

function toIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export function makeSafeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function makeShareToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }
  return `shr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

// ============================================================================
// Public Catalog Reads
// ============================================================================

export async function fetchPublishedCatalog(isAdmin: boolean): Promise<{
  institutions: Institution[];
  programmes: Programme[];
  cutoffs: CutoffRecord[];
  schedules: ScheduleItem[];
  notices: NoticeItem[];
  contentItems: ContentItem[];
}> {
  try {
    const instQuery = isAdmin
      ? query(collection(db, 'institutions'), limit(300))
      : query(collection(db, 'institutions'), where('status', '==', 'published'), limit(300));
    const progQuery = isAdmin
      ? query(collection(db, 'programmes'), limit(600))
      : query(collection(db, 'programmes'), where('durationYears', '>=', 1), limit(600));
    const cutoffQuery = isAdmin
      ? query(collection(db, 'cutoffs'), limit(5000))
      : query(collection(db, 'cutoffs'), where('status', '==', 'published'), limit(5000));
    const schedQuery = isAdmin
      ? query(collection(db, 'schedules'), limit(200))
      : query(collection(db, 'schedules'), where('academicYear', '>=', 2015), limit(200));
    const noticeQuery = isAdmin
      ? query(collection(db, 'notices'), limit(200))
      : query(collection(db, 'notices'), where('academicYear', '>=', 2015), limit(200));
    const contentQuery = isAdmin
      ? query(collection(db, 'contentItems'), limit(300))
      : query(
          collection(db, 'contentItems'),
          where('kind', 'in', ['guide', 'checklist', 'glossary']),
          limit(300)
        );

    const [instSnap, progSnap, cutoffSnap, schedSnap, noticeSnap, contentSnap] = await Promise.all([
      getDocs(instQuery),
      getDocs(progQuery),
      getDocs(cutoffQuery),
      getDocs(schedQuery),
      getDocs(noticeQuery),
      getDocs(contentQuery),
    ]);

    return {
      institutions: instSnap.docs.map((d) => ({
        ...(d.data() as Omit<Institution, 'id'>),
        id: d.id,
        updatedAt: toIso(d.data().updatedAt),
      })),
      programmes: progSnap.docs.map((d) => ({
        ...(d.data() as Omit<Programme, 'id'>),
        id: d.id,
        updatedAt: toIso(d.data().updatedAt),
      })),
      cutoffs: cutoffSnap.docs.map((d) => ({
        ...(d.data() as Omit<CutoffRecord, 'id'>),
        id: d.id,
        updatedAt: toIso(d.data().updatedAt),
      })),
      schedules: schedSnap.docs.map((d) => ({
        ...(d.data() as Omit<ScheduleItem, 'id'>),
        id: d.id,
        updatedAt: toIso(d.data().updatedAt),
      })),
      notices: noticeSnap.docs.map((d) => ({
        ...(d.data() as Omit<NoticeItem, 'id'>),
        id: d.id,
        updatedAt: toIso(d.data().updatedAt),
      })),
      contentItems: contentSnap.docs.map((d) => ({
        ...(d.data() as Omit<ContentItem, 'id'>),
        id: d.id,
        updatedAt: toIso(d.data().updatedAt),
      })),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'catalog');
  }
}

// ============================================================================
// User Profile & Admin Role Check
// ============================================================================

export async function checkAdminDoc(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getOrCreateUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<UserProfile> {
  const path = `users/${params.uid}`;
  try {
    const ref = doc(db, 'users', params.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...(data as UserProfile),
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      };
    }

    const nowIso = new Date().toISOString();
    const payload = {
      uid: params.uid,
      email: params.email.slice(0, 200),
      displayName: (params.displayName || params.email.split('@')[0] || 'Student').slice(0, 120),
      consentAccepted: true,
      consentAt: nowIso,
      language: 'en' as const,
      homeState: 'Uttar Pradesh',
      gender: 'Gender-Neutral' as const,
      category: 'OPEN',
      isPwd: false,
      examCode: 'jee-main',
      systemCode: 'josaa',
      academicYear: 2025,
      crlRank: null,
      categoryRank: null,
      preferredBranches: [],
      preferredStates: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return {
      ...payload,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileDoc(
  uid: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'displayName'
      | 'language'
      | 'homeState'
      | 'gender'
      | 'category'
      | 'isPwd'
      | 'examCode'
      | 'systemCode'
      | 'academicYear'
      | 'crlRank'
      | 'categoryRank'
      | 'preferredBranches'
      | 'preferredStates'
      | 'consentAccepted'
      | 'consentAt'
    >
  >
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// Student Private Collections (Strictly Owner-Scoped)
// ============================================================================

export async function fetchStudentWorkspace(uid: string): Promise<{
  savedColleges: SavedCollege[];
  comparisons: SavedComparison[];
  choiceLists: ChoiceList[];
  savedPredictions: SavedPrediction[];
  tracking: UserTracking;
  notifications: NotificationItem[];
  myReports: DataReport[];
}> {
  try {
    const [savedSnap, compSnap, listSnap, predSnap, trackSnap, notifSnap, reportSnap] =
      await Promise.all([
        getDocs(query(collection(db, 'savedColleges'), where('userId', '==', uid), limit(100))),
        getDocs(query(collection(db, 'comparisons'), where('userId', '==', uid), limit(50))),
        getDocs(query(collection(db, 'choiceLists'), where('userId', '==', uid), limit(50))),
        getDocs(query(collection(db, 'savedPredictions'), where('userId', '==', uid), limit(50))),
        getDoc(doc(db, 'userTracking', uid)),
        getDocs(query(collection(db, 'notifications'), where('userId', '==', uid), limit(50))),
        getDocs(query(collection(db, 'dataReports'), where('reporterUid', '==', uid), limit(50))),
      ]);

    const tracking: UserTracking = trackSnap.exists()
      ? {
          ...(trackSnap.data() as UserTracking),
          updatedAt: toIso(trackSnap.data().updatedAt),
        }
      : {
          uid,
          followedSystems: ['josaa'],
          savedScheduleIds: [],
          checkedDocIds: [],
          journeySteps: [],
        };

    return {
      savedColleges: savedSnap.docs.map((d) => ({
        ...(d.data() as Omit<SavedCollege, 'id'>),
        id: d.id,
        createdAt: toIso(d.data().createdAt),
        updatedAt: toIso(d.data().updatedAt),
      })),
      comparisons: compSnap.docs.map((d) => ({
        ...(d.data() as Omit<SavedComparison, 'id'>),
        id: d.id,
        createdAt: toIso(d.data().createdAt),
        updatedAt: toIso(d.data().updatedAt),
      })),
      choiceLists: listSnap.docs.map((d) => ({
        ...(d.data() as Omit<ChoiceList, 'id'>),
        id: d.id,
        createdAt: toIso(d.data().createdAt),
        updatedAt: toIso(d.data().updatedAt),
      })),
      savedPredictions: predSnap.docs
        .map((d) => ({
          ...(d.data() as Omit<SavedPrediction, 'id'>),
          id: d.id,
          createdAt: toIso(d.data().createdAt),
        }))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
      tracking,
      notifications: notifSnap.docs
        .map((d) => ({
          ...(d.data() as Omit<NotificationItem, 'id'>),
          id: d.id,
          createdAt: toIso(d.data().createdAt),
        }))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
      myReports: reportSnap.docs
        .map((d) => ({
          ...(d.data() as Omit<DataReport, 'id'>),
          id: d.id,
          createdAt: toIso(d.data().createdAt),
          updatedAt: toIso(d.data().updatedAt),
        }))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `workspace/${uid}`);
  }
}

export async function createSavedCollegeDoc(
  data: Omit<SavedCollege, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedCollege> {
  const id = makeSafeId('sav');
  const path = `savedColleges/${id}`;
  try {
    const payload: Record<string, unknown> = {
      userId: data.userId,
      institutionId: data.institutionId,
      institutionSlug: data.institutionSlug,
      institutionName: data.institutionName,
      notes: (data.notes ?? '').slice(0, 1000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (data.programmeId) payload.programmeId = data.programmeId;
    if (data.programmeName) payload.programmeName = data.programmeName;
    await setDoc(doc(db, 'savedColleges', id), payload);
    const now = new Date().toISOString();
    return { ...data, id, createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSavedCollegeNotes(id: string, notes: string): Promise<void> {
  const path = `savedColleges/${id}`;
  try {
    await updateDoc(doc(db, 'savedColleges', id), {
      notes: notes.slice(0, 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSavedCollegeDoc(id: string): Promise<void> {
  const path = `savedColleges/${id}`;
  try {
    await deleteDoc(doc(db, 'savedColleges', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createComparisonDoc(
  data: Omit<SavedComparison, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedComparison> {
  const id = makeSafeId('cmp');
  const path = `comparisons/${id}`;
  try {
    await setDoc(doc(db, 'comparisons', id), {
      userId: data.userId,
      title: data.title.slice(0, 160),
      institutionIds: data.institutionIds.slice(0, 4),
      weights: data.weights,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const now = new Date().toISOString();
    return { ...data, id, createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteComparisonDoc(id: string): Promise<void> {
  const path = `comparisons/${id}`;
  try {
    await deleteDoc(doc(db, 'comparisons', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createChoiceListDoc(
  data: Omit<ChoiceList, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ChoiceList> {
  const id = makeSafeId('chl');
  const path = `choiceLists/${id}`;
  try {
    const payload: Record<string, unknown> = {
      userId: data.userId,
      title: data.title.slice(0, 160),
      systemCode: data.systemCode,
      academicYear: data.academicYear,
      items: data.items.slice(0, 150),
      versions: data.versions.slice(0, 15),
      shareEnabled: data.shareEnabled,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (data.shareToken) payload.shareToken = data.shareToken;
    await setDoc(doc(db, 'choiceLists', id), payload);
    const now = new Date().toISOString();
    return { ...data, id, createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateChoiceListDoc(
  id: string,
  updates: Pick<ChoiceList, 'title' | 'items' | 'versions' | 'shareToken' | 'shareEnabled'>
): Promise<void> {
  const path = `choiceLists/${id}`;
  try {
    const payload: Record<string, unknown> = {
      title: updates.title.slice(0, 160),
      items: updates.items.slice(0, 150),
      versions: updates.versions.slice(0, 15),
      shareEnabled: updates.shareEnabled,
      updatedAt: serverTimestamp(),
    };
    if (updates.shareToken !== undefined) {
      payload.shareToken = updates.shareToken;
    }
    await updateDoc(doc(db, 'choiceLists', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteChoiceListDoc(id: string, shareToken?: string): Promise<void> {
  const path = `choiceLists/${id}`;
  try {
    await deleteDoc(doc(db, 'choiceLists', id));
    if (shareToken) {
      await deleteDoc(doc(db, 'sharedLists', shareToken)).catch(() => undefined);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertSharedChoiceList(snapshot: Omit<SharedChoiceList, 'updatedAt'>): Promise<void> {
  const path = `sharedLists/${snapshot.shareToken}`;
  try {
    await setDoc(doc(db, 'sharedLists', snapshot.shareToken), {
      ...snapshot,
      items: snapshot.items.slice(0, 150),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSharedChoiceList(shareToken: string): Promise<void> {
  const path = `sharedLists/${shareToken}`;
  try {
    await deleteDoc(doc(db, 'sharedLists', shareToken));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchSharedChoiceListByToken(
  shareToken: string
): Promise<SharedChoiceList | null> {
  const path = `sharedLists/${shareToken}`;
  try {
    const snap = await getDoc(doc(db, 'sharedLists', shareToken));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...(data as SharedChoiceList),
      updatedAt: toIso(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createSavedPredictionDoc(
  data: Omit<SavedPrediction, 'id' | 'createdAt'>
): Promise<SavedPrediction> {
  const id = makeSafeId('prd');
  const path = `savedPredictions/${id}`;
  try {
    await setDoc(doc(db, 'savedPredictions', id), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { ...data, id, createdAt: new Date().toISOString() };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveUserTrackingDoc(tracking: Omit<UserTracking, 'updatedAt'>): Promise<void> {
  const path = `userTracking/${tracking.uid}`;
  try {
    await setDoc(doc(db, 'userTracking', tracking.uid), {
      uid: tracking.uid,
      followedSystems: tracking.followedSystems.slice(0, 20),
      savedScheduleIds: tracking.savedScheduleIds.slice(0, 100),
      checkedDocIds: tracking.checkedDocIds.slice(0, 100),
      journeySteps: tracking.journeySteps.slice(0, 30),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createNotificationDoc(
  data: Omit<NotificationItem, 'id' | 'createdAt'>
): Promise<NotificationItem> {
  const id = makeSafeId('ntf');
  const path = `notifications/${id}`;
  try {
    await setDoc(doc(db, 'notifications', id), {
      userId: data.userId,
      systemCode: data.systemCode,
      title: data.title.slice(0, 200),
      body: data.body.slice(0, 1000),
      isRead: data.isRead,
      createdAt: serverTimestamp(),
    });
    return { ...data, id, createdAt: new Date().toISOString() };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationReadDoc(id: string): Promise<void> {
  const path = `notifications/${id}`;
  try {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createDataReportDoc(
  data: Omit<DataReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<DataReport> {
  const id = makeSafeId('rep');
  const path = `dataReports/${id}`;
  try {
    const payload: Record<string, unknown> = {
      reporterUid: data.reporterUid,
      entityType: data.entityType,
      entityId: data.entityId.slice(0, 160),
      entityLabel: data.entityLabel.slice(0, 240),
      issueType: data.issueType.slice(0, 80),
      details: data.details.slice(0, 1500),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (data.reporterEmail) payload.reporterEmail = data.reporterEmail.slice(0, 200);
    await setDoc(doc(db, 'dataReports', id), payload);
    const now = new Date().toISOString();
    return { ...data, id, status: 'open', createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function incrementUsageMetric(
  metricType: UsageMetric['metricType'],
  systemCode: string
): Promise<void> {
  const dateKey = new Date().toISOString().slice(0, 10);
  const id = `${metricType}_${systemCode.toLowerCase()}_${dateKey}`.replace(/[^a-zA-Z0-9_-]/g, '');
  try {
    const ref = doc(db, 'usageMetrics', id);
    const snap = await getDoc(ref).catch(() => null);
    if (snap && snap.exists()) {
      const current = Number(snap.data().count ?? 0);
      await updateDoc(ref, {
        count: current + 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        metricType,
        systemCode: systemCode.toLowerCase(),
        dateKey,
        count: 1,
        updatedAt: serverTimestamp(),
      });
    }
  } catch {
    // Non-blocking aggregate analytics; ignore if unauthenticated or denied
  }
}

export async function deleteAllStudentDataDocs(uid: string): Promise<void> {
  try {
    const collections = [
      { name: 'savedColleges', field: 'userId' },
      { name: 'comparisons', field: 'userId' },
      { name: 'choiceLists', field: 'userId' },
      { name: 'savedPredictions', field: 'userId' },
      { name: 'notifications', field: 'userId' },
    ];
    for (const col of collections) {
      const snap = await getDocs(query(collection(db, col.name), where(col.field, '==', uid)));
      for (const d of snap.docs) {
        if (col.name === 'choiceLists' && d.data().shareToken) {
          await deleteDoc(doc(db, 'sharedLists', d.data().shareToken)).catch(() => undefined);
        }
        await deleteDoc(d.ref);
      }
    }
    await deleteDoc(doc(db, 'userTracking', uid)).catch(() => undefined);
    await deleteDoc(doc(db, 'users', uid)).catch(() => undefined);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
  }
}

// ============================================================================
// Admin Operations (Strictly Role-Gated by Firestore Rules)
// ============================================================================

export async function fetchAdminDashboardData(): Promise<{
  reports: DataReport[];
  importLogs: ImportLog[];
  auditLogs: AuditLog[];
  usageMetrics: UsageMetric[];
}> {
  try {
    const [repSnap, impSnap, audSnap, metSnap] = await Promise.all([
      getDocs(query(collection(db, 'dataReports'), limit(200))),
      getDocs(query(collection(db, 'importLogs'), limit(100))),
      getDocs(query(collection(db, 'auditLogs'), limit(150))),
      getDocs(query(collection(db, 'usageMetrics'), limit(200))),
    ]);

    return {
      reports: repSnap.docs
        .map((d) => ({
          ...(d.data() as Omit<DataReport, 'id'>),
          id: d.id,
          createdAt: toIso(d.data().createdAt),
          updatedAt: toIso(d.data().updatedAt),
        }))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
      importLogs: impSnap.docs
        .map((d) => ({
          ...(d.data() as Omit<ImportLog, 'id'>),
          id: d.id,
          createdAt: toIso(d.data().createdAt),
        }))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
      auditLogs: audSnap.docs
        .map((d) => ({
          ...(d.data() as Omit<AuditLog, 'id'>),
          id: d.id,
          createdAt: toIso(d.data().createdAt),
        }))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
      usageMetrics: metSnap.docs.map((d) => ({
        ...(d.data() as Omit<UsageMetric, 'id'>),
        id: d.id,
        updatedAt: toIso(d.data().updatedAt),
      })),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin');
  }
}

export async function logAdminAction(params: {
  actorUid: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}): Promise<void> {
  const id = makeSafeId('aud');
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      actorUid: params.actorUid,
      actorEmail: params.actorEmail.slice(0, 200),
      action: params.action.slice(0, 80),
      entityType: params.entityType.slice(0, 80),
      entityId: params.entityId.slice(0, 160),
      summary: params.summary.slice(0, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `auditLogs/${id}`);
  }
}

export async function adminUpsertInstitution(
  inst: Institution,
  actor: { uid: string; email: string }
): Promise<void> {
  const path = `institutions/${inst.id}`;
  try {
    const payload: Record<string, unknown> = {
      slug: inst.slug,
      name: inst.name,
      shortName: inst.shortName,
      type: inst.type,
      state: inst.state,
      city: inst.city,
      systems: inst.systems,
      sourceName: inst.sourceName,
      academicYear: inst.academicYear,
      isDemo: inst.isDemo,
      status: inst.status,
      verificationStatus: inst.verificationStatus,
      verifiedAt: inst.verifiedAt,
      updatedAt: serverTimestamp(),
    };
    if (inst.establishedYear != null) payload.establishedYear = inst.establishedYear;
    if (inst.websiteUrl) payload.websiteUrl = inst.websiteUrl;
    if (inst.overview) payload.overview = inst.overview;
    if (inst.description) payload.description = inst.description;
    if (inst.ownership) payload.ownership = inst.ownership;
    if (inst.ownershipDetails) payload.ownershipDetails = inst.ownershipDetails;
    if (inst.logoMonogram) payload.logoMonogram = inst.logoMonogram;
    if (inst.logoAccent) payload.logoAccent = inst.logoAccent;
    if (inst.address) payload.address = inst.address;
    if (inst.nearestTransit) payload.nearestTransit = inst.nearestTransit;
    if (inst.contactEmail) payload.contactEmail = inst.contactEmail;
    if (inst.contactPhone) payload.contactPhone = inst.contactPhone;
    if (inst.nirfRanking) payload.nirfRanking = inst.nirfRanking;
    if (inst.otherRankings && inst.otherRankings.length > 0) payload.otherRankings = inst.otherRankings;
    if (inst.accreditation) payload.accreditation = inst.accreditation;
    if (inst.coursesOffered && inst.coursesOffered.length > 0) payload.coursesOffered = inst.coursesOffered;
    if (inst.entranceExams && inst.entranceExams.length > 0) payload.entranceExams = inst.entranceExams;
    if (inst.eligibilitySummary) payload.eligibilitySummary = inst.eligibilitySummary;
    if (inst.admissionProcess) payload.admissionProcess = inst.admissionProcess;
    if (inst.feeRangeNote) payload.feeRangeNote = inst.feeRangeNote;
    if (inst.estimatedTotalFee) payload.estimatedTotalFee = inst.estimatedTotalFee;
    if (inst.placements) payload.placements = inst.placements;
    if (inst.campusFacilities && inst.campusFacilities.length > 0) payload.campusFacilities = inst.campusFacilities;
    if (inst.studentFacilities && inst.studentFacilities.length > 0) payload.studentFacilities = inst.studentFacilities;
    if (inst.galleryImages && inst.galleryImages.length > 0) payload.galleryImages = inst.galleryImages;
    if (inst.imageUrl) payload.imageUrl = inst.imageUrl;

    await setDoc(doc(db, 'institutions', inst.id), payload);
    await logAdminAction({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPSERT_INSTITUTION',
      entityType: 'institution',
      entityId: inst.id,
      summary: `Saved institution ${inst.name} (${inst.status}, ${inst.verificationStatus})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminUpsertCutoff(
  cutoff: CutoffRecord,
  actor: { uid: string; email: string }
): Promise<void> {
  const path = `cutoffs/${cutoff.id}`;
  try {
    const payload: Record<string, unknown> = {
      systemCode: cutoff.systemCode,
      examCode: cutoff.examCode,
      academicYear: cutoff.academicYear,
      roundNumber: cutoff.roundNumber,
      roundLabel: cutoff.roundLabel,
      institutionId: cutoff.institutionId,
      institutionSlug: cutoff.institutionSlug,
      institutionName: cutoff.institutionName,
      institutionType: cutoff.institutionType,
      state: cutoff.state,
      programmeId: cutoff.programmeId,
      programmeName: cutoff.programmeName,
      branchGroup: cutoff.branchGroup,
      quota: cutoff.quota,
      seatCategory: cutoff.seatCategory,
      seatPool: cutoff.seatPool,
      rankType: cutoff.rankType,
      openingRank: cutoff.openingRank,
      closingRank: cutoff.closingRank,
      sourceName: cutoff.sourceName,
      isDemo: cutoff.isDemo,
      status: cutoff.status,
      verificationStatus: cutoff.verificationStatus,
      verifiedAt: cutoff.verifiedAt,
      updatedAt: serverTimestamp(),
    };
    if (cutoff.sourceUrl) payload.sourceUrl = cutoff.sourceUrl;
    if (cutoff.importBatchId) payload.importBatchId = cutoff.importBatchId;

    await setDoc(doc(db, 'cutoffs', cutoff.id), payload);
    await logAdminAction({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPSERT_CUTOFF',
      entityType: 'cutoff',
      entityId: cutoff.id,
      summary: `Updated cutoff ${cutoff.institutionName} ${cutoff.programmeName} (${cutoff.status})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminCommitCsvImport(params: {
  rows: CutoffRecord[];
  existingCutoffs: CutoffRecord[];
  batchId: string;
  fileName: string;
  systemCode: string;
  academicYear: number;
  actor: { uid: string; email: string };
}): Promise<{ insertedCount: number; archivedCount: number }> {
  try {
    const existingById = new Map(params.existingCutoffs.map((c) => [c.id, c]));
    let archivedCount = 0;

    // Firestore batch limit is 500 ops; chunk safely at 200 rows per batch
    for (let i = 0; i < params.rows.length; i += 200) {
      const slice = params.rows.slice(i, i + 200);
      const batch = writeBatch(db);

      for (const row of slice) {
        const prev = existingById.get(row.id);
        // Never silently overwrite published data — archive superseded copy first!
        if (prev && prev.status === 'published') {
          const archivedId = `${prev.id}_arch_${Date.now().toString(36)}`.slice(0, 120);
          batch.set(doc(db, 'cutoffs', archivedId), {
            systemCode: prev.systemCode,
            examCode: prev.examCode,
            academicYear: prev.academicYear,
            roundNumber: prev.roundNumber,
            roundLabel: prev.roundLabel,
            institutionId: prev.institutionId,
            institutionSlug: prev.institutionSlug,
            institutionName: prev.institutionName,
            institutionType: prev.institutionType,
            state: prev.state,
            programmeId: prev.programmeId,
            programmeName: prev.programmeName,
            branchGroup: prev.branchGroup,
            quota: prev.quota,
            seatCategory: prev.seatCategory,
            seatPool: prev.seatPool,
            rankType: prev.rankType,
            openingRank: prev.openingRank,
            closingRank: prev.closingRank,
            sourceName: prev.sourceName,
            sourceUrl: prev.sourceUrl ?? '',
            isDemo: prev.isDemo,
            status: 'archived',
            verificationStatus: 'outdated',
            importBatchId: prev.importBatchId ?? 'pre_import',
            verifiedAt: prev.verifiedAt,
            updatedAt: serverTimestamp(),
          });
          archivedCount++;
        }

        batch.set(doc(db, 'cutoffs', row.id), {
          systemCode: row.systemCode,
          examCode: row.examCode,
          academicYear: row.academicYear,
          roundNumber: row.roundNumber,
          roundLabel: row.roundLabel,
          institutionId: row.institutionId,
          institutionSlug: row.institutionSlug,
          institutionName: row.institutionName,
          institutionType: row.institutionType,
          state: row.state,
          programmeId: row.programmeId,
          programmeName: row.programmeName,
          branchGroup: row.branchGroup,
          quota: row.quota,
          seatCategory: row.seatCategory,
          seatPool: row.seatPool,
          rankType: row.rankType,
          openingRank: row.openingRank,
          closingRank: row.closingRank,
          sourceName: row.sourceName,
          sourceUrl: row.sourceUrl ?? '',
          isDemo: row.isDemo,
          status: 'published',
          verificationStatus: row.verificationStatus,
          importBatchId: params.batchId,
          verifiedAt: row.verifiedAt,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }

    const logId = makeSafeId('imp');
    await setDoc(doc(db, 'importLogs', logId), {
      batchId: params.batchId,
      importedByUid: params.actor.uid,
      importedByEmail: params.actor.email.slice(0, 200),
      fileName: params.fileName.slice(0, 200),
      systemCode: params.systemCode,
      academicYear: params.academicYear,
      totalRows: params.rows.length,
      insertedCount: params.rows.length,
      archivedCount,
      errorCount: 0,
      status: 'completed',
      createdAt: serverTimestamp(),
    });

    await logAdminAction({
      actorUid: params.actor.uid,
      actorEmail: params.actor.email,
      action: 'CSV_IMPORT',
      entityType: 'cutoff_batch',
      entityId: params.batchId,
      summary: `Imported ${params.rows.length} cutoffs from ${params.fileName} (${archivedCount} archived)`,
    });

    return { insertedCount: params.rows.length, archivedCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'cutoffs/import');
  }
}

export async function adminRollbackImportBatch(
  log: ImportLog,
  actor: { uid: string; email: string }
): Promise<number> {
  try {
    const snap = await getDocs(
      query(collection(db, 'cutoffs'), where('importBatchId', '==', log.batchId))
    );
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, {
        status: 'archived',
        verificationStatus: 'outdated',
        updatedAt: serverTimestamp(),
      });
    });
    batch.update(doc(db, 'importLogs', log.id), { status: 'rolled_back' });
    await batch.commit();

    await logAdminAction({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'ROLLBACK_IMPORT',
      entityType: 'importLog',
      entityId: log.id,
      summary: `Rolled back batch ${log.batchId} (${snap.size} cutoffs archived)`,
    });
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `importLogs/${log.id}`);
  }
}

export async function adminUpsertSchedule(
  item: ScheduleItem,
  actor: { uid: string; email: string }
): Promise<void> {
  const path = `schedules/${item.id}`;
  try {
    await setDoc(doc(db, 'schedules', item.id), {
      systemCode: item.systemCode,
      academicYear: item.academicYear,
      title: item.title,
      phase: item.phase,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description ?? '',
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl ?? '',
      isOutdated: item.isOutdated,
      isDemo: item.isDemo,
      verifiedAt: item.verifiedAt,
      updatedAt: serverTimestamp(),
    });
    await logAdminAction({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPSERT_SCHEDULE',
      entityType: 'schedule',
      entityId: item.id,
      summary: `Saved schedule "${item.title}" (${item.systemCode.toUpperCase()})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminUpsertNotice(
  item: NoticeItem,
  actor: { uid: string; email: string }
): Promise<void> {
  const path = `notices/${item.id}`;
  try {
    await setDoc(doc(db, 'notices', item.id), {
      systemCode: item.systemCode,
      academicYear: item.academicYear,
      title: item.title,
      summary: item.summary,
      publishedDate: item.publishedDate,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl ?? '',
      isOutdated: item.isOutdated,
      isDemo: item.isDemo,
      verifiedAt: item.verifiedAt,
      updatedAt: serverTimestamp(),
    });
    await logAdminAction({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPSERT_NOTICE',
      entityType: 'notice',
      entityId: item.id,
      summary: `Saved notice "${item.title}" (${item.systemCode.toUpperCase()})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminUpsertContentItem(
  item: ContentItem,
  actor: { uid: string; email: string }
): Promise<void> {
  const path = `contentItems/${item.id}`;
  try {
    await setDoc(doc(db, 'contentItems', item.id), {
      kind: item.kind,
      systemCode: item.systemCode,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      body: item.body,
      category: item.category ?? '',
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl ?? '',
      isDemo: item.isDemo,
      verifiedAt: item.verifiedAt,
      updatedAt: serverTimestamp(),
    });
    await logAdminAction({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'UPSERT_CONTENT',
      entityType: item.kind,
      entityId: item.id,
      summary: `Saved ${item.kind} "${item.title}"`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminResolveDataReport(
  reportId: string,
  status: DataReport['status'],
  adminNote: string,
  actor: { uid: string; email: string }
): Promise<void> {
  const path = `dataReports/${reportId}`;
  try {
    await updateDoc(doc(db, 'dataReports', reportId), {
      status,
      adminNote: adminNote.slice(0, 1000),
      updatedAt: serverTimestamp(),
    });
    await logAdminAction({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: 'RESOLVE_REPORT',
      entityType: 'dataReport',
      entityId: reportId,
      summary: `Marked report ${reportId} as ${status}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminSeedDemoCatalogToFirestore(params: {
  institutions: Institution[];
  programmes: Programme[];
  cutoffs: CutoffRecord[];
  schedules: ScheduleItem[];
  notices: NoticeItem[];
  contentItems: ContentItem[];
  actor: { uid: string; email: string };
}): Promise<number> {
  try {
    let written = 0;
    const ops: { col: string; id: string; data: Record<string, unknown> }[] = [];

    for (const inst of params.institutions) {
      const { id, ...rest } = inst;
      ops.push({ col: 'institutions', id, data: { ...rest, updatedAt: serverTimestamp() } });
    }
    for (const prog of params.programmes) {
      const { id, ...rest } = prog;
      ops.push({ col: 'programmes', id, data: { ...rest, updatedAt: serverTimestamp() } });
    }
    for (const sched of params.schedules) {
      const { id, ...rest } = sched;
      ops.push({ col: 'schedules', id, data: { ...rest, updatedAt: serverTimestamp() } });
    }
    for (const notice of params.notices) {
      const { id, ...rest } = notice;
      ops.push({ col: 'notices', id, data: { ...rest, updatedAt: serverTimestamp() } });
    }
    for (const item of params.contentItems) {
      const { id, ...rest } = item;
      ops.push({ col: 'contentItems', id, data: { ...rest, updatedAt: serverTimestamp() } });
    }
    for (const c of params.cutoffs) {
      const { id, ...rest } = c;
      ops.push({
        col: 'cutoffs',
        id,
        data: { ...rest, importBatchId: 'demo_seed_v1', updatedAt: serverTimestamp() },
      });
    }

    for (let i = 0; i < ops.length; i += 350) {
      const chunk = ops.slice(i, i + 350);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.set(doc(db, op.col, op.id), op.data);
      }
      await batch.commit();
      written += chunk.length;
    }

    await logAdminAction({
      actorUid: params.actor.uid,
      actorEmail: params.actor.email,
      action: 'SEED_DEMO_CATALOG',
      entityType: 'catalog',
      entityId: 'demo_seed_v1',
      summary: `Seeded ${written} demo records to Firestore (all flagged isDemo=true)`,
    });

    return written;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_catalog');
  }
}
