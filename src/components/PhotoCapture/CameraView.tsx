import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../../hooks/useCamera';
import { analyzeMealPhoto } from '../../services/ai-service';
import { addMeal } from '../../hooks/useMeals';
import type { EditableItem, MealType } from '../../types';
import styles from './PhotoCapture.module.css';

interface Props {
  mealType: MealType;
  targetDate?: Date | null;
}

const MAX_SIZE = 1024;
const JPEG_QUALITY = 0.80;

function resizeBlob(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((resized) => resolve(resized ?? blob), 'image/jpeg', JPEG_QUALITY);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
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

export function CameraView({ mealType, targetDate }: Props) {
  const { videoRef, isActive, error: cameraError, start, stop, capture } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleCapture() {
    const blob = capture();
    if (blob) {
      setPhoto(blob);
      setPhotoUrl(URL.createObjectURL(blob));
      stop();
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeBlob(file);
      setPhoto(resized);
      setPhotoUrl(URL.createObjectURL(resized));
      stop();
    }
  }

  async function handleAnalyze() {
    if (!photo) return;
    setAnalyzing(true);
    setError(null);
    try {
      const results = await analyzeMealPhoto(photo);
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
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
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
        photo: i === 0 ? photo ?? undefined : undefined,
        meal_type: mealType,
      });
    }
    navigate('/');
  }

  function handleReset() {
    setPhoto(null);
    setPhotoUrl(null);
    setItems([]);
    setError(null);
  }

  // Show result editing
  if (items.length > 0) {
    const totalProtein = items.reduce((sum, it) => sum + (parseFloat(it.protein) || 0), 0);
    const totalCalories = items.reduce((sum, it) => sum + (parseFloat(it.calories) || 0), 0);

    return (
      <div className={styles.container}>
        <h3 className={styles.title}>AI-Ergebnis</h3>
        {photoUrl && <img src={photoUrl} className={styles.preview} alt="Mahlzeit" />}
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
          Neues Foto
        </button>
      </div>
    );
  }

  // Show photo preview
  if (photo && photoUrl) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Foto aufgenommen</h3>
        <img src={photoUrl} className={styles.preview} alt="Mahlzeit" />
        {error && <div className={styles.error}>{error}</div>}
        <button
          className={styles.primaryBtn}
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? 'Analysiere...' : 'Mit AI analysieren'}
        </button>
        <button className={styles.secondaryBtn} onClick={handleReset}>
          Erneut aufnehmen
        </button>
      </div>
    );
  }

  // Camera view
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Foto-Analyse</h3>
      {cameraError && <div className={styles.error}>{cameraError}</div>}
      {isActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={styles.video}
          />
          <button className={styles.captureBtn} onClick={handleCapture}>
            Foto aufnehmen
          </button>
          <button className={styles.secondaryBtn} onClick={stop}>
            Abbrechen
          </button>
        </>
      ) : (
        <div className={styles.startOptions}>
          <button className={styles.primaryBtn} onClick={start}>
            Kamera öffnen
          </button>
          <span className={styles.or}>oder</span>
          <button
            className={styles.secondaryBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Aus Galerie wählen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
        </div>
      )}
    </div>
  );
}
