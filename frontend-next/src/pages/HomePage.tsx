import { apiClient } from '../utils/apiClient'

export function HomePage() {
  return (
    <section className="card">
      <h1>Новый фронтенд запущен</h1>
      <p className="muted">
        Этот UI живёт отдельно от <code>frontend-main</code> и стартует на порту <b>5174</b>.
      </p>

      <div className="stack">
        <h2>Проверка API (опционально)</h2>
        <p className="muted">
          Запрос пойдёт на <code>/api</code> через Vite proxy. Если backend не поднят — это нормально.
        </p>
        <button
          className="btn"
          onClick={async () => {
            try {
              await apiClient.get('/api/v1/account/profile/me', 5000)
              alert('OK: backend отвечает')
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e)
              alert(`Ошибка: ${message}`)
            }
          }}
          type="button"
        >
          Проверить /api/v1/account/profile/me
        </button>
      </div>
    </section>
  )
}

