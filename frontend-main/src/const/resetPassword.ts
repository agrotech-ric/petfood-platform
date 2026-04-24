export const RESET_PASSWORD_TEXT = {
  TITLE: 'Сброс пароля',
  SUBTITLE: 'Введите код из письма и новый пароль',

  SUCCESS_TITLE: 'Пароль успешно изменен!',
  SUCCESS_SUBTITLE: 'Вы будете перенаправлены на страницу входа...',

  EMAIL_LABEL: 'Электронная почта',
  EMAIL_PLACEHOLDER: 'Введите email',
  CODE_LABEL: 'Код подтверждения',
  CODE_PLACEHOLDER: '6-значный код',
  NEW_PASSWORD_LABEL: 'Новый пароль',
  NEW_PASSWORD_PLACEHOLDER: 'Введите новый пароль (минимум 8 символов)',
  CONFIRM_PASSWORD_LABEL: 'Повторите новый пароль',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Введите пароль ещё раз',

  SUBMIT_BUTTON: 'Сбросить пароль',
  SUBMIT_BUTTON_LOADING: 'Сброс пароля...',
  BACK_BUTTON: 'Назад к входу',
} as const;

export const RESET_PASSWORD_CONFIG = {
  CODE_LENGTH: 6,
  REDIRECT_DELAY_MS: 2000,
} as const;