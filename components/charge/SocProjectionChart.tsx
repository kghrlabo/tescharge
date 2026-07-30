"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";
import { toSocProjectionRows } from "@/lib/charts/derive";
import { formatTime } from "@/lib/format";

const CAPTION: Record<"fitted" | "anchor", string> = {
  fitted: "点線はここまでの実績ペースから推定した予測終了時刻までの概算です",
  anchor: "点線は概算の予測です（データが増えると実績ペースに合わせて調整されます）",
};

export function SocProjectionChart({
  logPoints,
  minutesToFull,
  precon,
  fastChargerPresent,
  live = true,
}: {
  logPoints: LogPointDraft[];
  minutesToFull: number;
  precon: boolean;
  fastChargerPresent: boolean;
  /** False for a finished, historical session — hides the "現在" (now) marker,
   * which only makes sense while a charge is actually in progress. */
  live?: boolean;
}) {
  const { rows: data, method } = toSocProjectionRows(logPoints, minutesToFull, {
    precon,
    fastChargerPresent,
  });
  const latest = logPoints[logPoints.length - 1];
  const hasForecast = method !== "none";

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-ink-faint">
        データがありません
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-hairline" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => formatTime(v)}
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
          />
          <YAxis
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            width={36}
          />
          <Tooltip
            labelFormatter={(v) => formatTime(Number(v))}
            formatter={(value, name) => [
              `${Number(value).toFixed(0)}%`,
              name === "soc" ? "実績" : "予測",
            ]}
            contentStyle={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <ReferenceLine
            y={80}
            stroke="var(--color-warn)"
            strokeDasharray="4 4"
            label={{ value: "80%", position: "right", fontSize: 11, fill: "var(--color-warn)" }}
          />
          <ReferenceLine
            y={90}
            stroke="var(--color-ink-faint)"
            strokeDasharray="4 4"
            label={{ value: "90%", position: "right", fontSize: 11, fill: "var(--color-ink-faint)" }}
          />
          {live && latest && (
            <ReferenceLine x={latest.timestamp} stroke="var(--color-accent-text)" strokeDasharray="2 3" />
          )}
          <Line
            type="monotone"
            dataKey="soc"
            name="soc"
            stroke="var(--color-glow)"
            strokeWidth={5}
            strokeLinecap="round"
            dot={false}
            isAnimationActive={false}
          />
          {hasForecast && (
            <Line
              type="monotone"
              dataKey="projectedSoc"
              name="projectedSoc"
              stroke="var(--color-glow-text)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {hasForecast && (
        <p className="mt-1 text-center text-[11px] text-ink-faint">
          {CAPTION[method as "fitted" | "anchor"]}
        </p>
      )}
    </div>
  );
}
