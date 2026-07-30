"use client";

import { useEffect, useState } from "react";
import { chargeSessionRepository, chargerRepository } from "@/lib/db/repositories";
import type { ChargeSession, Charger } from "@/lib/db/models";
import { SessionListItem } from "@/components/session/SessionListItem";

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
    return <p className="text-zinc-500">読み込み中...</p>;
  }

  const chargerMap = new Map(chargers.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">セッション一覧</h1>
      {sessions.length === 0 ? (
        <p className="text-sm text-zinc-400">まだセッションが記録されていません。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <SessionListItem
              key={s.id}
              session={s}
              chargerName={s.chargerId ? chargerMap.get(s.chargerId) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
