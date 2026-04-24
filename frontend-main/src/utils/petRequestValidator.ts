
export type PetRequestFormData = {
  selectedPetId: string;
  activityLevel: string;
  symptoms: string[];
  comments: string;
};

export type PetRequestErrors = {
  pet?: string;
  activity?: string;
  symptoms?: string;
};

export const ERROR_MESSAGES = {
  PET_REQUIRED: 'Пожалуйста, выберите питомца',
  ACTIVITY_REQUIRED: 'Пожалуйста, выберите уровень активности',
  SYMPTOMS_REQUIRED: 'Пожалуйста, выберите хотя бы один симптом',
};

export const validatePetRequest = (
  formData: PetRequestFormData
): PetRequestErrors => {
  const errors: PetRequestErrors = {};

  if (!formData.selectedPetId) {
    errors.pet = ERROR_MESSAGES.PET_REQUIRED;
  }

  if (!formData.activityLevel) {
    errors.activity = ERROR_MESSAGES.ACTIVITY_REQUIRED;
  }

  if (formData.symptoms.length === 0) {
    errors.symptoms = ERROR_MESSAGES.SYMPTOMS_REQUIRED;
  }

  return errors;
};

export const hasValidationErrors = (errors: PetRequestErrors): boolean => {
  return Object.keys(errors).length > 0;
};