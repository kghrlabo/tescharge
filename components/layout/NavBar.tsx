"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChargeSession } from "@/lib/polling/ChargeSessionContext";
import { HomeIcon, ListIcon, SettingsIcon } from "@/components/ui/icons";

const TABS = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/sessions", label: "セッション", icon: ListIcon },
  { href: "/settings", label: "設定", icon: SettingsIcon },
];

export function NavBar() {
  const pathname = usePathname();
  const { state } = useChargeSession();
  const isMeasuring = state.status === "waitingForCable" || state.status === "charging";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-hairline bg-void/90 backdrop-blur">
        {isMeasuring && pathname !== "/measure" && (
          <Link
            href="/measure"
            className="block w-full bg-accent px-4 py-1.5 text-center text-sm font-medium text-white hover:bg-accent-strong"
          >
            計測中です — タップして計測画面に戻る
          </Link>
        )}
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <span className="text-sm font-semibold tracking-tight text-ink">
            Charge Monitor
          </span>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-hairline bg-surface/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2 py-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 rounded-chip px-3 py-1.5"
              >
                <Icon
                  className={`h-6 w-6 ${active ? "text-accent-text" : "text-ink-faint"}`}
                />
                <span
                  className={`text-[11px] font-medium ${
                    active ? "text-accent-text" : "text-ink-faint"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
