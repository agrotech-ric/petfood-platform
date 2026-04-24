import { createContext } from "react";
import type { Pet, Species, Breed, Color, Symptom, ActivityType, ReproductiveStatus, ReproductiveSubStatus } from './types';

export type PetContextType = {
  pets: Pet[];
  species: Species[];
  breeds: Breed[];
  colors: Color[];
  symptoms: Symptom[];
  activityTypes: ActivityType[];
  reproductiveStatuses: ReproductiveStatus[];
  reproductiveSubStatuses: ReproductiveSubStatus[];
  isLoading: boolean;
  isLoadingReference: boolean;
  fetchPets: () => Promise<void>;
  fetchReferenceData: () => Promise<void>;
  fetchBreedsBySpeciesId: (speciesId: number) => Promise<void>;
  addPet: (petData: any) => Promise<Pet>;
  updatePet: (id: string, petData: any) => Promise<Pet>;
  deletePet: (id: string) => Promise<void>;
  getPetById: (id: string) => Pet | undefined;
  getBreedsBySpeciesId: (speciesId: number) => Breed[];
};

export const PetContext = createContext<PetContextType | undefined>(undefined);