import { useState } from 'react';
import type { Meal, MealType } from '../../types';
import { deleteMeal, updateMeal } from '../../hooks/useMeals';
import styles from './MealLog.module.css';

interface Props {
  meal: Meal;
}

const sourceLabels: Record<Meal['source'], string> = {
  photo_ai: 'Foto-AI',
  barcode: 'Barcode',
  manual: 'Manuell',
};

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function MealCard({ meal }: Props) {
  const [editing, setEditing] = useState(false);
  const [protein, setProtein] = useState(String(meal.protein_g));
  const [description, setDescription] = useState(meal.description);
  const [editMealType, setEditMealType] = useState<MealType>(meal.meal_type ?? 'snack');

  const time = new Date(meal.timestamp).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  async function handleSave() {
    await updateMeal(meal.id!, {
      protein_g: parseFloat(protein) || 0,
      description,
      manually_corrected: true,
      meal_type: editMealType,
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (confirm('Eintrag löschen?')) {
      await deleteMeal(meal.id!);
    }
  }

  if (editing) {
    return (
      <div className={styles.mealCard}>
        <input
          className={styles.editInput}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung"
        />
        <div className={styles.editRow}>
          <input
            className={styles.editInputSmall}
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="Protein (g)"
          />
          <span className={styles.unit}>g Protein</span>
        </div>
        <div className={styles.editMealType}>
          {mealTypes.map((mt) => (
            <button
              key={mt}
              className={`${styles.mealTypeBadge} ${editMealType === mt ? styles.mealTypeBadgeActive : ''}`}
              onClick={() => setEditMealType(mt)}
              type="button"
            >
              {mealTypeLabels[mt]}
            </button>
          ))}
        </div>
        <div className={styles.editActions}>
          <button className={styles.btnSave} onClick={handleSave}>Speichern</button>
          <button className={styles.btnCancel} onClick={() => setEditing(false)}>Abbrechen</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mealCard}>
      <div className={styles.mealHeader}>
        <span className={styles.mealTime}>{time}</span>
        <span className={styles.mealSource}>{sourceLabels[meal.source]}</span>
      </div>
      <div className={styles.mealBody}>
        <span className={styles.mealDescription}>{meal.description}</span>
        <span className={styles.mealProtein}>{Math.round(meal.protein_g)}g</span>
      </div>
      {meal.calories != null && meal.calories > 0 && (
        <div className={styles.mealCalories}>{Math.round(meal.calories)} kcal</div>
      )}
      {meal.confidence != null && (
        <div className={styles.mealConfidence}>
          Konfidenz: {Math.round(meal.confidence * 100)}%
          {meal.manually_corrected && ' (korrigiert)'}
        </div>
      )}
      <div className={styles.mealActions}>
        <button className={styles.btnEdit} onClick={() => setEditing(true)}>Bearbeiten</button>
        <button className={styles.btnDelete} onClick={handleDelete}>Löschen</button>
      </div>
    </div>
  );
}
