import type { ReactNode } from "react";

const STROKE = 14;

export function ChargeRing({
  soc,
  startSoc = 0,
  charging,
  complete,
  subLabel,
  size = 240,
}: {
  soc: number;
  /** SOC when this session/charge started — the ring only lights up from here
   * onward, so the arc length reads as "how much was added," not the pack's
   * absolute charge level. */
  startSoc?: number;
  charging: boolean;
  complete?: boolean;
  subLabel?: ReactNode;
  size?: number;
}) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, soc));
  const clampedStart = Math.max(0, Math.min(100, startSoc));
  // Guard against out-of-order data (soc < startSoc): draw no gain arc rather than a negative one.
  const gainEnd = Math.max(clampedStart, clamped);
  const nearFull = complete || clamped >= 95;
  const gainColor = nearFull ? "var(--color-glow)" : "var(--color-accent)";

  const baseOffset = circumference * (1 - clampedStart / 100);
  const gainFraction = (gainEnd - clampedStart) / 100;
  const gainOffset = circumference * (1 - gainFraction);
  const gainRotation = (clampedStart / 100) * 360;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {charging && (
        <div
          className="charge-ring-glow absolute inset-3 rounded-full"
          style={{ backgroundColor: nearFull ? "var(--color-glow)" : "var(--color-accent)" }}
          aria-hidden
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative -rotate-90"
        role="img"
        aria-label={`充電 ${clamped}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="var(--color-surface)"
          stroke="var(--color-hairline)"
          strokeWidth={STROKE}
        />
        {/* 0% -> startSoc%: charge the battery already had before this session */}
        {clampedStart > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeOpacity={0.3}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={baseOffset}
          />
        )}
        {/* startSoc% -> soc%: charge added this session */}
        {gainFraction > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={gainColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={gainOffset}
            transform={`rotate(${gainRotation} ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1), stroke 600ms ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums text-ink"
          style={{ fontSize: size * 0.26 }}
        >
          {clamped}%
        </span>
        {subLabel && <span className="mt-1 text-sm text-ink-dim">{subLabel}</span>}
      </div>
    </div>
  );
}
