import { Link, Route, Routes } from 'react-router-dom'
import { HealthPage } from './pages/HealthPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">PF</span>
          <span>PetFood Next</span>
        </div>

        <nav className="nav">
          <Link to="/">Главная</Link>
          <Link to="/health">Health</Link>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

