import { useParams } from 'react-router-dom'
import { RecipeFormWizard } from '../components/recipes/RecipeFormWizard'

export function EditRecipePage() {
  const { id } = useParams()
  const recipeId = Number(id)
  return <RecipeFormWizard recipeId={Number.isInteger(recipeId) ? recipeId : -1} />
}
