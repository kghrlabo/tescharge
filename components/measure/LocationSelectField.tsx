"use client";

import { useEffect, useState } from "react";
import { chargerRepository } from "@/lib/db/repositories";
import type { Charger } from "@/lib/db/models";
import type { LocationOverride } from "@/lib/polling/chargeStateMachine";

function locationOverrideToSelectValue(override: LocationOverride | null): string {
  if (!override) return "unset";
  if (override.chargerId) return `charger:${override.chargerId}`;
  return "charger-manual";
}

/**
 * Shared by SessionMetaPanel (mid-session) and the home screen's pre-start
 * setup. No auto-detection — the user always picks explicitly, or leaves it
 * "未設定". The charger master (settings) doubles as the location master, so
 * "自宅" is just one of its entries.
 */
export function LocationSelectField({
  value,
  onChange,
}: {
  value: LocationOverride | null;
  onChange: (value: LocationOverride | null) => void;
}) {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [manualName, setManualName] = useState(value?.chargerNameManual ?? "");

  useEffect(() => {
    chargerRepository.list().then(setChargers);
  }, []);

  const selectValue = locationOverrideToSelectValue(value);

  const handleLocationSelect = (selected: string) => {
    if (selected === "unset") {
      onChange(null);
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
      <p className="mb-1 text-ink-dim">場所</p>
      <select value={selectValue} onChange={(e) => handleLocationSelect(e.target.value)} className={inputClass}>
        <option value="unset">未設定</option>
        {chargers.map((c) => (
          <option key={c.id} value={`charger:${c.id}`}>
            {c.name}
          </option>
        ))}
        <option value="charger-manual">名称を入力...</option>
      </select>
      {selectValue === "charger-manual" && (
        <input
          type="text"
          placeholder="場所の名称"
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
