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
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";
import { toPowerVsSocRows } from "@/lib/charts/derive";
import { METRIC_COLORS } from "./chartConfig";

/**
 * The most important view: charging power (kW) as a function of SOC (%), not time.
 * This is what lets sessions be compared against each other regardless of how long
 * each one took — same component is used for the live measuring screen and for
 * historical Session Detail, just fed a different logPoints source.
 */
export function PowerVsSocChart({
  logPoints,
  height = 280,
}: {
  logPoints: LogPointDraft[];
  height?: number;
}) {
  const data = toPowerVsSocRows(logPoints);

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
          dataKey="soc"
          type="number"
          domain={[0, 100]}
          unit="%"
          tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
        />
        <YAxis unit="kW" tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} width={36} />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--color-ink-dim)" }}
        />
        <Line
          type="monotone"
          dataKey="kw"
          name="充電速度"
          stroke={METRIC_COLORS.kw}
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
