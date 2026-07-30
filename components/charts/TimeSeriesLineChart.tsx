"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SeriesConfig {
  dataKey: string;
  label: string;
  color: string;
}

export function TimeSeriesLineChart({
  data,
  xKey,
  xLabel,
  series,
  height = 280,
}: {
  data: Array<Record<string, number>>;
  xKey: string;
  xLabel: string;
  series: SeriesConfig[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-ink-faint" style={{ height }}>
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-hairline" />
        <XAxis
          dataKey={xKey}
          type="number"
          label={{
            value: xLabel,
            position: "insideBottomRight",
            offset: -4,
            fontSize: 12,
            fill: "var(--color-ink-faint)",
          }}
          tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} width={36} />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--color-ink-dim)" }}
        />
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.label}
            stroke={s.color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
