import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMeal } from '../../hooks/useMeals';
import type { MealType } from '../../types';
import styles from './ManualEntry.module.css';

interface Props {
  mealType: MealType;
  targetDate?: Date | null;
}

function buildTimestamp(targetDate?: Date | null): Date {
  if (!targetDate) return new Date();
  const now = new Date();
  const d = new Date(targetDate);
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return d;
}

export function QuickAddForm({ mealType, targetDate }: Props) {
  const [description, setDescription] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const proteinVal = parseFloat(protein);
    if (!description.trim() || isNaN(proteinVal) || proteinVal <= 0) return;

    await addMeal({
      timestamp: buildTimestamp(targetDate),
      description: description.trim(),
      protein_g: proteinVal,
      calories: calories ? parseFloat(calories) || undefined : undefined,
      source: 'manual',
      manually_corrected: false,
      meal_type: mealType,
    });

    navigate('/');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Manuell hinzufügen</h3>
      <input
        className={styles.input}
        placeholder="Beschreibung (z.B. Hähnchenbrust)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <div className={styles.row}>
        <div className={styles.field}>
          <input
            className={styles.input}
            type="number"
            step="0.1"
            min="0"
            placeholder="Protein (g)"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            required
          />
          <span className={styles.fieldLabel}>Gramm Protein *</span>
        </div>
        <div className={styles.field}>
          <input
            className={styles.input}
            type="number"
            step="1"
            min="0"
            placeholder="Kalorien (kcal)"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
          <span className={styles.fieldLabel}>kcal (optional)</span>
        </div>
      </div>
      <button className={styles.submitBtn} type="submit">
        Speichern
      </button>
    </form>
  );
}
