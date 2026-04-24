import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';

export type ActivityType = {
  id: number;
  name: string;
  description?: string;
};

export type Symptom = {
  id: number;
  name: string;
};

type ReferenceData = {
  activityTypes: ActivityType[];
  symptoms: Symptom[];
  isLoading: boolean;
  error: string | null;
};

let cachedData: ReferenceData | null = null;

export const useReferenceData = () => {
  const [data, setData] = useState<ReferenceData>(
    cachedData || {
      activityTypes: [],
      symptoms: [],
      isLoading: true,
      error: null,
    }
  );

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      return;
    }

    const fetchReferenceData = async () => {
      try {
        const [activityTypes, symptoms] = await Promise.all([
          apiClient.get<ActivityType[]>('/api/v1/pets/ref/activity-types'),
          apiClient.get<Symptom[]>('/api/v1/pets/ref/symptoms'),
        ]);

        const newData: ReferenceData = {
          activityTypes,
          symptoms,
          isLoading: false,
          error: null,
        };

        cachedData = newData;
        setData(newData);
      } catch (error: any) {
        const errorData: ReferenceData = {
          activityTypes: [],
          symptoms: [],
          isLoading: false,
          error: error.message || 'Не удалось загрузить справочные данные',
        };
        setData(errorData);
      }
    };

    fetchReferenceData();
  }, []);

  return data;
};