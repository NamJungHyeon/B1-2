# 영화/드라마 리뷰 SPA 설계

작성일: 2026-09-05

## 1. 목적

React로 단일 핵심 데이터(영화/드라마 리뷰)의 CRUD가 동작하는 SPA를 만든다.
평가 기준은 UI 완성도가 아니라 **컴포넌트 설계, 상태 배치, 비동기 데이터 흐름**이다.
따라서 "사용자 이벤트 → 상태 변화 → 렌더링 변화"가 코드에서 눈으로 추적 가능해야 한다.

## 2. 기술 스택

| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 빌드 | Vite + React 18 | 설정 부담 없이 시작 |
| 언어 | JavaScript | 미션상 TS 가산점 없음. React 흐름에 집중 |
| 라우팅 | react-router-dom v6 | 중첩 라우트로 공통 레이아웃 적용 |
| 스타일 | Tailwind CSS | 반복 UI를 빠르게, 스타일 파일 분산 없이 |
| 백엔드 | Supabase (Postgres) | 스키마가 명확하고 SDK 호출이 REST 패턴이라 useEffect와 붙이기 쉬움 |
| 배포 | Vercel | GitHub 연동 + 환경변수 대시보드 |

인증(Supabase Auth)은 1차 범위에서 제외한다. `/login`은 안내 화면으로 두고,
필수 요구사항이 모두 끝난 뒤 보너스로 붙인다.

## 3. 데이터 모델

Supabase 테이블 `reviews`:

| 컬럼 | 타입 | 제약 |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `title` | text | not null |
| `media_type` | text | not null, `'영화' \| '드라마'` |
| `rating` | int2 | not null, 1~5 |
| `content` | text | not null |
| `poster_url` | text | nullable |
| `watched_date` | date | nullable |
| `created_at` | timestamptz | default `now()` |

RLS는 켜두되 `anon` 역할에 select/insert/update/delete를 모두 허용하는 정책을 단다.
인증이 없으므로 사실상 공개 테이블이며, 나중에 Auth를 붙일 때 정책만 조이면 된다.

## 4. 라우트

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/` | HomePage | 소개 + 최근 리뷰 3개 + 목록 이동 |
| `/reviews` | ReviewListPage | 목록. 별점 필터 + 제목 검색 |
| `/reviews/new` | ReviewNewPage | 등록 폼 |
| `/reviews/:id` | ReviewDetailPage | 상세 + 수정/삭제 |
| `/reviews/:id/edit` | ReviewEditPage | 수정 폼 |
| `/login` | LoginPage | 인증 도입 전 안내 화면 |
| `/profile` | ProfilePage | 총 리뷰 수 / 평균 별점 / 영화·드라마 비율 |
| `*` | NotFoundPage | 잘못된 주소 |

`Layout`(Header + Nav + `<Outlet/>`)이 모든 페이지를 감싼다.

## 5. 폴더 구조

```
src/
  components/    재사용 UI 컴포넌트
  pages/         라우트 단위 화면
  hooks/         useReviews, useReviewDetail
  lib/           supabaseClient, reviewsApi, validation
  App.jsx        라우터 정의
```

페이지 컴포넌트는 데이터 조회와 화면 조합만 담당하고, 표현은 전부 `components/`에 맡긴다.

## 6. 컴포넌트

재사용 컴포넌트는 모두 prop에 따라 표시나 동작이 달라진다.

| 컴포넌트 | 핵심 prop |
| --- | --- |
| `Button` | `variant`(primary/secondary/danger), `loading`, `disabled` |
| `Input` | `label`, `value`, `onChange`, `error` |
| `Textarea` | `label`, `value`, `onChange`, `error` |
| `Select` | `label`, `options`, `value`, `onChange` |
| `RatingInput` | `value`, `onChange` — 별 클릭 입력 |
| `RatingStars` | `value`, `size` — 읽기 전용 표시 |
| `Badge` | `type` — 영화/드라마 색상 구분 |
| `ReviewCard` | `review` |
| `ReviewList` | `reviews` |
| `ReviewFilterBar` | `keyword`, `rating`, `onKeywordChange`, `onRatingChange` |
| `Loading` | `message` |
| `ErrorState` | `message`, `onRetry` |
| `EmptyState` | `message`, `actionLabel`, `onAction` |
| `ConfirmDialog` | `open`, `message`, `onConfirm`, `onCancel` |
| `Toast` | `type`, `message` |
| `ReviewForm` | `initialValues`, `onSubmit`, `submitting`, `submitError`, `submitLabel` |
| `Layout` | 헤더/네비게이션 + `<Outlet/>` |

`ReviewForm`은 등록과 수정이 공유한다. `initialValues`가 비어 있으면 등록, 값이 있으면 수정으로
동작이 달라지는 것이 "prop으로 동작이 달라지는 재사용 컴포넌트"의 대표 사례다.

## 7. 데이터 흐름

**3층 분리**

1. `lib/reviewsApi.js` — Supabase 호출. 성공 시 데이터 반환, 실패 시 throw
2. `hooks/useReviews.js`, `hooks/useReviewDetail.js` — `useState` + `useEffect`로
   `{ data, loading, error, refetch }`를 동일한 형태로 반환
3. `pages/*` — 훅이 준 상태를 받아 분기 렌더링

**일관된 상태 처리**

모든 조회 화면은 같은 순서로 분기한다.

```
loading        → <Loading />
error          → <ErrorState onRetry={refetch} />
데이터 없음     → <EmptyState />
그 외           → 콘텐츠
```

**상태를 어디에 두는가**

- 서버 데이터 → 커스텀 훅
- 필터/검색어, 제출 중, 제출 실패, 다이얼로그 open → 페이지
- 폼 입력값 → `ReviewForm` 내부. 제출 시 `onSubmit(values)`로 부모에 올림
- 필터링 결과 → 원본 + 필터값에서 `useMemo`로 파생. 별도 state로 복제하지 않는다

`ReviewFilterBar`는 자체 상태를 갖지 않고 `value`/`onChange`만 받는 controlled 컴포넌트다
(상태 끌어올리기). 필터링은 클라이언트에서 수행한다.

## 8. 폼 UX

- 필수값: `title`, `media_type`, `rating`, `content`
- `poster_url`은 선택이지만 입력했다면 `http(s)://` 형식 검사
- 검증 실패 시 각 필드 아래 에러 메시지 표시, 제출 차단
- 제출 중에는 버튼 `disabled` + 스피너
- 요청 실패 시 폼 상단에 에러 배너 표시(입력값은 유지)
- 성공 시 상세 페이지로 이동 + Toast

## 9. 상태 변경 → 렌더링 변화 지점

1. 필터/검색어 변경 → 목록 즉시 변경
2. 폼 입력 변경 → 해당 필드 에러 메시지 해제, 별점 미리보기 갱신
3. 저장/삭제 성공 → Toast 노출
4. 제출 중 → 버튼 비활성화 + 스피너

## 10. 삭제 흐름

상세 페이지 삭제 버튼 → `ConfirmDialog` 확인 → 삭제 요청 →
성공 시 `/reviews`로 이동하고 목록을 다시 조회 → Toast 표시.
실패 시 다이얼로그를 닫고 상세 페이지에 에러 배너를 남긴다.

## 11. 환경변수와 배포

- `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. `.gitignore`에 `.env` 포함
- `.env.example`을 커밋해 필요한 키를 문서화
- Vercel 프로젝트 환경변수에 동일 키 등록
- 배포 후 실제 URL에서 목록/상세/등록/수정/삭제를 모두 눌러 확인
- README.md에 로컬 실행 방법, 기술 스택, Supabase 테이블 SQL 명시

## 12. 범위 밖 (나중에)

- Supabase Auth 로그인 + 보호 라우트 (`/login` 실제 동작)
- 포스터 파일 업로드 (지금은 URL 입력)
- 서버 사이드 필터링/페이지네이션
