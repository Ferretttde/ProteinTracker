import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeMealText } from '../../services/ai-service';
import { addMeal } from '../../hooks/useMeals';
import type { EditableItem, MealType } from '../../types';
import styles from './TextAnalysis.module.css';

interface Props {
  mealType: MealType;
  targetDate?: Date | null;
}

function toEditableItems(results: import('../../types').AnalysisResult[]): EditableItem[] {
  return results.map((r) => ({
    original: r,
    description: r.description,
    protein: String(r.protein_g),
    calories: String(r.calories ?? ''),
    confidence: r.confidence,
  }));
}

function buildTimestamp(targetDate?: Date | null): Date {
  if (!targetDate) return new Date();
  const now = new Date();
  const d = new Date(targetDate);
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return d;
}

export function TextAnalysisView({ mealType, targetDate }: Props) {
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const results = await analyzeMealText(input.trim());
      setItems(toEditableItems(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen');
    } finally {
      setAnalyzing(false);
    }
  }

  function updateItem(index: number, field: keyof EditableItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addEmptyItem() {
    setItems((prev) => [
      ...prev,
      {
        original: { description: '', protein_g: 0, calories: 0, confidence: 1 },
        description: '',
        protein: '',
        calories: '',
        confidence: 1,
      },
    ]);
  }

  async function handleSave() {
    if (items.length === 0) return;
    const timestamp = buildTimestamp(targetDate);
    for (const item of items) {
      const proteinVal = parseFloat(item.protein) || item.original.protein_g;
      const caloriesVal = item.calories ? parseFloat(item.calories) : item.original.calories;
      const corrected =
        proteinVal !== item.original.protein_g ||
        item.description !== item.original.description ||
        caloriesVal !== item.original.calories;

      await addMeal({
        timestamp,
        description: item.description || item.original.description,
        protein_g: proteinVal,
        calories: caloriesVal,
        source: 'photo_ai',
        confidence: item.original.confidence,
        manually_corrected: corrected,
        meal_type: mealType,
      });
    }
    navigate('/');
  }

  function handleReset() {
    setItems([]);
    setError(null);
    setInput('');
  }

  if (items.length > 0) {
    const totalProtein = items.reduce((sum, it) => sum + (parseFloat(it.protein) || 0), 0);
    const totalCalories = items.reduce((sum, it) => sum + (parseFloat(it.calories) || 0), 0);

    return (
      <div className={styles.container}>
        <h3 className={styles.title}>AI-Ergebnis</h3>
        <div className={styles.originalText}>"{input}"</div>
        <div className={styles.summary}>
          Gesamt: {Math.round(totalProtein)}g Protein | {Math.round(totalCalories)} kcal ({items.length} Lebensmittel)
        </div>
        {items.map((item, index) => (
          <div key={index} className={styles.itemCard}>
            <div className={styles.itemHeader}>
              <span className={styles.itemNumber}>#{index + 1}</span>
              <button
                className={styles.removeBtn}
                onClick={() => removeItem(index)}
                title="Entfernen"
              >
                &times;
              </button>
            </div>
            <input
              className={styles.input}
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              placeholder="Beschreibung"
            />
            <div className={styles.row}>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  type="number"
                  step="0.1"
                  value={item.protein}
                  onChange={(e) => updateItem(index, 'protein', e.target.value)}
                />
                <span className={styles.fieldLabel}>Protein (g)</span>
              </div>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  type="number"
                  step="1"
                  value={item.calories}
                  onChange={(e) => updateItem(index, 'calories', e.target.value)}
                />
                <span className={styles.fieldLabel}>kcal</span>
              </div>
            </div>
            <div className={styles.confidence}>
              Konfidenz: {Math.round(item.confidence * 100)}%
            </div>
          </div>
        ))}
        <button className={styles.addItemBtn} onClick={addEmptyItem}>
          + Lebensmittel hinzufügen
        </button>
        <button className={styles.primaryBtn} onClick={handleSave}>
          Alle speichern
        </button>
        <button className={styles.secondaryBtn} onClick={handleReset}>
          Neue Eingabe
        </button>
      </div>
    );
  }

  return (
    <form className={styles.container} onSubmit={handleAnalyze}>
      <h3 className={styles.title}>Text-Analyse</h3>
      <p className={styles.hint}>
        Beschreibe deine Mahlzeit und die AI schätzt Protein und Kalorien.
      </p>
      <textarea
        className={styles.textarea}
        placeholder="z.B. Zwei Spiegeleier mit Vollkornbrot und Käse"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
      />
      {error && <div className={styles.error}>{error}</div>}
      <button
        className={styles.primaryBtn}
        type="submit"
        disabled={analyzing || !input.trim()}
      >
        {analyzing ? 'Analysiere...' : 'Analysieren'}
      </button>
    </form>
  );
}
