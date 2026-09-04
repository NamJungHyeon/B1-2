import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-20">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="text-xl font-semibold text-slate-900">페이지를 찾을 수 없습니다</h1>
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        홈으로 돌아가기
      </Link>
    </section>
  )
}
