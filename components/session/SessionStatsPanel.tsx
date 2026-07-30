import { StatsRingPanel } from "@/components/charge/StatsRingPanel";
import { SessionDetailTable } from "./SessionDetailTable";
import type { ChargeSession, Charger } from "@/lib/db/models";

/**
 * Historical counterpart to the live measuring screen's LiveStatsPanel — same
 * ring + collapsible detail zone, so a finished session reads as the "final
 * frame" of the same view, not a different screen.
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
      startSoc={session.startSoc}
      ringSubLabel={`${session.startSoc}% → ${session.endSoc != null ? `${session.endSoc}%` : "-"}`}
    >
      <SessionDetailTable session={session} charger={charger} />
    </StatsRingPanel>
  );
}
