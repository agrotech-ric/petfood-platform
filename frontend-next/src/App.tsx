import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from '../context/AuthContext'
import { LanguageProvider } from '../context/LanguageContext'
import PrivateRoute from './components/PrivateRoute'
import { PrivateLayoutRoute } from './layout/PrivateLayoutRoute'
import Login from './pages/Login'
import Register from './pages/UserRegister'
import ResetPassword from './pages/ResetPassword'
import { PetsListPage } from './pages/PetsListPage'
import { AdminStub } from './pages/stubs/AdminStub'
import { VetStub } from './pages/stubs/VetStub'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPetPage } from './pages/RegisterPetPage'
import { PetProfilePlaceholder } from './pages/placeholders/PetProfilePlaceholder'
import { Settings } from './pages/Settings'
import { Help } from './pages/Help'
import { EditProfile } from './pages/EditProfile'
import { Profile } from './pages/Profile'
import { IngredientsPage } from './pages/IngredientsPage'
import { RecipesPage } from './pages/RecipesPage'
import { RecipeProfilePage } from './pages/RecipeProfilePage'
import { CreateRecipePage } from './pages/CreateRecipePage'
import { IngredientProfilePage } from './pages/IngredientProfilePage'
import { IngredientEditPage } from './pages/IngredientEditPage'
import { IngredientCreatePage } from './pages/IngredientCreatePage'

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
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

        <Route element={<PrivateLayoutRoute allowedRoles={['USER']} />}>
          <Route path="/dashboard" element={<PetsListPage />} />
        </Route>

        <Route element={<PrivateLayoutRoute allowedRoles={['USER', 'VET']} />}>
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<PrivateLayoutRoute allowedRoles={['USER', 'VET']} />}>
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/ingredients/create" element={<IngredientCreatePage />} />
          <Route path="/ingredients/:id" element={<IngredientProfilePage />} />
          <Route path="/ingredients/:id/edit" element={<IngredientEditPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/create" element={<CreateRecipePage />} />
          <Route path="/recipes/:id" element={<RecipeProfilePage />} />
        </Route>

        <Route
          path="/register-pet"
          element={
            <PrivateRoute allowedRoles={['USER']}>
              <RegisterPetPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pet-profile/:id"
          element={
            <PrivateRoute allowedRoles={['USER']}>
              <PetProfilePlaceholder />
            </PrivateRoute>
          }
        />

        <Route
          path="/help"
          element={
            <PrivateRoute allowedRoles={['USER', 'VET']}>
              <Help />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/edit-profile"
          element={
            <PrivateRoute allowedRoles={['USER', 'VET']}>
              <EditProfile />
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
      </LanguageProvider>
    </AuthProvider>
  )
}
