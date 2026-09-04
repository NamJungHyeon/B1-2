import { useCallback, useEffect, useState } from 'react'
import { fetchReviews } from '../lib/reviewsApi'

export function useReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // load를 useCallback으로 감싼 이유:
  // useEffect의 의존성으로 쓰면서 동시에 refetch로 밖에 내보내기 위해서다.
  // 의존성 배열이 비어 있으므로 마운트 시 한 번만 실행된다.
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReviews(await fetchReviews())
    } catch (err) {
      setError(err.message)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { reviews, loading, error, refetch: load }
}
