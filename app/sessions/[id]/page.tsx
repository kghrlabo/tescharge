"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { chargeSessionRepository, chargerRepository } from "@/lib/db/repositories";
import type { ChargeSession, Charger, LogPoint } from "@/lib/db/models";
import { SessionStatsPanel } from "@/components/session/SessionStatsPanel";
import { ChargeChartsGrid } from "@/components/charts/ChargeChartsGrid";
import { Button } from "@/components/ui/Button";
import { useChargeSession } from "@/lib/polling/ChargeSessionContext";

function CompletedBanner() {
  const searchParams = useSearchParams();
  const { reset } = useChargeSession();
  const completed = searchParams.get("completed") === "1";

  useEffect(() => {
    // Clears the in-progress "finished" state now that its one job (getting
    // the user here) is done, instead of on a button the intermediate
    // screen used to have.
    if (completed) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  if (!completed) return null;

  return <p className="rounded-card bg-glow/15 p-3 text-sm text-glow-text">計測が完了しました</p>;
}

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

  if (session === undefined) return <p className="text-ink-faint">読み込み中...</p>;
  if (session === null) return <p className="text-ink-faint">セッションが見つかりません。</p>;

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link href="/sessions" className="text-sm text-accent-text hover:underline">
          ← セッション一覧
        </Link>
        <Button variant="danger" onClick={handleDelete} className="px-3 py-1.5 text-xs">
          削除
        </Button>
      </div>

      <Suspense fallback={null}>
        <CompletedBanner />
      </Suspense>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr] lg:items-start">
        <SessionStatsPanel session={session} charger={charger} />

        <ChargeChartsGrid
          logPoints={logPoints}
          minutesToFull={0}
          precon={session.preconditioned ?? false}
          fastChargerPresent={Boolean(session.fastChargerType) || session.acOrDc === "DC"}
          live={false}
        />
      </div>
    </div>
  );
}
