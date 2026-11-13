export function dogAgeCategory(months: number, adultWeight: number) {
  const adultMonths = adultWeight > 40 ? 24 : adultWeight > 25 ? 15 : 12
  const seniorMonths = adultWeight <= 10 ? 96 : adultWeight > 40 ? 72 : 84
  return months < adultMonths ? 'puppy' : months > seniorMonths ? 'senior' : 'adult'
}
