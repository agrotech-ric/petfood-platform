ALTER TABLE pets.breeds
    ADD COLUMN IF NOT EXISTS size_category VARCHAR(16);

UPDATE pets.breeds SET size_category = 'medium' WHERE size_category IS NULL;

-- Small breeds (sample mapping; rest default medium)
UPDATE pets.breeds SET size_category = 'small' WHERE name_ru IN (
    'Аффенпинчер', 'Бигль', 'Бедлингтон-терьер', 'Бишон фризе', 'Болоньез',
    'Брюссельский гриффон', 'Вест-хайленд-уайт-терьер', 'Йоркширский терьер',
    'Кавалер-кинг-чарльз-спаниель', 'Карликовая такса', 'Кинг-чарльз-спаниель',
    'Мальтезе', 'Мопс', 'Папильон', 'Пекинес', 'Померанский шпиц', 'Пудель',
    'Русский той-терьер', 'Ши-тцу', 'Чихуахуа', 'Шпиц'
);

-- Large breeds
UPDATE pets.breeds SET size_category = 'large' WHERE name_ru IN (
    'Акита', 'Аляскинский маламут', 'Бернский зенненхунд', 'Бульмастиф',
    'Боксёр', 'Великий дан', 'Дог', 'Доберман', 'Ирландский волкодав',
    'Кавказская овчарка', 'Комондор', 'Леонбергер', 'Мастиф', 'Немецкий дог',
    'Немецкая овчарка', 'Ньюфаундленд', 'Ротвейлер', 'Сенбернар', 'Сибирский хаски',
    'Среднеазиатская овчарка', 'Сенбернар', 'Тазы', 'Чау-чау', 'Шарпей'
);

ALTER TABLE pets.breeds
    ALTER COLUMN size_category SET DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS ix_breeds_size_category ON pets.breeds(size_category);
