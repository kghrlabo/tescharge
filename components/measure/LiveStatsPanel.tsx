import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ChargeRing } from "@/components/charge/ChargeRing";
import { PortStatusBadge } from "@/components/charge/PortStatusBadge";
import { formatDurationMinutes, formatTime } from "@/lib/format";
import type { LogPointDraft } from "@/lib/polling/chargeStateMachine";

const RING_STATE_LABEL: Record<string, string> = {
  Starting: "開始中",
  Charging: "充電中",
  Complete: "満充電",
  Stopped: "一時停止",
  NoPower: "待機中",
  Disconnected: "未接続",
};

export function LiveStatsPanel({
  latest,
  children,
}: {
  latest: LogPointDraft;
  children?: ReactNode;
}) {
  const elapsedMinutes = latest.elapsedSeconds / 60;
  // Based on the poll's own timestamp, not the render time, so this stays pure.
  const etaMs = latest.minutesToFull > 0 ? latest.timestamp + latest.minutesToFull * 60_000 : null;
  const isComplete = latest.chargingState === "Complete";
  const isCharging = latest.chargingState === "Charging";

  return (
    <Card radius="rounded-hero">
      <div className="flex flex-col items-center gap-3">
        <ChargeRing
          soc={latest.soc}
          charging={isCharging}
          complete={isComplete}
          subLabel={RING_STATE_LABEL[latest.chargingState] ?? "充電中"}
          size={188}
        />
        <PortStatusBadge chargingState={latest.chargingState} />

        <div className="grid w-full grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold tabular-nums text-ink">
              {etaMs ? formatTime(etaMs) : "-"}
            </p>
            <p className="text-[11px] tracking-wide text-ink-faint uppercase">推定終了</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-ink">
              {latest.chargerPowerKw.toFixed(1)}
            </p>
            <p className="text-[11px] tracking-wide text-ink-faint uppercase">充電速度 kW</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-ink">
              {latest.energyAddedKwh.toFixed(1)}
            </p>
            <p className="text-[11px] tracking-wide text-ink-faint uppercase">追加電力量 kWh</p>
          </div>
        </div>

        <p className="text-xs text-ink-faint">経過時間 {formatDurationMinutes(elapsedMinutes)}</p>
      </div>
      {children}
    </Card>
  );
}
