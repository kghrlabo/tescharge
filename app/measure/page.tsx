"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useChargeSession } from "@/lib/polling/ChargeSessionContext";
import { detectPreconditioned } from "@/lib/polling/chargeStateMachine";
import { ChargeStatusBar } from "@/components/measure/ChargeStatusBar";
import { LiveStatsPanel } from "@/components/measure/LiveStatsPanel";
import { ChargeChartsGrid } from "@/components/charts/ChargeChartsGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function MeasurePage() {
  const router = useRouter();
  const { state, changeLocationOverride, cancelMeasurement, pollNow } = useChargeSession();
  const [useFakeTeslaApi, setUseFakeTeslaApi] = useState(false);
  const [vehicleName, setVehicleName] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/");
    }
  }, [state.status, router]);

  useEffect(() => {
    if (state.status === "finished") {
      router.replace(`/sessions/${state.sessionId}?completed=1`);
    }
    // `state` (not just state.status) so the redirect fires with the right
    // sessionId the moment the machine transitions to "finished".
  }, [state, router]);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setUseFakeTeslaApi(Boolean(data.useFakeTeslaApi));
        setVehicleName(data.vehicleName ?? null);
      })
      .catch(() => {});
  }, []);

  const handleFakeConnectCable = async () => {
    await fetch("/api/vehicle/fake-connect-cable", { method: "POST" });
    pollNow();
  };

  if (state.status === "idle" || state.status === "finished") {
    return null;
  }

  const handleCancel = async () => {
    await cancelMeasurement();
    router.push("/");
  };

  const isWaiting = state.status === "waitingForCable";
  const latest = state.status === "charging" ? state.logPoints[state.logPoints.length - 1] : null;
  const preconditioned = state.status === "charging" ? detectPreconditioned(state.logPoints) : null;

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3">
      <ChargeStatusBar vehicleName={vehicleName} outsideTempC={state.startPayload.outsideTempC} />
      {state.consecutiveErrors >= 3 && (
        <p className="rounded-card bg-warn/15 p-3 text-sm text-warn">
          データ取得でエラーが続いています（{state.lastErrorMessage}）。自動で再試行しています。
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr] lg:items-start">
        <LiveStatsPanel
          latest={latest}
          startPayload={state.startPayload}
          preconditioned={preconditioned}
          locationOverride={state.locationOverride}
          onLocationChange={changeLocationOverride}
          chargeLimitSoc={state.chargeLimitSoc}
        />

        {isWaiting ? (
          <Card className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center text-sm text-ink-faint">
            <p>ケーブル接続を待っています…</p>
            {useFakeTeslaApi && (
              <Button variant="secondary" onClick={handleFakeConnectCable}>
                （開発用）ケーブル接続をシミュレート
              </Button>
            )}
          </Card>
        ) : (
          <ChargeChartsGrid
            logPoints={state.logPoints}
            minutesToFull={latest!.minutesToFull}
            precon={preconditioned ?? true}
            fastChargerPresent={state.startPayload.fastChargerPresent}
          />
        )}
      </div>

      {!isWaiting && (
        <p className="text-center text-xs text-ink-faint">計測中はこのタブを閉じないでください</p>
      )}
      <Button variant="secondary" onClick={handleCancel}>
        {isWaiting ? "計測をキャンセル" : "計測を中止"}
      </Button>
    </div>
  );
}
