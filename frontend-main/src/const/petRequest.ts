export const PET_REQUEST_STORAGE_KEY = 'pet_request_draft';

export const MODAL_MESSAGES = {
  CANCEL_TITLE: 'Отменить создание запроса?',
  CANCEL_MESSAGE: 'Все введенные данные будут потеряны. Вы уверены?',
  CANCEL_CONFIRM: 'Да, отменить',
  CANCEL_DECLINE: 'Нет, продолжить',

  SUCCESS_TITLE: 'Сохранено!',
  SUCCESS_MESSAGE: 'Ваш запрос успешно сохранен.',
  SUCCESS_CONFIRM: 'OK',
} as const;

export const FORM_LABELS = {
  PAGE_TITLE: 'Запрос',
  BACK_BUTTON: 'Назад',
  COMMENT_LABEL: 'Комментарий:',
  COMMENT_PLACEHOLDER: 'Введите что вас беспокоит',
  CANCEL_BUTTON: 'Отмена',
  SAVE_BUTTON: 'Сохранить',
} as const;