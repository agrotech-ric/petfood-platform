import { Pet } from '../../context/PetContext';
import { calculateAge } from './petUtils';

export type AgeSortOrder = 'asc' | 'desc';
export type GenderFilter = 'female' | 'male';

export interface PetFilters {
  ageSortOrder: AgeSortOrder;
  genderFilter: GenderFilter;
}

export const filterAndSortPets = (
  pets: Pet[],
  filters: PetFilters
): Pet[] => {
  const filtered = pets.filter(pet => pet.gender === filters.genderFilter);

  return [...filtered].sort((a, b) => {
    const ageA = calculateAge(a.birthDate);
    const ageB = calculateAge(b.birthDate);
    return filters.ageSortOrder === 'asc' ? ageA - ageB : ageB - ageA;
  });
};