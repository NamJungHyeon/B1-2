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

두 값은 Supabase 대시보드의 Project Settings → API에서 확인한다.
값이 없으면 앱은 흰 화면 대신 "Supabase 환경변수가 없습니다" 안내를 화면에 표시한다.

## Supabase 테이블

SQL Editor에서 아래를 실행한다.

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

인증을 붙이지 않았으므로 사실상 공개 테이블이다. 나중에 Supabase Auth를 도입하면
정책을 사용자 기준으로 조이면 된다.

## 명령어

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | 테스트 실행 |
| `npm run test:watch` | 테스트 watch 모드 |

## 폴더 구조

```
src/
  components/  재사용 UI 컴포넌트
  pages/       라우트 단위 화면
  hooks/       useReviews, useReviewDetail
  lib/         supabaseClient, reviewsApi, validation
```

`lib`(통신) → `hooks`(로딩·에러·데이터 상태) → `pages`(분기 렌더링) 3층으로 나뉜다.
페이지는 데이터 조회와 화면 조합만 하고, 표현은 전부 `components`가 맡는다.

## 라우트

| 경로 | 설명 |
| --- | --- |
| `/` | 홈 + 최근 리뷰 3개 |
| `/reviews` | 목록 (별점 필터 + 제목 검색) |
| `/reviews/new` | 등록 |
| `/reviews/:id` | 상세 (수정/삭제) |
| `/reviews/:id/edit` | 수정 |
| `/profile` | 통계 (총 리뷰 수, 평균 별점, 영화·드라마 비율) |
| `/login` | 로그인 (준비 중) |
| `*` | Not Found |

## 상태 관리

- **서버 데이터**는 커스텀 훅(`useReviews`, `useReviewDetail`)이 소유하고
  `{ data, loading, error, refetch }` 형태로 통일해 내보낸다.
- **화면 조작 상태**(필터, 검색어, 제출 중, 다이얼로그 열림)는 페이지가 소유한다.
- **폼 입력값**은 `ReviewForm` 내부에 두고, 제출 시 `onSubmit(values)`로 부모에 올린다.
- **필터 결과**는 별도 state로 복제하지 않고 `useMemo`로 원본에서 파생시킨다.

모든 조회 화면은 `loading → error → 빈 상태 → 콘텐츠` 순서로 동일하게 분기하며,
각 상태는 `Loading` / `ErrorState` / `EmptyState` 공용 컴포넌트를 재사용한다.

## 배포

Vercel에서 GitHub 저장소를 Import한 뒤, **Environment Variables에
`VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 등록**하고 Deploy한다.
`vercel.json`의 rewrite 설정이 있어 `/reviews/:id`로 직접 접속해도 404가 나지 않는다.
