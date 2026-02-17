export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id?: number;
  timestamp: Date;
  description: string;
  protein_g: number;
  calories?: number;
  source: 'photo_ai' | 'barcode' | 'manual';
  confidence?: number;
  manually_corrected: boolean;
  barcode?: string;
  photo?: Blob;
  meal_type: MealType;
}

export interface Settings {
  id: 'user_settings';
  daily_goal: number;
  api_key: string;
}

export interface AnalysisResult {
  description: string;
  protein_g: number;
  calories?: number;
  confidence: number;
}

export interface EditableItem {
  original: AnalysisResult;
  description: string;
  protein: string;
  calories: string;
  confidence: number;
}

export interface DailyStats {
  totalProtein: number;
  totalCalories: number;
  mealCount: number;
  goalProgress: number; // 0-1
}
