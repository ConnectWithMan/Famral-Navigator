import { ChoiceList, CutoffRecord, PredictionMatch, ScheduleItem } from '../types/domain.ts';

function csvEscape(val: string | number | boolean | null | undefined): string {
  const str = val == null ? '' : String(val);
  // Neutralize CSV formula injection (=, +, -, @) on exported text fields
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function triggerFileDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportPredictionMatchesCsv(
  matches: PredictionMatch[],
  meta: {
    systemCode: string;
    academicYear: number;
    roundNumber: number;
    category: string;
    evaluatedRank: number;
    rankType: string;
    includesDemoData: boolean;
  }
) {
  const noticeLine = meta.includesDemoData
    ? '# NOTICE: Demo data — not an official cutoff. Historical comparison only — never a guarantee of admission.'
    : '# NOTICE: Historical comparison only — verify final figures on the official counselling portal.';

  const headers = [
    'Classification',
    'Institute',
    'Institute Type',
    'State',
    'Programme',
    'Branch Group',
    'Quota',
    'Category',
    'Seat Pool',
    'Rank Type',
    'Opening Rank',
    'Closing Rank',
    'Your Evaluated Rank',
    'Academic Year',
    'Round',
    'Data Label',
    'Source',
    'Verified Date',
  ];

  const rows = matches.map((m) => [
    m.classificationLabel,
    m.cutoff.institutionName,
    m.cutoff.institutionType,
    m.cutoff.state,
    m.cutoff.programmeName,
    m.cutoff.branchGroup,
    m.cutoff.quota,
    m.cutoff.seatCategory,
    m.cutoff.seatPool,
    m.cutoff.rankType,
    m.cutoff.openingRank,
    m.cutoff.closingRank,
    m.evaluatedRank,
    m.cutoff.academicYear,
    m.cutoff.roundLabel,
    m.cutoff.isDemo ? 'Demo data — not an official cutoff' : 'Official verified record',
    m.cutoff.sourceName,
    m.cutoff.verifiedAt,
  ]);

  const csv = [
    noticeLine,
    headers.map(csvEscape).join(','),
    ...rows.map((r) => r.map(csvEscape).join(',')),
  ].join('\n');

  triggerFileDownload(
    csv,
    `famral-navigator-predictor-${meta.systemCode}-${meta.academicYear}-r${meta.roundNumber}.csv`,
    'text/csv;charset=utf-8;'
  );
}

export function exportCutoffsCsv(cutoffs: CutoffRecord[], fileName = 'famral-navigator-cutoffs.csv') {
  const hasDemo = cutoffs.some((c) => c.isDemo);
  const noticeLine = hasDemo
    ? '# NOTICE: Includes Demo data — not an official cutoff. Verify official ranks on josaa.nic.in / csab.nic.in.'
    : '# NOTICE: Historical cutoff dataset exported from Famral Navigator.';

  const headers = [
    'System',
    'Academic Year',
    'Round',
    'Institute',
    'Type',
    'State',
    'Programme',
    'Quota',
    'Category',
    'Seat Pool',
    'Rank Type',
    'Opening Rank',
    'Closing Rank',
    'Data Label',
    'Source',
    'Verified Date',
  ];

  const rows = cutoffs.map((c) => [
    c.systemCode.toUpperCase(),
    c.academicYear,
    c.roundLabel,
    c.institutionName,
    c.institutionType,
    c.state,
    c.programmeName,
    c.quota,
    c.seatCategory,
    c.seatPool,
    c.rankType,
    c.openingRank,
    c.closingRank,
    c.isDemo ? 'Demo data — not an official cutoff' : 'Verified record',
    c.sourceName,
    c.verifiedAt,
  ]);

  const csv = [
    noticeLine,
    headers.map(csvEscape).join(','),
    ...rows.map((r) => r.map(csvEscape).join(',')),
  ].join('\n');

  triggerFileDownload(csv, fileName, 'text/csv;charset=utf-8;');
}

export function exportChoiceListCsv(list: ChoiceList) {
  const hasDemo = list.items.some((i) => i.isDemo);
  const lines = [
    '# PLANNING TOOL ONLY: Final choices must be filled and locked on the official counselling portal.',
    hasDemo
      ? '# NOTICE: Demo data — not an official cutoff. Historical ranks shown are illustrative only.'
      : '# NOTICE: Historical closing ranks shown for reference only.',
    [
      'Preference Order',
      'Priority Tag',
      'Institute',
      'Type',
      'State',
      'Programme',
      'Quota',
      'Category',
      'Seat Pool',
      'Rank Type',
      'Historical Closing Rank',
      'Academic Year',
      'Round',
      'Data Label',
      'Notes',
    ]
      .map(csvEscape)
      .join(','),
    ...list.items.map((item, idx) =>
      [
        idx + 1,
        item.tag,
        item.institutionName,
        item.institutionType,
        item.state,
        item.programmeName,
        item.quota,
        item.seatCategory,
        item.seatPool,
        item.rankType,
        item.closingRank ?? 'Not available',
        item.academicYear ?? 'Not available',
        item.roundLabel ?? 'Not available',
        item.isDemo ? 'Demo data — not an official cutoff' : 'Verified record',
        item.notes,
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];

  const slug = list.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'choice-list';
  triggerFileDownload(lines.join('\n'), `famral-navigator-${slug}.csv`, 'text/csv;charset=utf-8;');
}

function formatIcsDate(dateStr: string): string {
  const clean = dateStr.replace(/[^0-9]/g, '');
  return clean.length >= 8 ? clean.slice(0, 8) : '20250615';
}

export function exportSchedulesIcs(schedules: ScheduleItem[], fileName = 'famral-navigator-counselling-dates.ics') {
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const events = schedules.map((s) => {
    const start = formatIcsDate(s.startDate);
    const end = formatIcsDate(s.endDate || s.startDate);
    const demoPrefix = s.isDemo ? '[DEMO DATA] ' : '';
    const desc = `${demoPrefix}${s.description ?? s.title} | Source: ${s.sourceName} | Verified: ${s.verifiedAt}`.replace(
      /\r?\n/g,
      '\\n'
    );
    return [
      'BEGIN:VEVENT',
      `UID:${s.id}@navigator.famral.com`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${demoPrefix}${s.systemCode.toUpperCase()} — ${s.title}`,
      `DESCRIPTION:${desc}`,
      s.sourceUrl ? `URL:${s.sourceUrl}` : '',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Famral Navigator//Counselling Dates//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Famral Navigator Counselling Timeline',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  triggerFileDownload(ics, fileName, 'text/calendar;charset=utf-8;');
}

export function isSafeHttpUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
