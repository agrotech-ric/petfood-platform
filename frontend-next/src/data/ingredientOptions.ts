export const CATEGORIES = ['Зелень', 'Мясо', 'Крупа', 'Рыба', 'Овощи', 'Фрукты']

export const FILTER_GROUPS = {
  'Макронутриенты': [
    { key: 'protein', label: 'Белки' },
    { key: 'fat', label: 'Жиры' },
    { key: 'moisture', label: 'Влага' },
    { key: 'fiber', label: 'Клетчатка' },
    { key: 'ash', label: 'Зола' },
    { key: 'cholesterol', label: 'Холестерол' },
  ],
  'Микронутриенты': [
    { key: 'choline', label: 'Холин' },
    { key: 'selenium', label: 'Селен' },
    { key: 'iodine', label: 'Йод' },
  ],
  'Витамины': [
    { key: 'vitaminA', label: 'Витамин А' },
    { key: 'vitaminE', label: 'Витамин Е' },
    { key: 'vitaminD', label: 'Витамин Д' },
    { key: 'vitaminB1', label: 'Витамин В1' },
    { key: 'vitaminB2', label: 'Витамин В2' },
    { key: 'vitaminC', label: 'Витамин С' },
  ],
  'Жирные кислоты': [
    { key: 'linoleic', label: 'Линолевая' },
    { key: 'alphaLinolenic', label: 'Альфа-линоленовая' },
    { key: 'epa', label: 'ЭПК' },
    { key: 'dha', label: 'ДГК' },
  ],
  'Соединения витамина А': [
    { key: 'alphaCarotene', label: 'Альфа-каротин' },
    { key: 'betaCarotene', label: 'Бета-каротин' },
    { key: 'retinol', label: 'Ретино' },
  ],
} as const
