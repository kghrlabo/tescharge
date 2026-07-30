import { getDb } from "../db";
import { DEFAULT_SETTINGS, type AppSettings } from "../models";

export interface SettingsRepository {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<Omit<AppSettings, "id">>): Promise<AppSettings>;
}

export class IndexedDbSettingsRepository implements SettingsRepository {
  async getSettings(): Promise<AppSettings> {
    const existing = await getDb().settings.get("app-settings");
    if (existing) return existing;
    await getDb().settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  async updateSettings(patch: Partial<Omit<AppSettings, "id">>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = { ...current, ...patch, id: "app-settings" };
    await getDb().settings.put(updated);
    return updated;
  }
}
