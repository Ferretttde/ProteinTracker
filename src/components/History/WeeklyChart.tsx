import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { useMealsForRange } from '../../hooks/useMeals';
import { useEffect, useState } from 'react';
import { getSettings } from '../../services/db';
import styles from './History.module.css';

interface DayData {
  label: string;
  protein: number;
  calories: number;
}

export function WeeklyChart() {
  const [goal, setGoal] = useState(120);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const meals = useMealsForRange(weekAgo, now);

  useEffect(() => {
    getSettings().then((s) => setGoal(s.daily_goal));
  }, []);

  const data: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('de-DE', { weekday: 'short' });

    const dayMeals = (meals ?? []).filter((m) => {
      const mDate = new Date(m.timestamp).toISOString().slice(0, 10);
      return mDate === dayStr;
    });

    data.push({
      label: dayLabel,
      protein: Math.round(dayMeals.reduce((s, m) => s + m.protein_g, 0)),
      calories: Math.round(dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0)),
    });
  }

  const avg = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.protein, 0) / data.length)
    : 0;
  const avgCal = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length)
    : 0;

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Letzte 7 Tage</h3>
      <div className={styles.avgLine}>Durchschnitt: {avg}g Protein / {avgCal} kcal pro Tag</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="protein" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="calories" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value, name) => [
              name === 'protein' ? `${value}g` : `${value} kcal`,
              name === 'protein' ? 'Protein' : 'Kalorien',
            ]}
          />
          <Legend formatter={(value) => (value === 'protein' ? 'Protein (g)' : 'Kalorien (kcal)')} />
          <ReferenceLine yAxisId="protein" y={goal} stroke="#e74c3c" strokeDasharray="4 4" label={{ value: 'Ziel', position: 'right', fontSize: 11 }} />
          <Bar yAxisId="protein" dataKey="protein" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="calories" dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
