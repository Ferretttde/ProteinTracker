import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { useMealsForRange } from '../../hooks/useMeals';
import { useEffect, useState } from 'react';
import { getSettings } from '../../services/db';
import styles from './History.module.css';

export function MonthlyChart() {
  const [goal, setGoal] = useState(120);
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 29);

  const meals = useMealsForRange(monthAgo, now);

  useEffect(() => {
    getSettings().then((s) => setGoal(s.daily_goal));
  }, []);

  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

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

  const daysWithData = data.filter((d) => d.protein > 0);
  const avg = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length)
    : 0;
  const avgCal = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
    : 0;
  const daysGoalMet = daysWithData.filter((d) => d.protein >= goal).length;

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Letzte 30 Tage</h3>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{avg}g</span>
          <span className={styles.statLabel}>Durchschnitt</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{avgCal}</span>
          <span className={styles.statLabel}>kcal/Tag</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{daysGoalMet}/{daysWithData.length}</span>
          <span className={styles.statLabel}>Ziel erreicht</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} />
          <YAxis yAxisId="protein" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="calories" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value, name) => [
              name === 'protein' ? `${value}g` : `${value} kcal`,
              name === 'protein' ? 'Protein' : 'Kalorien',
            ]}
          />
          <Legend formatter={(value) => (value === 'protein' ? 'Protein (g)' : 'Kalorien (kcal)')} />
          <ReferenceLine yAxisId="protein" y={goal} stroke="#e74c3c" strokeDasharray="4 4" />
          <Bar yAxisId="protein" dataKey="protein" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
          <Bar yAxisId="calories" dataKey="calories" fill="#f59e0b" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
