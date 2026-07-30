import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong disabled:bg-accent/30 disabled:text-white/50",
  secondary:
    "bg-surface-raised text-ink border border-hairline hover:bg-hairline disabled:opacity-40",
  danger: "bg-danger text-white hover:bg-danger/85 disabled:bg-danger/30",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-11 rounded-chip px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
