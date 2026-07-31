export const TESLA_AUTH_BASE_URL = "https://auth.tesla.com/oauth2/v3";

/**
 * Mostly read-only: `vehicle_charging_cmds` is requested only for set_charge_limit
 * (the charge-limit control on the measuring screen). No broader `vehicle_cmds`
 * scope is requested since nothing else in this app sends commands to the car.
 *
 * Accounts that connected before this scope was added won't have it on their stored
 * token — they'll need to disconnect/reconnect in Settings before the charge-limit
 * control will work against the real API.
 */
export const TESLA_SCOPES = [
  "openid",
  "offline_access",
  "vehicle_device_data",
  "vehicle_location",
  "vehicle_charging_cmds",
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
 * `resolveFleetApiBaseUrl` in `client.ts`.
 *
 * NOTE: verify these hostnames and the region-discovery endpoint path against the
 * live developer.tesla.com docs once a real Developer account exists — they could
 * not be fetched directly while writing this (developer.tesla.com blocked automated
 * fetches), so this is implemented from best available knowledge and should be the
 * first thing double-checked during Phase 0 real-account integration testing.
 */
export const FLEET_API_REGIONS = {
  na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
  eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
} as const;

export type FleetApiRegion = keyof typeof FLEET_API_REGIONS;

export const useFakeTeslaApi = process.env.USE_FAKE_TESLA_API === "true";

export const pollIntervalOptionsSec = [30, 60] as const;
