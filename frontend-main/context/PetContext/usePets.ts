import { useContext } from "react";
import { PetContext } from './PetContext';
import type { PetContextType } from './PetContext';

export const usePets = (): PetContextType => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error("usePets must be used within a PetProvider");
  }
  return context;
};
