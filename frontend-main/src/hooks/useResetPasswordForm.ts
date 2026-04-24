import { useState, useCallback } from 'react';
import {
  validateResetPasswordForm,
  hasValidationErrors,
  ResetPasswordErrors,
} from '../utils/resetPasswordValidator';

export const useResetPasswordForm = (
  initialEmail: string = '',
  initialCode: string = ''
) => {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ResetPasswordErrors>({});

  const formData = {
    email,
    code,
    newPassword,
    confirmPassword,
  };

  const clearError = useCallback((field: keyof ResetPasswordErrors) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const updateEmail = useCallback(
    (value: string) => {
      setEmail(value);
      clearError('email');
    },
    [clearError]
  );

  const updateCode = useCallback(
    (value: string) => {
      setCode(value);
      clearError('code');
    },
    [clearError]
  );

  const updateNewPassword = useCallback(
    (value: string) => {
      setNewPassword(value);
      clearError('newPassword');
    },
    [clearError]
  );

  const updateConfirmPassword = useCallback(
    (value: string) => {
      setConfirmPassword(value);
      clearError('confirmPassword');
    },
    [clearError]
  );

  const validateForm = useCallback(() => {
    const validationErrors = validateResetPasswordForm(formData);
    setErrors(validationErrors);
    return !hasValidationErrors(validationErrors);
  }, [formData]);

  const setGeneralError = useCallback((message: string) => {
    setErrors((prev) => ({ ...prev, general: message }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    email,
    code,
    newPassword,
    confirmPassword,

    updateEmail,
    updateCode,
    updateNewPassword,
    updateConfirmPassword,

    validateForm,
    setGeneralError,
    clearAllErrors,
    resetForm,
  };
};