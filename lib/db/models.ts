export type SessionStatus = "waiting" | "active" | "complete" | "aborted";
export type LocationType = "home" | "charger" | "other";
export type AcOrDc = "AC" | "DC";

export interface ChargeSession {
  /** UUID — chosen client-side so it maps 1:1 to a future Postgres uuid PK */
  id: string;
  status: SessionStatus;
  startedAt: number;
  endedAt: number | null;
  startSoc: number;
  endSoc: number | null;
  /** km */
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  /** km — rated range at the current battery level; null for sessions recorded before this field existed */
  startRangeKm: number | null;
  endRangeKm: number | null;
  startOutsideTempC: number | null;
  endOutsideTempC: number | null;
  startLat: number | null;
  startLng: number | null;
  locationType: LocationType;
  chargerId: string | null;
  chargerNameManual: string | null;
  acOrDc: AcOrDc | null;
  fastChargerType: string | null;
  fastChargerBrand: string | null;
  preconditioned: boolean | null;
  /** percent — the vehicle's charge-limit setting as of session completion; null for sessions recorded before this field existed */
  chargeLimitSoc: number | null;
  avgKw: number | null;
  maxKw: number | null;
  durationMinutes: number | null;
  totalKwhAdded: number | null;
  pollIntervalSec: number;
  createdAt: number;
  updatedAt: number;
}

export interface LogPoint {
  /** autoincrement — never referenced outside its own session, no need for a UUID */
  id?: number;
  sessionId: string;
  timestamp: number;
  elapsedSeconds: number;
  soc: number;
  chargerPowerKw: number;
  chargerVoltageV: number;
  chargerCurrentA: number;
  energyAddedKwh: number;
  minutesToFull: number;
  chargingState: string;
}

export type PreconInputMethod = "toggle-per-session" | "always-yes" | "always-no";

export interface AppSettings {
  id: "app-settings";
  pollIntervalSec: 30 | 60;
  retentionDays: number;
  electricityRatePerKwh: number | null;
  homeLat: number | null;
  homeLng: number | null;
  homeRadiusM: number;
  preconDefault: boolean;
  preconInputMethod: PreconInputMethod;
}

export interface Charger {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: AcOrDc;
  maxKw: number;
  brand: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: "app-settings",
  pollIntervalSec: 30,
  retentionDays: 365,
  electricityRatePerKwh: null,
  homeLat: null,
  homeLng: null,
  homeRadiusM: 150,
  preconDefault: false,
  preconInputMethod: "toggle-per-session",
};
