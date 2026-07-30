import type { TeslaTokenResponse, TeslaVehicleListItem } from "../tesla/types";
import { FAKE_VEHICLE_ID, FAKE_VIN, FAKE_DISPLAY_NAME, fakeResetScenario } from "./fakeVehicleData";

export const FAKE_AUTH_CODE = "fake-code";

export async function fakeExchangeCodeForToken(scenarioId?: string): Promise<TeslaTokenResponse> {
  // A fresh "connect" always restarts the simulated charge session from scratch.
  fakeResetScenario(scenarioId);
  return {
    access_token: `fake-access-token`,
    refresh_token: `fake-refresh-token`,
    expires_in: 8 * 60 * 60,
    token_type: "Bearer",
  };
}

export async function fakeRefreshAccessToken(): Promise<TeslaTokenResponse> {
  return {
    access_token: `fake-access-token-${Date.now()}`,
    refresh_token: `fake-refresh-token-${Date.now()}`,
    expires_in: 8 * 60 * 60,
    token_type: "Bearer",
  };
}

export async function fakeListVehicles(): Promise<TeslaVehicleListItem[]> {
  return [
    {
      id: FAKE_VEHICLE_ID,
      vehicle_id: FAKE_VEHICLE_ID,
      vin: FAKE_VIN,
      display_name: FAKE_DISPLAY_NAME,
      state: "online",
    },
  ];
}
