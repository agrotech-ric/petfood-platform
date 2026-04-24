import { AgeSortOrder, GenderFilter } from '../utils/petFilters';

export const AGE_SORT_OPTIONS: Array<{ value: AgeSortOrder; label: string }> = [
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' }
];

export const GENDER_FILTER_OPTIONS: Array<{ value: GenderFilter; label: string }> = [
  { value: 'female', label: 'Самка' },
  { value: 'male', label: 'Самец' }
];

export const DASHBOARD_TEXT = {
  PAGE_TITLE: 'Главная питомцев',
  REGISTER_BUTTON: 'Зарегистрировать питомца',
  LOADING_MESSAGE: 'Загрузка питомцев...',

  FILTER_AGE: 'Возраст',
  FILTER_GENDER: 'Пол',

  NO_PETS: 'Нет зарегистрированных питомцев.',
  NO_FILTERED_PETS: 'Нет питомцев, соответствующих выбранным фильтрам',
} as const;