import { useState } from 'react'
import { validateReview } from '../lib/validation'
import Input from './Input'
import Textarea from './Textarea'
import Select from './Select'
import RatingInput from './RatingInput'
import Button from './Button'
import Badge from './Badge'
import RatingStars from './RatingStars'

const EMPTY = {
  title: '',
  media_type: '영화',
  rating: 0,
  content: '',
  poster_url: '',
  watched_date: '',
}

const MEDIA_OPTIONS = [
  { value: '영화', label: '영화' },
  { value: '드라마', label: '드라마' },
]

export default function ReviewForm({
  initialValues,
  onSubmit,
  submitting = false,
  submitError = null,
  submitLabel = '저장',
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })
  const [errors, setErrors] = useState({})

  // 해당 필드의 에러만 지운다.
  // 한 필드를 고쳤다고 다른 필드의 에러까지 사라지면 안 된다.
  const setField = (field) => (value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const found = validateReview(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onSubmit({
      ...values,
      title: values.title.trim(),
      content: values.content.trim(),
      poster_url: values.poster_url.trim() || null,
      watched_date: values.watched_date || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {submitError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <Input
        label="제목"
        value={values.title}
        onChange={setField('title')}
        error={errors.title}
      />
      <Select
        label="구분"
        value={values.media_type}
        onChange={setField('media_type')}
        options={MEDIA_OPTIONS}
        error={errors.media_type}
      />
      <RatingInput
        value={values.rating}
        onChange={setField('rating')}
        error={errors.rating}
      />
      <Textarea
        label="리뷰 내용"
        value={values.content}
        onChange={setField('content')}
        error={errors.content}
      />
      <Input
        label="포스터 URL"
        value={values.poster_url}
        onChange={setField('poster_url')}
        error={errors.poster_url}
        placeholder="https://... (선택)"
      />
      <Input
        label="본 날짜"
        type="date"
        value={values.watched_date}
        onChange={setField('watched_date')}
      />

      {/* 입력값 변경 → 렌더링 변경이 눈에 보이는 지점 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">미리보기</p>
        <div className="flex items-center gap-2">
          <Badge type={values.media_type} />
          <RatingStars value={values.rating} size="sm" />
          <span className="font-semibold text-slate-900">
            {values.title || '제목 없음'}
          </span>
        </div>
      </div>

      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
