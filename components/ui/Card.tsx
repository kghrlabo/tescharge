import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padding = "p-5",
  radius = "rounded-card",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
  radius?: string;
}) {
  return (
    <div className={`${radius} border border-hairline bg-surface ${padding} ${className}`}>
      {children}
    </div>
  );
}
