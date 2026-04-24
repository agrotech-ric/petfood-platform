import { useState, useCallback, useEffect } from 'react';
import { validatePetRequest, hasValidationErrors, PetRequestErrors } from '../utils/petRequestValidator';

export const usePetRequestForm = () => {
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState<PetRequestErrors>({});
  const [previousPetId, setPreviousPetId] = useState<string>('');

  useEffect(() => {
    if (previousPetId && selectedPetId && previousPetId !== selectedPetId) {
      setActivityLevel('');
      setSymptoms([]);
      setComments('');
      setErrors({});
    }

    if (selectedPetId) {
      setPreviousPetId(selectedPetId);
    }
  }, [selectedPetId, previousPetId]);

  const formData = {
    selectedPetId,
    activityLevel,
    symptoms,
    comments,
  };

  const clearError = useCallback((field: keyof PetRequestErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const updatePetId = useCallback((petId: string) => {
    setSelectedPetId(petId);
    clearError('pet');
  }, [clearError]);

  const updateActivityLevel = useCallback((level: string) => {
    setActivityLevel(level);
    clearError('activity');
  }, [clearError]);

  const updateSymptoms = useCallback((newSymptoms: string[]) => {
    setSymptoms(newSymptoms);
    clearError('symptoms');
  }, [clearError]);

  const updateComments = useCallback((newComments: string) => {
    setComments(newComments);
  }, []);

  const validateForm = useCallback(() => {
    const validationErrors = validatePetRequest(formData);
    setErrors(validationErrors);
    return !hasValidationErrors(validationErrors);
  }, [formData]);

  const hasFilledFields = useCallback(() => {
    return selectedPetId !== '' ||
           activityLevel !== '' ||
           symptoms.length > 0 ||
           comments.trim() !== '';
  }, [selectedPetId, activityLevel, symptoms, comments]);

  const resetForm = useCallback(() => {
    setSelectedPetId('');
    setActivityLevel('');
    setSymptoms([]);
    setComments('');
    setErrors({});
    setPreviousPetId('');
  }, []);

  const loadFormData = useCallback((data: Partial<typeof formData>) => {
    if (data.selectedPetId) {
      setSelectedPetId(data.selectedPetId);
      setPreviousPetId(data.selectedPetId);
    }
    if (data.activityLevel) setActivityLevel(data.activityLevel);
    if (data.symptoms) setSymptoms(data.symptoms);
    if (data.comments) setComments(data.comments);
  }, []);

  return {
    formData,
    errors,
    selectedPetId,
    activityLevel,
    symptoms,
    comments,

    updatePetId,
    updateActivityLevel,
    updateSymptoms,
    updateComments,

    validateForm,
    hasFilledFields,
    resetForm,
    loadFormData,
  };
};