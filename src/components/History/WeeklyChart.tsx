import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useMealsForRange } from '../../hooks/useMeals';
import { useEffect, useState } from 'react';
import { getSettings } from '../../services/db';
import styles from './History.module.css';

export function WeeklyChart() {
  const [goal, setGoal] = useState(120);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const meals = useMealsForRange(weekAgo, now);

  useEffect(() => {
    getSettings().then((s) => setGoal(s.daily_goal));
  }, []);

  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('de-DE', { weekday: 'short' });
    const dayMeals = (meals ?? []).filter(
      (m) => new Date(m.timestamp).toISOString().slice(0, 10) === dayStr
    );
    data.push({
      label: dayLabel,
      protein: Math.round(dayMeals.reduce((s, m) => s + m.protein_g, 0)),
      calories: Math.round(dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0)),
    });
  }

  const avgProtein = Math.round(data.reduce((s, d) => s + d.protein, 0) / data.length);
  const avgCalories = Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length);

  return (
    <>
      {/* Protein – 7 Tage */}
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Protein – letzte 7 Tage</h3>
        <div className={styles.legendRow}>
          <span className={styles.legendItem} style={{ '--dot-color': 'var(--color-primary)' } as React.CSSProperties}>Protein</span>
          <span className={styles.legendItem} style={{ '--dot-color': '#f59e0b' } as React.CSSProperties}>Ø {avgProtein}g</span>
          <span className={styles.legendItem} style={{ '--dot-color': '#e74c3c' } as React.CSSProperties}>Ziel {goal}g</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} unit="g" />
            <Tooltip formatter={(v) => [`${v}g`, 'Protein']} />
            <ReferenceLine y={goal} stroke="#e74c3c" strokeDasharray="4 4" />
            <ReferenceLine y={avgProtein} stroke="#f59e0b" strokeDasharray="4 4" />
            <Bar dataKey="protein" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Kalorien – 7 Tage */}
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Kalorien – letzte 7 Tage</h3>
        <div className={styles.legendRow}>
          <span className={styles.legendItem} style={{ '--dot-color': '#f59e0b' } as React.CSSProperties}>Kalorien</span>
          <span className={styles.legendItem} style={{ '--dot-color': '#94a3b8' } as React.CSSProperties}>Ø {avgCalories} kcal</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kcal" width={55} />
            <Tooltip formatter={(v) => [`${v} kcal`, 'Kalorien']} />
            <ReferenceLine y={avgCalories} stroke="#94a3b8" strokeDasharray="4 4" />
            <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
