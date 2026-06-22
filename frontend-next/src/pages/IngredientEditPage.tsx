import { useNavigate, useParams } from 'react-router-dom'
import { MOCK_INGREDIENTS } from '../data/ingredientsMock'
import { NutrientForm } from '../components/ingredients/NutrientForm'

export function IngredientEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = MOCK_INGREDIENTS.find(i => i.id === Number(id))

  if (!item) {
    return <div style={{ padding: '24px' }}>Ингредиент не найден</div>
  }

  const handleSave = () => {
    // TODO: реальный API вызов
    navigate(`/ingredients/${item.id}`)
  }

  return (
    <NutrientForm
      title="Редактирование ингредиента"
      initialValues={item}
      onSave={handleSave}
      saveLabel="Сохранить изменения"
    />
  )
}
