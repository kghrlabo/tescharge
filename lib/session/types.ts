export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  /** epoch milliseconds */
  accessTokenExpiresAt?: number;
  /** Tesla's numeric vehicle id, used in vehicle_data/wake_up API paths */
  vehicleId?: number;
  vin?: string;
  vehicleDisplayName?: string;
  /** region-resolved Fleet API base URL, cached so we don't re-resolve on every call */
  fleetApiBaseUrl?: string;
}

export function isConnected(session: SessionData): boolean {
  return Boolean(session.accessToken && session.refreshToken && session.vehicleId && session.fleetApiBaseUrl);
}
