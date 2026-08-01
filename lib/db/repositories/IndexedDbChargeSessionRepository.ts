import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db";
import type { ChargeSession, LogPoint } from "../models";
import type {
  ChargeSessionRepository,
  CreateSessionInput,
  CompleteSessionInput,
} from "./ChargeSessionRepository";

export class IndexedDbChargeSessionRepository implements ChargeSessionRepository {
  async createSession(input: CreateSessionInput): Promise<ChargeSession> {
    const now = Date.now();
    const session: ChargeSession = {
      id: uuidv4(),
      status: "waiting",
      startedAt: input.startedAt,
      endedAt: null,
      memo: input.memo,
      startSoc: input.startSoc,
      endSoc: null,
      startOdometerKm: input.startOdometerKm,
      endOdometerKm: null,
      startRangeKm: input.startRangeKm,
      endRangeKm: null,
      startOutsideTempC: input.startOutsideTempC,
      endOutsideTempC: null,
      startLat: input.startLat,
      startLng: input.startLng,
      locationType: "other",
      chargerId: null,
      chargerNameManual: null,
      acOrDc: null,
      fastChargerType: null,
      fastChargerBrand: null,
      preconditioned: null,
      chargeLimitSoc: null,
      avgKw: null,
      maxKw: null,
      durationMinutes: null,
      totalKwhAdded: null,
      pollIntervalSec: input.pollIntervalSec,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().sessions.add(session);
    return session;
  }

  async appendLogPoint(
    sessionId: string,
    point: Omit<LogPoint, "id" | "sessionId">
  ): Promise<void> {
    await getDb().logPoints.add({ ...point, sessionId });
  }

  async markActive(sessionId: string): Promise<void> {
    await getDb().sessions.update(sessionId, {
      status: "active",
      updatedAt: Date.now(),
    });
  }

  async completeSession(sessionId: string, input: CompleteSessionInput): Promise<void> {
    await getDb().sessions.update(sessionId, {
      status: "complete",
      endedAt: input.endedAt,
      endSoc: input.endSoc,
      endOdometerKm: input.endOdometerKm,
      endRangeKm: input.endRangeKm,
      endOutsideTempC: input.endOutsideTempC,
      locationType: input.locationType,
      chargerId: input.chargerId,
      chargerNameManual: input.chargerNameManual,
      acOrDc: input.acOrDc,
      fastChargerType: input.fastChargerType,
      fastChargerBrand: input.fastChargerBrand,
      preconditioned: input.preconditioned,
      chargeLimitSoc: input.chargeLimitSoc,
      avgKw: input.avgKw,
      maxKw: input.maxKw,
      durationMinutes: input.durationMinutes,
      totalKwhAdded: input.totalKwhAdded,
      updatedAt: Date.now(),
    });
  }

  async abortSession(sessionId: string): Promise<void> {
    await getDb().sessions.update(sessionId, {
      status: "aborted",
      endedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async listSessions(): Promise<ChargeSession[]> {
    return getDb().sessions.orderBy("startedAt").reverse().toArray();
  }

  async getSessionWithLogs(
    sessionId: string
  ): Promise<{ session: ChargeSession; logPoints: LogPoint[] } | null> {
    const db = getDb();
    const session = await db.sessions.get(sessionId);
    if (!session) return null;
    const logPoints = await db.logPoints
      .where("sessionId")
      .equals(sessionId)
      .sortBy("timestamp");
    return { session, logPoints };
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = getDb();
    await db.transaction("rw", db.sessions, db.logPoints, async () => {
      await db.logPoints.where("sessionId").equals(sessionId).delete();
      await db.sessions.delete(sessionId);
    });
  }

  async pruneOlderThan(days: number): Promise<number> {
    const db = getDb();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const stale = await db.sessions.where("startedAt").below(cutoff).toArray();
    await db.transaction("rw", db.sessions, db.logPoints, async () => {
      for (const s of stale) {
        await db.logPoints.where("sessionId").equals(s.id).delete();
        await db.sessions.delete(s.id);
      }
    });
    return stale.length;
  }

  async getLatestCompleteSession(): Promise<ChargeSession | null> {
    const completed = await getDb().sessions.where("status").equals("complete").toArray();
    if (completed.length === 0) return null;
    return completed.reduce((latest, s) => (s.startedAt > latest.startedAt ? s : latest));
  }
}
