import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RoundMovementPoint, YoYChangePoint } from '../types/domain.ts';

interface YoYChartProps {
  points: YoYChangePoint[];
  studentRank?: number | null;
  rankTypeLabel?: string;
}

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  boxShadow: '0 8px 24px rgba(11, 31, 58, 0.08)',
  backgroundColor: '#FFFFFF',
  fontSize: 12,
  padding: '8px 12px',
};

export const YoYCutoffChart: React.FC<YoYChartProps> = ({
  points,
  studentRank,
  rankTypeLabel = 'Rank',
}) => {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-6 text-center text-xs text-slate-600">
        Insufficient stored multi-year records for this exact filter combination.
      </div>
    );
  }

  const hasDemo = points.some((p) => p.isDemo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Opening &amp; Closing Ranks Across Years ({rankTypeLabel})</span>
        <span className={hasDemo ? 'text-amber-700 font-medium' : 'text-teal-700 font-medium'}>
          {hasDemo ? 'Demo data — not an official cutoff' : 'Verified stored records'}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="gradClosingBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradOpeningTeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#0D9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="academicYear"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(v: number) => v.toLocaleString('en-IN')}
            />
            <Tooltip
              formatter={(value: unknown, name: unknown) => [
                Number(value).toLocaleString('en-IN'),
                String(name),
              ]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              labelStyle={{ fontWeight: 600, color: '#0B1F3A', marginBottom: 4 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area
              type="monotone"
              dataKey="openingRank"
              name="Opening Rank"
              stroke="#0D9488"
              strokeWidth={2}
              fill="url(#gradOpeningTeal)"
              dot={{ r: 3.5, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="closingRank"
              name="Closing Rank"
              stroke="#1D4ED8"
              strokeWidth={2.25}
              fill="url(#gradClosingBlue)"
              dot={{ r: 4, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            {studentRank != null && studentRank > 0 && (
              <ReferenceLine
                y={studentRank}
                stroke="#DC2626"
                strokeDasharray="4 4"
                strokeWidth={1.75}
                label={{
                  value: `My Rank: ${studentRank.toLocaleString('en-IN')}`,
                  position: 'insideTopRight',
                  fill: '#DC2626',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Plain-number YoY table */}
      <div className="overflow-x-auto border-t border-slate-100 pt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] text-slate-500">
              <th className="py-2 pr-4 font-semibold">Year</th>
              <th className="py-2 pr-4 font-semibold text-right">Opening</th>
              <th className="py-2 pr-4 font-semibold text-right">Closing</th>
              <th className="py-2 pr-4 font-semibold text-right">YoY Closing Shift</th>
              <th className="py-2 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums font-mono">
            {points.map((pt) => (
              <tr key={pt.academicYear} className="hover:bg-slate-50/70">
                <td className="py-2 pr-4 font-sans font-semibold text-[#0B1F3A]">{pt.academicYear}</td>
                <td className="py-2 pr-4 text-right text-slate-600">{pt.openingRank.toLocaleString('en-IN')}</td>
                <td className="py-2 pr-4 text-right font-semibold text-[#0B1F3A]">
                  {pt.closingRank.toLocaleString('en-IN')}
                </td>
                <td className="py-2 pr-4 text-right">
                  {pt.yoyPercentChange == null ? (
                    <span className="text-slate-400 font-sans">Baseline</span>
                  ) : (
                    <span className={pt.yoyPercentChange >= 0 ? 'text-teal-700' : 'text-amber-700'}>
                      {pt.yoyPercentChange >= 0 ? '+' : ''}
                      {pt.yoyPercentChange}% ({pt.yoyRankDiff! >= 0 ? '+' : ''}
                      {pt.yoyRankDiff!.toLocaleString('en-IN')})
                    </span>
                  )}
                </td>
                <td className="py-2 font-sans text-slate-500">
                  {pt.sourceName}
                  {pt.isDemo ? ' · Demo data' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface RoundChartProps {
  points: RoundMovementPoint[];
  studentRank?: number | null;
  academicYear: number;
}

export const RoundMovementChart: React.FC<RoundChartProps> = ({
  points,
  studentRank,
  academicYear,
}) => {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-6 text-center text-xs text-slate-600">
        No multi-round records stored for {academicYear} with this selection.
      </div>
    );
  }

  const hasDemo = points.some((p) => p.isDemo);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Round-Wise Rank Movement ({academicYear})</span>
        <span className={hasDemo ? 'text-amber-700 font-medium' : 'text-teal-700 font-medium'}>
          {hasDemo ? 'Demo data — not an official cutoff' : 'Verified stored records'}
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="gradRoundClosing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B1F3A" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#0B1F3A" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradRoundOpening" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#0D9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="roundLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(v: number) => v.toLocaleString('en-IN')}
            />
            <Tooltip
              formatter={(value: unknown, name: unknown) => [
                Number(value).toLocaleString('en-IN'),
                String(name),
              ]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              labelStyle={{ fontWeight: 600, color: '#0B1F3A', marginBottom: 4 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area
              type="monotone"
              dataKey="openingRank"
              name="Opening Rank"
              stroke="#0D9488"
              strokeWidth={2}
              fill="url(#gradRoundOpening)"
              dot={{ r: 3.5, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="closingRank"
              name="Closing Rank"
              stroke="#0B1F3A"
              strokeWidth={2.25}
              fill="url(#gradRoundClosing)"
              dot={{ r: 4, fill: '#0B1F3A', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: '#0B1F3A', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            {studentRank != null && studentRank > 0 && (
              <ReferenceLine
                y={studentRank}
                stroke="#DC2626"
                strokeDasharray="4 4"
                strokeWidth={1.75}
                label={{
                  value: `My Rank: ${studentRank.toLocaleString('en-IN')}`,
                  position: 'insideTopRight',
                  fill: '#DC2626',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
