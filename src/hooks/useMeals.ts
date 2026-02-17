import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Meal } from '../types';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function useMealsForDay(date: Date) {
  const start = startOfDay(date);
  const end = endOfDay(date);

  const meals = useLiveQuery(
    () =>
      db.meals
        .where('timestamp')
        .between(start, end, true, true)
        .reverse()
        .sortBy('timestamp'),
    [start.getTime()]
  );

  return meals;
}

export function useMealsForRange(from: Date, to: Date) {
  const start = startOfDay(from);
  const end = endOfDay(to);

  return useLiveQuery(
    () =>
      db.meals
        .where('timestamp')
        .between(start, end, true, true)
        .toArray(),
    [start.getTime(), end.getTime()]
  );
}

export async function addMeal(meal: Omit<Meal, 'id'>): Promise<number> {
  return db.meals.add(meal as Meal);
}

export async function updateMeal(id: number, changes: Partial<Meal>): Promise<void> {
  await db.meals.update(id, changes);
}

export async function deleteMeal(id: number): Promise<void> {
  await db.meals.delete(id);
}
