import type { LocationType, LogPoint } from "../db/models";
import type { CompleteSessionInput } from "../db/repositories/ChargeSessionRepository";
import type { ChargeStatusPayload } from "../tesla/types";

export type LogPointDraft = Omit<LogPoint, "id" | "sessionId">;

export function toLogPointDraft(
  payload: ChargeStatusPayload,
  elapsedSeconds: number
): LogPointDraft {
  return {
    timestamp: payload.timestamp,
    elapsedSeconds,
    soc: payload.soc,
    chargerPowerKw: payload.chargerPowerKw,
    chargerVoltageV: payload.chargerVoltageV,
    chargerCurrentA: payload.chargerCurrentA,
    energyAddedKwh: payload.energyAddedKwh,
    minutesToFull: payload.minutesToFull,
    chargingState: payload.chargingState,
    batteryHeaterOn: payload.batteryHeaterOn,
  };
}

/** How long to watch battery_heater_on before concluding it's never coming on. */
const PRECON_DETECTION_WINDOW_SEC = 5 * 60;

/**
 * Auto-detects whether the battery was already warm when charging began, from
 * the vehicle's own battery_heater_on telemetry — replaces what used to be a
 * manual per-session toggle.
 *
 * - Heater seen on at any point in the first 5 minutes → not preconditioned (false),
 *   decided as soon as it's observed.
 * - 5 minutes pass with the heater never on → preconditioned (true).
 * - Otherwise (still early, heater not yet seen on) → undetermined (null).
 */
export function detectPreconditioned(logPoints: LogPointDraft[]): boolean | null {
  const earlyPoints = logPoints.filter((p) => p.elapsedSeconds <= PRECON_DETECTION_WINDOW_SEC);
  if (earlyPoints.some((p) => p.batteryHeaterOn)) return false;
  const latest = logPoints[logPoints.length - 1];
  if (latest && latest.elapsedSeconds >= PRECON_DETECTION_WINDOW_SEC) return true;
  return null;
}

/** User's manual correction of where/what this session is charging at. */
export interface LocationOverride {
  type: LocationType;
  chargerId: string | null;
  chargerNameManual: string | null;
}

export type ChargeMachineState =
  | { status: "idle" }
  | {
      status: "waitingForCable";
      sessionId: string;
      startPayload: ChargeStatusPayload;
      locationOverride: LocationOverride | null;
      /** percent — the vehicle's actual charge-limit setting, kept in sync via POLL_SUCCESS. */
      chargeLimitSoc: number;
      consecutiveErrors: number;
      lastErrorMessage: string | null;
    }
  | {
      status: "charging";
      sessionId: string;
      startPayload: ChargeStatusPayload;
      locationOverride: LocationOverride | null;
      chargeLimitSoc: number;
      chargingStartedAt: number;
      logPoints: LogPointDraft[];
      consecutiveErrors: number;
      lastErrorMessage: string | null;
    }
  | {
      status: "finished";
      sessionId: string;
      summary: CompleteSessionInput;
    };

export type ChargeMachineEvent =
  | {
      type: "START_PRESSED";
      sessionId: string;
      payload: ChargeStatusPayload;
    }
  | { type: "POLL_SUCCESS"; payload: ChargeStatusPayload }
  | { type: "POLL_ERROR"; message: string }
  | { type: "LOCATION_OVERRIDE_CHANGED"; value: LocationOverride | null }
  | { type: "SESSION_FINISHED"; sessionId: string; summary: CompleteSessionInput }
  | { type: "RESET" };

export function createIdleState(): ChargeMachineState {
  return { status: "idle" };
}

export function isPollableState(state: ChargeMachineState): boolean {
  return state.status === "waitingForCable" || state.status === "charging";
}

const TERMINAL_CHARGING_STATES = new Set(["Complete", "Disconnected"]);

export function isSessionEndedChargingState(chargingState: string): boolean {
  return TERMINAL_CHARGING_STATES.has(chargingState);
}

export function chargeMachineReducer(
  state: ChargeMachineState,
  event: ChargeMachineEvent
): ChargeMachineState {
  switch (event.type) {
    case "START_PRESSED": {
      if (state.status !== "idle") return state;
      return {
        status: "waitingForCable",
        sessionId: event.sessionId,
        startPayload: event.payload,
        locationOverride: null,
        chargeLimitSoc: event.payload.chargeLimitSoc,
        consecutiveErrors: 0,
        lastErrorMessage: null,
      };
    }

    case "LOCATION_OVERRIDE_CHANGED": {
      if (state.status !== "waitingForCable" && state.status !== "charging") return state;
      return { ...state, locationOverride: event.value };
    }

    case "POLL_SUCCESS": {
      if (state.status === "waitingForCable") {
        if (event.payload.chargingState === "Charging") {
          return {
            status: "charging",
            sessionId: state.sessionId,
            startPayload: state.startPayload,
            locationOverride: state.locationOverride,
            chargeLimitSoc: event.payload.chargeLimitSoc,
            chargingStartedAt: event.payload.timestamp,
            logPoints: [toLogPointDraft(event.payload, 0)],
            consecutiveErrors: 0,
            lastErrorMessage: null,
          };
        }
        return {
          ...state,
          chargeLimitSoc: event.payload.chargeLimitSoc,
          consecutiveErrors: 0,
          lastErrorMessage: null,
        };
      }

      if (state.status === "charging") {
        const elapsedSeconds = Math.max(
          0,
          Math.round((event.payload.timestamp - state.chargingStartedAt) / 1000)
        );
        return {
          ...state,
          chargeLimitSoc: event.payload.chargeLimitSoc,
          logPoints: [...state.logPoints, toLogPointDraft(event.payload, elapsedSeconds)],
          consecutiveErrors: 0,
          lastErrorMessage: null,
        };
      }

      return state;
    }

    case "POLL_ERROR": {
      if (state.status === "waitingForCable" || state.status === "charging") {
        return {
          ...state,
          consecutiveErrors: state.consecutiveErrors + 1,
          lastErrorMessage: event.message,
        };
      }
      return state;
    }

    case "SESSION_FINISHED":
      return { status: "finished", sessionId: event.sessionId, summary: event.summary };

    case "RESET":
      return createIdleState();

    default:
      return state;
  }
}
