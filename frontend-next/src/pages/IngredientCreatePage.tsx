import { useNavigate } from 'react-router-dom'
import { NutrientForm } from '../components/ingredients/NutrientForm'
import {
  EMPTY_INGREDIENT,
  ingredientService,
  toIngredientPayload,
  type Ingredient,
} from '../../services/ingredientService'

export function IngredientCreatePage() {
  const navigate = useNavigate()

  const handleSave = async (values: Partial<Ingredient>) => {
    try {
      const created = await ingredientService.create(toIngredientPayload(values))
      navigate(`/ingredients/${created.id}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось сохранить ингредиент')
    }
  }

  return (
    <NutrientForm
      title="Создание ингредиента"
      initialValues={EMPTY_INGREDIENT}
      onSave={handleSave}
      saveLabel="Сохранить"
    />
  )
}
