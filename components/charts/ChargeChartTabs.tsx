"use client";

import { useState } from "react";
import { TimeSeriesLineChart } from "./TimeSeriesLineChart";
import { PowerVsSocChart } from "./PowerVsSocChart";
import { ChargingSpeedDerivativeChart } from "./ChargingSpeedDerivativeChart";
import { toChartRows } from "@/lib/charts/derive";
import { METRIC_COLORS } from "./chartConfig";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";

type TabId = "power" | "soc" | "current" | "voltage" | "kwh" | "eta" | "dsoc";

const TABS: { id: TabId; label: string }[] = [
  { id: "soc", label: "SOC推移" },
  { id: "power", label: "充電速度" },
  { id: "current", label: "電流" },
  { id: "voltage", label: "電圧" },
  { id: "kwh", label: "累積充電量" },
  { id: "eta", label: "推定残り時間" },
  { id: "dsoc", label: "SOC増加速度" },
];

/**
 * Shared by the live measuring screen and historical Session Detail — same 7 chart
 * views, just fed a different logPoints source (in-progress state vs IndexedDB).
 */
export function ChargeChartTabs({
  logPoints,
  defaultTab = "power",
}: {
  logPoints: LogPointDraft[];
  defaultTab?: TabId;
}) {
  const [tab, setTab] = useState<TabId>(defaultTab);
  const chartRows = toChartRows(logPoints);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "power" && <PowerVsSocChart logPoints={logPoints} />}
      {tab === "soc" && (
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "soc", label: "SOC(%)", color: METRIC_COLORS.soc }]}
        />
      )}
      {tab === "current" && (
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "current", label: "電流(A)", color: METRIC_COLORS.current }]}
        />
      )}
      {tab === "voltage" && (
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "voltage", label: "電圧(V)", color: METRIC_COLORS.voltage }]}
        />
      )}
      {tab === "kwh" && (
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[{ dataKey: "kwh", label: "累積充電量(kWh)", color: METRIC_COLORS.kwh }]}
        />
      )}
      {tab === "eta" && (
        <TimeSeriesLineChart
          data={chartRows}
          xKey="elapsedMinutes"
          xLabel="経過時間(分)"
          series={[
            { dataKey: "minutesToFull", label: "推定残り時間(分)", color: METRIC_COLORS.minutesToFull },
          ]}
        />
      )}
      {tab === "dsoc" && <ChargingSpeedDerivativeChart logPoints={logPoints} />}
    </div>
  );
}
