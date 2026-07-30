const MILES_TO_KM = 1.609344;

/** Tesla's API always reports odometer in miles regardless of the car's display unit. */
export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM;
}

export function formatKwh(kwh: number): string {
  return `${kwh.toFixed(1)} kWh`;
}

export function formatKw(kw: number): string {
  return `${kw.toFixed(1)} kW`;
}

export function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h <= 0) return `${m}分`;
  return `${h}時間${m}分`;
}

export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
