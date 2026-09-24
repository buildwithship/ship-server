맞아. 지금 시점에서 한 번 정리해두는 게 필요해. 프론트가 이미 꽤 많이 진행됐기 때문에, 서버를 코덱스에게 맡기려면 **화면 설명이 아니라 ‘프론트가 서버에게 기대하는 계약’**을 넘겨야 한다.

나는 repo에 `docs/BACKEND_HANDOFF.md` 하나 만들어서 **현재 구현 상태 + 정책 + 데이터 모델 + 필요한 API + 우선순위**를 고정하는 걸 추천해.

새 파일이니까 먼저:

```bash
mkdir -p docs && \
touch docs/BACKEND_HANDOFF.md
```

그리고 아래 내용으로 전체 작성하면 된다.

---

# `docs/BACKEND_HANDOFF.md`

```md
# SHIP Backend Handoff

## 1. 프로젝트 개요

SHIP은 프로젝트와 메이커를 중심으로 연결하는 서비스다.

사용자는 공개된 프로젝트를 탐색하고, 프로젝트를 만든 메이커를 확인하며,
관심 있는 프로젝트에 반응하거나 팀원 모집에 지원할 수 있다.

서비스의 중심 단위는 사용자가 아니라 **프로젝트**다.

주요 개념은 다음과 같다.

| 용어 | 의미 |
| --- | --- |
| Project | 사용자가 등록한 서비스 / 프로젝트 |
| Maker | 프로젝트를 만드는 사용자 |
| PUSH | 프로젝트에 보내는 반응 |
| WATCH | 메이커 구독 |
| PING | 메이커에게 연락 / 커피챗 |
| CREW | 프로젝트에 실제 합류한 팀원 |
| Recruitment | 프로젝트 팀원 모집 |
| Application | 모집 공고에 대한 지원 |
| Notification | 지원, 합류 요청 등 알림 |

---

# 2. 현재 Frontend 기술 스택

- Next.js 16
- TypeScript
- App Router
- CSS Module
- lucide-react
- 현재 데이터는 대부분 Mock Data
- Auth는 현재 localStorage 기반 임시 구현
- 실제 서버 API는 아직 연결되지 않음

Frontend repository:

```text
buildwithship/ship-web
```

현재 개발 브랜치:

```text
develop
```

혼자 개발 중이므로 별도 feat 브랜치는 사용하지 않고
`develop`에 직접 개발한다.

---

# 3. 현재 주요 페이지

| Route | 기능 | 인증 |
| --- | --- | --- |
| `/` | 홈 / 프로젝트 탐색 | 공개 |
| `/projects` | 전체 프로젝트 목록 | 공개 |
| `/projects/[slug]` | 프로젝트 상세 | 공개 |
| `/projects/new` | 프로젝트 등록 | 로그인 필요 |
| `/makers` | 메이커 목록 | 공개 |
| `/makers/[username]` | 메이커 프로필 | 공개 |
| `/recruiting` | 팀원 모집 프로젝트 | 공개 |
| `/applications` | 내가 보낸 지원 / 받은 지원 관리 | 로그인 필요 |
| `/login` | 로그인 | 공개 |
| `/signup` | 회원가입 | 공개 |

---

# 4. 인증 정책

현재 Frontend에서는 localStorage 기반 Mock Auth를 사용한다.

실제 Backend 연결 시 교체해야 한다.

## 회원가입 정보

회원가입 시 현재 받는 정보:

```ts
interface SignUpInput {
  email: string;
  password: string;
  name: string;
  username: string;
}
```

정책:

| 항목 | 정책 |
| --- | --- |
| email | 중복 불가 |
| username | 중복 불가 |
| username 길이 | 3~20자 |
| username 문자 | 영문 소문자, 숫자, `.`, `_` |
| password | 최소 8자 |
| name | 표시용 닉네임 |

로그인 후 Frontend에서 필요한 사용자 데이터:

```ts
interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
}
```

## 인증이 필요한 기능

- 프로젝트 등록
- 지원 관리
- 팀원 모집 지원
- PUSH
- WATCH
- PING
- 알림 조회
- 프로젝트 관리

공개 조회는 로그인 없이 가능하다.

---

# 5. User / Maker

사용자는 로그인 계정이면서 동시에 Maker 프로필을 가진다.

Frontend의 현재 Maker 구조:

```ts
interface Maker {
  username: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  subscriberCount: number;
  projectCount: number;
  openToProject: boolean;
  skills: string[];
  githubUrl?: string;
  websiteUrl?: string;
}
```

Backend에서는 최소 다음 정보가 필요하다.

```text
id
email
username
name
avatarUrl
role
bio
skills[]
githubUrl
websiteUrl
openToProject
createdAt
updatedAt
```

프로필 URL:

```text
/makers/{username}
```

따라서 username은 변경 정책을 신중히 잡아야 한다.

---

# 6. Project

현재 Frontend 기준 Project 타입:

```ts
type ProjectPlatform =
  | 'web'
  | 'appStore'
  | 'googlePlay';

type ProjectStatus =
  | 'operating'
  | 'inProgress'
  | 'ended';

interface ProjectLink {
  platform: ProjectPlatform;
  url: string;
}

interface ProjectMaker {
  name: string;
  username: string;
  avatarUrl: string;
}

interface Project {
  id: number;
  slug: string;

  name: string;
  tagline: string;
  description: string;

  logoUrl: string;
  bannerUrl: string;
  galleryUrls?: string[];

  categories: string[];

  maker: ProjectMaker;

  pushCount: number;
  viewCount: number;
  teamSize: number;

  status: ProjectStatus;
  recruiting: boolean;

  spotlight?: boolean;

  platforms: ProjectLink[];
}
```

## 프로젝트 상태 정책

프로젝트 상태는 정확히 아래 3개다.

```text
operating   = 운영중
inProgress  = 진행중
ended       = 운영종료
```

`recruiting`은 ProjectStatus와 별개다.

예:

```json
{
  "status": "operating",
  "recruiting": true
}
```

가능하다.

---

# 7. 프로젝트 생성

현재 `/projects/new`에서 프로젝트 등록 UI가 존재한다.

Backend에서 프로젝트 생성 시 필요한 주요 데이터:

```json
{
  "name": "PAIR",
  "slug": "pair",
  "tagline": "서비스 한 줄 설명",
  "description": "프로젝트 상세 설명",
  "categories": [
    "AI",
    "커뮤니티"
  ],
  "status": "operating",
  "logoUrl": "...",
  "bannerUrl": "...",
  "galleryUrls": [],
  "platforms": [
    {
      "platform": "web",
      "url": "https://..."
    }
  ]
}
```

프로젝트 생성자는 자동으로 프로젝트 Owner가 된다.

---

# 8. Project Member / CREW

프로젝트와 사용자는 다대다 관계다.

단순히 지원이 수락됐다고 바로 CREW가 되는 구조가 아니다.

정확한 흐름:

```text
지원
→ 프로젝트 운영자가 지원 수락
→ 지원자에게 CREW 합류 요청
→ 지원자가 최종 합류 확정
→ Project Member 등록
→ 사용자 프로필에 프로젝트 표시
```

따라서 다음 데이터를 분리해야 한다.

```text
Application
ProjectMember
```

Application의 accepted와 ProjectMember 생성은 동일한 이벤트가 아니다.

---

# 9. Recruitment

프로젝트는 여러 포지션을 모집할 수 있다.

Frontend에서는 Recruitment가 별도의 기능으로 존재한다.

예:

```json
{
  "projectSlug": "pair",
  "projectName": "PAIR",
  "projectLogoUrl": "...",
  "positions": [
    {
      "role": "Frontend",
      "count": 2
    },
    {
      "role": "Designer",
      "count": 1
    }
  ]
}
```

프로젝트의 `recruiting` 값은 활성화된 모집 공고 존재 여부와 연결 가능하다.

---

# 10. Application

현재 Frontend 타입:

```ts
type ApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

type CrewStatus =
  | 'none'
  | 'invited'
  | 'joined'
  | 'declined';

interface ApplicationUser {
  name: string;
  username: string;
  avatarUrl: string;
}

interface ProjectApplication {
  id: number;

  projectSlug: string;
  projectName: string;
  projectTagline: string;
  projectLogoUrl: string;

  role: string;

  message: string;

  portfolioUrl?: string;

  status: ApplicationStatus;

  crewStatus: CrewStatus;

  appliedAt: string;

  applicant: ApplicationUser;
  owner: ApplicationUser;
}
```

## Application 상태 흐름

```text
pending
 ├─ applicant withdraw → withdrawn
 ├─ owner reject       → rejected
 └─ owner accept       → accepted
```

accepted 이후:

```text
crewStatus = invited
```

지원자는 이후:

```text
invited
 ├─ accept → joined
 └─ reject → declined
```

`joined`가 되었을 때만 ProjectMember를 생성한다.

---

# 11. 지원 정책

지원 요청 Frontend payload:

```json
{
  "projectSlug": "pair",
  "projectName": "PAIR",
  "role": "Frontend",
  "message": "지원 메시지",
  "portfolioUrl": "https://..."
}
```

실제 Backend에서는 projectName을 클라이언트에게 받을 필요 없다.

권장 Request:

```json
{
  "recruitmentId": 10,
  "positionId": 21,
  "message": "지원 메시지",
  "portfolioUrl": "https://..."
}
```

서버에서 로그인 사용자 기준으로 applicant를 결정한다.

---

# 12. PUSH

PUSH는 프로젝트에 대한 SHIP 고유 반응이다.

Like와 비슷하지만 서비스에서는 PUSH라는 명칭을 사용한다.

필요 기능:

```text
PUSH 생성
PUSH 취소
프로젝트 PUSH 수 조회
현재 사용자가 PUSH했는지 조회
```

한 사용자는 같은 프로젝트에 PUSH를 하나만 가질 수 있다.

추천 DB constraint:

```text
UNIQUE(user_id, project_id)
```

---

# 13. WATCH

WATCH는 Maker 구독 기능이다.

사용자가 특정 Maker를 WATCH할 수 있다.

필요 기능:

```text
WATCH
UNWATCH
구독자 수
현재 사용자가 WATCH 중인지
내가 WATCH한 Maker 조회
```

한 사용자가 같은 Maker를 중복 WATCH할 수 없다.

---

# 14. PING

PING은 Maker에게 연락하는 기능이다.

초기 버전에서는 복잡한 메신저보다 간단한 연락 요청으로 시작할 수 있다.

예상 데이터:

```text
senderUserId
receiverUserId
message
status
createdAt
```

status 예:

```text
pending
accepted
rejected
```

현재 Frontend 구현은 추후 확정 가능하다.

---

# 15. Notification

현재 Frontend에서 사용하는 Notification 타입:

```ts
type NotificationType =
  | 'application_received'
  | 'application_accepted'
  | 'crew_invite'
  | 'project_invite'
  | 'general';

interface ShipNotification {
  id: number;
  type: NotificationType;

  title: string;
  message: string;

  href: string;

  imageUrl?: string;

  createdAt: string;

  read: boolean;
}
```

필요 API:

```text
내 알림 목록
읽지 않은 알림 개수
개별 읽음 처리
모두 읽음 처리
```

Application 관련 이벤트 발생 시 서버에서 Notification을 생성해야 한다.

예:

```text
지원 발생
→ Project Owner에게 application_received

지원 수락
→ Applicant에게 application_accepted

CREW 합류 요청
→ Applicant에게 crew_invite
```

---

# 16. 실시간 프로젝트 순위

Frontend 오른쪽 사이드바에 `실시간 순위 TOP 5`가 있다.

현재는 Mock Data 기준으로:

```text
viewCount + pushCount * 5
```

를 사용해 임시 계산하고 있다.

실제 서버에서는 별도의 Ranking API가 필요하다.

초기 버전에서는 완벽한 실시간 시스템까지 필요하지 않다.

예:

```text
최근 24시간 조회
최근 24시간 PUSH
```

를 기준으로 점수를 계산해도 된다.

추천 응답:

```json
[
  {
    "rank": 1,
    "project": {
      "slug": "pair",
      "name": "PAIR",
      "logoUrl": "..."
    },
    "pushCount": 120
  }
]
```

최대 5개 반환.

---

# 17. 조회수

프로젝트 상세 진입 시 viewCount를 증가시킨다.

단순 요청마다 무조건 증가시키면 새로고침 abuse가 가능하므로
추후 기준을 잡을 수 있다.

MVP에서는 단순 조회 증가도 허용 가능하다.

Frontend에서는 다음 값만 필요하다.

```text
viewCount
```

---

# 18. 주목받는 프로젝트

홈에는 일반 프로젝트와 별도로 `주목받는 프로젝트` 영역이 있다.

현재 Frontend 필드는:

```ts
spotlight?: boolean;
```

화면에서는 왕관을 사용한 별도 Featured UI로 표현한다.

Backend 초기 버전에서는 관리자 또는 DB 플래그로 지정해도 된다.

예:

```text
featured = true
```

추천 API:

```text
GET /projects/featured
```

---

# 19. 플랫폼 링크

Project에는 아래 링크를 등록할 수 있다.

```text
web
appStore
googlePlay
```

Frontend에서는 App Store / Google Play 공식 배지와 Website 버튼으로 노출한다.

DB에서는 다음과 같은 구조 권장:

```text
project_links

id
project_id
platform
url
```

platform enum:

```text
WEB
APP_STORE
GOOGLE_PLAY
```

---

# 20. 이미지

현재 Project에서 사용하는 이미지:

```text
logo
banner
gallery
```

Maker:

```text
avatar
```

필요 업로드 대상:

```text
USER_AVATAR
PROJECT_LOGO
PROJECT_BANNER
PROJECT_GALLERY
```

초기 Backend 구현에서 실제 Storage 연결이 부담되면
이미지 URL 저장 방식으로 먼저 구현 가능하다.

추후 S3 / Cloudflare R2 등의 Object Storage 연결 가능.

---

# 21. Home API

현재 홈 화면에서는 여러 Mock Data를 조합하고 있다.

홈에서 필요한 데이터:

```text
배너
주목받는 프로젝트
프로젝트 목록
실시간 TOP 5
```

Frontend가 여러 API를 호출해도 되지만,
향후 필요하면 Home API를 따로 만들 수 있다.

예:

```text
GET /home
```

응답:

```json
{
  "featuredProject": {},
  "projects": [],
  "ranking": []
}
```

광고 배너는 추후 Admin 기능과 연결할 수 있다.

---

# 22. 검색

Header에서 프로젝트 + 메이커 통합 검색을 제공한다.

현재는 Mock Data에서 Frontend 필터링 중이다.

검색 대상:

Project:

```text
name
tagline
categories
maker name
```

Maker:

```text
name
username
role
skills
```

추천 API:

```text
GET /search?q=
```

응답:

```json
{
  "projects": [],
  "makers": []
}
```

Header 결과에서는 각각 최대 4개 정도만 사용한다.

---

# 23. 문의함

오른쪽 사이드바에:

```text
Instagram
Threads
KakaoTalk
문의함
```

이 있다.

문의함은 현재 Frontend에서 console.log만 한다.

최소 API:

```text
POST /inquiries
```

Request:

```json
{
  "message": "문의 내용"
}
```

로그인 사용자는 userId 자동 저장 가능.

비회원 문의도 허용 가능하다.

---

# 24. 권한

프로젝트에는 최소 다음 권한 개념이 필요하다.

```text
OWNER
CREW
```

OWNER 가능:

```text
프로젝트 수정
프로젝트 삭제
모집 공고 관리
지원자 조회
지원 수락 / 거절
CREW 초대
```

CREW:

```text
프로젝트 멤버로 표시
```

향후 ADMIN 등을 추가할 수 있다.

---

# 25. 프로젝트 삭제

Project 삭제 정책은 초기에는 Hard Delete보다 Soft Delete 권장.

예:

```text
deletedAt
```

삭제된 프로젝트는 일반 사용자에게 노출하지 않는다.

관련 Application / PUSH / Recruitment 데이터는
즉시 물리 삭제하지 않아도 된다.

---

# 26. 예상 핵심 DB Entity

초기 Backend에서 필요한 핵심 Entity:

```text
User
Project
ProjectMember
ProjectLink
ProjectGallery
Recruitment
RecruitmentPosition
Application
Push
Watch
Notification
Inquiry
```

추후:

```text
Ping
Advertisement
ProjectLog
```

추가 가능.

---

# 27. API 우선순위

Backend 구현은 아래 순서 권장.

| Priority | 범위 |
| --- | --- |
| P0 | Auth / User |
| P0 | Project CRUD |
| P0 | Maker Profile |
| P0 | Recruitment |
| P0 | Application |
| P1 | CREW / ProjectMember |
| P1 | PUSH |
| P1 | Notification |
| P1 | Search |
| P1 | Ranking |
| P2 | WATCH |
| P2 | PING |
| P2 | Inquiry |
| P2 | Admin / Advertisement |

---

# 28. 권장 API

## Auth

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me
```

## User / Maker

```text
GET   /makers
GET   /makers/:username
PATCH /users/me
```

## Projects

```text
GET    /projects
GET    /projects/:slug
POST   /projects
PATCH  /projects/:slug
DELETE /projects/:slug

GET /projects/featured
```

## PUSH

```text
POST   /projects/:slug/push
DELETE /projects/:slug/push
```

## Recruitment

```text
GET    /recruitments
GET    /projects/:slug/recruitments

POST   /projects/:slug/recruitments
PATCH  /recruitments/:id
DELETE /recruitments/:id
```

## Application

```text
POST /recruitments/:id/applications

GET /applications/sent
GET /applications/received

PATCH /applications/:id/withdraw
PATCH /applications/:id/accept
PATCH /applications/:id/reject

PATCH /applications/:id/crew/accept
PATCH /applications/:id/crew/reject
```

## Notifications

```text
GET   /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all
```

## Search

```text
GET /search?q=
```

## Ranking

```text
GET /projects/ranking
```

## Watch

```text
POST   /makers/:username/watch
DELETE /makers/:username/watch
```

## Inquiry

```text
POST /inquiries
```

---

# 29. Frontend에서 현재 Mock인 부분

현재 Backend 연결 시 교체해야 하는 부분:

| Frontend | 현재 상태 |
| --- | --- |
| Auth | localStorage |
| Project | mock |
| Maker | mock |
| Recruitment | mock |
| Application | local state + mock |
| Notification | local state + mock |
| PUSH | local state |
| WATCH | local state |
| Ranking | mock 계산 |
| Search | client-side mock 검색 |
| Inquiry | console.log |
| Project Create | 실제 서버 저장 없음 |

UI와 사용자 플로우는 먼저 구현되어 있으므로
Backend 연결 시 데이터 호출 부분을 교체하는 방식으로 진행한다.

---

# 30. Frontend-Backend 기본 응답 규칙

가능하면 API 응답은 다음 구조로 통일한다.

성공:

```json
{
  "success": true,
  "data": {}
}
```

실패:

```json
{
  "success": false,
  "error": {
    "code": "APPLICATION_ALREADY_EXISTS",
    "message": "이미 지원한 프로젝트입니다."
  }
}
```

Frontend가 서버의 message를 그대로 사용자에게 보여줄 수도 있으므로
message는 한국어 사용자 메시지로 제공 가능하다.

---

# 31. Backend 개발 시 중요한 비즈니스 규칙

반드시 지켜야 하는 규칙:

```text
1. Project status와 recruiting은 별개다.

2. Application accepted가 곧 CREW 합류는 아니다.

3. CREW는 Applicant가 최종 합류 요청을 수락했을 때만 생성한다.

4. PUSH는 사용자당 프로젝트 하나만 가능하다.

5. WATCH는 사용자당 Maker 하나만 가능하다.

6. Project 생성자는 자동 Owner다.

7. 로그인하지 않아도 공개 프로젝트와 Maker 조회가 가능하다.

8. 쓰기 기능은 로그인 필요.

9. 사용자 프로필에는 실제 joined 상태의 Project만 CREW 활동으로 표시한다.

10. username과 Project slug는 URL 식별자로 사용한다.
```

---

# 32. Codex 개발 목표

Frontend 디자인이나 UI 구조를 변경하지 않는다.

Backend의 목표는 현재 Frontend Mock 데이터를
실제 API 데이터로 교체할 수 있도록 서버를 구현하는 것이다.

우선 다음 흐름이 E2E로 동작해야 한다.

```text
회원가입
→ 로그인
→ 프로젝트 생성
→ 모집 공고 생성
→ 다른 사용자 지원
→ Owner가 지원 확인
→ 지원 수락
→ CREW 합류 요청
→ 지원자가 최종 수락
→ Project Member 등록
→ 알림 확인
```

이 흐름을 Backend 1차 완료 기준으로 사용한다.
```

---

이 정도는 넘겨줘야 코덱스가 **“화면 보고 DB 알아서 만들어”**가 아니라, 프론트와 정확히 맞는 서버를 만들 수 있어.

특히 지금 서버 개발에서 가장 중요한 건 이 세 가지야.

| 중요 | 이유 |
|---|---|
| `Application → CREW` 상태 흐름 | 여기 잘못 만들면 지원 시스템 전체 다시 뜯어야 함 |
| Project와 Maker 응답 구조 | 이미 여러 프론트 화면이 이 데이터 구조를 공유함 |
| Auth/User ID 체계 | PUSH, WATCH, 지원, 알림 전부 사용자 ID에 매달림 |

그리고 코덱스에는 이 파일과 함께 처음에 이렇게 지시하면 돼.

> `docs/BACKEND_HANDOFF.md`를 먼저 전부 읽고 현재 `ship-web` 프론트엔드의 타입과 Mock Data 구조를 확인해라. UI나 프론트의 비즈니스 플로우를 임의로 변경하지 말고, 문서에 정의된 정책을 기준으로 Backend를 설계해라. 먼저 전체 Entity/ERD와 API 구조를 제안하고, P0(Auth/User, Project, Maker, Recruitment, Application)부터 구현해라. Application 수락과 CREW 최종 합류를 반드시 별도 단계로 유지해라.


```bash
git add docs/BACKEND_HANDOFF.md
git commit -m "[Docs] : 백엔드 개발 연동 명세 정리"
git push origin develop
```
