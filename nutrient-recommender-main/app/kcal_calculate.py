import textwrap

metrics_age_types = ["years", "months"]
gender_types = ["male", "female"]
rep_status_types = [ 'none' , 'pregnancy' , 'lactation']
berem_time_types = ["early_4_weeks", "last_5_weeks"]
lact_time_types = ['week_1', 'week_2', 'week_3', 'week_4']

lact_time_types_dict = {
    'week_1':"1 недели", 
    'week_2':"2 недели", 
    'week_3':"3 недели", 
    'week_4':"4 недели"
   }


age_category_types = ["puppy", "adult", "senior"]
size_types = ["small", "medium", "large", "extra_large"]
activity_level_cat_1 = ["passive", "low","moderate","active",
                        "extreme", "obesity_prone"]
activity_level_cat_2 = ["passive", "moderate", "active"]



def protein_need_calc(kkal, age_type_categ, w, reproductive_status, age, age_mesuare_type):
    protein_n = 0
    if age_type_categ == age_category_types[0]:
        protein_n = 56.3 * kkal / 1000 if (
                    age_mesuare_type == metrics_age_types[1] and age <= 3) else 43.8 * kkal / 1000
    elif reproductive_status == rep_status_types[1] or reproductive_status == rep_status_types[2]:
        protein_n = 50 * kkal / 1000
    else:
        protein_n = 3.28 * (w ** 0.75)
    return protein_n


def get_other_nutrient_norms(kkal, age_type_categ, w, reproductive_status):
    if age_type_categ == age_category_types[0]:
        nutrients_per_1000_kcal = {
         "calcium_mg": 3000*kkal/1000,
         "phosphorus_mg": 2500*kkal/1000,
         "magnesium_mg": 100*kkal/1000,
         "sodium_mg": 550*kkal/1000,
         "potassium_mg": 1100*kkal/1000,
         "iron_mg": 22*kkal/1000,
         "copper_mg": 2.7*kkal/1000,
         "zinc_mg": 25*kkal/1000,
         "manganese_mg": 1.4*kkal/1000,

         "vitamin_a_mcg": 378.9*kkal/1000,
         "vitamin_d_mcg": 3.4*kkal/1000,
         "vitamin_e_mg": 7.5*kkal/1000,
         "vitamin_b1_mg": 0.34*kkal/1000,
         "vitamin_b2_mg": 1.32*kkal/1000,
         "vitamin_b3_mg": 4.25*kkal/1000,
         "vitamin_b6_mg": 0.375*kkal/1000,
         "vitamin_b12_mcg": 8.75*kkal/1000,
                         
         "selenium_mcg": 87.5*kkal/1000,
         "choline_mg": 425*kkal/1000,
         "vitamin_b5_mg": 3.75*kkal/1000,
         "linoleic_acid_g": 3.3*kkal/1000,
         "vitamin_b9_mcg": 68*kkal/1000,
         "alpha_linolenic_acid_g": 0.2*kkal/1000,
         "arachidonic_acid_g": 0.08*kkal/1000,
         "epa_dha": 0.13*kkal/1000,
           
         "iodine_mcg": 220*kkal/1000,
         "Биотин (мкг)": 4*kkal/1000 }

        return nutrients_per_1000_kcal

    elif reproductive_status == rep_status_types[1] or reproductive_status == rep_status_types[2]:
        nutrients_per_1000_kcal = {
         "calcium_mg": 1900*kkal/1000,
         "phosphorus_mg": 1200*kkal/1000,
         "magnesium_mg": 150*kkal/1000,
         "sodium_mg": 500*kkal/1000,
         "potassium_mg": 900*kkal/1000,
         "iron_mg": 17*kkal/1000,
         "copper_mg": 3.1*kkal/1000,
         "zinc_mg": 24*kkal/1000,
         "manganese_mg": 1.8*kkal/1000,

         "vitamin_a_mcg": 378.9*kkal/1000,
         "vitamin_d_mcg": 3.4*kkal/1000,
         "vitamin_e_mg": 7.5*kkal/1000,
         "vitamin_b1_mg": 0.56*kkal/1000,
         "vitamin_b2_mg": 1.3*kkal/1000,
         "vitamin_b3_mg": 4.25*kkal/1000,
         "vitamin_b6_mg": 0.375*kkal/1000,
         "vitamin_b12_mcg": 8.75*kkal/1000,

         "selenium_mcg": 87.5*kkal/1000,
         "choline_mg": 425*kkal/1000,
         "vitamin_b5_mg": 3.75*kkal/1000,
         "vitamin_b9_mcg": 67.5*kkal/1000,
         "linoleic_acid_g": 3.3*kkal/1000,
         "alpha_linolenic_acid_g": 0.2*kkal/1000,
         "epa_dha": 0.13*kkal/1000,

         "iodine_mcg": 220*kkal/1000,
         "Биотин": 4*kkal/1000}
        return nutrients_per_1000_kcal

    else:
        other_for_adult = {
         "calcium_mg": 130*(w**0.75),
         "phosphorus_mg": 100*(w**0.75),
         "magnesium_mg": 19.7*(w**0.75),
         "sodium_mg": 26.2*(w**0.75),
         "potassium_mg": 140*(w**0.75),
         "iron_mg": 1.0*(w**0.75),
         "copper_mg": 0.2*(w**0.75),
         "zinc_mg": 2.0*(w**0.75),
         "manganese_mg": 0.16*(w**0.75),

         "vitamin_a_mcg": 4.175*(w**0.75),
         "vitamin_d_mcg": 0.45*(w**0.75),
         "vitamin_e_mg": 1.0*(w**0.75),
         "vitamin_b1_mg": 0.074*(w**0.75),
         "vitamin_b2_mg": 0.171*(w**0.75),
         "vitamin_b3_mg": 0.57*(w**0.75),
         "vitamin_b6_mg": 0.049*(w**0.75),
         "vitamin_b12_mcg": 1.15*(w**0.75),

         "selenium_mcg": 11.8*(w**0.75),
         "iodine_mcg": 29.6*(w**0.75),
         "vitamin_b5_mg": 0.49*(w**0.75),
         "vitamin_b9_mcg": 8.9*(w**0.75),
         "choline_mg": 56*(w**0.75),
         "linoleic_acid_g": 0.36*(w**0.75),
         "alpha_linolenic_acid_g": 0.014*(w**0.75),
         "epa_dha": 0.03*(w**0.75) }
        return other_for_adult


nutrients_per_kg = {
    "Витамин А (МЕ/кг)": 34000,
    "Витамин D3 (МЕ/кг)": 1100,
    "Витамин Е (МЕ/кг)": 350,
    "iron_mg (мг/кг)": 120,
    "Йод (мг/кг)": 1.9,
    "copper_mg (мг/кг)": 13,
    "manganese_mg (мг/кг)": 46,
    "zinc_mg (мг/кг)": 110,
    "Селен (мг/кг)": 0.13
}


def size_category(w):
    if w <= 10:
        return size_types[0]
    elif w <= 25:
        return size_types[1]
    elif w <= 40:
        return size_types[2]
    else:
        return size_types[3]


def age_type_category(size_categ, age, age_metric):
    if age_metric == metrics_age_types[0]:
        age = age * 12

    if size_categ == size_types[0]:
        if 1 * 12 <= age <= 8 * 12:
            return age_category_types[1]
        elif age < 1 * 12:
            return age_category_types[0]
        elif age > 8 * 12:
            return age_category_types[2]
        return None

    elif size_categ == size_types[2]:
        if 15 <= age <= 7 * 12:
            return age_category_types[1]
        elif age < 15:
            return age_category_types[0]
        elif age > 7 * 12:
            return age_category_types[2]
        return None

    elif size_categ == size_types[3]:
        if 6 * 12 >= age >= 24:
            return age_category_types[1]
        elif age < 24:
            return age_category_types[0]
        elif age > 6 * 12:
            return age_category_types[2]
        return None

    else:
        if age >= 12 and age <= 7 * 12:
            return age_category_types[1]
        elif age < 12:
            return age_category_types[0]
        elif age > 7 * 12:
            return age_category_types[2]
        return None


def kcal_calculate(reproductive_status, berem_time, num_pup, L_time, age_type, weight, expected, activity_level,
                   user_breed, age):
    formula = ""
    page = ""
    additional_text=""
    if L_time == lact_time_types[0]:
        L = 0.75
    elif L_time == lact_time_types[1]:
        L = 0.95
    elif L_time == lact_time_types[2]:
        L = 1.1
    else:
        L = 1.2


    if reproductive_status == rep_status_types[1]:
        if berem_time == berem_time_types[0]:
            kcal = 132 * (weight ** 0.75)
            formula = "pregnancy_early_4_weeks"  
            additional_text= "(первые 4 недели беременности)"
            page = "56"

        else:
            kcal = 132 * (weight ** 0.75) + (26 * weight)
            formula = "pregnancy_last_5_weeks"  
            additional_text= "(последние 5 недель беременности)"
            page = "56"

    elif reproductive_status == rep_status_types[2]:
        lactation_period = lact_time_types_dict.get(L_time, "неуказанного периода лактации")
        if num_pup < 5:
            kcal = 145 * (weight ** 0.75) + 24 * num_pup * weight * L
            formula = "lactation_num_pup_less_5"  
            additional_text= f"n - количество щенков; L = {L} для {lactation_period}"
            page = "56"

        else:
            kcal = 145 * (weight ** 0.75) + (96 + 12 * num_pup - 4) * weight * L
            formula = "lactation_num_pup_more_5"  
            additional_text= f"n - количество щенков; L = {L} для {lactation_period}"
            page = "56"

    else:
        if age_type == age_category_types[0]:
            if age < 2:
                kcal = 25 * weight
                formula = "puppy_2_month"
                page = "56"

            elif 2 <= age < 12:
                kcal = (254.1 - 135 * (weight / expected)) * (weight ** 0.75)
                formula = "puppy_more_2_month"
                additional_text=f"вес_ст = {round(expected, 2)} кг;  предположительный вес для данной породы"
                page = "56"
 
            else:
                kcal = 130 * (weight ** 0.75)
                formula = "puppy_more_12_month"
                page = "54"



        elif age_type == age_category_types[2]:
            if activity_level == activity_level_cat_2[0]:
                kcal = 80 * (weight ** 0.75)
                formula = "senior_passive"
                page = "54"

            elif activity_level == activity_level_cat_2[1]:
                kcal = 95 * (weight ** 0.75)
                formula = "senior_moderate_adult_passive"
                page = "54"

            else:
                kcal = 110 * (weight ** 0.75)
                formula = "senior_active_adult_low"
                page = "54"

        else:
            if activity_level == activity_level_cat_1[0]:
                kcal = 95 * (weight ** 0.75)
                formula = "senior_moderate_adult_passive"
                page = "55"

            elif activity_level == activity_level_cat_1[1]:
                kcal = 110 * (weight ** 0.75)
                formula = "senior_active_adult_low"
                page = "55"

            elif activity_level == activity_level_cat_1[2]:
                kcal = 125 * (weight ** 0.75)
                formula = "adult_moderate"
                page = "55"

            elif activity_level == activity_level_cat_1[3]:
                kcal = 160 * (weight ** 0.75)
                formula = "adult_active"
                page = "55"

            elif activity_level == activity_level_cat_1[4]:
                kcal = 860 * (weight ** 0.75)
                formula = "adult_extreme"
                page = "55"

            else:
                kcal = 90 * (weight ** 0.75)
                formula = "adult_obesity_prone"
                page = "55"

    return kcal, formula, page, additional_text
