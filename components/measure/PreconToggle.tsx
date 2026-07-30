"use client";

import { Card } from "@/components/ui/Card";
import { SnowflakeIcon } from "@/components/ui/icons";

export function PreconToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <SnowflakeIcon className="h-5 w-5 text-ink-dim" />
        <span className="text-sm font-medium text-ink">プレコンディショニング</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="プレコンディショニングを実施した"
        onClick={() => onChange(!value)}
        className="flex h-11 w-14 shrink-0 items-center justify-center"
      >
        <span
          className={`relative h-7 w-12 rounded-full transition-colors ${
            value ? "bg-accent" : "bg-surface-raised border border-hairline"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 block h-6 w-6 rounded-full bg-white transition-transform ${
              value ? "translate-x-5" : ""
            }`}
          />
        </span>
      </button>
    </Card>
  );
}
