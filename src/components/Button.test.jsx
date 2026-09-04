import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import Button from './Button'

test('loading이면 비활성화되고 로딩 문구를 보여준다', () => {
  render(<Button loading>저장</Button>)
  const button = screen.getByRole('button')
  expect(button).toBeDisabled()
  expect(button).toHaveTextContent('처리 중')
})

test('클릭하면 onClick이 호출된다', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>저장</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledOnce()
})
