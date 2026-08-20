package dev.pet.pets.search;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class PetSearchDao {

    private static final long OBESITY_ACTIVITY_TYPE_ID = 6L;

    private final EntityManager em;

    public PetSearchDao(EntityManager em) {
        this.em = em;
    }

    public record SearchPage(List<PetSearchRow> rows, long totalElements) {}

    public SearchPage search(UUID ownerId, PetSearchFilter filter, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE p.owner_id = :ownerId ");
        Map<String, Object> params = new HashMap<>();
        params.put("ownerId", ownerId);

        appendTextSearch(where, params, filter.getQ());
        appendGenders(where, params, filter.getGenders());
        appendAgeGroups(where, filter.getAgeGroups());
        appendWeight(where, params, filter.getMinWeight(), filter.getMaxWeight());
        appendBreedIds(where, params, filter.getBreedIds());
        appendSizeCategories(where, params, filter.getSizeCategories());
        appendReproductiveStatusIds(where, params, filter.getReproductiveStatusIds());
        appendActivityTypeIds(where, params, filter.getActivityTypeIds());
        appendSymptomIds(where, params, filter.getSymptomIds());
        appendHealthConditions(where, filter.getHealthConditionCodes());
        appendFavorite(where, filter.getFavorite());
        appendRecipeStatus(where, filter.getRecipeStatus());

        String fromClause = """
            FROM pets.pets p
            JOIN pets.breeds b ON b.id = p.breed_id
            LEFT JOIN pets.pet_favorites fav
                ON fav.owner_id = :ownerId AND fav.pet_id = p.id
            LEFT JOIN LATERAL (
                SELECT hr.id AS hr_id, hr.activity_type_id
                FROM pets.pet_health_records hr
                WHERE hr.pet_id = p.id
                ORDER BY hr.created_at DESC NULLS LAST, hr.id DESC
                LIMIT 1
            ) latest_hr ON true
            LEFT JOIN pets.pet_health_recommendations rec
                ON rec.health_record_id = latest_hr.hr_id
            """;

        String countSql = "SELECT COUNT(DISTINCT p.id) " + fromClause + where;
        Query countQuery = em.createNativeQuery(countSql);
        params.forEach(countQuery::setParameter);
        long total = ((Number) countQuery.getSingleResult()).longValue();

        if (total == 0) {
            return new SearchPage(List.of(), 0);
        }

        String dataSql = """
            SELECT DISTINCT ON (p.id) p.id,
                   (fav.pet_id IS NOT NULL) AS is_favorite,
                   (rec.id IS NOT NULL) AS has_recommendation
            """ + fromClause + where + """
             ORDER BY p.id ASC, p.name ASC
             LIMIT :limit OFFSET :offset
            """;

        Query dataQuery = em.createNativeQuery(dataSql);
        params.forEach(dataQuery::setParameter);
        dataQuery.setParameter("limit", size);
        dataQuery.setParameter("offset", (long) page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> raw = dataQuery.getResultList();
        List<PetSearchRow> rows = new ArrayList<>(raw.size());
        for (Object[] row : raw) {
            UUID petId = row[0] instanceof UUID u ? u : UUID.fromString(row[0].toString());
            boolean favorite = row[1] != null && Boolean.TRUE.equals(row[1]) || "t".equals(String.valueOf(row[1]));
            boolean hasRec = row[2] != null && Boolean.TRUE.equals(row[2]) || "t".equals(String.valueOf(row[2]));
            rows.add(new PetSearchRow(petId, favorite, hasRec));
        }
        return new SearchPage(rows, total);
    }

    private void appendTextSearch(StringBuilder where, Map<String, Object> params, String q) {
        if (q == null || q.isBlank()) return;
        where.append("""
             AND (
               lower(p.name) LIKE lower(:qPattern)
               OR lower(b.name_ru) LIKE lower(:qPattern)
               OR lower(b.name_en) LIKE lower(:qPattern)
             )
            """);
        params.put("qPattern", "%" + q.trim() + "%");
    }

    private void appendGenders(StringBuilder where, Map<String, Object> params, List<String> genders) {
        if (genders == null || genders.isEmpty()) return;
        List<String> normalized = genders.stream()
            .map(g -> switch (g.toLowerCase(Locale.ROOT)) {
                case "male", "самец" -> "male";
                case "female", "самка" -> "female";
                default -> g.toLowerCase(Locale.ROOT);
            })
            .filter(g -> g.equals("male") || g.equals("female"))
            .distinct()
            .toList();
        if (normalized.isEmpty()) return;
        where.append(" AND p.gender::text IN :genders ");
        params.put("genders", normalized);
    }

    private void appendAgeGroups(StringBuilder where, List<String> ageGroups) {
        if (ageGroups == null || ageGroups.isEmpty()) return;
        List<String> parts = new ArrayList<>();
        for (String raw : ageGroups) {
            String g = raw.toLowerCase(Locale.ROOT);
            if (g.equals("puppy") || g.equals("щенки") || g.contains("щен")) {
                parts.add("p.birth_date > (CURRENT_DATE - INTERVAL '1 year')");
            } else if (g.equals("adult") || g.equals("взрослые") || g.contains("взросл")) {
                parts.add("""
                    p.birth_date <= (CURRENT_DATE - INTERVAL '1 year')
                    AND p.birth_date > (CURRENT_DATE - INTERVAL '7 years')
                    """);
            } else if (g.equals("senior") || g.equals("пожилые") || g.contains("пожил")) {
                parts.add("p.birth_date <= (CURRENT_DATE - INTERVAL '7 years')");
            }
        }
        if (!parts.isEmpty()) {
            where.append(" AND (").append(String.join(" OR ", parts)).append(") ");
        }
    }

    private void appendWeight(StringBuilder where, Map<String, Object> params, Double min, Double max) {
        if (min != null) {
            where.append(" AND p.weight_kg >= :minWeight ");
            params.put("minWeight", min);
        }
        if (max != null) {
            where.append(" AND p.weight_kg <= :maxWeight ");
            params.put("maxWeight", max);
        }
    }

    private void appendBreedIds(StringBuilder where, Map<String, Object> params, List<Long> breedIds) {
        if (breedIds == null || breedIds.isEmpty()) return;
        where.append(" AND p.breed_id IN :breedIds ");
        params.put("breedIds", breedIds);
    }

    private void appendSizeCategories(StringBuilder where, Map<String, Object> params, List<String> sizes) {
        if (sizes == null || sizes.isEmpty()) return;
        List<String> normalized = sizes.stream()
            .map(s -> switch (s.toLowerCase(Locale.ROOT)) {
                case "small", "мелкие", "мелкая" -> "small";
                case "medium", "средние", "средняя" -> "medium";
                case "large", "крупные", "крупная" -> "large";
                default -> s.toLowerCase(Locale.ROOT);
            })
            .filter(s -> s.equals("small") || s.equals("medium") || s.equals("large"))
            .distinct()
            .toList();
        if (normalized.isEmpty()) return;
        where.append(" AND b.size_category IN :sizeCategories ");
        params.put("sizeCategories", normalized);
    }

    private void appendReproductiveStatusIds(StringBuilder where, Map<String, Object> params, List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        where.append(" AND p.reproductive_status_id IN :reproductiveStatusIds ");
        params.put("reproductiveStatusIds", ids);
    }

    private void appendActivityTypeIds(StringBuilder where, Map<String, Object> params, List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        where.append(" AND latest_hr.activity_type_id IN :activityTypeIds ");
        params.put("activityTypeIds", ids);
    }

    private void appendSymptomIds(StringBuilder where, Map<String, Object> params, List<Long> symptomIds) {
        if (symptomIds == null || symptomIds.isEmpty()) return;
        boolean noSymptoms = symptomIds.contains(-1L);
        List<Long> realIds = symptomIds.stream().filter(id -> id != null && id > 0).toList();
        List<String> parts = new ArrayList<>();
        if (noSymptoms) {
            parts.add("""
                (latest_hr.hr_id IS NULL OR NOT EXISTS (
                    SELECT 1 FROM pets.pet_health_record_symptoms phrs
                    WHERE phrs.pet_health_record_id = latest_hr.hr_id
                ))
                """);
        }
        if (!realIds.isEmpty()) {
            parts.add("""
                EXISTS (
                    SELECT 1 FROM pets.pet_health_record_symptoms phrs
                    WHERE phrs.pet_health_record_id = latest_hr.hr_id
                      AND phrs.symptom_id IN :symptomIds
                )
                """);
            params.put("symptomIds", realIds);
        }
        if (!parts.isEmpty()) {
            where.append(" AND (").append(String.join(" OR ", parts)).append(") ");
        }
    }

    private void appendHealthConditions(StringBuilder where, List<String> codes) {
        if (codes == null || codes.isEmpty()) return;
        List<String> parts = new ArrayList<>();
        for (String code : codes) {
            if (code == null) continue;
            switch (code.toLowerCase(Locale.ROOT)) {
                case "obesity" -> parts.add("latest_hr.activity_type_id = " + OBESITY_ACTIVITY_TYPE_ID);
                case "healthy" -> parts.add("""
                    (latest_hr.hr_id IS NULL
                     OR (COALESCE(latest_hr.activity_type_id, 0) <> %d
                         AND NOT EXISTS (
                            SELECT 1 FROM pets.pet_health_record_symptoms phrs
                            JOIN pets.symptoms s ON s.id = phrs.symptom_id
                            WHERE phrs.pet_health_record_id = latest_hr.hr_id
                              AND (
                                lower(s.name) LIKE '%аллер%'
                                OR lower(s.name) LIKE '%мочекам%'
                                OR lower(s.name) LIKE '%диабет%'
                              )
                         )))
                    """.formatted(OBESITY_ACTIVITY_TYPE_ID));
                case "allergy" -> parts.add(symptomPatternCondition("%аллер%"));
                case "urolithiasis" -> parts.add(symptomPatternCondition("%мочекам%"));
                case "diabetes" -> parts.add(symptomPatternCondition("%диабет%"));
                default -> { }
            }
        }
        if (!parts.isEmpty()) {
            where.append(" AND (").append(String.join(" OR ", parts)).append(") ");
        }
    }

    private static String symptomPatternCondition(String pattern) {
        return """
            EXISTS (
                SELECT 1 FROM pets.pet_health_record_symptoms phrs
                JOIN pets.symptoms s ON s.id = phrs.symptom_id
                WHERE phrs.pet_health_record_id = latest_hr.hr_id
                  AND lower(s.name) LIKE '%s'
            )
            """.formatted(pattern);
    }

    private void appendFavorite(StringBuilder where, String favorite) {
        if (favorite == null || favorite.isBlank() || "all".equalsIgnoreCase(favorite)) return;
        if ("saved".equalsIgnoreCase(favorite) || "сохранённые".equalsIgnoreCase(favorite)) {
            where.append(" AND fav.pet_id IS NOT NULL ");
        } else if ("unsaved".equalsIgnoreCase(favorite) || "несохранённые".equalsIgnoreCase(favorite)) {
            where.append(" AND fav.pet_id IS NULL ");
        }
    }

    private void appendRecipeStatus(StringBuilder where, String recipeStatus) {
        if (recipeStatus == null || recipeStatus.isBlank() || "all".equalsIgnoreCase(recipeStatus)) return;
        if ("calculated".equalsIgnoreCase(recipeStatus) || recipeStatus.toLowerCase(Locale.ROOT).contains("рассчитана")) {
            where.append(" AND rec.id IS NOT NULL ");
        } else if ("not_calculated".equalsIgnoreCase(recipeStatus)
            || recipeStatus.toLowerCase(Locale.ROOT).contains("не рассчитана")) {
            where.append(" AND latest_hr.hr_id IS NOT NULL AND rec.id IS NULL ");
        }
    }
}
