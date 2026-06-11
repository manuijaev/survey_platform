# SkyWorld Survey Platform

Monorepo implementation of the **Sky World Limited – Software Engineering Intern Pre-Interview Task**.

## Repositories

| Spec repository | Location | Notes |
|---|---|---|
| `simple-survey-api` | [`backend/`](backend/) + [`database/`](database/) | Spring Boot XML API, Flyway migrations, Postman collection |
| `simple-survey-web` | [`frontend/`](frontend/) | Next.js admin console and public survey web app |
| `simple-survey-mobile` | https://github.com/manuijaev/simple-survey-mobile | Android TWA APK + build docs ([`mobile/`](mobile/) in this monorepo) |

**Monorepo:** https://github.com/manuijaev/survey_platform

## Live deployments

| Service | URL |
|---|---|
| Web (Vercel) | https://survey-platform-lemon-one.vercel.app |
| API (Render) | Set `API_URL` / `NEXT_PUBLIC_API_URL` on Vercel to your Render backend |
| Android APK (v1.0.0) | https://github.com/manuijaev/simple-survey-mobile/releases/download/v1.0.0/app-release-signed.apk |

## Task compliance summary

### 1. Database

| Requirement | Status | Location |
|---|---|---|
| RDBMS (PostgreSQL) | Done | [`database/migration/`](database/migration/) |
| Database name `sky_survey_db` | Done | `backend` defaults + [`database/sky_survey_db.sql`](database/sky_survey_db.sql) |
| ERD | Done | [`database/ERD.png`](database/ERD.png), [`database/ERD.dbml`](database/ERD.dbml), [`database/ERD_DETAILED.md`](database/ERD_DETAILED.md) |
| SQL script | Done | [`database/sky_survey_db.sql`](database/sky_survey_db.sql) |

### 2. REST API (XML)

| Endpoint | Status |
|---|---|
| `POST /api/surveys` | Done |
| `GET /api/surveys` | Done |
| `GET /api/surveys/{id}` | Done (extra) |
| `PUT /api/surveys/{id}` | Done |
| `DELETE /api/surveys/{id}` | Done |
| `POST /api/surveys/{surveyId}/questions` | Done |
| `GET /api/surveys/{surveyId}/questions` | Done |
| `PUT /api/surveys/{surveyId}/questions/{questionId}` | Done |
| `DELETE /api/surveys/{surveyId}/questions/{questionId}` | Done |
| `POST /api/surveys/{surveyId}/responses` (multipart) | Done |
| `GET /api/surveys/{surveyId}/responses` (paginated, email filter) | Done |
| `GET /api/certificates/{id}` (download) | Done |
| XML request/response format | Done |
| Postman collection | Done — [`backend/SurveyAPI.postman_collection.json`](backend/SurveyAPI.postman_collection.json) |

**Question types:** `short_text`, `long_text`, `email`, `choice` (single + multiple via `multiple` attribute), `file`.

### 3. User interface

| Page | Status | Route |
|---|---|---|
| Survey management (CRUD) | Done | `/admin/surveys` |
| Question management + options | Done | `/admin/surveys/{id}/questions` |
| Available surveys | Done | `/surveys` |
| Survey details | Done | `/surveys/{id}` |
| Stepped survey form (dynamic) | Done | `/surveys/{id}/respond` |
| Review before submit | Done | Final step in respond flow |
| Response management | Done | `/admin/surveys/{id}/responses` |
| Email filter + pagination | Done | Responses page |
| Certificate download/preview | Done | Response detail modal |

**Survey form requirements:** one question per step, Previous/Next, hide Previous on step 1, required validation, review page, multipart XML submission, dynamic controls per question type — all implemented.

### 4. Mobile application

| Requirement | Status | Notes |
|---|---|---|
| Survey discovery on mobile | Done | Responsive web, PWA, and Android APK |
| Survey completion on mobile | Done | `/surveys/{id}/respond` |
| Separate `simple-survey-mobile` repo | Done | https://github.com/manuijaev/simple-survey-mobile |
| APK publish | Done | Signed TWA release [v1.0.0](https://github.com/manuijaev/simple-survey-mobile/releases/tag/v1.0.0) |

The Android app is a **Trusted Web Activity (TWA)** built with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap). It wraps the production PWA at https://survey-platform-lemon-one.vercel.app and opens fullscreen via [Digital Asset Links](https://survey-platform-lemon-one.vercel.app/.well-known/assetlinks.json).

| Install option | How |
|---|---|
| Android APK | Download from [GitHub Releases](https://github.com/manuijaev/simple-survey-mobile/releases/download/v1.0.0/app-release-signed.apk) |
| Android PWA | Open the live URL in Chrome → Install app / Add to Home screen |
| iOS PWA | Open the live URL in Safari → Share → Add to Home Screen |

Build instructions: [`mobile/BUBBLEWRAP_SETUP.md`](mobile/BUBBLEWRAP_SETUP.md), [`mobile/APK_BUILD_GUIDE.md`](mobile/APK_BUILD_GUIDE.md).

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

## Submission links

| Item | URL |
|---|---|
| API + database | https://github.com/manuijaev/survey_platform (`backend/`, `database/`) |
| Web app | https://github.com/manuijaev/survey_platform (`frontend/`) |
| Mobile repo | https://github.com/manuijaev/simple-survey-mobile |
| Live web app | https://survey-platform-lemon-one.vercel.app |
| Android APK | https://github.com/manuijaev/simple-survey-mobile/releases/download/v1.0.0/app-release-signed.apk |

> The Android application is a Trusted Web Activity (TWA) packaging the production PWA. It provides the same mobile survey discovery, stepped completion, and multipart submission experience as the web app.

## Assumptions (beyond the brief)

- Admin routes are protected with session auth (`/admin/*`).
- Dynamic branching (skill-tree rules) extends the base spec for conditional questions.
- Certificate storage uses PDF validation; Render free tier uses ephemeral disk unless a persistent volume is attached.
- The web app proxies API calls in production via `/api/proxy` for same-origin PWA behaviour.

## Technologies

- **Backend:** Java 17, Spring Boot 3, JPA, PostgreSQL, Flyway, Jackson XML
- **Frontend:** Next.js 15, React 19, TypeScript, TanStack Query, Framer Motion, PWA
- **Mobile:** Bubblewrap TWA, Android SDK, signed APK (`com.skyworld.survey`)
- **Database:** PostgreSQL 14+
