"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Charger } from "@/lib/db/models";
import type { ChargerInput } from "@/lib/db/repositories/ChargerRepository";

const inputClass =
  "min-h-11 rounded-chip border border-hairline bg-surface-raised px-2 py-1.5 text-sm text-ink";

export function ChargerMasterList({
  chargers,
  onCreate,
  onDelete,
}: {
  chargers: Charger[];
  onCreate: (input: ChargerInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [type, setType] = useState<"AC" | "DC">("AC");
  const [maxKw, setMaxKw] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("この端末では位置情報を取得できません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoError(null);
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => setGeoError("位置情報の取得に失敗しました")
    );
  };

  const handleAdd = async () => {
    if (!name || !lat || !lng || !maxKw) return;
    await onCreate({
      name,
      lat: Number(lat),
      lng: Number(lng),
      type,
      maxKw: Number(maxKw),
      brand: null,
      notes: null,
    });
    setName("");
    setLat("");
    setLng("");
    setMaxKw("");
  };

  return (
    <div className="flex flex-col gap-3">
      {chargers.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-chip border border-hairline p-2 text-sm"
        >
          <div>
            <p className="font-medium text-ink">{c.name}</p>
            <p className="text-xs text-ink-faint">
              {c.type} / 最大{c.maxKw}kW
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(c.id)}
            className="text-xs text-danger hover:underline"
          >
            削除
          </button>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 rounded-chip border border-dashed border-hairline p-3">
        <input
          placeholder="名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`col-span-2 ${inputClass}`}
        />
        <input
          placeholder="緯度"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="経度"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          className={inputClass}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "AC" | "DC")}
          className={inputClass}
        >
          <option value="AC">AC</option>
          <option value="DC">DC</option>
        </select>
        <input
          placeholder="最大kW"
          value={maxKw}
          onChange={(e) => setMaxKw(e.target.value)}
          className={inputClass}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={useCurrentLocation}
          className="col-span-2"
        >
          現在地を使用
        </Button>
        {geoError && <p className="col-span-2 text-xs text-danger">{geoError}</p>}
        <Button type="button" variant="secondary" onClick={handleAdd} className="col-span-2">
          追加
        </Button>
      </div>
    </div>
  );
}
