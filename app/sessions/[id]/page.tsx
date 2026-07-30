"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { chargeSessionRepository, chargerRepository } from "@/lib/db/repositories";
import type { ChargeSession, Charger, LogPoint } from "@/lib/db/models";
import { SessionDetailTable } from "@/components/session/SessionDetailTable";
import { ChargeChartTabs } from "@/components/charts/ChargeChartTabs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<ChargeSession | null | undefined>(undefined);
  const [logPoints, setLogPoints] = useState<LogPoint[]>([]);
  const [charger, setCharger] = useState<Charger | null>(null);

  useEffect(() => {
    let cancelled = false;
    chargeSessionRepository.getSessionWithLogs(id).then((result) => {
      if (cancelled) return;
      if (!result) {
        setSession(null);
        return;
      }
      setSession(result.session);
      setLogPoints(result.logPoints);
      if (result.session.chargerId) {
        chargerRepository.list().then((chargers) => {
          if (cancelled) return;
          setCharger(chargers.find((c) => c.id === result.session.chargerId) ?? null);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("このセッションを削除しますか？")) return;
    await chargeSessionRepository.deleteSession(id);
    window.location.href = "/sessions";
  };

  if (session === undefined) return <p className="text-zinc-500">読み込み中...</p>;
  if (session === null) return <p className="text-zinc-500">セッションが見つかりません。</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/sessions" className="text-sm text-accent-text hover:underline">
          ← セッション一覧
        </Link>
        <Button variant="danger" onClick={handleDelete} className="px-3 py-1.5 text-xs">
          削除
        </Button>
      </div>

      <Card>
        <SessionDetailTable session={session} charger={charger} />
      </Card>

      <Card>
        <ChargeChartTabs logPoints={logPoints} />
      </Card>
    </div>
  );
}
