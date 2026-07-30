"use client";

import { TimeSeriesLineChart } from "./TimeSeriesLineChart";
import { PowerVsSocChart } from "./PowerVsSocChart";
import { ChargingSpeedDerivativeChart } from "./ChargingSpeedDerivativeChart";
import { Card } from "@/components/ui/Card";
import { toChartRows } from "@/lib/charts/derive";
import { METRIC_COLORS } from "./chartConfig";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";

const COMPACT_HEIGHT = 140;

/**
 * Secondary metrics as a compact 2-column grid — SOC推移 has its own dedicated
 * forecast chart on the dashboard, so it isn't repeated here. Used on the live
 * measuring screen only; Session Detail (historical) uses ChargeChartTabs instead.
 */
export function ChargeChartsMultiView({ logPoints }: { logPoints: LogPointDraft[] }) {
  const chartRows = toChartRows(logPoints);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">充電速度 (kW vs SOC)</p>
        <PowerVsSocChart logPoints={logPoints} height={COMPACT_HEIGHT} />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">電流</p>
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "current", label: "電流(A)", color: METRIC_COLORS.current }]}
          height={COMPACT_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">電圧</p>
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "voltage", label: "電圧(V)", color: METRIC_COLORS.voltage }]}
          height={COMPACT_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">累積充電量</p>
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "kwh", label: "累積充電量(kWh)", color: METRIC_COLORS.kwh }]}
          height={COMPACT_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">推定残り時間</p>
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[
            { dataKey: "minutesToFull", label: "推定残り時間(分)", color: METRIC_COLORS.minutesToFull },
          ]}
          height={COMPACT_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">SOC増加速度</p>
        <ChargingSpeedDerivativeChart logPoints={logPoints} height={COMPACT_HEIGHT} />
      </Card>
    </div>
  );
}
