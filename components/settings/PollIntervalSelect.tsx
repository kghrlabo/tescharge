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
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            value === sec
              ? "bg-accent text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {sec}秒
        </button>
      ))}
    </div>
  );
}
