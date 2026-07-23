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


other_nutrients_1 = ["Зола, г", "Клетчатка, г", "Холестерин, мг", "Сахар общее, г"]
other_nutrients_2 = ["Холин, мг", "Селен, мкг", "Йод, мкг", "Пантотеновая кислота, мг", "Линолевая кислота, г",
                     "Фолиевая кислота, мкг", "Альфа-линоленовая кислота, г", "Арахидоновая кислота, г",
                     "ЭПК (50-60%) + ДГК (40-50%), г"]
other_nutrients = other_nutrients_1 + other_nutrients_2

major_minerals = ["Кальций, мг", "Медь, мг", "Железо, мг", "Магний, мг", "Фосфор, мг", "Калий, мг",
                  "Натрий, мг", "Цинк, мг", "Марганец, мг"]

vitamins = ["Витамин A, мкг", "Витамин E, мг", "Витамин Д, мкг", "Витамин В1 (тиамин), мг",
            "Витамин В2 (Рибофлавин), мг", "Витамин В3 (Ниацин), мг", "Витамин В6, мг", "Витамин В12, мкг"]


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
            "Кальций": 3000 * kkal / 1000,
            "Фосфор": 2500 * kkal / 1000,
            "Магний": 100 * kkal / 1000,
            "Натрий": 550 * kkal / 1000,
            "Калий": 1100 * kkal / 1000,
            "Железо": 22 * kkal / 1000,
            "Медь": 2.7 * kkal / 1000,
            "Цинк": 25 * kkal / 1000,
            "Марганец": 1.4 * kkal / 1000,

            "Витамин A": 378.9 * kkal / 1000,
            "Витамин Д": 3.4 * kkal / 1000,
            "Витамин E": 7.5 * kkal / 1000,
            "Витамин В1 (тиамин)": 0.34 * kkal / 1000,
            "Витамин В2 (Рибофлавин)": 1.32 * kkal / 1000,
            "Витамин В3 (Ниацин)": 4.25 * kkal / 1000,
            "Витамин В6": 0.375 * kkal / 1000,
            "Витамин В12": 8.75 * kkal / 1000,

            "Селен": 87.5 * kkal / 1000,
            "Холин": 425 * kkal / 1000,
            "Пантотеновая кислота": 3.75 * kkal / 1000,
            "Линолевая кислота": 3.3 * kkal / 1000,
            "Фолиевая кислота": 68 * kkal / 1000,
            "Альфа-линоленовая кислота": 0.2 * kkal / 1000,
            "Арахидоновая кислота": 0.08 * kkal / 1000,
            "ЭПК (50-60%) + ДГК (40-50%)": 0.13 * kkal / 1000,

            "Йод": 220 * kkal / 1000,
            "Биотин (мкг)": 4 * kkal / 1000
        }

        return nutrients_per_1000_kcal

    elif reproductive_status == rep_status_types[1] or reproductive_status == rep_status_types[2]:
        nutrients_per_1000_kcal = {
            "Кальций": 1900 * kkal / 1000,
            "Фосфор": 1200 * kkal / 1000,
            "Магний": 150 * kkal / 1000,
            "Натрий": 500 * kkal / 1000,
            "Калий": 900 * kkal / 1000,
            "Железо": 17 * kkal / 1000,
            "Медь": 3.1 * kkal / 1000,
            "Цинк": 24 * kkal / 1000,
            "Марганец": 1.8 * kkal / 1000,

            "Витамин A": 378.9 * kkal / 1000,
            "Витамин Д": 3.4 * kkal / 1000,
            "Витамин E": 7.5 * kkal / 1000,
            "Витамин В1 (тиамин)": 0.56 * kkal / 1000,
            "Витамин В2 (Рибофлавин)": 1.3 * kkal / 1000,
            "Витамин В3 (Ниацин)": 4.25 * kkal / 1000,
            "Витамин В6": 0.375 * kkal / 1000,
            "Витамин В12": 8.75 * kkal / 1000,

            "Селен": 87.5 * kkal / 1000,
            "Холин": 425 * kkal / 1000,
            "Пантотеновая кислота": 3.75 * kkal / 1000,
            "Фолиевая кислота": 67.5 * kkal / 1000,
            "Биотин": 4 * kkal / 1000,
            "Линолевая кислота": 3.3 * kkal / 1000,
            "Альфа-линоленовая кислота": 0.2 * kkal / 1000,
            "ЭПК (50-60%) + ДГК (40-50%)": 0.13 * kkal / 1000,

            "Йод": 220 * kkal / 1000
        }
        return nutrients_per_1000_kcal

    else:
        other_for_adult = {
            "Кальций": 130 * (w ** 0.75),
            "Фосфор": 100 * (w ** 0.75),
            "Магний": 19.7 * (w ** 0.75),
            "Натрий": 26.2 * (w ** 0.75),
            "Калий": 140 * (w ** 0.75),
            "Железо": 1.0 * (w ** 0.75),
            "Медь": 0.2 * (w ** 0.75),
            "Цинк": 2.0 * (w ** 0.75),
            "Марганец": 0.16 * (w ** 0.75),

            "Витамин A": 4.175 * (w ** 0.75),
            "Витамин Д": 0.45 * (w ** 0.75),
            "Витамин E": 1.0 * (w ** 0.75),
            "Витамин В1 (тиамин)": 0.074 * (w ** 0.75),
            "Витамин В2 (Рибофлавин)": 0.171 * (w ** 0.75),
            "Витамин В3 (Ниацин)": 0.57 * (w ** 0.75),
            "Витамин В6": 0.049 * (w ** 0.75),
            "Витамин В12": 1.15 * (w ** 0.75),

            "Селен": 11.8 * (w ** 0.75),
            "Йод": 29.6 * (w ** 0.75),
            "Пантотеновая кислота": 0.49 * (w ** 0.75),
            "Фолиевая кислота": 8.9 * (w ** 0.75),
            "Холин": 56 * (w ** 0.75),
            "Линолевая кислота": 0.36 * (w ** 0.75),
            "Альфа-линоленовая кислота": 0.014 * (w ** 0.75),
            "ЭПК (50-60%) + ДГК (40-50%)": 0.03 * (w ** 0.75)
        }
        return other_for_adult


nutrients_per_kg = {
    "Витамин А (МЕ/кг)": 34000,
    "Витамин D3 (МЕ/кг)": 1100,
    "Витамин Е (МЕ/кг)": 350,
    "Железо (мг/кг)": 120,
    "Йод (мг/кг)": 1.9,
    "Медь (мг/кг)": 13,
    "Марганец (мг/кг)": 46,
    "Цинк (мг/кг)": 110,
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
        if num_pup < 5:
            kcal = 145 * (weight ** 0.75) + 24 * num_pup * weight * L
            formula = "lactation_num_pup_less_5"  
            additional_text= f"n - количество щенков; L = {L} для {lact_time_types_dict[L_time]}"
            page = "56"

        else:
            kcal = 145 * (weight ** 0.75) + (96 + 12 * num_pup - 4) * weight * L
            formula = "lactation_num_pup_more_5"  
            additional_text= f"n - количество щенков; L = {L} для {lact_time_types_dict[L_time]}"
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