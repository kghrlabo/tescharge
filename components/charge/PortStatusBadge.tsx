import { BoltIcon, CheckCircleIcon, LockIcon, PlugIcon } from "@/components/ui/icons";

const STATE_LABEL: Record<string, string> = {
  Starting: "接続済み・開始中",
  Charging: "接続済み・施錠中・充電中",
  Complete: "接続済み・充電完了",
  Stopped: "接続済み・一時停止",
  NoPower: "接続済み・電力なし",
  Disconnected: "未接続",
};

export function PortStatusBadge({ chargingState }: { chargingState: string }) {
  const label = STATE_LABEL[chargingState] ?? "接続済み";
  const isCharging = chargingState === "Charging";
  const isComplete = chargingState === "Complete";
  const Icon = isComplete ? CheckCircleIcon : isCharging ? LockIcon : PlugIcon;
  const tone = isComplete ? "text-glow-text" : isCharging ? "text-accent-text" : "text-ink-dim";

  return (
    <div className={`flex items-center justify-center gap-1.5 text-xs font-medium ${tone}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {isCharging && <BoltIcon className="h-4 w-4" />}
    </div>
  );
}
