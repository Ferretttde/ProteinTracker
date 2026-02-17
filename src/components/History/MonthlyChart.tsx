import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
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
    const dayMeals = (meals ?? []).filter(
      (m) => new Date(m.timestamp).toISOString().slice(0, 10) === dayStr
    );
    data.push({
      label: dayLabel,
      protein: Math.round(dayMeals.reduce((s, m) => s + m.protein_g, 0)),
      calories: Math.round(dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0)),
    });
  }

  const daysWithData = data.filter((d) => d.protein > 0);
  const avgProtein = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length)
    : 0;
  const avgCalories = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
    : 0;
  const daysGoalMet = daysWithData.filter((d) => d.protein >= goal).length;

  return (
    <>
      {/* Protein – 30 Tage */}
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Protein – letzte 30 Tage</h3>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{avgProtein}g</span>
            <span className={styles.statLabel}>Ø pro Tag</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{goal}g</span>
            <span className={styles.statLabel}>Tagesziel</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{daysGoalMet}/{daysWithData.length}</span>
            <span className={styles.statLabel}>Ziel erreicht</span>
          </div>
        </div>
        <div className={styles.legendRow}>
          <span className={styles.legendItem} style={{ '--dot-color': 'var(--color-primary)' } as React.CSSProperties}>Protein</span>
          <span className={styles.legendItem} style={{ '--dot-color': '#f59e0b' } as React.CSSProperties}>Ø {avgProtein}g</span>
          <span className={styles.legendItem} style={{ '--dot-color': '#e74c3c' } as React.CSSProperties}>Ziel {goal}g</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={6} />
            <YAxis tick={{ fontSize: 11 }} unit="g" />
            <Tooltip formatter={(v) => [`${v}g`, 'Protein']} />
            <ReferenceLine y={goal} stroke="#e74c3c" strokeDasharray="4 4" />
            <ReferenceLine y={avgProtein} stroke="#f59e0b" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="protein"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Kalorien – 30 Tage */}
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Kalorien – letzte 30 Tage</h3>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{avgCalories}</span>
            <span className={styles.statLabel}>Ø kcal/Tag</span>
          </div>
        </div>
        <div className={styles.legendRow}>
          <span className={styles.legendItem} style={{ '--dot-color': '#f59e0b' } as React.CSSProperties}>Kalorien</span>
          <span className={styles.legendItem} style={{ '--dot-color': '#94a3b8' } as React.CSSProperties}>Ø {avgCalories} kcal</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={6} />
            <YAxis tick={{ fontSize: 11 }} unit=" kcal" width={55} />
            <Tooltip formatter={(v) => [`${v} kcal`, 'Kalorien']} />
            <ReferenceLine y={avgCalories} stroke="#94a3b8" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
