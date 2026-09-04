import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/reviews', label: '리뷰 목록' },
  { to: '/reviews/new', label: '리뷰 쓰기' },
  { to: '/profile', label: '내 기록' },
  { to: '/login', label: '로그인' },
]

export default function Layout() {
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
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
