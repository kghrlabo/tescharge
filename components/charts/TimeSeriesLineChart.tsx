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
      <div className="flex items-center justify-center text-sm text-zinc-400" style={{ height }}>
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis
          dataKey={xKey}
          type="number"
          label={{ value: xLabel, position: "insideBottomRight", offset: -4, fontSize: 12 }}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
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
