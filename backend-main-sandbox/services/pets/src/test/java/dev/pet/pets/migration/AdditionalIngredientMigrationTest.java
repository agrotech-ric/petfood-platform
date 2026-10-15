package dev.pet.pets.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class AdditionalIngredientMigrationTest {

    private static final String MIGRATION = "db/migration/V39__import_additional_system_ingredients.sql";
    private static final Pattern SOURCE_ROW = Pattern.compile("(?m)^    \\((\\d+),");

    @Test
    void migrationContainsEveryCuratedRowExactlyOnce() throws IOException {
        String sql = migrationSql();
        var matcher = SOURCE_ROW.matcher(sql);
        var rows = new HashSet<Integer>();
        while (matcher.find()) {
            rows.add(Integer.parseInt(matcher.group(1)));
        }

        assertThat(rows).hasSize(79).contains(2, 23, 39, 59, 77, 80);
    }

    @Test
    void migrationOnlyUpdatesGlobalRecordsAndCreatesGlobalSupportedRecords() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains("WHERE ingredient.owner_id IS NULL");
        assertThat(sql).contains("source.category, source.name, source.subtype, TRUE, NULL, 100");
        assertThat(sql).contains("'Семена', 'Льна', 'Зелень и специи', 'Семена и орехи', 'Льна'");
        assertThat(sql).contains("'Животный Жир', 'Куринный', 'Масло и жир', 'Животный Жир', 'Куриный'");
    }

    private String migrationSql() throws IOException {
        try (var stream = getClass().getClassLoader().getResourceAsStream(MIGRATION)) {
            assertThat(stream).as("migration resource").isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
