import { useNavigate } from 'react-router-dom'
import { NutrientForm } from '../components/ingredients/NutrientForm'

const EMPTY = {
  name: '', subtype: '', category: '',
  protein: 0, fat: 0, moisture: 0, calcium: 0, phosphorus: 0, vitaminB1: 0,
  calories: 0, fiber: 0, ash: 0, cholesterol: 0, sugar: 0,
  magnesium: 0, sodium: 0, potassium: 0, iron: 0, copper: 0, zinc: 0, manganese: 0,
  linoleic: 0, alphaLinolenic: 0, arachidonic: 0, epa: 0, dha: 0,
  choline: 0, selenium: 0, iodine: 0,
  vitaminA: 0, vitaminE: 0, vitaminD: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
  vitaminB6: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0, vitaminK: 0,
  alphaCarotene: 0, betaCarotene: 0, betaCryptoxanthin: 0,
  luteinZeaxanthin: 0, lycopene: 0, retinol: 0,
}

export function IngredientCreatePage() {
  const navigate = useNavigate()

  const handleSave = () => {
    // TODO: реальный API вызов
    navigate('/ingredients')
  }

  return (
    <NutrientForm
      title="Создание ингредиента"
      initialValues={EMPTY}
      onSave={handleSave}
      saveLabel="Сохранить"
    />
  )
}
