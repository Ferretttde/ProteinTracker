import type { AnalysisResult } from '../types';
import { getSettings } from './db';

function formatApiError(status: number, body: unknown): string {
  const err = (body as Record<string, unknown>)?.error;
  if (err && typeof err === 'object') {
    return `API-Fehler: ${status} - ${(err as Record<string, unknown>).message ?? JSON.stringify(err)}`;
  }
  return `API-Fehler: ${status} - Unbekannter Fehler`;
}

function parseAnalysisResponse(text: string): AnalysisResult[] {
  // Try to extract a JSON array first
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    const parsed = JSON.parse(arrayMatch[0]);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as AnalysisResult[];
    }
  }

  // Fallback: extract a single JSON object and wrap in array
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    return [JSON.parse(objMatch[0]) as AnalysisResult];
  }

  throw new Error('Konnte die AI-Antwort nicht verarbeiten.');
}

export async function analyzeMealPhoto(photo: Blob): Promise<AnalysisResult[]> {
  const settings = await getSettings();
  if (!settings.api_key) {
    throw new Error('Claude API Key nicht konfiguriert. Bitte unter Einstellungen hinterlegen.');
  }

  const base64 = await blobToBase64(photo);
  const mediaType = photo.type || 'image/jpeg';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.api_key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analysiere dieses Foto einer Mahlzeit. Identifiziere jedes einzelne Lebensmittel separat und schätze jeweils den Proteingehalt und die Kalorien.

Antworte NUR mit einem JSON-Array in diesem Format (keine weiteren Erklärungen):
[
  {
    "description": "Lebensmittel 1 mit Menge auf Deutsch",
    "protein_g": <Zahl in Gramm>,
    "calories": <Zahl in kcal>,
    "confidence": <Zahl zwischen 0 und 1>
  },
  {
    "description": "Lebensmittel 2 mit Menge auf Deutsch",
    "protein_g": <Zahl in Gramm>,
    "calories": <Zahl in kcal>,
    "confidence": <Zahl zwischen 0 und 1>
  }
]

Beispiel: Ein Foto mit Brot, Marmelade und einer Banane → 3 separate Einträge.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(formatApiError(response.status, body));
  }

  const data = await response.json();
  const text = data.content[0].text;
  return parseAnalysisResponse(text);
}

export async function analyzeMealText(description: string): Promise<AnalysisResult[]> {
  const settings = await getSettings();
  if (!settings.api_key) {
    throw new Error('Claude API Key nicht konfiguriert. Bitte unter Einstellungen hinterlegen.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.api_key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Ich habe folgende Nahrungsmittel zu mir genommen: "${description}"

Identifiziere jedes einzelne Lebensmittel separat und schätze jeweils den Proteingehalt und die Kalorien.
Wenn keine Mengen angegeben sind, gehe von einer durchschnittlichen Portion aus.

Antworte NUR mit einem JSON-Array in diesem Format (keine weiteren Erklärungen):
[
  {
    "description": "Lebensmittel 1 mit Menge auf Deutsch",
    "protein_g": <Zahl in Gramm>,
    "calories": <Zahl in kcal>,
    "confidence": <Zahl zwischen 0 und 1>
  },
  {
    "description": "Lebensmittel 2 mit Menge auf Deutsch",
    "protein_g": <Zahl in Gramm>,
    "calories": <Zahl in kcal>,
    "confidence": <Zahl zwischen 0 und 1>
  }
]

Beispiel: "zwei Scheiben Brot mit Marmelade und eine Banane" → 3 Einträge (Brot, Marmelade, Banane).`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(formatApiError(response.status, body));
  }

  const data = await response.json();
  const text = data.content[0].text;
  return parseAnalysisResponse(text);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g. "data:image/jpeg;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
