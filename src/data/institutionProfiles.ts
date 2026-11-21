import type {
  Institution,
  InstitutionGalleryImage,
  InstitutionOwnership,
  InstitutionPlacementStats,
} from '../types/domain.ts';
import {
  CENTRAL_INSTITUTION_MAP,
  type CentralInstitutionEntry,
} from './centralInstitutions.ts';
import { PROG_CATALOG } from './programCatalog.ts';

export type InstitutionProfileEnrichment = Pick<
  Institution,
  | 'ownership'
  | 'ownershipDetails'
  | 'logoMonogram'
  | 'logoAccent'
  | 'address'
  | 'nearestTransit'
  | 'contactEmail'
  | 'contactPhone'
  | 'description'
  | 'nirfRanking'
  | 'otherRankings'
  | 'accreditation'
  | 'coursesOffered'
  | 'entranceExams'
  | 'eligibilitySummary'
  | 'estimatedTotalFee'
  | 'placements'
  | 'campusFacilities'
  | 'studentFacilities'
  | 'galleryImages'
>;

const IMG_HERO = '/src/assets/images/hero_campus_clarity_1795259859078.jpg';
const IMG_NIT = '/src/assets/images/campus_nit_south_1795259861055.jpg';
const IMG_IIIT = '/src/assets/images/campus_iiit_tech_1795259859792.jpg';
const IMG_HERITAGE = '/src/assets/images/campus_gfti_heritage_1795259858934.jpg';

function buildGallery(
  primaryUrl: string,
  shortName: string,
  variant: 'nit' | 'iiit' | 'heritage'
): InstitutionGalleryImage[] {
  if (variant === 'iiit') {
    return [
      { url: primaryUrl, caption: `${shortName} — Computing & Academic Block (Illustrative visual)` },
      { url: IMG_HERO, caption: `${shortName} — Central Campus Courtyard & Library Zone (Illustrative visual)` },
      { url: IMG_NIT, caption: `${shortName} — Student Academic Avenue (Illustrative visual)` },
    ];
  }
  if (variant === 'heritage') {
    return [
      { url: primaryUrl, caption: `${shortName} — Main Academic & Administrative Building (Illustrative visual)` },
      { url: IMG_HERO, caption: `${shortName} — Campus Promenade & Student Lawn (Illustrative visual)` },
      { url: IMG_IIIT, caption: `${shortName} — Engineering Labs & Innovation Wing (Illustrative visual)` },
    ];
  }
  return [
    { url: primaryUrl, caption: `${shortName} — Main Engineering Campus (Illustrative visual)` },
    { url: IMG_HERO, caption: `${shortName} — Central Academic Quad (Illustrative visual)` },
    { url: IMG_IIIT, caption: `${shortName} — Laboratories & Research Wing (Illustrative visual)` },
    { url: IMG_HERITAGE, caption: `${shortName} — Lecture Hall Complex (Illustrative visual)` },
  ];
}

const DEMO_PLACEMENT_SOURCE =
  'Demo reference benchmark — verify official median salary & placement report on nirfindia.org and institute placement cell.';

interface ProfileSpec {
  ownership: InstitutionOwnership;
  ownershipDetails: string;
  logoMonogram: string;
  logoAccent: string;
  address: string;
  nearestTransit: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  nirfRanking: string;
  otherRankings: string[];
  accreditation: string;
  coursesOffered: string[];
  entranceExams: string[];
  eligibilitySummary: string;
  estimatedTotalFee: string;
  placements: InstitutionPlacementStats;
  campusFacilities: string[];
  studentFacilities: string[];
  galleryVariant: 'nit' | 'iiit' | 'heritage';
  primaryImg: string;
}

const RAW_PROFILES: Record<string, ProfileSpec> = {
  inst_nit_trichy: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'NITT',
    logoAccent: '#0B1F3A',
    address: 'Tanjore Main Road, NH67, Near BHEL, Tiruchirappalli, Tamil Nadu 620015',
    nearestTransit: 'Tiruchirappalli Junction Railway Station (~18 km) · Tiruchirappalli Airport (~17 km)',
    contactEmail: 'admissions@nitt.edu (verify on official portal)',
    contactPhone: '+91-431-2503000 (general office — verify current admissions desk)',
    description:
      'Established originally as Regional Engineering College in 1964 and elevated to an Institute of National Importance, NIT Tiruchirappalli is one of India’s premier centrally funded public engineering campuses. It operates a residential campus with multidisciplinary engineering departments, central research centres, and national-level technical and cultural student communities.',
    nirfRanking: 'NIRF Engineering Top-15 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Overall & Architecture Participant', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch (5 Years)', 'M.Tech / M.Sc / MBA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1 for B.Tech)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% for SC/ST) or Top 20 percentile of respective board + valid JEE Main rank per JoSAA Business Rules.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — tuition waivers apply per income category)',
    placements: {
      medianPackage: '₹15.5 – ₹17.5 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — varies by domestic/international role; verify with T&P cell',
      placementSummary:
        'Strong campus recruitment across core engineering, semiconductor, software, and analytics sectors. Official NIRF disclosures report median salaries; verify branch-wise figures on official T&P portal.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & 24x7 Digital Reading Halls',
      'Centre of Excellence & Semiconductor / High-Performance Computing Labs',
      'Campus-Wide Optical Fiber & Wi-Fi Network',
      'Barn Hall Auditorium & Multi-Department Lecture Complex',
      'Olympic-Size Swimming Pool & Outdoor Sports Stadium',
      'Center for Entrepreneurship Development & Incubation (CEDI)',
    ],
    studentFacilities: [
      'Dedicated On-Campus Boys & Girls Hostels (Residential Campus)',
      'Multiple Student Dining Messes & Campus Food Courts',
      '24x7 Campus Hospital & Ambulance Facility',
      'Student Technical Clubs (Delta, Spider, Pragyan) & Cultural Societies',
      'Central Training & Placement Cell',
      'National Scholarship Portal & Fee-Remission Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_nit_surathkal: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'NITK',
    logoAccent: '#0F4C5C',
    address: 'NH 66, Srinivasnagar, Surathkal, Mangaluru, Karnataka 575025',
    nearestTransit: 'Surathkal Railway Station (~3 km) · Mangaluru International Airport (~19 km)',
    contactEmail: 'registrar@nitk.ac.in (verify on official portal)',
    contactPhone: '+91-824-2474000 (general office — verify current admissions desk)',
    description:
      'Located along the Arabian Sea coastline near Mangaluru, NIT Karnataka (Surathkal) is a flagship public technical university founded in 1960. Its residential campus combines core mechanical, civil, electrical, and computing departments with coastal engineering research and strong industry links across Bengaluru and Mangaluru.',
    nirfRanking: 'NIRF Engineering Top-25 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Overall Participant', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / MCA / MBA / M.Sc / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + valid JEE Main rank under JoSAA/CSAB HS (Karnataka) or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹14.5 – ₹16.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹16.0 – ₹18.0 LPA (Demo reference — branch variance applies)',
      highestPackage: 'Not reliably reported — verify branch-wise official T&P disclosure',
      placementSummary:
        'Consistent recruitment across software engineering, core R&D, fintech, and manufacturing firms. Consult official NITK Career Development Centre reports for verified figures.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & E-Journal Knowledge Centre',
      'Central Research Facility (CRF) & Computing Centre',
      'High-Speed Campus LAN & Wi-Fi',
      'Silver Jubilee Auditorium & Lecture Hall Complexes',
      'Sports Complex, Cricket Ground & Private Beachfront Access',
      'STEP Business Incubator & Innovation Lab',
    ],
    studentFacilities: [
      'Residential Boys & Girls Hostel Blocks',
      'Student-Run Cooperative Messes & Night Canteens',
      'On-Campus Health Care Centre with Resident Doctors',
      'Technical & Coding Clubs (IEEE, ACM, IRIS) & Cultural Fests',
      'Career Development Centre (CDC)',
      'SC/ST/OBC & Merit-cum-Means Fee Remission Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_nit_warangal: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'NITW',
    logoAccent: '#1E3A8A',
    address: 'National Institute of Technology Campus, Hanamkonda, Warangal, Telangana 506004',
    nearestTransit: 'Kazipet Junction (~3 km) · Warangal Railway Station (~12 km) · Hyderabad Airport (~160 km)',
    contactEmail: 'admissions@nitw.ac.in (verify on official portal)',
    contactPhone: '+91-870-2459191 (general office — verify current admissions desk)',
    description:
      'Founded in 1959 as India’s first Regional Engineering College, NIT Warangal is a leading centrally funded public engineering institute in Telangana. The campus spans over 240 acres and offers rigorous undergraduate and doctoral programmes supported by national research centres and close proximity to the Hyderabad technology corridor.',
    nirfRanking: 'NIRF Engineering Top-30 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'Integrated M.Sc (5 Years)', 'M.Tech / MBA / MCA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under JoSAA/CSAB HS (Telangana) or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹14.0 – ₹16.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹15.0 – ₹17.0 LPA (Demo reference — verify official CCPD report)',
      highestPackage: 'Not reliably reported — verify official CCPD annual report',
      placementSummary:
        'Strong participation from technology, consulting, core electronics, and PSU recruiters via the Centre for Career Planning & Development (CCPD).',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Digital Resource Hub',
      'Center for Innovation & Incubation',
      'Supercomputing & Electronics Fabrication Labs',
      'Auditorium, Seminar Halls & Smart Classrooms',
      'Indoor Sports Complex & Athletic Stadium',
      'Campus-Wide Optical Network',
    ],
    studentFacilities: [
      'Mega Hostel Complex & Separate Girls Hostels',
      'Centralized Dining Halls & Campus Cafeterias',
      'Institute Dispensary & Emergency Medical Care',
      'Technical & Entrepreneurship Clubs (Technozion, E-Cell)',
      'Centre for Career Planning & Development (CCPD)',
      'Counselling & Student Welfare Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_mnnit_allahabad: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'MNNIT',
    logoAccent: '#1D4ED8',
    address: 'Barrister Mullah Colony, Teliarganj, Prayagraj, Uttar Pradesh 211004',
    nearestTransit: 'Prayagraj Junction (~8 km) · Prayagraj Airport (~17 km)',
    contactEmail: 'deanacademic@mnnit.ac.in (verify on official portal)',
    contactPhone: '+91-532-2545404 (general office — verify current admissions desk)',
    description:
      'Motilal Nehru National Institute of Technology Allahabad (Prayagraj) was founded in 1961 and became the first institute in India to launch an undergraduate Computer Science & Engineering programme in 1976. As an Institute of National Importance, it serves both Uttar Pradesh Home State and All-India Other State candidates through JoSAA.',
    nirfRanking: 'NIRF Engineering Top-65 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / MCA / MBA / M.Sc / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under JoSAA/CSAB HS (Uttar Pradesh) or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹13.5 – ₹16.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹16.5 – ₹19.0 LPA (Demo reference — CSE/ECE skew applies)',
      highestPackage: 'Not reliably reported — verify official Training & Placement portal',
      placementSummary:
        'Recognized for strong software and product-engineering campus hiring alongside core public-sector and manufacturing roles.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Reading Rooms',
      'Computer Centre & High-Speed Campus Network',
      'Design & Innovation Centre (DIC)',
      'MP Hall Auditorium & Academic Complex',
      'Gymkhana Sports Grounds & Athletics Track',
      'Central Workshop & Testing Laboratories',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels (SVBH, Tilak, Patel, Kamla Nehru)',
      'Student Messes & Campus Utility Canteens',
      'Institute Health Centre & Medical Staff',
      'Coding, Robotics & Cultural Societies (Avishkar, Culrav)',
      'Training & Placement Office',
      'Scholarship & Fee Waiver Assistance Desk',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_mnit_jaipur: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'MNIT',
    logoAccent: '#9A3412',
    address: 'Jawahar Lal Nehru Marg, Jhalana Gram, Malaviya Nagar, Jaipur, Rajasthan 302017',
    nearestTransit: 'Jaipur Junction (~10 km) · Jaipur International Airport (~6 km)',
    contactEmail: 'admissions@mnit.ac.in (verify on official portal)',
    contactPhone: '+91-141-2529087 (general office — verify current admissions desk)',
    description:
      'Malaviya National Institute of Technology Jaipur sits on a green 317-acre urban campus along JLN Marg in Jaipur. Founded in 1963 and granted Institute of National Importance status, MNIT Jaipur is known for its modern Prabha Bhawan academic complex, materials research centre, and balanced core-plus-software curriculum.',
    nirfRanking: 'NIRF Engineering Top-50 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Architecture Participant', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch (5 Years)', 'M.Tech / MBA / M.Sc / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1 for B.Tech)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under JoSAA/CSAB HS (Rajasthan) or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹11.0 – ₹13.0 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official Placement & Training Cell report',
      placementSummary:
        'Balanced recruitment across IT services, product engineering, core mechanical/civil firms, and consulting organizations.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Vivekananda Lecture Theatre Complex (VLTC)',
      'Materials Research Centre (MRC) & Central Instrumentation',
      'Central Library & E-Learning Portal',
      'MNIT Innovation & Incubation Centre (MIIC)',
      'Indoor & Outdoor Sports Grounds',
      'Campus Wi-Fi & Data Centre',
    ],
    studentFacilities: [
      'Separate Boys & Girls Hostels on Campus',
      'Hygienic Mess Facilities & Annapurna Canteen',
      'Dispensary & Emergency Ambulance Service',
      'Technical, Literary & Cultural Clubs (Sphinx, Blitzschlag)',
      'Placement & Training Cell',
      'Student Mentorship & Anti-Ragging Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_vnit_nagpur: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'VNIT',
    logoAccent: '#334155',
    address: 'South Ambazari Road, Ambazari, Nagpur, Maharashtra 440010',
    nearestTransit: 'Nagpur Junction (~7 km) · Dr. Babasaheb Ambedkar International Airport (~6 km)',
    contactEmail: 'academic@vnit.ac.in (verify on official portal)',
    contactPhone: '+91-712-2222828 (general office — verify current admissions desk)',
    description:
      'Visvesvaraya National Institute of Technology Nagpur (established 1960) is a premier centrally funded technical university in central India. Named after Bharat Ratna Sir M. Visvesvaraya, VNIT offers strong foundational engineering education across Computer Science, Electronics, Electrical, Mechanical, and Civil disciplines.',
    nirfRanking: 'NIRF Engineering Top-50 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch (5 Years)', 'M.Tech / M.Sc / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under JoSAA/CSAB HS (Maharashtra) or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹10.5 – ₹12.5 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official VNIT T&P disclosure',
      placementSummary:
        'Steady hiring across core engineering, automotive, software development, and finance analytics recruiters.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Reading Wing',
      'Academic Block & Department Research Labs',
      'High-Speed Campus Network & Wi-Fi',
      'Auditorium & Convention Hall',
      'Sports Ground, Tennis & Basketball Courts',
      'Centre for Innovation & Entrepreneurship',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Hostel Dining Messes & Student Canteens',
      'Campus Health Centre',
      'Student Technical & Cultural Festivals (AXIS, Aarohi)',
      'Training & Placement Cell',
      'Merit & Category Scholarship Desk',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_nit_goa: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'NITG',
    logoAccent: '#0F766E',
    address: 'Kottamoll Plateau, Cuncolim Municipal Area, Salcete Taluka, South Goa 403703',
    nearestTransit: 'Madgaon Railway Station (~14 km) · Dabolim Goa Airport (~42 km)',
    contactEmail: 'admissions@nitgoa.ac.in (verify on official portal)',
    contactPhone: '+91-832-2404200 (general office — verify current admissions desk)',
    description:
      'Established in 2010 as part of the expansion of National Institutes of Technology, NIT Goa operates from its permanent campus in Cuncolim, South Goa. It offers focused batch sizes in CSE, ECE, and EEE with dedicated Goa State (GO) and Other State (OS) seats through JoSAA and CSAB.',
    nirfRanking: 'NIRF Engineering 101–150 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under JoSAA/CSAB GO/HS or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹9.0 – ₹11.0 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official NIT Goa T&P portal',
      placementSummary:
        'Focused batch size supports steady campus placements across software, embedded systems, and core electrical companies.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Permanent Campus Academic & Lab Blocks (Cuncolim)',
      'Central Library & E-Resources',
      'Campus Wi-Fi & Computing Centre',
      'Seminar Halls & Smart Classrooms',
      'Outdoor Sports Facilities',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Student Mess & Canteen',
      'Campus Medical Care Unit',
      'Technical & Coding Clubs',
      'Training & Placement Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_nit_srinagar: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under NITSER Act',
    logoMonogram: 'NITS',
    logoAccent: '#1E40AF',
    address: 'Hazratbal, Srinagar, Jammu and Kashmir 190006',
    nearestTransit: 'Srinagar Railway Station (~18 km) · Sheikh ul-Alam International Airport (~22 km)',
    contactEmail: 'academic@nitsri.ac.in (verify on official portal)',
    contactPhone: '+91-194-2422032 (general office — verify current admissions desk)',
    description:
      'Situated beside Dal Lake in Hazratbal, NIT Srinagar was established in 1960 and is one of the oldest technical institutions in northern India. It participates in JoSAA and CSAB with Home State / Jammu & Kashmir (HS/JK) and Other State seats across core and computing branches.',
    nirfRanking: 'NIRF Engineering 75–100 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / M.Sc / MBA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under JoSAA/CSAB HS/JK or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹8.0 – ₹10.0 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official T&P portal',
      placementSummary:
        'Recruiters include IT services, core infrastructure/PSU firms, and national engineering companies.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Technical Journals',
      'Departmental Engineering Laboratories & Central Workshop',
      'Campus Wi-Fi & Computing Centre',
      'Common Hall Auditorium & Lecture Blocks',
      'Outdoor Sports Grounds & Indoor Gymnasium',
    ],
    studentFacilities: [
      'Residential Hostels for Boys & Girls',
      'Student Messes & Campus Cafeteria',
      'Medical Unit & Ambulance Support',
      'Technical & Cultural Student Societies',
      'Training & Placement Department',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_iiit_allahabad: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Centrally Funded Institute of National Importance (IIIT Act)',
    logoMonogram: 'IIITA',
    logoAccent: '#1D4ED8',
    address: 'Devghat, Jhalwa, Prayagraj, Uttar Pradesh 211015',
    nearestTransit: 'Prayagraj Junction (~10 km) · Prayagraj Airport (~4 km)',
    contactEmail: 'contact@iiita.ac.in (verify on official portal)',
    contactPhone: '+91-532-2922000 (general office — verify current admissions desk)',
    description:
      'Indian Institute of Information Technology, Allahabad (founded 1999) is a centrally funded Institute of National Importance dedicated exclusively to Information Technology, Electronics, and Applied Computing. All undergraduate B.Tech seats are filled strictly on All-India (AI) merit through JoSAA/CSAB without state-quota splits.',
    nirfRanking: 'NIRF Engineering 80–100 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech in IT & ECE (4 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation (All India Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank; All-India (AI) quota only.',
    estimatedTotalFee: '₹8.0L – ₹9.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹18.0 – ₹22.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹22.0 – ₹25.0 LPA (Demo reference — IT-focused curriculum)',
      highestPackage: 'Not reliably reported — verify official IIITA Placement Cell disclosure',
      placementSummary:
        'Highly focused IT and Electronics curriculum with strong competitive programming culture and software/product-company recruiting.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Modern Computing & AI Research Laboratories',
      'Central Library & 24x7 Reading Hall',
      'High-Speed Optical Fiber Campus Network',
      'Main Auditorium & Lecture Theatres',
      'Swimming Pool, Synthetic Tennis Courts & Sports Complex',
    ],
    studentFacilities: [
      'Fully Residential Boys & Girls Hostels',
      'Central Student Messes & Campus Cafeterias',
      'On-Campus Health Centre',
      'Competitive Coding (GeekHaven) & Robotics Societies',
      'Dedicated Training & Placement Cell',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  inst_iiitm_gwalior: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Centrally Funded Institute of National Importance (IIIT Act)',
    logoMonogram: 'IIITM',
    logoAccent: '#0E7490',
    address: 'Morena Link Road, Gwalior, Madhya Pradesh 474015',
    nearestTransit: 'Gwalior Junction (~7 km) · Rajmata Vijaya Raje Scindia Airport (~12 km)',
    contactEmail: 'admissions@iiitm.ac.in (verify on official portal)',
    contactPhone: '+91-751-2449704 (general office — verify current admissions desk)',
    description:
      'ABV-IIITM Gwalior, established in 1997, is India’s first centrally funded IIIT combining Information Technology and Management disciplines on a 160-acre green residential campus. Undergraduate admissions operate exclusively under the All-India (AI) quota via JoSAA and CSAB.',
    nirfRanking: 'NIRF Engineering 90–120 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Management Participant', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'Integrated B.Tech + M.Tech / MBA (5 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation (All India Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under All-India (AI) quota.',
    estimatedTotalFee: '₹8.0L – ₹9.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹15.0 – ₹17.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹17.0 – ₹20.0 LPA (Demo reference — verify official placement cell)',
      highestPackage: 'Not reliably reported — verify official ABV-IIITM placement report',
      placementSummary:
        'Strong recruiting from software engineering, product technology, and management-analytics companies.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Learning Resource Centre (Central Library)',
      'Advanced Computing, IoT & Cybersecurity Labs',
      'Campus-Wide Wi-Fi & Fibre Backbone',
      'Open-Air Theatre & Main Auditorium',
      'Sports Complex, Swimming Pool & Butterfly Conservatory Campus',
    ],
    studentFacilities: [
      'On-Campus Residential Boys & Girls Hostels',
      'Student Mess & Night Cafeteria',
      '24x7 Campus Medical Centre',
      'Technical & Coding Societies (AASF, IEEE)',
      'Placement & Corporate Relations Cell',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  inst_iiit_lucknow: {
    ownership: 'Public-Private (PPP)',
    ownershipDetails: 'Institute of National Importance under IIIT (PPP) Act — MoE, Govt. of UP & Industry Partners',
    logoMonogram: 'IIITL',
    logoAccent: '#4338CA',
    address: 'Chak Ganjaria, C.G. City, Ahmamau, Lucknow, Uttar Pradesh 226002',
    nearestTransit: 'Charbagh Railway Station (~14 km) · Chaudhary Charan Singh International Airport (~18 km)',
    contactEmail: 'admissions@iiitl.ac.in (verify on official portal)',
    contactPhone: '+91-522-2600000 (verify official helpline on iiitl.ac.in)',
    description:
      'Indian Institute of Information Technology, Lucknow (established 2015) operates under the Public-Private Partnership (PPP) IIIT model in C.G. City, Lucknow. Its focused curriculum in Computer Science, AI, and IT attracts strong peer cohorts via JoSAA All-India merit.',
    nirfRanking: 'Not yet ranked in top-100 NIRF band (verify latest release on nirfindia.org)',
    otherRankings: ['Institute of National Importance under IIIT (PPP) Act'],
    accreditation: 'Institute of National Importance (IIIT PPP Act, Parliament of India)',
    coursesOffered: ['B.Tech in CS, IT, CS & AI, CS & Business (4 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation (All India Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under All-India (AI) quota.',
    estimatedTotalFee: '₹11.0L – ₹13.0L total 4-year B.Tech estimate incl. hostel (Demo reference — PPP fee structure; verify official circular)',
    placements: {
      medianPackage: '₹17.0 – ₹21.0 LPA (Demo reference — verify official placement report)',
      averagePackage: '₹20.0 – ₹24.0 LPA (Demo reference — computing-only batch)',
      highestPackage: 'Not reliably reported — verify official IIITL Placement Cell disclosure',
      placementSummary:
        'Computing-focused intake yields concentrated hiring across software, fintech, and AI engineering roles.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Modern Computing & AI/ML Research Labs',
      'Digital Library & Quiet Study Zones',
      'Campus-Wide High-Speed Wi-Fi',
      'Smart Lecture Halls & Innovation Studio',
      'Outdoor Sports Courts & Fitness Centre',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Student Dining Mess & Cafeteria',
      'Campus Medical Room & Emergency Tie-Up',
      'Competitive Coding & Open-Source Clubs (Axios)',
      'Training & Placement Cell',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  inst_bit_mesra: {
    ownership: 'Private',
    ownershipDetails: 'Private Deemed-to-be-University (GFTI-Listed Participant in JoSAA/CSAB)',
    logoMonogram: 'BITM',
    logoAccent: '#991B1B',
    address: 'Birla Institute of Technology, Mesra, Ranchi, Jharkhand 835215',
    nearestTransit: 'Ranchi Junction (~16 km) · Birsa Munda Airport, Ranchi (~22 km)',
    contactEmail: 'admissions@bitmesra.ac.in (verify on official portal)',
    contactPhone: '+91-651-2275444 (general office — verify current admissions desk)',
    description:
      'Founded in 1955 by industrialist B.M. Birla, BIT Mesra is a historic Deemed-to-be-University spanning 780 acres near Ranchi. Though privately managed as a Deemed University, it participates directly in central JoSAA and CSAB counselling as a GFTI-listed institute with Jharkhand Home State and All-India seats.',
    nirfRanking: 'NIRF Engineering Top-60 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Pharmacy & Architecture Participant', 'UGC Deemed University'],
    accreditation: 'NAAC Accredited · NBA Accredited Programmes (verify cycle on bitmesra.ac.in)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch / B.Pharm / Integrated M.Sc', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) + valid JEE Main rank via JoSAA/CSAB; verify current percentage criteria in JoSAA & BIT Mesra brochure.',
    estimatedTotalFee: '₹15.5L – ₹18.5L total 4-year B.Tech estimate incl. hostel (Demo reference — private deemed university fee structure)',
    placements: {
      medianPackage: '₹9.5 – ₹11.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹11.0 – ₹13.0 LPA (Demo reference — varies sharply by branch)',
      highestPackage: 'Not reliably reported — verify official Training & Placement report',
      placementSummary:
        'Long-standing alumni network supporting campus placements in IT, product engineering, core manufacturing, and consulting.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '780-Acre Green Residential Campus & Central Library',
      'Space Engineering & Rocketry + Core Engineering Labs',
      'High-Speed Campus Wi-Fi & Data Centre',
      'G.P. Birla Auditorium & Lecture Complex',
      'Sports Complex, Stadium & Indoor Courts',
      'Technology Entrepreneurship Park (STEP)',
    ],
    studentFacilities: [
      '13+ On-Campus Residential Hostels for Boys & Girls',
      'Hostel Messes & Campus Shopping Complex',
      'On-Campus Hospital & Medical Support',
      'Student Technical, Robotics & Cultural Clubs (Bitotsav)',
      'Training & Placement Division',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_pec_chandigarh: {
    ownership: 'Government',
    ownershipDetails: 'Public Funded Deemed-to-be-University (UT Chandigarh Administration — GFTI in JoSAA)',
    logoMonogram: 'PEC',
    logoAccent: '#1E3A8A',
    address: 'Sector 12, Vidya Path, Chandigarh 160012',
    nearestTransit: 'Chandigarh Railway Station (~10 km) · Shaheed Bhagat Singh International Airport (~18 km)',
    contactEmail: 'admissions@pec.edu.in (verify on official portal)',
    contactPhone: '+91-172-2753051 (general office — verify current admissions desk)',
    description:
      'Tracing its heritage back to 1921, Punjab Engineering College (Deemed to be University) in Sector 12, Chandigarh is a prestigious public technical university funded by the Chandigarh Administration. It participates in JoSAA and CSAB with a 50% Chandigarh Home State and 50% Other State seat split.',
    nirfRanking: 'NIRF Engineering 101–150 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Century-Old Public Engineering Institution (Est. 1921)'],
    accreditation: 'UGC Deemed-to-be-University · NBA Accredited B.Tech Programmes (verify cycle)',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) + valid JEE Main rank under JoSAA/CSAB Chandigarh UT (HS) or Other State (OS) quota.',
    estimatedTotalFee: '₹8.0L – ₹10.0L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official PEC fee circular)',
    placements: {
      medianPackage: '₹11.5 – ₹13.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹13.5 – ₹15.5 LPA (Demo reference — verify official CDGC report)',
      highestPackage: 'Not reliably reported — verify official PEC CDGC annual report',
      placementSummary:
        'Strong 6-month mandatory industry internship semester supports pre-placement offers across tech, finance, and core engineering.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '146-Acre Planned Campus in Sector 12 Chandigarh',
      'Central Library & Digital Archive',
      'Semiconductor, Aerospace & Siemens Centre of Excellence Labs',
      'Auditorium & Academic Blocks',
      'Swimming Pool, Athletics Ground & Sports Complex',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Student Messes & PEC Market Cafeterias',
      'Campus Dispensary & Medical Facility',
      'Active Technical, Aerospace & Cultural Clubs (PECFest)',
      'Career Development & Guidance Centre (CDGC)',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_iiest_shibpur: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance (NITSER Act, NIT+ System)',
    logoMonogram: 'IIEST',
    logoAccent: '#0B1F3A',
    address: 'Botanic Garden Area, Shibpur, Howrah, West Bengal 711103',
    nearestTransit: 'Howrah Junction (~7 km) · Netaji Subhas Chandra Bose International Airport (~24 km)',
    contactEmail: 'academic@iiests.ac.in (verify on official portal)',
    contactPhone: '+91-33-26684561 (general office — verify current admissions desk)',
    description:
      'Founded in 1856 as Civil Engineering College (formerly BESU Shibpur), IIEST Shibpur is India’s second-oldest engineering institution and a centrally funded Institute of National Importance grouped under the NIT+ system in JoSAA and CSAB.',
    nirfRanking: 'NIRF Engineering Top-55 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Architecture Top-15 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Act of Parliament) · Statutory MoE Institution',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch (5 Years)', 'M.Tech / M.Sc / MBA / Ph.D.'],
    entranceExams: ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'],
    eligibilitySummary:
      'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + JEE Main rank under JoSAA/CSAB HS (West Bengal) or OS quota.',
    estimatedTotalFee: '₹6.5L – ₹8.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹8.5 – ₹10.5 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official IIEST Placement Cell report',
      placementSummary:
        'Historic alumni network with recruiters spanning core civil/mechanical, software, analytics, and public-sector enterprises.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Heritage 114-Acre Campus Adjacent to Indian Botanic Garden',
      'Ramanujan Central Library',
      'School of VLSI, Material Science & Core Engineering Labs',
      'Institute Hall & Seminar Auditoriums',
      'Oval Ground, Lord’s Ground & Swimming Pool',
    ],
    studentFacilities: [
      'Traditional Halls of Residence & Hostels for Boys & Girls',
      'Student Messes & Campus Cafeterias',
      'Institute Hospital & 24x7 Medical Care',
      'Heritage Cultural & Technical Societies (Instruo, Rebecca)',
      'Human Resource Management / Placement Department',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  // REAP (Rajasthan)
  inst_mbm_jodhpur: {
    ownership: 'Government',
    ownershipDetails: 'State Government Technical University (Government of Rajasthan)',
    logoMonogram: 'MBM',
    logoAccent: '#9A3412',
    address: 'Air Force Area, Ratanada, Jodhpur, Rajasthan 342011',
    nearestTransit: 'Jodhpur Junction (~4 km) · Jodhpur Airport (~3 km)',
    contactEmail: 'registrar@mbm.ac.in (verify on official portal)',
    contactPhone: '+91-291-2514790 (general office — verify current admissions desk)',
    description:
      'Established in 1951 as M.B.M. Engineering College and upgraded to MBM University by an Act of the Rajasthan Legislature, MBM Jodhpur is Rajasthan’s oldest public engineering institution participating in REAP centralised admissions.',
    nirfRanking: 'Not ranked in top-150 NIRF Engineering band (verify latest release on nirfindia.org)',
    otherRankings: ['Flagship State Government Engineering University in Rajasthan'],
    accreditation: 'State Public University (Act of Govt. of Rajasthan) · AICTE Approved',
    coursesOffered: ['B.E. / B.Tech (4 Years)', 'B.Arch (5 Years)', 'M.E. / MCA / Ph.D.'],
    entranceExams: ['JEE Main (Priority in REAP Merit)', 'Class 12 Board Merit via REAP'],
    eligibilitySummary:
      'Class 12 (PCM) with minimum 45% (40% reserved Rajasthan categories) + REAP registration with JEE Main CRL or Class 12 merit.',
    estimatedTotalFee: '₹2.5L – ₹4.2L total 4-year B.E. estimate incl. hostel (Demo reference — subsidized state government fees)',
    placements: {
      medianPackage: '₹6.0 – ₹7.5 LPA (Demo reference — verify official TPO report)',
      averagePackage: 'Not reliably reported — verify branch-wise official TPO disclosure',
      highestPackage: 'Not reliably reported — verify official MBM TPO annual summary',
      placementSummary:
        'Strong core engineering & mining/mechanical alumni base alongside software and PSU hiring.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Technical Reference Wing',
      'Departmental Core & Computing Laboratories',
      'Campus Wi-Fi & Seminar Halls',
      'Main Auditorium & Workshop Complex',
      'Sports Grounds & Gymnasium',
    ],
    studentFacilities: [
      'Government Boys & Girls Hostels',
      'Student Mess & Campus Canteen',
      'Medical Dispensary Access',
      'Technical & Coding Societies',
      'Training & Placement Office',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_rtu_kota: {
    ownership: 'Government',
    ownershipDetails: 'State Government Affiliating & Teaching Technical University (Govt. of Rajasthan)',
    logoMonogram: 'RTU',
    logoAccent: '#1E3A8A',
    address: 'Rawatbhata Road, Akelgarh, Kota, Rajasthan 324010',
    nearestTransit: 'Kota Junction (~12 km) · Dakaniya Talav Station (~9 km)',
    contactEmail: 'admissions@rtu.ac.in (verify on official portal)',
    contactPhone: '+91-744-2473003 (general office — verify current admissions desk)',
    description:
      'Rajasthan Technical University (University Department), Kota sits on a spacious campus along the Chambal riverfront and serves as Rajasthan’s affiliating technical university while running its own undergraduate B.Tech programmes admitted via REAP.',
    nirfRanking: 'Not ranked in top-150 NIRF Engineering band (verify latest release on nirfindia.org)',
    otherRankings: ['State Technical University of Rajasthan'],
    accreditation: 'UGC Recognized State Technical University · AICTE Approved',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / MBA / MCA / Ph.D.'],
    entranceExams: ['JEE Main (via REAP)', 'Class 12 Merit (via REAP)'],
    eligibilitySummary:
      'Class 12 (PCM) meeting REAP eligibility norms + REAP centralised counselling allotment under HS (Rajasthan) or OS quota.',
    estimatedTotalFee: '₹2.8L – ₹4.5L total 4-year B.Tech estimate incl. hostel (Demo reference — state university fees)',
    placements: {
      medianPackage: '₹5.0 – ₹6.5 LPA (Demo reference — verify official TPO report)',
      averagePackage: 'Not reliably reported — refer to official university placement disclosures',
      highestPackage: 'Not reliably reported — verify with RTU Kota Placement Cell',
      placementSummary:
        'Campus drives cover IT services, core electrical/mechanical industries, and GATE/PSU preparation ecosystems.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '385-Acre Campus Along Chambal River',
      'Central Library & Research Centre',
      'Core Engineering & Computing Labs',
      'Central Auditorium & Examination Complex',
      'Sports Complex & Playing Fields',
    ],
    studentFacilities: [
      'University Boys & Girls Hostels',
      'Hostel Mess & Campus Canteen',
      'University Health Centre',
      'Technical & Cultural Student Clubs (Thar)',
      'University Training & Placement Cell',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_ctae_udaipur: {
    ownership: 'Government',
    ownershipDetails: 'State Government Constituent Engineering College (MPUAT, Govt. of Rajasthan)',
    logoMonogram: 'CTAE',
    logoAccent: '#0F766E',
    address: 'University Campus, Bohra Ganeshji Road, Udaipur, Rajasthan 313001',
    nearestTransit: 'Udaipur City Railway Station (~5 km) · Maharana Pratap Airport (~21 km)',
    contactEmail: 'dean@ctae.ac.in (verify on official portal)',
    contactPhone: '+91-294-2470837 (general office — verify current admissions desk)',
    description:
      'College of Technology and Engineering (CTAE), Udaipur, established in 1964, is a constituent public engineering college under Maharana Pratap University of Agriculture and Technology (MPUAT). It admits undergraduate students through REAP across Computer Science, Mechanical, Civil, and allied engineering branches.',
    nirfRanking: 'Not ranked in top-150 NIRF Engineering band (verify latest release on nirfindia.org)',
    otherRankings: ['Constituent College of MPUAT Udaipur'],
    accreditation: 'State Government University Constituent College · AICTE & NBA Accredited (select programmes)',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / Ph.D.'],
    entranceExams: ['JEE Main (via REAP)', 'Class 12 Merit (via REAP)'],
    eligibilitySummary:
      'Class 12 (PCM) meeting REAP norms + REAP counselling seat allotment under Rajasthan Domicile (HS) or OS quota.',
    estimatedTotalFee: '₹3.0L – ₹4.8L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official MPUAT circular)',
    placements: {
      medianPackage: '₹5.5 – ₹6.8 LPA (Demo reference — verify official placement cell)',
      averagePackage: 'Not reliably reported — verify official CTAE placement records',
      highestPackage: 'Not reliably reported — verify official CTAE placement records',
      placementSummary:
        'Steady hiring across core engineering, cement/mining industries in Rajasthan, and national IT recruiters.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Digital Resources',
      'Engineering Workshops & Soil/Materials Testing Labs',
      'Campus Wi-Fi & Computing Labs',
      'Seminar Halls & Auditorium',
      'Outdoor Sports Complex',
    ],
    studentFacilities: [
      'On-Campus Hostels for Boys & Girls',
      'Student Mess & Canteen',
      'Campus Medical Care',
      'Student Technical & Robotics Societies',
      'Training & Placement Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_skit_jaipur: {
    ownership: 'Private',
    ownershipDetails: 'Private Autonomous Self-Financing Institute (Affiliated to RTU Kota)',
    logoMonogram: 'SKIT',
    logoAccent: '#B45309',
    address: 'Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017',
    nearestTransit: 'Getor Jagatpura Station (~3 km) · Jaipur International Airport (~9 km)',
    contactEmail: 'info@skit.ac.in (verify on official portal)',
    contactPhone: '+91-141-5160400 (general office — verify current admissions desk)',
    description:
      'Swami Keshvanand Institute of Technology, Management & Gramothan (SKIT), Jaipur is a well-known private autonomous engineering college in Jagatpura, Jaipur participating in REAP. It offers structured academic delivery in CSE, IT, and ECE with active industry partnerships.',
    nirfRanking: 'Not ranked in top-150 NIRF Engineering band (verify latest release on nirfindia.org)',
    otherRankings: ['RTU Kota QIV Top-Ranked Affiliated Institute (Demo reference)'],
    accreditation: 'NAAC A++ Accredited · UGC Autonomous · NBA Accredited Select Programmes (verify cycle)',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Main (via REAP)', 'Class 12 Merit (via REAP)'],
    eligibilitySummary:
      'Class 12 (PCM) with minimum 45% (40% reserved) + REAP counselling seat allotment under HS or OS quota.',
    estimatedTotalFee: '₹5.2L – ₹7.2L total 4-year B.Tech estimate incl. optional hostel (Demo reference — private self-financing fees)',
    placements: {
      medianPackage: '₹5.2 – ₹6.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹6.0 – ₹7.2 LPA (Demo reference — verify official T&P disclosure)',
      highestPackage: 'Not reliably reported — verify official SKIT placement report',
      placementSummary:
        'Consistent campus drives by IT services, mid-sized product companies, and Jaipur/NCR technology employers.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Knowledge Centre',
      'Industry-Sponsored Computing & IoT Labs',
      'Campus-Wide Wi-Fi & Smart Classrooms',
      'Gyan Mandir Auditorium & Seminar Rooms',
      'Sports Courts & Gymnasium',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Hygienic Dining Mess & Campus Cafeteria',
      'Medical Room & First-Aid Support',
      'Coding, Toastmasters & Cultural Clubs (Pravah)',
      'Dedicated Training & Placement Cell',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  // MHT CET (Maharashtra)
  inst_coep_pune: {
    ownership: 'Government',
    ownershipDetails: 'State Government Unitary Public Technological University (Govt. of Maharashtra)',
    logoMonogram: 'COEP',
    logoAccent: '#0B1F3A',
    address: 'Wellesley Road, Shivajinagar, Pune, Maharashtra 411005',
    nearestTransit: 'Shivajinagar Railway Station (~1 km) · Pune Junction (~3 km) · Pune Airport (~10 km)',
    contactEmail: 'admissions@coeptech.ac.in (verify on official portal)',
    contactPhone: '+91-20-25507000 (general office — verify current admissions desk)',
    description:
      'Founded in 1854 as the Poona Engineering Class and Mechanical School, COEP Technological University is one of Asia’s oldest engineering institutions and Maharashtra’s premier state public technological university. Admitting top MHT CET and JEE Main rankers via State CET Cell CAP, COEP blends heritage academics with strong industry collaborations in Pune.',
    nirfRanking: 'NIRF Engineering Top-80 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Unitary Public Technological University (Govt. of Maharashtra)'],
    accreditation: 'State Public University · NBA Accredited Programmes · AICTE Approved',
    coursesOffered: ['B.Tech (4 Years)', 'B.Plan (4 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['MHT CET (Maharashtra State Quota)', 'JEE Main (All India CAP Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% Maharashtra reserved) + valid MHT CET percentile (HS) or JEE Main rank (AI) via Maharashtra State CET Cell CAP.',
    estimatedTotalFee: '₹5.0L – ₹6.8L total 4-year B.Tech estimate incl. hostel (Demo reference — state university fees)',
    placements: {
      medianPackage: '₹9.5 – ₹11.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹11.0 – ₹13.0 LPA (Demo reference — verify official COEP T&P report)',
      highestPackage: 'Not reliably reported — verify official COEP Placement Cell disclosure',
      placementSummary:
        'Strong recruitment across Pune/Mumbai software, automotive R&D, semiconductor, and investment banking technology teams.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Heritage Main Building & Modern Academic Annexes',
      'Central Library & E-Journal Access',
      'Robotics, EV & Production Engineering Labs',
      'COEP Boat Club (Mula Riverfront) & Sports Grounds',
      'Main Auditorium & Bhau Institute of Innovation',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostel Blocks (Shivajinagar)',
      'Student-Managed Messes & Campus Cafeterias',
      'Campus Health Clinic',
      'Iconic Student Clubs (Boat Club, Baja, MindSpark, Impressions)',
      'Training & Placement Cell',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_vjti_mumbai: {
    ownership: 'Government Aided',
    ownershipDetails: 'Government-Aided Autonomous Institute (Financially Aided by Govt. of Maharashtra)',
    logoMonogram: 'VJTI',
    logoAccent: '#1E3A8A',
    address: 'H.R. Mahajani Road, Matunga East, Mumbai, Maharashtra 400019',
    nearestTransit: 'Matunga / King’s Circle / Wadala Suburban Stations (~1 km) · Mumbai Airport (~12 km)',
    contactEmail: 'admissions@vjti.ac.in (verify on official portal)',
    contactPhone: '+91-22-24198101 (general office — verify current admissions desk)',
    description:
      'Established in 1887 in Matunga, Mumbai, Veermata Jijabai Technological Institute (VJTI) is a premier government-aided autonomous engineering institute affiliated with the University of Mumbai. Known for its exceptionally competitive MHT CET cutoffs, VJTI places graduates directly into Mumbai’s fintech, software, and core engineering hubs.',
    nirfRanking: 'NIRF Engineering 101–150 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Historic Government-Aided Autonomous Institute (Est. 1887)'],
    accreditation: 'UGC Autonomous · NBA Accredited Select Programmes · AICTE Approved',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / MCA / Ph.D.'],
    entranceExams: ['MHT CET (State CET Cell CAP)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% Maharashtra reserved) + MHT CET score through Maharashtra State CET Cell CAP rounds.',
    estimatedTotalFee: '₹3.6L – ₹5.5L total 4-year B.Tech estimate incl. hostel (Demo reference — government-aided fee structure)',
    placements: {
      medianPackage: '₹11.0 – ₹13.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹13.0 – ₹15.0 LPA (Demo reference — CSE/IT higher)',
      highestPackage: 'Not reliably reported — verify official VJTI TPO annual summary',
      placementSummary:
        'High recruiting density from Mumbai/Pune fintech, global investment banks, product engineering, and core manufacturing firms.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '16-Acre Heritage Campus in Matunga East, Mumbai',
      'Central Library & Technical Archives',
      'COE in Complex & Nonlinear Dynamical Systems + Computing Labs',
      'Main Auditorium & Department Blocks',
      'Campus Quad & Sports Ground',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels (Limited Intake by Merit)',
      'Student Mess & Campus Canteen',
      'Medical Aid Room',
      'Technical & Coding Societies (Technovanza, Pratibimb, COC)',
      'Training & Placement Office',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_spit_mumbai: {
    ownership: 'Private',
    ownershipDetails: 'Private Unaided Autonomous Institute (Bharatiya Vidya Bhavan Trust, Affiliated to Univ. of Mumbai)',
    logoMonogram: 'SPIT',
    logoAccent: '#0F766E',
    address: 'Bhavan’s Campus, Munshi Nagar, Andheri West, Mumbai, Maharashtra 400058',
    nearestTransit: 'Andheri Railway & Metro Station (~2 km) · Mumbai International Airport (~8 km)',
    contactEmail: 'principal@spit.ac.in (verify on official portal)',
    contactPhone: '+91-22-26707440 (general office — verify current admissions desk)',
    description:
      'Bharatiya Vidya Bhavan’s Sardar Patel Institute of Technology (SPIT), Andheri West is one of Mumbai’s highest-demand private autonomous engineering colleges participating in MHT CET CAP. Focused sharply on Computer Engineering, Computer Science, and Electronics, SPIT sits inside the lush 47-acre Bhavan’s campus.',
    nirfRanking: 'NIRF Engineering 201–300 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Top Private Autonomous Engineering Institute in Mumbai (MHT CET CAP)'],
    accreditation: 'NAAC Accredited · UGC Autonomous · NBA Accredited Programmes (verify cycle)',
    coursesOffered: ['B.Tech in CE, CSE, EXTC (4 Years)', 'M.Tech / MCA / Ph.D.'],
    entranceExams: ['MHT CET (Maharashtra CAP)', 'JEE Main (All India CAP Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) + MHT CET percentile (Maharashtra HS) or JEE Main rank (AI) via Maharashtra State CET Cell CAP.',
    estimatedTotalFee: '₹8.0L – ₹9.5L total 4-year B.Tech tuition estimate (Demo reference — private unaided tuition; no on-campus hostel)',
    placements: {
      medianPackage: '₹11.0 – ₹13.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹13.0 – ₹15.0 LPA (Demo reference — computing-heavy branches)',
      highestPackage: 'Not reliably reported — verify official SPIT Placement Cell report',
      placementSummary:
        'Strong software and financial-technology hiring aided by Mumbai location and focused computing/electronics branches.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Located inside 47-Acre Green Bhavan’s Campus (Andheri West)',
      'Technology Business Incubator (SP-TBI)',
      'Modern Computing, VLSI & Research Labs',
      'Central Library & E-Journal Suite',
      'Auditorium & Shared Bhavan’s Sports Grounds',
    ],
    studentFacilities: [
      'Off-Campus / Nearby PG & Partner Hostel Guidance (Day-Scholar Majority)',
      'Campus Canteen & Cafeterias',
      'Active Coding, IEEE, CSI & Entrepreneurship Clubs (Oculus)',
      'Training & Placement Cell',
      'Student Mentorship & Anti-Ragging Desk',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  inst_pict_pune: {
    ownership: 'Private',
    ownershipDetails: 'Private Unaided Institute (SCTR Trust, Affiliated to Savitribai Phule Pune University)',
    logoMonogram: 'PICT',
    logoAccent: '#1D4ED8',
    address: 'Survey No. 27, Near Trimurti Chowk, Dhankawadi, Pune, Maharashtra 411043',
    nearestTransit: 'Pune Junction (~9 km) · Swargate Metro/Bus Hub (~5 km) · Pune Airport (~17 km)',
    contactEmail: 'registrar@pict.edu (verify on official portal)',
    contactPhone: '+91-20-24371101 (general office — verify current admissions desk)',
    description:
      'Pune Institute of Computer Technology (PICT), founded in 1983, is a specialized private engineering college in Pune dedicated exclusively to Computer Engineering, Information Technology, and Electronics & Telecommunication. It consistently commands some of the highest MHT CET and JEE Main AI cutoffs among private institutes in Maharashtra.',
    nirfRanking: 'NIRF Engineering 201–300 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Specialized Computing & Electronics Private Institute in Pune'],
    accreditation: 'NAAC A+ Accredited · NBA Accredited UG Programmes · AICTE Approved (verify cycle)',
    coursesOffered: ['B.E. in Computer Engg, IT, E&TC (4 Years)', 'M.E. / Ph.D.'],
    entranceExams: ['MHT CET (Maharashtra CAP)', 'JEE Main (All India CAP Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) + MHT CET percentile (HS) or JEE Main rank (AI) via Maharashtra State CET Cell CAP.',
    estimatedTotalFee: '₹4.5L – ₹6.5L total 4-year B.E. tuition estimate (Demo reference — FRA-regulated private tuition; hostel extra)',
    placements: {
      medianPackage: '₹9.5 – ₹11.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹11.0 – ₹12.8 LPA (Demo reference — verify official PICT T&P report)',
      highestPackage: 'Not reliably reported — verify official PICT Placement Cell report',
      placementSummary:
        'Focused computing intake and strong coding culture drive steady placements across Pune’s software and product ecosystem.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Compact Urban Tech Campus in Dhankawadi, Pune',
      'Specialized Software, Networking & Embedded Labs',
      'Central Library & Digital Study Portal',
      'High-Speed Wi-Fi & Seminar Auditorium',
      'Basketball Court & Indoor Recreation Facilities',
    ],
    studentFacilities: [
      'Limited On-Campus Boys & Girls Hostels + Nearby Student Residences',
      'Campus Canteen & Dining Facility',
      'Active Coding, ACM, IEEE & Robotics Clubs (Credenz, Impetus)',
      'Training & Placement Cell',
      'Counselling & Scholarship Desk',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  // WBJEE (West Bengal)
  inst_jadavpur_univ: {
    ownership: 'Government',
    ownershipDetails: 'State Government Public Research University (Government of West Bengal)',
    logoMonogram: 'JU',
    logoAccent: '#7F1D1D',
    address: '188, Raja Subodh Chandra Mallick Road, Jadavpur, Kolkata, West Bengal 700032',
    nearestTransit: 'Jadavpur Railway Station (~1 km) · Sealdah (~9 km) · Kolkata Airport (~21 km)',
    contactEmail: 'registrar@jadavpuruniversity.in (verify on official portal)',
    contactPhone: '+91-33-24146666 (general office — verify current admissions desk)',
    description:
      'Jadavpur University’s Faculty of Engineering & Technology (FET) in Kolkata is among India’s highest-ranked public state research universities. Combining century-old academic heritage, exceptionally low public tuition, and rigorous research output, JU admits undergraduate B.E. students through WBJEE centralised counselling.',
    nirfRanking: 'NIRF Engineering Top-15 Band & Top-10 Universities (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Top-10 Indian Universities', 'State Public Research University'],
    accreditation: 'NAAC A+ Accredited · UGC Recognized State University · NBA Accredited Programmes',
    coursesOffered: ['B.E. / B.Tech (4 Years)', 'B.Arch (5 Years)', 'M.E. / M.Tech / Ph.D.'],
    entranceExams: ['WBJEE (West Bengal Joint Entrance Examination)'],
    eligibilitySummary:
      'Class 12 (PCM) with minimum 60% aggregate (45% SC/ST/OBC/PwD) + WBJEE General Merit Rank (GMR) via WBJEEB counselling.',
    estimatedTotalFee: '₹0.15L – ₹0.50L total 4-year B.E. tuition estimate (Demo reference — heavily subsidized state university tuition; hostel nominal)',
    placements: {
      medianPackage: '₹10.0 – ₹12.5 LPA (Demo NIRF-style reference across all FET branches)',
      averagePackage: 'Not reliably reported — CSE/IT/ECE averages differ significantly from core; verify official JU Placement Cell',
      highestPackage: 'Not reliably reported — verify official JU Placement Cell disclosure',
      placementSummary:
        'Exceptional ROI with strong recruitment across software product firms, core engineering, consulting, and global research admissions.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '58-Acre Main Campus (Jadavpur) & Salt Lake Engineering Campus',
      'Central Library & Departmental Research Libraries',
      'Advanced Computing, Energy & Material Science Labs',
      'Triguna Sen Auditorium & Open-Air Theatre',
      'Sports Grounds, Tennis & Indoor Complexes',
    ],
    studentFacilities: [
      'Subsidized University Boys & Girls Hostels',
      'Student-Run Messes & Historic Campus Canteens',
      'University Health Centre',
      'Science, Coding, Debate & Cultural Societies (Srijan, Sanskriti)',
      'Placement & Training Cell',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_kgec_kalyani: {
    ownership: 'Government',
    ownershipDetails: 'State Government Engineering College (Govt. of West Bengal, Affiliated to MAKAUT)',
    logoMonogram: 'KGEC',
    logoAccent: '#0F766E',
    address: 'Kalyani University Campus, Kalyani, Nadia, West Bengal 741235',
    nearestTransit: 'Kalyani Ghoshpara Station (~1.5 km) · Kolkata Airport (~45 km)',
    contactEmail: 'contact@kgec.edu.in (verify on official portal)',
    contactPhone: '+91-33-25821309 (general office — verify current admissions desk)',
    description:
      'Kalyani Government Engineering College (established 1995) is one of West Bengal’s premier state-run engineering colleges located in the planned university township of Kalyani. Admitting students via WBJEE, KGEC offers subsidized government tuition and active coding and robotics student communities.',
    nirfRanking: 'Not ranked in top-150 NIRF Engineering band (verify latest release on nirfindia.org)',
    otherRankings: ['Leading State Government Engineering College under WBJEE'],
    accreditation: 'State Government Institution · AICTE Approved · Affiliated to MAKAUT',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / MCA'],
    entranceExams: ['WBJEE (West Bengal Joint Entrance Examination)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% reserved) + valid WBJEE General Merit Rank via WBJEEB counselling.',
    estimatedTotalFee: '₹0.45L – ₹1.4L total 4-year B.Tech estimate incl. hostel (Demo reference — subsidized West Bengal govt. fees)',
    placements: {
      medianPackage: '₹5.5 – ₹7.0 LPA (Demo reference — verify official T&P cell)',
      averagePackage: 'Not reliably reported — verify official KGEC placement disclosure',
      highestPackage: 'Not reliably reported — verify official KGEC placement disclosure',
      placementSummary:
        'Steady hiring across IT services, mid-sized product startups, and core engineering companies in Kolkata/Bengaluru.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Academic Blocks & Departmental Engineering Labs',
      'Central Library & Reading Room',
      'Campus Wi-Fi & Computing Centre',
      'Seminar Halls & Workshop',
      'Outdoor Cricket & Football Grounds',
    ],
    studentFacilities: [
      'Government Boys & Girls Hostels on Campus',
      'Student-Managed Hostel Messes',
      'Medical First-Aid & Kalyani Hospital Proximity',
      'Coding, Robotics & Cultural Societies (Techtix, Espektro)',
      'Training & Placement Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_jgec_jalpaiguri: {
    ownership: 'Government',
    ownershipDetails: 'Autonomous State Government Engineering College (Government of West Bengal)',
    logoMonogram: 'JGEC',
    logoAccent: '#1E3A8A',
    address: 'Jalpaiguri Government Engineering College Campus, Jalpaiguri, West Bengal 735102',
    nearestTransit: 'Jalpaiguri Road Station (~4 km) · New Jalpaiguri Jn (~42 km) · Bagdogra Airport (~55 km)',
    contactEmail: 'principal@jgec.ac.in (verify on official portal)',
    contactPhone: '+91-3561-255131 (general office — verify current admissions desk)',
    description:
      'Established in 1961 on a 165-acre campus in North Bengal, Jalpaiguri Government Engineering College (JGEC) is an autonomous state government engineering institution under the Government of West Bengal. It offers subsidized public engineering education via WBJEE.',
    nirfRanking: 'Not ranked in top-150 NIRF Engineering band (verify latest release on nirfindia.org)',
    otherRankings: ['Historic Autonomous State Government Engineering College (Est. 1961)'],
    accreditation: 'Autonomous State Government College · AICTE Approved · NBA Accredited Select Programmes',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech'],
    entranceExams: ['WBJEE (West Bengal Joint Entrance Examination)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% reserved) + valid WBJEE General Merit Rank via WBJEEB counselling.',
    estimatedTotalFee: '₹0.45L – ₹1.4L total 4-year B.Tech estimate incl. hostel (Demo reference — subsidized state govt. fees)',
    placements: {
      medianPackage: '₹5.0 – ₹6.5 LPA (Demo reference — verify official T&P cell)',
      averagePackage: 'Not reliably reported — verify official JGEC placement summary',
      highestPackage: 'Not reliably reported — verify official JGEC placement summary',
      placementSummary:
        'Consistent campus drives from IT services, core manufacturing/power companies, and strong GATE/higher-studies outcomes.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '165-Acre Green Residential Campus',
      'Central Library & Technical Archive',
      'Core Engineering Labs & Central Workshop',
      'Auditorium & Smart Lecture Halls',
      'Sports Grounds & Gymnasium',
    ],
    studentFacilities: [
      'Residential Boys & Girls Hostels',
      'Student Messes & Campus Canteen',
      'On-Campus Medical Unit',
      'Technical, Open-Source & Cultural Clubs (Sristi, Jeclat)',
      'Training & Placement Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_iem_kolkata: {
    ownership: 'Private',
    ownershipDetails: 'Private Self-Financing Engineering Institute (Salt Lake, Kolkata)',
    logoMonogram: 'IEM',
    logoAccent: '#3730A3',
    address: 'Y-12, Block EP, Sector V, Salt Lake Electronics Complex, Kolkata, West Bengal 700091',
    nearestTransit: 'Sector V Metro Station (~1 km) · Sealdah Station (~9 km) · Kolkata Airport (~13 km)',
    contactEmail: 'admissions@iem.edu.in (verify on official portal)',
    contactPhone: '+91-33-23572995 (general office — verify current admissions desk)',
    description:
      'Located directly inside Kolkata’s Sector V IT Hub in Salt Lake, Institute of Engineering & Management (IEM) is among West Bengal’s most established private self-financing engineering institutes participating in WBJEE centralised counselling.',
    nirfRanking: 'NIRF Engineering 151–200 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Prominent Private Self-Financing Institute in WBJEE'],
    accreditation: 'NAAC A Accredited · AICTE Approved · NBA Accredited Select Programmes (verify cycle)',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / MBA / MCA'],
    entranceExams: ['WBJEE (Primary)', 'JEE Main (WBJEEB All India Seats)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% reserved) + WBJEE GMR or JEE Main rank via WBJEEB counselling.',
    estimatedTotalFee: '₹7.5L – ₹9.5L total 4-year B.Tech tuition estimate (Demo reference — private self-financing fees; hostel extra)',
    placements: {
      medianPackage: '₹5.5 – ₹6.8 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official IEM Placement Cell disclosure',
      placementSummary:
        'High placement participation across major IT consulting, software services, and Sector V technology employers.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Urban IT-Hub Campus in Salt Lake Sector V',
      'Computing, AI & Innovation Labs',
      'Digital Library & Study Centre',
      'Campus Wi-Fi & Seminar Halls',
      'Entrepreneurship & Patent Facilitation Cell',
    ],
    studentFacilities: [
      'Associated Hostels & Nearby Salt Lake Student Residences',
      'Campus Cafeteria & Dining',
      'Medical Support Desk',
      'Technical, Coding & Cultural Clubs (Innovacion)',
      'Dedicated Corporate Relations & Placement Cell',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  // KCET (Karnataka)
  inst_rvce_bengaluru: {
    ownership: 'Government Aided',
    ownershipDetails: 'Private Aided Autonomous Engineering College (RSST Trust, Affiliated to VTU)',
    logoMonogram: 'RVCE',
    logoAccent: '#0B1F3A',
    address: 'RV Vidyaniketan Post, 8th Mile, Mysuru Road, Bengaluru, Karnataka 560059',
    nearestTransit: 'Pattanagere Metro Station (~0.5 km) · KSR Bengaluru City Jn (~12 km) · KIA Airport (~44 km)',
    contactEmail: 'principal@rvce.edu.in (verify on official portal)',
    contactPhone: '+91-80-68188100 (general office — verify current admissions desk)',
    description:
      'R.V. College of Engineering (RVCE), established in 1963 on Mysuru Road, Bengaluru, is Karnataka’s most sought-after autonomous engineering college under KEA KCET. Supported by direct Metro connectivity and deep industry-sponsored centres of excellence, RVCE pairs public-aided KCET quota affordability with Bengaluru’s global tech ecosystem.',
    nirfRanking: 'NIRF Engineering Top-100 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Top-Demand Engineering College in KEA KCET'],
    accreditation: 'NAAC A+ Accredited · UGC Autonomous · NBA Accredited UG Programmes (verify cycle)',
    coursesOffered: ['B.E. (4 Years)', 'M.Tech / MCA / Ph.D.'],
    entranceExams: ['KCET (KEA Karnataka Quota)', 'COMEDK UGET (Separate Non-KCET Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% Karnataka SC/ST/OBC) + KCET Engineering Rank and Karnataka Domicile eligibility clauses via KEA.',
    estimatedTotalFee: '₹4.5L – ₹6.0L total 4-year B.E. estimate via KCET Govt. Quota (Demo reference — hostel extra; verify latest KEA fee notification)',
    placements: {
      medianPackage: '₹10.0 – ₹12.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹12.5 – ₹15.0 LPA (Demo reference — CSE/ISE/ECE higher)',
      highestPackage: 'Not reliably reported — verify official RVCE Placement & Training report',
      placementSummary:
        'Extensive campus hiring from global product tech, semiconductor, aerospace, and R&D centres headquartered in Bengaluru.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '16.8-Acre Green Campus Right Next to Pattanagere Metro',
      'Industry Centres of Excellence (Cisco, Mercedes-Benz, Wipro, Boeing)',
      'Central Library & E-Resource Hub',
      'Campus-Wide Wi-Fi & Supercomputing Lab',
      'Auditorium & Outdoor Sports Complex',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Student Mess & Food Court',
      'Campus Health Centre',
      'Solar Car, Rocketry, Coding & Cultural Teams (8th Mile)',
      'Placement & Training Department',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_bmsce_bengaluru: {
    ownership: 'Government Aided',
    ownershipDetails: 'Private Aided Autonomous Engineering College (BMSET, Affiliated to VTU)',
    logoMonogram: 'BMSCE',
    logoAccent: '#1E3A8A',
    address: 'Bull Temple Road, Basavanagudi, Bengaluru, Karnataka 560019',
    nearestTransit: 'National College Metro Station (~1.5 km) · KSR Bengaluru City Jn (~5 km)',
    contactEmail: 'info@bmsce.ac.in (verify on official portal)',
    contactPhone: '+91-80-26622130 (general office — verify current admissions desk)',
    description:
      'Founded in 1946 as India’s first private-sector initiative in engineering education, B.M.S. College of Engineering (BMSCE) in central Basavanagudi, Bengaluru is a government-aided autonomous institution participating in KEA KCET with one of the strongest engineering alumni networks in Karnataka.',
    nirfRanking: 'NIRF Engineering 101–150 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Historic Autonomous Aided Institution in Bengaluru (Est. 1946)'],
    accreditation: 'NAAC A++ Accredited · UGC Autonomous · NBA Accredited Programmes (verify cycle)',
    coursesOffered: ['B.E. (4 Years)', 'M.Tech / MBA / MCA / Ph.D.'],
    entranceExams: ['KCET (KEA Karnataka Quota)', 'COMEDK UGET (Separate Non-KCET Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% Karnataka reserved) + KCET Engineering Rank via KEA centralised seat allotment.',
    estimatedTotalFee: '₹4.5L – ₹6.0L total 4-year B.E. estimate via KCET Govt. Quota (Demo reference — hostel extra; verify KEA circular)',
    placements: {
      medianPackage: '₹8.5 – ₹10.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹10.0 – ₹11.5 LPA (Demo reference — verify official BMSCE Placement Cell)',
      highestPackage: 'Not reliably reported — verify official BMSCE annual placement summary',
      placementSummary:
        'Broad recruitment across Bengaluru’s software, semiconductor, consulting, and core engineering companies.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Bengaluru Campus in Basavanagudi',
      'Central Library & Digital Knowledge Centre',
      'Platinum Jubilee Academic Block & Research Labs',
      'Auditoriums & Innovation Centre',
      'Indoor Sports Complex & Gymnasium',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Student Messes & Campus Cafeterias',
      'Medical Health Unit',
      'Technical, Robotics & Cultural Clubs (Utsav, Phase Shift)',
      'Placement & Training Centre',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_msrit_bengaluru: {
    ownership: 'Government Aided',
    ownershipDetails: 'Private Aided Autonomous Engineering College (GEF Trust, Affiliated to VTU)',
    logoMonogram: 'MSRIT',
    logoAccent: '#0E7490',
    address: 'MSR Nagar, MSRIT Post, Mathikere, Bengaluru, Karnataka 560054',
    nearestTransit: 'Sandal Soap Factory / Yeshwanthpur Metro (~2.5 km) · Yeshwanthpur Jn (~2 km)',
    contactEmail: 'admn@msrit.edu (verify on official portal)',
    contactPhone: '+91-80-23600822 (general office — verify current admissions desk)',
    description:
      'M.S. Ramaiah Institute of Technology (Ramaiah Institute of Technology), founded in 1962 in North Bengaluru, is a leading autonomous aided engineering college participating in KEA KCET. It sits within the integrated Ramaiah Knowledge City campus with strong multidisciplinary labs and nearby hospital facilities.',
    nirfRanking: 'NIRF Engineering Top-80 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Architecture Participant', 'Top-Tier KEA KCET Autonomous Institute'],
    accreditation: 'NAAC A+ Accredited · UGC Autonomous · NBA Accredited Programmes (verify cycle)',
    coursesOffered: ['B.E. (4 Years)', 'B.Arch (5 Years)', 'M.Tech / MBA / MCA / Ph.D.'],
    entranceExams: ['KCET (KEA Karnataka Quota)', 'COMEDK UGET (Separate Non-KCET Quota)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% Karnataka reserved) + KCET Engineering Rank through KEA allotment.',
    estimatedTotalFee: '₹4.5L – ₹6.0L total 4-year B.E. estimate via KCET Govt. Quota (Demo reference — hostel extra; verify KEA circular)',
    placements: {
      medianPackage: '₹8.0 – ₹9.5 LPA (Demo NIRF-style reference)',
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official MSRIT Placement Cell report',
      placementSummary:
        'Consistent hiring across software engineering, cloud/data platforms, electronics, and core firms in Bengaluru.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Integrated Ramaiah Knowledge Campus (Mathikere)',
      'Central Library & E-Journal Facility',
      'Centre for Imaging Technologies & Core Labs',
      'ESB & Apex Auditoriums',
      'Sports Grounds & Fitness Centre',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels',
      'Student Mess & Multi-Cuisine Food Courts',
      'Adjacent Ramaiah Memorial Hospital Access',
      'Coding, Formula Student & Cultural Clubs (Udbhav)',
      'Department of Placement & Training',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  inst_pesu_bengaluru: {
    ownership: 'Private',
    ownershipDetails: 'Private State University (PES University Act, Govt. of Karnataka — KEA KCET Govt. Quota Participant)',
    logoMonogram: 'PESU',
    logoAccent: '#1D4ED8',
    address: '100 Feet Ring Road, Banashankari Stage III, Dwaraka Nagar, Bengaluru, Karnataka 560085',
    nearestTransit: 'Banashankari Metro Station (~3.5 km) · KSR Bengaluru City Jn (~9 km)',
    contactEmail: 'admissions@pes.edu (verify on official portal)',
    contactPhone: '+91-80-26721983 (general office — verify current admissions desk)',
    description:
      'PES University (Ring Road Campus), tracing its engineering origins to 1972 and established as a Private State University in 2013, allocates 40% of its Karnataka government-quota B.Tech seats through KEA KCET. Known for modern computing infrastructure and industry-aligned curricula in Bengaluru.',
    nirfRanking: 'NIRF Engineering 101–150 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Private State University Participating in KEA KCET'],
    accreditation: 'UGC Recognized Private State University · NAAC Accredited (verify cycle on pes.edu)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch / B.Des / BBA', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['KCET (KEA Karnataka Government Quota)', 'JEE Main / University Admission Channel (Separate)'],
    eligibilitySummary:
      'Class 12 (PCM) with 45% (40% reserved) + KCET Engineering Rank for KEA Government Quota seats.',
    estimatedTotalFee: '₹4.5L – ₹6.0L via KCET Govt. Quota (vs higher private university quota — Demo reference; verify KEA & PESU circulars)',
    placements: {
      medianPackage: '₹9.0 – ₹11.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹12.0 – ₹14.5 LPA (Demo reference — CSE focus; verify official report)',
      highestPackage: 'Not reliably reported — verify official PESU Placement Cell report',
      placementSummary:
        'High-volume recruiting from Bengaluru product tech, fintech, AI startups, and multinational R&D centres.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Modern Urban Tech Campus on 100 Feet Ring Road',
      'Centre for Cloud Computing, AI & Autonomous Systems Labs',
      'Digital Library & Collaborative Study Floors',
      'MRD Auditorium & Smart Classrooms',
      'PESU Venture Labs Incubator & Sports Facilities',
    ],
    studentFacilities: [
      'On-Campus Boys Hostels & Partner Girls Hostels',
      'Multi-Outlet Campus Food Courts & Mess',
      'On-Campus Medical Support',
      'Hackathon, AI, Robotics & Cultural Clubs (Aatmatrisha)',
      'Dedicated Placement & Career Services Cell',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  // JEE Advanced — Indian Institutes of Technology (IITs)
  inst_iit_bombay: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITB',
    logoAccent: '#0B1F3A',
    address: 'Main Gate Road, IIT Area, Powai, Mumbai, Maharashtra 400076',
    nearestTransit: 'Kanjurmarg / Vikhroli Railway Station (~3.5 km) · Chhatrapati Shivaji Maharaj International Airport (~10 km)',
    contactEmail: 'jeeadv@iitb.ac.in (verify on official portal)',
    contactPhone: '+91-22-25722545 (general office — verify current admissions desk)',
    description:
      'Established in 1958 beside Powai Lake in Mumbai, IIT Bombay is one of India’s premier engineering and research universities. Its residential campus houses interdisciplinary centres in computing, semiconductors, aerospace, energy, and design alongside India’s flagship student-led innovation ecosystem.',
    nirfRanking: 'NIRF Engineering Top-3 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['QS World University Rankings — Top Indian Engineering Institution', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.S. (4 Years)', 'Dual Degree B.Tech + M.Tech (5 Years)', 'B.Des / M.Tech / Ph.D.'],
    entranceExams: ['JEE Advanced (for B.Tech / B.S. / Dual Degree)', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Qualify JEE Main & JEE Advanced with a valid All-India CRL/Category rank + Class 12 (PCM) 75% aggregate (65% SC/ST/PwD) or Top 20 percentile per JoSAA IIT Business Rules.',
    estimatedTotalFee: '₹10.0L – ₹12.0L total 4-year B.Tech estimate incl. hostel (Demo reference — SC/ST/PwD & income-based tuition waivers apply)',
    placements: {
      medianPackage: '₹19.0 – ₹22.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹22.5 – ₹25.5 LPA (Demo reference — verify official Placement Cell report)',
      highestPackage: 'Not reliably reported — varies across domestic/international offers; verify official PT Cell report',
      placementSummary:
        'Global recruitment across quantitative trading, software engineering, semiconductor R&D, consulting, and core engineering sectors.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '550-Acre Residential Campus beside Powai Lake',
      'Central Library & 24x7 Digital Reading Halls',
      'SINE Technology Business Incubator & Maker Space',
      'National Centre for Aerospace, Nanoelectronics & High-Performance Computing Labs',
      'Convocation Hall, Victor Menezes Convention Centre & Lecture Hall Complex',
      'Olympic-Size Swimming Pool, Indoor Badminton & Athletics Stadium',
    ],
    studentFacilities: [
      '18+ Residential Hostels for Boys & Girls',
      'Hostel Dining Messes, Student Cafeterias & Campus Market',
      '24x7 IIT Bombay Hospital & Emergency Medical Care',
      'Technical, Coding & Cultural Bodies (Techfest, Mood Indigo, E-Cell)',
      'Placement & Training Cell',
      'Merit-cum-Means & Institute Free Messing Scholarship Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_HERO,
  },
  inst_iit_delhi: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITD',
    logoAccent: '#991B1B',
    address: 'Hauz Khas, New Delhi, Delhi 110016',
    nearestTransit: 'IIT Delhi Metro Station (Magenta Line, ~0.5 km) · Indira Gandhi International Airport (~12 km)',
    contactEmail: 'admissions@iitd.ac.in (verify on official portal)',
    contactPhone: '+91-11-26597135 (general office — verify current admissions desk)',
    description:
      'Founded in 1961 in South Delhi’s Hauz Khas, IIT Delhi is a globally recognized public research university and Institute of National Importance. Known for deep strengths in Computer Science, Mathematics & Computing, Electrical Engineering, and deep-tech entrepreneurship, it admits undergraduate students strictly via JEE Advanced All-India merit.',
    nirfRanking: 'NIRF Engineering Top-3 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Overall Top-5 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'Dual Degree B.Tech + M.Tech (5 Years)', 'B.Des / M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Qualify JEE Advanced with valid CRL/Category rank + Class 12 board eligibility (75% or Top 20 percentile; 65% SC/ST/PwD) under JoSAA All-India quota.',
    estimatedTotalFee: '₹10.0L – ₹12.0L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee schedule)',
    placements: {
      medianPackage: '₹19.0 – ₹21.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹22.0 – ₹25.0 LPA (Demo reference — verify official OCS annual report)',
      highestPackage: 'Not reliably reported — verify official Office of Career Services (OCS) disclosure',
      placementSummary:
        'Strong placement diversity across AI/software engineering, quant finance, management consulting, core electrical/semiconductor, and public research.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '320-Acre Green Campus in Hauz Khas with Direct Metro Access',
      'Central Library & Research Commons',
      'FITT Innovation Park, Supercomputing & Semiconductor Research Labs',
      'Dogra Hall, Lecture Hall Complex & Seminar Auditorium',
      'Mittal Sports Complex, Cricket Ground & Swimming Pool',
    ],
    studentFacilities: [
      '13+ On-Campus Residential Hostels for Boys & Girls',
      'Centralized Hostel Messes & 24x7 Student Cafeterias',
      'IIT Delhi Hospital & Wellness Counselling Centre',
      'Student Technical & Entrepreneurship Societies (Tryst, Rendezvous, eDC)',
      'Office of Career Services (OCS)',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_iit_madras: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITM',
    logoAccent: '#7C2D12',
    address: 'IIT P.O., Sardar Patel Road, Guindy, Chennai, Tamil Nadu 600036',
    nearestTransit: 'Chennai Central Railway Station (~14 km) · Chennai International Airport (~13 km)',
    contactEmail: 'jee@iitm.ac.in (verify on official portal)',
    contactPhone: '+91-44-22578280 (general office — verify current admissions desk)',
    description:
      'Established in 1959 with technical assistance from Germany, IIT Madras occupies a forested 617-acre campus adjoining Guindy National Park in Chennai. It leads India in NIRF rankings, industrial R&D via the IIT Madras Research Park, and multidisciplinary engineering innovation.',
    nirfRanking: 'NIRF Engineering #1 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Overall #1 & Innovation Leader', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'Dual Degree B.Tech + M.Tech (5 Years)', 'B.S. Medical Sciences / Data Science / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 (PCM) 75% aggregate (65% SC/ST/PwD) or Top 20 percentile per JoSAA IIT Business Rules.',
    estimatedTotalFee: '₹9.8L – ₹11.8L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹18.5 – ₹21.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹21.5 – ₹24.5 LPA (Demo reference — verify official Placement Office report)',
      highestPackage: 'Not reliably reported — verify official IITM Placement & Internship Office report',
      placementSummary:
        'Premier campus hiring across semiconductor/VLSI, AI/software, aerospace, automotive R&D, and deep-tech startups incubated at IITM Research Park.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '617-Acre Forested Residential Campus & Heritage Wildlife Reserve',
      'Central Library & Electronic Knowledge Centre',
      'IIT Madras Research Park & Centre for Innovation (CFI)',
      'Sudha & Shankar Innovation Hub, Aerospace & Hyperloop Labs',
      'Student Activity Centre (SAC), Olympic Pool & Sports Stadium',
    ],
    studentFacilities: [
      '20+ On-Campus Residential Hostels for Boys & Girls',
      'Multi-Cuisine Student Messes & Campus Food Courts',
      '24x7 IIT Madras Institute Hospital',
      'Student Technical & Cultural Festivals (Shaastra, Saarang, CFI Clubs)',
      'Central Placement & Internship Office',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_iit_kanpur: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITK',
    logoAccent: '#1E3A8A',
    address: 'Kalyanpur, Kanpur, Uttar Pradesh 208016',
    nearestTransit: 'IIT Kanpur Metro Station (~0.3 km) · Kanpur Central (~15 km) · Lucknow Airport (~88 km)',
    contactEmail: 'jee@iitk.ac.in (verify on official portal)',
    contactPhone: '+91-512-2590151 (general office — verify current admissions desk)',
    description:
      'Founded in 1959 on a sprawling 1,055-acre self-contained campus, IIT Kanpur pioneered undergraduate computer science education in India and offers one of the most flexible academic curricula with double majors, minors, and interdisciplinary research tracks.',
    nirfRanking: 'NIRF Engineering Top-5 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Overall Top-6 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.S. (4 Years)', 'B.Tech–M.Tech Dual Degree (5 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 board criteria (75% aggregate or Top 20 percentile; 65% SC/ST/PwD) per JoSAA rules.',
    estimatedTotalFee: '₹9.8L – ₹11.8L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee schedule)',
    placements: {
      medianPackage: '₹18.5 – ₹21.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹21.5 – ₹24.5 LPA (Demo reference — verify official SPO report)',
      highestPackage: 'Not reliably reported — verify official Students’ Placement Office (SPO) report',
      placementSummary:
        'Strong global and domestic hiring in algorithms/systems engineering, quantitative finance, aerospace, and semiconductor R&D.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '1,055-Acre Self-Contained Residential Campus with Private Flight Lab & Airstrip',
      'P.K. Kelkar Central Library',
      'SIIC Startup Incubator, Supercomputing & Wind Tunnel Facilities',
      'Lecture Hall Complex & Main Auditorium',
      'Olympic Swimming Pool, Indoor Stadium & Athletic Complex',
    ],
    studentFacilities: [
      '14+ Halls of Residence for Boys & Girls',
      'Hall Dining Messes & Campus Cafeterias',
      '24x7 Campus Health Centre',
      'Technical, Robotics, Aero & Cultural Societies (Techkriti, Antaragni)',
      'Students’ Placement Office (SPO)',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_HERO,
  },
  inst_iit_kharagpur: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITKGP',
    logoAccent: '#0F4C5C',
    address: 'IIT Kharagpur Campus, Kharagpur, Paschim Medinipur, West Bengal 721302',
    nearestTransit: 'Kharagpur Junction Railway Station (~5 km) · Netaji Subhas Chandra Bose International Airport, Kolkata (~130 km)',
    contactEmail: 'jee@hijli.iitkgp.ac.in (verify on official portal)',
    contactPhone: '+91-3222-255221 (general office — verify current admissions desk)',
    description:
      'Established in 1951 as India’s first Indian Institute of Technology, IIT Kharagpur spans 2,100 acres and houses the widest spectrum of engineering, architecture, law, and management departments in the IIT ecosystem.',
    nirfRanking: 'NIRF Engineering Top-6 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Overall Top-7 & Architecture Top-5 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch (5 Years)', 'B.S. (4 Years)', 'Dual Degree (5 Years)', 'M.Tech / MBA / LLB / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 board eligibility (75% or Top 20 percentile; 65% SC/ST/PwD) under JoSAA All-India quota.',
    estimatedTotalFee: '₹9.5L – ₹11.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹17.5 – ₹20.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹20.0 – ₹22.5 LPA (Demo reference — verify official CDC report)',
      highestPackage: 'Not reliably reported — verify official Career Development Centre (CDC) report',
      placementSummary:
        'Large graduating cohort with wide recruiter participation across software, finance, core manufacturing, energy, and consulting.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '2,100-Acre Historic Residential Township Campus',
      'Central Library (One of Asia’s Largest Technical Libraries)',
      'Science & Technology Entrepreneurs’ Park (STEP) & Supercomputing Centre',
      'Netaji Auditorium, Vikramshila & Nalanda Lecture Complexes',
      'Tata Steel Sports Complex, Swimming Pool & Stadiums',
    ],
    studentFacilities: [
      '22+ Residential Halls of Residence for Boys & Girls',
      'Hall Messes, Tech Market & Campus Shopping Amenities',
      'B.C. Roy Technology Hospital on Campus',
      'Technology Students’ Gymkhana (Kshitij, Spring Fest, Robotics & Coding Clubs)',
      'Career Development Centre (CDC)',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_iit_roorkee: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITR',
    logoAccent: '#1D4ED8',
    address: 'Roorkee – Haridwar Highway, Roorkee, Uttarakhand 247667',
    nearestTransit: 'Roorkee Railway Station (~3 km) · Jolly Grant Airport, Dehradun (~68 km)',
    contactEmail: 'jee@iitr.ac.in (verify on official portal)',
    contactPhone: '+91-1332-285311 (general office — verify current admissions desk)',
    description:
      'Tracing its origin to 1847 as Thomason College of Civil Engineering and converted into the 7th IIT in 2001, IIT Roorkee blends Asia’s oldest technical university heritage with modern excellence in Computer Science, Data Science, Electronics, Civil, and Mechanical Engineering.',
    nirfRanking: 'NIRF Engineering Top-7 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Architecture #1 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch (5 Years)', 'B.S.–M.S. Integrated (5 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 (PCM) 75% aggregate (65% SC/ST/PwD) or Top 20 percentile per JoSAA IIT Business Rules.',
    estimatedTotalFee: '₹9.8L – ₹11.8L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹17.0 – ₹19.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹19.5 – ₹22.0 LPA (Demo reference — verify official PIC annual report)',
      highestPackage: 'Not reliably reported — verify official Placement & Internship Cell (PIC) disclosure',
      placementSummary:
        'Strong software development, open-source engineering, analytics, and core civil/structural/electrical campus recruitment.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '365-Acre Heritage Campus with Iconic James Thomason Building',
      'Mahatma Gandhi Central Library',
      'TIDES Business Incubator & Earthquake Engineering / Computing Labs',
      'Convocation Hall & Lecture Hall Complex',
      'Olympic Swimming Pool, Rowing / Sports Grounds & Gymnasium',
    ],
    studentFacilities: [
      'On-Campus Bhawans (Hostels) for Boys & Girls',
      'Bhawan Messes & Campus Cafeterias',
      'Institute Hospital & 24x7 Medical Care',
      'Active Software & Technical Groups (IMG, SDSLabs, Cognizance, Thomso)',
      'Placement & Internship Cell (PIC)',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_iit_guwahati: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITG',
    logoAccent: '#0F766E',
    address: 'Amingaon, North Guwahati, Guwahati, Assam 781039',
    nearestTransit: 'Kamakhya Junction (~14 km) · Guwahati Railway Station (~18 km) · Lokpriya Gopinath Bordoloi Airport (~22 km)',
    contactEmail: 'jee@iitg.ac.in (verify on official portal)',
    contactPhone: '+91-361-2583000 (general office — verify current admissions desk)',
    description:
      'Established in 1994 on the northern bank of the Brahmaputra River across 704 scenic acres, IIT Guwahati is celebrated for its lakeside architecture, strong Computer Science, Mathematics & Computing, Electronics, and Design programmes, and fully residential student life.',
    nirfRanking: 'NIRF Engineering Top-8 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Overall Top-10 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Des (4 Years)', 'M.Tech / M.Sc / MBA / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 (PCM) 75% aggregate (65% SC/ST/PwD) or Top 20 percentile under JoSAA All-India quota.',
    estimatedTotalFee: '₹9.8L – ₹11.8L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹16.5 – ₹19.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹19.0 – ₹21.5 LPA (Demo reference — verify official CCD report)',
      highestPackage: 'Not reliably reported — verify official Centre for Career Development (CCD) report',
      placementSummary:
        'Consistent recruitment from global tech, quant, fintech, core electronics, and PSU employers.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '704-Acre Scenic Lakeside Residential Campus',
      'Lakshminath Bezbaroa Central Library',
      'Centre for Nanotechnology, AI & Supercomputing Labs',
      'Dr. Bhupen Hazarika Auditorium & Lecture Hall Complex',
      'Indoor Sports Complex, Athletics Track & Olympic Pool',
    ],
    studentFacilities: [
      'Single-Room Residential Hostels for Boys & Girls',
      'Hostel Dining Halls & Khokha / Campus Food Courts',
      '24x7 Campus Hospital & Ambulance Service',
      'Student Technical & Cultural Festivals (Techniche, Alcheringa)',
      'Centre for Career Development (CCD)',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_iit_hyderabad: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITH',
    logoAccent: '#4338CA',
    address: 'Kandi, Sangareddy District, Hyderabad, Telangana 502284',
    nearestTransit: 'Lingampally Railway Station (~30 km) · Rajiv Gandhi International Airport, Hyderabad (~65 km)',
    contactEmail: 'acad@iith.ac.in (verify on official portal)',
    contactPhone: '+91-40-23016033 (general office — verify current admissions desk)',
    description:
      'Founded in 2008 with Japanese academic collaboration, IIT Hyderabad is the fastest-rising second-generation IIT, featuring fractal academics, India’s first dedicated B.Tech in Artificial Intelligence, modern architecture, and deep links to Hyderabad’s semiconductor and tech corridor.',
    nirfRanking: 'NIRF Engineering Top-10 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Innovation Top-5 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Des (4 Years)', 'M.Tech / M.Sc / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 board eligibility (75% aggregate or Top 20 percentile; 65% SC/ST/PwD) per JoSAA rules.',
    estimatedTotalFee: '₹10.0L – ₹12.0L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹17.0 – ₹19.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹19.5 – ₹22.5 LPA (Demo reference — verify official OCS report)',
      highestPackage: 'Not reliably reported — verify official IITH Office of Career Services disclosure',
      placementSummary:
        'High-growth hiring across AI/ML, software engineering, Japanese & domestic semiconductor/R&D companies, and deep-tech startups.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '576-Acre Modern Campus with Indo-Japanese Architectural Blocks',
      'Technology Innovation Park (TiHAN Autonomous Navigation Testbed)',
      'Central Library & 24x7 Computing Wing',
      'i-TIC Startup Incubator & Semiconductor/AI Labs',
      'Sports Complex, Fitness Facilities & Auditorium',
    ],
    studentFacilities: [
      'Modern Single-Occupancy Radiant-Cooled Hostels for Boys & Girls',
      'Central Dining Halls & Campus Cafeterias',
      '24x7 Campus Clinic & Emergency Care',
      'Student Technical & Cultural Societies (Elan & ηVision, Lambda)',
      'Office of Career Services (OCS)',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  inst_iit_bhu_varanasi: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITBHU',
    logoAccent: '#9A3412',
    address: 'Banaras Hindu University Campus, Varanasi, Uttar Pradesh 221005',
    nearestTransit: 'Varanasi Junction (~10 km) · Lal Bahadur Shastri International Airport (~32 km)',
    contactEmail: 'academic@iitbhu.ac.in (verify on official portal)',
    contactPhone: '+91-542-2368106 (general office — verify current admissions desk)',
    description:
      'Originating in 1919 as Banaras Engineering College and designated an IIT in 2012, IIT (BHU) Varanasi sits within the iconic 1,300-acre BHU campus. It combines a century-old engineering alumni network with strong placements across Computer Science, Electronics, Electrical, and Core Engineering.',
    nirfRanking: 'NIRF Engineering Top-15 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Century-Old Engineering Legacy (Est. 1919)', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Arch (5 Years)', 'IDD 5-Year Dual Degree', 'M.Tech / M.Pharm / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 board criteria (75% or Top 20 percentile; 65% SC/ST/PwD) per JoSAA IIT Business Rules.',
    estimatedTotalFee: '₹9.5L – ₹11.5L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹16.0 – ₹18.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹18.5 – ₹21.5 LPA (Demo reference — verify official TPC annual report)',
      highestPackage: 'Not reliably reported — verify official Training & Placement Cell disclosure',
      placementSummary:
        'Strong recruiting footprint across product software, fintech, consulting, and core metallurgy/mining/mechanical enterprises.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Heritage Green Campus inside Banaras Hindu University',
      'Shreenivas Deshpande Library & Digital Resource Wing',
      'I-DAPT Hub & Interdisciplinary Engineering Labs',
      'Swatantrata Bhawan & Lecture Hall Complexes',
      'Gymkhana Sports Grounds, Athletics Track & Swimming Pool',
    ],
    studentFacilities: [
      'On-Campus Hostels for Boys & Girls',
      'Hostel Messes & Lanka / Campus Canteens',
      'Access to Sir Sunderlal Hospital (BHU Medical Complex)',
      'Technical, Coding & Cultural Clubs (Technex, Kashiyatra, COPS)',
      'Training & Placement Cell (TPC)',
    ],
    galleryVariant: 'heritage',
    primaryImg: IMG_HERITAGE,
  },
  inst_iit_indore: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITI',
    logoAccent: '#1E40AF',
    address: 'Khandwa Road, Simrol, Indore, Madhya Pradesh 453552',
    nearestTransit: 'Indore Junction (~25 km) · Devi Ahilya Bai Holkar Airport (~30 km)',
    contactEmail: 'academic@iiti.ac.in (verify on official portal)',
    contactPhone: '+91-731-6603555 (general office — verify current admissions desk)',
    description:
      'Established in 2009 on a 501-acre permanent campus at Simrol, IIT Indore is renowned for its competitive programming culture, high research citations per faculty, and modern engineering laboratories across CSE, EE, ME, and Civil disciplines.',
    nirfRanking: 'NIRF Engineering Top-20 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Strong Times Higher Education / Research Citation Metrics', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'M.Tech / M.Sc / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 (PCM) 75% aggregate (65% SC/ST/PwD) or Top 20 percentile under JoSAA All-India quota.',
    estimatedTotalFee: '₹10.0L – ₹12.0L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹15.5 – ₹18.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹18.0 – ₹21.0 LPA (Demo reference — verify official T&P report)',
      highestPackage: 'Not reliably reported — verify official IIT Indore Training & Placement disclosure',
      placementSummary:
        'Recognized for ICPC-level programming talent and consistent hiring from global software, electronics, and core firms.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '501-Acre Modern Permanent Campus at Simrol',
      'Learning Resource Centre (Central Library)',
      'Sophisticated Instrumentation Centre (SIC) & AI/Computing Labs',
      'Auditorium & Smart Lecture Complexes',
      'Sports Complex, Swimming Pool & Athletics Ground',
    ],
    studentFacilities: [
      'Apartment-Style Residential Hostels for Boys & Girls',
      'Central Dining Hall & Campus Cafeterias',
      'Campus Health Centre & Emergency Medical Support',
      'Coding, Astronomy & Robotics Clubs (Fluxus, ProgClub)',
      'Training & Placement Office',
    ],
    galleryVariant: 'iiit',
    primaryImg: IMG_IIIT,
  },
  inst_iit_jodhpur: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITJ',
    logoAccent: '#B45309',
    address: 'NH 62, Nagaur Road, Karwar, Jodhpur, Rajasthan 342030',
    nearestTransit: 'Jodhpur Junction (~24 km) · Jodhpur Airport (~26 km)',
    contactEmail: 'office_academics@iitj.ac.in (verify on official portal)',
    contactPhone: '+91-291-2801135 (general office — verify current admissions desk)',
    description:
      'Established in 2008 on an 852-acre smart campus in Karwar, IIT Jodhpur offers forward-looking programmes in Computer Science, AI & Data Science, Electrical, Mechanical, and Civil & Infrastructure Engineering with a strong interdisciplinary curriculum.',
    nirfRanking: 'NIRF Engineering Top-35 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.S. (4 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 (PCM) 75% aggregate (65% SC/ST/PwD) or Top 20 percentile under JoSAA All-India quota.',
    estimatedTotalFee: '₹10.0L – ₹12.0L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹14.0 – ₹16.5 LPA (Demo NIRF-style reference)',
      averagePackage: '₹16.5 – ₹19.0 LPA (Demo reference — verify official CDC report)',
      highestPackage: 'Not reliably reported — verify official IIT Jodhpur Career Development Cell disclosure',
      placementSummary:
        'Growing industry footprint across AI/software engineering, fintech, core engineering, and research organizations.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '852-Acre Smart Sustainable Campus with Air-Conditioned Academic Berm',
      'Central Library & Digital Research Hub',
      'School of AI & Data Science + Technology Innovation Hub (iHub Drishti)',
      'Lecture Hall Complex & Seminar Theatres',
      'Sports Complex, Indoor Courts & Outdoor Grounds',
    ],
    studentFacilities: [
      'Single-Occupancy AC Residential Hostels for Boys & Girls',
      'Central Dining Halls & Campus Cafeterias',
      'On-Campus Primary Health Centre',
      'Student Technical & Cultural Societies (Prometeo, Ignus)',
      'Career Development Cell (CDC)',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_NIT,
  },
  inst_iit_mandi: {
    ownership: 'Government',
    ownershipDetails: 'Central Government — Institute of National Importance under Institutes of Technology Act',
    logoMonogram: 'IITMD',
    logoAccent: '#0E7490',
    address: 'Kamand Valley, VPO Kamand, Mandi, Himachal Pradesh 175075',
    nearestTransit: 'Mandi Bus Stand (~18 km) · Bhuntar Kullu Airport (~65 km) · Chandigarh (~200 km)',
    contactEmail: 'academics@iitmandi.ac.in (verify on official portal)',
    contactPhone: '+91-1905-267000 (general office — verify current admissions desk)',
    description:
      'Located in the scenic Himalayan valley of Kamand along the Uhl River, IIT Mandi (established 2009) emphasizes project-based design-and-practicum learning, semiconductor/computing research, and strong interdisciplinary tracks in CSE, Data Science, Electrical, Mechanical, and Civil Engineering.',
    nirfRanking: 'NIRF Engineering Top-35 Band (Demo reference — verify latest year on nirfindia.org)',
    otherRankings: ['NIRF Innovation Top-10 Band', 'Institute of National Importance (MoE, Govt. of India)'],
    accreditation: 'Institute of National Importance (Institutes of Technology Act, Parliament of India)',
    coursesOffered: ['B.Tech (4 Years)', 'B.Tech–M.Tech Integrated (5 Years)', 'M.Tech / MBA / Ph.D.'],
    entranceExams: ['JEE Advanced', 'JoSAA Seat Allocation (IITs — All India Quota)'],
    eligibilitySummary:
      'Valid JEE Advanced rank + Class 12 (PCM) 75% aggregate (65% SC/ST/PwD) or Top 20 percentile under JoSAA All-India quota.',
    estimatedTotalFee: '₹9.8L – ₹11.8L total 4-year B.Tech estimate incl. hostel (Demo reference — verify official fee circular)',
    placements: {
      medianPackage: '₹14.5 – ₹17.0 LPA (Demo NIRF-style reference)',
      averagePackage: '₹17.0 – ₹20.0 LPA (Demo reference — verify official CnP Cell report)',
      highestPackage: 'Not reliably reported — verify official Career & Placement Cell report',
      placementSummary:
        'Strong recruiting across software engineering, data science, embedded/semiconductor design, and technology startups.',
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      '538-Acre Himalayan Valley Campus (North & South Campuses)',
      'Central Library & Quiet Study Commons',
      'IIT Mandi Catalyst Startup Incubator & iHub HCI Research Centre',
      'Modern Engineering & Practicum Design Labs',
      'Indoor Sports Complex, Swimming Pool & Outdoor Grounds',
    ],
    studentFacilities: [
      'On-Campus Residential Hostels for Boys & Girls',
      'Student Dining Messes & Campus Cafeterias',
      '24x7 Campus Medical Unit & Ambulance',
      'Technical, Robotics, Trekking & Cultural Clubs (Xpecto, Exodia)',
      'Career & Placement (CnP) Cell',
    ],
    galleryVariant: 'nit',
    primaryImg: IMG_HERO,
  },
};

export const INSTITUTION_PROFILE_MAP: Record<string, InstitutionProfileEnrichment> =
  Object.fromEntries(
    Object.entries(RAW_PROFILES).map(([id, spec]) => [
      id,
      {
        ownership: spec.ownership,
        ownershipDetails: spec.ownershipDetails,
        logoMonogram: spec.logoMonogram,
        logoAccent: spec.logoAccent,
        address: spec.address,
        nearestTransit: spec.nearestTransit,
        contactEmail: spec.contactEmail,
        contactPhone: spec.contactPhone,
        description: spec.description,
        nirfRanking: spec.nirfRanking,
        otherRankings: spec.otherRankings,
        accreditation: spec.accreditation,
        coursesOffered: spec.coursesOffered,
        entranceExams: spec.entranceExams,
        eligibilitySummary: spec.eligibilitySummary,
        estimatedTotalFee: spec.estimatedTotalFee,
        placements: spec.placements,
        campusFacilities: spec.campusFacilities,
        studentFacilities: spec.studentFacilities,
        galleryImages: buildGallery(spec.primaryImg, spec.logoMonogram, spec.galleryVariant),
      },
    ])
  );

function extractDomainHost(websiteUrl: string): string {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./i, '');
  } catch {
    return 'institute.ac.in';
  }
}

function buildCentralInstitutionProfile(
  entry: CentralInstitutionEntry
): InstitutionProfileEnrichment {
  const host = extractDomainHost(entry.websiteUrl);
  const branchNames = entry.branches
    .map((c) => PROG_CATALOG[c]?.name)
    .filter((n): n is string => Boolean(n));
  const topBranchesText = branchNames.slice(0, 5).join(', ');
  const moreCount = Math.max(0, branchNames.length - 5);

  const hasBTech = entry.branches.some((c) => PROG_CATALOG[c]?.degree === 'B.Tech');
  const hasBArch = entry.branches.includes('BARCH');
  const hasBPlan = entry.branches.includes('BPLAN');
  const hasBS = entry.branches.some((c) => PROG_CATALOG[c]?.degree === 'B.S.');
  const hasBDes = entry.branches.includes('BDES');

  const coursesOffered: string[] = [];
  if (hasBTech) coursesOffered.push('B.Tech (4 Years)');
  if (hasBS) coursesOffered.push('B.S. (4 Years)');
  if (hasBArch) coursesOffered.push('B.Arch (5 Years)');
  if (hasBPlan) coursesOffered.push('B.Plan (4 Years)');
  if (hasBDes) coursesOffered.push('B.Des (4 Years)');
  coursesOffered.push('M.Tech / M.Sc / Ph.D. (verify official academic portal)');

  const isIit = entry.type === 'IIT';
  const isNit = entry.type === 'NIT';
  const isIiit = entry.type === 'IIIT';

  const entranceExams: string[] = isIit
    ? ['JEE Advanced', 'JoSAA All-India Seat Allocation']
    : ['JEE Main (Paper 1)', 'JoSAA / CSAB Seat Allocation'];
  if (hasBArch || hasBPlan) {
    entranceExams.push(isIit ? 'Architecture Aptitude Test (AAT)' : 'JEE Main Paper 2A / 2B (B.Arch / B.Plan)');
  }

  const quotaText =
    entry.quotaMode === 'AI'
      ? 'exclusively under the All-India (AI) quota'
      : entry.quotaMode === 'GO_OS'
        ? 'under Goa State (GO) and Other State (OS) quotas'
        : entry.quotaMode === 'JK_HS_OS'
          ? 'under Home State / J&K (HS/JK) and Other State (OS) quotas'
          : `under Home State (${entry.state}) and Other State (OS) quotas`;

  const accreditation = isIit
    ? 'Institute of National Importance (Institutes of Technology Act, Parliament of India)'
    : isNit
      ? 'Institute of National Importance (NITSER Act, Parliament of India)'
      : isIiit
        ? entry.ownership === 'Public-Private (PPP)'
          ? 'Institute of National Importance (IIIT PPP Act, Parliament of India)'
          : 'Institute of National Importance (IIIT Act, Parliament of India)'
        : 'Statutory Central / State Public Technical University · UGC / AICTE Recognized (verify official accreditation cycle)';

  const primaryImg = isIit ? IMG_HERO : isIiit ? IMG_IIIT : isNit ? IMG_NIT : IMG_HERITAGE;
  const galleryVariant: 'nit' | 'iiit' | 'heritage' = isIiit ? 'iiit' : isNit || isIit ? 'nit' : 'heritage';

  return {
    ownership: entry.ownership,
    ownershipDetails: entry.ownershipDetails,
    logoMonogram: entry.logoMonogram,
    logoAccent: entry.logoAccent,
    address: entry.address,
    nearestTransit: entry.nearestTransit,
    contactEmail: `admissions@${host} (verify on official portal)`,
    contactPhone: `Verify current admissions helpline on ${host}`,
    description: `${entry.name} (${entry.shortName}), established in ${entry.establishedYear} in ${entry.city}, ${entry.state}, is a participating ${entry.type} in ${isIit ? 'JEE Advanced (JoSAA)' : 'JoSAA and CSAB'} undergraduate admissions. Seats are allocated ${quotaText} across ${branchNames.length} website-verified undergraduate programme${branchNames.length === 1 ? '' : 's'} including ${topBranchesText}${moreCount > 0 ? `, and ${moreCount} more department${moreCount === 1 ? '' : 's'}` : ''}.`,
    nirfRanking: entry.nirfRanking,
    otherRankings: [
      isIit || isNit || isIiit
        ? 'Institute of National Importance (MoE, Govt. of India)'
        : 'Participating GFTI under JoSAA / CSAB Central Counselling',
      `Official Departments Portal: ${host}`,
    ],
    accreditation,
    coursesOffered,
    entranceExams,
    eligibilitySummary: isIit
      ? 'Class 12 (PCM) with 75% aggregate (65% SC/ST) or Top 20 percentile + valid JEE Advanced rank under JoSAA All-India (AI) quota.'
      : `Class 12 (PCM) with JoSAA/CSAB eligibility criteria + valid JEE Main rank allocated ${quotaText}.`,
    estimatedTotalFee: entry.estimatedTotalFee,
    placements: {
      medianPackage: entry.medianPackage,
      averagePackage: 'Not reliably reported — refer to official NIRF median salary',
      highestPackage: 'Not reliably reported — verify official Training & Placement disclosure',
      placementSummary: `${entry.shortName} conducts centralised campus recruitment through its Training & Placement / Career Development Cell across software, core engineering, analytics, and public-sector recruiters. Always verify branch-wise placement disclosures on ${host}.`,
      sourceNote: DEMO_PLACEMENT_SOURCE,
      isDemo: true,
    },
    campusFacilities: [
      'Central Library & Digital E-Journal Reading Halls',
      'Departmental Engineering & Computing Laboratories',
      'Campus-Wide High-Speed Optical Fiber & Wi-Fi Network',
      'Smart Lecture Hall Complex, Seminar Rooms & Auditorium',
      'Outdoor Sports Grounds, Indoor Gymnasium & Innovation Cell',
    ],
    studentFacilities: [
      'On-Campus Boys & Girls Hostels (verify current allotment rules)',
      'Student Dining Messes & Campus Cafeterias',
      'Campus Medical Care Unit & Emergency Support',
      'Technical, Coding, Robotics & Cultural Student Societies',
      'Dedicated Training & Placement / Career Development Cell',
    ],
    galleryImages: buildGallery(primaryImg, entry.logoMonogram, galleryVariant),
  };
}

export function enrichInstitutionWithProfile(inst: Institution): Institution {
  const manualExtra = INSTITUTION_PROFILE_MAP[inst.id];
  const centralEntry = CENTRAL_INSTITUTION_MAP[inst.id];
  const extra =
    manualExtra ?? (centralEntry ? buildCentralInstitutionProfile(centralEntry) : undefined);

  if (!extra) {
    return {
      ...inst,
      ownership: inst.ownership ?? (inst.type === 'NIT' || inst.type === 'IIIT' || inst.type === 'IIT' ? 'Government' : 'Private'),
      logoMonogram: inst.logoMonogram ?? inst.shortName.replace(/[^A-Z0-9]/gi, '').slice(0, 5).toUpperCase(),
      logoAccent: inst.logoAccent ?? '#0B1F3A',
    };
  }
  return {
    ...extra,
    ...inst,
    // Ensure non-empty enrichment fills in when older Firestore docs omitted these fields
    ownership: inst.ownership ?? extra.ownership,
    ownershipDetails: inst.ownershipDetails ?? extra.ownershipDetails,
    logoMonogram: inst.logoMonogram ?? extra.logoMonogram,
    logoAccent: inst.logoAccent ?? extra.logoAccent,
    address: inst.address ?? extra.address,
    nearestTransit: inst.nearestTransit ?? extra.nearestTransit,
    contactEmail: inst.contactEmail ?? extra.contactEmail,
    contactPhone: inst.contactPhone ?? extra.contactPhone,
    description: inst.description ?? extra.description,
    nirfRanking: inst.nirfRanking ?? extra.nirfRanking,
    otherRankings: inst.otherRankings && inst.otherRankings.length > 0 ? inst.otherRankings : extra.otherRankings,
    accreditation: inst.accreditation ?? extra.accreditation,
    coursesOffered: inst.coursesOffered && inst.coursesOffered.length > 0 ? inst.coursesOffered : extra.coursesOffered,
    entranceExams: inst.entranceExams && inst.entranceExams.length > 0 ? inst.entranceExams : extra.entranceExams,
    eligibilitySummary: inst.eligibilitySummary ?? extra.eligibilitySummary,
    estimatedTotalFee: inst.estimatedTotalFee ?? extra.estimatedTotalFee,
    placements: inst.placements ?? extra.placements,
    campusFacilities: inst.campusFacilities && inst.campusFacilities.length > 0 ? inst.campusFacilities : extra.campusFacilities,
    studentFacilities: inst.studentFacilities && inst.studentFacilities.length > 0 ? inst.studentFacilities : extra.studentFacilities,
    galleryImages: inst.galleryImages && inst.galleryImages.length > 0 ? inst.galleryImages : extra.galleryImages,
  };
}
