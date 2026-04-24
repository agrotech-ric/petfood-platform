# Dog Nutrition Recommender API

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Start the API
uvicorn app.main:app --reload --port 8000

# Access interactive docs
open http://localhost:8000/docs
```

## 📚 API Reference

### Enums

#### Gender
- `male` - Male dog
- `female` - Female dog

#### Age Metric
- `years` - Age in years
- `months` - Age in months

#### Reproductive Status (female only)
- `none` - Not pregnant or lactating
- `pregnancy` - Pregnant
- `lactation` - Lactating

#### Pregnancy Period (if pregnant)
- `first_4_weeks` - First 4 weeks of pregnancy
- `last_5_weeks` - Last 5 weeks of pregnancy

#### Lactation Week (if lactating)
- `week_1` - First week
- `week_2` - Second week
- `week_3` - Third week
- `week_4` - Fourth week

#### Activity Level
- `passive` - Less than 1 hour/day
- `low` - 1-3 hours/day, low intensity
- `moderate` - 1-3 hours/day, high intensity
- `active` - 3-6 hours/day, working dogs
- `extreme` - Racing, extreme conditions
- `obesity_prone` - Prone to obesity

### Complete Example

```bash
curl -X POST "http://localhost:8000/calculate/calories" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 30.0,
    "age": 5,
    "age_metric": "years",
    "gender": "male",
    "breed": "Labrador Retriever",
    "activity_level": "moderate"
  }'
```

**Response:**
```json
{
  "daily_kcal": 1562.5,
  "formula": "kcal = 125 \\cdot вес^{0.75}",
  "reference_page": "55",
  "size_category": "large",
  "age_category": "adult"
}
```

### Female with Pregnancy Example

```bash
curl -X POST "http://localhost:8000/calculate/calories" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 25.0,
    "age": 3,
    "age_metric": "years",
    "gender": "female",
    "breed": "Golden Retriever",
    "reproductive_status": "pregnancy",
    "pregnancy_period": "last_5_weeks"
  }'
```

### Lactating Female Example

```bash
curl -X POST "http://localhost:8000/calculate/calories" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 25.0,
    "age": 3,
    "age_metric": "years",
    "gender": "female",
    "breed": "Golden Retriever",
    "reproductive_status": "lactation",
    "lactation_week": "week_3",
    "num_puppies": 6
  }'
```

## 📊 Nutrient Names

### Macronutrients
- `moisture` - Water content
- `protein` - Protein
- `carbohydrates` - Carbohydrates
- `fat` - Fat

### Minerals
- `calcium` - Calcium
- `phosphorus` - Phosphorus
- `magnesium` - Magnesium
- `sodium` - Sodium
- `potassium` - Potassium
- `iron` - Iron
- `copper` - Copper
- `zinc` - Zinc
- `manganese` - Manganese
- `selenium` - Selenium
- `iodine` - Iodine

### Vitamins
- `vitamin_a` - Vitamin A
- `vitamin_e` - Vitamin E
- `vitamin_d` - Vitamin D
- `vitamin_b1` - Vitamin B1 (Thiamin)
- `vitamin_b2` - Vitamin B2 (Riboflavin)
- `vitamin_b3` - Vitamin B3 (Niacin)
- `vitamin_b6` - Vitamin B6
- `vitamin_b12` - Vitamin B12

### Other Nutrients
- `choline` - Choline
- `pantothenic_acid` - Pantothenic acid
- `linoleic_acid` - Linoleic acid
- `folic_acid` - Folic acid
- `alpha_linolenic_acid` - Alpha-linolenic acid
- `arachidonic_acid` - Arachidonic acid
- `epa_dha` - EPA + DHA (omega-3)
- `ash` - Ash
- `fiber` - Fiber
- `cholesterol` - Cholesterol
- `total_sugar` - Total sugar

## 🌐 JavaScript/TypeScript Example

```typescript
interface DogInfo {
  weight: number;
  age: number;
  age_metric: 'years' | 'months';
  gender: 'male' | 'female';
  breed: string;
  activity_level?: 'passive' | 'low' | 'moderate' | 'active' | 'extreme' | 'obesity_prone';
}

async function calculateCalories(dogInfo: DogInfo) {
  const response = await fetch('http://localhost:8000/calculate/calories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dogInfo)
  });
  
  return await response.json();
}

// Usage
const result = await calculateCalories({
  weight: 30.0,
  age: 5,
  age_metric: 'years',
  gender: 'male',
  breed: 'labrador retriever',
  activity_level: 'moderate'
});

console.log(`Daily calories: ${result.daily_kcal} kcal`);
```

## 🔒 Validation Examples

### ✅ Valid Request
```json
{
  "weight": 25.0,
  "age": 3,
  "age_metric": "years",
  "gender": "female",
  "breed": "Golden Retriever",
  "reproductive_status": "lactation",
  "lactation_week": "week_3",
  "num_puppies": 6
}
```

### ❌ Invalid: Reproductive status for male
```json
{
  "gender": "male",
  "reproductive_status": "pregnancy"  // Error: Only valid for females
}
```

### ❌ Invalid: Pregnancy period without pregnancy status
```json
{
  "gender": "female",
  "pregnancy_period": "last_5_weeks"  // Error: Requires reproductive_status = "pregnancy"
}
```

### ❌ Invalid: Negative weight
```json
{
  "weight": -5.0  // Error: Weight must be positive
}
```

## 🎨 Error Response Format

```json
{
  "error": "Validation error",
  "detail": "Reproductive parameters are only valid for female dogs",
  "code": "VALIDATION_ERROR"
}
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [FEDIAF Nutritional Guidelines](https://europeanpetfood.org/self-regulation/nutritional-guidelines/)
