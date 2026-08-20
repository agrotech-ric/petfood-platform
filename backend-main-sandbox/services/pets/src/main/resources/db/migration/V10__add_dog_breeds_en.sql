BEGIN;

ALTER TABLE pets
    DROP CONSTRAINT IF EXISTS pets_breed_id_fkey;

ALTER TABLE pets
    ALTER COLUMN breed_id DROP NOT NULL;

UPDATE pets
SET breed_id = NULL
WHERE species_id = (SELECT id FROM species WHERE code = 'dog');

DELETE FROM breeds
WHERE species_id = (SELECT id FROM species WHERE code = 'dog');

ALTER TABLE pets.breeds DROP COLUMN name;

ALTER TABLE pets.breeds
    ADD COLUMN name_ru varchar(128) NOT NULL DEFAULT '',
    ADD COLUMN name_en varchar(128) NOT NULL DEFAULT '';

INSERT INTO breeds (species_id, name_ru, name_en)
SELECT s.id, b.name_ru, b.name_en
FROM (VALUES
          ('dog','Аффенпинчер','affenpinscher'),
          ('dog','Афганская борзая','afghan hound'),
          ('dog','Эрдельтерьер','airedale terrier'),
          ('dog','Акита','akita'),
          ('dog','Аляскинский маламут','alaskan malamute'),
          ('dog','Американский бульдог','american bulldog'),
          ('dog','Американская эскимосская собака','american eskimo dog'),
          ('dog','Американский стаффордширский терьер','american staffordshire terrier'),
          ('dog','Американский водяной спаниель','american water spaniel'),
          ('dog','Австралийская пастушья собака','australian cattle dog'),
          ('dog','Австралийский келпи','australian kelpie'),
          ('dog','Австралийская овчарка','australian shepherd'),
          ('dog','Австралийский терьер','australian terrier'),
          ('dog','Басенджи','basenji'),
          ('dog','Бассет-хаунд','basset hound'),
          ('dog','Бигль','beagle'),
          ('dog','Бородатый колли','bearded collie'),
          ('dog','Бедлингтон-терьер','bedlington terrier'),
          ('dog','Бельгийская овчарка малинуа','belgian malinois'),
          ('dog','Бельгийская овчарка грюнендаль','belgian sheepdog'),
          ('dog','Бельгийская овчарка тервюрен','belgian tervuren'),
          ('dog','Бернский зенненхунд','bernese mountain dog'),
          ('dog','Бишон фризе','bichon frise'),
          ('dog','Черно-подпалый кунхаунд','black and tan coonhound'),
          ('dog','Черный русский терьер','black russian terrier'),
          ('dog','Бладхаунд','bloodhound'),
          ('dog','Голубой кунхаунд','bluetick coonhound'),
          ('dog','Бордер-колли','border collie'),
          ('dog','Бордер-терьер','border terrier'),
          ('dog','Русская псовая борзая','borzoi'),
          ('dog','Бостон-терьер','boston terrier'),
          ('dog','Фландрский бувье','bouvier des flandres'),
          ('dog','Боксер','boxer'),
          ('dog','Бриар','briard'),
          ('dog','Бретонский эпаньоль','brittany'),
          ('dog','Брюссельский гриффон','brussels griffon'),
          ('dog','Бультерьер','bull terrier'),
          ('dog','Керн-терьер','cairn terrier'),
          ('dog','Ханаанская собака','canaan dog'),
          ('dog','Вельш-корги кардиган','cardigan welsh corgi'),
          ('dog','Кавалер-кинг-чарльз-спаниель','cavalier king charles spaniel'),
          ('dog','Чесапик-бей-ретривер','chesapeake bay retriever'),
          ('dog','Чихуахуа','chihuahua'),
          ('dog','Чау-чау','chow chow'),
          ('dog','Кламбер-спаниель','clumber spaniel'),
          ('dog','Котон-де-тулеар','coton de tulear'),
          ('dog','Такса','dachshund'),
          ('dog','Далматин','dalmatian'),
          ('dog','Денди-динмонт-терьер','dandie dinmont terrier'),
          ('dog','Доберман','doberman pinscher'),
          ('dog','Английский фоксхаунд','english foxhound'),
          ('dog','Английский сеттер','english setter'),
          ('dog','Английский спрингер-спаниель','english springer spaniel'),
          ('dog','Английский той-спаниель','english toy spaniel'),
          ('dog','Филд-спаниель','field spaniel'),
          ('dog','Финский шпиц','finnish spitz'),
          ('dog','Флэт-коутед ретривер','flat-coated retriever'),
          ('dog','Французский бульдог','french bulldog'),
          ('dog','Немецкий короткошерстный пойнтер','german shorthaired pointer'),
          ('dog','Немецкий жесткошерстный пойнтер','german wirehaired pointer'),
          ('dog','Золотистый ретривер','golden retriever'),
          ('dog','Гордон-сеттер','gordon setter'),
          ('dog','Немецкий дог','great dane'),
          ('dog','Пиренейская горная собака','great pyrenees'),
          ('dog','Большой швейцарский зенненхунд','greater swiss mountain dog'),
          ('dog','Грейхаунд','greyhound'),
          ('dog','Харриер','harrier'),
          ('dog','Гаванский бишон','havanese'),
          ('dog','Ибизенская борзая','ibizan hound'),
          ('dog','Ирландский сеттер','irish setter'),
          ('dog','Ирландский терьер','irish terrier'),
          ('dog','Ирландский водяной спаниель','irish water spaniel'),
          ('dog','Ирландский волкодав','irish wolfhound'),
          ('dog','Японский хин','japanese chin'),
          ('dog','Кеесхонд','keeshond'),
          ('dog','Керри-блю-терьер','kerry blue terrier'),
          ('dog','Комондор','komondor'),
          ('dog','Кувас','kuvasz'),
          ('dog','Лабрадор-ретривер','labrador retriever'),
          ('dog','Лейкленд-терьер','lakeland terrier'),
          ('dog','Лхаса апсо','lhasa apso'),
          ('dog','Мастиф','mastiff'),
          ('dog','Миниатюрный бультерьер','miniature bull terrier'),
          ('dog','Миниатюрный пинчер','miniature pinscher'),
          ('dog','Неаполитанский мастиф','neapolitan mastiff'),
          ('dog','Ньюфаундленд','newfoundland'),
          ('dog','Норфолк-терьер','norfolk terrier'),
          ('dog','Норвежский элкхаунд','norwegian elkhound'),
          ('dog','Норвич-терьер','norwich terrier'),
          ('dog','Новошотландский ретривер приманивающий уток','nova scotia duck tolling retriever'),
          ('dog','Староанглийская овчарка','old english sheepdog'),
          ('dog','Оттерхаунд','otterhound'),
          ('dog','Папийон','papillon'),
          ('dog','Пекинес','pekingese'),
          ('dog','Вельш-корги пемброк','pembroke welsh corgi'),
          ('dog','Фараонова собака','pharaoh hound'),
          ('dog','Померанский шпиц','pomeranian'),
          ('dog','Португальская водяная собака','portuguese water dog'),
          ('dog','Мопс','pug'),
          ('dog','Пули','puli'),
          ('dog','Редбоун-кунхаунд','redbone coonhound'),
          ('dog','Родезийский риджбек','rhodesian ridgeback'),
          ('dog','Ротвейлер','rottweiler'),
          ('dog','Сенбернар','saint bernard'),
          ('dog','Салюки','saluki'),
          ('dog','Самоед','samoyed'),
          ('dog','Схипперке','schipperke'),
          ('dog','Шотландский дирхаунд','scottish deerhound'),
          ('dog','Шотландский терьер','scottish terrier'),
          ('dog','Силихем-терьер','sealyham terrier'),
          ('dog','Шетландская овчарка','shetland sheepdog'),
          ('dog','Сиба-ину','shiba inu'),
          ('dog','Ши-тцу','shih tzu'),
          ('dog','Сибирский хаски','siberian husky'),
          ('dog','Силки-терьер','silky terrier'),
          ('dog','Скай-терьер','skye terrier'),
          ('dog','Мягкошёрстный пшеничный терьер','soft coated wheaten terrier'),
          ('dog','Стаффордширский бультерьер','staffordshire bull terrier'),
          ('dog','Суссекс-спаниель','sussex spaniel'),
          ('dog','Тибетский спаниель','tibetan spaniel'),
          ('dog','Тибетский терьер','tibetan terrier'),
          ('dog','Венгерская выжла','vizsla'),
          ('dog','Веймаранер','weimaraner'),
          ('dog','Вельш-спрингер-спаниель','welsh springer spaniel'),
          ('dog','Вельш-терьер','welsh terrier'),
          ('dog','Вест-хайленд-уайт-терьер','west highland white terrier'),
          ('dog','Уиппет','whippet'),
          ('dog','Йоркширский терьер','yorkshire terrier')
     ) AS b(code, name_ru, name_en)
         JOIN species s ON s.code = b.code
ON CONFLICT DO NOTHING;

INSERT INTO breeds (species_id, name_ru, name_en)
VALUES (
           (SELECT id FROM species WHERE code = 'dog'),
           'Неизвестная порода',
           'Unknown'
       );

UPDATE pets
SET breed_id = (
    SELECT id FROM breeds
    WHERE species_id = (SELECT id FROM species WHERE code = 'dog')
      AND name_en = 'Unknown'
    LIMIT 1
)
WHERE species_id = (SELECT id FROM species WHERE code = 'dog')
  AND breed_id IS NULL;

ALTER TABLE pets
    ALTER COLUMN breed_id SET NOT NULL;

ALTER TABLE pets
    ADD CONSTRAINT pets_breed_id_fkey
        FOREIGN KEY (breed_id) REFERENCES breeds(id);

COMMIT;
