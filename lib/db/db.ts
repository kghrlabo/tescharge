import Dexie, { type Table } from "dexie";
import type { ChargeSession, LogPoint, AppSettings, Charger } from "./models";

export class TeschargeDB extends Dexie {
  sessions!: Table<ChargeSession, string>;
  logPoints!: Table<LogPoint, number>;
  settings!: Table<AppSettings, string>;
  chargers!: Table<Charger, string>;

  constructor() {
    super("tescharge");
    this.version(1).stores({
      sessions: "id, startedAt, status, locationType, chargerId",
      logPoints: "++id, sessionId, [sessionId+timestamp]",
      settings: "id",
      chargers: "id, name",
    });
  }
}

let instance: TeschargeDB | null = null;

/**
 * Lazily constructs the Dexie instance on first use, in the browser only. Next.js
 * renders Client Component modules during SSR too, so a module-scope `new Dexie(...)`
 * would crash on the server — everything here must go through this function instead.
 */
export function getDb(): TeschargeDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB (tescharge DB) is only available in the browser");
  }
  if (!instance) {
    instance = new TeschargeDB();
  }
  return instance;
}
