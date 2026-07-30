import type { ReactNode } from "react";

const STROKE = 14;

export function ChargeRing({
  soc,
  charging,
  complete,
  subLabel,
  size = 240,
}: {
  soc: number;
  charging: boolean;
  complete?: boolean;
  subLabel?: ReactNode;
  size?: number;
}) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, soc));
  const nearFull = complete || clamped >= 95;
  const offset = circumference * (1 - clamped / 100);
  const strokeColor = nearFull ? "var(--color-glow)" : "var(--color-accent)";

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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1), stroke 600ms ease" }}
        />
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
