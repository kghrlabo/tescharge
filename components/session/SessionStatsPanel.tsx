import { StatsRingPanel } from "@/components/charge/StatsRingPanel";
import { SessionDetailTable } from "./SessionDetailTable";
import { formatDurationMinutes, formatTime } from "@/lib/format";
import type { ChargeSession, Charger } from "@/lib/db/models";

/**
 * Historical counterpart to the live measuring screen's LiveStatsPanel — same
 * ring + 3-tile layout (end time / avg kW / total kWh) so a finished session
 * reads as the "final frame" of the same view, not a different screen.
 */
export function SessionStatsPanel({
  session,
  charger,
}: {
  session: ChargeSession;
  charger: Charger | null;
}) {
  return (
    <StatsRingPanel
      soc={session.endSoc ?? session.startSoc}
      complete
      ringSubLabel={`${session.startSoc}% → ${session.endSoc != null ? `${session.endSoc}%` : "-"}`}
      tiles={[
        { value: session.endedAt ? formatTime(session.endedAt) : "-", label: "終了時刻" },
        { value: session.avgKw != null ? session.avgKw.toFixed(1) : "-", label: "平均速度 kW" },
        {
          value: session.totalKwhAdded != null ? session.totalKwhAdded.toFixed(1) : "-",
          label: "追加電力量 kWh",
        },
      ]}
      footer={
        <p className="text-xs text-ink-faint">
          充電時間{" "}
          {session.durationMinutes != null ? formatDurationMinutes(session.durationMinutes) : "-"}
        </p>
      }
    >
      <SessionDetailTable session={session} charger={charger} />
    </StatsRingPanel>
  );
}
