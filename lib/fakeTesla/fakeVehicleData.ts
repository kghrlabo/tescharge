import { TeslaAuthError, TeslaRateLimitError, VehicleAsleepError } from "../tesla/errors";
import type { TeslaVehicleData, ChargingState } from "../tesla/types";
import { FAKE_SCENARIOS, getScenario, type FakeScenario } from "./scenarios";

export const FAKE_VEHICLE_ID = 999000001;
export const FAKE_VIN = "FAKEVIN0000000001";
export const FAKE_DISPLAY_NAME = "Fake Model 3 (dev)";

// Tokyo Station — used as a stand-in GPS fix so location classification has something to work with.
const FAKE_LAT = 35.6812;
const FAKE_LNG = 139.7671;

interface SimulatorState {
  scenario: FakeScenario;
  pollCount: number;
  vehicleAsleep: boolean;
  /** null until fakeConnectCable() is called — the car stays "Disconnected" until then. */
  cableConnectedAtMs: number | null;
}

let state: SimulatorState | null = null;

export function fakeListScenarios() {
  return FAKE_SCENARIOS.map(({ id, label }) => ({ id, label }));
}

export function fakeResetScenario(scenarioId?: string): void {
  const scenario = getScenario(scenarioId);
  state = {
    scenario,
    pollCount: 0,
    vehicleAsleep: Boolean(scenario.injectAsleepAtStart),
    cableConnectedAtMs: null,
  };
}

function ensureState(): SimulatorState {
  if (!state) {
    fakeResetScenario();
  }
  return state as SimulatorState;
}

/** Dev-only control: simulates plugging the cable in "now". No-op if already connected. */
export function fakeConnectCable(): void {
  const s = ensureState();
  if (s.cableConnectedAtMs === null) {
    s.cableConnectedAtMs = Date.now();
  }
}

/** Linearly interpolate charger power (kW) at a given SOC from the scenario's curve anchors. */
function kwAtSoc(curve: FakeScenario["curve"], soc: number): number {
  if (soc <= curve[0].soc) return curve[0].kw;
  const last = curve[curve.length - 1];
  if (soc >= last.soc) return last.kw;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (soc >= a.soc && soc <= b.soc) {
      const t = (soc - a.soc) / (b.soc - a.soc);
      return a.kw + t * (b.kw - a.kw);
    }
  }
  return last.kw;
}

/** Euler-integrate SOC/energy forward over `chargingElapsedSimSec` seconds of simulated charging. */
function integrateCharge(
  scenario: FakeScenario,
  chargingElapsedSimSec: number
): { soc: number; kw: number; energyAddedKwh: number } {
  const STEP_SEC = 5;
  let soc = scenario.startSoc;
  let energyAddedKwh = 0;
  let kw = kwAtSoc(scenario.curve, soc);
  let t = 0;

  while (t < chargingElapsedSimSec && soc < scenario.targetSoc) {
    kw = kwAtSoc(scenario.curve, soc);
    const stepEnergyKwh = kw * (STEP_SEC / 3600);
    energyAddedKwh += stepEnergyKwh;
    soc = Math.min(scenario.targetSoc, soc + (stepEnergyKwh / scenario.batteryCapacityKwh) * 100);
    t += STEP_SEC;
  }

  kw = soc >= scenario.targetSoc ? 0 : kwAtSoc(scenario.curve, soc);
  return { soc, kw, energyAddedKwh };
}

export async function fakeWakeUp(): Promise<void> {
  const s = ensureState();
  s.vehicleAsleep = false;
}

export async function fakeGetVehicleData(): Promise<TeslaVehicleData> {
  const s = ensureState();
  s.pollCount += 1;

  if (s.scenario.injectAuthErrorAfterPolls && s.pollCount > s.scenario.injectAuthErrorAfterPolls) {
    throw new TeslaAuthError("(fake) access token rejected");
  }
  if (s.scenario.injectRateLimitAfterPolls && s.pollCount > s.scenario.injectRateLimitAfterPolls) {
    throw new TeslaRateLimitError("(fake) rate limited");
  }
  if (s.vehicleAsleep) {
    throw new VehicleAsleepError("(fake) vehicle is asleep");
  }

  let chargingState: ChargingState;
  let soc = s.scenario.startSoc;
  let kw = 0;
  let current = 0;
  let energyAddedKwh = 0;

  if (s.cableConnectedAtMs === null) {
    chargingState = "Disconnected";
  } else {
    const elapsedRealSec = (Date.now() - s.cableConnectedAtMs) / 1000;
    const chargingElapsedSimSec = elapsedRealSec * s.scenario.simulatedSecondsPerRealSecond;
    const result = integrateCharge(s.scenario, chargingElapsedSimSec);
    soc = result.soc;
    kw = result.kw;
    energyAddedKwh = result.energyAddedKwh;
    current = kw > 0 ? (kw * 1000) / s.scenario.voltage : 0;

    if (s.scenario.interruptAfterSoc && soc >= s.scenario.interruptAfterSoc) {
      chargingState = "Disconnected";
      kw = 0;
      current = 0;
    } else if (soc >= s.scenario.targetSoc) {
      chargingState = "Complete";
      soc = s.scenario.targetSoc;
      kw = 0;
      current = 0;
    } else {
      chargingState = "Charging";
    }
  }

  const remainingKwh = ((s.scenario.targetSoc - soc) / 100) * s.scenario.batteryCapacityKwh;
  const minutesToFull = kw > 0 ? Math.max(0, Math.round((remainingKwh / kw) * 60)) : 0;
  // Rough EPA-rated efficiency for a Model 3/Y-class 75kWh pack — good enough for
  // a fake-mode range figure, not meant to match any real trim precisely.
  const MILES_PER_KWH = 4.3;
  const batteryRangeMiles = (soc / 100) * s.scenario.batteryCapacityKwh * MILES_PER_KWH;

  return {
    id: FAKE_VEHICLE_ID,
    vin: FAKE_VIN,
    display_name: FAKE_DISPLAY_NAME,
    state: "online",
    charge_state: {
      battery_level: Math.round(soc),
      charging_state: chargingState,
      charger_power: Math.round(kw * 10) / 10,
      charger_voltage: chargingState === "Charging" ? s.scenario.voltage : 0,
      charger_actual_current: Math.round(current),
      charge_energy_added: Math.round(energyAddedKwh * 10) / 10,
      minutes_to_full_charge: minutesToFull,
      battery_range: Math.round(batteryRangeMiles * 10) / 10,
      charge_limit_soc: s.scenario.targetSoc,
      fast_charger_present: s.scenario.acOrDc === "DC",
      fast_charger_type: s.scenario.fastChargerType,
      fast_charger_brand: s.scenario.fastChargerBrand,
    },
    vehicle_state: {
      odometer: s.scenario.startOdometer,
    },
    climate_state: {
      outside_temp: s.scenario.outsideTempC,
    },
    drive_state: {
      latitude: FAKE_LAT,
      longitude: FAKE_LNG,
    },
  };
}
