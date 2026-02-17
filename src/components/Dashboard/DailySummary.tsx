import styles from './Dashboard.module.css';

interface Props {
  totalCalories: number;
  mealCount: number;
}

export function DailySummary({ totalCalories, mealCount }: Props) {
  return (
    <div className={styles.summaryRow}>
      <div className={styles.summaryCard}>
        <span className={styles.summaryValue}>{mealCount}</span>
        <span className={styles.summaryLabel}>Lebensmittel</span>
      </div>
      <div className={styles.summaryCard}>
        <span className={styles.summaryValue}>{Math.round(totalCalories)}</span>
        <span className={styles.summaryLabel}>kcal</span>
      </div>
    </div>
  );
}
