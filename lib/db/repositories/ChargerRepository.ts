import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db";
import { DEFAULT_SETTINGS, type Charger } from "../models";

export type ChargerInput = Pick<Charger, "name">;

export interface ChargerRepository {
  list(): Promise<Charger[]>;
  create(input: ChargerInput): Promise<Charger>;
  update(id: string, patch: Partial<ChargerInput>): Promise<void>;
  delete(id: string): Promise<void>;
}

const SEED_CHARGERS: Omit<Charger, "createdAt" | "updatedAt">[] = [
  { id: "seed-home", name: "自宅" },
  { id: "seed-sc-150", name: "SC 最大150 kW" },
  { id: "seed-sc-250", name: "SC 最大250 kW" },
];

export class IndexedDbChargerRepository implements ChargerRepository {
  private async ensureSeeded(): Promise<void> {
    const db = getDb();
    const settings = (await db.settings.get("app-settings")) ?? DEFAULT_SETTINGS;
    if (settings.chargersSeeded) return;

    const now = Date.now();
    await db.chargers.bulkAdd(SEED_CHARGERS.map((c) => ({ ...c, createdAt: now, updatedAt: now })));
    await db.settings.put({ ...settings, chargersSeeded: true });
  }

  async list(): Promise<Charger[]> {
    await this.ensureSeeded();
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
}
