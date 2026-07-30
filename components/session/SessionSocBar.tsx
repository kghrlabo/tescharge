export function SessionSocBar({
  startSoc,
  endSoc,
}: {
  startSoc: number;
  endSoc: number | null;
}) {
  const endPct = Math.max(0, Math.min(100, endSoc ?? startSoc));
  const startPct = Math.max(0, Math.min(100, startSoc));
  const gainWidthPct = Math.max(0, endPct - startPct);

  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
      {/* 0% -> startSoc%: charge the battery already had before this session */}
      <div
        className="absolute inset-y-0 left-0 rounded-l-full bg-accent/30"
        style={{ width: `${startPct}%` }}
      />
      {/* startSoc% -> endSoc%: charge added during this session */}
      <div
        className="absolute inset-y-0 rounded-r-full bg-accent"
        style={{ left: `${startPct}%`, width: `${gainWidthPct}%` }}
      />
      <div
        className="absolute inset-y-0 w-0.5 bg-ink-faint"
        style={{ left: `${startPct}%` }}
      />
    </div>
  );
}
