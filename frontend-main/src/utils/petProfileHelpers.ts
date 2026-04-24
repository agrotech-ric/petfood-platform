import {
  REPRODUCTIVE_STATUS_LABELS,
  REPRODUCTIVE_STATUS_KEYWORDS
} from '../const/petProfile';

export const getReproductiveStatusLabel = (statusName?: string): string | null => {
  if (!statusName) return null;

  const lowerStatus = statusName.toLowerCase();

  if (REPRODUCTIVE_STATUS_KEYWORDS.PREGNANCY.some(keyword => lowerStatus.includes(keyword))) {
    return REPRODUCTIVE_STATUS_LABELS.PREGNANCY;
  }

  if (REPRODUCTIVE_STATUS_KEYWORDS.LACTATION.some(keyword => lowerStatus.includes(keyword))) {
    return REPRODUCTIVE_STATUS_LABELS.LACTATION;
  }

  return null;
};

export const isLactationStatus = (statusName?: string): boolean => {
  if (!statusName) return false;
  const lowerStatus = statusName.toLowerCase();
  return REPRODUCTIVE_STATUS_KEYWORDS.LACTATION.some(keyword => lowerStatus.includes(keyword));
};

export const formatGender = (gender: string): string => {
  return gender === 'male' ? 'Самец' : 'Самка';
};