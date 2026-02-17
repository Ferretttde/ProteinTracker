import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { lookupBarcode, type ProductInfo } from '../../services/barcode-service';
import { addMeal } from '../../hooks/useMeals';
import type { MealType } from '../../types';
import styles from './BarcodeScanner.module.css';

interface Props {
  mealType: MealType;
}

export function ScannerView({ mealType }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [barcode, setBarcode] = useState('');
  const [amount, setAmount] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScanning() {
    setError(null);
    setProduct(null);

    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;
    setScanning(true);

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          await handleBarcode(decodedText);
        },
        () => {} // ignore errors during scanning
      );

      // Apply 2x zoom to avoid wide-angle distortion
      try {
        const video = document.querySelector('#barcode-reader video') as HTMLVideoElement | null;
        const track = video?.srcObject instanceof MediaStream
          ? video.srcObject.getVideoTracks()[0]
          : null;
        if (track) {
          const capabilities = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
          if (capabilities.zoom && capabilities.zoom.max >= 2.0) {
            await track.applyConstraints({ advanced: [{ zoom: 2.0 } as any] });
          }
        }
      } catch {
        // Zoom not supported on this device — ignore
      }
    } catch {
      setScanning(false);
      setError('Kamerazugriff nicht möglich.');
    }
  }

  async function handleBarcode(code: string) {
    setBarcode(code);
    setLoading(true);
    setError(null);
    try {
      const info = await lookupBarcode(code);
      setProduct(info);
      if (info.serving_size_g) {
        setAmount(String(info.serving_size_g));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Produkt nicht gefunden');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!product) return;
    const grams = parseFloat(amount) || 100;
    const factor = grams / 100;

    await addMeal({
      timestamp: new Date(),
      description: product.brand
        ? `${product.name} (${product.brand})`
        : product.name,
      protein_g: Math.round(product.protein_per_100g * factor * 10) / 10,
      calories: product.calories_per_100g
        ? Math.round(product.calories_per_100g * factor)
        : undefined,
      source: 'barcode',
      manually_corrected: false,
      barcode,
      meal_type: mealType,
    });

    navigate('/');
  }

  function handleReset() {
    setProduct(null);
    setBarcode('');
    setError(null);
  }

  if (product) {
    const grams = parseFloat(amount) || 100;
    const factor = grams / 100;
    const protein = Math.round(product.protein_per_100g * factor * 10) / 10;
    const calories = product.calories_per_100g
      ? Math.round(product.calories_per_100g * factor)
      : null;

    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Produkt gefunden</h3>
        <div className={styles.productCard}>
          {product.image_url && (
            <img src={product.image_url} className={styles.productImage} alt={product.name} />
          )}
          <div className={styles.productName}>
            {product.name}
            {product.brand && <span className={styles.productBrand}>{product.brand}</span>}
          </div>
          <div className={styles.nutritionRow}>
            <span>Pro 100g: {product.protein_per_100g}g Protein</span>
            {product.calories_per_100g && <span>{product.calories_per_100g} kcal</span>}
          </div>
          <div className={styles.amountField}>
            <label className={styles.amountLabel}>Menge (g):</label>
            <input
              className={styles.amountInput}
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className={styles.calculated}>
            <strong>{protein}g Protein</strong>
            {calories !== null && <span> | {calories} kcal</span>}
          </div>
          <button className={styles.primaryBtn} onClick={handleSave}>
            Speichern
          </button>
          <button className={styles.secondaryBtn} onClick={handleReset}>
            Neuer Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <h3 className={styles.title}>Barcode scannen</h3>
      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Suche Produkt...</div>}
      <div id="barcode-reader" className={styles.reader} />
      {!scanning && !loading && (
        <button className={styles.primaryBtn} onClick={startScanning}>
          Scanner starten
        </button>
      )}
      {scanning && (
        <button
          className={styles.secondaryBtn}
          onClick={async () => {
            if (scannerRef.current?.isScanning) {
              await scannerRef.current.stop();
            }
            setScanning(false);
          }}
        >
          Abbrechen
        </button>
      )}
    </div>
  );
}
