import { StatsRingPanel } from "@/components/charge/StatsRingPanel";
import { PortStatusBadge } from "@/components/charge/PortStatusBadge";
import { SessionMetaPanel } from "./SessionMetaPanel";
import { formatDurationMinutes, formatTime } from "@/lib/format";
import type { LogPointDraft, LocationOverride } from "@/lib/polling/chargeStateMachine";
import type { ChargeStatusPayload } from "@/lib/tesla/types";

const RING_STATE_LABEL: Record<string, string> = {
  Starting: "開始中",
  Charging: "充電中",
  Complete: "満充電",
  Stopped: "一時停止",
  NoPower: "待機中",
  Disconnected: "未接続",
};

/**
 * Owns the ring/tiles + the collapsible detail zone (SessionMetaPanel, with
 * precon folded in) for both the "waiting for cable" and "charging" states of
 * the live measuring screen — pass `latest: null` while there's no telemetry
 * yet so the two states render inside the same shell instead of two screens.
 */
export function LiveStatsPanel({
  latest,
  startPayload,
  precon,
  onPreconChange,
  locationOverride,
  onLocationChange,
}: {
  latest: LogPointDraft | null;
  startPayload: ChargeStatusPayload;
  precon: boolean;
  onPreconChange: (value: boolean) => void;
  locationOverride: LocationOverride | null;
  onLocationChange: (value: LocationOverride | null) => void;
}) {
  const detail = (
    <SessionMetaPanel
      startPayload={startPayload}
      locationOverride={locationOverride}
      onLocationChange={onLocationChange}
      precon={precon}
      onPreconChange={onPreconChange}
    />
  );

  if (!latest) {
    return (
      <StatsRingPanel
        soc={startPayload.soc}
        startSoc={startPayload.soc}
        ringSubLabel="ケーブル接続待ち"
        tiles={[
          { value: "-", label: "推定終了" },
          { value: "-", label: "充電速度 kW" },
          { value: "-", label: "追加電力量 kWh" },
        ]}
      >
        {detail}
      </StatsRingPanel>
    );
  }

  const elapsedMinutes = latest.elapsedSeconds / 60;
  // Based on the poll's own timestamp, not the render time, so this stays pure.
  const etaMs = latest.minutesToFull > 0 ? latest.timestamp + latest.minutesToFull * 60_000 : null;
  const isComplete = latest.chargingState === "Complete";
  const isCharging = latest.chargingState === "Charging";

  return (
    <StatsRingPanel
      soc={latest.soc}
      startSoc={startPayload.soc}
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
      {detail}
    </StatsRingPanel>
  );
}
