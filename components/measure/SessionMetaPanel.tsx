"use client";

import { milesToKm, formatDateTime, formatTime } from "@/lib/format";
import { LocationSelectField } from "./LocationSelectField";
import type { ChargeStatusPayload } from "@/lib/tesla/types";
import type { LocationOverride, LogPointDraft } from "@/lib/polling/chargeStateMachine";

export function SessionMetaPanel({
  startPayload,
  locationOverride,
  onLocationChange,
  preconditioned,
  latest,
  chargeLimitSoc,
}: {
  startPayload: ChargeStatusPayload;
  locationOverride: LocationOverride | null;
  onLocationChange: (value: LocationOverride | null) => void;
  /** null while still undetermined (auto-detected from battery_heater_on — see detectPreconditioned). */
  preconditioned: boolean | null;
  /** null while still waiting for the cable — the speed/energy/ETA rows show "-". */
  latest: LogPointDraft | null;
  /** percent — the vehicle's own charge-limit setting, read-only (may change on the car itself mid-charge; kept in sync via polling). */
  chargeLimitSoc: number;
}) {
  const etaMs =
    latest && latest.minutesToFull > 0 ? latest.timestamp + latest.minutesToFull * 60_000 : null;

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-hairline pt-4 text-sm">
      <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">詳細情報</p>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">推定終了</span>
          <span className="font-medium text-ink">{etaMs ? formatTime(etaMs) : "-"}</span>
        </div>
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">充電速度</span>
          <span className="font-medium text-ink">
            {latest ? `${latest.chargerPowerKw.toFixed(1)} kW` : "-"}
          </span>
        </div>
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">追加電力量</span>
          <span className="font-medium text-ink">
            {latest ? `${latest.energyAddedKwh.toFixed(1)} kWh` : "-"}
          </span>
        </div>
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">開始時刻</span>
          <span className="font-medium text-ink">{formatDateTime(startPayload.timestamp)}</span>
        </div>
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">走行距離</span>
          <span className="font-medium text-ink">
            {Math.round(milesToKm(startPayload.odometerMiles))} km
          </span>
        </div>
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">外気温（開始）</span>
          <span className="font-medium text-ink">
            {startPayload.outsideTempC != null ? `${startPayload.outsideTempC}℃` : "-"}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">プレコンディショニング</span>
          <span className="font-medium text-ink">
            {preconditioned === null ? "判定中..." : preconditioned ? "あり" : "なし"}
          </span>
        </div>
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">充電上限</span>
          <span className="font-medium text-ink">{chargeLimitSoc}%</span>
        </div>
      </div>

      <LocationSelectField value={locationOverride} onChange={onLocationChange} />
    </div>
  );
}
