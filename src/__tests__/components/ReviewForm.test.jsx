import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi, beforeEach } from 'vitest'

const uploadPoster = vi.fn()
vi.mock('../../lib/storageApi', async () => {
  const actual = await vi.importActual('../../lib/storageApi')
  return { ...actual, uploadPoster: (...a) => uploadPoster(...a) }
})

const { default: ReviewForm } = await import('../../components/ReviewForm')

beforeEach(() => {
  uploadPoster.mockReset()
})

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

const initial = {
  title: '인터스텔라',
  media_type: '영화',
  rating: 5,
  content: '좋았다',
  poster_url: '',
  watched_date: '',
}

test('initialValues가 있고 아무것도 안 바꿨으면 제출 버튼이 비활성화된다', () => {
  render(<ReviewForm initialValues={initial} onSubmit={vi.fn()} submitLabel="수정하기" />)
  expect(screen.getByRole('button', { name: '수정하기' })).toBeDisabled()
})

test('initialValues가 있고 값을 바꾸면 제출 버튼이 활성화된다', async () => {
  render(<ReviewForm initialValues={initial} onSubmit={vi.fn()} submitLabel="수정하기" />)
  await userEvent.click(screen.getByRole('button', { name: '별점 3점' }))
  expect(screen.getByRole('button', { name: '수정하기' })).toBeEnabled()
})

test('바꿨다가 원래대로 되돌리면 다시 비활성화된다', async () => {
  render(<ReviewForm initialValues={initial} onSubmit={vi.fn()} submitLabel="수정하기" />)
  await userEvent.click(screen.getByRole('button', { name: '별점 3점' }))
  await userEvent.click(screen.getByRole('button', { name: '별점 5점' }))
  expect(screen.getByRole('button', { name: '수정하기' })).toBeDisabled()
})

test('initialValues가 없으면(등록) 비어 있어도 버튼은 활성화된다', () => {
  render(<ReviewForm onSubmit={vi.fn()} />)
  expect(screen.getByRole('button', { name: '저장' })).toBeEnabled()
})

test('포스터 입력 방식을 파일 첨부로 바꾸면 파일 입력이 나타난다', async () => {
  render(<ReviewForm onSubmit={vi.fn()} />)
  expect(screen.getByLabelText('포스터 URL')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: '파일 첨부' }))

  expect(screen.queryByLabelText('포스터 URL')).not.toBeInTheDocument()
  expect(screen.getByLabelText('포스터 파일')).toBeInTheDocument()
})

test('파일을 고르면 업로드하고 그 URL로 poster_url이 채워진다', async () => {
  uploadPoster.mockResolvedValue('https://cdn/posters/u/1.png')
  const onSubmit = vi.fn()
  render(<ReviewForm onSubmit={onSubmit} />)

  await userEvent.click(screen.getByRole('button', { name: '파일 첨부' }))
  const file = new File(['x'], 'p.png', { type: 'image/png' })
  await userEvent.upload(screen.getByLabelText('포스터 파일'), file)

  expect(uploadPoster).toHaveBeenCalledWith(file)
  expect(await screen.findByAltText('포스터 미리보기')).toHaveAttribute(
    'src',
    'https://cdn/posters/u/1.png'
  )

  await userEvent.type(screen.getByLabelText('제목'), 'a')
  await userEvent.click(screen.getByRole('button', { name: '별점 5점' }))
  await userEvent.type(screen.getByLabelText('리뷰 내용'), 'b')
  await userEvent.click(screen.getByRole('button', { name: '저장' }))

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ poster_url: 'https://cdn/posters/u/1.png' })
  )
})

test('이미지가 아닌 파일은 업로드하지 않고 에러를 보여준다', async () => {
  render(<ReviewForm onSubmit={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: '파일 첨부' }))

  const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' })
  await userEvent.upload(screen.getByLabelText('포스터 파일'), pdf, { applyAccept: false })

  expect(uploadPoster).not.toHaveBeenCalled()
  expect(screen.getByText('이미지 파일만 올릴 수 있습니다.')).toBeInTheDocument()
})

test('업로드가 실패하면 에러를 보여준다', async () => {
  uploadPoster.mockRejectedValue(new Error('Bucket not found'))
  render(<ReviewForm onSubmit={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: '파일 첨부' }))

  await userEvent.upload(
    screen.getByLabelText('포스터 파일'),
    new File(['x'], 'p.png', { type: 'image/png' })
  )

  expect(await screen.findByText(/Bucket not found/)).toBeInTheDocument()
})
