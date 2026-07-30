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
 * `children` (start time, odometer, location, precon, and — now that they're
 * off the always-visible face — the speed/energy/ETA figures too) lives
 * behind a collapse toggle so the panel doesn't push the charts below the
 * fold on a narrow screen — collapsed by default on mobile, expanded by
 * default once there's a dedicated `lg+` column for it. A manual toggle
 * always wins over that default, even if the viewport is later resized.
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

        {children && (
          <button
            type="button"
            onClick={() => setManuallyExpanded(!expanded)}
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
