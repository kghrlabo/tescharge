"use client";

import { useEffect, useState } from "react";
import { chargerRepository, settingsRepository } from "@/lib/db/repositories";
import { classifyLocation } from "@/lib/location/classify";
import { milesToKm, formatDateTime } from "@/lib/format";
import type { Charger } from "@/lib/db/models";
import type { ChargeStatusPayload } from "@/lib/tesla/types";
import type { LocationOverride } from "@/lib/polling/chargeStateMachine";

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
}: {
  startPayload: ChargeStatusPayload;
  locationOverride: LocationOverride | null;
  onLocationChange: (value: LocationOverride | null) => void;
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

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-hairline pt-4 text-sm">
      <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">詳細情報</p>
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
