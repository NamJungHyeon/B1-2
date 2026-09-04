import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import ErrorState from './ErrorState'

test('onRetry가 없으면 재시도 버튼이 없다', () => {
  render(<ErrorState message="실패했습니다." />)
  expect(screen.getByText('실패했습니다.')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('onRetry가 있으면 버튼을 눌러 호출한다', async () => {
  const onRetry = vi.fn()
  render(<ErrorState message="실패했습니다." onRetry={onRetry} />)
  await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
  expect(onRetry).toHaveBeenCalledOnce()
})
