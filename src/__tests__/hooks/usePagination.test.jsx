import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { test, expect } from 'vitest'
import { usePagination } from '../../hooks/usePagination'

const items = Array.from({ length: 25 }, (_, i) => i + 1)

const wrapperAt = (path) =>
  function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  }

test('첫 페이지는 앞에서 pageSize개를 준다', () => {
  const { result } = renderHook(() => usePagination(items, 10), {
    wrapper: wrapperAt('/'),
  })
  expect(result.current.page).toBe(1)
  expect(result.current.totalPages).toBe(3)
  expect(result.current.pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('URL의 ?page를 읽는다', () => {
  const { result } = renderHook(() => usePagination(items, 10), {
    wrapper: wrapperAt('/?page=3'),
  })
  expect(result.current.page).toBe(3)
  expect(result.current.pageItems).toEqual([21, 22, 23, 24, 25])
})

test('범위를 벗어난 page는 마지막 페이지로 보정된다', () => {
  const { result } = renderHook(() => usePagination(items, 10), {
    wrapper: wrapperAt('/?page=99'),
  })
  expect(result.current.page).toBe(3)
})

test('goToPage로 이동하면 pageItems가 바뀐다', () => {
  const { result } = renderHook(() => usePagination(items, 10), {
    wrapper: wrapperAt('/'),
  })
  act(() => result.current.goToPage(2))
  expect(result.current.page).toBe(2)
  expect(result.current.pageItems[0]).toBe(11)
})

test('resetPage는 1페이지로 돌려놓는다', () => {
  const { result } = renderHook(() => usePagination(items, 10), {
    wrapper: wrapperAt('/?page=3'),
  })
  act(() => result.current.resetPage())
  expect(result.current.page).toBe(1)
})

test('항목이 비어 있어도 totalPages는 최소 1이다', () => {
  const { result } = renderHook(() => usePagination([], 10), {
    wrapper: wrapperAt('/'),
  })
  expect(result.current.totalPages).toBe(1)
  expect(result.current.pageItems).toEqual([])
})
