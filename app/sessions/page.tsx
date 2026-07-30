"use client";

import { useEffect, useState } from "react";
import { chargeSessionRepository, chargerRepository } from "@/lib/db/repositories";
import type { ChargeSession, Charger } from "@/lib/db/models";
import { SessionListItem } from "@/components/session/SessionListItem";
import { Card } from "@/components/ui/Card";
import { formatKwh } from "@/lib/format";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ChargeSession[] | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);

  useEffect(() => {
    chargeSessionRepository
      .listSessions()
      .then((all) => setSessions(all.filter((s) => s.status === "complete")));
    chargerRepository.list().then(setChargers);
  }, []);

  if (sessions === null) {
    return <p className="text-ink-faint">読み込み中...</p>;
  }

  const chargerMap = new Map(chargers.map((c) => [c.id, c.name]));
  const totalKwh = sessions.reduce((sum, s) => sum + (s.totalKwhAdded ?? 0), 0);
  const avgKw =
    sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.avgKw ?? 0), 0) / sessions.length
      : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">セッション一覧</h1>

      {sessions.length === 0 ? (
        <p className="text-sm text-ink-faint">まだセッションが記録されていません。</p>
      ) : (
        <>
          <Card className="flex items-center justify-around gap-4 text-center" padding="p-4">
            <div>
              <p className="text-lg font-semibold tabular-nums text-ink">{sessions.length}</p>
              <p className="text-[11px] tracking-wide text-ink-faint uppercase">セッション数</p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums text-ink">{formatKwh(totalKwh)}</p>
              <p className="text-[11px] tracking-wide text-ink-faint uppercase">総充電量</p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums text-ink">
                {avgKw != null ? avgKw.toFixed(1) : "-"}
              </p>
              <p className="text-[11px] tracking-wide text-ink-faint uppercase">平均 kW</p>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <SessionListItem
                key={s.id}
                session={s}
                chargerName={s.chargerId ? chargerMap.get(s.chargerId) : null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
