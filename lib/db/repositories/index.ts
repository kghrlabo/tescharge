import { IndexedDbChargeSessionRepository } from "./IndexedDbChargeSessionRepository";
import { IndexedDbSettingsRepository } from "./SettingsRepository";
import { IndexedDbChargerRepository } from "./ChargerRepository";

export type { ChargeSessionRepository, CreateSessionInput, CompleteSessionInput } from "./ChargeSessionRepository";
export type { SettingsRepository } from "./SettingsRepository";
export type { ChargerRepository, ChargerInput } from "./ChargerRepository";

/**
 * Single swap point for a future Postgres/HTTP-backed implementation — everything
 * else in the app should import these singletons, never `dexie` or `getDb` directly.
 */
export const chargeSessionRepository = new IndexedDbChargeSessionRepository();
export const settingsRepository = new IndexedDbSettingsRepository();
export const chargerRepository = new IndexedDbChargerRepository();
