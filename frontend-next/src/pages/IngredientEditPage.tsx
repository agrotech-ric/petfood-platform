import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { NutrientForm } from '../components/ingredients/NutrientForm'
import {
  ingredientService,
  toIngredientPayload,
  type Ingredient,
} from '../../services/ingredientService'

export function IngredientEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ingredientId = Number(id)
  const [item, setItem] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!Number.isInteger(ingredientId)) {
      setLoading(false)
      return
    }
    ingredientService.get(ingredientId)
      .then(data => {
        if (!cancelled) setItem(data)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [ingredientId])

  if (loading) {
    return <div style={{ padding: '24px' }}>Загрузка...</div>
  }

  if (!item) {
    return <div style={{ padding: '24px' }}>Ингредиент не найден</div>
  }

  const handleSave = async (values: Partial<Ingredient>) => {
    try {
      const updated = await ingredientService.update(item.id, toIngredientPayload(values))
      navigate(`/ingredients/${updated.id}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось сохранить изменения')
    }
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
