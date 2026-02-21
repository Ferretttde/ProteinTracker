import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QuickAddForm } from '../components/ManualEntry/QuickAddForm';
import { CameraView } from '../components/PhotoCapture/CameraView';
import { TextAnalysisView } from '../components/TextAnalysis/TextAnalysisView';
import { ScannerView } from '../components/BarcodeScanner/ScannerView';
import type { MealType } from '../types';
import styles from './Pages.module.css';

type Tab = 'manual' | 'photo' | 'text_ai' | 'barcode';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 14) return 'lunch';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
}

function parseDateParam(param: string | null): Date | null {
  if (!param) return null;
  const parts = param.split('-').map(Number);
  if (parts.length !== 3) return null;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function AddMealPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('text_ai');
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType);

  const targetDate = parseDateParam(searchParams.get('date'));

  return (
    <div>
      {targetDate && (
        <div className={styles.pastDayBanner}>
          Eintrag für {formatDateLabel(targetDate)}
        </div>
      )}
      <div className={styles.mealTypeSelector}>
        {mealTypes.map((mt) => (
          <button
            key={mt}
            className={`${styles.mealTypeBtn} ${mealType === mt ? styles.mealTypeBtnActive : ''}`}
            onClick={() => setMealType(mt)}
          >
            {mealTypeLabels[mt]}
          </button>
        ))}
      </div>
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${tab === 'manual' ? styles.tabActive : ''}`}
          onClick={() => setTab('manual')}
        >
          Manuell
        </button>
        <button
          className={`${styles.tab} ${tab === 'photo' ? styles.tabActive : ''}`}
          onClick={() => setTab('photo')}
        >
          Foto-AI
        </button>
        <button
          className={`${styles.tab} ${tab === 'text_ai' ? styles.tabActive : ''}`}
          onClick={() => setTab('text_ai')}
        >
          Text-AI
        </button>
        <button
          className={`${styles.tab} ${tab === 'barcode' ? styles.tabActive : ''}`}
          onClick={() => setTab('barcode')}
        >
          Barcode
        </button>
      </div>
      <div className={styles.tabContent}>
        {tab === 'manual' && <QuickAddForm mealType={mealType} targetDate={targetDate} />}
        {tab === 'photo' && <CameraView mealType={mealType} targetDate={targetDate} />}
        {tab === 'text_ai' && <TextAnalysisView mealType={mealType} targetDate={targetDate} />}
        {tab === 'barcode' && <ScannerView mealType={mealType} targetDate={targetDate} />}
      </div>
    </div>
  );
}
