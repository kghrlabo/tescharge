import type { ReactNode } from "react";
import { formatDateTime, formatDurationMinutes, formatKw, formatKwh } from "@/lib/format";
import type { ChargeSession, Charger } from "@/lib/db/models";

const LOCATION_LABEL: Record<string, string> = {
  charger: "充電器",
  other: "未設定",
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between border-b border-hairline pb-2 text-sm">
      <span className="text-ink-dim">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

/**
 * Read-only counterpart to SessionMetaPanel's editable rows — same visual
 * language (label/value rows under a "詳細情報" heading), used inside
 * SessionStatsPanel so live and historical screens look alike.
 */
export function SessionDetailTable({
  session,
  charger,
}: {
  session: ChargeSession;
  charger: Charger | null;
}) {
  const locationLabel =
    session.locationType === "charger"
      ? (charger?.name ?? session.chargerNameManual ?? "充電器")
      : LOCATION_LABEL[session.locationType];

  const rangeValue =
    session.startRangeKm != null && session.endRangeKm != null
      ? `${Math.round(session.startRangeKm)}km → ${Math.round(session.endRangeKm)}km（+${Math.round(session.endRangeKm - session.startRangeKm)}km）`
      : "-";

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-hairline pt-4">
      <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">詳細情報</p>
      <div className="flex flex-col gap-3">
        <Row
          label="充電時間"
          value={session.durationMinutes != null ? formatDurationMinutes(session.durationMinutes) : "-"}
        />
        <Row label="開始時刻" value={formatDateTime(session.startedAt)} />
        <Row label="終了時刻" value={session.endedAt ? formatDateTime(session.endedAt) : "-"} />
        <Row label="メモ" value={session.memo ?? "-"} />
        <Row label="平均充電速度" value={session.avgKw != null ? formatKw(session.avgKw) : "-"} />
        <Row
          label="総充電量"
          value={session.totalKwhAdded != null ? formatKwh(session.totalKwhAdded) : "-"}
        />
        <Row label="場所 / 充電器" value={locationLabel} />
        <Row label="AC/DC" value={session.acOrDc ?? "-"} />
        <Row
          label="プレコン有無"
          value={session.preconditioned === null ? "-" : session.preconditioned ? "あり" : "なし"}
        />
        <Row
          label="充電上限"
          value={session.chargeLimitSoc != null ? `${session.chargeLimitSoc}%` : "-"}
        />
        <Row label="最大充電速度" value={session.maxKw != null ? formatKw(session.maxKw) : "-"} />
        <Row
          label="走行距離"
          value={session.startOdometerKm != null ? `${Math.round(session.startOdometerKm)} km` : "-"}
        />
        <Row label="航続距離" value={rangeValue} />
        <Row
          label="外気温（開始/終了）"
          value={
            session.startOutsideTempC != null
              ? `${session.startOutsideTempC}℃ / ${session.endOutsideTempC ?? "-"}℃`
              : "-"
          }
        />
      </div>
    </div>
  );
}
