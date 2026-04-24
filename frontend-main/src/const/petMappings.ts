export type ReproductiveStatus = {
  id: number;
  code: string;
  name: string;
  gender: string;
  requiresSubstatus: boolean;
};

export type ReproductiveSubStatus = {
  id: number;
  statusId: number;
  code: string | null;
  name: string;
};

export const REPRODUCTIVE_STATUS_CODE_MAP: { [key: string]: string } = {
  'none': 'female_none',
  'pregnancy': 'female_pregnant',
  'lactation': 'female_lactation',
};

export const REPRODUCTIVE_STATUS_ID_MAP: { [key: string]: number } = {
  'none': 1,
  'pregnancy': 2,
  'lactation': 3,
};

export const REPRODUCTIVE_STATUS_CODE_TO_ID: { [key: string]: number } = {
  'female_none': 1,
  'female_pregnant': 2,
  'female_lactation': 3,
};

export const REPRODUCTIVE_STATUS_ID_TO_VALUE: { [key: number]: string } = {
  1: 'none',
  2: 'pregnancy',
  3: 'lactation',
};

export const LACTATION_WEEK_ID_MAP: { [key: string]: number } = {
  '1': 6,
  '2': 5,
  '3': 4,
  '4': 3,
};

export const LACTATION_WEEK_REVERSE_MAP: { [key: number]: string } = {
  6: '1',
  5: '2',
  4: '3',
  3: '4',
};

/**
 * @param symptomNames - Array of symptom names
 * @param symptomsFromAPI - Symptoms fetched
 * @returns Array of symptom IDs
 */
export const getSymptomIdsFromNames = (
  symptomNames: string[],
  symptomsFromAPI: Array<{id: number, name: string}>
): number[] => {
  return symptomNames
    .map(name => {
      const symptom = symptomsFromAPI.find(s => s.name === name);
      return symptom?.id;
    })
    .filter((id): id is number => id !== undefined);
};

/**
 * Converts symptom IDs to names
 * @param symptomIds - Array of symptom IDs
 * @param symptomsFromAPI - Symptoms fetched
 * @returns Array of symptom names
 */
export const getSymptomNamesFromIds = (
  symptomIds: number[],
  symptomsFromAPI: Array<{id: number, name: string}>
): string[] => {
  return symptomIds
    .map(id => {
      const symptom = symptomsFromAPI.find(s => s.id === id);
      return symptom?.name;
    })
    .filter((name): name is string => name !== undefined);
};

export const getReproductiveStatusId = (formValue: string): number => {
  return REPRODUCTIVE_STATUS_ID_MAP[formValue] || 1;
};

export const getReproductiveStatusFormValue = (id: number): string => {
  return REPRODUCTIVE_STATUS_ID_TO_VALUE[id] || '';
};

export const getLactationWeekId = (week: string): number => {
  return LACTATION_WEEK_ID_MAP[week] || 0;
};

export const getLactationWeekValue = (id: number): string => {
  return LACTATION_WEEK_REVERSE_MAP[id] || '';
};

export const getActivityTypeId = (
  activityName: string,
  activityTypesFromAPI: Array<{id: number, name: string}>
): number => {
  const activity = activityTypesFromAPI.find(a => a.name === activityName);
  return activity?.id || 0;
};

export const getActivityTypeName = (
  id: number,
  activityTypesFromAPI: Array<{id: number, name: string}>
): string => {
  const activity = activityTypesFromAPI.find(a => a.id === id);
  return activity?.name || '';
};