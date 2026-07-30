"use client";

export function PollIntervalSelect({
  value,
  onChange,
}: {
  value: 30 | 60;
  onChange: (value: 30 | 60) => void;
}) {
  return (
    <div className="flex gap-2">
      {([30, 60] as const).map((sec) => (
        <button
          key={sec}
          type="button"
          onClick={() => onChange(sec)}
          className={`min-h-11 rounded-chip px-4 py-2 text-sm font-medium transition-colors ${
            value === sec
              ? "bg-accent text-white"
              : "bg-surface-raised text-ink-dim border border-hairline hover:bg-hairline"
          }`}
        >
          {sec}秒
        </button>
      ))}
    </div>
  );
}
