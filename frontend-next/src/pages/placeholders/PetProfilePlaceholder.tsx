import { useParams } from 'react-router-dom'

export function PetProfilePlaceholder() {
  const { id } = useParams<{ id: string }>()
  return (
    <div style={{ padding: 24 }}>
      <h1>Профиль питомца</h1>
      <p>
        ID: <code>{id}</code>
      </p>
      <p>Эта страница будет перенесена из основного фронтенда с сохранением всей логики.</p>
    </div>
  )
}

