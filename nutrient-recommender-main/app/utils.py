import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge, RidgeClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import hstack, csr_matrix
from collections import Counter
from typing import Dict, Tuple, List
import numpy as np

# Global storage for loaded data and models
_data_cache = {}
_model_cache = {}


def classify_breed_size(row):
    """Classify breed size based on weight"""
    w = (row["min_weight"] + row["max_weight"]) / 2
    if w <= 10:
        return "Small Breed"
    elif w <= 25:
        return "Medium Breed"
    else:
        return "Large Breed"


def preprocess_disease(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocess disease dataframe"""
    df = df.copy()
    df["breed_size_category"] = df.apply(classify_breed_size, axis=1)
    return df


def preprocess_food(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocess food dataframe"""
    df = df.copy()
    nutrients = [
        "protein", "fat", "carbohydrate (nfe)", "crude fibre", "calcium",
        "phospohorus", "potassium", "sodium", "magnesium", "vitamin e",
        "vitamin c", "omega-3-fatty acids", "omega-6-fatty acids",
    ]
    for col in nutrients:
        df[col] = (
            df[col]
            .astype(str)
            .str.replace("%", "")
            .str.replace("IU/kg", "")
            .str.extract(r"([\d\.]+)")
            .astype(float)
            .fillna(0.0)
        )

    df["combined_text"] = (
        df["ingredients"].fillna("")
        .str.cat(df["key benefits"].fillna(""), sep=" ", na_rep="")
        .str.cat(df["product title"].fillna(""), sep=" ", na_rep="")
        .str.cat(df["product description"].fillna(""), sep=" ", na_rep="")
        .str.cat(df["helpful tips"].fillna(""), sep=" ", na_rep="")
        .str.cat(df["need/preference"].fillna(""), sep=" ", na_rep="")
        .str.cat(df["alternate product recommendation"].fillna(""), sep=" ", na_rep="")
    )
    return df


def load_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load all CSV data files"""
    if 'food_df' not in _data_cache:
        food_df = pd.read_csv("data/FINAL_COMBINED.csv")
        disease_df = pd.read_csv("data/Disease.csv")
        merge_tab_df = pd.read_csv("data/merge_tab.csv")
        food_ingredients_df = pd.read_csv("data//food_ingrediets.csv")

        # Preprocess
        food_df = preprocess_food(food_df)
        disease_df = preprocess_disease(disease_df)

        # Process food_ingredients
        cols_to_divide = ['Влага', 'Белки', 'Углеводы', 'Жиры']
        other_nutrients = ["Зола, г", "Клетчатка, г", "Холестерин, мг", "Сахар общее, г",
                           "Холин, мг", "Селен, мкг", "Йод, мкг", "Пантотеновая кислота, мг",
                           "Линолевая кислота, г", "Фолиевая кислота, мкг",
                           "Альфа-линоленовая кислота, г", "Арахидоновая кислота, г",
                           "ЭПК (50-60%) + ДГК (40-50%), г"]
        major_minerals = ["Кальций, мг", "Медь, мг", "Железо, мг", "Магний, мг", "Фосфор, мг",
                          "Калий, мг", "Натрий, мг", "Цинк, мг", "Марганец, мг"]
        vitamins = ["Витамин A, мкг", "Витамин E, мг", "Витамин Д, мкг",
                    "Витамин В1 (тиамин), мг", "Витамин В2 (Рибофлавин), мг",
                    "Витамин В3 (Ниацин), мг", "Витамин В6, мг", "Витамин В12, мкг"]

        for col in cols_to_divide + other_nutrients + major_minerals + vitamins:
            if col != 'ЭПК (50-60%) + ДГК (40-50%), г':
                food_ingredients_df[col] = food_ingredients_df[col].astype(str).str.replace(',', '.', regex=False)
                food_ingredients_df[col] = pd.to_numeric(food_ingredients_df[col], errors='coerce')

        food_ingredients_df['ЭПК (50-60%) + ДГК (40-50%), г'] = (
                food_ingredients_df['ЭПК, г'] * 0.5 + food_ingredients_df['ДГК, г'] * 0.5
        )
        food_ingredients_df[cols_to_divide + other_nutrients + major_minerals + vitamins] = (
                food_ingredients_df[cols_to_divide + other_nutrients + major_minerals + vitamins] / 100
        )
        food_ingredients_df['ингредиент и описание'] = (
                food_ingredients_df['Ингредиенты'] + ' — ' + food_ingredients_df['Описание']
        )

        _data_cache['food_df'] = food_df
        _data_cache['disease_df'] = disease_df
        _data_cache['merge_tab_df'] = merge_tab_df
        _data_cache['food_ingredients_df'] = food_ingredients_df

    return (
        _data_cache['food_df'],
        _data_cache['disease_df'],
        _data_cache['merge_tab_df'],
        _data_cache['food_ingredients_df']
    )


def build_ml_models():
    """Build and cache all ML models"""
    if 'vectorizer' in _model_cache:
        return _model_cache

    food_df, _, _, _ = load_data()

    # Text vectorization
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    X_tfidf = vectorizer.fit_transform(food_df["combined_text"])

    svd = TruncatedSVD(n_components=100, random_state=42)
    X_text_reduced = svd.fit_transform(X_tfidf)

    # Categorical encoding
    encoder = OneHotEncoder(sparse_output=True, handle_unknown="ignore")
    cats = food_df[["breed size", "lifestage"]].fillna("Unknown")
    encoder.fit(cats)
    X_categorical = encoder.transform(cats)

    # Combine features
    X_sparse_text = csr_matrix(X_text_reduced)
    X_combined = hstack([X_sparse_text, X_categorical])

    # Train nutrient models
    nutrient_models = {}
    scalers = {}
    nutrients = [
        "protein", "fat", "carbohydrate (nfe)", "crude fibre", "calcium",
        "phospohorus", "potassium", "sodium", "magnesium", "vitamin e",
        "vitamin c", "omega-3-fatty acids", "omega-6-fatty acids",
    ]
    to_scale = {
        "sodium", "omega-3-fatty acids", "omega-6-fatty acids",
        "calcium", "phospohorus", "potassium", "magnesium",
    }

    for nutrient in nutrients:
        y = food_df[nutrient].fillna(food_df[nutrient].median()).values.reshape(-1, 1)
        if nutrient in to_scale:
            scaler = StandardScaler()
            y_scaled = scaler.fit_transform(y).ravel()
        else:
            scaler = None
            y_scaled = y.ravel()

        X_train, _, y_train, _ = train_test_split(X_combined, y_scaled, test_size=0.2, random_state=42)

        base = Ridge()
        search = GridSearchCV(base, param_grid={"alpha": [0.1, 1.0]}, scoring="r2", cv=2, n_jobs=-1)
        search.fit(X_train, y_train)

        nutrient_models[nutrient] = search.best_estimator_
        scalers[nutrient] = scaler

    # Train ingredient models
    all_ings = []
    for txt in food_df["ingredients"].dropna():
        tokens = [i.strip().lower() for i in txt.split(",")]
        all_ings.extend(tokens)

    counts = Counter(all_ings)
    frequent = [ing for ing, cnt in counts.items() if cnt >= 5]

    targets = {}
    low = food_df["ingredients"].fillna("").str.lower()
    for ing in frequent:
        targets[ing] = low.apply(lambda s: int(ing in s)).values

    ingredient_models = {}
    for ing, y in targets.items():
        clf = RidgeClassifier()
        clf.fit(X_combined, y)
        ingredient_models[ing] = clf

    # Cache everything
    _model_cache['vectorizer'] = vectorizer
    _model_cache['svd'] = svd
    _model_cache['encoder'] = encoder
    _model_cache['X_text_reduced'] = X_text_reduced
    _model_cache['X_categorical'] = X_categorical
    _model_cache['X_combined'] = X_combined
    _model_cache['nutrient_models'] = nutrient_models
    _model_cache['scalers'] = scalers
    _model_cache['ingredient_models'] = ingredient_models
    _model_cache['frequent_ingredients'] = frequent

    return _model_cache


def get_disorder_keywords() -> Dict[str, str]:
    """Get disorder keyword mappings"""
    return {
        "Inherited musculoskeletal disorders": "joint mobility glucosamine arthritis cartilage flexibility",
        "Inherited gastrointestinal disorders": "digest stomach bowel sensitive diarrhea gut ibs",
        "Inherited endocrine disorders": "thyroid metabolism weight diabetes insulin hormone glucose",
        "Inherited eye disorders": "vision eye retina cataract antioxidant sight ocular",
        "Inherited nervous system disorders": "brain seizure cognitive nerve neuro neurological cognition",
        "Inherited cardiovascular disorders": "heart cardiac circulation omega-3 blood pressure vascular",
        "Inherited skin disorders": "skin allergy itch coat omega-6 dermatitis eczema flaky",
        "Inherited immune disorders": "immune defense resistance inflammatory autoimmune",
        "Inherited urinary and reproductive disorders": "urinary bladder kidney renal urine reproductive",
        "Inherited respiratory disorders": "breath respiratory airway lung cough breathing nasal",
        "Inherited blood disorders": "anemia blood iron hemoglobin platelets clotting hemophilia",
    }


def get_ingredient_categories(merge_tab_df: pd.DataFrame, food_ingredients_df: pd.DataFrame) -> Dict[str, List[str]]:
    """Get ingredient category mappings"""
    proteins = merge_tab_df[merge_tab_df["Type"].isin(["Яйца и Молочные продукты", "Мясо"])]["Ingredient"].tolist()
    oils = merge_tab_df[merge_tab_df["Type"].isin(["Масло и жир"])]["Ingredient"].tolist()
    carbonates_cer = merge_tab_df[merge_tab_df["Type"].isin(["Крупы"])]["Ingredient"].tolist()
    carbonates_veg = merge_tab_df[merge_tab_df["Type"].isin(["Зелень и специи", "Овощи и фрукты"])][
        "Ingredient"].tolist()
    other = merge_tab_df[merge_tab_df["Type"].isin(["Вода, соль и сахар"])]["Ingredient"].tolist()
    water = ["Вода — Обыкновенный"]

    proteins_full = food_ingredients_df[food_ingredients_df["Категория"].isin(["Яйца и Молочные продукты", "Мясо"])][
        "ингредиент и описание"].tolist()
    oils_full = food_ingredients_df[food_ingredients_df["Категория"].isin(["Масло и жир"])][
        "ингредиент и описание"].tolist()
    carbonates_cer_full = food_ingredients_df[food_ingredients_df["Категория"].isin(["Крупы"])][
        "ингредиент и описание"].tolist()
    carbonates_veg_full = \
    food_ingredients_df[food_ingredients_df["Категория"].isin(["Зелень и специи", "Овощи и фрукты"])][
        "ингредиент и описание"].tolist()
    other_full = food_ingredients_df[food_ingredients_df["Категория"].isin(["Вода, соль и сахар"])][
        "ингредиент и описание"].tolist()

    return {
        'proteins': proteins,
        'oils': oils,
        'carbonates_cer': carbonates_cer,
        'carbonates_veg': carbonates_veg,
        'other': other,
        'water': water,
        'proteins_full': proteins_full,
        'oils_full': oils_full,
        'carbonates_cer_full': carbonates_cer_full,
        'carbonates_veg_full': carbonates_veg_full,
        'other_full': other_full
    }