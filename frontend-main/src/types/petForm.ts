export type PetFormData = {
  photo: File | null;
  name: string;
  breed: string;
  gender: string;
  reproductiveStatus?: string;
  lactationWeek?: string;
  puppyCount?: number;
  color: string;
  dateOfBirth: string;
  passportId: string;
  weight: number;
};

export type FormErrors = {
  photo?: string;
  name?: string;
  breed?: string;
  gender?: string;
  reproductiveStatus?: string;
  lactationWeek?: string;
  puppyCount?: string;
  color?: string;
  dateOfBirth?: string;
  weight?: string;
  general?: string;
};