import { useState, useEffect, useMemo } from 'react';
import { Pet } from '../../context/PetContext';
import { AgeSortOrder, GenderFilter, PetFilters, filterAndSortPets } from '../utils/petFilters';

const STORAGE_KEY = 'petDashboardFilters';

const getInitialFilters = (): PetFilters => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse stored filters:', error);
    }
  }

  return {
    ageSortOrder: 'asc',
    genderFilter: 'male'
  };
};

export const usePetFilters = (pets: Pet[]) => {
  const [filters, setFilters] = useState<PetFilters>(getInitialFilters);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const setAgeSortOrder = (order: AgeSortOrder) => {
    setFilters(prev => ({ ...prev, ageSortOrder: order }));
  };

  const setGenderFilter = (gender: GenderFilter) => {
    setFilters(prev => ({ ...prev, genderFilter: gender }));
  };

  const filteredPets = useMemo(() => {
    if (!pets || !Array.isArray(pets)) return [];
    return filterAndSortPets(pets, filters);
  }, [pets, filters]);

  return {
    filters,
    filteredPets,
    setAgeSortOrder,
    setGenderFilter
  };
};
