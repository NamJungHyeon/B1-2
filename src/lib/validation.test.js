import { describe, test, expect } from 'vitest'
import { validateReview } from './validation'

const valid = {
  title: '인터스텔라',
  media_type: '영화',
  rating: 5,
  content: '시간과 사랑에 대한 이야기.',
  poster_url: 'https://example.com/a.jpg',
  watched_date: '2026-09-01',
}

describe('validateReview', () => {
  test('올바른 값이면 에러가 없다', () => {
    expect(validateReview(valid)).toEqual({})
  })

  test('제목이 비면 에러', () => {
    expect(validateReview({ ...valid, title: '   ' }).title).toBe(
      '제목을 입력하세요.'
    )
  })

  test('구분이 비면 에러', () => {
    expect(validateReview({ ...valid, media_type: '' }).media_type).toBe(
      '구분을 선택하세요.'
    )
  })

  test('별점이 0이면 에러', () => {
    expect(validateReview({ ...valid, rating: 0 }).rating).toBe(
      '별점을 선택하세요.'
    )
  })

  test('본문이 비면 에러', () => {
    expect(validateReview({ ...valid, content: '' }).content).toBe(
      '리뷰 내용을 입력하세요.'
    )
  })

  test('포스터 URL은 비어 있어도 된다', () => {
    expect(validateReview({ ...valid, poster_url: '' }).poster_url).toBeUndefined()
  })

  test('포스터 URL 형식이 틀리면 에러', () => {
    expect(validateReview({ ...valid, poster_url: 'ftp://a.jpg' }).poster_url).toBe(
      'http:// 또는 https:// 로 시작하는 주소를 입력하세요.'
    )
  })
})
