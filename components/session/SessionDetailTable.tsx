import type { ReactNode } from "react";
import { formatDateTime, formatKwh, formatKw, formatDurationMinutes } from "@/lib/format";
import type { ChargeSession, Charger } from "@/lib/db/models";

const LOCATION_LABEL: Record<string, string> = {
  home: "自宅",
  charger: "充電器",
  other: "その他",
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-zinc-800">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

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

  return (
    <div>
      <Row label="開始" value={formatDateTime(session.startedAt)} />
      <Row label="終了" value={session.endedAt ? formatDateTime(session.endedAt) : "-"} />
      <Row label="場所" value={locationLabel} />
      <Row label="充電器" value={charger?.name ?? session.chargerNameManual ?? "-"} />
      <Row label="AC/DC" value={session.acOrDc ?? "-"} />
      <Row label="開始SOC" value={`${session.startSoc}%`} />
      <Row label="終了SOC" value={session.endSoc != null ? `${session.endSoc}%` : "-"} />
      <Row
        label="プレコン有無"
        value={session.preconditioned === null ? "-" : session.preconditioned ? "あり" : "なし"}
      />
      <Row label="平均充電速度" value={session.avgKw != null ? formatKw(session.avgKw) : "-"} />
      <Row label="最大充電速度" value={session.maxKw != null ? formatKw(session.maxKw) : "-"} />
      <Row
        label="充電時間"
        value={session.durationMinutes != null ? formatDurationMinutes(session.durationMinutes) : "-"}
      />
      <Row label="総充電量" value={session.totalKwhAdded != null ? formatKwh(session.totalKwhAdded) : "-"} />
      <Row
        label="走行距離"
        value={session.startOdometerKm != null ? `${Math.round(session.startOdometerKm)} km` : "-"}
      />
      <Row
        label="外気温（開始/終了）"
        value={
          session.startOutsideTempC != null
            ? `${session.startOutsideTempC}℃ / ${session.endOutsideTempC ?? "-"}℃`
            : "-"
        }
      />
    </div>
  );
}
