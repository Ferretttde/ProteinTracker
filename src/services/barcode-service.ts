export interface ProductInfo {
  name: string;
  brand?: string;
  protein_per_100g: number;
  calories_per_100g?: number;
  serving_size_g?: number;
  image_url?: string;
}

export async function lookupBarcode(barcode: string): Promise<ProductInfo> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
  );

  if (!response.ok) {
    throw new Error('OpenFoodFacts API nicht erreichbar.');
  }

  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    throw new Error(`Produkt mit Barcode ${barcode} nicht gefunden.`);
  }

  const p = data.product;
  const nutriments = p.nutriments ?? {};

  return {
    name: p.product_name ?? 'Unbekanntes Produkt',
    brand: p.brands,
    protein_per_100g: nutriments.proteins_100g ?? nutriments.proteins ?? 0,
    calories_per_100g: nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'],
    serving_size_g: parseServingSize(p.serving_size),
    image_url: p.image_front_small_url,
  };
}

function parseServingSize(serving?: string): number | undefined {
  if (!serving) return undefined;
  const match = serving.match(/(\d+(?:[.,]\d+)?)\s*g/i);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return undefined;
}
