"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { SessionSocBar } from "@/components/session/SessionSocBar";
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
 * SOC header shared by the live measuring screen (LiveStatsPanel) and the
 * historical Session Detail screen (SessionStatsPanel), so both keep the
 * same visual language even though the numbers behind them differ.
 *
 * The SOC bar (not a ring — a ring ate too much vertical space) always
 * shows, even collapsed on mobile. `children` (start time, odometer,
 * location, precon, speed/energy/ETA figures) lives behind an icon-only
 * toggle — collapsed by default on mobile, expanded by default once there's
 * a dedicated `lg+` column for it. A manual toggle always wins over that
 * viewport default, even if the window is later resized.
 */
export function StatsRingPanel({
  soc,
  startSoc = 0,
  ringSubLabel,
  belowBar,
  children,
}: {
  soc: number;
  startSoc?: number;
  ringSubLabel?: ReactNode;
  /** Live-only controls (e.g. the charge-limit buttons) — always visible, not gated by the collapse toggle. */
  belowBar?: ReactNode;
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
  const socDelta = Math.round(soc - startSoc);

  return (
    <Card radius="rounded-hero">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-ink">{clampedSoc}%</span>
            {socDelta > 0 && (
              <span className="text-xs font-semibold text-glow-text">+{socDelta}%</span>
            )}
            {ringSubLabel && <span className="text-xs text-ink-dim">{ringSubLabel}</span>}
          </div>
          {children && (
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
          )}
        </div>
        <SessionSocBar startSoc={startSoc} endSoc={soc} />
        {belowBar}
      </div>
      {expanded && children}
    </Card>
  );
}
