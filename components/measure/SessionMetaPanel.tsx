"use client";

import { useEffect, useState } from "react";
import { chargerRepository, settingsRepository } from "@/lib/db/repositories";
import { classifyLocation } from "@/lib/location/classify";
import { milesToKm, formatDateTime, formatTime } from "@/lib/format";
import { SnowflakeIcon } from "@/components/ui/icons";
import type { Charger } from "@/lib/db/models";
import type { ChargeStatusPayload } from "@/lib/tesla/types";
import type { LocationOverride, LogPointDraft } from "@/lib/polling/chargeStateMachine";

const LOCATION_LABEL: Record<string, string> = { home: "自宅", other: "その他" };

function locationOverrideToSelectValue(override: LocationOverride | null): string {
  if (!override) return "auto";
  if (override.type === "home") return "home";
  if (override.type === "other") return "other";
  if (override.chargerId) return `charger:${override.chargerId}`;
  return "charger-manual";
}

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
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [autoLocationLabel, setAutoLocationLabel] = useState("判定中...");
  const [manualName, setManualName] = useState(locationOverride?.chargerNameManual ?? "");

  useEffect(() => {
    chargerRepository.list().then(setChargers);
  }, []);

  useEffect(() => {
    settingsRepository.getSettings().then((settings) => {
      const auto = classifyLocation(startPayload.latitude, startPayload.longitude, settings, chargers);
      if (auto.locationType === "home") setAutoLocationLabel("自宅");
      else if (auto.locationType === "charger") setAutoLocationLabel(auto.chargerName ?? "充電器");
      else setAutoLocationLabel("その他");
    });
  }, [startPayload.latitude, startPayload.longitude, chargers]);

  const selectValue = locationOverrideToSelectValue(locationOverride);

  const handleLocationSelect = (value: string) => {
    if (value === "auto") {
      onLocationChange(null);
    } else if (value === "home") {
      onLocationChange({ type: "home", chargerId: null, chargerNameManual: null });
    } else if (value === "other") {
      onLocationChange({ type: "other", chargerId: null, chargerNameManual: null });
    } else if (value === "charger-manual") {
      onLocationChange({ type: "charger", chargerId: null, chargerNameManual: manualName });
    } else if (value.startsWith("charger:")) {
      onLocationChange({ type: "charger", chargerId: value.slice("charger:".length), chargerNameManual: null });
    }
  };

  const inputClass =
    "min-h-11 rounded-chip border border-hairline bg-surface-raised px-3 py-1.5 text-sm text-ink";

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
          <span className="flex items-center gap-1.5 text-ink-dim">
            <SnowflakeIcon className="h-3.5 w-3.5" />
            プレコンディショニング
          </span>
          <span className="font-medium text-ink">
            {preconditioned === null ? "判定中..." : preconditioned ? "あり" : "なし"}
          </span>
        </div>
        <div className="flex justify-between border-b border-hairline pb-2">
          <span className="text-ink-dim">充電上限</span>
          <span className="font-medium text-ink">{chargeLimitSoc}%</span>
        </div>
      </div>

      <div>
        <p className="mb-1 text-ink-dim">場所 / 充電器名（自動判定: {autoLocationLabel}）</p>
        <select value={selectValue} onChange={(e) => handleLocationSelect(e.target.value)} className={inputClass}>
          <option value="auto">自動判定（{autoLocationLabel}）</option>
          <option value="home">{LOCATION_LABEL.home}</option>
          {chargers.map((c) => (
            <option key={c.id} value={`charger:${c.id}`}>
              {c.name}
            </option>
          ))}
          <option value="charger-manual">充電器名を入力...</option>
          <option value="other">{LOCATION_LABEL.other}</option>
        </select>
        {selectValue === "charger-manual" && (
          <input
            type="text"
            placeholder="充電器名"
            value={manualName}
            onChange={(e) => {
              setManualName(e.target.value);
              onLocationChange({ type: "charger", chargerId: null, chargerNameManual: e.target.value });
            }}
            className={`mt-2 w-full ${inputClass}`}
          />
        )}
      </div>
    </div>
  );
}
