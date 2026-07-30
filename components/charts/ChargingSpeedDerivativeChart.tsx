"use client";

import { TimeSeriesLineChart } from "./TimeSeriesLineChart";
import { toDSocPerMinuteRows } from "@/lib/charts/derive";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";
import { METRIC_COLORS } from "./chartConfig";

export function ChargingSpeedDerivativeChart({
  logPoints,
  height,
}: {
  logPoints: LogPointDraft[];
  height?: number;
}) {
  const data = toDSocPerMinuteRows(logPoints);
  return (
    <TimeSeriesLineChart
      data={data}
      xKey="elapsedMinutes"
      xLabel="経過時間(分)"
      series={[{ dataKey: "dSocPerMin", label: "ΔSOC/分", color: METRIC_COLORS.dSocPerMin }]}
      height={height}
    />
  );
}
