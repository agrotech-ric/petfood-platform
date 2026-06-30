export const calculatePetAge = ( birthDate: string): 
{ age: number; age_metric: 'months' | 'years' } => {
  const birth = new Date(birthDate + 'T00:00:00');
  const today = new Date();

  let totalMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());

  if (today.getDate() < birth.getDate()) {
    totalMonths--;
  }

  totalMonths = Math.max(0, totalMonths);

  if (totalMonths < 12) {
    return {
      age: totalMonths,
      age_metric: 'months',
    };
  }

  return {
    age: Math.floor(totalMonths / 12),
    age_metric: 'years',
  };
};