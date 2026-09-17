import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import Pagination from './Pagination'

test('페이지가 1개뿐이면 아무것도 그리지 않는다', () => {
  const { container } = render(<Pagination page={1} totalPages={1} onChange={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})

test('페이지 번호 버튼을 누르면 onChange에 그 번호가 전달된다', async () => {
  const onChange = vi.fn()
  render(<Pagination page={1} totalPages={3} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: '3페이지' }))
  expect(onChange).toHaveBeenCalledWith(3)
})

test('첫 페이지에서는 이전이, 마지막 페이지에서는 다음이 비활성화된다', () => {
  const { rerender } = render(<Pagination page={1} totalPages={3} onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled()
  expect(screen.getByRole('button', { name: '다음 페이지' })).toBeEnabled()

  rerender(<Pagination page={3} totalPages={3} onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: '이전 페이지' })).toBeEnabled()
  expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
})

test('현재 페이지 버튼은 aria-current로 표시된다', () => {
  render(<Pagination page={2} totalPages={3} onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: '2페이지' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: '1페이지' })).not.toHaveAttribute('aria-current')
})
