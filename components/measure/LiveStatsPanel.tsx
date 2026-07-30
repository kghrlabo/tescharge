import type { ReactNode } from "react";
import { StatsRingPanel } from "@/components/charge/StatsRingPanel";
import { PortStatusBadge } from "@/components/charge/PortStatusBadge";
import { formatDurationMinutes, formatTime } from "@/lib/format";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";

const RING_STATE_LABEL: Record<string, string> = {
  Starting: "開始中",
  Charging: "充電中",
  Complete: "満充電",
  Stopped: "一時停止",
  NoPower: "待機中",
  Disconnected: "未接続",
};

export function LiveStatsPanel({
  latest,
  children,
}: {
  latest: LogPointDraft;
  children?: ReactNode;
}) {
  const elapsedMinutes = latest.elapsedSeconds / 60;
  // Based on the poll's own timestamp, not the render time, so this stays pure.
  const etaMs = latest.minutesToFull > 0 ? latest.timestamp + latest.minutesToFull * 60_000 : null;
  const isComplete = latest.chargingState === "Complete";
  const isCharging = latest.chargingState === "Charging";

  return (
    <StatsRingPanel
      soc={latest.soc}
      charging={isCharging}
      complete={isComplete}
      ringSubLabel={RING_STATE_LABEL[latest.chargingState] ?? "充電中"}
      badge={<PortStatusBadge chargingState={latest.chargingState} />}
      tiles={[
        { value: etaMs ? formatTime(etaMs) : "-", label: "推定終了" },
        { value: latest.chargerPowerKw.toFixed(1), label: "充電速度 kW" },
        { value: latest.energyAddedKwh.toFixed(1), label: "追加電力量 kWh" },
      ]}
      footer={<p className="text-xs text-ink-faint">経過時間 {formatDurationMinutes(elapsedMinutes)}</p>}
    >
      {children}
    </StatsRingPanel>
  );
}
