import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import ReviewForm from './ReviewForm'

test('빈 폼을 제출하면 에러가 뜨고 onSubmit이 호출되지 않는다', async () => {
  const onSubmit = vi.fn()
  render(<ReviewForm onSubmit={onSubmit} />)

  await userEvent.click(screen.getByRole('button', { name: '저장' }))

  expect(screen.getByText('제목을 입력하세요.')).toBeInTheDocument()
  expect(screen.getByText('별점을 선택하세요.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('입력을 채우면 onSubmit이 값과 함께 호출된다', async () => {
  const onSubmit = vi.fn()
  render(<ReviewForm onSubmit={onSubmit} />)

  await userEvent.type(screen.getByLabelText('제목'), '인터스텔라')
  await userEvent.click(screen.getByRole('button', { name: '별점 5점' }))
  await userEvent.type(screen.getByLabelText('리뷰 내용'), '좋았다')
  await userEvent.click(screen.getByRole('button', { name: '저장' }))

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      title: '인터스텔라',
      media_type: '영화',
      rating: 5,
      content: '좋았다',
    })
  )
})

test('제목을 다시 입력하면 해당 에러가 사라진다', async () => {
  render(<ReviewForm onSubmit={vi.fn()} />)

  await userEvent.click(screen.getByRole('button', { name: '저장' }))
  expect(screen.getByText('제목을 입력하세요.')).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText('제목'), '인')
  expect(screen.queryByText('제목을 입력하세요.')).not.toBeInTheDocument()
})

test('submitting이면 버튼이 비활성화된다', () => {
  render(<ReviewForm onSubmit={vi.fn()} submitting />)
  expect(screen.getByRole('button', { name: /처리 중/ })).toBeDisabled()
})

test('submitError가 있으면 상단 배너로 보여준다', () => {
  render(<ReviewForm onSubmit={vi.fn()} submitError="저장 실패" />)
  expect(screen.getByText('저장 실패')).toBeInTheDocument()
})
