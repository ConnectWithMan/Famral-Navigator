import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as firebaseUpdateProfile,
  User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import {
  checkAdminDoc,
  createChoiceListDoc,
  createComparisonDoc,
  createDataReportDoc,
  createNotificationDoc,
  createSavedCollegeDoc,
  createSavedPredictionDoc,
  deleteAllStudentDataDocs,
  deleteChoiceListDoc,
  deleteComparisonDoc,
  deleteSavedCollegeDoc,
  deleteSharedChoiceList,
  fetchPublishedCatalog,
  fetchStudentWorkspace,
  getOrCreateUserProfile,
  incrementUsageMetric,
  makeShareToken,
  markNotificationReadDoc,
  saveUserTrackingDoc,
  updateChoiceListDoc,
  updateSavedCollegeNotes,
  updateUserProfileDoc,
  upsertSharedChoiceList,
} from '../lib/firestoreService.ts';
import {
  SEED_CONTENT_ITEMS,
  SEED_CUTOFFS,
  SEED_INSTITUTIONS,
  SEED_NOTICES,
  SEED_PROGRAMMES,
  SEED_SCHEDULES,
} from '../data/demoSeed.ts';
import { enrichInstitutionWithProfile } from '../data/institutionProfiles.ts';
import {
  ChoiceList,
  ChoiceListItem,
  ComparisonWeights,
  ContentItem,
  CutoffRecord,
  DataReport,
  Institution,
  NoticeItem,
  NotificationItem,
  Programme,
  SavedCollege,
  SavedComparison,
  SavedPrediction,
  ScheduleItem,
  UserProfile,
  UserTracking,
} from '../types/domain.ts';
import { TRANSLATIONS } from '../i18n/translations.ts';
import { cacheChoiceListsOffline, loadOfflineChoiceLists, useOnlineStatus } from '../lib/usePWAInstall.ts';
import { triggerFileDownload } from '../lib/exporters.ts';

const BOOTSTRAPPED_ADMIN_EMAIL = 'connectwithman@gmail.com';

export interface ReportTarget {
  entityType: DataReport['entityType'];
  entityId: string;
  entityLabel: string;
}

interface AppContextValue {
  // Auth
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Copy labels
  t: (key: string) => string;

  // Catalog
  catalogLoading: boolean;
  catalogFromCloud: boolean;
  institutions: Institution[];
  programmes: Programme[];
  cutoffs: CutoffRecord[];
  schedules: ScheduleItem[];
  notices: NoticeItem[];
  contentItems: ContentItem[];
  refreshCatalog: () => Promise<void>;

  // Student Workspace
  workspaceLoading: boolean;
  savedColleges: SavedCollege[];
  comparisons: SavedComparison[];
  choiceLists: ChoiceList[];
  savedPredictions: SavedPrediction[];
  tracking: UserTracking;
  notifications: NotificationItem[];
  myReports: DataReport[];
  toggleSaveCollege: (params: {
    institution: Institution;
    programme?: Programme;
    notes?: string;
  }) => Promise<boolean>;
  updateSavedNotes: (id: string, notes: string) => Promise<void>;
  removeSavedCollege: (id: string) => Promise<void>;
  addItemToChoiceList: (item: ChoiceListItem, listId?: string, systemCode?: string) => Promise<string>;
  createChoiceList: (title: string, systemCode: string, academicYear: number, items?: ChoiceListItem[]) => Promise<ChoiceList>;
  saveChoiceList: (list: ChoiceList, versionSummary?: string) => Promise<void>;
  removeChoiceList: (list: ChoiceList) => Promise<void>;
  toggleChoiceListShare: (list: ChoiceList, enable: boolean) => Promise<ChoiceList>;
  savePredictionRun: (run: Omit<SavedPrediction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  saveComparison: (title: string, institutionIds: string[], weights: ComparisonWeights) => Promise<void>;
  removeComparison: (id: string) => Promise<void>;
  toggleFollowSystem: (systemCode: string) => Promise<void>;
  toggleSavedSchedule: (scheduleId: string) => Promise<void>;
  toggleCheckedDoc: (docId: string) => Promise<void>;
  toggleJourneyStep: (stepId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  trackMetric: (metricType: 'predictor_run' | 'cutoff_search' | 'college_view', systemCode: string) => void;

  // Report error modal
  reportTarget: ReportTarget | null;
  openReportModal: (target: ReportTarget) => void;
  closeReportModal: () => void;
  submitDataReport: (issueType: string, details: string) => Promise<void>;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Privacy / Account Control
  exportMyAccountData: () => void;
  deleteMyAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function mergeCatalogById<T extends { id: string }>(seed: T[], cloud: T[]): T[] {
  if (cloud.length === 0) return seed;
  const map = new Map<string, T>();
  for (const item of seed) map.set(item.id, item);
  for (const item of cloud) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeInstitutionsById(seed: Institution[], cloud: Institution[]): Institution[] {
  if (cloud.length === 0) return seed;
  const map = new Map<string, Institution>();
  for (const item of seed) map.set(item.id, item);
  for (const item of cloud) {
    const prev = map.get(item.id);
    map.set(item.id, enrichInstitutionWithProfile(prev ? { ...prev, ...item } : item));
  }
  return Array.from(map.values());
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Catalog state (starts immediately populated with demo seed, hydrated from Firestore)
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogFromCloud, setCatalogFromCloud] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>(SEED_INSTITUTIONS);
  const [programmes, setProgrammes] = useState<Programme[]>(SEED_PROGRAMMES);
  const [cutoffs, setCutoffs] = useState<CutoffRecord[]>(SEED_CUTOFFS);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(SEED_SCHEDULES);
  const [notices, setNotices] = useState<NoticeItem[]>(SEED_NOTICES);
  const [contentItems, setContentItems] = useState<ContentItem[]>(SEED_CONTENT_ITEMS);

  // Student workspace state
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [savedColleges, setSavedColleges] = useState<SavedCollege[]>([]);
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [choiceLists, setChoiceLists] = useState<ChoiceList[]>([]);
  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>([]);
  const [tracking, setTracking] = useState<UserTracking>({
    uid: '',
    followedSystems: ['josaa'],
    savedScheduleIds: [],
    checkedDocIds: [],
    journeySteps: [],
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myReports, setMyReports] = useState<DataReport[]>([]);

  // UI Helpers
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  const t = useCallback((key: string) => TRANSLATIONS[key] ?? key, []);

  const refreshCatalog = useCallback(async (adminFlag?: boolean) => {
    setCatalogLoading(true);
    try {
      const effectiveAdmin = adminFlag ?? isAdmin;
      const cloud = await fetchPublishedCatalog(effectiveAdmin);
      const hasCloud =
        cloud.institutions.length > 0 ||
        cloud.cutoffs.length > 0 ||
        cloud.schedules.length > 0 ||
        cloud.notices.length > 0;
      setCatalogFromCloud(hasCloud);
      setInstitutions(mergeInstitutionsById(SEED_INSTITUTIONS, cloud.institutions));
      setProgrammes(mergeCatalogById(SEED_PROGRAMMES, cloud.programmes));
      setCutoffs(mergeCatalogById(SEED_CUTOFFS, cloud.cutoffs));
      setSchedules(mergeCatalogById(SEED_SCHEDULES, cloud.schedules));
      setNotices(mergeCatalogById(SEED_NOTICES, cloud.notices));
      setContentItems(mergeCatalogById(SEED_CONTENT_ITEMS, cloud.contentItems));
    } catch {
      // Offline or unseeded fallback to explicit demo seed
      setInstitutions(SEED_INSTITUTIONS);
      setProgrammes(SEED_PROGRAMMES);
      setCutoffs(SEED_CUTOFFS);
      setSchedules(SEED_SCHEDULES);
      setNotices(SEED_NOTICES);
      setContentItems(SEED_CONTENT_ITEMS);
    } finally {
      setCatalogLoading(false);
    }
  }, [isAdmin]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setIsAdmin(false);
        setProfile(null);
        setSavedColleges([]);
        setComparisons([]);
        setChoiceLists([]);
        setSavedPredictions([]);
        setNotifications([]);
        setMyReports([]);
        setTracking({
          uid: '',
          followedSystems: ['josaa'],
          savedScheduleIds: [],
          checkedDocIds: [],
          journeySteps: [],
        });
        setAuthLoading(false);
        void refreshCatalog(false);
        return;
      }

      const verified = firebaseUser.emailVerified;
      const emailMatch =
        verified && firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const docAdmin = verified ? await checkAdminDoc(firebaseUser.uid) : false;
      const adminStatus = emailMatch || docAdmin;
      setIsAdmin(adminStatus);

      if (!isOnline) {
        setChoiceLists(loadOfflineChoiceLists(firebaseUser.uid));
        setAuthLoading(false);
        return;
      }

      setWorkspaceLoading(true);
      try {
        if (verified) {
          const prof = await getOrCreateUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Student',
          });
          setProfile(prof);

          const ws = await fetchStudentWorkspace(firebaseUser.uid);
          setSavedColleges(ws.savedColleges);
          setComparisons(ws.comparisons);
          setChoiceLists(ws.choiceLists);
          setSavedPredictions(ws.savedPredictions);
          setTracking(ws.tracking);
          setNotifications(ws.notifications);
          setMyReports(ws.myReports);
          cacheChoiceListsOffline(firebaseUser.uid, ws.choiceLists);
        }
      } catch (err) {
        console.error('Failed loading workspace:', err);
        setChoiceLists(loadOfflineChoiceLists(firebaseUser.uid));
      } finally {
        setWorkspaceLoading(false);
        setAuthLoading(false);
        void refreshCatalog(adminStatus);
      }
    });

    return () => unsub();
  }, [isOnline]);

  // Auth Actions
  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleAuthProvider);
    showToast('Signed in with Google');
  }, [showToast]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('Signed in successfully');
    },
    [showToast]
  );

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await firebaseUpdateProfile(cred.user, { displayName: name.trim() });
      }
      await sendEmailVerification(cred.user).catch(() => undefined);
      showToast('Account created. Check your inbox to verify your email.');
    },
    [showToast]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('Password reset email sent.');
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    showToast('Signed out');
  }, [showToast]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Sign in to update your profile.');
      await updateUserProfileDoc(user.uid, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      showToast('Profile saved');
    },
    [user, showToast]
  );

  // Saved Colleges
  const toggleSaveCollege = useCallback(
    async ({
      institution,
      programme,
      notes,
    }: {
      institution: Institution;
      programme?: Programme;
      notes?: string;
    }) => {
      if (!user) {
        showToast('Sign in to save colleges to your account.');
        return false;
      }
      const existing = savedColleges.find(
        (s) =>
          s.institutionId === institution.id &&
          (s.programmeId ?? '') === (programme?.id ?? '')
      );
      if (existing) {
        await deleteSavedCollegeDoc(existing.id);
        setSavedColleges((prev) => prev.filter((s) => s.id !== existing.id));
        showToast(`Removed ${institution.shortName} from saved colleges`);
        return false;
      }
      const created = await createSavedCollegeDoc({
        userId: user.uid,
        institutionId: institution.id,
        institutionSlug: institution.slug,
        institutionName: institution.name,
        programmeId: programme?.id,
        programmeName: programme?.name,
        notes: notes ?? '',
      });
      setSavedColleges((prev) => [created, ...prev]);
      showToast(`Saved ${institution.shortName}`);
      return true;
    },
    [user, savedColleges, showToast]
  );

  const updateSavedNotes = useCallback(
    async (id: string, notes: string) => {
      await updateSavedCollegeNotes(id, notes);
      setSavedColleges((prev) => prev.map((s) => (s.id === id ? { ...s, notes } : s)));
      showToast('Notes updated');
    },
    [showToast]
  );

  const removeSavedCollege = useCallback(
    async (id: string) => {
      await deleteSavedCollegeDoc(id);
      setSavedColleges((prev) => prev.filter((s) => s.id !== id));
      showToast('Removed saved college');
    },
    [showToast]
  );

  // Choice Lists
  const createChoiceList = useCallback(
    async (title: string, systemCode: string, academicYear: number, items: ChoiceListItem[] = []) => {
      if (!user) throw new Error('Sign in to create a choice list.');
      const created = await createChoiceListDoc({
        userId: user.uid,
        title: title.trim() || 'My JoSAA Preference List',
        systemCode,
        academicYear,
        items,
        versions: [
          {
            versionId: `v_${Date.now().toString(36)}`,
            savedAt: new Date().toISOString(),
            summary: 'Initial list created',
            items,
          },
        ],
        shareEnabled: false,
      });
      setChoiceLists((prev) => {
        const next = [created, ...prev];
        cacheChoiceListsOffline(user.uid, next);
        return next;
      });
      showToast(`Created choice list "${created.title}"`);
      return created;
    },
    [user, showToast]
  );

  const saveChoiceList = useCallback(
    async (list: ChoiceList, versionSummary?: string) => {
      if (!user) throw new Error('Sign in to save your choice list.');
      const nextVersions = versionSummary
        ? [
            {
              versionId: `v_${Date.now().toString(36)}`,
              savedAt: new Date().toISOString(),
              summary: versionSummary,
              items: list.items,
            },
            ...list.versions,
          ].slice(0, 15)
        : list.versions;

      const updated: ChoiceList = {
        ...list,
        versions: nextVersions,
        updatedAt: new Date().toISOString(),
      };

      await updateChoiceListDoc(list.id, {
        title: updated.title,
        items: updated.items,
        versions: updated.versions,
        shareToken: updated.shareToken,
        shareEnabled: updated.shareEnabled,
      });

      if (updated.shareEnabled && updated.shareToken) {
        await upsertSharedChoiceList({
          shareToken: updated.shareToken,
          listId: updated.id,
          ownerId: user.uid,
          title: updated.title,
          systemCode: updated.systemCode,
          academicYear: updated.academicYear,
          items: updated.items,
          includesDemoData: updated.items.some((i) => i.isDemo),
        });
      }

      setChoiceLists((prev) => {
        const next = prev.map((l) => (l.id === list.id ? updated : l));
        cacheChoiceListsOffline(user.uid, next);
        return next;
      });
    },
    [user]
  );

  const addItemToChoiceList = useCallback(
    async (item: ChoiceListItem, listId?: string, systemCode?: string) => {
      if (!user) {
        showToast('Sign in to build and save choice lists.');
        return '';
      }
      const normalizedSys = (systemCode || 'josaa').toLowerCase();
      let target = listId
        ? choiceLists.find((l) => l.id === listId)
        : choiceLists.find((l) => l.systemCode.toLowerCase() === normalizedSys) ?? choiceLists[0];
      if (!target) {
        const labelMap: Record<string, string> = {
          josaa: 'JoSAA',
          'jee-advanced': 'JEE Advanced',
          csab: 'CSAB',
          reap: 'REAP',
          'mht-cet': 'MHT CET',
          wbjee: 'WBJEE',
          kcet: 'KCET',
        };
        const sysLabel = labelMap[normalizedSys] ?? normalizedSys.toUpperCase();
        target = await createChoiceList(
          `My ${sysLabel} Preference List`,
          normalizedSys,
          item.academicYear ?? 2025,
          [item]
        );
        return target.id;
      }
      const updatedList: ChoiceList = {
        ...target,
        items: [...target.items, item],
      };
      await saveChoiceList(updatedList, `Added ${item.institutionName} — ${item.programmeName}`);
      showToast(`Added to "${target.title}"`);
      return target.id;
    },
    [user, choiceLists, createChoiceList, saveChoiceList, showToast]
  );

  const removeChoiceList = useCallback(
    async (list: ChoiceList) => {
      if (!user) return;
      await deleteChoiceListDoc(list.id, list.shareToken);
      setChoiceLists((prev) => {
        const next = prev.filter((l) => l.id !== list.id);
        cacheChoiceListsOffline(user.uid, next);
        return next;
      });
      showToast(`Deleted "${list.title}"`);
    },
    [user, showToast]
  );

  const toggleChoiceListShare = useCallback(
    async (list: ChoiceList, enable: boolean) => {
      if (!user) throw new Error('Sign in to manage share links.');
      if (enable) {
        const token = list.shareToken && list.shareToken.length >= 16 ? list.shareToken : makeShareToken();
        const updated: ChoiceList = { ...list, shareToken: token, shareEnabled: true };
        await updateChoiceListDoc(list.id, {
          title: updated.title,
          items: updated.items,
          versions: updated.versions,
          shareToken: token,
          shareEnabled: true,
        });
        await upsertSharedChoiceList({
          shareToken: token,
          listId: updated.id,
          ownerId: user.uid,
          title: updated.title,
          systemCode: updated.systemCode,
          academicYear: updated.academicYear,
          items: updated.items,
          includesDemoData: updated.items.some((i) => i.isDemo),
        });
        setChoiceLists((prev) => prev.map((l) => (l.id === list.id ? updated : l)));
        showToast('Read-only share link enabled');
        return updated;
      } else {
        if (list.shareToken) {
          await deleteSharedChoiceList(list.shareToken);
        }
        const updated: ChoiceList = { ...list, shareEnabled: false, shareToken: '' };
        await updateChoiceListDoc(list.id, {
          title: updated.title,
          items: updated.items,
          versions: updated.versions,
          shareToken: '',
          shareEnabled: false,
        });
        setChoiceLists((prev) => prev.map((l) => (l.id === list.id ? updated : l)));
        showToast('Share link revoked');
        return updated;
      }
    },
    [user, showToast]
  );

  // Saved Predictions
  const savePredictionRun = useCallback(
    async (run: Omit<SavedPrediction, 'id' | 'userId' | 'createdAt'>) => {
      if (!user) {
        showToast('Sign in to save predictions to your dashboard.');
        return;
      }
      const created = await createSavedPredictionDoc({ ...run, userId: user.uid });
      setSavedPredictions((prev) => [created, ...prev]);
      showToast('Prediction saved to Dashboard');
    },
    [user, showToast]
  );

  // Saved Comparisons
  const saveComparison = useCallback(
    async (title: string, institutionIds: string[], weights: ComparisonWeights) => {
      if (!user) {
        showToast('Sign in to save comparisons.');
        return;
      }
      const created = await createComparisonDoc({
        userId: user.uid,
        title,
        institutionIds,
        weights,
      });
      setComparisons((prev) => [created, ...prev]);
      showToast('Comparison saved');
    },
    [user, showToast]
  );

  const removeComparison = useCallback(
    async (id: string) => {
      await deleteComparisonDoc(id);
      setComparisons((prev) => prev.filter((c) => c.id !== id));
      showToast('Comparison deleted');
    },
    [showToast]
  );

  // Counselling Tracking (follow systems, saved dates, document checklist, journey)
  const updateTrackingField = useCallback(
    async (updater: (prev: UserTracking) => UserTracking, toastText?: string) => {
      if (!user) {
        showToast('Sign in to save your counselling progress.');
        return;
      }
      const next = updater({ ...tracking, uid: user.uid });
      setTracking(next);
      await saveUserTrackingDoc({
        uid: user.uid,
        followedSystems: next.followedSystems,
        savedScheduleIds: next.savedScheduleIds,
        checkedDocIds: next.checkedDocIds,
        journeySteps: next.journeySteps,
      });
      if (toastText) showToast(toastText);
    },
    [user, tracking, showToast]
  );

  const toggleFollowSystem = useCallback(
    async (systemCode: string) => {
      const already = tracking.followedSystems.includes(systemCode);
      await updateTrackingField(
        (prev) => ({
          ...prev,
          followedSystems: already
            ? prev.followedSystems.filter((s) => s !== systemCode)
            : [...prev.followedSystems, systemCode],
        }),
        already ? `Unfollowed ${systemCode.toUpperCase()}` : `Following ${systemCode.toUpperCase()} updates`
      );
      if (!already && user) {
        const ntf = await createNotificationDoc({
          userId: user.uid,
          systemCode,
          title: `Following ${systemCode.toUpperCase()} counselling updates`,
          body: `You will receive in-app change alerts whenever new ${systemCode.toUpperCase()} cutoffs, dates, or notices are published in Famral Navigator.`,
          isRead: false,
        });
        setNotifications((prev) => [ntf, ...prev]);
      }
    },
    [tracking.followedSystems, updateTrackingField, user]
  );

  const toggleSavedSchedule = useCallback(
    async (scheduleId: string) => {
      const already = tracking.savedScheduleIds.includes(scheduleId);
      await updateTrackingField(
        (prev) => ({
          ...prev,
          savedScheduleIds: already
            ? prev.savedScheduleIds.filter((s) => s !== scheduleId)
            : [...prev.savedScheduleIds, scheduleId],
        }),
        already ? 'Removed date from saved deadlines' : 'Date saved to your Dashboard'
      );
    },
    [tracking.savedScheduleIds, updateTrackingField]
  );

  const toggleCheckedDoc = useCallback(
    async (docId: string) => {
      const already = tracking.checkedDocIds.includes(docId);
      await updateTrackingField((prev) => ({
        ...prev,
        checkedDocIds: already
          ? prev.checkedDocIds.filter((d) => d !== docId)
          : [...prev.checkedDocIds, docId],
      }));
    },
    [tracking.checkedDocIds, updateTrackingField]
  );

  const toggleJourneyStep = useCallback(
    async (stepId: string) => {
      const already = tracking.journeySteps.includes(stepId);
      await updateTrackingField((prev) => ({
        ...prev,
        journeySteps: already
          ? prev.journeySteps.filter((s) => s !== stepId)
          : [...prev.journeySteps, stepId],
      }));
    },
    [tracking.journeySteps, updateTrackingField]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    await markNotificationReadDoc(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const trackMetric = useCallback(
    (metricType: 'predictor_run' | 'cutoff_search' | 'college_view', systemCode: string) => {
      if (user && user.emailVerified) {
        void incrementUsageMetric(metricType, systemCode);
      }
    },
    [user]
  );

  // Error reporting
  const openReportModal = useCallback((target: ReportTarget) => setReportTarget(target), []);
  const closeReportModal = useCallback(() => setReportTarget(null), []);

  const submitDataReport = useCallback(
    async (issueType: string, details: string) => {
      if (!user) throw new Error('Please sign in to submit an error report.');
      if (!reportTarget) return;
      const created = await createDataReportDoc({
        reporterUid: user.uid,
        reporterEmail: user.email ?? '',
        entityType: reportTarget.entityType,
        entityId: reportTarget.entityId,
        entityLabel: reportTarget.entityLabel,
        issueType,
        details,
      });
      setMyReports((prev) => [created, ...prev]);
      setReportTarget(null);
      showToast('Thank you — your report has been queued for admin review.');
    },
    [user, reportTarget, showToast]
  );

  // Privacy: Download all user data & Delete account
  const exportMyAccountData = useCallback(() => {
    if (!user) return;
    const bundle = {
      exportedAt: new Date().toISOString(),
      service: 'Famral Navigator',
      profile,
      savedColleges,
      comparisons,
      choiceLists,
      savedPredictions,
      tracking,
      notifications,
      myReports,
    };
    triggerFileDownload(
      JSON.stringify(bundle, null, 2),
      `famral-navigator-my-data-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    showToast('Your account data export has downloaded.');
  }, [user, profile, savedColleges, comparisons, choiceLists, savedPredictions, tracking, notifications, myReports, showToast]);

  const deleteMyAccount = useCallback(async () => {
    if (!user) return;
    await deleteAllStudentDataDocs(user.uid);
    try {
      await deleteUser(user);
    } catch {
      // If recent-login required for auth deletion, sign out cleanly after wiping Firestore docs
      await signOut(auth);
    }
    showToast('Your data and account session have been removed.');
  }, [user, showToast]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authLoading,
      isAdmin,
      profile,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      logout,
      updateProfile,
      t,
      catalogLoading,
      catalogFromCloud,
      institutions,
      programmes,
      cutoffs,
      schedules,
      notices,
      contentItems,
      refreshCatalog,
      workspaceLoading,
      savedColleges,
      comparisons,
      choiceLists,
      savedPredictions,
      tracking,
      notifications,
      myReports,
      toggleSaveCollege,
      updateSavedNotes,
      removeSavedCollege,
      addItemToChoiceList,
      createChoiceList,
      saveChoiceList,
      removeChoiceList,
      toggleChoiceListShare,
      savePredictionRun,
      saveComparison,
      removeComparison,
      toggleFollowSystem,
      toggleSavedSchedule,
      toggleCheckedDoc,
      toggleJourneyStep,
      markNotificationRead,
      trackMetric,
      reportTarget,
      openReportModal,
      closeReportModal,
      submitDataReport,
      toastMessage,
      showToast,
      exportMyAccountData,
      deleteMyAccount,
    }),
    [
      user,
      authLoading,
      isAdmin,
      profile,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      logout,
      updateProfile,
      t,
      catalogLoading,
      catalogFromCloud,
      institutions,
      programmes,
      cutoffs,
      schedules,
      notices,
      contentItems,
      refreshCatalog,
      workspaceLoading,
      savedColleges,
      comparisons,
      choiceLists,
      savedPredictions,
      tracking,
      notifications,
      myReports,
      toggleSaveCollege,
      updateSavedNotes,
      removeSavedCollege,
      addItemToChoiceList,
      createChoiceList,
      saveChoiceList,
      removeChoiceList,
      toggleChoiceListShare,
      savePredictionRun,
      saveComparison,
      removeComparison,
      toggleFollowSystem,
      toggleSavedSchedule,
      toggleCheckedDoc,
      toggleJourneyStep,
      markNotificationRead,
      trackMetric,
      reportTarget,
      openReportModal,
      closeReportModal,
      submitDataReport,
      toastMessage,
      showToast,
      exportMyAccountData,
      deleteMyAccount,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
