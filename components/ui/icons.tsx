import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.5-2-3.5-2.4.7a7.8 7.8 0 0 0-1.7-1L14.8 3h-4l-.5 2.7a7.8 7.8 0 0 0-1.7 1l-2.4-.7-2 3.5L6.2 11a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.5 2.4-.7a7.8 7.8 0 0 0 1.7 1l.5 2.7h4l.5-2.7a7.8 7.8 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5Z" />
    </svg>
  );
}

export function SnowflakeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2v20M4.5 7l15 10M19.5 7l-15 10" />
      <path d="M12 6 9.5 4M12 6l2.5-2M12 18l-2.5 2M12 18l2.5 2M6.7 9.3l-3-.5M6.7 9.3l1-2.8M17.3 9.3l3-.5M17.3 9.3l-1-2.8M6.7 14.7l-3 .5M6.7 14.7l1 2.8M17.3 14.7l3 .5M17.3 14.7l-1 2.8" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
