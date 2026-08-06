"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { settingsRepository, chargerRepository } from "@/lib/db/repositories";
import type { AppSettings, Charger } from "@/lib/db/models";
import type { ChargerInput } from "@/lib/db/repositories/ChargerRepository";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PollIntervalSelect } from "@/components/settings/PollIntervalSelect";
import { ChargerMasterList } from "@/components/settings/ChargerMasterList";

interface AuthStatus {
  connected: boolean;
  vehicleName: string | null;
  useFakeTeslaApi: boolean;
  fakeScenarios: { id: string; label: string }[];
}

function ConnectionBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const detail = searchParams.get("detail");
  const connected = searchParams.get("connected");

  if (!error && !connected) return null;

  return error ? (
    <p className="rounded-card bg-danger/15 p-3 text-sm text-danger">
      接続でエラーが発生しました（{error}）
      {detail && <span className="mt-1 block break-all text-xs">{detail}</span>}
    </p>
  ) : (
    <p className="rounded-card bg-glow/15 p-3 text-sm text-glow-text">
      Teslaアカウントと連携しました
    </p>
  );
}

export default function SettingsPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [scenario, setScenario] = useState("");

  const refreshAuthStatus = () => fetch("/api/auth/status").then((r) => r.json()).then(setAuthStatus);

  useEffect(() => {
    refreshAuthStatus();
    settingsRepository.getSettings().then(setSettings);
    chargerRepository.list().then(setChargers);
  }, []);

  const updateSettings = async (patch: Partial<Omit<AppSettings, "id">>) => {
    const updated = await settingsRepository.updateSettings(patch);
    setSettings(updated);
  };

  const handleDisconnect = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshAuthStatus();
  };

  const handleCreateCharger = async (input: ChargerInput) => {
    await chargerRepository.create(input);
    setChargers(await chargerRepository.list());
  };

  const handleRenameCharger = async (id: string, name: string) => {
    await chargerRepository.update(id, { name });
    setChargers(await chargerRepository.list());
  };

  const handleDeleteCharger = async (id: string) => {
    await chargerRepository.delete(id);
    setChargers(await chargerRepository.list());
  };

  if (!authStatus || !settings) {
    return <p className="text-ink-faint">読み込み中...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-ink">設定</h1>

      <Suspense fallback={null}>
        <ConnectionBanner />
      </Suspense>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Tesla認証</h2>
        {authStatus.connected ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-ink-dim">
              {authStatus.vehicleName} と連携中
            </p>
            <Button variant="secondary" onClick={handleDisconnect} className="px-3 py-1.5 text-xs">
              連携解除
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {authStatus.useFakeTeslaApi && authStatus.fakeScenarios.length > 0 && (
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="min-h-11 rounded-chip border border-hairline bg-surface-raised px-2 py-1.5 text-sm text-ink"
              >
                <option value="">開発用シナリオ: デフォルト</option>
                {authStatus.fakeScenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
            <a href={`/api/auth/login${scenario ? `?scenario=${scenario}` : ""}`}>
              <Button>Teslaアカウントと連携</Button>
            </a>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">API更新間隔</h2>
        <div className="mt-2">
          <PollIntervalSelect
            value={settings.pollIntervalSec}
            onChange={(v) => updateSettings({ pollIntervalSec: v })}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">保存期間</h2>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            value={settings.retentionDays}
            onChange={(e) => updateSettings({ retentionDays: Number(e.target.value) })}
            className="min-h-11 w-32 rounded-chip border border-hairline bg-surface-raised px-2 py-1.5 text-sm text-ink"
          />
          <span className="text-sm text-ink-faint">日</span>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">場所マスタ</h2>
        <div className="mt-2">
          <ChargerMasterList
            chargers={chargers}
            onCreate={handleCreateCharger}
            onRename={handleRenameCharger}
            onDelete={handleDeleteCharger}
          />
        </div>
      </Card>
    </div>
  );
}
