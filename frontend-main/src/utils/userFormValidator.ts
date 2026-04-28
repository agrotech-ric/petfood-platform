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
/*
function validatePhoneKZ(phone: string): string | null {
  if (!phone) return '*Введите номер телефона';

  const cleanPhone = phone.replace(/\D/g, '');

  if (!/^7\d{10}$/.test(cleanPhone)) {
    return '*Неверный формат номера телефона';
  }

  return null;
}

function validateIIN(iin: string): string | null {
  if (!iin) return '*Введите ИИН';

  const cleanIIN = iin.replace(/[\s-]/g, '');

  if (!/^\d+$/.test(cleanIIN)) {
    return '*ИИН должен содержать только цифры';
  }

  if (cleanIIN.length !== 12) {
    return '*ИИН должен состоять из 12 цифр';
  }

  const month = parseInt(cleanIIN.substring(2, 4), 10);
  const day = parseInt(cleanIIN.substring(4, 6), 10);

  if (month < 1 || month > 12) {
    return '*Неверная дата в ИИН';
  }

  if (day < 1 || day > 31) {
    return '*Неверная дата в ИИН';
  }

  const digits = cleanIIN.split('').map(Number);

  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

  let sum = digits.slice(0, 11).reduce((acc, d, i) => acc + d * weights1[i], 0);
  let checksum = sum % 11;

  if (checksum === 10) {
    sum = digits.slice(0, 11).reduce((acc, d, i) => acc + d * weights2[i], 0);
    checksum = sum % 11;
  }

  if (checksum !== digits[11]) {
    return '*Неверный ИИН';
  }

  return null;
}


*/
const examplePassword = 'My123$password';

export {
  validateEmail,
  validatePassword,
  validateName,
  //validatePhoneKZ,
  //validateIIN,
  examplePassword
};