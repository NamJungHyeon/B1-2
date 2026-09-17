import { vi, test, expect, beforeEach } from 'vitest'

const upload = vi.fn()
const getPublicUrl = vi.fn()
const getUser = vi.fn()

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: { getUser: (...a) => getUser(...a) },
    storage: {
      from: () => ({
        upload: (...a) => upload(...a),
        getPublicUrl: (...a) => getPublicUrl(...a),
      }),
    },
  },
  isSupabaseConfigured: true,
}))

const { uploadPoster, validatePosterFile } = await import('./storageApi')

beforeEach(() => {
  upload.mockReset()
  getPublicUrl.mockReset()
  getUser.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
})

const png = new File(['x'], 'poster.png', { type: 'image/png' })

test('이미지가 아니면 검증 에러', () => {
  const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' })
  expect(validatePosterFile(pdf)).toBe('이미지 파일만 올릴 수 있습니다.')
})

test('2MB를 넘으면 검증 에러', () => {
  const big = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
  expect(validatePosterFile(big)).toBe('2MB 이하의 이미지만 올릴 수 있습니다.')
})

test('정상 파일은 에러 없음', () => {
  expect(validatePosterFile(png)).toBe(null)
})

test('업로드에 성공하면 public URL을 반환한다', async () => {
  upload.mockResolvedValue({ data: { path: 'user-1/123-poster.png' }, error: null })
  getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://x.supabase.co/storage/v1/object/public/posters/user-1/123-poster.png' } })

  const url = await uploadPoster(png)

  expect(url).toContain('/posters/user-1/')
  // 경로는 사용자 id로 시작해야 한다
  expect(upload.mock.calls[0][0]).toMatch(/^user-1\//)
})

test('업로드가 실패하면 에러를 던진다', async () => {
  upload.mockResolvedValue({ data: null, error: { message: 'Bucket not found' } })
  await expect(uploadPoster(png)).rejects.toThrow('Bucket not found')
})

test('로그인하지 않았으면 에러를 던진다', async () => {
  getUser.mockResolvedValue({ data: { user: null } })
  await expect(uploadPoster(png)).rejects.toThrow('로그인이 필요합니다.')
})
