import { PetFormData, FormErrors } from '../types/petForm';

export const validatePhotoFile = (file: File): string | null => {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return '*Загрузите изображение в формате JPEG или PNG';
  }

  if (file.size > 10 * 1024 * 1024) {
    return '*Размер файла не должен превышать 10 МБ';
  }

  return null;
};

export const validatePhotoResolution = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < 300 || img.height < 300) {
        resolve('*Минимальное разрешение изображения: 300x300 пикселей');
      } else {
        resolve(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('*Ошибка загрузки изображения');
    };

    img.src = objectUrl;
  });
};

export const validatePetForm = (formData: PetFormData): FormErrors => {
  const errors: FormErrors = {};

  // if (!formData.photo) {
  //   errors.photo = '*Загрузите фото питомца';
  // }

  if (!formData.name.trim()) {
    errors.name = '*Введите кличку питомца';
  } else if (!/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(formData.name)) {
    errors.name = '*Кличка должна содержать только буквы и пробелы';
  }

  if (!formData.breed) {
    errors.breed = '*Выберите породу';
  }

  if (!formData.gender) {
    errors.gender = '*Выберите пол';
  }

  if (formData.gender === 'female') {
    if (!formData.reproductiveStatus) {
      errors.reproductiveStatus = '*Выберите репродуктивный статус';
    } else if (formData.reproductiveStatus === 'lactation') {
      if (!formData.lactationWeek) {
        errors.lactationWeek = '*Выберите неделю лактации';
      }
      if (!formData.puppyCount || formData.puppyCount <= 0) {
        errors.puppyCount = '*Введите количество щенков';
      }
    }
  }

  if (!formData.color) {
    errors.color = '*Выберите окрас';
  }

  if (!formData.dateOfBirth) {
    errors.dateOfBirth = '*Введите дату рождения';
  }

  if (!formData.weight || formData.weight <= 0 || isNaN(formData.weight)) {
    errors.weight = '*Введите корректный вес (больше 0)';
  }

  return errors;
};