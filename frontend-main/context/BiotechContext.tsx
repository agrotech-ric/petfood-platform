import { useContext, createContext, useState, ReactNode } from "react";

export interface Recommendation {
  id: string;
  petId: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  petName: string;
  petPhoto: string;
  disease: string;
  selectedIngredients: string[];
  ingredientRanges: { [key: string]: { min: number; max: number } };
  nutrientRanges: { [key: string]: { min: number; max: number } };
  maximizeNutrient: string;
  calculationResult?: {
    targetEnergy: number;
    totalMass: number;
    energyDensity: number;
    composition: { ingredient: string; percentage: number; grams: number }[];
    nutritionalValue: { nutrient: string; value: number }[];
    minerals: { mineral: string; current: number; normal: number }[];
    vitamins: { vitamin: string; current: number; normal: number }[];
  };
  createdAt: string;
}

type BiotechContextType = {
  recommendations: Recommendation[];
  addRecommendation: (recommendation: Omit<Recommendation, 'id' | 'createdAt'>) => string;
  updateRecommendation: (id: string, data: Partial<Recommendation>) => void;
  getRecommendationById: (id: string) => Recommendation | undefined;
  deleteRecommendation: (id: string) => void;
};

const BiotechContext = createContext<BiotechContextType | undefined>(undefined);

export const BiotechProvider = ({ children }: { children: ReactNode }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const addRecommendation = (
    recommendationData: Omit<Recommendation, 'id' | 'createdAt'>
  ): string => {
    const newRecommendation: Recommendation = {
      ...recommendationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setRecommendations((prev) => [...prev, newRecommendation]);
    return newRecommendation.id;
  };

  const updateRecommendation = (id: string, data: Partial<Recommendation>) => {
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, ...data } : rec))
    );
  };

  const getRecommendationById = (id: string): Recommendation | undefined => {
    return recommendations.find((rec) => rec.id === id);
  };

  const deleteRecommendation = (id: string) => {
    setRecommendations((prev) => prev.filter((rec) => rec.id !== id));
  };

  return (
    <BiotechContext.Provider
      value={{
        recommendations,
        addRecommendation,
        updateRecommendation,
        getRecommendationById,
        deleteRecommendation,
      }}
    >
      {children}
    </BiotechContext.Provider>
  );
};

export const useBiotech = (): BiotechContextType => {
  const context = useContext(BiotechContext);
  if (!context) {
    throw new Error("useBiotech must be used within a BiotechProvider");
  }
  return context;
};