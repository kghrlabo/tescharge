import type { ChargeSession, LogPoint, LocationType, AcOrDc } from "../models";

export interface CreateSessionInput {
  startedAt: number;
  startSoc: number;
  startOdometerKm: number | null;
  startRangeKm: number | null;
  startOutsideTempC: number | null;
  startLat: number | null;
  startLng: number | null;
  pollIntervalSec: number;
}

export interface CompleteSessionInput {
  endedAt: number;
  endSoc: number;
  endOdometerKm: number | null;
  endRangeKm: number | null;
  endOutsideTempC: number | null;
  locationType: LocationType;
  chargerId: string | null;
  chargerNameManual: string | null;
  acOrDc: AcOrDc | null;
  fastChargerType: string | null;
  fastChargerBrand: string | null;
  preconditioned: boolean | null;
  chargeLimitSoc: number | null;
  avgKw: number;
  maxKw: number;
  durationMinutes: number;
  totalKwhAdded: number;
}

/**
 * Abstraction over session storage. All UI/business logic depends only on this
 * interface — the IndexedDB implementation (V1) can be swapped for a Postgres/HTTP
 * implementation later (V2) without touching callers.
 */
export interface ChargeSessionRepository {
  createSession(input: CreateSessionInput): Promise<ChargeSession>;
  appendLogPoint(
    sessionId: string,
    point: Omit<LogPoint, "id" | "sessionId">
  ): Promise<void>;
  markActive(sessionId: string): Promise<void>;
  completeSession(sessionId: string, input: CompleteSessionInput): Promise<void>;
  abortSession(sessionId: string): Promise<void>;
  listSessions(): Promise<ChargeSession[]>;
  getSessionWithLogs(
    sessionId: string
  ): Promise<{ session: ChargeSession; logPoints: LogPoint[] } | null>;
  deleteSession(sessionId: string): Promise<void>;
  pruneOlderThan(days: number): Promise<number>;
  getLatestCompleteSession(): Promise<ChargeSession | null>;
}
