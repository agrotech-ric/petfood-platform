import csv
import unittest
from pathlib import Path

from tools.import_additional_ingredients import (
    ALIASES,
    INGREDIENT_FIELDS,
    excel_serial_as_decimal,
    generate_migration,
    load_csv,
    merge_ingredients,
    normalize_rows,
)


ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "data/additional_ingredients.csv"
INGREDIENTS = ROOT / "data/ingredients_data.csv"
MAPPING = ROOT / "data/mapping_ingredients.csv"


def workbook_row(index: int) -> dict[str, object]:
    return {
        "category": "Test category",
        "full_name_ingredient": f"TEST INGREDIENT {index}",
        "name_ru": f"Тест {index}",
        "format_ru": "Обыкновенный",
        "protein_per": 10,
        "fats_per": 5,
        "carbohydrate_per": 20,
        "moisture_per": 60,
    }


class AdditionalIngredientImportTest(unittest.TestCase):
    def test_date_formatted_excel_serials_restore_displayed_decimals(self):
        self.assertEqual(4.8, excel_serial_as_decimal("46238"))
        self.assertEqual(4.9, excel_serial_as_decimal("46269"))
        self.assertEqual(1.5, excel_serial_as_decimal("46143"))

    def test_normalization_derives_calories_and_resolves_explicit_alias(self):
        rows = [workbook_row(index) for index in range(1, 80)]
        rows[0]["full_name_ingredient"] = "Coconut oil"
        rows[0]["name_ru"] = "Растительное Масло"
        rows[0]["format_ru"] = "Кокосовое"
        current = [{field: "" for field in INGREDIENT_FIELDS}]
        current[0].update({
            "full_name_ingredient": ALIASES["Coconut oil"],
            "name_ingredient_ru": "Растительное Масло",
            "format_ingredient_ru": "Кокосовое",
        })

        normalized = normalize_rows(rows, current)

        self.assertEqual(ALIASES["Coconut oil"], normalized[0]["full_name_ingredient"])
        self.assertEqual(147.5, normalized[0]["calories_kcal"])
        self.assertEqual("Растительное Масло", normalized[0]["match_name_ingredient_ru"])

    def test_existing_identity_is_stable_after_catalog_was_already_merged(self):
        rows = [workbook_row(index) for index in range(1, 80)]
        rows[0].update({
            "full_name_ingredient": "Flaxseed",
            "name_ru": "Семена и орехи",
            "format_ru": "Льна",
        })
        current = [{field: "" for field in INGREDIENT_FIELDS}]
        current[0].update({
            "full_name_ingredient": ALIASES["Flaxseed"],
            "name_ingredient_ru": "Семена и орехи",
            "format_ingredient_ru": "Льна",
        })

        normalized = normalize_rows(rows, current)

        self.assertEqual("Семена", normalized[0]["match_name_ingredient_ru"])
        self.assertEqual("Льна", normalized[0]["match_format_ingredient_ru"])

    def test_invalid_supported_value_is_rejected(self):
        rows = [workbook_row(index) for index in range(1, 80)]
        rows[7]["protein_per"] = -0.1

        with self.assertRaisesRegex(ValueError, "row 9: protein_per"):
            normalize_rows(rows, [])

    def test_snapshot_and_runtime_catalog_are_aligned(self):
        curated = load_csv(SNAPSHOT)
        ingredients = load_csv(INGREDIENTS)
        mapping = load_csv(MAPPING)
        self.assertEqual(79, len(curated))
        self.assertEqual(79, len({row["source_full_name"].casefold() for row in curated}))
        self.assertEqual(79, len({row["full_name_ingredient"].casefold() for row in curated}))

        by_full = {row["full_name_ingredient"].casefold(): row for row in ingredients}
        mapping_pairs = {
            (row["name_feed_ingredient"].casefold(), row["full_name_ingredient"].casefold())
            for row in mapping
        }
        for row in curated:
            runtime = by_full[row["full_name_ingredient"].casefold()]
            for field in INGREDIENT_FIELDS:
                self.assertEqual(str(row[field]), str(runtime[field]), f"{row['source_full_name']}: {field}")
            self.assertIn(
                (row["source_full_name"].casefold(), row["full_name_ingredient"].casefold()),
                mapping_pairs,
            )

    def test_known_source_artifacts_are_normalized(self):
        by_source = {row["source_full_name"]: row for row in load_csv(SNAPSHOT)}
        horse = by_source["Horse meat"]
        self.assertEqual("4.8", horse["iron_mg"])
        self.assertEqual("4.9", horse["zinc_mg"])
        self.assertEqual("4.6", horse["vitamin_b3_mg"])
        for name in ("Veal brisket bone", "Lamb rib", "Beef cartilage"):
            self.assertEqual("0.0", by_source[name]["carbohydrate_per"])

    def test_generated_migration_is_global_and_contains_every_curated_row(self):
        migration = generate_migration(load_csv(SNAPSHOT))
        self.assertIn("ingredient.owner_id IS NULL", migration)
        self.assertIn("TRUE, NULL, 100", migration)
        self.assertEqual(79, migration.split("), updated AS (")[0].count("\n    ("))

    def test_merge_is_deterministic(self):
        curated = load_csv(SNAPSHOT)
        current = load_csv(INGREDIENTS)
        once = merge_ingredients(current, curated)
        twice = merge_ingredients(
            [{field: str(row[field]) for field in INGREDIENT_FIELDS} for row in once],
            curated,
        )
        self.assertEqual(once, twice)


if __name__ == "__main__":
    unittest.main()
