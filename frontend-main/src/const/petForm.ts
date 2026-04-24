import { PetFormData } from "../types/petForm";

export const PET_COLORS = [
  { value: 'Черный', label: 'Черный' },
  { value: 'Белый', label: 'Белый' },
  { value: 'Коричневый', label: 'Коричневый' },
  { value: 'Золотистый', label: 'Золотистый' },
  { value: 'Серый', label: 'Серый' },
  { value: 'Биколор', label: 'Биколор' },
];

export const REPRODUCTIVE_STATUSES = [
  { value: 'none', label: 'Нет' },
  { value: 'pregnancy', label: 'Щенность' },
  { value: 'lactation', label: 'Период лактации' },
];

export const LACTATION_WEEKS = [
  { value: '1', label: '1 неделя' },
  { value: '2', label: '2 неделя' },
  { value: '3', label: '3 неделя' },
  { value: '4', label: '4 неделя' },
];

export const INITIAL_FORM_DATA: PetFormData = {
  photo: null,
  petType: 'Собака',
  name: '',
  breed: '',
  gender: '',
  reproductiveStatus: '',
  lactationWeek: '',
  puppyCount: 0,
  color: '',
  dateOfBirth: '',
  passportId: '',
  weight: 0,
};