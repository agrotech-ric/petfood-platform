from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
import pandas as pd
from scipy.optimize import linprog
from scipy.sparse import hstack, csr_matrix
import numpy as np
import itertools


from app.models import *
from app.utils import (
    load_data, build_unsup_ml_model, get_disorder_keywords,
    
    ingr_nutr_food_find, ingredients_category_nutrient_analysis, define_ingredients, 
    transl_ingredient,transl_nutr
)

from app.kcal_calculate import (
    kcal_calculate, protein_need_calc, get_other_nutrient_norms,
    size_category, age_type_category,
    age_category_types, size_types
)

from app.calc_recipe_method_2 import (calc_recipe)

app = FastAPI(
    title="Dog Food Calculator API",
    description="REST API for dog nutritional recommendations and recipe optimization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load data on startup
@app.on_event("startup")
async def startup_event():
    """Load data and build models on startup"""
    load_data()
    build_unsup_ml_model()


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Dog Food Calculator API is running",
        "version": "1.0.0"
    }


@app.get("/breeds", response_model=BreedsListResponse, tags=["Breeds"])
async def get_breeds():
    """Get list of all available dog breeds"""
    try:
        _, disease_df, _, _, _  = load_data()
        breeds = sorted(disease_df["Breed"].unique().tolist())
        return BreedsListResponse(breeds=breeds, count=breeds.__len__())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/breeds/{breed}", response_model=BreedDetailsResponse, tags=["Breeds"])
async def get_breed_details(breed: str):
    """Get details about a specific breed"""
    try:
        _, disease_df, _, _, _  = load_data()
        breed_data = disease_df[disease_df["Breed"] == breed]

        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2
        diseases = breed_data["Disease_ru"].unique().tolist()

        return BreedDetailsResponse(
            breed_info=BreedInfo(
                breed=breed,
                min_weight=float(min_weight),
                max_weight=float(max_weight),
                avg_weight=float(avg_weight),
                diseases=diseases
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/calories", response_model=CalorieCalculationResponse, tags=["Calculations"])
async def calculate_calories(request: DogInfoRequest):
    """Calculate daily caloric requirements for a dog"""
    try:
        _, disease_df, _, _, _  = load_data()

        # Get breed info
        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        # Determine size and age categories
        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, request.age_metric.value)

        # Get activity level based on age category
        activity_level = request.activity_level.value if request.activity_level else None

        # Calculate calories
        reproductive_status = request.reproductive_status.value if request.reproductive_status else None
        pregnancy_period = request.pregnancy_period.value if request.pregnancy_period else None
        lactation_week = request.lactation_week.value if request.lactation_week else None
        number_puppies = request.num_puppies if request.num_puppies else 0


        kcal, formula, page, additional_text = kcal_calculate(
            reproductive_status=reproductive_status,
            berem_time=pregnancy_period,
            num_pup= number_puppies ,
            L_time=lactation_week,
            age_type=age_type_categ,
            weight=request.weight,
            expected=avg_weight,
            activity_level=activity_level,
            user_breed=request.breed,
            age=request.age
        )

        return CalorieCalculationResponse(
            daily_kcal=max(0, kcal),
            formula=formula,
            reference_page=page,
            additional_text=additional_text,
            size_category=size_categ,
            age_category=age_type_categ
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/protein", response_model=ProteinRequirementResponse, tags=["Calculations"])
async def calculate_protein(request: DogInfoRequest, target_kcal: float):
    """Calculate daily protein requirements"""
    try:
        _, disease_df, _, _, _   = load_data()

        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, request.age_metric.value)

        reproductive_status = request.reproductive_status.value if request.reproductive_status else None

        protein_grams = protein_need_calc(
            kkal=target_kcal,
            age_type_categ=age_type_categ,
            w=request.weight,
            reproductive_status=reproductive_status,
            age=request.age,
            age_mesuare_type=request.age_metric.value
        )

        return ProteinRequirementResponse(daily_protein_grams=protein_grams)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/nutrients", response_model=NutrientNormsResponse, tags=["Calculations"])
async def calculate_nutrient_norms(request: DogInfoRequest, target_kcal: float):
    """Calculate nutrient norms for a dog"""
    try:
        _, disease_df, _, _, _ = load_data()

        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, request.age_metric.value)

        reproductive_status = request.reproductive_status.value if request.reproductive_status else None

        norms = get_other_nutrient_norms(
            kkal=target_kcal,
            age_type_categ=age_type_categ,
            w=request.weight,
            reproductive_status=reproductive_status
        )

        return NutrientNormsResponse(norms=norms)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommendations/disorder", response_model=DisorderRecommendationsResponse, tags=["Recommendations"])
async def get_disorder_recommendations(request: DisorderRequest):
    """Get ingredient and nutrient recommendations based on breed disorder"""
    try:
        _, disease_df, merge_tab_df, ingredients_df, nutrients_transl = load_data()
        model_encoding, corpus_embeddings, dog_food_df = build_unsup_ml_model()

        disorder_keywords = get_disorder_keywords()

        # Get breed and disorder info
        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        disorder_data = breed_data[breed_data["Disease_ru"] == request.disorder]
        if disorder_data.empty:
            raise HTTPException(status_code=404, detail=f"Disorder '{request.disorder}' not found for breed")

        disorder_type = disorder_data["Disorder"].values[0]
        # Build query vector
        keywords = disorder_keywords.get(disorder_type, request.disorder).lower()

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2
        breed_size = size_category(avg_weight)
        age_type_categ = age_type_category(breed_size, request.age, request.age_metric.value)

        query = f"{age_type_categ}, {breed_size} breed size, {keywords}, {disorder_type}"

        high_nutrients, low_nutrients, ingredients = ingr_nutr_food_find(query, dog_food_df, corpus_embeddings, model_encoding)
        group_results = ingredients_category_nutrient_analysis(ingredients_df)
        finish_ingr_list, finish_ingr_list_norm_name, maxim_main_nutr = define_ingredients(high_nutrients, low_nutrients, ingredients, ingredients_df, group_results, merge_tab_df)
        
        nutr_ranges = {}
        nutr_ranges['moisture_per'] = {"min": 65, "max": 95}
        
        s = dog_food_df[(dog_food_df["food_form"] == "wet food") & (dog_food_df["moisture_per"] > 0.5)]["protein_per"]
        protein_min = (100 - nutr_ranges['moisture_per']["min"]) * 0.25
        protein_min = protein_min if protein_min > s.mean() - s.std() else s.mean() - s.std()
        nutr_ranges['protein_per'] = {"min": int(protein_min), "max": 30}
        
        s = dog_food_df[(dog_food_df["food_form"] == "wet food") & (dog_food_df["moisture_per"] > 0.5)]["fats_per"]
        fats_min = (100 - nutr_ranges['moisture_per']["min"]) * 0.085
        fats_min = fats_min if fats_min > s.mean() - s.std() else s.mean() - s.std()
        nutr_ranges['fats_per'] = {"min": int(fats_min), "max": 15}
        
        carb_max = 100 - nutr_ranges['protein_per']["min"] - nutr_ranges['fats_per']["min"] - nutr_ranges['moisture_per']["min"]
        nutr_ranges['carbohydrate_per'] = {"min": 5, "max": int(carb_max)}
        
        return DisorderRecommendationsResponse(
            disorder=request.disorder,
            disorder_type=disorder_type,
            breed_size=breed_size,
            recommended_ingredients=finish_ingr_list_norm_name,
            nutrients_ranges=nutr_ranges
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _optimize_recipe_impl(request: OptimizeRecipeRequest) -> OptimizedRecipeResponse:
    """Optimize food recipe composition based on constraints (CPU-bound)."""
    try:
        _, disease_df, merge_tab_df, ingredients_df, nutrients_transl = load_data()

        breed_data = disease_df[disease_df["Breed"] == request.breed]
        if breed_data.empty:
            raise HTTPException(status_code=404, detail=f"Breed '{request.breed}' not found")

        min_weight = breed_data["min_weight"].values[0]
        max_weight = breed_data["max_weight"].values[0]
        avg_weight = (min_weight + max_weight) / 2

        size_categ = size_category(avg_weight)
        age_type_categ = age_type_category(size_categ, request.age, "years")

        reproductive_status = request.reproductive_status.value if request.reproductive_status else None

        norms = get_other_nutrient_norms(
            kkal=request.target_kcal,
            age_type_categ=age_type_categ,
            w=request.weight,
            reproductive_status=reproductive_status
        )

        # Prepare nutrient columns
        main_nutrs=['moisture_per', 'protein_per', 'carbohydrate_per', 'fats_per']
        other_nutrients_1=['ash_g', 'fiber_g', 'cholesterol_mg', 'total_sugar_g']
        other_nutrients_2 = ['choline_mg', 'selenium_mcg', 'iodine_mcg', 'linoleic_acid_g','alpha_linolenic_acid_g', 'arachidonic_acid_g', 'epa_g', 'dha_g']
        other_nutrients=other_nutrients_1+other_nutrients_2
        major_minerals=['calcium_mg', 'phosphorus_mg', 'magnesium_mg', 'sodium_mg', 'potassium_mg', 'iron_mg', 'copper_mg', 'zinc_mg', 'manganese_mg']
        vitamins=['vitamin_a_mcg', 'vitamin_e_mg', 'vitamin_d_mcg', 'vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b3_mg', 'vitamin_b5_mg', 
                'vitamin_b6_mg', 'vitamin_b9_mcg', 'vitamin_b12_mcg', 'vitamin_c_mg', 'vitamin_k_mcg']


        all_nutrs = main_nutrs+major_minerals+vitamins+other_nutrients

        get_en_name={
            'Влага':'moisture_per', 
            'Белки': 'protein_per', 
            'Углеводы':'carbohydrate_per',
             'Жиры': 'fats_per'
        }
        # Create food dict
        food = ingredients_df.set_index("full_name_ingredient")[all_nutrs].to_dict(orient='index') 
  
        food_keys = set(food.keys())
        ingr_ranges = request.ingredient_ranges

        if len(ingr_ranges)==0:
            raise HTTPException(
                status_code=400,
                detail="Выберите хотя бы один ингредиент.",
            )

        ingredient_names = [transl_ingredient(ing.ingredient,"en") for ing in ingr_ranges]
        nutr_ranges = {get_en_name[nr.nutrient]: (nr.min_value, nr.max_value) for nr in request.nutrient_ranges}
        maximize_nutrients = get_en_name[request.maximize_nutrients] if request.maximize_nutrients else ["Влага", "Белки"]
        
       
        ingr_ranges_data = [(ing.min_percent, ing.max_percent) for ing in ingr_ranges]
        lowest = sum([low for (low, high) in ingr_ranges_data])
        highest = sum([high for (low, high) in ingr_ranges_data])
       
        if lowest > 100:
            factor = 99 / lowest
            ingr_ranges_data = [(low * factor, high) for (low, high) in ingr_ranges_data]
        elif highest < 100:
            factor = 101 / highest
            ingr_ranges_data = [(low, high * factor) for (low, high) in ingr_ranges_data]
				
        # Build LP problem
        A = [
            [food[ing][nutr] if val > 0 else -food[ing][nutr]
             for ing in ingredient_names]
            for nutr in nutr_ranges
            for val in (-nutr_ranges[nutr][0] , nutr_ranges[nutr][1] )
        ]
        b = [
            val/100  for nutr in nutr_ranges
            for val in (-nutr_ranges[nutr][0], nutr_ranges[nutr][1])
        ]

        A_eq = [[1 for _ in ingredient_names]]
        b_eq = [1.0]
        bounds = [(low / 100, high / 100) for (low, high) in ingr_ranges_data]

        # Objective function
        f = [-sum(food[i][nutr] for nutr in maximize_nutrients if nutr in food[i])
             for i in ingredient_names]


        # Try linear programming
        res = linprog(f, A_ub=A, b_ub=b, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")

        if res.success:
            # Success - format response
            result = {name: round(val * 100, 2) for name, val in zip(ingredient_names, res.x)}

            nutrients_100g = {
                 nutr: 
                round(sum(res.x[i] * food[name][nutr]*100 for i, name in enumerate(ingredient_names)), 2)
                for nutr in main_nutrs
            }

            energy_100g = (3.5 * nutrients_100g["protein_per"] +
                           8.5 * nutrients_100g["fats_per"] +
                           3.5 * nutrients_100g["carbohydrate_per"])

            needed_feed_g = (request.target_kcal * 100) / energy_100g

            ingredients_required = {
                name: round((weight * needed_feed_g / 100), 2)
                for name, weight in result.items()
            }


            count_nutr_cont_all = {
                nutr: round(sum(amount * food[ingredient][nutr] for ingredient, amount in ingredients_required.items()),
                            2)
                for nutr in all_nutrs
            }

            nutrient_deficiencies = {}
            for nutrient_name, required_amount in count_nutr_cont_all.items():
                nutrient_name=transl_nutr(nutrient_name,"ru")
                fixed_nutrient_name = nutrient_name.split(",")[0]
                measure = nutrient_name.split(",")[1] if nutrient_name.split(",").__len__() > 1 else ""
                actual_amount = norms.get(fixed_nutrient_name, 0)
                deficit = required_amount - actual_amount
                nutrient_deficiencies[fixed_nutrient_name] = f"{round(abs(deficit), 2)}{measure}"
            composition = [RecipeComposition(ingredient=transl_ingredient(k,"ru"), grams_per_100g=v) for k, v in result.items()]

            nutritional_100g = [
                NutritionalValue(nutrient=transl_nutr(k,"ru").split(",")[0], value_per_100g=v, unit="г")
                for k, v in nutrients_100g.items()
            ]

            nutritional_total = [
                NutritionalValue(
                    nutrient=transl_nutr(k,"ru").split(",")[0],
                    value_per_100g=v,
                    unit=transl_nutr(k,"ru").split(",")[-1].strip() if "," in transl_nutr(k,"ru") else "г"
                )
                for k, v in count_nutr_cont_all.items()
            ]

            ingredients_required_ru = {
                transl_ingredient(name,"ru"): round((weight * needed_feed_g / 100), 2)
                for name, weight in result.items()
            }

            return OptimizedRecipeResponse(
                success=True,
                composition=composition,
                nutritional_value_per_100g=nutritional_100g,
                energy_per_100g=round(energy_100g, 2),
                total_feed_grams=round(needed_feed_g, 2),
                ingredients_required=ingredients_required_ru,
                nutritional_value_total=nutritional_total,
                nutrient_deficiencies=nutrient_deficiencies,
                method="optimization"
            )
        else:
            fallback_method = "combinatory search"
            best_recipe = calc_recipe(ingr_ranges_data, nutr_ranges, ingredient_names, food)

            if best_recipe is None:
                raise HTTPException(status_code=400, detail="Could not find valid recipe composition")

            values, totals = best_recipe


            energy_100g = (3.5 * nutrients_100g["protein_per"] +
                           8.5 * nutrients_100g["fats_per"] +
                           3.5 * nutrients_100g["carbohydrate_per"])

            needed_feed_g = (request.target_kcal * 100) / energy_100g

            ingredients_required = {
                name: round((weight * needed_feed_g / 100), 2)
                for name, weight in values.items()
            }

            all_nutrients = main_nutrs + other_nutrients_1 + other_nutrients_2 + major_minerals + vitamins
            count_nutr_cont_all = {
                nutr: round(sum(amount * food[ingredient][nutr] for ingredient, amount in ingredients_required.items()),
                            2)
                for nutr in all_nutrients
            }

            nutrient_deficiencies = {}
            for nutrient_name, required_amount in count_nutr_cont_all.items():
                nutrient_name=transl_nutr(nutrient_name,"ru")
                fixed_nutrient_name = nutrient_name.split(",")[0]
                measure = nutrient_name.split(",")[1] if nutrient_name.split(",").__len__() > 1 else ""
                actual_amount = norms.get(fixed_nutrient_name, 0)
                deficit = required_amount - actual_amount
                nutrient_deficiencies[fixed_nutrient_name] = f"{round(abs(deficit), 2)}{measure}"

            composition = [RecipeComposition(ingredient=transl_ingredient(k,"ru"), grams_per_100g=v) for k, v in values.items()]

            nutritional_100g = [
                NutritionalValue(nutrient=transl_nutr(k,"ru").split(",")[0], value_per_100g=round(v, 2), unit="г")
                for k, v in totals.items()
            ]

            nutritional_total = [
                NutritionalValue(
                    nutrient=transl_nutr(k,"ru").split(",")[0],
                    value_per_100g=v,
                    unit=transl_nutr(k,"ru").split(",")[-1].strip() if "," in transl_nutr(k,"ru") else "г"
                )
                for k, v in count_nutr_cont_all.items()
            ]

            ingredients_required_ru = { transl_ingredient(name,"ru"): round((weight * needed_feed_g / 100), 2)
                for name, weight in result.items()}

            return OptimizedRecipeResponse(
                success=True,
                composition=composition,
                nutritional_value_per_100g=nutritional_100g,
                energy_per_100g=round(energy_100g, 2),
                total_feed_grams=round(needed_feed_g, 2),
                ingredients_required=ingredients_required_ru,
                nutritional_value_total=nutritional_total,
                nutrient_deficiencies=nutrient_deficiencies,
                method=fallback_method
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize/recipe", response_model=OptimizedRecipeResponse, tags=["Recipe Optimization"])
async def optimize_recipe(request: OptimizeRecipeRequest):
    """Run recipe optimization without blocking other API requests."""
    try:
        return await asyncio.to_thread(_optimize_recipe_impl, request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
