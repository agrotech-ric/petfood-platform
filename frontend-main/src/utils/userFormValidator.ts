function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return '*Введите email';
  if (!emailRegex.test(email)) return '*Неверный адрес электронной почты';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return '*Введите пароль';
  if (password.length < 8) return '*Минимальная длина пароля: 8 символов';
  if (!/[A-Z]/.test(password)) return '*Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[a-z]/.test(password)) return '*Пароль должен содержать хотя бы одну строчную букву';
  if (!/[0-9]/.test(password)) return '*Пароль должен содержать хотя бы одну цифру';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return '*Пароль должен содержать хотя бы один специальный символ (!@#$%^&*(),.?":{}|<>)';

  return null;
}

function validateName(name: string, fieldName: string): string | null {
  if (!name) return `*Введите ${fieldName.toLowerCase()}`;

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return `*${fieldName} должно содержать минимум 2 символа`;
  }

  if (trimmedName.length > 50) {
    return `*${fieldName} не должно превышать 50 символов`;
  }

  const nameRegex = /^[А-ЯЁа-яёA-Za-z\s-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return `*${fieldName} должно содержать только буквы`;
  }

  return null;
}

function validatePhoneKZ(phone: string): string | null {
  if (!phone) return '*Введите номер телефона';

  const cleanPhone = phone.replace(/\D/g, '');

  if (!/^7\d{10}$/.test(cleanPhone)) {
    return '*Неверный формат номера телефона';
  }

  return null;
}


const examplePassword = 'My123$password';

export {
  validateEmail,
  validatePassword,
  validateName,
  validatePhoneKZ,
  examplePassword
};