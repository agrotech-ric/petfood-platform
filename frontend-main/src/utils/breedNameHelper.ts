type BreedReference = {
  id: number;
  name?: string;
  nameRu?: string;
  nameEn?: string;
  speciesId?: number;
};

export const resolveBreedNameToEnglish = (
  breedName: string,
  breedsList: BreedReference[]
): string => {
  if (!breedName) return '';

  const searchName = breedName.toLowerCase().trim();

  const breed = breedsList.find(b => {
    const name = b.name?.toLowerCase() || '';
    const nameRu = b.nameRu?.toLowerCase() || '';
    const nameEn = b.nameEn?.toLowerCase() || '';

    return name === searchName || nameRu === searchName || nameEn === searchName;
  });

  if (breed) {
    return (breed.nameEn || breed.name || breedName).toLowerCase().trim();
  }

  console.warn(`Could not resolve breed name: ${breedName}. Using as-is.`);
  return breedName.toLowerCase().trim();
};