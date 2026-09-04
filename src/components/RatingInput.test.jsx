import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import RatingInput from './RatingInput'

test('별을 클릭하면 해당 점수로 onChange가 호출된다', async () => {
  const onChange = vi.fn()
  render(<RatingInput value={0} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: '별점 4점' }))
  expect(onChange).toHaveBeenCalledWith(4)
})

test('에러가 있으면 메시지를 보여준다', () => {
  render(<RatingInput value={0} onChange={() => {}} error="별점을 선택하세요." />)
  expect(screen.getByText('별점을 선택하세요.')).toBeInTheDocument()
})
