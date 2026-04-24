# Dog Nutrition API - Quick Reference 🚀

## 🔗 Base URL
```
http://localhost:8000
```

## 📋 Endpoints at a Glance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/breeds` | List all breeds |
| GET | `/breeds/{breed}` | Breed details |
| POST | `/calculate/calories` | Calculate daily kcal |
| POST | `/calculate/protein` | Calculate protein needs |
| POST | `/calculate/nutrients` | Get all nutrient requirements |
| POST | `/recommendations/disorder` | Get ingredient recommendations |
| POST | `/optimize/recipe` | Optimize recipe composition |

## 🎯 Common Enums

### Gender
```json
"male" | "female"
```

### Age Metric
```json
"years" | "months"
```

### Activity Level
```json
"passive"        // < 1 hour/day
"low"           // 1-3 hours/day, low intensity
"moderate"      // 1-3 hours/day, high intensity
"active"        // 3-6 hours/day, working dogs
"extreme"       // Racing, extreme conditions
"obesity_prone" // Prone to obesity
```

### Reproductive Status (female only)
```json
"none" | "pregnancy" | "lactation"
```

## 📝 Request Templates

### Basic Adult Dog
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

### Puppy
```bash
curl -X POST "http://localhost:8000/calculate/calories" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 8.0,
    "age": 4,
    "age_metric": "months",
    "gender": "male",
    "breed": "Golden Retriever"
  }'
```

### Pregnant Female
```bash
curl -X POST "http://localhost:8000/calculate/calories" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 25.0,
    "age": 3,
    "age_metric": "years",
    "gender": "female",
    "breed": "German Shepherd",
    "reproductive_status": "pregnancy",
    "pregnancy_period": "last_5_weeks"
  }'
```

### Lactating Female
```bash
curl -X POST "http://localhost:8000/calculate/calories" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 25.0,
    "age": 3,
    "age_metric": "years",
    "gender": "female",
    "breed": "German Shepherd",
    "reproductive_status": "lactation",
    "lactation_week": "week_3",
    "num_puppies": 6
  }'
```

### Senior Dog
```bash
curl -X POST "http://localhost:8000/calculate/calories" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 28.0,
    "age": 10,
    "age_metric": "years",
    "gender": "male",
    "breed": "labrador retriever",
    "activity_level": "low"
  }'
```

## 🎨 Response Formats

### Calorie Response
```json
{
  "daily_kcal": 1562.5,
  "formula": "kcal = 125 \\cdot вес^{0.75}",
  "reference_page": "55",
  "size_category": "large",
  "age_category": "adult"
}
```

### Nutrient Response
```json
{
  "norms": [
    {
      "nutrient": "calcium",
      "value": 3900.0,
      "unit": "mg"
    },
    {
      "nutrient": "protein",
      "value": 156.8,
      "unit": "g"
    }
  ]
}
```

### Error Response
```json
{
  "error": "Validation error",
  "detail": "Reproductive parameters are only valid for female dogs",
  "code": "VALIDATION_ERROR"
}
```

## 🚨 Common Errors

### 422 Validation Error
```json
{
  "gender": "male",
  "reproductive_status": "pregnancy"  // ❌ Only for females
}
```

### 404 Not Found
```bash
GET /breeds/NonExistentBreed  # ❌ Breed doesn't exist
```

### 400 Bad Request
```json
{
  "weight": -5.0  // ❌ Must be positive
}
```

### View Docs
```bash
# Interactive (Swagger)
open http://localhost:8000/docs

# Alternative (ReDoc)
open http://localhost:8000/redoc
```

## 📊 Size Categories

| Category | Weight Range | Example Breeds |
|----------|-------------|----------------|
| small | ≤ 10 kg | Chihuahua, Yorkshire Terrier |
| medium | 10-25 kg | Beagle, Cocker Spaniel |
| large | 25-40 kg | Labrador, German Shepherd |
| extra_large | > 40 kg | Great Dane, Mastiff |

## 📅 Age Categories

| Category | Small Breed | Medium Breed | Large Breed | Extra Large |
|----------|-------------|--------------|-------------|-------------|
| puppy | < 12 months | < 12 months | < 15 months | < 24 months |
| adult | 1-8 years | 1-7 years | 15m-7 years | 2-6 years |
| senior | > 8 years | > 7 years | > 7 years | > 6 years |

## 🎯 Validation Rules

- ✅ `weight` must be > 0
- ✅ `age` must be ≥ 0
- ✅ `reproductive_status` only for females
- ✅ `pregnancy_period` requires `reproductive_status = "pregnancy"`
- ✅ `lactation_week` and `num_puppies` require `reproductive_status = "lactation"`
- ✅ `num_puppies` must be ≥ 0

## 🔗 Quick Links

- 📖 Full Documentation: [README_v2.md](README_v2.md)
- 🎨 API Docs: http://localhost:8000/docs
- 🔧 Schema: http://localhost:8000/openapi.json
