import { haversineDistanceMeters } from "./geo";
import type { AppSettings, Charger, LocationType } from "../db/models";

const CHARGER_MATCH_RADIUS_M = 200;

export interface LocationClassification {
  locationType: LocationType;
  chargerId: string | null;
  chargerName: string | null;
}

/**
 * Pure function — takes home settings and the charger master list as plain data
 * rather than reading repositories itself, so it stays trivially testable and has
 * no dependency direction issues with lib/db.
 */
export function classifyLocation(
  lat: number | null,
  lng: number | null,
  settings: Pick<AppSettings, "homeLat" | "homeLng" | "homeRadiusM">,
  chargers: Charger[]
): LocationClassification {
  if (lat === null || lng === null) {
    return { locationType: "other", chargerId: null, chargerName: null };
  }

  if (settings.homeLat !== null && settings.homeLng !== null) {
    const distToHome = haversineDistanceMeters(lat, lng, settings.homeLat, settings.homeLng);
    if (distToHome <= settings.homeRadiusM) {
      return { locationType: "home", chargerId: null, chargerName: null };
    }
  }

  let nearest: Charger | null = null;
  let nearestDist = Infinity;
  for (const charger of chargers) {
    const dist = haversineDistanceMeters(lat, lng, charger.lat, charger.lng);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = charger;
    }
  }

  if (nearest && nearestDist <= CHARGER_MATCH_RADIUS_M) {
    return { locationType: "charger", chargerId: nearest.id, chargerName: nearest.name };
  }

  return { locationType: "other", chargerId: null, chargerName: null };
}
