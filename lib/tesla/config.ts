// The browser-facing login/consent page stays on auth.tesla.com, but Tesla moved
// the server-to-server /token endpoint (code exchange, refresh, client_credentials)
// to a dedicated host — confirmed against live Tesla Fleet API docs.
export const TESLA_AUTHORIZE_URL = "https://auth.tesla.com/oauth2/v3/authorize";
export const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";

/**
 * We only ever read data — no vehicle_cmds/vehicle_charging_cmds scope is requested
 * because this app never sends commands to the car.
 */
export const TESLA_SCOPES = [
  "openid",
  "offline_access",
  "vehicle_device_data",
  "vehicle_location",
];

export const teslaEnv = {
  clientId: process.env.TESLA_CLIENT_ID ?? "",
  clientSecret: process.env.TESLA_CLIENT_SECRET ?? "",
  redirectUri: process.env.TESLA_REDIRECT_URI ?? "",
};

/**
 * Fleet API is regionalized. These are the two public regions (China is served
 * separately and out of scope here). The correct one for the signed-in account is
 * discovered once at OAuth-callback time and cached in the session — see
 * `resolveFleetApiBaseUrl` in `client.ts`. Confirmed against live Tesla Fleet API docs.
 */
export const FLEET_API_REGIONS = {
  na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
  eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
} as const;

export type FleetApiRegion = keyof typeof FLEET_API_REGIONS;

export const useFakeTeslaApi = process.env.USE_FAKE_TESLA_API === "true";

export const pollIntervalOptionsSec = [30, 60] as const;
