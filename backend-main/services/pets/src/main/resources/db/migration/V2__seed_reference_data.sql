INSERT INTO species (code, name) VALUES
                                     ('dog',  'Собака')
ON CONFLICT (code) DO NOTHING;
INSERT INTO breeds (species_id, name)
SELECT s.id, b.name
FROM (VALUES
          ('dog','Лабрадор-ретривер'),
          ('dog','Французский бульдог')
     ) AS b(code, name)
         JOIN species s ON s.code = b.code
ON CONFLICT (species_id, name) DO NOTHING;

INSERT INTO colors (name) VALUES
                              ('Чёрный'),
                              ('Белый'),
                              ('Коричневый'),
                              ('Рыжий'),
                              ('Серый')
ON CONFLICT (name) DO NOTHING;
