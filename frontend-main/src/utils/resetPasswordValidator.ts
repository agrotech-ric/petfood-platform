import { validateEmail, validatePassword } from './userFormValidator';

export type ResetPasswordFormData = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

export type ResetPasswordErrors = {
  email?: string;
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
};

export const RESET_PASSWORD_ERRORS = {
  CODE_REQUIRED: '*Введите код подтверждения',
  CODE_INVALID_FORMAT: '*Код должен состоять из 6 цифр',
  CONFIRM_PASSWORD_REQUIRED: '*Подтвердите пароль',
  PASSWORDS_MISMATCH: '*Пароли не совпадают',
  GENERAL_ERROR: '*Произошла ошибка. Попробуйте еще раз',
  RESET_FAILED: 'Не удалось сбросить пароль',
};

export const validateResetPasswordForm = (
  formData: ResetPasswordFormData
): ResetPasswordErrors => {
  const errors: ResetPasswordErrors = {};

  const emailError = validateEmail(formData.email);
  if (emailError) {
    errors.email = emailError;
  }

  if (!formData.code) {
    errors.code = RESET_PASSWORD_ERRORS.CODE_REQUIRED;
  } else if (formData.code.length !== 6 || !/^\d+$/.test(formData.code)) {
    errors.code = RESET_PASSWORD_ERRORS.CODE_INVALID_FORMAT;
  }

  const passwordError = validatePassword(formData.newPassword);
  if (passwordError) {
    errors.newPassword = passwordError;
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = RESET_PASSWORD_ERRORS.CONFIRM_PASSWORD_REQUIRED;
  } else if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = RESET_PASSWORD_ERRORS.PASSWORDS_MISMATCH;
  }

  return errors;
};

export const hasValidationErrors = (errors: ResetPasswordErrors): boolean => {
  return Object.keys(errors).length > 0;
};