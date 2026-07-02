INSERT INTO reproductive_substatuses (status_id, code, name)
SELECT s.id, 'early_4_weeks', 'Первые 4 недели беременности'
FROM reproductive_statuses s
WHERE s.code = 'female_pregnant'
ON CONFLICT (status_id, code) DO NOTHING;

INSERT INTO reproductive_substatuses (status_id, code, name)
SELECT s.id, 'last_5_weeks', 'Последние 5 недель беременности'
FROM reproductive_statuses s
WHERE s.code = 'female_pregnant'
ON CONFLICT (status_id, code) DO NOTHING;