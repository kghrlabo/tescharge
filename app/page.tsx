"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SessionSummaryCard } from "@/components/session/SessionSummaryCard";
import { useChargeSession } from "@/lib/polling/ChargeSessionContext";
import { chargeSessionRepository } from "@/lib/db/repositories";
import type { ChargeSession } from "@/lib/db/models";

interface AuthStatus {
  connected: boolean;
  vehicleName: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const { state, startMeasurement } = useChargeSession();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [liveSoc, setLiveSoc] = useState<number | null>(null);
  const [socError, setSocError] = useState<string | null>(null);
  const [latestSession, setLatestSession] = useState<ChargeSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then(setAuthStatus)
      .catch(() => setAuthStatus({ connected: false, vehicleName: null }));
  }, []);

  useEffect(() => {
    chargeSessionRepository
      .getLatestCompleteSession()
      .then(setLatestSession)
      .catch(() => {});
  }, []);

  const fetchLiveSoc = useCallback(() => {
    // No synchronous setState here — everything happens inside the promise
    // callbacks so this is safe to call from an effect body.
    fetch("/api/vehicle/charge-status", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "unknown_error");
        }
        return res.json();
      })
      .then((data) => {
        setLiveSoc(data.soc);
        setSocError(null);
      })
      .catch((err) => setSocError(err instanceof Error ? err.message : "unknown_error"));
  }, []);

  useEffect(() => {
    if (authStatus?.connected && state.status === "idle") {
      fetchLiveSoc();
    }
    // only re-fetch when connection state changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus?.connected, state.status]);

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const result = await startMeasurement();
      if (result.ok) {
        router.push("/measure");
      } else {
        setStartError(result.error);
      }
    } finally {
      setStarting(false);
    }
  };

  if (authStatus === null) {
    return <p className="text-zinc-500">読み込み中...</p>;
  }

  if (!authStatus.connected) {
    return (
      <Card className="text-center">
        <h1 className="text-xl font-bold">Charge Monitor</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          充電セッションを記録・分析するには、まずTeslaアカウントと連携してください。
        </p>
        <a href="/api/auth/login">
          <Button className="mt-4">Teslaアカウントと連携</Button>
        </a>
      </Card>
    );
  }

  const isMeasuring = state.status === "waitingForCable" || state.status === "charging";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Charge Monitor</h1>

      <Card>
        <p className="text-xs text-zinc-500">
          車両SOC {authStatus.vehicleName ? `(${authStatus.vehicleName})` : ""}
        </p>
        {socError ? (
          <p className="mt-2 text-sm text-red-600">取得に失敗しました（{socError}）</p>
        ) : (
          <p className="mt-2 text-4xl font-bold">{liveSoc !== null ? `${liveSoc}%` : "..."}</p>
        )}
        <button onClick={fetchLiveSoc} className="mt-1 text-xs text-accent-text hover:underline">
          更新
        </button>
      </Card>

      <div>
        <Button
          onClick={handleStart}
          disabled={starting || isMeasuring}
          className="w-full py-4 text-base"
        >
          {isMeasuring ? "計測中..." : starting ? "開始中..." : "計測開始"}
        </Button>
        {startError && (
          <p className="mt-2 text-center text-sm text-red-600">開始に失敗しました（{startError}）</p>
        )}
        {isMeasuring && (
          <Link
            href="/measure"
            className="mt-2 block text-center text-sm text-accent-text hover:underline"
          >
            計測画面に戻る
          </Link>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">最新セッション</p>
        {latestSession ? (
          <SessionSummaryCard session={latestSession} />
        ) : (
          <p className="text-sm text-zinc-400">まだ記録がありません</p>
        )}
      </div>
    </div>
  );
}
