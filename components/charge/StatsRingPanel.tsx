import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ChargeRing } from "@/components/charge/ChargeRing";

export interface StatTile {
  value: string;
  label: string;
}

/**
 * Ring + key-stat tiles shared by the live measuring screen (LiveStatsPanel)
 * and the historical Session Detail screen (SessionStatsPanel), so both keep
 * the same visual language even though the numbers behind them differ.
 */
export function StatsRingPanel({
  soc,
  charging = false,
  complete = false,
  ringSubLabel,
  badge,
  tiles,
  footer,
  children,
}: {
  soc: number;
  charging?: boolean;
  complete?: boolean;
  ringSubLabel?: ReactNode;
  badge?: ReactNode;
  tiles: StatTile[];
  footer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card radius="rounded-hero">
      <div className="flex flex-col items-center gap-3">
        <ChargeRing soc={soc} charging={charging} complete={complete} subLabel={ringSubLabel} size={188} />
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
      </div>
      {children}
    </Card>
  );
}
