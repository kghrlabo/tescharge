"use client";

import { useState } from "react";

const PRESETS = [50, 60, 70, 80, 90, 100] as const;

export function ChargeLimitPresetButtons({
  value,
  onChange,
}: {
  value: number;
  onChange: (percent: number) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (percent: number) => {
    setPending(percent);
    setError(null);
    const result = await onChange(percent);
    setPending(null);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-1.5">
        {PRESETS.map((percent) => (
          <button
            key={percent}
            type="button"
            disabled={pending !== null}
            onClick={() => handleClick(percent)}
            className={`min-h-11 rounded-chip px-3 text-sm font-medium transition-colors disabled:opacity-60 ${
              value === percent
                ? "bg-glow text-white"
                : "bg-surface-raised text-ink-dim border border-hairline hover:bg-hairline"
            }`}
          >
            {percent}%
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-center text-xs text-danger">変更に失敗しました（{error}）</p>}
    </div>
  );
}
