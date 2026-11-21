import {
  ContentItem,
  CutoffRecord,
  Institution,
  NoticeItem,
  Programme,
  RankType,
  ScheduleItem,
  SeatPool,
} from '../types/domain.ts';
import { buildCutoffCompositeKey } from '../engine/csvValidator.ts';
import { enrichInstitutionWithProfile } from './institutionProfiles.ts';
import {
  ALL_CENTRAL_INSTITUTIONS,
  CENTRAL_INSTITUTION_MAP,
  type CentralInstitutionEntry,
} from './centralInstitutions.ts';
import { PROG_CATALOG } from './programCatalog.ts';

export const HERO_IMAGE_URL = '/src/assets/images/hero_campus_clarity_1795259859078.jpg';
export const NIT_IMAGE_URL = '/src/assets/images/campus_nit_south_1795259861055.jpg';
export const IIIT_IMAGE_URL = '/src/assets/images/campus_iiit_tech_1795259859792.jpg';
export const GFTI_IMAGE_URL = '/src/assets/images/campus_gfti_heritage_1795259858934.jpg';

export const DEMO_SOURCE_JOSAA = 'Demo Sample Dataset (Simulated JoSAA Format — Not Official)';
export const DEMO_SOURCE_JEE_ADV = 'Demo Sample Dataset (Simulated JEE Advanced / JoSAA IIT Format — Not Official)';
export const DEMO_SOURCE_CSAB = 'Demo Sample Dataset (Simulated CSAB Format — Not Official)';
export const DEMO_SOURCE_REAP = 'Demo Sample Dataset (Simulated REAP Format — Not Official)';
export const DEMO_SOURCE_MHTCET = 'Demo Sample Dataset (Simulated MHT CET Format — Not Official)';
export const DEMO_SOURCE_WBJEE = 'Demo Sample Dataset (Simulated WBJEE Format — Not Official)';
export const DEMO_SOURCE_KCET = 'Demo Sample Dataset (Simulated KCET Format — Not Official)';
export const DEMO_VERIFIED_DATE = '2025-07-20';

function buildCentralSeedInstitution(entry: CentralInstitutionEntry): Institution {
  const isIit = entry.type === 'IIT';
  const imageUrl =
    entry.type === 'IIT'
      ? HERO_IMAGE_URL
      : entry.type === 'NIT'
        ? NIT_IMAGE_URL
        : entry.type === 'IIIT'
          ? IIIT_IMAGE_URL
          : GFTI_IMAGE_URL;

  const quotaNote =
    entry.quotaMode === 'AI'
      ? 'exclusively under the All India (AI) quota'
      : entry.quotaMode === 'GO_OS'
        ? 'under Goa State (GO) and Other State (OS) quotas'
        : entry.quotaMode === 'JK_HS_OS'
          ? 'under Home State / J&K (HS/JK) and Other State (OS) quotas'
          : `under Home State (${entry.state}) and Other State (OS) quotas`;

  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    shortName: entry.shortName,
    type: entry.type,
    state: entry.state,
    city: entry.city,
    establishedYear: entry.establishedYear,
    websiteUrl: entry.websiteUrl,
    overview: isIit
      ? `Indian Institute of Technology in ${entry.city}, ${entry.state} admitting undergraduate B.Tech/B.S. candidates via JEE Advanced and JoSAA All India seat allocation.`
      : `${entry.ownership === 'Private' ? 'Participating Deemed University' : 'Public technical institution'} (${entry.type}) in ${entry.city}, ${entry.state} participating in JoSAA and CSAB undergraduate counselling.`,
    admissionProcess: isIit
      ? `Undergraduate seats are allocated via JoSAA using JEE Advanced ranks strictly ${quotaNote}.`
      : `Undergraduate seats are allocated via JoSAA and CSAB using JEE Main ranks ${quotaNote}.`,
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: isIit ? ['jee-advanced'] : ['josaa', 'csab'],
    imageUrl,
    sourceName: isIit ? DEMO_SOURCE_JEE_ADV : DEMO_SOURCE_JOSAA,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  };
}

const STATE_SEED_INSTITUTIONS: Institution[] = [
  // REAP (Rajasthan) Participating Institutions
  {
    id: 'inst_mbm_jodhpur',
    slug: 'mbm-university-jodhpur',
    name: 'MBM University, Jodhpur',
    shortName: 'MBM Jodhpur',
    type: 'State University',
    state: 'Rajasthan',
    city: 'Jodhpur',
    establishedYear: 1951,
    websiteUrl: 'https://www.mbm.ac.in',
    overview:
      'State technical university in Jodhpur, Rajasthan admitting undergraduate B.E./B.Tech students through REAP counselling.',
    admissionProcess:
      'Seats are allocated via REAP under Rajasthan Domicile (HS) and Out-of-Rajasthan (OS) quotas based on JEE Main / Class 12 merit.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['reap'],
    imageUrl: GFTI_IMAGE_URL,
    sourceName: DEMO_SOURCE_REAP,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_rtu_kota',
    slug: 'rtu-kota',
    name: 'Rajasthan Technical University (University Department), Kota',
    shortName: 'RTU Kota',
    type: 'State University',
    state: 'Rajasthan',
    city: 'Kota',
    establishedYear: 2006,
    websiteUrl: 'https://www.rtu.ac.in',
    overview:
      'Public state technical university campus in Kota participating in Rajasthan Engineering Admission Process (REAP).',
    admissionProcess:
      'Undergraduate admissions follow REAP seat allocation rounds for Rajasthan Domicile (HS) and Out-of-Rajasthan (OS) candidates.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['reap'],
    imageUrl: GFTI_IMAGE_URL,
    sourceName: DEMO_SOURCE_REAP,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_ctae_udaipur',
    slug: 'ctae-udaipur',
    name: 'College of Technology and Engineering (CTAE), Udaipur',
    shortName: 'CTAE Udaipur',
    type: 'State University',
    state: 'Rajasthan',
    city: 'Udaipur',
    establishedYear: 1964,
    websiteUrl: 'https://www.ctae.ac.in',
    overview:
      'Constituent engineering college of MPUAT in Udaipur participating in REAP state counselling.',
    admissionProcess:
      'B.Tech seats filled through REAP counselling using JEE Main CRL / Class 12 merit across HS and OS quotas.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['reap'],
    imageUrl: NIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_REAP,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_skit_jaipur',
    slug: 'skit-jaipur',
    name: 'Swami Keshvanand Institute of Technology (SKIT), Jaipur',
    shortName: 'SKIT Jaipur',
    type: 'State University',
    state: 'Rajasthan',
    city: 'Jaipur',
    establishedYear: 2000,
    websiteUrl: 'https://www.skit.ac.in',
    overview:
      'Autonomous engineering institute in Jaipur affiliated with RTU Kota and participating in REAP counselling.',
    admissionProcess:
      'Participates in REAP centralised rounds for Rajasthan Domicile (HS) and Out-of-Rajasthan (OS) candidates.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['reap'],
    imageUrl: IIIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_REAP,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // MHT CET (Maharashtra) Participating Institutions
  {
    id: 'inst_coep_pune',
    slug: 'coep-pune',
    name: 'COEP Technological University, Pune',
    shortName: 'COEP Pune',
    type: 'State University',
    state: 'Maharashtra',
    city: 'Pune',
    establishedYear: 1854,
    websiteUrl: 'https://www.coep.org.in',
    overview:
      'Unitary public technological university in Pune admitting undergraduate B.Tech candidates via Maharashtra State CET Cell CAP rounds.',
    admissionProcess:
      'Admissions via MHT CET CAP under Maharashtra State (HS) and All India (AI) candidature rules.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['mht-cet'],
    imageUrl: GFTI_IMAGE_URL,
    sourceName: DEMO_SOURCE_MHTCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_vjti_mumbai',
    slug: 'vjti-mumbai',
    name: 'Veermata Jijabai Technological Institute (VJTI), Mumbai',
    shortName: 'VJTI Mumbai',
    type: 'State University',
    state: 'Maharashtra',
    city: 'Mumbai',
    establishedYear: 1887,
    websiteUrl: 'https://vjti.ac.in',
    overview:
      'Government-aided autonomous engineering institute in Mumbai participating in MHT CET CAP counselling.',
    admissionProcess:
      'Undergraduate B.Tech seats allotted through MHT CET State CET Cell CAP rounds under Maharashtra State (HS) and All India (AI) seats.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['mht-cet'],
    imageUrl: GFTI_IMAGE_URL,
    sourceName: DEMO_SOURCE_MHTCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_spit_mumbai',
    slug: 'spit-mumbai',
    name: 'Bharatiya Vidya Bhavan Sardar Patel Institute of Technology (SPIT), Mumbai',
    shortName: 'SPIT Mumbai',
    type: 'State University',
    state: 'Maharashtra',
    city: 'Mumbai',
    establishedYear: 1995,
    websiteUrl: 'https://www.spit.ac.in',
    overview:
      'Autonomous engineering institute in Mumbai participating in Maharashtra State CET Cell CAP admissions.',
    admissionProcess:
      'CAP Round 1 to 3 allotment via MHT CET State General Merit Rank under Maharashtra State (HS) and All India (AI) quotas.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['mht-cet'],
    imageUrl: IIIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_MHTCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_pict_pune',
    slug: 'pict-pune',
    name: 'Pune Institute of Computer Technology (PICT), Pune',
    shortName: 'PICT Pune',
    type: 'State University',
    state: 'Maharashtra',
    city: 'Pune',
    establishedYear: 1983,
    websiteUrl: 'https://pict.edu',
    overview:
      'Engineering institute in Pune specializing in Computer, IT, and Electronics programmes through MHT CET CAP.',
    admissionProcess:
      'Undergraduate seats filled through Maharashtra CET Cell CAP counselling under HS and AI quotas.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['mht-cet'],
    imageUrl: IIIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_MHTCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // WBJEE (West Bengal) Participating Institutions
  {
    id: 'inst_jadavpur_univ',
    slug: 'jadavpur-university',
    name: 'Jadavpur University, Kolkata',
    shortName: 'Jadavpur Univ',
    type: 'State University',
    state: 'West Bengal',
    city: 'Kolkata',
    establishedYear: 1955,
    websiteUrl: 'https://jadavpuruniversity.in',
    overview:
      'Public state research university in Kolkata admitting B.E. students through WBJEEB centralised counselling.',
    admissionProcess:
      'Seat allocation via WBJEE General Merit Rank (GMR) across West Bengal Domicile (HS) and All India (AI) seats.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['wbjee'],
    imageUrl: GFTI_IMAGE_URL,
    sourceName: DEMO_SOURCE_WBJEE,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_kgec_kalyani',
    slug: 'kgec-kalyani',
    name: 'Kalyani Government Engineering College (KGEC), Kalyani',
    shortName: 'KGEC Kalyani',
    type: 'State University',
    state: 'West Bengal',
    city: 'Kalyani',
    establishedYear: 1995,
    websiteUrl: 'https://www.kgec.edu.in',
    overview:
      'State government engineering college in West Bengal participating in WBJEE counselling.',
    admissionProcess:
      'B.Tech admissions conducted via WBJEEB counselling under West Bengal Domicile (HS) and All India (AI) quotas.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['wbjee'],
    imageUrl: NIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_WBJEE,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_jgec_jalpaiguri',
    slug: 'jgec-jalpaiguri',
    name: 'Jalpaiguri Government Engineering College (JGEC), Jalpaiguri',
    shortName: 'JGEC Jalpaiguri',
    type: 'State University',
    state: 'West Bengal',
    city: 'Jalpaiguri',
    establishedYear: 1961,
    websiteUrl: 'https://jgec.ac.in',
    overview:
      'Autonomous state government engineering college in North Bengal admitting undergraduate students via WBJEE.',
    admissionProcess:
      'Seats allocated through WBJEEB rounds using WBJEE General Merit Rank across HS and AI quotas.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['wbjee'],
    imageUrl: NIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_WBJEE,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_iem_kolkata',
    slug: 'iem-kolkata',
    name: 'Institute of Engineering & Management (IEM), Kolkata',
    shortName: 'IEM Kolkata',
    type: 'State University',
    state: 'West Bengal',
    city: 'Kolkata',
    establishedYear: 1989,
    websiteUrl: 'https://iem.edu.in',
    overview:
      'Self-financing engineering institute in Salt Lake, Kolkata participating in WBJEE counselling.',
    admissionProcess:
      'Participates in WBJEEB rounds with West Bengal Domicile (HS) and All India (AI) seats.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['wbjee'],
    imageUrl: IIIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_WBJEE,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // KCET (Karnataka) Participating Institutions
  {
    id: 'inst_rvce_bengaluru',
    slug: 'rvce-bengaluru',
    name: 'R.V. College of Engineering (RVCE), Bengaluru',
    shortName: 'RVCE Bengaluru',
    type: 'State University',
    state: 'Karnataka',
    city: 'Bengaluru',
    establishedYear: 1963,
    websiteUrl: 'https://www.rvce.edu.in',
    overview:
      'Autonomous engineering college in Bengaluru affiliated with VTU, participating in KEA KCET engineering counselling.',
    admissionProcess:
      'KEA KCET seats allotted via Engineering General Merit Rank under Karnataka State (HS) and Open Merit (AI) quotas.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['kcet'],
    imageUrl: NIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_KCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_bmsce_bengaluru',
    slug: 'bmsce-bengaluru',
    name: 'B.M.S. College of Engineering (BMSCE), Bengaluru',
    shortName: 'BMSCE Bengaluru',
    type: 'State University',
    state: 'Karnataka',
    city: 'Bengaluru',
    establishedYear: 1946,
    websiteUrl: 'https://www.bmsce.ac.in',
    overview:
      'Autonomous aided engineering institution in Bengaluru participating in KEA KCET undergraduate seat allotment.',
    admissionProcess:
      'B.E. seat allotment through KEA KCET Rounds 1, 2, and Extended Round under HS and AI quotas.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['kcet'],
    imageUrl: GFTI_IMAGE_URL,
    sourceName: DEMO_SOURCE_KCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_msrit_bengaluru',
    slug: 'msrit-bengaluru',
    name: 'M.S. Ramaiah Institute of Technology (MSRIT), Bengaluru',
    shortName: 'MSRIT Bengaluru',
    type: 'State University',
    state: 'Karnataka',
    city: 'Bengaluru',
    establishedYear: 1962,
    websiteUrl: 'https://www.msrit.edu',
    overview:
      'Autonomous engineering institute in Bengaluru offering undergraduate B.E. seats via KEA KCET counselling.',
    admissionProcess:
      'Allotment through KEA KCET counselling rounds based on KCET Engineering Rank.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['kcet'],
    imageUrl: IIIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_KCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'inst_pesu_bengaluru',
    slug: 'pes-university-bengaluru',
    name: 'PES University (Ring Road Campus), Bengaluru',
    shortName: 'PESU Bengaluru',
    type: 'State University',
    state: 'Karnataka',
    city: 'Bengaluru',
    establishedYear: 1972,
    websiteUrl: 'https://pes.edu',
    overview:
      'Private state university in Bengaluru offering Karnataka government-quota B.Tech seats via KEA KCET counselling.',
    admissionProcess:
      'Government quota seats allotted via KEA KCET counselling rounds using KCET Engineering Rank.',
    feeRangeNote: 'Not available — verify current semester fee schedule on official institute website',
    systems: ['kcet'],
    imageUrl: IIIT_IMAGE_URL,
    sourceName: DEMO_SOURCE_KCET,
    academicYear: 2025,
    isDemo: true,
    status: 'published',
    verificationStatus: 'unverified',
    verifiedAt: DEMO_VERIFIED_DATE,
  },
];

const RAW_SEED_INSTITUTIONS: Institution[] = [
  ...ALL_CENTRAL_INSTITUTIONS.map(buildCentralSeedInstitution),
  ...STATE_SEED_INSTITUTIONS,
];

export const SEED_INSTITUTIONS: Institution[] = RAW_SEED_INSTITUTIONS.map(
  enrichInstitutionWithProfile
);

const STATE_INST_PROGS: Record<string, string[]> = {
  // REAP
  inst_mbm_jodhpur: ['CSE', 'ECE', 'ME'],
  inst_rtu_kota: ['CSE', 'ECE', 'EE'],
  inst_ctae_udaipur: ['CSE', 'ME', 'CE'],
  inst_skit_jaipur: ['CSE', 'IT', 'ECE'],
  // MHT CET
  inst_coep_pune: ['CSE', 'ECE', 'ME'],
  inst_vjti_mumbai: ['CSE', 'IT', 'ECE'],
  inst_spit_mumbai: ['CSE', 'ECE', 'IT'],
  inst_pict_pune: ['CSE', 'IT', 'ECE'],
  // WBJEE
  inst_jadavpur_univ: ['CSE', 'IT', 'ECE'],
  inst_kgec_kalyani: ['CSE', 'IT', 'ECE'],
  inst_jgec_jalpaiguri: ['CSE', 'ECE', 'ME'],
  inst_iem_kolkata: ['CSE', 'IT', 'ECE'],
  // KCET
  inst_rvce_bengaluru: ['CSE', 'ECE', 'ME'],
  inst_bmsce_bengaluru: ['CSE', 'ECE', 'ME'],
  inst_msrit_bengaluru: ['CSE', 'IT', 'ECE'],
  inst_pesu_bengaluru: ['CSE', 'ECE', 'EE'],
};

const INST_PROGS: Record<string, string[]> = {
  ...Object.fromEntries(ALL_CENTRAL_INSTITUTIONS.map((c) => [c.id, c.branches])),
  ...STATE_INST_PROGS,
};

export const SEED_PROGRAMMES: Programme[] = Object.entries(INST_PROGS).flatMap(
  ([institutionId, codes]) => {
    const central = CENTRAL_INSTITUTION_MAP[institutionId];
    return codes.map((code) => {
      const tpl = PROG_CATALOG[code];
      if (!tpl) {
        throw new Error(`Unknown programme code "${code}" for ${institutionId}`);
      }
      return {
        id: `prog_${institutionId.replace('inst_', '')}_${code.toLowerCase()}`,
        institutionId,
        code: tpl.code,
        name: tpl.name,
        degree: tpl.degree,
        durationYears: tpl.durationYears,
        branchGroup: tpl.branchGroup,
        seatMatrixNote: central
          ? `Department/branch verified against ${central.websiteUrl.replace(/^https?:\/\//, '')} — check official JoSAA/CSAB seat matrix for current intake`
          : 'Not available — check official counselling seat matrix',
        isDemo: true,
        verifiedAt: DEMO_VERIFIED_DATE,
      };
    });
  }
);

// Base synthetic demo closing-rank bands for State Universities (2025) — strictly marked isDemo: true!
const STATE_BASE_CLOSING_2025: Record<string, Record<string, number>> = {
  // REAP (JEE Main CRL synthetic demo bands)
  inst_mbm_jodhpur: { CSE: 48000, ECE: 74000, ME: 112000 },
  inst_rtu_kota: { CSE: 72000, ECE: 108000, EE: 136000 },
  inst_ctae_udaipur: { CSE: 68000, ME: 128000, CE: 165000 },
  inst_skit_jaipur: { CSE: 92000, IT: 118000, ECE: 158000 },
  // MHT CET (State General Merit Rank synthetic demo bands)
  inst_coep_pune: { CSE: 180, ECE: 720, ME: 2400 },
  inst_vjti_mumbai: { CSE: 210, IT: 460, ECE: 980 },
  inst_spit_mumbai: { CSE: 620, IT: 940, ECE: 1850 },
  inst_pict_pune: { CSE: 980, IT: 1420, ECE: 2850 },
  // WBJEE (General Merit Rank synthetic demo bands)
  inst_jadavpur_univ: { CSE: 140, IT: 380, ECE: 490 },
  inst_kgec_kalyani: { CSE: 1850, IT: 2640, ECE: 3420 },
  inst_jgec_jalpaiguri: { CSE: 2780, ECE: 4650, ME: 7900 },
  inst_iem_kolkata: { CSE: 3450, IT: 4820, ECE: 7150 },
  // KCET (Engineering Rank synthetic demo bands)
  inst_rvce_bengaluru: { CSE: 420, ECE: 1380, ME: 7600 },
  inst_bmsce_bengaluru: { CSE: 1180, ECE: 3450, ME: 14200 },
  inst_msrit_bengaluru: { CSE: 1350, IT: 2240, ECE: 3980 },
  inst_pesu_bengaluru: { CSE: 1050, ECE: 3120, EE: 9400 },
};

function resolveBaseClosing2025(instId: string, progCode: string): number {
  const central = CENTRAL_INSTITUTION_MAP[instId];
  if (central) {
    const override = central.branchRankOverrides?.[progCode];
    if (override) return override;
    const tpl = PROG_CATALOG[progCode];
    const mult = tpl ? tpl.rankMultiplier : 2.5;
    // Scale gracefully so lower-ranked GFTIs don't overshoot realistic JEE Main ranks
    if (central.type === 'IIT') {
      return Math.min(24000, Math.max(50, Math.round(central.baseRank2025 * Math.pow(mult, 0.95))));
    }
    if (central.branches.length === 1 || (central.branches[0] === progCode && mult > 2.5)) {
      return central.baseRank2025;
    }
    const scaled = Math.round(central.baseRank2025 * (1 + (mult - 1) * 0.72));
    return Math.min(240000, Math.max(100, scaled));
  }
  return STATE_BASE_CLOSING_2025[instId]?.[progCode] ?? 5000;
}

function generateDemoCutoffs(): CutoffRecord[] {
  const progByInst = new Map<string, Programme[]>();
  for (const p of SEED_PROGRAMMES) {
    const arr = progByInst.get(p.institutionId) ?? [];
    arr.push(p);
    progByInst.set(p.institutionId, arr);
  }

  const records: CutoffRecord[] = [];
  const years = [2023, 2024, 2025];
  const josaaRounds = [
    { num: 1, label: 'Round 1', factor: 0.78 },
    { num: 3, label: 'Round 3', factor: 0.90 },
    { num: 6, label: 'Round 6', factor: 1.0 },
  ];

  const catSpecs: { cat: string; rankType: RankType; scale: number }[] = [
    { cat: 'OPEN', rankType: 'CRL', scale: 1.0 },
    { cat: 'OPEN (PwD)', rankType: 'CATEGORY_RANK', scale: 0.045 },
    { cat: 'EWS', rankType: 'CATEGORY_RANK', scale: 0.17 },
    { cat: 'OBC-NCL', rankType: 'CATEGORY_RANK', scale: 0.34 },
    { cat: 'SC', rankType: 'CATEGORY_RANK', scale: 0.14 },
    { cat: 'ST', rankType: 'CATEGORY_RANK', scale: 0.065 },
  ];

  const pools: { pool: SeatPool; factor: number }[] = [
    { pool: 'Gender-Neutral', factor: 1.0 },
    { pool: 'Female-only', factor: 1.48 },
  ];

  const stateSystemMeta: Record<
    string,
    {
      examCode: string;
      sourceName: string;
      sourceUrl: string;
      quotas: { code: string; factor: number }[];
      rounds: { num: number; label: string; factor: number }[];
    }
  > = {
    reap: {
      examCode: 'jee-main',
      sourceName: DEMO_SOURCE_REAP,
      sourceUrl: 'https://reapbtech24.com',
      quotas: [
        { code: 'HS', factor: 1.32 },
        { code: 'OS', factor: 1.0 },
      ],
      rounds: [
        { num: 1, label: 'Round 1', factor: 0.80 },
        { num: 2, label: 'Round 2', factor: 0.91 },
        { num: 3, label: 'Round 3', factor: 1.0 },
      ],
    },
    'mht-cet': {
      examCode: 'mht-cet',
      sourceName: DEMO_SOURCE_MHTCET,
      sourceUrl: 'https://cetcell.mahacet.org',
      quotas: [
        { code: 'HS', factor: 1.25 },
        { code: 'AI', factor: 1.0 },
      ],
      rounds: [
        { num: 1, label: 'CAP Round 1', factor: 0.82 },
        { num: 2, label: 'CAP Round 2', factor: 0.92 },
        { num: 3, label: 'CAP Round 3', factor: 1.0 },
      ],
    },
    wbjee: {
      examCode: 'wbjee',
      sourceName: DEMO_SOURCE_WBJEE,
      sourceUrl: 'https://wbjeeb.nic.in',
      quotas: [
        { code: 'HS', factor: 1.30 },
        { code: 'AI', factor: 1.0 },
      ],
      rounds: [
        { num: 1, label: 'Round 1', factor: 0.79 },
        { num: 2, label: 'Round 2', factor: 0.90 },
        { num: 3, label: 'Mop-Up Round', factor: 1.0 },
      ],
    },
    kcet: {
      examCode: 'kcet',
      sourceName: DEMO_SOURCE_KCET,
      sourceUrl: 'https://cetonline.karnataka.gov.in/kea',
      quotas: [
        { code: 'HS', factor: 1.28 },
        { code: 'AI', factor: 1.0 },
      ],
      rounds: [
        { num: 1, label: 'Round 1', factor: 0.80 },
        { num: 2, label: 'Round 2', factor: 0.91 },
        { num: 3, label: 'Extended Round', factor: 1.0 },
      ],
    },
  };

  const stateCatSpecs: { cat: string; scale: number }[] = [
    { cat: 'OPEN', scale: 1.0 },
    { cat: 'EWS', scale: 1.18 },
    { cat: 'OBC-NCL', scale: 1.38 },
    { cat: 'SC', scale: 2.35 },
    { cat: 'ST', scale: 3.10 },
  ];

  for (const inst of SEED_INSTITUTIONS) {
    const progs = progByInst.get(inst.id) ?? [];
    const primarySys = inst.systems[0];

    // 1. State counselling systems (REAP, MHT CET, WBJEE, KCET)
    if (primarySys && stateSystemMeta[primarySys]) {
      const meta = stateSystemMeta[primarySys];
      for (const prog of progs) {
        const baseClosing = resolveBaseClosing2025(inst.id, prog.code);
        for (const year of [2024, 2025]) {
          const yearFactor = year === 2024 ? 0.96 : 1.0;
          for (const r of meta.rounds) {
            if (year !== 2025 && r.num !== 3) continue;
            for (const q of meta.quotas) {
              for (const c of stateCatSpecs) {
                if (year === 2025 && r.num !== 3 && c.cat !== 'OPEN' && c.cat !== 'OBC-NCL') continue;
                const poolsToEmit: { pool: SeatPool; factor: number }[] =
                  year === 2025 && r.num === 3 && (c.cat === 'OPEN' || c.cat === 'OBC-NCL')
                    ? [
                        { pool: 'Gender-Neutral', factor: 1.0 },
                        { pool: 'Female-only', factor: 1.24 },
                      ]
                    : [{ pool: 'Gender-Neutral', factor: 1.0 }];

                for (const p of poolsToEmit) {
                  const closing = Math.max(
                    15,
                    Math.round(baseClosing * yearFactor * r.factor * q.factor * c.scale * p.factor)
                  );
                  const opening = Math.max(1, Math.round(closing * 0.62));
                  const id = buildCutoffCompositeKey({
                    systemCode: primarySys,
                    academicYear: year,
                    roundNumber: r.num,
                    institutionId: inst.id,
                    programmeId: prog.id,
                    quota: q.code,
                    seatCategory: c.cat,
                    seatPool: p.pool,
                    rankType: 'CRL',
                  });
                  records.push({
                    id,
                    systemCode: primarySys,
                    examCode: meta.examCode,
                    academicYear: year,
                    roundNumber: r.num,
                    roundLabel: r.label,
                    institutionId: inst.id,
                    institutionSlug: inst.slug,
                    institutionName: inst.name,
                    institutionType: inst.type,
                    state: inst.state,
                    programmeId: prog.id,
                    programmeName: prog.name,
                    branchGroup: prog.branchGroup,
                    quota: q.code,
                    seatCategory: c.cat,
                    seatPool: p.pool,
                    rankType: 'CRL',
                    openingRank: opening,
                    closingRank: closing,
                    sourceName: meta.sourceName,
                    sourceUrl: meta.sourceUrl,
                    isDemo: true,
                    status: 'published',
                    verificationStatus: 'unverified',
                    verifiedAt: DEMO_VERIFIED_DATE,
                  });
                }
              }
            }
          }
        }
      }
      continue;
    }

    // 2. JEE Advanced (JoSAA IITs) — All India (AI) quota only, Rounds 1..5
    if (primarySys === 'jee-advanced') {
      const iitRounds = [
        { num: 1, label: 'Round 1', factor: 0.85 },
        { num: 3, label: 'Round 3', factor: 0.93 },
        { num: 5, label: 'Round 5', factor: 1.0 },
      ];
      for (const prog of progs) {
        const baseClosing = resolveBaseClosing2025(inst.id, prog.code);
        for (const year of years) {
          const yearFactor = year === 2023 ? 0.95 : year === 2024 ? 0.98 : 1.0;
          for (const r of iitRounds) {
            if (year !== 2025 && r.num !== 5) continue;
            for (const c of catSpecs) {
              // Keep earlier rounds & prior years compact while preserving 100% 2025 Round 5 coverage
              if (year !== 2025 && c.cat !== 'OPEN' && c.cat !== 'OBC-NCL') continue;
              if (year === 2025 && r.num !== 5 && c.cat !== 'OPEN' && c.cat !== 'OBC-NCL') continue;

              for (const p of pools) {
                if (c.cat === 'OPEN (PwD)' && p.pool === 'Female-only') continue;
                if ((year !== 2025 || r.num !== 5) && p.pool === 'Female-only' && c.cat !== 'OPEN') continue;

                const closing = Math.max(
                  10,
                  Math.round(baseClosing * yearFactor * r.factor * c.scale * p.factor)
                );
                const opening = Math.max(1, Math.min(closing, Math.round(closing * 0.58)));
                const id = buildCutoffCompositeKey({
                  systemCode: 'jee-advanced',
                  academicYear: year,
                  roundNumber: r.num,
                  institutionId: inst.id,
                  programmeId: prog.id,
                  quota: 'AI',
                  seatCategory: c.cat,
                  seatPool: p.pool,
                  rankType: c.rankType,
                });
                records.push({
                  id,
                  systemCode: 'jee-advanced',
                  examCode: 'jee-advanced',
                  academicYear: year,
                  roundNumber: r.num,
                  roundLabel: r.label,
                  institutionId: inst.id,
                  institutionSlug: inst.slug,
                  institutionName: inst.name,
                  institutionType: inst.type,
                  state: inst.state,
                  programmeId: prog.id,
                  programmeName: prog.name,
                  branchGroup: prog.branchGroup,
                  quota: 'AI',
                  seatCategory: c.cat,
                  seatPool: p.pool,
                  rankType: c.rankType,
                  openingRank: opening,
                  closingRank: closing,
                  sourceName: DEMO_SOURCE_JEE_ADV,
                  sourceUrl: 'https://josaa.nic.in',
                  isDemo: true,
                  status: 'published',
                  verificationStatus: 'unverified',
                  verifiedAt: DEMO_VERIFIED_DATE,
                });
              }
            }
          }
        }
      }
      continue;
    }

    // 3. JoSAA & CSAB (NITs, IIITs, GFTIs)
    const central = CENTRAL_INSTITUTION_MAP[inst.id];
    const quotaMode = central?.quotaMode ?? (inst.type === 'IIIT' ? 'AI' : 'HS_OS');
    const quotas: { code: string; factor: number }[] =
      quotaMode === 'AI'
        ? [{ code: 'AI', factor: 1.0 }]
        : quotaMode === 'GO_OS'
          ? [
              { code: 'GO', factor: 1.65 },
              { code: 'OS', factor: 1.0 },
            ]
          : quotaMode === 'JK_HS_OS'
            ? [
                { code: 'JK', factor: 1.75 },
                { code: 'HS', factor: 1.68 },
                { code: 'OS', factor: 1.0 },
              ]
            : [
                { code: 'HS', factor: 1.38 },
                { code: 'OS', factor: 1.0 },
              ];

    const csabQuotas =
      quotaMode === 'AI'
        ? [{ code: 'AI', factor: 1.0 }]
        : [
            { code: 'HS', factor: 1.42 },
            { code: 'OS', factor: 1.05 },
          ];

    for (const prog of progs) {
      const baseClosing = resolveBaseClosing2025(inst.id, prog.code);

      for (const year of years) {
        const yearFactor = year === 2023 ? 0.94 : year === 2024 ? 0.98 : 1.0;

        for (const r of josaaRounds) {
          if (year !== 2025 && r.num !== 6) continue;

          for (const q of quotas) {
            for (const c of catSpecs) {
              // Keep earlier rounds & prior years compact while preserving 100% 2025 Round 6 prediction coverage
              if (year !== 2025 && c.cat !== 'OPEN' && c.cat !== 'OBC-NCL') continue;
              if (year === 2025 && r.num !== 6 && c.cat !== 'OPEN' && c.cat !== 'OBC-NCL') continue;

              for (const p of pools) {
                if (c.cat === 'OPEN (PwD)' && p.pool === 'Female-only') continue;
                if ((year !== 2025 || r.num !== 6) && p.pool === 'Female-only' && c.cat !== 'OPEN') continue;

                const closing = Math.max(
                  12,
                  Math.round(baseClosing * yearFactor * r.factor * q.factor * c.scale * p.factor)
                );
                const opening = Math.max(1, Math.min(closing, Math.round(closing * 0.64)));

                const id = buildCutoffCompositeKey({
                  systemCode: 'josaa',
                  academicYear: year,
                  roundNumber: r.num,
                  institutionId: inst.id,
                  programmeId: prog.id,
                  quota: q.code,
                  seatCategory: c.cat,
                  seatPool: p.pool,
                  rankType: c.rankType,
                });

                records.push({
                  id,
                  systemCode: 'josaa',
                  examCode: 'jee-main',
                  academicYear: year,
                  roundNumber: r.num,
                  roundLabel: r.label,
                  institutionId: inst.id,
                  institutionSlug: inst.slug,
                  institutionName: inst.name,
                  institutionType: inst.type,
                  state: inst.state,
                  programmeId: prog.id,
                  programmeName: prog.name,
                  branchGroup: prog.branchGroup,
                  quota: q.code,
                  seatCategory: c.cat,
                  seatPool: p.pool,
                  rankType: c.rankType,
                  openingRank: opening,
                  closingRank: closing,
                  sourceName: DEMO_SOURCE_JOSAA,
                  sourceUrl: 'https://josaa.nic.in',
                  isDemo: true,
                  status: 'published',
                  verificationStatus: 'unverified',
                  verifiedAt: DEMO_VERIFIED_DATE,
                });
              }
            }
          }
        }
      }

      // CSAB Special Round 1 & 2 (2025) — uses CRL for ALL categories per CSAB rules!
      for (const sr of [
        { num: 1, label: 'Special Round 1', factor: 1.12 },
        { num: 2, label: 'Special Round 2', factor: 1.24 },
      ]) {
        for (const q of csabQuotas) {
          for (const cat of [
            { cat: 'OPEN', scale: 1.0 },
            { cat: 'OBC-NCL', scale: 1.28 },
            { cat: 'EWS', scale: 1.16 },
          ]) {
            const closing = Math.max(40, Math.round(baseClosing * sr.factor * q.factor * cat.scale));
            const opening = Math.max(10, Math.round(closing * 0.82));
            const id = buildCutoffCompositeKey({
              systemCode: 'csab',
              academicYear: 2025,
              roundNumber: sr.num,
              institutionId: inst.id,
              programmeId: prog.id,
              quota: q.code,
              seatCategory: cat.cat,
              seatPool: 'Gender-Neutral',
              rankType: 'CRL',
            });
            records.push({
              id,
              systemCode: 'csab',
              examCode: 'jee-main',
              academicYear: 2025,
              roundNumber: sr.num,
              roundLabel: sr.label,
              institutionId: inst.id,
              institutionSlug: inst.slug,
              institutionName: inst.name,
              institutionType: inst.type,
              state: inst.state,
              programmeId: prog.id,
              programmeName: prog.name,
              branchGroup: prog.branchGroup,
              quota: q.code,
              seatCategory: cat.cat,
              seatPool: 'Gender-Neutral',
              rankType: 'CRL',
              openingRank: opening,
              closingRank: closing,
              sourceName: DEMO_SOURCE_CSAB,
              sourceUrl: 'https://csab.nic.in',
              isDemo: true,
              status: 'published',
              verificationStatus: 'unverified',
              verifiedAt: DEMO_VERIFIED_DATE,
            });
          }
        }
      }
    }
  }

  return records;
}

export const SEED_CUTOFFS: CutoffRecord[] = generateDemoCutoffs();

export const SEED_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sched_josaa_2025_reg',
    systemCode: 'josaa',
    academicYear: 2025,
    title: 'Candidate Registration & Academic Programme Choice Filling',
    phase: 'Registration & Choice Filling',
    startDate: '2025-06-10',
    endDate: '2025-06-18',
    description: 'Illustrative demo schedule: register on the official JoSAA portal and order institute-branch preferences.',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_josaa_2025_mock',
    systemCode: 'josaa',
    academicYear: 2025,
    title: 'Mock Seat Allocation 1 & 2 Display',
    phase: 'Mock Allotment',
    startDate: '2025-06-15',
    endDate: '2025-06-17',
    description: 'Illustrative demo schedule: review tentative seat allotment based on choices filled up to the mock cutoff timestamp.',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_josaa_2025_r1',
    systemCode: 'josaa',
    academicYear: 2025,
    title: 'Round 1 Seat Allocation, Online Reporting & Fee Payment',
    phase: 'Round 1',
    startDate: '2025-06-20',
    endDate: '2025-06-24',
    description: 'Illustrative demo schedule: select Freeze/Float/Slide, upload verification documents, and pay Seat Acceptance Fee.',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_josaa_2025_r6',
    systemCode: 'josaa',
    academicYear: 2025,
    title: 'Final Round (Round 6) Allotment & Partial Admission Fee',
    phase: 'Final Round',
    startDate: '2025-07-16',
    endDate: '2025-07-21',
    description: 'Illustrative demo schedule: final JoSAA NIT+ round reporting and Partial Admission Fee (PAF) submission.',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_csab_2025_sr1',
    systemCode: 'csab',
    academicYear: 2025,
    title: 'CSAB Special Round Registration, Fresh Choice Filling & SR-1 Result',
    phase: 'Special Round 1',
    startDate: '2025-07-30',
    endDate: '2025-08-05',
    description: 'Illustrative demo schedule: vacant seat display, fresh choice filling, and Special Round 1 allocation.',
    sourceName: DEMO_SOURCE_CSAB,
    sourceUrl: 'https://csab.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_csab_2025_sr2',
    systemCode: 'csab',
    academicYear: 2025,
    title: 'CSAB Special Round 2 Seat Allotment & Institute Reporting',
    phase: 'Special Round 2',
    startDate: '2025-08-09',
    endDate: '2025-08-14',
    description: 'Illustrative demo schedule: final special round allotment followed by physical reporting at allotted institutes.',
    sourceName: DEMO_SOURCE_CSAB,
    sourceUrl: 'https://csab.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // REAP Schedules
  {
    id: 'sched_reap_2025_reg',
    systemCode: 'reap',
    academicYear: 2025,
    title: 'REAP Online Registration, Merit List & Choice Filling',
    phase: 'Registration & Choice Filling',
    startDate: '2025-06-27',
    endDate: '2025-07-17',
    description: 'Illustrative demo schedule: register on the official REAP portal, verify JEE Main / Class 12 merit rank, and lock college preferences.',
    sourceName: DEMO_SOURCE_REAP,
    sourceUrl: 'https://reapbtech24.com',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_reap_2025_r1',
    systemCode: 'reap',
    academicYear: 2025,
    title: 'REAP Round 1–3 Seat Allotment, Upward Movement & Reporting',
    phase: 'Allotment Rounds',
    startDate: '2025-07-22',
    endDate: '2025-08-12',
    description: 'Illustrative demo schedule: check round-wise allotment, submit upward movement request if desired, and report to allotted institute.',
    sourceName: DEMO_SOURCE_REAP,
    sourceUrl: 'https://reapbtech24.com',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // MHT CET Schedules
  {
    id: 'sched_mhtcet_2025_reg',
    systemCode: 'mht-cet',
    academicYear: 2025,
    title: 'MHT CET CAP Registration, Document E-Scrutiny & Final Merit List',
    phase: 'Registration & Merit List',
    startDate: '2025-07-14',
    endDate: '2025-08-03',
    description: 'Illustrative demo schedule: online CAP registration, document verification via FC/e-Scrutiny, and publication of final state merit rank.',
    sourceName: DEMO_SOURCE_MHTCET,
    sourceUrl: 'https://cetcell.mahacet.org',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_mhtcet_2025_cap',
    systemCode: 'mht-cet',
    academicYear: 2025,
    title: 'MHT CET CAP Round 1, 2 & 3 Option Form, Allotment & Reporting',
    phase: 'CAP Rounds 1–3',
    startDate: '2025-08-05',
    endDate: '2025-09-09',
    description: 'Illustrative demo schedule: submit CAP option forms, select Freeze or Betterment (Not Freeze), and confirm admission at allotted college.',
    sourceName: DEMO_SOURCE_MHTCET,
    sourceUrl: 'https://cetcell.mahacet.org',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // WBJEE Schedules
  {
    id: 'sched_wbjee_2025_reg',
    systemCode: 'wbjee',
    academicYear: 2025,
    title: 'WBJEEB Counselling Registration & Choice Locking',
    phase: 'Registration & Choice Filling',
    startDate: '2025-07-10',
    endDate: '2025-07-16',
    description: 'Illustrative demo schedule: register using WBJEE GMR, enter college-branch preferences, and lock choices before deadline.',
    sourceName: DEMO_SOURCE_WBJEE,
    sourceUrl: 'https://wbjeeb.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_wbjee_2025_rounds',
    systemCode: 'wbjee',
    academicYear: 2025,
    title: 'WBJEE Round 1, Round 2 & Mop-Up Allotment & Physical Verification',
    phase: 'Allotment & Mop-Up',
    startDate: '2025-07-19',
    endDate: '2025-08-12',
    description: 'Illustrative demo schedule: pay seat acceptance fee, report to allotted institute for document verification, and opt for upgradation.',
    sourceName: DEMO_SOURCE_WBJEE,
    sourceUrl: 'https://wbjeeb.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // KCET Schedules
  {
    id: 'sched_kcet_2025_opt',
    systemCode: 'kcet',
    academicYear: 2025,
    title: 'KEA KCET Document Verification & Option Entry (Mock + Round 1)',
    phase: 'Option Entry & Mock Allotment',
    startDate: '2025-07-23',
    endDate: '2025-08-18',
    description: 'Illustrative demo schedule: complete KEA verification slip download, submit priority option entry, and review mock allotment.',
    sourceName: DEMO_SOURCE_KCET,
    sourceUrl: 'https://cetonline.karnataka.gov.in/kea',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_kcet_2025_rounds',
    systemCode: 'kcet',
    academicYear: 2025,
    title: 'KCET Round 1, Round 2 & Second Extended Round Choice Entry & Reporting',
    phase: 'Seat Allotment Rounds',
    startDate: '2025-08-22',
    endDate: '2025-09-24',
    description: 'Illustrative demo schedule: exercise Choice 1/2/3/4 after each KEA allotment and download admission order upon fee payment.',
    sourceName: DEMO_SOURCE_KCET,
    sourceUrl: 'https://cetonline.karnataka.gov.in/kea',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // JEE Advanced / JoSAA IIT Schedules
  {
    id: 'sched_jeeadv_2025_result',
    systemCode: 'jee-advanced',
    academicYear: 2025,
    title: 'JEE Advanced Result Declaration & All-India Rank Card Release',
    phase: 'Exam Result',
    startDate: '2025-06-02',
    endDate: '2025-06-09',
    description: 'Illustrative demo schedule: download JEE Advanced CRL and Category Rank Card from jeeadv.ac.in ahead of JoSAA registration.',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://jeeadv.ac.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_jeeadv_2025_choice',
    systemCode: 'jee-advanced',
    academicYear: 2025,
    title: 'JoSAA IIT Registration, Choice Filling & Mock Seat Allocation 1–2',
    phase: 'Registration & Choice Filling',
    startDate: '2025-06-10',
    endDate: '2025-06-18',
    description: 'Illustrative demo schedule: fill and lock IIT academic programme choices on josaa.nic.in (all IIT seats follow All-India quota).',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'sched_jeeadv_2025_rounds',
    systemCode: 'jee-advanced',
    academicYear: 2025,
    title: 'JoSAA IIT Rounds 1–5 Seat Allocation, Withdrawal Window & IIT Reporting',
    phase: 'Allotment Rounds 1–5',
    startDate: '2025-06-20',
    endDate: '2025-07-22',
    description: 'Illustrative demo schedule: exercise Freeze/Float/Slide, upload verification documents, observe IIT withdrawal cutoff before Round 5, and report to allotted IIT.',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
];

export const SEED_NOTICES: NoticeItem[] = [
  {
    id: 'notice_josaa_demo_1',
    systemCode: 'josaa',
    academicYear: 2025,
    title: 'Demo Notice: Verify Category & State of Eligibility Certificates Before Round 1',
    summary:
      'Sample advisory illustrating how official JoSAA notices appear here. Always verify current certificate format dates (EWS / OBC-NCL issued after April 1 of the admission year) directly on josaa.nic.in.',
    publishedDate: '2025-06-05',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'notice_csab_demo_1',
    systemCode: 'csab',
    academicYear: 2025,
    title: 'Demo Notice: CSAB Special Rounds Evaluate All Categories Using JEE Main CRL',
    summary:
      'Unlike JoSAA rounds (which use category ranks for EWS/OBC-NCL/SC/ST/PwD), CSAB Special Rounds allocate vacant seats using JEE Main Common Rank List (CRL).',
    publishedDate: '2025-07-24',
    sourceName: DEMO_SOURCE_CSAB,
    sourceUrl: 'https://csab.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'notice_reap_demo_1',
    systemCode: 'reap',
    academicYear: 2025,
    title: 'Demo Notice: REAP Merit Priority Uses JEE Main CRL Followed by Class 12 Percentage',
    summary:
      'Sample advisory illustrating REAP counselling updates. Verify exact Rajasthan domicile, TFWS, and upward movement rules on the official REAP portal.',
    publishedDate: '2025-06-25',
    sourceName: DEMO_SOURCE_REAP,
    sourceUrl: 'https://reapbtech24.com',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'notice_mhtcet_demo_1',
    systemCode: 'mht-cet',
    academicYear: 2025,
    title: 'Demo Notice: MHT CET CAP Auto-Freeze Applies to Preference #1 Allotment',
    summary:
      'Sample advisory for Maharashtra CAP candidates. If your first preference is allotted in CAP Round 1, the seat auto-freezes per CET Cell rules — confirm current brochure on cetcell.mahacet.org.',
    publishedDate: '2025-07-12',
    sourceName: DEMO_SOURCE_MHTCET,
    sourceUrl: 'https://cetcell.mahacet.org',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'notice_wbjee_demo_1',
    systemCode: 'wbjee',
    academicYear: 2025,
    title: 'Demo Notice: WBJEE Domicile Proforma A1/A2/B Required for State Quota Seats',
    summary:
      'Sample advisory for WBJEEB candidates. Keep your signed West Bengal domicile certificate (Proforma A1/A2/B) ready before Round 1 physical verification at the allotted institute.',
    publishedDate: '2025-07-08',
    sourceName: DEMO_SOURCE_WBJEE,
    sourceUrl: 'https://wbjeeb.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'notice_kcet_demo_1',
    systemCode: 'kcet',
    academicYear: 2025,
    title: 'Demo Notice: KEA KCET Choice 1, 2, 3 & 4 Selection Deadlines After Allotment',
    summary:
      'Sample advisory for KCET candidates. After Round 1 allotment, carefully choose between Choice 1 (Accept), Choice 2 (Hold & Upgrade), Choice 3 (Reject & Upgrade), or Choice 4 (Exit) on KEA portal.',
    publishedDate: '2025-08-20',
    sourceName: DEMO_SOURCE_KCET,
    sourceUrl: 'https://cetonline.karnataka.gov.in/kea',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'notice_jeeadv_demo_1',
    systemCode: 'jee-advanced',
    academicYear: 2025,
    title: 'Demo Notice: IITs Use All-India (AI) Quota Only & Separate JEE Advanced Category Ranks',
    summary:
      'Sample advisory for JEE Advanced candidates. IIT admissions via JoSAA do not apply Home State / Other State quotas. OPEN seats use JEE Advanced CRL, while EWS, OBC-NCL, SC, ST, and PwD seats compare strictly against JEE Advanced Category Ranks.',
    publishedDate: '2025-06-04',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://jeeadv.ac.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'notice_jeeadv_demo_2',
    systemCode: 'jee-advanced',
    academicYear: 2025,
    title: 'Demo Notice: IIT Seat Withdrawal Must Be Completed Before Final JoSAA Round',
    summary:
      'Sample advisory illustrating JoSAA IIT withdrawal rules. Candidates wishing to withdraw from an allotted IIT seat to preserve future JEE Advanced attempt eligibility must withdraw strictly within the announced pre-final-round window on josaa.nic.in.',
    publishedDate: '2025-07-10',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://josaa.nic.in',
    isOutdated: true,
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
];

export const SEED_CONTENT_ITEMS: ContentItem[] = [
  // Process Guides
  {
    id: 'guide_freeze_float_slide',
    kind: 'guide',
    systemCode: 'josaa',
    slug: 'freeze-float-slide',
    title: 'Freeze, Float, and Slide Explained',
    summary: 'Understand how willingness options control whether your seat can upgrade in subsequent JoSAA rounds.',
    body: 'After receiving a seat in a JoSAA round, you choose one willingness option during online reporting:\n\n1. Freeze: You accept the allotted seat and opt out of further upward movement in later rounds.\n2. Float: You accept the allotted seat provisionally and remain eligible for any higher-priority choice (across any institute or branch) above your current allotment in subsequent rounds.\n3. Slide: You accept the allotted seat provisionally and remain eligible only for a higher-priority branch within the SAME institute.\n\nAlways verify exact round-wise cutoffs for changing willingness in the official JoSAA Business Rules.',
    category: 'Willingness Options',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'guide_online_reporting',
    kind: 'guide',
    systemCode: 'josaa',
    slug: 'online-reporting-and-verification',
    title: 'Online Reporting, Document Verification & Seat Acceptance Fee',
    summary: 'Step-by-step checklist for responding to document verification officer queries on time.',
    body: 'When allotted a seat for the first time in JoSAA:\n\n1. Select willingness (Freeze / Float / Slide).\n2. Upload clear, legible scans of required Class 10, Class 12, category, and medical certificates.\n3. Pay the Seat Acceptance Fee before the round deadline.\n4. Check the portal daily until the Verification Officer marks your documents as Verified. If a query is raised, respond within the stipulated window to avoid seat cancellation.\n\nVerify current fee amounts and deadlines directly on josaa.nic.in.',
    category: 'Reporting',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'guide_withdrawal_exit',
    kind: 'guide',
    systemCode: 'josaa',
    slug: 'withdrawal-and-csab-transition',
    title: 'Seat Withdrawal & Transitioning to CSAB Special Rounds',
    summary: 'How withdrawal deadlines work and what happens to Partial Admission Fee (PAF) if you participate in CSAB.',
    body: 'If you no longer wish to hold a JoSAA NIT+ seat, you must exercise the Withdrawal option strictly before the final withdrawal deadline announced by JoSAA. Missing the withdrawal window can affect fee refund eligibility.\n\nStudents retaining a JoSAA NIT+ seat by paying the Partial Admission Fee (PAF) may also participate in CSAB Special Rounds to try for higher preferences, subject to the current year CSAB Information Brochure.',
    category: 'Withdrawal & CSAB',
    sourceName: DEMO_SOURCE_CSAB,
    sourceUrl: 'https://csab.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'guide_jeeadv_iit_counselling',
    kind: 'guide',
    systemCode: 'jee-advanced',
    slug: 'iit-josaa-seat-allocation-guide',
    title: 'JEE Advanced & JoSAA IIT Seat Allocation Guide',
    summary: 'How IIT All-India (AI) quota, Female supernumerary seats, Category Ranks, and Round 5 withdrawal rules work.',
    body: 'All 23 Indian Institutes of Technology (IITs) allocate B.Tech, B.S., and Dual Degree seats centrally through JoSAA based strictly on JEE Advanced ranks:\n\n1. All-India (AI) Quota Only: Unlike NITs, IITs do not split seats into Home State (HS) and Other State (OS) quotas. Every candidate competes on All-India merit.\n2. Rank-Type Rules: OPEN seats compare against JEE Advanced CRL. EWS, OBC-NCL, SC, ST, and PwD seats compare strictly against the corresponding JEE Advanced Category Rank.\n3. Female-Only Supernumerary Pool: Female candidates are evaluated for both Female-only supernumerary seats and Gender-Neutral seats.\n4. IIT Withdrawal Rule: IIT seats do not participate in CSAB Special Rounds. If you decide not to join an allotted IIT seat, withdraw strictly before the final JoSAA IIT withdrawal deadline.\n\nAlways verify the latest JoSAA Business Rules on josaa.nic.in and jeeadv.ac.in.',
    category: 'IIT Admissions',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://jeeadv.ac.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // Document Checklists
  {
    id: 'chk_josaa_10th',
    kind: 'checklist',
    systemCode: 'josaa',
    slug: 'class-10-certificate',
    title: 'Class 10 Marksheet / Birth Date Proof',
    summary: 'Required for Date of Birth verification during online reporting.',
    body: 'Original scanned PDF of Class 10 Board Certificate or Marksheet clearly showing candidate name and Date of Birth.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_josaa_12th',
    kind: 'checklist',
    systemCode: 'josaa',
    slug: 'class-12-marksheet',
    title: 'Class 12 Marksheet (State of Eligibility Proof)',
    summary: 'Determines Home State (HS) vs Other State (OS) quota eligibility.',
    body: 'Your State of Eligibility is determined by the state from which you passed Class 12 (or equivalent), not your residential address.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_josaa_jeemain',
    kind: 'checklist',
    systemCode: 'josaa',
    slug: 'jee-main-admit-scorecard',
    title: 'JEE Main Admit Card & NTA Score Card',
    summary: 'Official NTA score card showing CRL and applicable category rank.',
    body: 'Keep downloaded PDF copies of your JEE Main Admit Card and final NTA Rank Card ready.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_josaa_category',
    kind: 'checklist',
    systemCode: 'josaa',
    slug: 'category-certificate',
    title: 'Valid Category / EWS / OBC-NCL / PwD Certificate (if applicable)',
    summary: 'Must follow the central government format specified in JoSAA Business Rules.',
    body: 'GEN-EWS and OBC-NCL certificates typically must be issued on or after April 1 of the admission year in the exact JoSAA proforma.',
    category: 'Conditional',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_josaa_medical',
    kind: 'checklist',
    systemCode: 'josaa',
    slug: 'medical-certificate',
    title: 'Medical Certificate (Annexure 7 Format)',
    summary: 'Signed and stamped by a registered medical practitioner.',
    body: 'Download the latest Annexure 7 format from josaa.nic.in and have it filled and stamped by a registered doctor.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_csab_paf',
    kind: 'checklist',
    systemCode: 'csab',
    slug: 'csab-fee-receipt',
    title: 'JoSAA Provisional Allotment / PAF Receipt (if holding a seat)',
    summary: 'Required for candidates transitioning from JoSAA to CSAB Special Rounds.',
    body: 'Keep your JoSAA seat acceptance and Partial Admission Fee payment receipts available for CSAB fee adjustment.',
    category: 'Conditional',
    sourceName: DEMO_SOURCE_CSAB,
    sourceUrl: 'https://csab.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_reap_domicile',
    kind: 'checklist',
    systemCode: 'reap',
    slug: 'reap-domicile-and-scorecard',
    title: 'Rajasthan Domicile Certificate & JEE Main / Class 12 Marksheet',
    summary: 'Required for Rajasthan Home State (HS) quota verification during REAP reporting.',
    body: 'Carry original Class 10 & 12 marksheets, JEE Main score card, Rajasthan domicile certificate (if claiming HS quota), and category/income certificates.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_REAP,
    sourceUrl: 'https://reapbtech24.com',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_mhtcet_domicile',
    kind: 'checklist',
    systemCode: 'mht-cet',
    slug: 'mhtcet-cap-verification-docs',
    title: 'MHT CET Score Card, Maharashtra Domicile / Nationality & Non-Creamy Layer',
    summary: 'Required for Maharashtra State CET Cell FC / e-Scrutiny CAP verification.',
    body: 'Keep MHT CET Score Card, HSC/SSC marksheets, Maharashtra Domicile / Birth Certificate, School Leaving Certificate, and Caste Validity / NCL (if applicable) ready.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_MHTCET,
    sourceUrl: 'https://cetcell.mahacet.org',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_wbjee_domicile',
    kind: 'checklist',
    systemCode: 'wbjee',
    slug: 'wbjee-domicile-proforma',
    title: 'WBJEE Rank Card & Domicile Certificate (Proforma A1 / A2 / B)',
    summary: 'Required for physical document verification at allotted West Bengal colleges.',
    body: 'Carry WBJEE Rank Card, Class 10 Admit/Marksheet, Class 12 Marksheet, signed Domicile Proforma (for HS quota), and category/TFW certificates if applicable.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_WBJEE,
    sourceUrl: 'https://wbjeeb.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_kcet_verificationslip',
    kind: 'checklist',
    systemCode: 'kcet',
    slug: 'kcet-kea-verification-slip',
    title: 'KEA Verification Slip, KCET Admission Ticket & Study Certificates (7 Years)',
    summary: 'Mandatory for Karnataka KCET option entry and college reporting.',
    body: 'Keep KCET Admission Ticket, 2nd PUC/Class 12 marks card, KEA Verification Slip, Study Certificate countersigned by BEO/DDPI (Clause A), and Caste/Income RD certificate if applicable.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_KCET,
    sourceUrl: 'https://cetonline.karnataka.gov.in/kea',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_jeeadv_rankcard',
    kind: 'checklist',
    systemCode: 'jee-advanced',
    slug: 'jee-advanced-admit-and-rank-card',
    title: 'JEE Advanced Admit Card & Official Rank Card',
    summary: 'Mandatory proof of JEE Advanced CRL and applicable Category Rank for JoSAA IIT reporting.',
    body: 'Download and retain original PDF copies of your JEE Advanced Admit Card and final JEE Advanced Rank Card from jeeadv.ac.in.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://jeeadv.ac.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_jeeadv_board_eligibility',
    kind: 'checklist',
    systemCode: 'jee-advanced',
    slug: 'jee-advanced-class-12-eligibility',
    title: 'Class 10 & Class 12 Marksheet (75% Aggregate / Top 20 Percentile Proof)',
    summary: 'Verifies date of birth and IIT Class 12 board performance eligibility criteria.',
    body: 'Keep clear scanned PDFs of Class 10 board certificate (DOB proof) and Class 12 marksheet satisfying the 75% aggregate (65% for SC/ST/PwD) or respective board Top 20 percentile criterion.',
    category: 'Mandatory',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'chk_jeeadv_category_medical',
    kind: 'checklist',
    systemCode: 'jee-advanced',
    slug: 'jee-advanced-category-and-medical-docs',
    title: 'Category / EWS / OBC-NCL / PwD & Annexure 7 Medical Certificate',
    summary: 'Required in the exact JoSAA / JEE Advanced proforma during online IIT document verification.',
    body: 'Ensure GEN-EWS and OBC-NCL certificates are issued on or after April 1 of the admission year in the prescribed central format, alongside a stamped Annexure 7 Medical Certificate.',
    category: 'Conditional',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  // Glossary Terms
  {
    id: 'gloss_crl',
    kind: 'glossary',
    systemCode: 'josaa',
    slug: 'crl-common-rank-list',
    title: 'CRL (Common Rank List)',
    summary: 'Your overall All-India rank across all candidates who appeared in the exam.',
    body: 'In JoSAA, OPEN category seats are compared against CRL. In CSAB Special Rounds, ALL categories (including EWS, OBC-NCL, SC, ST) are compared against CRL.',
    category: 'Rank Types',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'gloss_category_rank',
    kind: 'glossary',
    systemCode: 'josaa',
    slug: 'category-rank',
    title: 'Category Rank',
    summary: 'Your rank strictly within your reserved seat category (EWS, OBC-NCL, SC, ST, or PwD).',
    body: 'In JoSAA, opening and closing ranks for EWS, OBC-NCL, SC, ST, and PwD categories are published as Category Ranks — never compare a CRL directly against a Category Rank cutoff.',
    category: 'Rank Types',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'gloss_quota',
    kind: 'glossary',
    systemCode: 'josaa',
    slug: 'quota-hs-os-ai',
    title: 'Quota (HS, OS, AI, GO, JK, LA)',
    summary: 'Seat pool split based on your Class 12 State of Eligibility.',
    body: 'NITs split seats 50/50 between Home State (HS — candidates who passed Class 12 in that state) and Other State (OS). IIITs allocate seats under All India (AI). Select institutes use GO, JK, or LA quotas per official JoSAA rules.',
    category: 'Seat Rules',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'gloss_seat_pool',
    kind: 'glossary',
    systemCode: 'josaa',
    slug: 'seat-pool-gender',
    title: 'Seat Pool (Gender-Neutral & Female-only)',
    summary: 'Supernumerary female seats alongside open Gender-Neutral seats.',
    body: 'Female candidates are eligible for both Female-only (including supernumerary) seats and Gender-Neutral seats. Male and other candidates are considered only for Gender-Neutral seats.',
    category: 'Seat Rules',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'gloss_round',
    kind: 'glossary',
    systemCode: 'josaa',
    slug: 'counselling-round',
    title: 'Counselling Round & Closing Rank',
    summary: 'Opening and closing ranks shift across rounds as seats are upgraded or vacated.',
    body: 'Round 1 closing ranks are usually the strictest. As students withdraw or float upward, later rounds (such as Round 5/6 or CSAB Special Rounds) often show wider closing ranks — though movement varies by branch and year.',
    category: 'Process',
    sourceName: DEMO_SOURCE_JOSAA,
    sourceUrl: 'https://josaa.nic.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
  {
    id: 'gloss_iit_ai_quota',
    kind: 'glossary',
    systemCode: 'jee-advanced',
    slug: 'iit-all-india-quota',
    title: 'IIT All-India (AI) Quota',
    summary: '100% open national merit allocation across all 23 IITs without state-domicile splits.',
    body: 'Unlike NITs (which divide seats into Home State and Other State quotas), all IIT seats in JoSAA are allocated purely under the All India (AI) quota using JEE Advanced ranks.',
    category: 'Seat Rules',
    sourceName: DEMO_SOURCE_JEE_ADV,
    sourceUrl: 'https://jeeadv.ac.in',
    isDemo: true,
    verifiedAt: DEMO_VERIFIED_DATE,
  },
];

export const JOURNEY_STEPS = [
  { id: 'register', label: 'Register on official counselling portal' },
  { id: 'fill_choices', label: 'Fill & verify preference order' },
  { id: 'lock_choices', label: 'Lock choices before deadline' },
  { id: 'check_allotment', label: 'Check round-wise seat allotment' },
  { id: 'accept_seat', label: 'Choose Freeze / Float / Slide & pay fee' },
  { id: 'verify_docs', label: 'Complete online document verification' },
  { id: 'report_institute', label: 'Complete institute reporting & admission' },
];
