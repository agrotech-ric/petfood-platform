export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  return (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365);
};

export const formatAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (dayDiff < 0) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) {
    years = 0;
    months = 0;
  }

  if (years === 0) {
    if (months === 0) return 'Меньше месяца';
    if (months === 1) return '1 месяц';
    if (months >= 2 && months <= 4) return `${months} месяца`;
    return `${months} месяцев`;
  }

  if (years === 1) return '1 год';
  if (years >= 2 && years <= 4) return `${years} года`;
  return `${years} лет`;
};

export const formatGender = (gender: string): string => {
  return gender === 'male' ? 'Самец' : 'Самка';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

export const getActivityColor = (activityLevel?: string): string => {
  if (!activityLevel) return '#374151';

  const level = activityLevel.toLowerCase();

  if (level.includes('пассивн') || level.includes('низк') || level.includes('passive')) {
    return '#EA584E';
  }

  if (level.includes('средн') || level.includes('moderate')) {
    return '#FE9620';
  }

  if (level.includes('активн') || level.includes('высок') || level.includes('active')) {
    return '#5CCB4A';
  }

  return '#374151';
};
