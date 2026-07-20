
BEGIN;
UPDATE breeds
SET name_ru = 'Американский эскимосский шпиц'
WHERE name_ru = 'Американская эскимосская собака';

UPDATE breeds
SET name_ru = 'Новошотландский ретривер'
WHERE name_ru = 'Новошотландский ретривер приманивающий уток';

UPDATE breeds
SET name_ru = 'Сассекс-спаниель'
WHERE name_ru = 'Суссекс-спаниель';

UPDATE breeds
SET name_ru = 'Прямошёрстный ретривер'
WHERE name_ru = 'Флэт-коутед ретривер'; 

INSERT INTO breeds (species_id, name_ru, name_en)
SELECT s.id, b.name_ru, b.name_en
FROM (VALUES

    ('dog','Немецкая овчарка','german shepherd dog'),
    ('dog','Тазы','tazy'),
    ('dog','Алабай','alabai'),
    ('dog','Лайка','laika'),
    ('dog','Тойтерьер','toy terrier'),
    ('dog','Шпиц немецкий','german spitz'),
    ('dog','Хаски','husky'),
    ('dog','Питбультерьер','pit bull terrier'),
    ('dog','Джек-рассел-терьер','jack russell terrier'),
    ('dog','Кокер-спаниель','cocker spaniel'),
    ('dog','Поинтер','pointer'),
    ('dog','Пудель','poodle'),
    ('dog','Шарпей','shar pei'),
    ('dog','Бульдог','bulldog'),
    ('dog','Шпиц','spitz'),
    ('dog','Русский спаниель','russian spaniel'),
    ('dog','Мальтипу','maltipoo'),
    ('dog','Тобет','tobet'),
    ('dog','Овчарка','shepherd'),
    ('dog','Мелкие терьеры','small terrier'),
    ('dog','Средние терьеры','medium terrier'),
    ('dog','Крупные терьеры','large terrier'),

    ('dog','Мелкие спаниели','small spaniel'),
    ('dog','Средние спаниели','medium spaniel'),
    ('dog','Крупные спаниели','large spaniel'),

    ('dog','Собаки мелких пород','small breed'),
    ('dog','Собаки средних пород','medium breed'),
    ('dog','Собаки крупных пород','large breed')

) AS b(code, name_ru, name_en)
JOIN species s ON s.code = b.code
ON CONFLICT DO NOTHING;
COMMIT;
