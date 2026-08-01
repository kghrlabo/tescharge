import Link from "next/link";
import { formatDate, formatDurationMinutes, formatTime } from "@/lib/format";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SessionSocBar } from "./SessionSocBar";
import type { ChargeSession } from "@/lib/db/models";

const LOCATION_LABEL: Record<string, string> = {
  charger: "充電器",
  other: "未設定",
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-sm font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-[10px] tracking-wide text-ink-faint uppercase">{label}</p>
    </div>
  );
}

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
      className="group flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4 transition-colors hover:border-accent sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="flex items-center justify-between gap-3 sm:w-32 sm:flex-none sm:flex-col sm:items-start sm:gap-1">
        <div>
          <p className="text-sm font-semibold text-ink">{formatDate(session.startedAt)}</p>
          <p className="text-xs text-ink-faint">{formatTime(session.startedAt)}</p>
        </div>
        <span className="rounded-chip bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-ink-dim">
          {locationLabel}
        </span>
      </div>

      <div className="flex-1">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular-nums text-ink">
            {session.startSoc}% <span className="text-ink-faint">→</span>{" "}
            {session.endSoc != null ? `${session.endSoc}%` : "-"}
          </span>
          {session.acOrDc && (
            <span className="text-[11px] font-medium text-ink-faint">{session.acOrDc}</span>
          )}
        </div>
        <SessionSocBar startSoc={session.startSoc} endSoc={session.endSoc} />
      </div>

      <div className="grid grid-cols-3 gap-4 sm:w-48 sm:flex-none sm:gap-4">
        <Stat value={session.totalKwhAdded != null ? session.totalKwhAdded.toFixed(1) : "-"} label="kWh" />
        <Stat value={session.avgKw != null ? session.avgKw.toFixed(1) : "-"} label="平均kW" />
        <Stat
          value={session.durationMinutes != null ? formatDurationMinutes(session.durationMinutes) : "-"}
          label="時間"
        />
      </div>

      <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-accent-text sm:block" />
    </Link>
  );
}
