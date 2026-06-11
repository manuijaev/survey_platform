# SkyWorld Survey Platform

Monorepo implementation of the **Sky World Limited – Software Engineering Intern Pre-Interview Task**.

| Spec repository | This project path | Notes |
|---|---|---|
| `simple-survey-api` | [`backend/`](backend/) + [`database/`](database/) | Spring Boot XML API, Flyway migrations, Postman collection |
| `simple-survey-web` | [`frontend/`](frontend/) | Next.js admin + public web app |
| `simple-survey-mobile` | PWA in [`frontend/`](frontend/) | Installable mobile web app (see [Mobile](#mobile-application)) |

**GitHub (monorepo):** https://github.com/manuijaev/survey_platform

## Live deployments (optional credit)

| Service | URL |
|---|---|
| Web (Vercel) | https://survey-platform-lemon-one.vercel.app |
| API (Render) | Configure `API_URL` / `NEXT_PUBLIC_API_URL` on Vercel to your Render backend |

## Task compliance summary

### 1. Database

| Requirement | Status | Location |
|---|---|---|
| RDBMS (PostgreSQL) | ✅ | `database/migration/` |
| Database name `sky_survey_db` | ✅ | `backend` defaults + `database/sky_survey_db.sql` |
| ERD | ✅ | [`database/ERD.png`](database/ERD.png), [`database/ERD.dbml`](database/ERD.dbml), [`database/ERD_DETAILED.md`](database/ERD_DETAILED.md) |
| SQL script | ✅ | [`database/sky_survey_db.sql`](database/sky_survey_db.sql) |

### 2. REST API (XML)

| Endpoint | Status |
|---|---|
| `POST /api/surveys` | ✅ |
| `GET /api/surveys` | ✅ |
| `GET /api/surveys/{id}` | ✅ (extra) |
| `PUT /api/surveys/{id}` | ✅ |
| `DELETE /api/surveys/{id}` | ✅ |
| `POST /api/surveys/{surveyId}/questions` | ✅ |
| `GET /api/surveys/{surveyId}/questions` | ✅ |
| `PUT /api/surveys/{surveyId}/questions/{questionId}` | ✅ |
| `DELETE /api/surveys/{surveyId}/questions/{questionId}` | ✅ |
| `POST /api/surveys/{surveyId}/responses` (multipart) | ✅ |
| `GET /api/surveys/{surveyId}/responses` (paginated, email filter) | ✅ |
| `GET /api/certificates/{id}` (download) | ✅ |
| XML request/response format | ✅ |
| Postman collection | ✅ [`backend/SurveyAPI.postman_collection.json`](backend/SurveyAPI.postman_collection.json) |

**Question types:** `short_text`, `long_text`, `email`, `choice` (single + multiple via `multiple` attribute), `file`.

### 3. User interface

| Page | Status | Route |
|---|---|---|
| Survey management (CRUD) | ✅ | `/admin/surveys` |
| Question management + options | ✅ | `/admin/surveys/{id}/questions` |
| Available surveys | ✅ | `/surveys` |
| Survey details | ✅ | `/surveys/{id}` |
| Stepped survey form (dynamic) | ✅ | `/surveys/{id}/respond` |
| Review before submit | ✅ | Final step in respond flow |
| Response management | ✅ | `/admin/surveys/{id}/responses` |
| Email filter + pagination | ✅ | Responses page |
| Certificate download/preview | ✅ | Response detail modal |

**Survey form requirements:** one question per step, Previous/Next, hide Previous on step 1, required validation, review page, multipart XML submission, dynamic controls per question type — all implemented.

### 4. Mobile application

| Requirement | Status | Notes |
|---|---|---|
| Survey discovery on mobile | ✅ | Responsive web + PWA |
| Survey completion on mobile | ✅ | `/surveys/{id}/respond` |
| Separate `simple-survey-mobile` repo | ⚠️ | Delivered as **installable PWA** in the web repo |
| APK publish | ⚠️ | Install via **Add to Home Screen** (iOS/Android) or ship a TWA/APK wrapper separately |

See [`mobile/APK_BUILD_GUIDE.md`](mobile/APK_BUILD_GUIDE.md) to build a real Android APK, and [`frontend/README.md`](frontend/README.md#mobile-pwa) for PWA install.

## Quick start

### API

```bash
cd backend
# Create DB: CREATE DATABASE sky_survey_db;
mvn spring-boot:run
```

### Web

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- Public surveys: http://localhost:3000/surveys
- Admin: http://localhost:3000/admin/login (default `admin` / `admin123`)

## Submission checklist

Before submitting to Sky World Limited, provide:

1. **API repo link** — point to `backend/` + `database/` (or split into `simple-survey-api`)
2. **Web repo link** — point to `frontend/` (or `simple-survey-web`)
3. **Mobile repo link** — document PWA approach or create `simple-survey-mobile` with APK
4. **Deployment URLs** — Vercel + Render (optional credit)
5. **APK** — if required strictly, build TWA/APK from the PWA or a thin React Native shell

## Assumptions (beyond the brief)

- Admin routes are protected with session auth (`/admin/*`).
- Dynamic branching (skill-tree rules) extends the base spec for conditional questions.
- Certificate storage uses PDF validation; Render free tier uses ephemeral disk unless persistent volume is attached.
- The web app proxies API calls in production via `/api/proxy` for same-origin PWA behaviour.

## Technologies

- **Backend:** Java 17, Spring Boot 3, JPA, PostgreSQL, Flyway, Jackson XML
- **Frontend:** Next.js 15, React 19, TypeScript, TanStack Query, Framer Motion, PWA
- **Database:** PostgreSQL 14+
