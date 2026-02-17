import { useState, useEffect, useRef } from 'react';
import { getSettings, saveSettings, exportMealsJSON, exportMealsCSV, importMealsJSON } from '../../services/db';
import styles from './Settings.module.css';

export function SettingsForm() {
  const [goal, setGoal] = useState('120');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setGoal(String(s.daily_goal));
      setApiKey(s.api_key);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await saveSettings({
      daily_goal: parseInt(goal) || 120,
      api_key: apiKey.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importMealsJSON(file);
      setImportStatus(`${count} Mahlzeiten importiert`);
    } catch {
      setImportStatus('Fehler: Ungültige Datei');
    }
    setTimeout(() => setImportStatus(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <form className={styles.form} onSubmit={handleSave}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tagesziel</h3>
        <div className={styles.goalRow}>
          <input
            className={styles.goalInput}
            type="number"
            min="1"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <span className={styles.goalUnit}>g Protein / Tag</span>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Claude API Key</h3>
        <p className={styles.hint}>
          Für die Foto-Analyse wird ein Claude API Key benötigt.
          Der Key wird nur lokal im Browser gespeichert.
        </p>
        <input
          className={styles.input}
          type="password"
          placeholder="sk-ant-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <button className={styles.saveBtn} type="submit">
        {saved ? 'Gespeichert!' : 'Speichern'}
      </button>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Daten Export</h3>
        <p className={styles.hint}>Alle Mahlzeiten als Datei speichern (Fotos werden nicht exportiert).</p>
        <div className={styles.exportRow}>
          <button className={styles.exportBtn} type="button" onClick={exportMealsJSON}>
            JSON exportieren
          </button>
          <button className={styles.exportBtn} type="button" onClick={exportMealsCSV}>
            CSV exportieren
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Daten Import</h3>
        <p className={styles.hint}>JSON-Export-Datei einlesen. Bestehende Daten bleiben erhalten.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className={styles.fileInput}
          onChange={handleImport}
        />
        {importStatus && <p className={styles.importStatus}>{importStatus}</p>}
      </div>
    </form>
  );
}
