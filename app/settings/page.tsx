"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { settingsRepository, chargerRepository } from "@/lib/db/repositories";
import type { AppSettings, Charger } from "@/lib/db/models";
import type { ChargerInput } from "@/lib/db/repositories/ChargerRepository";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PollIntervalSelect } from "@/components/settings/PollIntervalSelect";
import { HomeLocationField, type HomeLocationPatch } from "@/components/settings/HomeLocationField";
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
  const connected = searchParams.get("connected");

  if (!error && !connected) return null;

  return error ? (
    <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200">
      接続でエラーが発生しました（{error}）
    </p>
  ) : (
    <p className="rounded-lg bg-green-100 p-3 text-sm text-green-700 dark:bg-green-900/40 dark:text-green-200">
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

  const updateSettings = async (patch: Partial<Omit<AppSettings, "id">> | HomeLocationPatch) => {
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

  const handleDeleteCharger = async (id: string) => {
    await chargerRepository.delete(id);
    setChargers(await chargerRepository.list());
  };

  if (!authStatus || !settings) {
    return <p className="text-zinc-500">読み込み中...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">設定</h1>

      <Suspense fallback={null}>
        <ConnectionBanner />
      </Suspense>

      <Card>
        <h2 className="text-sm font-semibold">Tesla認証</h2>
        {authStatus.connected ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
        <h2 className="text-sm font-semibold">API更新間隔</h2>
        <div className="mt-2">
          <PollIntervalSelect
            value={settings.pollIntervalSec}
            onChange={(v) => updateSettings({ pollIntervalSec: v })}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">保存期間</h2>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            value={settings.retentionDays}
            onChange={(e) => updateSettings({ retentionDays: Number(e.target.value) })}
            className="w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-sm text-zinc-500">日</span>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">電気料金</h2>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            value={settings.electricityRatePerKwh ?? ""}
            onChange={(e) =>
              updateSettings({
                electricityRatePerKwh: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-sm text-zinc-500">円/kWh</span>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">自宅位置</h2>
        <div className="mt-2">
          <HomeLocationField
            lat={settings.homeLat}
            lng={settings.homeLng}
            radiusM={settings.homeRadiusM}
            onChange={updateSettings}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">充電器名称（マスタ）</h2>
        <div className="mt-2">
          <ChargerMasterList
            chargers={chargers}
            onCreate={handleCreateCharger}
            onDelete={handleDeleteCharger}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">プレコンディショニング</h2>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>計測開始時のデフォルト値</span>
          <button
            type="button"
            onClick={() => updateSettings({ preconDefault: !settings.preconDefault })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              settings.preconDefault
                ? "bg-accent text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {settings.preconDefault ? "あり" : "なし"}
          </button>
        </div>
      </Card>
    </div>
  );
}
