"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useChargeSession } from "@/lib/polling/ChargeSessionContext";
import { CableWaitingView } from "@/components/measure/CableWaitingView";
import { ChargeStatusBar } from "@/components/measure/ChargeStatusBar";
import { LiveStatsPanel } from "@/components/measure/LiveStatsPanel";
import { SessionMetaPanel } from "@/components/measure/SessionMetaPanel";
import { PreconToggle } from "@/components/measure/PreconToggle";
import { ChargeChartsGrid } from "@/components/charts/ChargeChartsGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function MeasurePage() {
  const router = useRouter();
  const {
    state,
    togglePrecon,
    changeLocationOverride,
    cancelMeasurement,
    reset,
    pollNow,
  } = useChargeSession();
  const [useFakeTeslaApi, setUseFakeTeslaApi] = useState(false);
  const [vehicleName, setVehicleName] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/");
    }
  }, [state.status, router]);

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

  if (state.status === "idle") {
    return null;
  }

  if (state.status === "finished") {
    return (
      <Card className="mx-auto w-full max-w-lg text-center">
        <p className="text-lg font-semibold text-ink">計測が完了しました</p>
        <p className="mt-2 text-sm text-ink-dim">
          {state.summary.endSoc}% まで充電（{state.summary.totalKwhAdded.toFixed(1)} kWh）
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={() => router.push(`/sessions/${state.sessionId}`)}>詳細を見る</Button>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              router.push("/");
            }}
          >
            ホームへ
          </Button>
        </div>
      </Card>
    );
  }

  const handleCancel = async () => {
    await cancelMeasurement();
    router.push("/");
  };

  if (state.status === "waitingForCable") {
    return (
      <CableWaitingView
        soc={state.startPayload.soc}
        precon={state.precon}
        onPreconChange={togglePrecon}
        onCancel={handleCancel}
        errorMessage={state.consecutiveErrors >= 3 ? state.lastErrorMessage : null}
        showFakeConnectButton={useFakeTeslaApi}
        onFakeConnectCable={handleFakeConnectCable}
      />
    );
  }

  const latest = state.logPoints[state.logPoints.length - 1];

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3">
      <ChargeStatusBar vehicleName={vehicleName} outsideTempC={state.startPayload.outsideTempC} />
      {state.consecutiveErrors >= 3 && (
        <p className="rounded-card bg-warn/15 p-3 text-sm text-warn">
          データ取得でエラーが続いています（{state.lastErrorMessage}）。自動で再試行しています。
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[300px_1fr] lg:items-start">
        <div className="flex flex-col gap-3">
          <LiveStatsPanel latest={latest}>
            <SessionMetaPanel
              startPayload={state.startPayload}
              locationOverride={state.locationOverride}
              onLocationChange={changeLocationOverride}
            />
          </LiveStatsPanel>
          <PreconToggle value={state.precon} onChange={togglePrecon} />
        </div>

        <ChargeChartsGrid
          logPoints={state.logPoints}
          minutesToFull={latest.minutesToFull}
          precon={state.precon}
          fastChargerPresent={state.startPayload.fastChargerPresent}
        />
      </div>

      <p className="text-center text-xs text-ink-faint">計測中はこのタブを閉じないでください</p>
      <Button variant="secondary" onClick={handleCancel}>
        計測を中止
      </Button>
    </div>
  );
}
