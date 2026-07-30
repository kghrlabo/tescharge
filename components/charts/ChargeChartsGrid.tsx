"use client";

import { SocProjectionChart } from "@/components/charge/SocProjectionChart";
import { TimeSeriesLineChart } from "./TimeSeriesLineChart";
import { PowerVsSocChart } from "./PowerVsSocChart";
import { ChargingSpeedDerivativeChart } from "./ChargingSpeedDerivativeChart";
import { Card } from "@/components/ui/Card";
import { toChartRows, toDSocPerMinuteRows } from "@/lib/charts/derive";
import { METRIC_COLORS } from "./chartConfig";
import { formatTime } from "@/lib/format";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";

const TILE_HEIGHT = 160;

function TileTitle({ title, value }: { title: string; value?: string }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-2">
      <p className="text-xs font-semibold text-ink-dim">{title}</p>
      {value && <p className="text-xs font-semibold tabular-nums text-ink">{value}</p>}
    </div>
  );
}

/**
 * The full chart set for a session — SOC推移 full-width on top, then the 6
 * secondary metrics in a grid that adds columns as width allows. Shared by the
 * live measuring screen (fed in-progress state) and historical Session Detail
 * (fed IndexedDB logs), so both screens look like the same view. On the live
 * screen each secondary tile also shows its latest reading next to the title,
 * since that number used to live in a row under the ring and moved here.
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
  const latest = live ? logPoints[logPoints.length - 1] : undefined;
  const etaMs =
    latest && latest.minutesToFull > 0 ? latest.timestamp + latest.minutesToFull * 60_000 : null;
  const dSocRows = live ? toDSocPerMinuteRows(logPoints) : [];
  const latestDSoc = dSocRows[dSocRows.length - 1]?.dSocPerMin;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Card padding="p-3" className="sm:col-span-2 xl:col-span-3">
        <TileTitle title="SOC推移" value={latest ? `${latest.soc}%` : undefined} />
        <SocProjectionChart
          logPoints={logPoints}
          minutesToFull={minutesToFull}
          precon={precon}
          fastChargerPresent={fastChargerPresent}
          live={live}
        />
      </Card>
      <Card padding="p-3">
        <TileTitle
          title="充電速度 (kW vs SOC)"
          value={latest ? `${latest.chargerPowerKw.toFixed(1)} kW` : undefined}
        />
        <PowerVsSocChart logPoints={logPoints} height={TILE_HEIGHT} />
      </Card>
      <Card padding="p-3">
        <TileTitle title="電流" value={latest ? `${latest.chargerCurrentA.toFixed(0)} A` : undefined} />
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "current", label: "電流(A)", color: METRIC_COLORS.current }]}
          height={TILE_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <TileTitle title="電圧" value={latest ? `${latest.chargerVoltageV.toFixed(0)} V` : undefined} />
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "voltage", label: "電圧(V)", color: METRIC_COLORS.voltage }]}
          height={TILE_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <TileTitle
          title="累積充電量"
          value={latest ? `${latest.energyAddedKwh.toFixed(1)} kWh` : undefined}
        />
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "kwh", label: "累積充電量(kWh)", color: METRIC_COLORS.kwh }]}
          height={TILE_HEIGHT}
        />
      </Card>
      <Card padding="p-3">
        <TileTitle title="推定残り時間" value={etaMs ? formatTime(etaMs) : undefined} />
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
        <TileTitle
          title="SOC増加速度"
          value={latestDSoc != null ? `${latestDSoc.toFixed(2)} %/分` : undefined}
        />
        <ChargingSpeedDerivativeChart logPoints={logPoints} height={TILE_HEIGHT} />
      </Card>
    </div>
  );
}
