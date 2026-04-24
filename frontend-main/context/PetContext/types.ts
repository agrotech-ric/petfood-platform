export type Pet = {
  id: string;
  ownerId: string;
  speciesId: number;
  speciesName: string;
  breedId: number;
  breedName: string;
  name: string;
  gender: string;
  colorId: number;
  colorName: string;
  birthDate: string;
  passportId: string;
  weightKg: number;
  reproductiveStatusId: number;
  reproductiveStatusName: string;
  reproductiveSubStatusId: number;
  reproductiveSubStatusName: string;
  puppiesCount: number;
  photoObjectKey?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
};

export type Species = {
  id: number;
  code: string;
  name: string;
};

export type Breed = {
  id: number;
  speciesId: number;
  name?: string;
  nameRu?: string;
  nameEn?: string;
};

export type Color = {
  id: number;
  name: string;
};

export type Symptom = {
  id: number;
  name: string;
  description: string;
};

export type ActivityType = {
  id: number;
  name: string;
  description: string;
};

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
  code: string;
  name: string;
};

export type ReferenceData = {
  species: Species[];
  breeds: Breed[];
  colors: Color[];
  symptoms: Symptom[];
  activityTypes: ActivityType[];
  reproductiveStatuses: ReproductiveStatus[];
  reproductiveSubStatuses: ReproductiveSubStatus[];
};