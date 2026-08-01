import {
  TESLA_AUTHORIZE_URL,
  TESLA_TOKEN_URL,
  TESLA_SCOPES,
  teslaEnv,
  FLEET_API_REGIONS,
  useFakeTeslaApi,
} from "./config";
import {
  TeslaApiError,
  TeslaAuthError,
  TeslaRateLimitError,
  VehicleAsleepError,
} from "./errors";
import type {
  TeslaTokenResponse,
  TeslaVehicleListItem,
  TeslaVehicleData,
} from "./types";
import {
  fakeExchangeCodeForToken,
  fakeRefreshAccessToken,
  fakeListVehicles,
} from "../fakeTesla/fakeAuth";
import { fakeWakeUp, fakeGetVehicleData } from "../fakeTesla/fakeVehicleData";

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: teslaEnv.clientId,
    redirect_uri: teslaEnv.redirectUri,
    response_type: "code",
    scope: TESLA_SCOPES.join(" "),
    state,
  });
  return `${TESLA_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  fakeScenarioId?: string
): Promise<TeslaTokenResponse> {
  if (useFakeTeslaApi) return fakeExchangeCodeForToken(fakeScenarioId);

  const res = await fetch(TESLA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: teslaEnv.clientId,
      client_secret: teslaEnv.clientSecret,
      code,
      redirect_uri: teslaEnv.redirectUri,
      audience: FLEET_API_REGIONS.na,
    }),
  });
  if (!res.ok) {
    throw new TeslaApiError(
      `Token exchange failed: ${res.status} ${await safeText(res)}`,
      res.status
    );
  }
  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TeslaTokenResponse> {
  if (useFakeTeslaApi) return fakeRefreshAccessToken();

  const res = await fetch(TESLA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: teslaEnv.clientId,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new TeslaAuthError(
      `Token refresh failed: ${res.status} ${await safeText(res)}`
    );
  }
  // Tesla rotates the refresh token on every refresh — the caller MUST persist the
  // new refresh_token from this response, not just the access_token.
  return res.json();
}

export async function resolveFleetApiBaseUrl(accessToken: string): Promise<string> {
  if (useFakeTeslaApi) return "fake://tesla";

  for (const base of [FLEET_API_REGIONS.na, FLEET_API_REGIONS.eu]) {
    try {
      const res = await fetch(`${base}/api/1/users/region`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data?.response?.fleet_api_base_url ?? base;
      }
    } catch {
      // try the next region
    }
  }
  // Region discovery failed outright — fall back to NA rather than hard-failing login.
  return FLEET_API_REGIONS.na;
}

export async function listVehicles(
  accessToken: string,
  fleetApiBaseUrl: string
): Promise<TeslaVehicleListItem[]> {
  if (useFakeTeslaApi) return fakeListVehicles();

  const res = await fetch(`${fleetApiBaseUrl}/api/1/vehicles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw mapErrorResponse(res);
  const data = await res.json();
  return data.response as TeslaVehicleListItem[];
}

export async function wakeUp(
  accessToken: string,
  fleetApiBaseUrl: string,
  vehicleId: number
): Promise<void> {
  if (useFakeTeslaApi) return fakeWakeUp();

  const res = await fetch(
    `${fleetApiBaseUrl}/api/1/vehicles/${vehicleId}/wake_up`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw mapErrorResponse(res);
}

export async function getVehicleData(
  accessToken: string,
  fleetApiBaseUrl: string,
  vehicleId: number
): Promise<TeslaVehicleData> {
  if (useFakeTeslaApi) return fakeGetVehicleData();

  const endpoints = ["charge_state", "vehicle_state", "climate_state", "drive_state"].join(";");
  const res = await fetch(
    `${fleetApiBaseUrl}/api/1/vehicles/${vehicleId}/vehicle_data?endpoints=${endpoints}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw mapErrorResponse(res);
  const data = await res.json();
  return data.response as TeslaVehicleData;
}

/**
 * Wakes the vehicle if asleep and retries with backoff until vehicle_data succeeds or the
 * attempt budget is exhausted. Centralizing this here means the /api/vehicle/charge-status
 * route (and the fake API) don't each need their own wake/backoff logic.
 */
export async function ensureAwakeAndGetVehicleData(
  accessToken: string,
  fleetApiBaseUrl: string,
  vehicleId: number,
  maxAttempts = 5
): Promise<TeslaVehicleData> {
  let wokeUp = false;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await getVehicleData(accessToken, fleetApiBaseUrl, vehicleId);
    } catch (err) {
      lastError = err;
      if (err instanceof VehicleAsleepError) {
        if (!wokeUp) {
          await wakeUp(accessToken, fleetApiBaseUrl, vehicleId);
          wokeUp = true;
        }
        await sleep(backoffMs(attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new TeslaApiError("Vehicle did not wake up in time", 408);
}

function mapErrorResponse(res: Response): TeslaApiError {
  if (res.status === 401) return new TeslaAuthError();
  if (res.status === 429) return new TeslaRateLimitError();
  if (res.status === 408) return new VehicleAsleepError();
  return new TeslaApiError(`Tesla API error: ${res.status}`, res.status);
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function backoffMs(attempt: number): number {
  return Math.min(2000 * 2 ** attempt, 15000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
