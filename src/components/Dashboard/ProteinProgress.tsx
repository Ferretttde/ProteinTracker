import styles from './Dashboard.module.css';

interface Props {
  current: number;
  goal: number;
  progress: number;
}

export function ProteinProgress({ current, goal, progress }: Props) {
  const percentage = Math.round(progress * 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={styles.progressContainer}>
      <svg viewBox="0 0 160 160" className={styles.progressRing}>
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="#e8e8e8"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke={progress >= 1 ? 'var(--color-success)' : 'var(--color-primary)'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 80 80)"
          className={styles.progressArc}
        />
      </svg>
      <div className={styles.progressText}>
        <span className={styles.progressValue}>{Math.round(current)}g</span>
        <span className={styles.progressLabel}>von {goal}g</span>
        <span className={styles.progressPercent}>{percentage}%</span>
      </div>
    </div>
  );
}
