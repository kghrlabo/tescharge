"use client";

import { SocProjectionChart } from "@/components/charge/SocProjectionChart";
import { TimeSeriesLineChart } from "./TimeSeriesLineChart";
import { PowerVsSocChart } from "./PowerVsSocChart";
import { ChargingSpeedDerivativeChart } from "./ChargingSpeedDerivativeChart";
import { Card } from "@/components/ui/Card";
import { toChartRows } from "@/lib/charts/derive";
import { METRIC_COLORS } from "./chartConfig";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";

const TILE_HEIGHT = 160;

/**
 * The full chart set for a session — SOC推移 full-width on top, then the 6
 * secondary metrics in a grid that adds columns as width allows. Shared by the
 * live measuring screen (fed in-progress state) and historical Session Detail
 * (fed IndexedDB logs), so both screens look like the same view.
 */
export function ChargeChartsGrid({
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
  live?: boolean;
}) {
  const chartRows = toChartRows(logPoints);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card padding="p-3" className="sm:col-span-2 xl:col-span-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">SOC推移</p>
        <SocProjectionChart
          logPoints={logPoints}
          minutesToFull={minutesToFull}
          precon={precon}
          fastChargerPresent={fastChargerPresent}
          live={live}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">充電速度 (kW vs SOC)</p>
        <PowerVsSocChart logPoints={logPoints} height={TILE_HEIGHT} />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">電流</p>
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "current", label: "電流(A)", color: METRIC_COLORS.current }]}
          height={TILE_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">電圧</p>
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "voltage", label: "電圧(V)", color: METRIC_COLORS.voltage }]}
          height={TILE_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">累積充電量</p>
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "kwh", label: "累積充電量(kWh)", color: METRIC_COLORS.kwh }]}
          height={TILE_HEIGHT}
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
          height={TILE_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <p className="mb-1 text-xs font-semibold text-ink-dim">SOC増加速度</p>
        <ChargingSpeedDerivativeChart logPoints={logPoints} height={TILE_HEIGHT} />
      </Card>
    </div>
  );
}
