"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocationSelectField } from "@/components/measure/LocationSelectField";
import { useChargeSession } from "@/lib/polling/ChargeSessionContext";
import type { LocationOverride } from "@/lib/polling/chargeStateMachine";

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
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [locationOverride, setLocationOverride] = useState<LocationOverride | null>(null);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then(setAuthStatus)
      .catch(() => setAuthStatus({ connected: false, vehicleName: null }));
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
      const result = await startMeasurement({
        locationOverride,
        memo: memo.trim() || null,
      });
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
    return <p className="text-ink-faint">読み込み中...</p>;
  }

  if (!authStatus.connected) {
    return (
      <Card className="mx-auto w-full max-w-lg text-center">
        <h1 className="text-xl font-bold text-ink">Charge Monitor</h1>
        <p className="mt-2 text-sm text-ink-dim">
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-ink">Charge Monitor</h1>

      <div>
        <Button onClick={handleStart} disabled={starting || isMeasuring} className="w-full">
          {isMeasuring ? "計測中..." : starting ? "開始中..." : "計測開始"}
        </Button>
        {startError && (
          <p className="mt-2 text-center text-sm text-danger">開始に失敗しました（{startError}）</p>
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

      <Card>
        <p className="text-xs text-ink-faint">
          車両SOC {authStatus.vehicleName ? `(${authStatus.vehicleName})` : ""}
        </p>
        {socError ? (
          <p className="mt-2 text-sm text-danger">取得に失敗しました（{socError}）</p>
        ) : (
          <p className="mt-2 text-4xl font-bold text-ink">{liveSoc !== null ? `${liveSoc}%` : "..."}</p>
        )}
        <button onClick={fetchLiveSoc} className="mt-1 text-xs text-accent-text hover:underline">
          更新
        </button>
      </Card>

      {!isMeasuring && (
        <Card className="flex flex-col gap-4 text-sm">
          <LocationSelectField value={locationOverride} onChange={setLocationOverride} />
          <div>
            <p className="mb-1 text-ink-dim">メモ</p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: ドライブ前"
              rows={2}
              className="w-full resize-none rounded-chip border border-hairline bg-surface-raised px-3 py-1.5 text-sm text-ink"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
