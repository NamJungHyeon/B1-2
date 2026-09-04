export function validateReview(values) {
  const errors = {}

  if (!values.title?.trim()) {
    errors.title = '제목을 입력하세요.'
  }

  if (!values.media_type) {
    errors.media_type = '구분을 선택하세요.'
  }

  if (!values.rating) {
    errors.rating = '별점을 선택하세요.'
  }

  if (!values.content?.trim()) {
    errors.content = '리뷰 내용을 입력하세요.'
  }

  if (values.poster_url?.trim() && !/^https?:\/\//.test(values.poster_url.trim())) {
    errors.poster_url = 'http:// 또는 https:// 로 시작하는 주소를 입력하세요.'
  }

  return errors
}
