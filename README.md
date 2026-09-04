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

주의할 점 두 가지:

- `VITE_SUPABASE_URL`은 **브라우저 주소창의 대시보드 URL이 아니다.**
  `https://supabase.com/dashboard/project/<ref>`가 아니라 `https://<ref>.supabase.co` 형태여야 한다.
- 키는 계정에 따라 `anon public`(`eyJ...`) 또는 새 형식인 `publishable`(`sb_publishable_...`)로
  표시된다. 둘 다 동작한다. `service_role`(`secret`) 키는 RLS를 무시하므로 절대 쓰지 않는다.

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
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade
);

alter table reviews enable row level security;

create policy "read all"   on reviews for select using (true);
create policy "insert own" on reviews for insert with check (auth.uid() = user_id);
create policy "update own" on reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on reviews for delete using (auth.uid() = user_id);
```

읽기는 누구에게나 공개하고, 쓰기는 본인이 작성한 행에만 허용한다.
화면에서도 본인 글일 때만 수정·삭제 버튼을 보여주지만, 실제 차단은 RLS가 서버에서 한다.

과제용으로 이메일 인증 절차를 건너뛰려면
Authentication → Sign In / Providers → Email에서 **Confirm email**을 끈다.

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
  contexts/    AuthContext (로그인 세션 전역 상태)
  pages/       라우트 단위 화면
  hooks/       useReviews, useReviewDetail
  lib/         supabaseClient, reviewsApi, authApi, validation
```

`lib`(통신) → `hooks`(로딩·에러·데이터 상태) → `pages`(분기 렌더링) 3층으로 나뉜다.
페이지는 데이터 조회와 화면 조합만 하고, 표현은 전부 `components`가 맡는다.

## 라우트

| 경로 | 설명 |
| --- | --- |
| `/` | 홈 + 최근 리뷰 3개 |
| `/reviews` | 목록 (별점 필터 + 제목 검색) |
| `/reviews/new` | 등록 (로그인 필요) |
| `/reviews/:id` | 상세 (수정/삭제) |
| `/reviews/:id/edit` | 수정 (로그인 필요) |
| `/profile` | 내가 쓴 리뷰 통계 (로그인 필요) |
| `/login` | 로그인 / 회원가입 |
| `*` | Not Found |

## 상태 관리

- **서버 데이터**는 커스텀 훅(`useReviews`, `useReviewDetail`)이 소유하고
  `{ data, loading, error, refetch }` 형태로 통일해 내보낸다.
- **화면 조작 상태**(필터, 검색어, 제출 중, 다이얼로그 열림)는 페이지가 소유한다.
- **폼 입력값**은 `ReviewForm` 내부에 두고, 제출 시 `onSubmit(values)`로 부모에 올린다.
- **필터 결과**는 별도 state로 복제하지 않고 `useMemo`로 원본에서 파생시킨다.

- **로그인 세션**은 `AuthContext`가 소유한다. 헤더·보호 라우트·상세 페이지 세 군데서
  필요하므로 prop drilling 대신 Context를 썼다.

모든 조회 화면은 `loading → error → 빈 상태 → 콘텐츠` 순서로 동일하게 분기하며,
각 상태는 `Loading` / `ErrorState` / `EmptyState` 공용 컴포넌트를 재사용한다.

## 인증

Supabase Auth(이메일/비밀번호)를 쓴다. `ProtectedRoute`가 미로그인 사용자를 `/login`으로
보내되, 세션 확인이 끝나기 전(`loading`)에는 리다이렉트하지 않는다. 이게 없으면
새로고침할 때마다 로그인 화면이 잠깐 번쩍인다.

## 배포

Vercel에서 GitHub 저장소를 Import한 뒤, **Environment Variables에
`VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 등록**하고 Deploy한다.
`vercel.json`의 rewrite 설정이 있어 `/reviews/:id`로 직접 접속해도 404가 나지 않는다.
