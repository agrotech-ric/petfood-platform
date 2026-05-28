import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="card">
      <h1>404</h1>
      <p className="muted">Страница не найдена.</p>
      <Link to="/" className="btnLink">
        На главную
      </Link>
    </section>
  )
}

