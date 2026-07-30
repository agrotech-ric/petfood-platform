import pandas as pd

from collections import Counter, defaultdict
from typing import Dict, Tuple, List
import numpy as np

from sklearn.preprocessing import MinMaxScaler

import torch
from sentence_transformers import SentenceTransformer, util
from sklearn.cluster import SpectralClustering

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


numeric_cols = ['moisture', 'protein', 'fat','carbohydrate', 
                'dha', 'epa', 'epa_dha', 'omega_3', 'omega_6',

                'calcium', 'phospohorus', 'potassium', 'sodium', 
                'magnesium', 'iron', 'copper', 'zinc', 'chloride', 'sulphur',

                'vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 
                'vitamin_b1', 'vitamin_b2','vitamin_b3', 'vitamin_b5', 
                'vitamin_b6', 'vitamin_b7', 'vitamin_b9', 'vitamin_b12',

                'linoleic_acid', 'alpha_linolenic_acid', 
                'essential_fatty_acids','taurine', 'l_arginine', 'l_lysine', 
                'glutamine_glutamate', 'dl_methionine_l_cystine', 'bcaa_total', 
                'hydroxyproline', 'beta_carotene', 'l_carnitine', 'glucosamine', 
                'chondroitin_sulfate']

nutrient_cols = ['moisture_per', 'protein_per', 'fats_per', 'carbohydrate_per', 
       'dha_g', 'epa_g', 'epa_dha', 'omega_3', 'omega_6',

       'calcium_mg', 'phosphorus_mg', 'potassium_mg', 'sodium_mg', 'magnesium_mg', 
       'iron_mg', 'copper_mg', 'zinc_mg',
       
       'vitamin_a_mcg', 'vitamin_c_mg', 'vitamin_d_mcg','vitamin_e_mg', 'vitamin_k_mcg', 
       'vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b3_mg', 'vitamin_b5_mg', 'vitamin_b6_mg', 
       'vitamin_b7','vitamin_b9_mcg', 'vitamin_b12_mcg',

       'linoleic_acid_g', 'alpha_linolenic_acid_g', 'essential_fatty_acids',
       'taurine', 'l_arginine', 'l_lysine', 'glutamine_glutamate',
       'dl_methionine_l_cystine', 'bcaa_total', 'hydroxyproline',
       'beta_carotene_mcg', 'l_carnitine', 'glucosamine','chondroitin_sulfate', 
       'chloride', 'sulphur' ]

def prepocess_food(food: pd.DataFrame) -> pd.DataFrame:
    numeric_cols_up = [col for col in numeric_cols if col in food.columns]
    # Масштабирование отдельно для dry и wet
    scaler = MinMaxScaler()
    
    for food_type in food['food_form'].dropna().unique():
       mask = food['food_form'] == food_type
       food.loc[mask, numeric_cols_up] = scaler.fit_transform( food.loc[mask, numeric_cols_up])
    food = food.rename(
    columns={"moisture":"moisture_per",
             'protein': 'protein_per',
             'fat': 'fats_per',
             'carbohydrate': 'carbohydrate_per',
             'calcium': 'calcium_mg',
             'phospohorus': 'phosphorus_mg',
             'potassium': 'potassium_mg',
             'sodium': 'sodium_mg',
             'magnesium': 'magnesium_mg',
             'iron': 'iron_mg',
             'copper': 'copper_mg',
             'zinc': 'zinc_mg',
             'vitamin_a': 'vitamin_a_mcg',
             'vitamin_c': 'vitamin_c_mg',
             'vitamin_d': 'vitamin_d_mcg',
             'vitamin_e': 'vitamin_e_mg',
             'vitamin_k': 'vitamin_k_mcg',
             'vitamin_b1': 'vitamin_b1_mg',
             'vitamin_b2': 'vitamin_b2_mg',
             'vitamin_b6': 'vitamin_b6_mg',
             'vitamin_b9': 'vitamin_b9_mcg',
             'vitamin_b3':'vitamin_b3_mg',
             'vitamin_b5':'vitamin_b5_mg',
             'vitamin_b12':'vitamin_b12_mcg',
             'beta_carotene': 'beta_carotene_mcg',
             'linoleic_acid': 'linoleic_acid_g',
             'alpha_linolenic_acid': 'alpha_linolenic_acid_g',
             'epa': 'epa_g',
             'dha': 'dha_g'})
    return food

def load_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame,pd.DataFrame,]:
    """Load all CSV data files"""
    if 'dog_food_df' not in _data_cache:
        dog_food_df = pd.read_csv("data/dog_food_data.csv")
        disease_df = pd.read_csv("data/Disease.csv")
        merge_tab_df = pd.read_csv("data/mapping_ingredients.csv")
        ingredients_df = pd.read_csv("data/ingredients_data.csv")
        nutrients_transl = pd.read_csv("data/nutrients_transl.csv")

        # Preprocess
        dog_food_df["category"] = (dog_food_df["category"].fillna("").str.split(",").apply(lambda x: [i.strip() for i in x if i.strip()]))
        dog_food_df = prepocess_food(dog_food_df)

        disease_df = preprocess_disease(disease_df)

        ingredients_df["omega_3"] = ( ingredients_df["epa_g"].fillna(0) + ingredients_df["dha_g"].fillna(0) + ingredients_df["alpha_linolenic_acid_g"].fillna(0))
        ingredients_df["omega_6"] = ( ingredients_df["linoleic_acid_g"].fillna(0) + ingredients_df["arachidonic_acid_g"].fillna(0))
        ingredients_df['epa_dha'] = ingredients_df['epa_g']*0.5 + ingredients_df['dha_g']*0.5


        _data_cache['dog_food_df'] = dog_food_df
        _data_cache['disease_df'] = disease_df
        _data_cache['merge_tab_df'] = merge_tab_df
        _data_cache['ingredients_df'] = ingredients_df
        _data_cache['nutrients_transl'] = nutrients_transl

    return (
        _data_cache['dog_food_df'],
        _data_cache['disease_df'],
        _data_cache['merge_tab_df'],
        _data_cache['ingredients_df'],
        _data_cache['nutrients_transl']
    )


def build_unsup_ml_model():
    if 'model_encoding' in _model_cache:
        return _model_cache['model_encoding'],_model_cache['corpus_embeddings'], _data_cache["dog_food_df"]

    dog_food_df, _, _, _ , _ = load_data()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2",device=device)

    corpus = dog_food_df["description"].fillna("").tolist()
    corpus_embeddings = model.encode( corpus,
                                      convert_to_tensor=True,
                                      normalize_embeddings=True,
                                      show_progress_bar=True)
    X = corpus_embeddings  
    sc = SpectralClustering( n_clusters=45,
                             affinity="nearest_neighbors",
                             n_neighbors=15,
                             random_state=42 )
    labels = sc.fit_predict(X)
    dog_food_df["spectral_cluster"] = labels

    _model_cache['model_encoding'] = model
    _model_cache['corpus_embeddings'] = corpus_embeddings
    _data_cache['dog_food_df'] = dog_food_df

    return _model_cache['model_encoding'],_model_cache['corpus_embeddings'], _data_cache["dog_food_df"]

def get_disorder_keywords() -> Dict[str, str]:
    """Get disorder keyword mappings"""
    return  {
   "Inherited musculoskeletal disorders": "muscle joint bone cartilage jd joint mobility glucosamine arthritis cartilage flexibility",
   "Inherited gastrointestinal disorders": "digestive digestion stool food sensitivity hypoallergenic stomach digest stomach bowel sensitive diarrhea gut ibs",
   "Inherited endocrine disorders": "thyroid metabolism weight diabetes insulin hormone glucose",
   "Inherited eye disorders": "vision eye retina cataract antioxidant sight ocular",
   "Inherited nervous system disorders": "nervous system stress disrupted sleep brain brain seizure cognitive nerve neuro neurological cognition",
   "Inherited cardiovascular disorders": "heart hd heart cardiac circulation omega-3 blood pressure vascular",
   "Inherited skin disorders": "skin coat allergy skin allergy itch coat omega-6 dermatitis eczema flaky",
   "Inherited immune disorders": "immune defense resistance inflammatory autoimmune",
   "Inherited urinary and reproductive disorders": " urinary bladder stones urinary bladder kidney renal urine reproductive",
   "Inherited respiratory disorders": "breath respiratory airway lung cough breathing nasal",
   "Inherited blood disorders": "anemia blood iron hemoglobin platelets clotting hemophilia",
   "Aging care":"aging senior mature",
   "Puppy care":"puppy grow start",
   "Adult care":"adult immune optimal delicious",
   "weight management":"weight management overweight",
   "food sensitivity":"food sensitivity hypoallergenic stomach"	}


def ingredient_freq(series):
    cnt = Counter()
    for text in series.dropna():
        for ing in text.split(","):
            ing = ing.strip().lower()
            if ing:
                cnt[ing] += 1
    return cnt

def compute_ingredient_lift(high_cnt, low_cnt, n_high, n_low):
    rows = []
    all_ingredients = set(high_cnt) | set(low_cnt)
    for ing in all_ingredients:
        p_high = high_cnt.get(ing, 0) / max(n_high, 1)
        p_low = low_cnt.get(ing, 0) / max(n_low, 1)
        lift = (p_high + 1e-9) / (p_low + 1e-9)
        rows.append({"ingredient": ing,"lift": float(lift),"high_freq": float(p_high),"low_freq": float(p_low)})
    df = pd.DataFrame(rows)
    return df.sort_values("lift", ascending=False)

def cliffs_delta(x, y):
    x = np.asarray(x)
    y = np.asarray(y)
    greater = 0
    less = 0
    for xi in x:
        greater += np.sum(xi > y)
        less += np.sum(xi < y)
    delta = (greater - less) / (len(x) * len(y))
    return float(delta)

def nutrient_cliff(high_df, low_df):
    high_nutr = []
    low_nutr = []
    for col in nutrient_cols:
        delta = cliffs_delta(high_df[col],low_df[col])
        if delta > 0.2:
            high_nutr.append({"name": col, "effect": float(delta) })
        elif delta < -0.2:
            low_nutr.append({"name": col,"effect": float(delta)})
    return high_nutr, low_nutr

def ingr_nutr_food_find(query,dog_food_df,corpus_embeddings,model_encoding):

    query_embedding = model_encoding.encode(query, convert_to_tensor=True, normalize_embeddings=True)
    scores = util.cos_sim(query_embedding, corpus_embeddings)[0]
    dog_food_df["score"] = scores.cpu().numpy()
    df_pos = dog_food_df[dog_food_df["score"] > 0].copy()
    df_pos["score_norm"] = ( (df_pos["score"] - df_pos["score"].min()) /(df_pos["score"].max() - df_pos["score"].min() + 1e-9) )

    result = df_pos.sort_values("score_norm", ascending=False)
    cluster_id = result["spectral_cluster"].iloc[:2].tolist()

    high = result[result["spectral_cluster"].isin(cluster_id)]
    low = result[~result["spectral_cluster"].isin(cluster_id)]

    high_nutr, low_nutr = nutrient_cliff(high, low)

    high_cnt = ingredient_freq(high["ingredients"])
    low_cnt = ingredient_freq(low["ingredients"])

    ingredient_df = compute_ingredient_lift(high_cnt, low_cnt,len(high), len(low))
    ingredient_df = ingredient_df[ingredient_df["lift"] > 2]
       
    ingredients = [  {"name": r["ingredient"], "lift": r["lift"]} for _, r in ingredient_df.iterrows() ]
       
    return high_nutr, low_nutr, ingredients

def ingredients_category_nutrient_analysis(ingredirents_df):
   group_results = {}
   for group in ingredirents_df["category_ru"].dropna().unique():
      high_df = ingredirents_df[ingredirents_df["category_ru"] == group]
      low_df = ingredirents_df[ingredirents_df["category_ru"] != group]
      cliff_feats = {}
      for col in nutrient_cols:
          if col in high_df.columns:
             c = cliffs_delta(high_df[col], low_df[col])
             if c > 0.2:
                 cliff_feats[col] = round(float(c),3)
      group_results[group]=sorted(cliff_feats.items(), key=lambda x: (x[0]))
   return group_results


protein_source=['Мясо']
cerals=['Крупы']
veg_fruit=['Овощи и фрукты']
fat_oil=['Масло и жир']
water=['Вода, соль и сахар']
grace=['Зелень и специи']

sorce_categ=[protein_source,cerals,veg_fruit,fat_oil,grace,water]
main_nutr=["moisture_per","carbohydrate_per" ,"protein_per" ,"fats_per"]

def score_ingredient(row, high_dict, low_dict):
    score = 0.0
    for nutr, weight in high_dict.items():
        if nutr in row and pd.notna(row[nutr]):
            score += weight * row[nutr]
    for nutr, weight in low_dict.items():
        if nutr in row and pd.notna(row[nutr]):
            score += weight * row[nutr]
    return score

def find_ingredient(ingredirents_df, high_nutr_list, low_nutr_list, source_ingr_list):
    high_dict = {x["name"]: x["effect"] for x in high_nutr_list}
    low_dict = {x["name"]: x["effect"] for x in low_nutr_list}
    subset = ingredirents_df[ingredirents_df["full_name_ingredient"].isin(source_ingr_list)].copy()
    subset["score"] = subset.apply(score_ingredient, axis=1, args=(high_dict, low_dict))
    best_full_name = subset.sort_values("score", ascending=False).iloc[0]["full_name_ingredient"]
    return best_full_name

def output_name(best_full_name,ingredirents_df):
      best_full_name_result = (ingredirents_df.loc[ ingredirents_df["full_name_ingredient"] == best_full_name, ["name_ingredient_ru", "format_ingredient_ru"]].iloc[0] )
      answer = f"{best_full_name_result['name_ingredient_ru']}-{best_full_name_result['format_ingredient_ru']}"
      return answer 

def group_high_nutr_rec(high_nutr,group_results):
    grouped_high_nutr = defaultdict(list)
    for nutr in high_nutr:
        nutr_name = nutr["name"]
        found = False
        for category, nutrients in group_results.items():
            for nutr_full, score in nutrients:
                base_name = nutr_full
                if base_name == nutr_name:
                        grouped_high_nutr[category].append(nutr)
                        found = True
                        break
    return dict(grouped_high_nutr)

def group_ingr_rec(ingr_rec,df_standart):
    name_to_full = (df_standart.dropna(subset=["name_feed_ingredient", "full_name_ingredient"]).set_index("name_feed_ingredient")["full_name_ingredient"].to_dict())
    ingr_rec = sorted(ingr_rec,key=lambda x: x["lift"],reverse=True)
    ingr_rec_filtered = [{ **item,"name": name_to_full.get(item["name"].replace(" ", "_"), item["name"] ) }
        for item in ingr_rec if item["name"].replace(" ", "_") in name_to_full ]
    ingredient_to_category = ( df_standart.drop_duplicates("full_name_ingredient").set_index("full_name_ingredient")["category_ru"].to_dict())
    grouped_ingredients = defaultdict(list)
    for item in ingr_rec_filtered:
        ingredient = item["name"]
        category = ingredient_to_category.get(ingredient,"Не определено")
        grouped_ingredients[category].append(ingredient)
    return  dict(grouped_ingredients)

def define_ingredients(high_nutr,low_nutr,ingr_rec,ingredirents_df,group_results,df_standart):  #for index in range(len(df_results)):
    grouped_high_nutr=group_high_nutr_rec(high_nutr,group_results)
    grouped_ingredients=group_ingr_rec(ingr_rec,df_standart)

    finish_ingr_list=[]
    finish_ingr_list_norm_name=[]
    
  
    maxim_main_nutr= [h_n["name"]  for h_n in high_nutr if h_n["name"]  in main_nutr]
    if len(maxim_main_nutr)==0:
      maxim_main_nutr=["moisture_per","protein_per"]

    for source in sorce_categ:
        source_ingr_list_1 = [ing for cat in source if cat in grouped_ingredients for ing in  grouped_ingredients[cat]]
        source_ingr_list_2=[]
        for cat in source:
            mask = ingredirents_df["category_ru"] == cat
            if cat in protein_source:
                mask &= ((ingredirents_df["protein_per"] > 10) &(ingredirents_df["moisture_per"] > 60) &(ingredirents_df["protein_per"] > ingredirents_df["fats_per"]))
            if cat in veg_fruit:
                mask &= ((ingredirents_df["carbohydrate_per"]< 20) &(ingredirents_df["moisture_per"] > 75))
            source_ingr_list_2.extend( ingredirents_df.loc[mask, "full_name_ingredient"].tolist())
        flat_list = [  item for items in grouped_high_nutr.values()  for item in items]
        source_high_nutr_list= [ing for cat in source if cat in grouped_high_nutr for ing in  grouped_high_nutr[cat]]
        high_nutr_list = ( source_high_nutr_list if len(source_high_nutr_list) > 0 else flat_list)
        source_ingr_list= source_ingr_list_1 if len(source_ingr_list_1)>1 else source_ingr_list_2
      
        if source==water or source==grace:
          if set(source).intersection(set(grouped_high_nutr.keys())):
              best_full_name = find_ingredient(ingredirents_df, high_nutr_list, low_nutr,source_ingr_list)
              best_full_name_answer=output_name(best_full_name, ingredirents_df)
              finish_ingr_list_norm_name.append(best_full_name_answer)
              finish_ingr_list.append(best_full_name)
        else:
          best_full_name = find_ingredient(ingredirents_df, high_nutr_list, low_nutr,source_ingr_list)
          best_full_name_answer=output_name(best_full_name, ingredirents_df)
          finish_ingr_list_norm_name.append(best_full_name_answer)
          finish_ingr_list.append(best_full_name)
    if "moisture_per" in maxim_main_nutr and "WATER,BTLD,GENERIC" not in finish_ingr_list:
          best_full_name = "WATER,BTLD,GENERIC"
          best_full_name_answer=output_name(best_full_name, ingredirents_df)
          finish_ingr_list_norm_name.append(best_full_name_answer)
          finish_ingr_list.append(best_full_name)
    return finish_ingr_list, finish_ingr_list_norm_name, maxim_main_nutr
 
def transl_ingredient(ing, to_lang):
    _, _, _, ingredients_df,_ = load_data()
    try:
        if to_lang=="en":
           return ingredients_df.loc[ingredients_df["ingredient_format_cat"] == ing,"full_name_ingredient"].iloc[0]
        if to_lang=="ru":
           return ingredients_df.loc[ingredients_df["full_name_ingredient"] == ing,"ingredient_format_cat"].iloc[0]
    except IndexError:
        raise ValueError(f"Ingredient '{ing}' not found in translation table")

def transl_nutr(nutrient, to_lang):
    _, _, _, _,nutrients_transl = load_data()
    try:
        if to_lang=="en":
           return  nutrients_transl.loc[nutrients_transl["name_ru"].str.contains(nutrient, case=False, na=False),"name_in_database"].iloc[0]
        if to_lang=="ru":
           return nutrients_transl.loc[nutrients_transl["name_in_database"] == nutrient,"name_ru"].iloc[0]
    except IndexError:
        raise ValueError(f"Nutrient '{nutrient}' not found in translation table")
