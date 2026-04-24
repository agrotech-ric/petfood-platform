UPDATE reproductive_statuses
SET name = 'Щенность',
    requires_substatus = FALSE
WHERE code = 'female_pregnant';

DELETE FROM reproductive_substatuses
WHERE status_id = (
    SELECT id FROM reproductive_statuses WHERE code = 'female_pregnant'
);

UPDATE pets
SET reproductive_status_id = NULL,
    reproductive_substatus_id = NULL
WHERE reproductive_status_id IN (
    SELECT id FROM reproductive_statuses
    WHERE code IN ('male_neutered', 'male_intact')
);

DELETE FROM reproductive_statuses
WHERE code IN ('male_neutered', 'male_intact');
