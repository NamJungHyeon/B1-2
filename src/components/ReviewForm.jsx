import { useMemo, useState } from 'react'
import { validateReview } from '../lib/validation'
import { uploadPoster, validatePosterFile } from '../lib/storageApi'
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

const POSTER_MODES = [
  { value: 'url', label: '링크 입력' },
  { value: 'file', label: '파일 첨부' },
]

export default function ReviewForm({
  initialValues,
  onSubmit,
  submitting = false,
  submitError = null,
  submitLabel = '저장',
}) {
  // 수정 폼에서 "바뀐 게 있는가"를 비교할 기준. 마운트 시 한 번만 계산한다.
  const [baseline] = useState(() => ({ ...EMPTY, ...initialValues }))
  const [values, setValues] = useState(baseline)
  const [errors, setErrors] = useState({})

  const [posterMode, setPosterMode] = useState('url')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

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

  // 등록 폼(initialValues 없음)은 항상 dirty로 본다.
  // 수정 폼은 필드 하나라도 기준값과 다를 때만 dirty다.
  const isDirty = useMemo(() => {
    if (!initialValues) return true
    return Object.keys(baseline).some((key) => values[key] !== baseline[key])
  }, [initialValues, baseline, values])

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const problem = validatePosterFile(file)
    if (problem) {
      setUploadError(problem)
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadPoster(file)
      setField('poster_url')(url)
    } catch (err) {
      setUploadError(`업로드에 실패했습니다: ${err.message}`)
    } finally {
      setUploading(false)
    }
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

      {/* 포스터: 링크 입력과 파일 첨부 두 방식. 결과는 둘 다 poster_url 문자열이다. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">포스터</span>
          <div className="flex rounded-lg border border-slate-300 p-0.5 text-xs">
            {POSTER_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => {
                  setPosterMode(mode.value)
                  setUploadError(null)
                }}
                className={`rounded-md px-2 py-1 transition ${
                  posterMode === mode.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {posterMode === 'url' ? (
          <Input
            label="포스터 URL"
            value={values.poster_url}
            onChange={setField('poster_url')}
            error={errors.poster_url}
            placeholder="https://... (선택)"
          />
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="poster-file" className="text-sm font-medium text-slate-700">
              포스터 파일
            </label>
            <input
              id="poster-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="text-xs text-slate-500">
              {uploading ? '업로드 중...' : '이미지 파일, 2MB 이하'}
            </p>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          </div>
        )}

        {values.poster_url && (
          <img
            src={values.poster_url}
            alt="포스터 미리보기"
            className="h-40 w-28 rounded-lg border border-slate-200 object-cover"
          />
        )}
      </div>

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

      <Button type="submit" loading={submitting} disabled={!isDirty || uploading}>
        {submitLabel}
      </Button>
    </form>
  )
}
