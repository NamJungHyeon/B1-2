import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import ReviewListPage from './pages/ReviewListPage'
import ReviewDetailPage from './pages/ReviewDetailPage'
import ReviewNewPage from './pages/ReviewNewPage'
import ReviewEditPage from './pages/ReviewEditPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="reviews" element={<ReviewListPage />} />
          <Route path="reviews/:id" element={<ReviewDetailPage />} />
          <Route path="login" element={<LoginPage />} />

          {/* 로그인해야 들어갈 수 있는 화면들 */}
          <Route element={<ProtectedRoute />}>
            <Route path="reviews/new" element={<ReviewNewPage />} />
            <Route path="reviews/:id/edit" element={<ReviewEditPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
