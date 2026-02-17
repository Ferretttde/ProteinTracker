import { useState } from 'react';
import type { Meal, MealType } from '../../types';
import { MealCard } from './MealCard';
import styles from './MealLog.module.css';

interface Props {
  meals: Meal[] | undefined;
}

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};

export function MealList({ meals }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<MealType>>(new Set());

  if (!meals || meals.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Noch keine Einträge heute.</p>
        <p className={styles.emptyHint}>Füge dein erstes Lebensmittel hinzu!</p>
      </div>
    );
  }

  const toggleGroup = (type: MealType) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const grouped = new Map<MealType, Meal[]>();
  for (const meal of meals) {
    const type = meal.meal_type ?? 'snack';
    const list = grouped.get(type) ?? [];
    list.push(meal);
    grouped.set(type, list);
  }

  return (
    <div className={styles.mealList}>
      <h3 className={styles.sectionTitle}>Heutige Mahlzeiten</h3>
      {mealTypeOrder.map((type) => {
        const groupMeals = grouped.get(type);
        if (!groupMeals || groupMeals.length === 0) return null;
        const groupProtein = groupMeals.reduce((sum, m) => sum + m.protein_g, 0);
        const isExpanded = expandedGroups.has(type);
        return (
          <div key={type} className={styles.mealGroup}>
            <div className={styles.groupHeader} onClick={() => toggleGroup(type)}>
              <span className={styles.groupTitle}>
                <span className={`${styles.groupChevron} ${isExpanded ? styles.groupChevronExpanded : ''}`}>▶</span>
                {mealTypeLabels[type]}
                <span className={styles.groupCount}>({groupMeals.length})</span>
              </span>
              <span className={styles.groupProtein}>{Math.round(groupProtein)}g</span>
            </div>
            {isExpanded && groupMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
