"use client";

import { useEffect, useState } from "react";
import { chargerRepository, settingsRepository } from "@/lib/db/repositories";
import { classifyLocation } from "@/lib/location/classify";
import type { Charger } from "@/lib/db/models";
import type { LocationOverride } from "@/lib/polling/chargeStateMachine";

const LOCATION_LABEL: Record<string, string> = { home: "自宅", other: "その他" };

function locationOverrideToSelectValue(override: LocationOverride | null): string {
  if (!override) return "auto";
  if (override.type === "home") return "home";
  if (override.type === "other") return "other";
  if (override.chargerId) return `charger:${override.chargerId}`;
  return "charger-manual";
}

/**
 * Shared by SessionMetaPanel (mid-session, driven by the poll's own lat/lng)
 * and the home screen's pre-start setup (driven by the live SOC poll's
 * lat/lng) — same auto-classify + override UI either way.
 */
export function LocationSelectField({
  latitude,
  longitude,
  value,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  value: LocationOverride | null;
  onChange: (value: LocationOverride | null) => void;
}) {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [autoLocationLabel, setAutoLocationLabel] = useState("判定中...");
  const [manualName, setManualName] = useState(value?.chargerNameManual ?? "");

  useEffect(() => {
    chargerRepository.list().then(setChargers);
  }, []);

  useEffect(() => {
    settingsRepository.getSettings().then((settings) => {
      const auto = classifyLocation(latitude, longitude, settings, chargers);
      if (auto.locationType === "home") setAutoLocationLabel("自宅");
      else if (auto.locationType === "charger") setAutoLocationLabel(auto.chargerName ?? "充電器");
      else setAutoLocationLabel("その他");
    });
  }, [latitude, longitude, chargers]);

  const selectValue = locationOverrideToSelectValue(value);

  const handleLocationSelect = (selected: string) => {
    if (selected === "auto") {
      onChange(null);
    } else if (selected === "home") {
      onChange({ type: "home", chargerId: null, chargerNameManual: null });
    } else if (selected === "other") {
      onChange({ type: "other", chargerId: null, chargerNameManual: null });
    } else if (selected === "charger-manual") {
      onChange({ type: "charger", chargerId: null, chargerNameManual: manualName });
    } else if (selected.startsWith("charger:")) {
      onChange({ type: "charger", chargerId: selected.slice("charger:".length), chargerNameManual: null });
    }
  };

  const inputClass =
    "min-h-11 rounded-chip border border-hairline bg-surface-raised px-3 py-1.5 text-sm text-ink";

  return (
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
            onChange({ type: "charger", chargerId: null, chargerNameManual: e.target.value });
          }}
          className={`mt-2 w-full ${inputClass}`}
        />
      )}
    </div>
  );
}
