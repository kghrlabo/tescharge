"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ChargeStatusPayload } from "../tesla/types";
import { chargeSessionRepository, settingsRepository } from "../db/repositories";
import type { CompleteSessionInput } from "../db/repositories/ChargeSessionRepository";
import { milesToKm } from "../format";
import {
  chargeMachineReducer,
  createIdleState,
  toLogPointDraft,
  isSessionEndedChargingState,
  detectPreconditioned,
  type ChargeMachineState,
  type LocationOverride,
} from "./chargeStateMachine";

type FetchResult =
  | { ok: true; payload: ChargeStatusPayload }
  | { ok: false; error: string; status: number };

async function fetchChargeStatus(): Promise<FetchResult> {
  try {
    const res = await fetch("/api/vehicle/charge-status", { cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error ?? "unknown_error", status: res.status };
    }
    return { ok: true, payload: (await res.json()) as ChargeStatusPayload };
  } catch {
    return { ok: false, error: "network_error", status: 0 };
  }
}

async function buildCompleteInput(
  current: Extract<ChargeMachineState, { status: "charging" }>,
  payload: ChargeStatusPayload
): Promise<CompleteSessionInput> {
  const locationType = current.locationOverride?.type ?? "other";
  const chargerId = current.locationOverride?.chargerId ?? null;
  const chargerNameManual = current.locationOverride?.chargerNameManual ?? null;

  const kwValues = current.logPoints.map((p) => p.chargerPowerKw).filter((v) => v > 0);
  const maxKw = kwValues.length ? Math.max(...kwValues) : 0;
  const avgKw = kwValues.length ? kwValues.reduce((a, b) => a + b, 0) / kwValues.length : 0;
  const durationMinutes = Math.max(
    0,
    Math.round((payload.timestamp - current.chargingStartedAt) / 60000)
  );

  return {
    endedAt: payload.timestamp,
    endSoc: payload.soc,
    endOdometerKm: milesToKm(payload.odometerMiles),
    endRangeKm: milesToKm(payload.rangeMiles),
    endOutsideTempC: payload.outsideTempC,
    locationType,
    chargerId,
    chargerNameManual,
    acOrDc: current.startPayload.fastChargerPresent ? "DC" : "AC",
    fastChargerType: current.startPayload.fastChargerType || null,
    fastChargerBrand: current.startPayload.fastChargerBrand || null,
    preconditioned: detectPreconditioned(current.logPoints),
    chargeLimitSoc: current.chargeLimitSoc,
    avgKw: Math.round(avgKw * 10) / 10,
    maxKw: Math.round(maxKw * 10) / 10,
    durationMinutes,
    totalKwhAdded: payload.energyAddedKwh,
  };
}

/** 429-triggered backoff: skip ticks for this long rather than reconfiguring the timer. */
const RATE_LIMIT_BACKOFF_MS = 120_000;

export function useChargePolling() {
  const [state, dispatch] = useReducer(chargeMachineReducer, createIdleState());

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const pollIntervalSecRef = useRef(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef(false);
  const skipUntilRef = useRef(0);

  // Stable across renders (empty deps): everything it needs comes from refs, never
  // from `state`/props directly, so this never goes stale and never needs re-arming.
  const poll = useCallback(async () => {
    if (pollingRef.current) return;
    if (Date.now() < skipUntilRef.current) return;

    const current = stateRef.current;
    if (current.status !== "waitingForCable" && current.status !== "charging") return;

    pollingRef.current = true;
    try {
      const result = await fetchChargeStatus();

      if (!result.ok) {
        if (result.status === 429) {
          skipUntilRef.current = Date.now() + RATE_LIMIT_BACKOFF_MS;
        }
        dispatch({ type: "POLL_ERROR", message: result.error });
        return;
      }

      const payload = result.payload;
      const cs = payload.chargingState;

      if (current.status === "charging" && isSessionEndedChargingState(cs)) {
        const completeInput = await buildCompleteInput(current, payload);
        await chargeSessionRepository.completeSession(current.sessionId, completeInput);
        dispatch({ type: "SESSION_FINISHED", sessionId: current.sessionId, summary: completeInput });
        return;
      }

      if (current.status === "waitingForCable" && cs === "Charging") {
        await chargeSessionRepository.markActive(current.sessionId);
        await chargeSessionRepository.appendLogPoint(current.sessionId, toLogPointDraft(payload, 0));
      } else if (current.status === "charging") {
        const elapsedSeconds = Math.max(
          0,
          Math.round((payload.timestamp - current.chargingStartedAt) / 1000)
        );
        await chargeSessionRepository.appendLogPoint(
          current.sessionId,
          toLogPointDraft(payload, elapsedSeconds)
        );
      }

      dispatch({ type: "POLL_SUCCESS", payload });
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const pollable = state.status === "waitingForCable" || state.status === "charging";
    if (pollable) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => void poll(), pollIntervalSecRef.current * 1000);
        void poll();
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [state.status, poll]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startMeasurement = useCallback(
    async (options: {
      locationOverride: LocationOverride | null;
      memo: string | null;
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const settings = await settingsRepository.getSettings();
      pollIntervalSecRef.current = settings.pollIntervalSec;
      skipUntilRef.current = 0;

      const result = await fetchChargeStatus();
      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      const payload = result.payload;
      const session = await chargeSessionRepository.createSession({
        startedAt: payload.timestamp,
        memo: options.memo,
        startSoc: payload.soc,
        startOdometerKm: milesToKm(payload.odometerMiles),
        startRangeKm: milesToKm(payload.rangeMiles),
        startOutsideTempC: payload.outsideTempC,
        startLat: payload.latitude,
        startLng: payload.longitude,
        pollIntervalSec: settings.pollIntervalSec,
      });

      dispatch({
        type: "START_PRESSED",
        sessionId: session.id,
        payload,
        locationOverride: options.locationOverride,
      });
      return { ok: true };
    },
    []
  );

  const changeLocationOverride = useCallback((value: LocationOverride | null) => {
    dispatch({ type: "LOCATION_OVERRIDE_CHANGED", value });
  }, []);

  const cancelMeasurement = useCallback(async () => {
    const current = stateRef.current;
    if (current.status === "waitingForCable" || current.status === "charging") {
      await chargeSessionRepository.abortSession(current.sessionId);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    dispatch({ type: "RESET" });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  // Exposed so dev-only controls (e.g. the fake "connect cable" button) can force
  // an immediate poll instead of waiting up to a full interval for the next tick.
  const pollNow = useCallback(() => {
    void poll();
  }, [poll]);

  return {
    state,
    startMeasurement,
    changeLocationOverride,
    cancelMeasurement,
    reset,
    pollNow,
  };
}
