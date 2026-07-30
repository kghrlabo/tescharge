import Link from "next/link";
import { formatDate, formatKwh, formatDurationMinutes } from "@/lib/format";
import type { ChargeSession } from "@/lib/db/models";

const LOCATION_LABEL: Record<string, string> = {
  home: "自宅",
  charger: "充電器",
  other: "その他",
};

export function SessionListItem({
  session,
  chargerName,
}: {
  session: ChargeSession;
  chargerName?: string | null;
}) {
  const locationLabel =
    session.locationType === "charger"
      ? (chargerName ?? session.chargerNameManual ?? "充電器")
      : LOCATION_LABEL[session.locationType];

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block rounded-xl border border-zinc-200 p-4 transition-colors hover:border-accent dark:border-zinc-800"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{formatDate(session.startedAt)}</span>
        <span className="text-xs text-zinc-400">{locationLabel}</span>
      </div>
      <p className="mt-1 text-lg font-bold">
        {session.startSoc}→{session.endSoc}%
      </p>
      <div className="mt-1 flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <span>{session.totalKwhAdded != null ? formatKwh(session.totalKwhAdded) : "-"}</span>
        <span>
          {session.durationMinutes != null ? formatDurationMinutes(session.durationMinutes) : "-"}
        </span>
      </div>
    </Link>
  );
}
