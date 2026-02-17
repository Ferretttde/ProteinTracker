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

export async function exportMealsJSON(): Promise<void> {
  const meals = await db.meals.toArray();
  const data = meals.map(({ photo: _photo, ...meal }) => meal);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proteintracker-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportMealsCSV(): Promise<void> {
  const meals = await db.meals.toArray();
  const header = 'id,timestamp,description,protein_g,calories,source,meal_type,manually_corrected,confidence,barcode';
  const rows = meals.map(m =>
    [
      m.id,
      new Date(m.timestamp).toISOString(),
      `"${m.description.replace(/"/g, '""')}"`,
      m.protein_g,
      m.calories ?? '',
      m.source,
      m.meal_type,
      m.manually_corrected,
      m.confidence ?? '',
      m.barcode ?? '',
    ].join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proteintracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importMealsJSON(file: File): Promise<number> {
  const text = await file.text();
  const data = JSON.parse(text) as Omit<Meal, 'id'>[];
  const meals = data.map(m => ({
    ...m,
    timestamp: new Date(m.timestamp),
    id: undefined,
  }));
  await db.meals.bulkAdd(meals as Meal[]);
  return meals.length;
}
