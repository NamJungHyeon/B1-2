import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

// 배열을 pageSize씩 잘라 현재 페이지 조각을 준다.
// 페이지 번호는 URL(?page=N)에 두어 새로고침·뒤로가기에도 유지된다.
export function usePagination(items, pageSize = 10) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page')) || 1

  // 항목 수가 줄어 URL의 page가 범위를 벗어나면 마지막 페이지로 보정한다.
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(requestedPage, totalPages)

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const goToPage = (n) => {
    const next = new URLSearchParams(searchParams)
    if (n <= 1) {
      next.delete('page')
    } else {
      next.set('page', String(n))
    }
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 필터 조건이 바뀌었을 때 호출한다. 히스토리를 쌓지 않도록 replace로.
  const resetPage = () => {
    if (!searchParams.has('page')) return
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  return { page, totalPages, pageItems, goToPage, resetPage }
}
