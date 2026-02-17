import Dexie, { type Table } from 'dexie';
import type { Meal, Settings } from '../types';

class ProteinTrackerDB extends Dexie {
  meals!: Table<Meal, number>;
  settings!: Table<Settings, string>;

  constructor() {
    super('ProteinTrackerDB');
    this.version(1).stores({
      meals: '++id, timestamp, source, barcode',
      settings: 'id',
    });

    this.version(2).stores({
      meals: '++id, timestamp, source, barcode, meal_type',
      settings: 'id',
    }).upgrade(tx =>
      tx.table('meals').toCollection().modify(meal => {
        if (!meal.meal_type) {
          meal.meal_type = 'snack';
        }
      })
    );
  }
}

export const db = new ProteinTrackerDB();

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get('user_settings');
  return settings ?? { id: 'user_settings', daily_goal: 120, api_key: '' };
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...settings, id: 'user_settings' });
}
