export function SessionSocBar({
  startSoc,
  endSoc,
}: {
  startSoc: number;
  endSoc: number | null;
}) {
  const endPct = Math.max(0, Math.min(100, endSoc ?? startSoc));
  const startPct = Math.max(0, Math.min(100, startSoc));

  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-accent"
        style={{ width: `${endPct}%` }}
      />
      <div
        className="absolute inset-y-0 w-0.5 bg-ink-faint"
        style={{ left: `${startPct}%` }}
      />
    </div>
  );
}
