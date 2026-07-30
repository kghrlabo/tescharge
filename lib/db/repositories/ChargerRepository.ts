import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db";
import type { Charger } from "../models";
import { haversineDistanceMeters } from "../../location/geo";

export type ChargerInput = Omit<Charger, "id" | "createdAt" | "updatedAt">;

export interface ChargerRepository {
  list(): Promise<Charger[]>;
  create(input: ChargerInput): Promise<Charger>;
  update(id: string, patch: Partial<ChargerInput>): Promise<void>;
  delete(id: string): Promise<void>;
  /** Nearest charger within `maxDistanceM`, or null if none registered within range. */
  findNearest(lat: number, lng: number, maxDistanceM?: number): Promise<Charger | null>;
}

export class IndexedDbChargerRepository implements ChargerRepository {
  async list(): Promise<Charger[]> {
    return getDb().chargers.orderBy("name").toArray();
  }

  async create(input: ChargerInput): Promise<Charger> {
    const now = Date.now();
    const charger: Charger = { ...input, id: uuidv4(), createdAt: now, updatedAt: now };
    await getDb().chargers.add(charger);
    return charger;
  }

  async update(id: string, patch: Partial<ChargerInput>): Promise<void> {
    await getDb().chargers.update(id, { ...patch, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await getDb().chargers.delete(id);
  }

  async findNearest(
    lat: number,
    lng: number,
    maxDistanceM = 200
  ): Promise<Charger | null> {
    const all = await this.list();
    let nearest: Charger | null = null;
    let nearestDist = Infinity;
    for (const charger of all) {
      const dist = haversineDistanceMeters(lat, lng, charger.lat, charger.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = charger;
      }
    }
    return nearest && nearestDist <= maxDistanceM ? nearest : null;
  }
}
