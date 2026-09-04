import { useCallback, useEffect, useState } from 'react'
import { fetchReviewById } from '../lib/reviewsApi'

export function useReviewDetail(id) {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 의존성이 [id]이므로 URL의 id만 바뀌어도 다시 조회된다.
  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setReview(await fetchReviewById(id))
    } catch (err) {
      setError(err.message)
      setReview(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { review, loading, error, refetch: load }
}
