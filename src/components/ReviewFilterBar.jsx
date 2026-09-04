import Input from './Input'
import Select from './Select'

const RATING_OPTIONS = [
  { value: 'all', label: '전체 별점' },
  { value: '5', label: '5점' },
  { value: '4', label: '4점' },
  { value: '3', label: '3점' },
  { value: '2', label: '2점' },
  { value: '1', label: '1점' },
]

export default function ReviewFilterBar({
  keyword,
  rating,
  onKeywordChange,
  onRatingChange,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
      <Input
        label="제목 검색"
        value={keyword}
        onChange={onKeywordChange}
        placeholder="작품 제목을 입력하세요"
      />
      <Select
        label="별점"
        value={rating}
        onChange={onRatingChange}
        options={RATING_OPTIONS}
      />
    </div>
  )
}
