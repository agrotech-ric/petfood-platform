import type { OptimizationResult } from '../../context/RequestContext';

export type RecommendationExportMeta = {
  petName: string;
  formattedDate: string;
  disease?: string;
  targetKcal?: number;
  recordId?: string;
  request?: {
    petSpecies?: string;
    petBreed?: string;
    gender?: string;
    birthDate?: string;
    passportId?: string;
    activityTypeName?: string;
    symptoms?: string[];
    comments?: string;
    weightKg?: number;
    ownerName?: string;
  };
};

export type NutrientBalanceRow = {
  name: string;
  current: number;
  normal: number;
  unit: string;
  coveragePercent: number;
  status: string;
};

const categorizeNutrient = (nutrientName: string): string => {
  const name = nutrientName.toLowerCase();

  if (['кальций', 'фосфор', 'магний', 'калий', 'натрий'].some((m) => name.includes(m))) {
    return 'macrominerals';
  }
  if (['железо', 'цинк', 'медь', 'марганец', 'селен', 'йод'].some((m) => name.includes(m))) {
    return 'traceMinerals';
  }
  if (
    name.includes('витамин') ||
    name.includes('холин') ||
    name === 'пантотеновая кислота' ||
    name === 'фолиевая кислота'
  ) {
    return 'vitamins';
  }
  if (name.includes('кислота') && !name.includes('пантотеновая') && !name.includes('фолиевая')) {
    return 'fattyAcids';
  }
  return 'other';
};

const nutrientStatus = (coveragePercent: number): string => {
  if (coveragePercent < 50) return 'Дефицит';
  if (coveragePercent < 80) return 'Недостаточно';
  if (coveragePercent < 120) return 'Норма';
  return 'Избыток';
};

export const buildNutrientBalanceRows = (
  optimizationResult: OptimizationResult,
  nutrientNames: string[]
): NutrientBalanceRow[] => {
  return nutrientNames.map((nutrient) => {
    const nutritionItem = optimizationResult.nutritional_value_total.find(
      (item) => item.nutrient === nutrient
    );
    const current = nutritionItem ? parseFloat(nutritionItem.value_per_100g.toFixed(2)) : 0;
    const deficiencyStr = optimizationResult.nutrient_deficiencies[nutrient];
    const normal = deficiencyStr ? parseFloat(deficiencyStr) : 0;
    const coveragePercent = normal > 0 ? Math.round((current / normal) * 100) : 0;
    const unit = nutritionItem?.unit || 'мг';
    const name = nutrient.replace(/\s*\([^)]*\)/g, '');

    return {
      name,
      current,
      normal,
      unit,
      coveragePercent,
      status: nutrientStatus(coveragePercent),
    };
  });
};

export const groupNutrientsByCategory = (optimizationResult: OptimizationResult) => {
  const categorized = {
    macrominerals: [] as string[],
    traceMinerals: [] as string[],
    vitamins: [] as string[],
    fattyAcids: [] as string[],
    other: [] as string[],
  };

  Object.keys(optimizationResult.nutrient_deficiencies).forEach((nutrient) => {
    const category = categorizeNutrient(nutrient) as keyof typeof categorized;
    categorized[category].push(nutrient);
  });

  return {
    macrominerals: buildNutrientBalanceRows(optimizationResult, categorized.macrominerals),
    traceMinerals: buildNutrientBalanceRows(optimizationResult, categorized.traceMinerals),
    vitamins: buildNutrientBalanceRows(optimizationResult, categorized.vitamins),
    fattyAcids: buildNutrientBalanceRows(optimizationResult, categorized.fattyAcids),
    other: buildNutrientBalanceRows(optimizationResult, categorized.other),
  };
};

export const getTargetKcal = (
  optimizationResult: OptimizationResult,
  explicitTarget?: number
): number => {
  if (explicitTarget && explicitTarget > 0) return explicitTarget;
  return (
    (optimizationResult.total_feed_grams * optimizationResult.energy_per_100g) / 100
  );
};

export const sanitizeFileName = (name: string): string =>
  name.replace(/[^\p{L}\p{N}\-_]+/gu, '_').replace(/_+/g, '_');

/** Maps API/state request object to PDF metadata */
export const buildExportMeta = (
  petName: string,
  formattedDate: string,
  options?: {
    disease?: string;
    targetKcal?: number;
    recordId?: string;
    request?: Record<string, unknown> | null;
  }
): RecommendationExportMeta => {
  const req = options?.request;
  return {
    petName,
    formattedDate,
    disease: options?.disease,
    targetKcal: options?.targetKcal,
    recordId: options?.recordId,
    request: req
      ? {
          petSpecies: (req.petSpecies ?? req.speciesName) as string | undefined,
          petBreed: (req.petBreed ?? req.breedName) as string | undefined,
          gender: req.gender as string | undefined,
          birthDate: req.birthDate as string | undefined,
          passportId: req.passportId as string | undefined,
          activityTypeName: req.activityTypeName as string | undefined,
          symptoms: req.symptoms as string[] | undefined,
          comments: (req.comments ?? req.notes) as string | undefined,
          weightKg: req.weightKg as number | undefined,
          ownerName: (req.ownerName ?? req.owner) as string | undefined,
        }
      : undefined,
  };
};
