import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { test, expect } from 'vitest'
import App from './App'

test('없는 주소로 가면 Not Found를 보여준다', () => {
  render(
    <MemoryRouter initialEntries={['/없는주소']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText('페이지를 찾을 수 없습니다')).toBeInTheDocument()
})

test('헤더에 네비게이션 링크가 있다', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByRole('link', { name: '리뷰 목록' })).toBeInTheDocument()
})
