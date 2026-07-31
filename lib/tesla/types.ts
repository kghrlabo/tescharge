export interface TeslaTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  /** seconds */
  expires_in: number;
  token_type: string;
}

export interface TeslaVehicleListItem {
  /** numeric id used in vehicle_data / wake_up API paths */
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  /** "online" | "asleep" | "offline" */
  state: string;
}

export type ChargingState =
  | "Disconnected"
  | "NoPower"
  | "Starting"
  | "Charging"
  | "Complete"
  | "Stopped";

export interface TeslaChargeState {
  battery_level: number;
  charging_state: ChargingState | string;
  /** kW */
  charger_power: number;
  /** V */
  charger_voltage: number;
  /** A */
  charger_actual_current: number;
  /** kWh added so far this plug-in */
  charge_energy_added: number;
  minutes_to_full_charge: number;
  /** miles — rated range at the current battery level */
  battery_range: number;
  /** percent — the vehicle's actual charge-limit setting, not an app preference */
  charge_limit_soc: number;
  /** true while the pack heater is actively running to bring a cold battery up to
   * temperature for charging — the basis for auto-detecting preconditioning. */
  battery_heater_on: boolean;
  fast_charger_present: boolean;
  fast_charger_type: string;
  fast_charger_brand: string;
}

export interface TeslaVehicleState {
  /** miles — Tesla's API always reports imperial units regardless of the car's display setting */
  odometer: number;
}

export interface TeslaClimateState {
  /** Celsius */
  outside_temp: number | null;
}

export interface TeslaDriveState {
  latitude: number | null;
  longitude: number | null;
}

export interface TeslaVehicleData {
  id: number;
  vin: string;
  display_name: string;
  state: string;
  charge_state: TeslaChargeState;
  vehicle_state: TeslaVehicleState;
  climate_state: TeslaClimateState;
  drive_state: TeslaDriveState;
}

/** Flattened, camelCase shape returned by /api/vehicle/charge-status to the browser. */
export interface ChargeStatusPayload {
  /** server-stamped ms epoch this poll completed */
  timestamp: number;
  soc: number;
  chargingState: string;
  chargerPowerKw: number;
  chargerVoltageV: number;
  chargerCurrentA: number;
  energyAddedKwh: number;
  minutesToFull: number;
  /** miles — convert with lib/format.ts milesToKm() for display */
  rangeMiles: number;
  chargeLimitSoc: number;
  batteryHeaterOn: boolean;
  fastChargerPresent: boolean;
  fastChargerType: string;
  fastChargerBrand: string;
  /** miles — convert with lib/format.ts milesToKm() for display */
  odometerMiles: number;
  outsideTempC: number | null;
  latitude: number | null;
  longitude: number | null;
}

export function toChargeStatusPayload(data: TeslaVehicleData): ChargeStatusPayload {
  return {
    timestamp: Date.now(),
    soc: data.charge_state.battery_level,
    chargingState: data.charge_state.charging_state,
    chargerPowerKw: data.charge_state.charger_power,
    chargerVoltageV: data.charge_state.charger_voltage,
    chargerCurrentA: data.charge_state.charger_actual_current,
    energyAddedKwh: data.charge_state.charge_energy_added,
    minutesToFull: data.charge_state.minutes_to_full_charge,
    rangeMiles: data.charge_state.battery_range,
    chargeLimitSoc: data.charge_state.charge_limit_soc,
    batteryHeaterOn: data.charge_state.battery_heater_on,
    fastChargerPresent: data.charge_state.fast_charger_present,
    fastChargerType: data.charge_state.fast_charger_type,
    fastChargerBrand: data.charge_state.fast_charger_brand,
    odometerMiles: data.vehicle_state.odometer,
    outsideTempC: data.climate_state.outside_temp,
    latitude: data.drive_state.latitude,
    longitude: data.drive_state.longitude,
  };
}
