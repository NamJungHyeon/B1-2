import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loading from './Loading'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // 세션을 확인하는 동안 리다이렉트하면 새로고침 때마다 로그인 화면이 번쩍인다.
  if (loading) return <Loading message="불러오는 중..." />

  // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 위치를 넘긴다.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <Outlet />
}
