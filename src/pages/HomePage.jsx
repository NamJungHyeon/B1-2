import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">무비로그</h1>
      <p className="text-sm text-slate-600">
        본 영화와 드라마의 감상을 기록하고 다시 꺼내 보세요.
      </p>
      <Link
        to="/reviews"
        className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        리뷰 목록 보기
      </Link>
    </section>
  )
}
