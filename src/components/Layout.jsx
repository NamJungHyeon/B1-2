import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/reviews', label: '리뷰 목록' },
  { to: '/reviews/new', label: '리뷰 쓰기' },
  { to: '/profile', label: '내 기록' },
]

export default function Layout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/reviews')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <NavLink to="/" className="text-lg font-bold text-indigo-600">
            무비로그
          </NavLink>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? 'font-semibold text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            {loading ? null : user ? (
              <>
                <span className="text-slate-500">{user.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-lg bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-700"
              >
                로그인
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
