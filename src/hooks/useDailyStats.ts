import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../services/db';
import type { DailyStats } from '../types';
import { useEffect, useState } from 'react';

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

export function useDailyStats(date: Date): DailyStats | undefined {
  const [goal, setGoal] = useState(120);
  const start = startOfDay(date);
  const end = endOfDay(date);

  useEffect(() => {
    getSettings().then((s) => setGoal(s.daily_goal));
  }, []);

  const stats = useLiveQuery(async () => {
    const meals = await db.meals
      .where('timestamp')
      .between(start, end, true, true)
      .toArray();

    const totalProtein = meals.reduce((sum, m) => sum + m.protein_g, 0);
    const totalCalories = meals.reduce((sum, m) => sum + (m.calories ?? 0), 0);

    return {
      totalProtein,
      totalCalories,
      mealCount: meals.length,
      goalProgress: goal > 0 ? Math.min(totalProtein / goal, 1) : 0,
    };
  }, [start.getTime(), goal]);

  return stats;
}
