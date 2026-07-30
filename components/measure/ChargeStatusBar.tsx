"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/format";
import { SnowflakeIcon } from "@/components/ui/icons";

export function ChargeStatusBar({
  vehicleName,
  outsideTempC,
}: {
  vehicleName: string | null;
  outsideTempC: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-1 text-xs font-medium text-ink-dim">
      <span className="truncate">{vehicleName ?? "Tesla"}</span>
      <div className="flex items-center gap-3 tabular-nums">
        {outsideTempC != null && (
          <span className="flex items-center gap-1">
            <SnowflakeIcon className="h-3.5 w-3.5" />
            {Math.round(outsideTempC)}℃
          </span>
        )}
        <span>{formatTime(now)}</span>
      </div>
    </div>
  );
}
