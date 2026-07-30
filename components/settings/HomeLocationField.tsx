"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface HomeLocationPatch {
  homeLat?: number | null;
  homeLng?: number | null;
  homeRadiusM?: number;
}

export function HomeLocationField({
  lat,
  lng,
  radiusM,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  radiusM: number;
  onChange: (patch: HomeLocationPatch) => void;
}) {
  const [geoError, setGeoError] = useState<string | null>(null);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("この端末では位置情報を取得できません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoError(null);
        onChange({ homeLat: pos.coords.latitude, homeLng: pos.coords.longitude });
      },
      () => setGeoError("位置情報の取得に失敗しました")
    );
  };

  const inputClass =
    "mt-1 min-h-11 w-full rounded-chip border border-hairline bg-surface-raised px-2 py-1.5 text-sm text-ink";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-ink-faint">
          緯度
          <input
            type="number"
            step="any"
            value={lat ?? ""}
            onChange={(e) =>
              onChange({ homeLat: e.target.value === "" ? null : Number(e.target.value) })
            }
            className={inputClass}
          />
        </label>
        <label className="text-xs text-ink-faint">
          経度
          <input
            type="number"
            step="any"
            value={lng ?? ""}
            onChange={(e) =>
              onChange({ homeLng: e.target.value === "" ? null : Number(e.target.value) })
            }
            className={inputClass}
          />
        </label>
      </div>
      <label className="text-xs text-ink-faint">
        判定半径 (m)
        <input
          type="number"
          value={radiusM}
          onChange={(e) => onChange({ homeRadiusM: Number(e.target.value) })}
          className={inputClass}
        />
      </label>
      <Button type="button" variant="secondary" onClick={useCurrentLocation} className="self-start">
        現在地を使用
      </Button>
      {geoError && <p className="text-xs text-danger">{geoError}</p>}
    </div>
  );
}
