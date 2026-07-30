"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ChargeRing } from "@/components/charge/ChargeRing";
import { ChevronRightIcon } from "@/components/ui/icons";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktopQuery(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getIsDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}
function getIsDesktopServerSnapshot() {
  return false;
}

/**
 * Ring shared by the live measuring screen (LiveStatsPanel) and the
 * historical Session Detail screen (SessionStatsPanel), so both keep the
 * same visual language even though the numbers behind them differ.
 *
 * Collapsed by default on mobile — bare SOC% plus an icon-only toggle, no
 * ring, so the panel barely takes any vertical space. Expanded by default
 * once there's a dedicated `lg+` column for it, where the ring and
 * `children` (start time, odometer, location, precon, speed/energy/ETA
 * figures) show together. A manual toggle always wins over that viewport
 * default, even if the window is later resized.
 */
export function StatsRingPanel({
  soc,
  startSoc = 0,
  charging = false,
  complete = false,
  ringSubLabel,
  children,
}: {
  soc: number;
  startSoc?: number;
  charging?: boolean;
  complete?: boolean;
  ringSubLabel?: ReactNode;
  children?: ReactNode;
}) {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    getIsDesktop,
    getIsDesktopServerSnapshot
  );
  const [manuallyExpanded, setManuallyExpanded] = useState<boolean | null>(null);
  const expanded = manuallyExpanded ?? isDesktop;
  const clampedSoc = Math.max(0, Math.min(100, soc));

  const toggle = (
    <button
      type="button"
      onClick={() => setManuallyExpanded(!expanded)}
      aria-expanded={expanded}
      aria-label={expanded ? "詳細を閉じる" : "詳細を見る"}
      className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-ink-dim"
    >
      <ChevronRightIcon
        className={`h-4 w-4 transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`}
      />
    </button>
  );

  return (
    <Card radius="rounded-hero">
      {expanded ? (
        <div className="flex flex-col items-center gap-3">
          <ChargeRing
            soc={soc}
            startSoc={startSoc}
            charging={charging}
            complete={complete}
            subLabel={ringSubLabel}
            size={140}
          />
          {toggle}
        </div>
      ) : (
        <div className="flex w-full items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-ink">{clampedSoc}%</span>
            {ringSubLabel && <span className="text-xs text-ink-dim">{ringSubLabel}</span>}
          </div>
          {toggle}
        </div>
      )}
      {expanded && children}
    </Card>
  );
}
