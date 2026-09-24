# SHIP Backend Design

## Architecture

NestJS modules are organized by domain. Controllers own HTTP contracts, services own business rules, and Prisma is the only persistence boundary. A global validation pipe, response interceptor, and exception filter keep every endpoint consistent.

```text
src/
  common/{decorators,filters,guards,interceptors,types}
  prisma/
  auth/
  users/
  makers/
  projects/
  recruitments/
  applications/
  notifications/
  health/
prisma/{schema.prisma,seed.ts}
test/
```

## Entities and relationships

- User owns projects and is also the Maker profile.
- Project belongs to one owner and has links, gallery images, members, recruitments, pushes, and applications through recruitments.
- ProjectMember joins User and Project. The creator receives `OWNER`; an applicant receives `CREW` only after accepting a crew invitation.
- Recruitment belongs to a project and contains one or more positions.
- Application belongs to one applicant, recruitment, and position. `status` and `crewStatus` are independent state machines.
- Push is unique by user/project. Watch is unique by watcher/maker.
- RefreshToken stores only an Argon2 hash and supports rotation/revocation.

## State rules

```text
Application: PENDING -> WITHDRAWN | REJECTED | ACCEPTED
Crew:        NONE -> INVITED -> JOINED | DECLINED
```

Owner acceptance atomically changes `PENDING/NONE` to `ACCEPTED/INVITED`. It never creates a ProjectMember. Applicant crew acceptance atomically changes `INVITED` to `JOINED` and upserts the ProjectMember.

Project `status` (`operating`, `inProgress`, `ended`) and `recruiting` are separate values.

## DTO inventory

- Auth: `SignUpDto`, `LoginDto`, `RefreshTokenDto`, `LogoutDto`
- User: `UpdateMeDto`
- Project: `CreateProjectDto`, `UpdateProjectDto`, `ProjectLinkDto`
- Recruitment: `CreateRecruitmentDto`, `UpdateRecruitmentDto`, `RecruitmentPositionDto`
- Application: `CreateApplicationDto`

All DTOs reject unknown fields. Usernames are normalized to lowercase and must match `^[a-z0-9._]{3,20}$`.

## API

All routes use `/api`; Swagger is at `/api/docs`.

```text
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

GET    /makers
GET    /makers/:username
POST   /makers/:username/watch
DELETE /makers/:username/watch
PATCH  /users/me

GET    /projects
GET    /projects/featured
GET    /projects/:slug
POST   /projects
PATCH  /projects/:slug
DELETE /projects/:slug
POST   /projects/:slug/push
DELETE /projects/:slug/push

GET    /recruitments
GET    /projects/:slug/recruitments
POST   /projects/:slug/recruitments
PATCH  /recruitments/:id
DELETE /recruitments/:id

POST   /recruitments/:id/applications
GET    /applications/sent
GET    /applications/received
PATCH  /applications/:id/withdraw
PATCH  /applications/:id/accept
PATCH  /applications/:id/reject
PATCH  /applications/:id/crew/accept
PATCH  /applications/:id/crew/reject

GET    /notifications
GET    /notifications/unread-count
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
```

## Error codes

```text
VALIDATION_FAILED
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_INVALID
AUTH_REFRESH_TOKEN_REVOKED
EMAIL_ALREADY_EXISTS
USERNAME_ALREADY_EXISTS
USER_NOT_FOUND
PROJECT_NOT_FOUND
PROJECT_SLUG_ALREADY_EXISTS
PROJECT_OWNER_REQUIRED
RECRUITMENT_NOT_FOUND
RECRUITMENT_CLOSED
POSITION_NOT_FOUND
APPLICATION_NOT_FOUND
APPLICATION_ALREADY_EXISTS
APPLICATION_INVALID_TRANSITION
CANNOT_APPLY_OWN_PROJECT
PUSH_ALREADY_EXISTS
PUSH_NOT_FOUND
WATCH_ALREADY_EXISTS
WATCH_NOT_FOUND
CANNOT_WATCH_SELF
NOTIFICATION_NOT_FOUND
INTERNAL_SERVER_ERROR
```

## Frontend adapter notes

- Project creation UI currently supplies image `File` objects while this MVP stores image URLs. Upload storage remains a separate integration.
- If `slug` is omitted, the server derives it from the project name and adds a collision suffix when necessary.
- If `status` is omitted, it defaults to `inProgress`.
- Application creation uses `positionId`; the frontend should send the selected position's ID instead of only its role label.
- Free-text project creation `teamMembers` are display-only input and must not create account-backed ProjectMember rows.
