import { StatsRingPanel } from "@/components/charge/StatsRingPanel";
import { SessionMetaPanel } from "./SessionMetaPanel";
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
 * Owns the ring + the collapsible detail zone (SessionMetaPanel — start time,
 * location, precon, and the live speed/energy/ETA figures) for both the
 * "waiting for cable" and "charging" states of the live measuring screen —
 * pass `latest: null` while there's no telemetry yet so the two states
 * render inside the same shell instead of two screens.
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
      latest={latest}
    />
  );

  if (!latest) {
    return (
      <StatsRingPanel soc={startPayload.soc} startSoc={startPayload.soc} ringSubLabel="ケーブル接続待ち">
        {detail}
      </StatsRingPanel>
    );
  }

  const isComplete = latest.chargingState === "Complete";
  const isCharging = latest.chargingState === "Charging";

  return (
    <StatsRingPanel
      soc={latest.soc}
      startSoc={startPayload.soc}
      charging={isCharging}
      complete={isComplete}
      ringSubLabel={RING_STATE_LABEL[latest.chargingState] ?? "充電中"}
    >
      {detail}
    </StatsRingPanel>
  );
}
