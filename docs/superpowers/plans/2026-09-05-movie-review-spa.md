# 영화/드라마 리뷰 SPA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 영화/드라마 리뷰를 등록·조회·수정·삭제할 수 있는 React SPA를 만들고 Vercel에 배포한다.

**Architecture:** `lib`(Supabase 통신) → `hooks`(로딩/에러/데이터 상태) → `pages`(분기 렌더링) 3층 구조.
재사용 UI 컴포넌트는 `components`에 모으고, 로딩·에러·빈 상태는 페이지마다 만들지 않고 공용 컴포넌트로 통일한다.
필터링은 서버가 아니라 클라이언트에서 `useMemo`로 파생시킨다.

**Tech Stack:** Vite, React 19, react-router-dom v7, Tailwind CSS v4, @supabase/supabase-js, Vitest + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-09-05-movie-review-spa-design.md`

## Global Constraints

- 언어는 JavaScript. TypeScript 파일(`.ts`, `.tsx`)을 만들지 않는다.
- React 18 이상. Vite 기본 템플릿의 React 19를 그대로 쓴다.
- 모든 UI 문구는 한국어.
- `.env`는 절대 커밋하지 않는다. 커밋 전 `git status`로 확인한다.
- 환경변수 이름은 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 두 개로 고정.
- 재사용 컴포넌트는 최소 1개 이상의 prop을 받아 표시나 동작이 달라져야 한다.
- 조회 화면의 상태 분기는 항상 `loading → error → 빈 상태 → 콘텐츠` 순서를 지킨다.
- 테스트는 로직이 있는 곳(검증, 파생 계산, 훅)에만 쓴다. 순수 표현 컴포넌트는 렌더 스모크 테스트까지만.
- 미디어 구분 값은 `'영화'`, `'드라마'` 두 개로 고정.
- **`beforeEach`/`afterEach`는 반드시 블록 본문으로 쓴다.** `beforeEach(() => fn.mockReset())`처럼
  간결 본문으로 쓰면 `mockReset()`이 반환하는 목 함수가 훅의 반환값이 되고, Vitest는 훅이
  반환한 함수를 teardown으로 간주해 테스트 후 호출한다. 목이 한 번 더 호출되면서
  처리되지 않은 rejection이 발생해 엉뚱한 테스트가 실패한다.

---

## 사전 작업 (사용자가 직접 수행)

이 작업은 Supabase 계정 로그인이 필요하므로 사용자가 직접 한다. Task 2 이전에 끝나 있어야 한다.

1. https://supabase.com 에서 새 프로젝트 생성
2. SQL Editor에서 아래 실행

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  media_type text not null check (media_type in ('영화', '드라마')),
  rating smallint not null check (rating between 1 and 5),
  content text not null,
  poster_url text,
  watched_date date,
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "anon read"   on reviews for select using (true);
create policy "anon insert" on reviews for insert with check (true);
create policy "anon update" on reviews for update using (true) with check (true);
create policy "anon delete" on reviews for delete using (true);
```

3. Project Settings → API에서 `Project URL`과 `anon public` 키를 복사해 `.env`에 넣는다

---

### Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`
- Create: `.env.example`, `.gitignore`
- Test: `src/App.test.jsx`

**Interfaces:**
- Consumes: 없음
- Produces: `npm run dev`(개발 서버), `npm test`(Vitest) 실행 환경. `src/App.jsx`가 앱 루트.

- [ ] **Step 1: Vite 프로젝트 생성**

현재 디렉터리는 비어있지 않다(`docs/`, `.git/` 존재). 따라서 `.`에 생성한다.

```bash
npm create vite@latest . -- --template react
npm install
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install react-router-dom @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Vite 설정에 Tailwind와 Vitest 추가**

`vite.config.js` 전체를 아래로 교체:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
```

- [ ] **Step 4: 테스트 셋업 파일 생성**

`src/setupTests.js`:

```javascript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Tailwind 로드**

`src/index.css` 전체를 아래로 교체 (Tailwind v4는 설정 파일 없이 CSS 한 줄로 로드한다):

```css
@import "tailwindcss";
```

`src/App.css`는 삭제한다.

- [ ] **Step 6: package.json에 test 스크립트 추가**

`scripts`에 아래를 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: 실패하는 스모크 테스트 작성**

`src/App.test.jsx`:

```javascript
import { render, screen } from '@testing-library/react'
import App from './App'

test('앱 제목이 보인다', () => {
  render(<App />)
  expect(screen.getByText('무비로그')).toBeInTheDocument()
})
```

- [ ] **Step 8: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `무비로그` 텍스트를 찾을 수 없음

- [ ] **Step 9: App.jsx 최소 구현**

`src/App.jsx` 전체를 아래로 교체:

```jsx
export default function App() {
  return <h1 className="text-2xl font-bold">무비로그</h1>
}
```

`src/main.jsx`에서 `App.css` import가 있다면 제거한다.

- [ ] **Step 10: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 11: .gitignore와 .env.example 작성**

`.gitignore`에 `.env`가 포함되어 있는지 확인하고, 없으면 추가한다.

`.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 12: 개발 서버 확인**

Run: `npm run dev`
Expected: 브라우저에서 "무비로그"가 보인다. 확인 후 서버를 종료한다.

- [ ] **Step 13: 커밋**

`git status`로 `.env`가 스테이징되지 않았는지 확인한 뒤:

```bash
git add -A
git commit -m "chore: Vite + React + Tailwind + Vitest 스캐폴딩"
```

---

### Task 2: Supabase 클라이언트와 리뷰 API

**Files:**
- Create: `src/lib/supabaseClient.js`, `src/lib/reviewsApi.js`
- Test: `src/lib/reviewsApi.test.js`

**Interfaces:**
- Consumes: Task 1의 Vitest 환경
- Produces:
  - `supabase` (default export 아님, named export)
  - `fetchReviews(): Promise<Review[]>` — `created_at` 내림차순
  - `fetchReviewById(id): Promise<Review>`
  - `createReview(values): Promise<Review>`
  - `updateReview(id, values): Promise<Review>`
  - `deleteReview(id): Promise<void>`
  - 모두 실패 시 `Error`를 throw 한다
  - `Review` 형태: `{ id, title, media_type, rating, content, poster_url, watched_date, created_at }`

- [ ] **Step 1: Supabase 클라이언트 작성**

`src/lib/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// import 시점에 throw하지 않는다.
// 여기서 던지면 환경변수가 빠졌을 때 앱 전체가 흰 화면이 되어 원인을 알 수 없다.
// 대신 null을 두고, 실제로 요청할 때 reviewsApi가 읽을 수 있는 에러를 던진다.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
```

- [ ] **Step 2: 실패하는 API 테스트 작성**

`src/lib/reviewsApi.test.js`:

```javascript
import { vi, describe, test, expect, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('./supabaseClient', () => ({
  supabase: { from: (...args) => mockFrom(...args) },
}))

const { fetchReviews, fetchReviewById, createReview, deleteReview } =
  await import('./reviewsApi')

beforeEach(() => {
  mockFrom.mockReset()
})

describe('fetchReviews', () => {
  test('성공하면 리뷰 배열을 반환한다', async () => {
    const rows = [{ id: '1', title: '인터스텔라' }]
    mockFrom.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: rows, error: null }),
      }),
    })

    await expect(fetchReviews()).resolves.toEqual(rows)
  })

  test('실패하면 에러를 던진다', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        order: () =>
          Promise.resolve({ data: null, error: { message: '연결 실패' } }),
      }),
    })

    await expect(fetchReviews()).rejects.toThrow('연결 실패')
  })
})

describe('fetchReviewById', () => {
  test('단건을 반환한다', async () => {
    const row = { id: '1', title: '인터스텔라' }
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    })

    await expect(fetchReviewById('1')).resolves.toEqual(row)
  })
})

describe('createReview', () => {
  test('생성된 리뷰를 반환한다', async () => {
    const row = { id: '2', title: '오징어 게임' }
    mockFrom.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    })

    await expect(createReview({ title: '오징어 게임' })).resolves.toEqual(row)
  })
})

describe('deleteReview', () => {
  test('실패하면 에러를 던진다', async () => {
    mockFrom.mockReturnValue({
      delete: () => ({
        eq: () => Promise.resolve({ error: { message: '삭제 실패' } }),
      }),
    })

    await expect(deleteReview('1')).rejects.toThrow('삭제 실패')
  })
})
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `reviewsApi` 모듈이 없음

- [ ] **Step 4: reviewsApi 구현**

`src/lib/reviewsApi.js`:

```javascript
import { supabase } from './supabaseClient'

const TABLE = 'reviews'

export async function fetchReviews() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function fetchReviewById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createReview(values) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(values)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateReview(id, values) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteReview(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

`updateReview`는 테스트에 없지만 `createReview`와 동일한 체인 구조이므로 함께 구현한다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: Supabase 클라이언트와 리뷰 CRUD API"
```

---

### Task 3: 폼 검증 유틸

**Files:**
- Create: `src/lib/validation.js`
- Test: `src/lib/validation.test.js`

**Interfaces:**
- Consumes: 없음
- Produces: `validateReview(values): { [field]: string }` — 에러가 없으면 빈 객체.
  검사 대상 필드는 `title`, `media_type`, `rating`, `content`, `poster_url`.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/validation.test.js`:

```javascript
import { describe, test, expect } from 'vitest'
import { validateReview } from './validation'

const valid = {
  title: '인터스텔라',
  media_type: '영화',
  rating: 5,
  content: '시간과 사랑에 대한 이야기.',
  poster_url: 'https://example.com/a.jpg',
  watched_date: '2026-09-01',
}

describe('validateReview', () => {
  test('올바른 값이면 에러가 없다', () => {
    expect(validateReview(valid)).toEqual({})
  })

  test('제목이 비면 에러', () => {
    expect(validateReview({ ...valid, title: '   ' }).title).toBe(
      '제목을 입력하세요.'
    )
  })

  test('구분이 비면 에러', () => {
    expect(validateReview({ ...valid, media_type: '' }).media_type).toBe(
      '구분을 선택하세요.'
    )
  })

  test('별점이 0이면 에러', () => {
    expect(validateReview({ ...valid, rating: 0 }).rating).toBe(
      '별점을 선택하세요.'
    )
  })

  test('본문이 비면 에러', () => {
    expect(validateReview({ ...valid, content: '' }).content).toBe(
      '리뷰 내용을 입력하세요.'
    )
  })

  test('포스터 URL은 비어 있어도 된다', () => {
    expect(validateReview({ ...valid, poster_url: '' }).poster_url).toBeUndefined()
  })

  test('포스터 URL 형식이 틀리면 에러', () => {
    expect(validateReview({ ...valid, poster_url: 'ftp://a.jpg' }).poster_url).toBe(
      'http:// 또는 https:// 로 시작하는 주소를 입력하세요.'
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/lib/validation.test.js`
Expected: FAIL — `validation` 모듈이 없음

- [ ] **Step 3: 구현**

`src/lib/validation.js`:

```javascript
export function validateReview(values) {
  const errors = {}

  if (!values.title?.trim()) {
    errors.title = '제목을 입력하세요.'
  }

  if (!values.media_type) {
    errors.media_type = '구분을 선택하세요.'
  }

  if (!values.rating) {
    errors.rating = '별점을 선택하세요.'
  }

  if (!values.content?.trim()) {
    errors.content = '리뷰 내용을 입력하세요.'
  }

  if (values.poster_url?.trim() && !/^https?:\/\//.test(values.poster_url.trim())) {
    errors.poster_url = 'http:// 또는 https:// 로 시작하는 주소를 입력하세요.'
  }

  return errors
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 리뷰 폼 검증 유틸"
```

---

### Task 4: 기본 입력 UI 컴포넌트

**Files:**
- Create: `src/components/Button.jsx`, `src/components/Input.jsx`, `src/components/Textarea.jsx`, `src/components/Select.jsx`, `src/components/Badge.jsx`, `src/components/RatingStars.jsx`, `src/components/RatingInput.jsx`
- Test: `src/components/Button.test.jsx`, `src/components/RatingInput.test.jsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `<Button variant="primary|secondary|danger" loading type onClick disabled>`
  - `<Input label value onChange error type placeholder id>`
  - `<Textarea label value onChange error rows>`
  - `<Select label value onChange error options>` — `options`는 `[{ value, label }]`
  - `<Badge type="영화|드라마">`
  - `<RatingStars value size="sm|md" />` — 읽기 전용
  - `<RatingInput value onChange error />` — 클릭으로 1~5 선택
  - 모든 onChange는 **값 자체**를 넘긴다(이벤트 객체 아님)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Button.test.jsx`:

```jsx
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
```

`src/components/RatingInput.test.jsx`:

```jsx
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/components`
Expected: FAIL — 컴포넌트 모듈이 없음

- [ ] **Step 3: Button 구현**

`src/components/Button.jsx`:

```jsx
const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {loading ? '처리 중...' : children}
    </button>
  )
}
```

- [ ] **Step 4: Input, Textarea, Select 구현**

`src/components/Input.jsx`:

```jsx
export default function Input({ label, value, onChange, error, id, ...rest }) {
  const inputId = id || label

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

`src/components/Textarea.jsx`:

```jsx
export default function Textarea({ label, value, onChange, error, rows = 6, id, ...rest }) {
  const inputId = id || label

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

`src/components/Select.jsx`:

```jsx
export default function Select({ label, value, onChange, error, options, id, ...rest }) {
  const inputId = id || label

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Badge, RatingStars, RatingInput 구현**

`src/components/Badge.jsx`:

```jsx
const STYLES = {
  영화: 'bg-indigo-100 text-indigo-700',
  드라마: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ type }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[type] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {type}
    </span>
  )
}
```

`src/components/RatingStars.jsx`:

```jsx
export default function RatingStars({ value, size = 'md' }) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <span className={`${textSize} text-amber-500`} aria-label={`별점 ${value}점`}>
      {'★'.repeat(value)}
      <span className="text-slate-300">{'★'.repeat(5 - value)}</span>
    </span>
  )
}
```

`src/components/RatingInput.jsx`:

```jsx
export default function RatingInput({ value, onChange, error }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">별점</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-label={`별점 ${score}점`}
            onClick={() => onChange(score)}
            className={`text-2xl transition ${
              score <= value ? 'text-amber-500' : 'text-slate-300'
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-500">
          {value ? `${value}점` : '선택 안 함'}
        </span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 기본 입력 UI 컴포넌트"
```

---

### Task 5: 상태 표시 컴포넌트

**Files:**
- Create: `src/components/Loading.jsx`, `src/components/ErrorState.jsx`, `src/components/EmptyState.jsx`, `src/components/ConfirmDialog.jsx`, `src/components/Toast.jsx`
- Test: `src/components/ErrorState.test.jsx`

**Interfaces:**
- Consumes: Task 4의 `Button`
- Produces:
  - `<Loading message />` — 기본 문구 "불러오는 중..."
  - `<ErrorState message onRetry />` — `onRetry`가 있을 때만 "다시 시도" 버튼 표시
  - `<EmptyState message actionLabel onAction />` — `onAction`이 있을 때만 버튼 표시
  - `<ConfirmDialog open message onConfirm onCancel confirming />`
  - `<Toast type="success|error" message onClose />`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/ErrorState.test.jsx`:

```jsx
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/components/ErrorState.test.jsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/components/Loading.jsx`:

```jsx
export default function Loading({ message = '불러오는 중...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
```

`src/components/ErrorState.jsx`:

```jsx
import Button from './Button'

export default function ErrorState({
  message = '요청에 실패했습니다. 다시 시도하세요.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 py-16">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  )
}
```

`src/components/EmptyState.jsx`:

```jsx
import Button from './Button'

export default function EmptyState({
  message = '표시할 데이터가 없습니다.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16">
      <p className="text-sm text-slate-500">{message}</p>
      {onAction && actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
```

`src/components/ConfirmDialog.jsx`:

```jsx
import Button from './Button'

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirming = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <p className="text-sm text-slate-700">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={confirming}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={confirming}>
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
```

`src/components/Toast.jsx`:

```jsx
const STYLES = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
}

export default function Toast({ type = 'success', message, onClose }) {
  if (!message) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${STYLES[type]}`}
      role="status"
    >
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="알림 닫기">
          ✕
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 로딩/에러/빈 상태 및 다이얼로그·토스트 컴포넌트"
```

---

### Task 6: 레이아웃과 라우팅

**Files:**
- Create: `src/components/Layout.jsx`
- Create: `src/pages/HomePage.jsx`, `src/pages/LoginPage.jsx`, `src/pages/ProfilePage.jsx`, `src/pages/NotFoundPage.jsx`
- Modify: `src/App.jsx`, `src/main.jsx`
- Test: `src/App.test.jsx` (교체)

**Interfaces:**
- Consumes: 없음
- Produces: 8개 라우트가 동작하는 라우터. `Layout`이 헤더/네비게이션을 제공하고 `<Outlet/>`으로 자식 라우트를 렌더링.
  이 시점의 `HomePage`/`ProfilePage`는 자리표시자이며 Task 11에서 실제 데이터를 붙인다.

- [ ] **Step 1: 실패하는 라우팅 테스트 작성**

`src/App.test.jsx` 전체를 교체:

```jsx
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/App.test.jsx`
Expected: FAIL

- [ ] **Step 3: Layout 구현**

`src/components/Layout.jsx`:

```jsx
import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/reviews', label: '리뷰 목록' },
  { to: '/reviews/new', label: '리뷰 쓰기' },
  { to: '/profile', label: '내 기록' },
  { to: '/login', label: '로그인' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <NavLink to="/" className="text-lg font-bold text-indigo-600">
            무비로그
          </NavLink>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: 자리표시자 페이지 4개 구현**

`src/pages/HomePage.jsx`:

```jsx
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">무비로그</h1>
      <p className="text-sm text-slate-600">
        본 영화와 드라마의 감상을 기록하고 다시 꺼내 보세요.
      </p>
      <Link
        to="/reviews"
        className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        리뷰 목록 보기
      </Link>
    </section>
  )
}
```

`src/pages/LoginPage.jsx`:

```jsx
export default function LoginPage() {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-slate-900">로그인</h1>
      <p className="text-sm text-slate-600">
        현재는 로그인 없이 모든 리뷰를 함께 사용합니다. 인증 기능은 준비 중입니다.
      </p>
    </section>
  )
}
```

`src/pages/ProfilePage.jsx`:

```jsx
export default function ProfilePage() {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-slate-900">내 기록</h1>
    </section>
  )
}
```

`src/pages/NotFoundPage.jsx`:

```jsx
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-20">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="text-xl font-semibold text-slate-900">페이지를 찾을 수 없습니다</h1>
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        홈으로 돌아가기
      </Link>
    </section>
  )
}
```

- [ ] **Step 5: 라우터 구성**

`src/App.jsx` 전체 교체 (아직 없는 페이지는 Task 7~10에서 채우므로, 지금은 리뷰 관련 라우트를 주석이 아닌 자리표시자 없이 두지 말고 Task 7에서 추가한다):

```jsx
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

`src/main.jsx` 전체 교체:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

`BrowserRouter`를 `main.jsx`에 둔 이유는 테스트에서 `MemoryRouter`로 감쌀 수 있게 하기 위해서다.

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: 브라우저 확인**

Run: `npm run dev`
Expected: 헤더 네비게이션으로 `/`, `/login`, `/profile` 이동이 되고, 이상한 주소는 404가 보인다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: 공통 레이아웃과 라우팅"
```

---

### Task 7: 목록 화면 (useReviews + 필터)

**Files:**
- Create: `src/hooks/useReviews.js`, `src/components/ReviewCard.jsx`, `src/components/ReviewList.jsx`, `src/components/ReviewFilterBar.jsx`, `src/pages/ReviewListPage.jsx`
- Modify: `src/App.jsx`
- Test: `src/hooks/useReviews.test.jsx`, `src/pages/ReviewListPage.test.jsx`

**Interfaces:**
- Consumes: `fetchReviews` (Task 2), `Loading`/`ErrorState`/`EmptyState` (Task 5), `RatingStars`/`Badge`/`Input`/`Select` (Task 4)
- Produces:
  - `useReviews(): { reviews, loading, error, refetch }`
  - `<ReviewCard review />`, `<ReviewList reviews />`
  - `<ReviewFilterBar keyword rating onKeywordChange onRatingChange />`
  - 라우트 `/reviews`

- [ ] **Step 1: 실패하는 훅 테스트 작성**

`src/hooks/useReviews.test.jsx`:

```jsx
import { renderHook, waitFor } from '@testing-library/react'
import { vi, test, expect, beforeEach } from 'vitest'

const fetchReviews = vi.fn()
vi.mock('../lib/reviewsApi', () => ({ fetchReviews: (...a) => fetchReviews(...a) }))

const { useReviews } = await import('./useReviews')

beforeEach(() => {
  fetchReviews.mockReset()
})

test('성공하면 목록과 loading=false를 준다', async () => {
  fetchReviews.mockResolvedValue([{ id: '1', title: '인터스텔라' }])
  const { result } = renderHook(() => useReviews())

  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.reviews).toHaveLength(1)
  expect(result.current.error).toBe(null)
})

test('실패하면 error 메시지를 준다', async () => {
  fetchReviews.mockRejectedValue(new Error('연결 실패'))
  const { result } = renderHook(() => useReviews())

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe('연결 실패')
  expect(result.current.reviews).toEqual([])
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/hooks`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: useReviews 구현**

`src/hooks/useReviews.js`:

```javascript
import { useCallback, useEffect, useState } from 'react'
import { fetchReviews } from '../lib/reviewsApi'

export function useReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReviews(await fetchReviews())
    } catch (err) {
      setError(err.message)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { reviews, loading, error, refetch: load }
}
```

`load`를 `useCallback`으로 감싼 이유: `useEffect`의 의존성으로 쓰면서 동시에 `refetch`로 밖에 내보내기 위해서다. 의존성 배열이 비어 있으므로 마운트 시 한 번만 실행된다.

- [ ] **Step 4: 카드/목록/필터 컴포넌트 구현**

`src/components/ReviewCard.jsx`:

```jsx
import { Link } from 'react-router-dom'
import Badge from './Badge'
import RatingStars from './RatingStars'

export default function ReviewCard({ review }) {
  return (
    <Link
      to={`/reviews/${review.id}`}
      className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
    >
      {review.poster_url ? (
        <img
          src={review.poster_url}
          alt={`${review.title} 포스터`}
          className="h-28 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
          이미지 없음
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge type={review.media_type} />
          <RatingStars value={review.rating} size="sm" />
        </div>
        <h3 className="truncate font-semibold text-slate-900">{review.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{review.content}</p>
      </div>
    </Link>
  )
}
```

`src/components/ReviewList.jsx`:

```jsx
import ReviewCard from './ReviewCard'

export default function ReviewList({ reviews }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
```

`src/components/ReviewFilterBar.jsx`:

```jsx
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

export default function ReviewFilterBar({ keyword, rating, onKeywordChange, onRatingChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
      <Input
        label="제목 검색"
        value={keyword}
        onChange={onKeywordChange}
        placeholder="작품 제목을 입력하세요"
      />
      <Select label="별점" value={rating} onChange={onRatingChange} options={RATING_OPTIONS} />
    </div>
  )
}
```

- [ ] **Step 5: 실패하는 목록 페이지 테스트 작성**

`src/pages/ReviewListPage.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, test, expect, beforeEach } from 'vitest'

const useReviews = vi.fn()
vi.mock('../hooks/useReviews', () => ({ useReviews: () => useReviews() }))

const { default: ReviewListPage } = await import('./ReviewListPage')

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReviewListPage />
    </MemoryRouter>
  )

beforeEach(() => {
  useReviews.mockReset()
})

test('로딩 중이면 로딩을 보여준다', () => {
  useReviews.mockReturnValue({ reviews: [], loading: true, error: null, refetch: vi.fn() })
  renderPage()
  expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
})

test('에러면 에러 상태를 보여준다', () => {
  useReviews.mockReturnValue({ reviews: [], loading: false, error: '연결 실패', refetch: vi.fn() })
  renderPage()
  expect(screen.getByText('연결 실패')).toBeInTheDocument()
})

test('데이터가 없으면 빈 상태를 보여준다', () => {
  useReviews.mockReturnValue({ reviews: [], loading: false, error: null, refetch: vi.fn() })
  renderPage()
  expect(screen.getByText('아직 등록된 리뷰가 없습니다.')).toBeInTheDocument()
})

test('검색어를 입력하면 목록이 걸러진다', async () => {
  useReviews.mockReturnValue({
    reviews: [
      { id: '1', title: '인터스텔라', media_type: '영화', rating: 5, content: 'a' },
      { id: '2', title: '오징어 게임', media_type: '드라마', rating: 4, content: 'b' },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
  renderPage()

  expect(screen.getByText('인터스텔라')).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('제목 검색'), '오징어')

  expect(screen.queryByText('인터스텔라')).not.toBeInTheDocument()
  expect(screen.getByText('오징어 게임')).toBeInTheDocument()
})
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `npm test src/pages/ReviewListPage.test.jsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 7: ReviewListPage 구현**

`src/pages/ReviewListPage.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import ReviewList from '../components/ReviewList'
import ReviewFilterBar from '../components/ReviewFilterBar'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

export default function ReviewListPage() {
  const { reviews, loading, error, refetch } = useReviews()
  const [keyword, setKeyword] = useState('')
  const [rating, setRating] = useState('all')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      const matchesKeyword = review.title
        .toLowerCase()
        .includes(keyword.trim().toLowerCase())
      const matchesRating = rating === 'all' || review.rating === Number(rating)
      return matchesKeyword && matchesRating
    })
  }, [reviews, keyword, rating])

  const renderBody = () => {
    if (loading) return <Loading />
    if (error) return <ErrorState message={error} onRetry={refetch} />
    if (reviews.length === 0) {
      return (
        <EmptyState
          message="아직 등록된 리뷰가 없습니다."
          actionLabel="첫 리뷰 쓰기"
          onAction={() => navigate('/reviews/new')}
        />
      )
    }
    if (filtered.length === 0) {
      return <EmptyState message="조건에 맞는 리뷰가 없습니다." />
    }
    return <ReviewList reviews={filtered} />
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">리뷰 목록</h1>
        <span className="text-sm text-slate-500">{filtered.length}개</span>
      </div>
      <ReviewFilterBar
        keyword={keyword}
        rating={rating}
        onKeywordChange={setKeyword}
        onRatingChange={setRating}
      />
      {renderBody()}
    </section>
  )
}
```

빈 상태가 두 가지로 나뉜다: 데이터 자체가 없을 때와 필터 결과가 없을 때. 두 경우의 안내 문구가 달라야 사용자가 헷갈리지 않는다.

- [ ] **Step 8: 라우트 추가**

`src/App.jsx`의 `<Route element={<Layout />}>` 안, `index` 라우트 다음 줄에 추가:

```jsx
        <Route path="reviews" element={<ReviewListPage />} />
```

파일 상단에 import 추가:

```jsx
import ReviewListPage from './pages/ReviewListPage'
```

- [ ] **Step 9: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "feat: 리뷰 목록 화면과 필터"
```

---

### Task 8: 상세 화면과 삭제

**Files:**
- Create: `src/hooks/useReviewDetail.js`, `src/pages/ReviewDetailPage.jsx`
- Modify: `src/App.jsx`
- Test: `src/hooks/useReviewDetail.test.jsx`

**Interfaces:**
- Consumes: `fetchReviewById`, `deleteReview` (Task 2), 상태 컴포넌트 (Task 5)
- Produces:
  - `useReviewDetail(id): { review, loading, error, refetch }`
  - 라우트 `/reviews/:id`

- [ ] **Step 1: 실패하는 훅 테스트 작성**

`src/hooks/useReviewDetail.test.jsx`:

```jsx
import { renderHook, waitFor } from '@testing-library/react'
import { vi, test, expect, beforeEach } from 'vitest'

const fetchReviewById = vi.fn()
vi.mock('../lib/reviewsApi', () => ({
  fetchReviewById: (...a) => fetchReviewById(...a),
}))

const { useReviewDetail } = await import('./useReviewDetail')

beforeEach(() => {
  fetchReviewById.mockReset()
})

test('id로 단건을 불러온다', async () => {
  fetchReviewById.mockResolvedValue({ id: '1', title: '인터스텔라' })
  const { result } = renderHook(() => useReviewDetail('1'))

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(fetchReviewById).toHaveBeenCalledWith('1')
  expect(result.current.review.title).toBe('인터스텔라')
})

test('실패하면 error를 준다', async () => {
  fetchReviewById.mockRejectedValue(new Error('없는 리뷰입니다'))
  const { result } = renderHook(() => useReviewDetail('999'))

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe('없는 리뷰입니다')
  expect(result.current.review).toBe(null)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/hooks/useReviewDetail.test.jsx`
Expected: FAIL

- [ ] **Step 3: useReviewDetail 구현**

`src/hooks/useReviewDetail.js`:

```javascript
import { useCallback, useEffect, useState } from 'react'
import { fetchReviewById } from '../lib/reviewsApi'

export function useReviewDetail(id) {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setReview(await fetchReviewById(id))
    } catch (err) {
      setError(err.message)
      setReview(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { review, loading, error, refetch: load }
}
```

의존성이 `[id]`이므로, 같은 컴포넌트가 유지된 채 URL의 `id`만 바뀌어도 다시 조회된다.

- [ ] **Step 4: ReviewDetailPage 구현**

`src/pages/ReviewDetailPage.jsx`:

```jsx
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useReviewDetail } from '../hooks/useReviewDetail'
import { deleteReview } from '../lib/reviewsApi'
import Badge from '../components/Badge'
import RatingStars from '../components/RatingStars'
import Button from '../components/Button'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ReviewDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { review, loading, error, refetch } = useReviewDetail(id)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteReview(id)
      setConfirmOpen(false)
      navigate('/reviews', { state: { toast: '리뷰를 삭제했습니다.' } })
    } catch (err) {
      setConfirmOpen(false)
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!review) return <ErrorState message="리뷰를 찾을 수 없습니다." />

  return (
    <article className="flex flex-col gap-6">
      {deleteError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          삭제에 실패했습니다: {deleteError}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        {review.poster_url && (
          <img
            src={review.poster_url}
            alt={`${review.title} 포스터`}
            className="h-64 w-44 shrink-0 rounded-xl object-cover"
          />
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge type={review.media_type} />
            <RatingStars value={review.rating} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{review.title}</h1>
          {review.watched_date && (
            <p className="text-sm text-slate-500">본 날짜: {review.watched_date}</p>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-slate-700">{review.content}</p>

      <div className="flex gap-2">
        <Link
          to={`/reviews/${review.id}/edit`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          수정
        </Link>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          삭제
        </Button>
        <Link
          to="/reviews"
          className="ml-auto self-center text-sm text-slate-500 hover:underline"
        >
          목록으로
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message="이 리뷰를 삭제할까요? 되돌릴 수 없습니다."
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  )
}
```

삭제 성공 시 `navigate`의 `state`로 토스트 문구를 목록 페이지에 전달한다. 목록 페이지는 Task 9에서 이 값을 읽어 Toast를 띄운다.

- [ ] **Step 5: 라우트 추가**

`src/App.jsx`에 import와 라우트 추가:

```jsx
import ReviewDetailPage from './pages/ReviewDetailPage'
```

```jsx
        <Route path="reviews/:id" element={<ReviewDetailPage />} />
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 리뷰 상세 화면과 삭제"
```

---

### Task 9: 등록 폼

**Files:**
- Create: `src/components/ReviewForm.jsx`, `src/pages/ReviewNewPage.jsx`
- Modify: `src/App.jsx`, `src/pages/ReviewListPage.jsx`
- Test: `src/components/ReviewForm.test.jsx`

**Interfaces:**
- Consumes: `validateReview` (Task 3), 입력 컴포넌트 (Task 4), `createReview` (Task 2)
- Produces:
  - `<ReviewForm initialValues onSubmit submitting submitError submitLabel />`
    - `onSubmit(values)`는 검증을 통과했을 때만 호출된다
    - `initialValues`가 없으면 빈 폼, 있으면 그 값으로 시작 (등록/수정 공용)
  - 라우트 `/reviews/new`
  - 목록 페이지가 `location.state.toast`를 읽어 Toast 표시

- [ ] **Step 1: 실패하는 폼 테스트 작성**

`src/components/ReviewForm.test.jsx`:

```jsx
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/components/ReviewForm.test.jsx`
Expected: FAIL

- [ ] **Step 3: ReviewForm 구현**

`src/components/ReviewForm.jsx`:

```jsx
import { useState } from 'react'
import { validateReview } from '../lib/validation'
import Input from './Input'
import Textarea from './Textarea'
import Select from './Select'
import RatingInput from './RatingInput'
import Button from './Button'
import Badge from './Badge'
import RatingStars from './RatingStars'

const EMPTY = {
  title: '',
  media_type: '영화',
  rating: 0,
  content: '',
  poster_url: '',
  watched_date: '',
}

const MEDIA_OPTIONS = [
  { value: '영화', label: '영화' },
  { value: '드라마', label: '드라마' },
]

export default function ReviewForm({
  initialValues,
  onSubmit,
  submitting = false,
  submitError = null,
  submitLabel = '저장',
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })
  const [errors, setErrors] = useState({})

  const setField = (field) => (value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const found = validateReview(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onSubmit({
      ...values,
      title: values.title.trim(),
      content: values.content.trim(),
      poster_url: values.poster_url.trim() || null,
      watched_date: values.watched_date || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {submitError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <Input label="제목" value={values.title} onChange={setField('title')} error={errors.title} />
      <Select
        label="구분"
        value={values.media_type}
        onChange={setField('media_type')}
        options={MEDIA_OPTIONS}
        error={errors.media_type}
      />
      <RatingInput value={values.rating} onChange={setField('rating')} error={errors.rating} />
      <Textarea
        label="리뷰 내용"
        value={values.content}
        onChange={setField('content')}
        error={errors.content}
      />
      <Input
        label="포스터 URL"
        value={values.poster_url}
        onChange={setField('poster_url')}
        error={errors.poster_url}
        placeholder="https://... (선택)"
      />
      <Input
        label="본 날짜"
        type="date"
        value={values.watched_date}
        onChange={setField('watched_date')}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">미리보기</p>
        <div className="flex items-center gap-2">
          <Badge type={values.media_type} />
          <RatingStars value={values.rating} size="sm" />
          <span className="font-semibold text-slate-900">
            {values.title || '제목 없음'}
          </span>
        </div>
      </div>

      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
```

미리보기 블록이 "입력값 변경 → 렌더링 변경"의 두 번째 지점이다.
`setField`가 해당 필드의 에러만 지우는 이유는, 한 필드를 고쳤다고 다른 필드의 에러까지 사라지면 안 되기 때문이다.

- [ ] **Step 4: ReviewNewPage 구현**

`src/pages/ReviewNewPage.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createReview } from '../lib/reviewsApi'
import ReviewForm from '../components/ReviewForm'

export default function ReviewNewPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = await createReview(values)
      navigate(`/reviews/${created.id}`, { state: { toast: '리뷰를 등록했습니다.' } })
    } catch (err) {
      setSubmitError(`저장에 실패했습니다: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">리뷰 쓰기</h1>
      <ReviewForm
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        submitLabel="등록하기"
      />
    </section>
  )
}
```

- [ ] **Step 5: 목록 페이지에 Toast 표시 추가**

`src/pages/ReviewListPage.jsx`를 수정한다.

import에 추가:

```jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Toast from '../components/Toast'
```

(`useMemo, useState`를 이미 import 하고 있으므로 `useEffect`는 그 줄에 합친다.)

컴포넌트 본문 상단, `const navigate = useNavigate()` 아래에 추가:

```jsx
  const location = useLocation()
  const [toast, setToast] = useState(location.state?.toast ?? null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])
```

`return`문의 마지막, `{renderBody()}` 아래에 추가:

```jsx
      <Toast message={toast} onClose={() => setToast(null)} />
```

`useEffect`의 정리 함수(`clearTimeout`)가 있어야 토스트가 연속으로 뜰 때 이전 타이머가 남지 않는다.

- [ ] **Step 6: 라우트 추가**

`src/App.jsx`에 import와 라우트 추가:

```jsx
import ReviewNewPage from './pages/ReviewNewPage'
```

```jsx
        <Route path="reviews/new" element={<ReviewNewPage />} />
```

**중요:** `reviews/new`는 `reviews/:id`보다 **먼저** 선언한다. react-router v6+는 구체적인 경로를 우선 매칭하지만, 순서를 지키면 읽는 사람도 헷갈리지 않는다.

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: 리뷰 등록 폼과 검증"
```

---

### Task 10: 수정 화면

**Files:**
- Create: `src/pages/ReviewEditPage.jsx`
- Modify: `src/App.jsx`, `src/pages/ReviewDetailPage.jsx`
- Test: 없음 (기존 훅/폼 테스트로 커버됨. 브라우저에서 수동 확인)

**Interfaces:**
- Consumes: `useReviewDetail` (Task 8), `updateReview` (Task 2), `ReviewForm` (Task 9)
- Produces: 라우트 `/reviews/:id/edit`. 상세 페이지가 `location.state.toast`를 읽어 Toast 표시.

- [ ] **Step 1: ReviewEditPage 구현**

`src/pages/ReviewEditPage.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useReviewDetail } from '../hooks/useReviewDetail'
import { updateReview } from '../lib/reviewsApi'
import ReviewForm from '../components/ReviewForm'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'

export default function ReviewEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { review, loading, error, refetch } = useReviewDetail(id)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await updateReview(id, values)
      navigate(`/reviews/${id}`, { state: { toast: '리뷰를 수정했습니다.' } })
    } catch (err) {
      setSubmitError(`수정에 실패했습니다: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!review) return <ErrorState message="리뷰를 찾을 수 없습니다." />

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">리뷰 수정</h1>
      <ReviewForm
        initialValues={{
          title: review.title,
          media_type: review.media_type,
          rating: review.rating,
          content: review.content,
          poster_url: review.poster_url ?? '',
          watched_date: review.watched_date ?? '',
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        submitLabel="수정하기"
      />
    </section>
  )
}
```

`ReviewForm`은 `useState`의 초기값으로 `initialValues`를 받으므로, 데이터가 도착한 뒤에 폼을 렌더링해야 한다.
그래서 `loading`/`error` 분기를 폼보다 먼저 둔다.

- [ ] **Step 2: 상세 페이지에 Toast 추가**

`src/pages/ReviewDetailPage.jsx`를 수정한다.

import 수정 및 추가:

```jsx
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Toast from '../components/Toast'
```

`const { review, loading, error, refetch } = useReviewDetail(id)` 아래에 추가:

```jsx
  const location = useLocation()
  const [toast, setToast] = useState(location.state?.toast ?? null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])
```

`<ConfirmDialog ... />` 아래에 추가:

```jsx
      <Toast message={toast} onClose={() => setToast(null)} />
```

**주의:** 이 컴포넌트는 `if (loading) return <Loading />`로 조기 반환한다.
훅은 조기 반환보다 위에 있어야 하므로, 위 `useState`/`useEffect`는 반드시 `if (loading)` 줄보다 **앞에** 넣는다.

- [ ] **Step 3: 라우트 추가**

`src/App.jsx`에 import와 라우트 추가:

```jsx
import ReviewEditPage from './pages/ReviewEditPage'
```

```jsx
        <Route path="reviews/:id/edit" element={<ReviewEditPage />} />
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (기존 테스트가 깨지지 않았는지 확인)

- [ ] **Step 5: 브라우저에서 전체 CRUD 수동 확인**

Run: `npm run dev`

확인 항목:
- `/reviews/new`에서 등록 → 상세로 이동 + 토스트
- 상세에서 수정 → 값이 채워진 폼 → 저장 → 상세로 이동 + 토스트
- 상세에서 삭제 → 확인 다이얼로그 → 목록으로 이동 + 토스트
- 목록에서 검색어/별점 변경 시 즉시 반영

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 리뷰 수정 화면"
```

---

### Task 11: 홈과 내 기록 화면

**Files:**
- Modify: `src/pages/HomePage.jsx`, `src/pages/ProfilePage.jsx`

**Interfaces:**
- Consumes: `useReviews` (Task 7), `ReviewList` (Task 7), 상태 컴포넌트 (Task 5)
- Produces: 같은 훅을 재사용해 다른 방식으로 렌더링하는 두 화면

- [ ] **Step 1: HomePage에 최근 리뷰 3개 붙이기**

`src/pages/HomePage.jsx` 전체 교체:

```jsx
import { Link } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import ReviewList from '../components/ReviewList'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

export default function HomePage() {
  const { reviews, loading, error, refetch } = useReviews()
  const recent = reviews.slice(0, 3)

  const renderRecent = () => {
    if (loading) return <Loading />
    if (error) return <ErrorState message={error} onRetry={refetch} />
    if (recent.length === 0) return <EmptyState message="아직 등록된 리뷰가 없습니다." />
    return <ReviewList reviews={recent} />
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-slate-900">무비로그</h1>
        <p className="text-sm text-slate-600">
          본 영화와 드라마의 감상을 기록하고 다시 꺼내 보세요.
        </p>
        <Link
          to="/reviews/new"
          className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          리뷰 쓰기
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">최근 리뷰</h2>
          <Link to="/reviews" className="text-sm text-indigo-600 hover:underline">
            전체 보기
          </Link>
        </div>
        {renderRecent()}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: ProfilePage에 통계 붙이기**

`src/pages/ProfilePage.jsx` 전체 교체:

```jsx
import { useMemo } from 'react'
import { useReviews } from '../hooks/useReviews'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { reviews, loading, error, refetch } = useReviews()

  const stats = useMemo(() => {
    if (reviews.length === 0) return null
    const total = reviews.length
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    const movies = reviews.filter((review) => review.media_type === '영화').length

    return {
      total,
      average: (sum / total).toFixed(1),
      movies,
      dramas: total - movies,
    }
  }, [reviews])

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">내 기록</h1>
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="총 리뷰" value={`${stats.total}개`} />
          <StatCard label="평균 별점" value={stats.average} />
          <StatCard label="영화" value={`${stats.movies}개`} />
          <StatCard label="드라마" value={`${stats.dramas}개`} />
        </div>
      ) : (
        <EmptyState message="아직 기록이 없습니다." />
      )}
    </section>
  )
}
```

`StatCard`는 이 파일 안에서만 쓰이는 작은 표현 컴포넌트라 같은 파일에 둔다.
여러 화면에서 쓰이게 되면 그때 `components/`로 옮긴다.

- [ ] **Step 3: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: 브라우저 확인**

Run: `npm run dev`
Expected: 홈에 최근 리뷰 3개, `/profile`에 통계 4개가 보인다.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 홈 최근 리뷰와 내 기록 통계"
```

---

### Task 12: README와 배포

**Files:**
- Create: `README.md`, `public/_redirects` 또는 `vercel.json`

**Interfaces:**
- Consumes: 전체 앱
- Produces: 공개 접속 가능한 배포 URL

- [ ] **Step 1: SPA 라우팅 폴백 설정**

Vercel은 Vite SPA를 자동 감지하지만, `/reviews/:id`로 직접 접속했을 때 404가 나지 않도록 명시한다.

`vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: README 작성**

`README.md`:

````markdown
# 무비로그

본 영화와 드라마의 감상을 기록하는 React SPA.

## 기술 스택

- React 19 + Vite
- React Router v7
- Tailwind CSS v4
- Supabase (PostgreSQL)
- Vitest + React Testing Library

## 로컬 실행

```bash
git clone <저장소 URL>
cd <프로젝트 폴더>
npm install
cp .env.example .env   # 값을 채워 넣는다
npm run dev
```

## 환경변수

| 이름 | 설명 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public 키 |

## Supabase 테이블

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  media_type text not null check (media_type in ('영화', '드라마')),
  rating smallint not null check (rating between 1 and 5),
  content text not null,
  poster_url text,
  watched_date date,
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "anon read"   on reviews for select using (true);
create policy "anon insert" on reviews for insert with check (true);
create policy "anon update" on reviews for update using (true) with check (true);
create policy "anon delete" on reviews for delete using (true);
```

## 명령어

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | 테스트 실행 |

## 폴더 구조

```
src/
  components/  재사용 UI 컴포넌트
  pages/       라우트 단위 화면
  hooks/       useReviews, useReviewDetail
  lib/         supabaseClient, reviewsApi, validation
```

## 라우트

| 경로 | 설명 |
| --- | --- |
| `/` | 홈 + 최근 리뷰 |
| `/reviews` | 목록 (별점 필터 + 제목 검색) |
| `/reviews/new` | 등록 |
| `/reviews/:id` | 상세 |
| `/reviews/:id/edit` | 수정 |
| `/profile` | 통계 |
| `/login` | 로그인 (준비 중) |
| `*` | Not Found |
````

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 `dist/` 생성

- [ ] **Step 4: GitHub 저장소에 푸시**

`git status`로 `.env`가 포함되지 않았는지 반드시 확인한 뒤:

```bash
git add -A
git commit -m "docs: README와 배포 설정"
git remote add origin <GitHub 저장소 URL>
git push -u origin main
```

- [ ] **Step 5: Vercel 배포 (사용자 수행)**

1. vercel.com에서 GitHub 저장소를 Import
2. Framework Preset: Vite (자동 감지)
3. **Environment Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 등록**
4. Deploy

환경변수를 빠뜨리면 배포본에서 흰 화면만 나온다. 미션 요구사항상 배포 환경에서 기능이
하나라도 동작하지 않으면 미충족이므로 반드시 확인한다.

- [ ] **Step 6: 배포 URL에서 전체 흐름 확인**

- 목록 조회 / 상세 조회
- 등록 / 수정 / 삭제
- `/reviews/<id>`로 **직접 접속**했을 때 404가 아닌 상세 화면이 뜨는지 (SPA 폴백 확인)

---

## 자체 점검 (계획 작성 후 수행함)

**요구사항 대응표**

| 미션 요구사항 | 대응 |
| --- | --- |
| 라우트 5개 이상 + 목록/상세 + NotFound + 네비게이션 | Task 6, 7, 8, 9, 10 (총 8개 라우트) |
| 폴더 구조 pages/components/hooks·lib 분리 | Task 1~7 |
| 공통 레이아웃 | Task 6 `Layout` |
| 재사용 컴포넌트 8개 이상 | Task 4, 5, 7, 9 (총 17개) |
| 페이지/UI 컴포넌트 분리 | 전 Task |
| 로딩·에러·빈 상태 공용 컴포넌트로 통일 | Task 5, 이후 전 화면에서 재사용 |
| controlled input | Task 4, 9 |
| 목록/상세 데이터 상태 | Task 7, 8 |
| 커스텀 훅 1개 이상 | Task 7 `useReviews`, Task 8 `useReviewDetail` |
| 원격 CRUD | Task 2, 7~10 |
| 폼 필수값 검증 + 에러 표시 + 제출 중 상태 | Task 3, 9 |
| 요청 실패 화면 표시 | Task 9, 10 (폼 상단 배너), Task 8 (삭제 실패 배너) |
| 상태→렌더링 3곳 이상 | 필터(Task 7), 미리보기·에러 해제(Task 9), 토스트(Task 9·10), 제출 중(Task 9) |
| 배포 + 환경변수 | Task 12 |
| 보너스: 메모이제이션 | Task 7 `useMemo`, Task 11 `useMemo` |
| 보너스: 전역 상태 / 인증 | 범위 밖 (설계서 12절) |
