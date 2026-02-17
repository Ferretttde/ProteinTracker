import { useEffect, useState } from 'react';
import { ProteinProgress } from '../components/Dashboard/ProteinProgress';
import { DailySummary } from '../components/Dashboard/DailySummary';
import { MealList } from '../components/MealLog/MealList';
import { useMealsForDay } from '../hooks/useMeals';
import { useDailyStats } from '../hooks/useDailyStats';
import { getSettings } from '../services/db';

export function DashboardPage() {
  const today = new Date();
  const meals = useMealsForDay(today);
  const stats = useDailyStats(today);
  const [goal, setGoal] = useState(120);

  useEffect(() => {
    getSettings().then((s) => setGoal(s.daily_goal));
  }, []);

  return (
    <div>
      <ProteinProgress
        current={stats?.totalProtein ?? 0}
        goal={goal}
        progress={stats?.goalProgress ?? 0}
      />
      <DailySummary
        totalCalories={stats?.totalCalories ?? 0}
        mealCount={stats?.mealCount ?? 0}
      />
      <MealList meals={meals} />
    </div>
  );
}
