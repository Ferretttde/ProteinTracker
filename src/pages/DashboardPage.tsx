import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProteinProgress } from '../components/Dashboard/ProteinProgress';
import { DailySummary } from '../components/Dashboard/DailySummary';
import { MealList } from '../components/MealLog/MealList';
import { useMealsForDay } from '../hooks/useMeals';
import { useDailyStats } from '../hooks/useDailyStats';
import { getSettings } from '../services/db';
import styles from './Pages.module.css';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  const today = startOfToday();
  if (date.getTime() === today.getTime()) return 'Heute';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.getTime() === yesterday.getTime()) return 'Gestern';

  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(startOfToday);
  const meals = useMealsForDay(selectedDate);
  const stats = useDailyStats(selectedDate);
  const [goal, setGoal] = useState(120);
  const navigate = useNavigate();

  useEffect(() => {
    getSettings().then((s) => setGoal(s.daily_goal));
  }, []);

  const isToday = selectedDate.getTime() === startOfToday().getTime();

  function goToPrevDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }

  function goToNextDay() {
    if (!isToday) {
      setSelectedDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 1);
        return d;
      });
    }
  }

  return (
    <div>
      <div className={styles.dateNav}>
        <button className={styles.dateNavBtn} onClick={goToPrevDay} aria-label="Vorheriger Tag">
          &#8249;
        </button>
        <span className={styles.dateNavLabel}>{formatDate(selectedDate)}</span>
        <button
          className={styles.dateNavBtn}
          onClick={goToNextDay}
          disabled={isToday}
          aria-label="Nächster Tag"
        >
          &#8250;
        </button>
      </div>
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
      {!isToday && (
        <button
          className={styles.addForDayBtn}
          onClick={() => navigate(`/add?date=${toDateParam(selectedDate)}`)}
        >
          + Eintrag hinzufügen
        </button>
      )}
    </div>
  );
}
