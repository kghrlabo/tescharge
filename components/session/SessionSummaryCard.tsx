import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatDate, formatKwh, formatDurationMinutes } from "@/lib/format";
import type { ChargeSession } from "@/lib/db/models";

export function SessionSummaryCard({ session }: { session: ChargeSession }) {
  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="transition-colors hover:border-accent">
        <p className="text-xs text-zinc-500">{formatDate(session.startedAt)}</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-2xl font-bold">{session.startSoc}%</span>
          <span className="pb-1 text-zinc-400">→</span>
          <span className="text-2xl font-bold">{session.endSoc}%</span>
        </div>
        <div className="mt-3 flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span>{session.totalKwhAdded != null ? formatKwh(session.totalKwhAdded) : "-"}</span>
          <span>
            {session.durationMinutes != null ? formatDurationMinutes(session.durationMinutes) : "-"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
