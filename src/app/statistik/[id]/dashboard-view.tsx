"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHANNELS,
  CHART_COLORS,
  STATUS_LABELS,
  roundedDomain,
  sumMonthColumns,
  type LabelValue,
  type StatReportData,
} from "@/lib/stat-report";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col rounded-[10px] border border-[#E2E8F0] bg-white p-2">
      <p className="mb-1 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
        {title}
      </p>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-0.5 truncate text-xl font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}

function PieLegend({
  rows,
  mode,
}: {
  rows: LabelValue[];
  mode: "raw" | "valueIsPercent" | "nameOnly";
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-1 pl-1 text-[10px]">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
          />
          <span className="flex-1 truncate text-[#334155]">{r.label}</span>
          {mode !== "nameOnly" && (
            <span className="font-semibold text-[#0F172A]">
              {mode === "raw" ? r.value : `${r.value}%`}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ValueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value?: number | string; color?: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-[#E2E8F0] bg-white px-2 py-1 text-[11px] shadow-sm">
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="font-medium">
          {p.value}
        </div>
      ))}
    </div>
  );
}

const valueLabelStyle = { fontSize: 10, fill: "#0F172A", fontWeight: 600 };

function renderInsidePercentLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" fontSize={10} fontWeight={600} textAnchor="middle" dominantBaseline="central">
      {Math.round(percent * 100)}%
    </text>
  );
}

function MiniTable({ rows, valueSuffix }: { rows: LabelValue[]; valueSuffix: string }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <div className="h-full overflow-y-auto text-[11px]">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[#64748B]">
            <th className="pb-1 font-medium">Monat</th>
            <th className="pb-1 text-right font-medium">Minuten</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[#F1F5F9]">
              <td className="py-0.5 text-[#334155]">{r.label}</td>
              <td className="py-0.5 text-right text-[#334155]">
                {r.value} {valueSuffix}
              </td>
            </tr>
          ))}
          <tr className="border-t border-[#E2E8F0] font-semibold text-[#0F172A]">
            <td className="py-1">Total</td>
            <td className="py-1 text-right">
              {total} {valueSuffix}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const axisTick = { fontSize: 10, fill: "#64748B" };
const legendStyle = { fontSize: 9, paddingTop: 2 };
const chartMargin = { top: 14, right: 8, left: 6, bottom: 0 };

export function DashboardView({ data }: { data: StatReportData }) {
  const totalCallMinutes = data.callDurationByMonth.reduce((s, r) => s + r.value, 0);
  const hourDomain = roundedDomain(data.requestsByHour.map((r) => r.value));
  const dayDomain = roundedDomain(data.requestsByDay.map((r) => r.value));
  const weekdayDomain = roundedDomain(data.requestsByWeekday.map((r) => r.value));
  const monthStatusDomain = roundedDomain(
    data.requestsByMonth.flatMap((r) => [r.vollstaendig, r.unvollstaendig, r.abgebrochen])
  );
  const monthChannelDomain = roundedDomain(
    data.requestsByChannel.flatMap((r) => [r.telefon, r.chat, r.kontaktseite])
  );
  const topTagsVisible = data.topTags.filter((r) => r.value > 0);
  const channelTotals = sumMonthColumns(data.requestsByChannel, [
    { key: "telefon", label: CHANNELS[0] },
    { key: "chat", label: CHANNELS[1] },
    { key: "kontaktseite", label: CHANNELS[2] },
  ]);

  return (
    <div className="flex h-full w-full flex-col gap-2 bg-white p-[10mm] text-[#0F172A]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="MedFlex" className="size-10 shrink-0 object-contain" />
          <div>
            <p className="text-xl font-bold">{data.title || "Kundenname"}</p>
            <p className="text-sm text-[#64748B]">{data.period || "Zeitraum"}</p>
          </div>
        </div>
        <p className="text-sm font-medium text-[#064b91]">MedFlex Patientenanfragen Dashboard</p>
      </div>

      <div className="flex shrink-0 gap-2">
        <StatTile label="Anrufe" value={data.callCount} />
        <StatTile label="Schriftverkehr" value={data.writtenCount} />
        <StatTile label="Weiterleitungen" value={data.forwardCount} />
        <StatTile label="Ø Anrufdauer" value={data.avgCallDuration || "–"} />
        <StatTile label="Gesamtdauer aller Anrufe" value={`${totalCallMinutes} Min.`} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-2">
        <ChartCard title="Gesamtdauer der Anrufe">
          <MiniTable rows={data.callDurationByMonth} valueSuffix="Min." />
        </ChartCard>

        <ChartCard title="Anfragen nach Status">
          <div className="flex h-full">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="55%"
                  outerRadius="85%"
                  isAnimationActive={false}
                >
                  {data.statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <PieLegend rows={data.statusBreakdown} mode="raw" />
          </div>
        </ChartCard>

        <ChartCard title="Top Tags">
          <div className="flex h-full">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={topTagsVisible}
                  dataKey="value"
                  nameKey="label"
                  outerRadius="85%"
                  isAnimationActive={false}
                  label={renderInsidePercentLabel}
                  labelLine={false}
                >
                  {topTagsVisible.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <PieLegend rows={topTagsVisible} mode="valueIsPercent" />
          </div>
        </ChartCard>

        <ChartCard title="Anfragen nach Kanal pro Monat">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.requestsByChannel} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={axisTick} />
              <YAxis tick={axisTick} width={32} domain={monthChannelDomain} ticks={monthChannelDomain} />
              <Tooltip content={<ValueTooltip />} />
              <Legend wrapperStyle={legendStyle} iconSize={6} height={12} />
              <Line
                name={CHANNELS[0]}
                dataKey="telefon"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[0] }}
                isAnimationActive={false}
              />
              <Line
                name={CHANNELS[1]}
                dataKey="chat"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[2] }}
                isAnimationActive={false}
              />
              <Line
                name={CHANNELS[2]}
                dataKey="kontaktseite"
                stroke={CHART_COLORS[3]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[3] }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Anfragen nach Wochentag">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.requestsByWeekday} margin={chartMargin}>
              <defs>
                <linearGradient id="weekdayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={axisTick} />
              <YAxis tick={axisTick} width={32} domain={weekdayDomain} ticks={weekdayDomain} />
              <Tooltip content={<ValueTooltip />} />
              <Area
                dataKey="value"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                fill="url(#weekdayGradient)"
                dot={{ r: 3, fill: CHART_COLORS[0] }}
                label={{ position: "top", ...valueLabelStyle }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Anfragen nach Status pro Monat">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.requestsByMonth} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={axisTick} />
              <YAxis tick={axisTick} width={32} domain={monthStatusDomain} ticks={monthStatusDomain} />
              <Tooltip content={<ValueTooltip />} />
              <Legend wrapperStyle={legendStyle} iconSize={6} height={12} />
              <Line
                name={STATUS_LABELS[0]}
                dataKey="vollstaendig"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[0] }}
                isAnimationActive={false}
              />
              <Line
                name={STATUS_LABELS[1]}
                dataKey="unvollstaendig"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[2] }}
                isAnimationActive={false}
              />
              <Line
                name={STATUS_LABELS[2]}
                dataKey="abgebrochen"
                stroke={CHART_COLORS[3]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[3] }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Patientenanfragen nach Tageszeit (06–19 Uhr)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.requestsByHour} margin={chartMargin}>
              <defs>
                <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[2]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={axisTick} interval={1} />
              <YAxis tick={axisTick} width={32} domain={hourDomain} ticks={hourDomain} />
              <Tooltip content={<ValueTooltip />} />
              <Area
                dataKey="value"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                fill="url(#hourGradient)"
                dot={{ r: 3, fill: CHART_COLORS[2] }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Anfragen nach Schlagwort">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.requestsByDay}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 4, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={axisTick} domain={dayDomain} ticks={dayDomain} />
              <YAxis type="category" dataKey="label" tick={axisTick} width={78} interval={0} />
              <Tooltip content={<ValueTooltip />} />
              <Bar
                dataKey="value"
                fill={CHART_COLORS[0]}
                radius={[0, 3, 3, 0]}
                isAnimationActive={false}
                label={{ position: "right", ...valueLabelStyle }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Kanal-Anfragen (Anteil)">
          <div className="flex h-full">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={channelTotals}
                  dataKey="value"
                  nameKey="label"
                  outerRadius="85%"
                  isAnimationActive={false}
                  label={renderInsidePercentLabel}
                  labelLine={false}
                >
                  {channelTotals.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <PieLegend rows={channelTotals} mode="nameOnly" />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
