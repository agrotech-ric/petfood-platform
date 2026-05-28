import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from '../context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Register from './pages/UserRegister'
import ResetPassword from './pages/ResetPassword'
import { DashboardStub } from './pages/stubs/DashboardStub'
import { AdminStub } from './pages/stubs/AdminStub'
import { VetStub } from './pages/stubs/VetStub'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/login"
          element={
            <div className="auth-wrapper">
              <Login />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="auth-wrapper">
              <Register />
            </div>
          }
        />
        <Route
          path="/reset-password"
          element={
            <div className="auth-wrapper">
              <ResetPassword />
            </div>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={['USER']}>
              <DashboardStub />
            </PrivateRoute>
          }
        />
        <Route
          path="/vet/dashboard"
          element={
            <PrivateRoute allowedRoles={['VET']}>
              <VetStub />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminStub />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

