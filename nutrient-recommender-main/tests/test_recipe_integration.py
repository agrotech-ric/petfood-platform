import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.main import _optimize_recipe_impl
from app.models import IngredientProfile, IngredientRange, NutrientRange, OptimizeRecipeRequest


def request_for(ingredient, profile=None, protein_range=(0, 100)):
    return OptimizeRecipeRequest(
        weight=5.7,
        age=18,
        age_metric="months",
        breed="dachshund",
        ingredients=[ingredient],
        ingredient_ranges=[
            IngredientRange(ingredient=ingredient, min_percent=100, max_percent=100),
        ],
        nutrient_ranges=[
            NutrientRange(nutrient="Влага", min_value=0, max_value=100),
            NutrientRange(nutrient="Белки", min_value=protein_range[0], max_value=protein_range[1]),
            NutrientRange(nutrient="Углеводы", min_value=0, max_value=100),
            NutrientRange(nutrient="Жиры", min_value=0, max_value=100),
        ],
        maximize_nutrients=[],
        target_kcal=461.12,
        ingredient_profiles=[profile] if profile else [],
    )


class RecipeIntegrationTest(unittest.TestCase):
    def test_main_lp_result_preserves_composition_and_uses_daily_units(self):
        result = _optimize_recipe_impl(request_for("Курица — Мясо"))

        self.assertEqual("optimization", result.method)
        self.assertEqual(100, result.composition[0].grams_per_100g)
        self.assertAlmostEqual(101.05, result.energy_per_100g, places=2)
        moisture = next(item for item in result.nutritional_value_total if item.nutrient == "Влага")
        self.assertEqual("г", moisture.unit)
        self.assertAlmostEqual(344.36, moisture.value_per_100g, places=2)

    def test_custom_ingredient_profile_is_request_scoped(self):
        name = "Тестовый белок — Порошок"
        profile = IngredientProfile(
            ingredient=name,
            nutrients={
                "moisture_per": 10,
                "protein_per": 60,
                "carbohydrate_per": 20,
                "fats_per": 10,
                "calcium_mg": 100,
            },
        )

        result = _optimize_recipe_impl(request_for(name, profile))

        self.assertEqual(name, result.composition[0].ingredient)
        self.assertIn(name, result.ingredients_required)
        calcium = next(item for item in result.nutritional_value_total if item.nutrient == "Кальций")
        self.assertAlmostEqual(126.33, calcium.value_per_100g, places=2)

    def test_optimization_passes_month_age_metric_to_model(self):
        with patch("app.main.age_type_category", return_value="adult") as age_category:
            _optimize_recipe_impl(request_for("Курица — Мясо"))

        age_category.assert_called_once_with("small", 18, "months")

    def test_infeasible_lp_returns_diagnostic_without_combinatory_search(self):
        with patch("app.main.calc_recipe") as fallback:
            with self.assertRaises(HTTPException) as raised:
                _optimize_recipe_impl(request_for("Курица — Мясо", protein_range=(50, 60)))

        fallback.assert_not_called()
        self.assertEqual(400, raised.exception.status_code)
        self.assertIn("Белки", raised.exception.detail)
        self.assertIn("требуется не менее 50.00%", raised.exception.detail)

    def test_fallback_uses_its_own_composition(self):
        name = "Тестовый белок — Порошок"
        profile = IngredientProfile(
            ingredient=name,
            nutrients={
                "moisture_per": 10,
                "protein_per": 60,
                "carbohydrate_per": 20,
                "fats_per": 10,
            },
        )
        totals = {
            "moisture_per": 10,
            "protein_per": 60,
            "carbohydrate_per": 20,
            "fats_per": 10,
        }

        with patch("app.main.linprog", return_value=SimpleNamespace(success=False, status=1)):
            with patch("app.main.calc_recipe", return_value=({name: 100}, totals)):
                result = _optimize_recipe_impl(request_for(name, profile))

        self.assertEqual("combinatory search", result.method)
        self.assertEqual(name, result.composition[0].ingredient)
        self.assertIn(name, result.ingredients_required)


if __name__ == "__main__":
    unittest.main()
