import { PreconToggle } from "./PreconToggle";
import { Button } from "@/components/ui/Button";

export function CableWaitingView({
  soc,
  precon,
  onPreconChange,
  onCancel,
  errorMessage,
  showFakeConnectButton,
  onFakeConnectCable,
}: {
  soc: number;
  precon: boolean;
  onPreconChange: (value: boolean) => void;
  onCancel: () => void;
  errorMessage: string | null;
  showFakeConnectButton?: boolean;
  onFakeConnectCable?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <p className="text-lg font-semibold text-ink">ケーブルを接続してください</p>
      <p className="text-sm text-ink-dim">現在のSOC: {soc}%</p>
      {errorMessage && (
        <p className="rounded-card bg-warn/15 px-3 py-2 text-xs text-warn">
          データ取得でエラーが続いています（{errorMessage}）。自動で再試行しています。
        </p>
      )}
      <div className="w-full max-w-sm">
        <PreconToggle value={precon} onChange={onPreconChange} />
      </div>
      {showFakeConnectButton && (
        <Button onClick={onFakeConnectCable} className="w-full max-w-sm">
          （開発用）ケーブル接続をシミュレート
        </Button>
      )}
      <Button variant="secondary" onClick={onCancel}>
        計測をキャンセル
      </Button>
    </div>
  );
}
