"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ChargeRing } from "@/components/charge/ChargeRing";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface StatTile {
  value: string;
  label: string;
}

/**
 * Ring + key-stat tiles shared by the live measuring screen (LiveStatsPanel)
 * and the historical Session Detail screen (SessionStatsPanel), so both keep
 * the same visual language even though the numbers behind them differ.
 *
 * `children` (start time, odometer, location, precon, ...) lives behind a
 * collapse toggle so the panel doesn't push the charts below the fold on a
 * narrow screen — collapsed by default on mobile, expanded by default once
 * there's a dedicated `lg+` column for it.
 */
export function StatsRingPanel({
  soc,
  startSoc = 0,
  charging = false,
  complete = false,
  ringSubLabel,
  badge,
  tiles,
  footer,
  children,
}: {
  soc: number;
  startSoc?: number;
  charging?: boolean;
  complete?: boolean;
  ringSubLabel?: ReactNode;
  badge?: ReactNode;
  tiles: StatTile[];
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  return (
    <Card radius="rounded-hero">
      <div className="flex flex-col items-center gap-3">
        <ChargeRing
          soc={soc}
          startSoc={startSoc}
          charging={charging}
          complete={complete}
          subLabel={ringSubLabel}
          size={140}
        />
        {badge}

        <div className="grid w-full grid-cols-3 gap-2 text-center">
          {tiles.map((tile) => (
            <div key={tile.label}>
              <p className="text-lg font-semibold tabular-nums text-ink">{tile.value}</p>
              <p className="text-[11px] tracking-wide text-ink-faint uppercase">{tile.label}</p>
            </div>
          ))}
        </div>

        {footer}

        {children && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex min-h-11 w-full items-center justify-center gap-1 text-xs font-medium text-ink-dim"
          >
            {expanded ? "詳細を閉じる" : "詳細を見る"}
            <ChevronRightIcon
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>
      {expanded && children}
    </Card>
  );
}
