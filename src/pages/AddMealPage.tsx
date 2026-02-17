import { useState } from 'react';
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

export function AddMealPage() {
  const [tab, setTab] = useState<Tab>('manual');
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType);

  return (
    <div>
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
        {tab === 'manual' && <QuickAddForm mealType={mealType} />}
        {tab === 'photo' && <CameraView mealType={mealType} />}
        {tab === 'text_ai' && <TextAnalysisView mealType={mealType} />}
        {tab === 'barcode' && <ScannerView mealType={mealType} />}
      </div>
    </div>
  );
}
