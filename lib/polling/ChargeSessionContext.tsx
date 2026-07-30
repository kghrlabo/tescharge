"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useChargePolling } from "./useChargePolling";

type ChargeSessionContextValue = ReturnType<typeof useChargePolling>;

const ChargeSessionContext = createContext<ChargeSessionContextValue | null>(null);

/**
 * Lives in the root layout so the measuring state survives client-side navigation
 * between "/" (Home) and "/measure" — those are two views of the same in-progress
 * polling session, not independent state.
 */
export function ChargeSessionProvider({ children }: { children: ReactNode }) {
  const value = useChargePolling();
  const isMeasuring = value.state.status === "waitingForCable" || value.state.status === "charging";

  useEffect(() => {
    if (!isMeasuring) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isMeasuring]);

  return (
    <ChargeSessionContext.Provider value={value}>{children}</ChargeSessionContext.Provider>
  );
}

export function useChargeSession(): ChargeSessionContextValue {
  const ctx = useContext(ChargeSessionContext);
  if (!ctx) {
    throw new Error("useChargeSession must be used within a ChargeSessionProvider");
  }
  return ctx;
}
