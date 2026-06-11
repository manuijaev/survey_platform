# SkyWorld Survey Platform — Submission

**Candidate:** Emmanuel Kenyani  
**Task:** Sky World Limited — Software Engineering Intern Pre-Interview Task  
**Date:** June 2026

---

## Required submission links

| # | Item | Link |
|---|------|------|
| 1 | **API repository** | https://github.com/manuijaev/survey_platform/tree/master/backend |
| 2 | **Web repository** | https://github.com/manuijaev/survey_platform/tree/master/frontend |
| 3 | **Public deployment** (optional) | https://survey-platform-lemon-one.vercel.app |
| 4 | **Mobile repository** | https://github.com/manuijaev/simple-survey-mobile |
| 5 | **Mobile APK** | https://github.com/manuijaev/simple-survey-mobile/releases/download/v1.0.0/app-release-signed.apk |

**Monorepo (API + web + database):** https://github.com/manuijaev/survey_platform

The task asks for three named repositories. This submission maps them as follows:

| Spec name | Location |
|-----------|----------|
| `simple-survey-api` | `survey_platform/backend/` + `survey_platform/database/` |
| `simple-survey-web` | `survey_platform/frontend/` |
| `simple-survey-mobile` | https://github.com/manuijaev/simple-survey-mobile |

Each area includes a README with prerequisites, installation, local run, technologies, and assumptions.

---

## Public deployment

| Service | URL |
|---------|-----|
| Web application | https://survey-platform-lemon-one.vercel.app |
| Public surveys | https://survey-platform-lemon-one.vercel.app/surveys |
| Admin login | https://survey-platform-lemon-one.vercel.app/admin/login |
| Admin username | `admin` |
| Admin password | `admin123` |
| TWA asset links | https://survey-platform-lemon-one.vercel.app/.well-known/assetlinks.json |

---

## Task compliance checklist

### 1. Database (PostgreSQL, `sky_survey_db`)

| Requirement | Status | Location |
|-------------|--------|----------|
| ERD diagram | Done | https://github.com/manuijaev/survey_platform/blob/master/database/ERD.png |
| Database SQL script | Done | https://github.com/manuijaev/survey_platform/blob/master/database/sky_survey_db.sql |
| Database name `sky_survey_db` | Done | Migrations + backend config |

### 2. REST API (XML)

| Requirement | Status |
|-------------|--------|
| `POST /api/surveys` | Done |
| `GET /api/surveys` | Done |
| `PUT /api/surveys/{id}` | Done |
| `DELETE /api/surveys/{id}` | Done |
| `POST /api/surveys/{surveyId}/questions` | Done |
| `GET /api/surveys/{surveyId}/questions` | Done |
| `PUT /api/surveys/{surveyId}/questions/{questionId}` | Done |
| `DELETE /api/surveys/{surveyId}/questions/{questionId}` | Done |
| `POST /api/surveys/{surveyId}/responses` (multipart/form-data) | Done |
| `GET /api/surveys/{surveyId}/responses` (paginated, email filter) | Done |
| `GET /api/certificates/{id}` (download) | Done |
| XML request/response format | Done |
| Postman collection | Done — `backend/SurveyAPI.postman_collection.json` |

**Question types supported:** short text, long text, email, single choice, multiple choice, file upload (PDF).

### 3. User interface (web)

| Page / capability | Status | Route |
|-------------------|--------|-------|
| Survey management (create, edit, view, delete) | Done | `/admin/surveys` |
| Question management (add, edit, delete, options) | Done | `/admin/surveys/{id}/questions` |
| Available surveys | Done | `/surveys` |
| Survey details | Done | `/surveys/{id}` |
| Stepped survey form (dynamic from API) | Done | `/surveys/{id}/respond` |
| One question per step | Done | |
| Previous / Next navigation | Done | Previous hidden on step 1 |
| Required validation before proceed | Done | |
| Review page before submit | Done | |
| Multipart response submission | Done | |
| Response management | Done | `/admin/surveys/{id}/responses` |
| Paginated responses | Done | |
| Filter by email | Done | |
| Download certificates | Done | |

### 4. Mobile application

| Requirement | Status | Notes |
|-------------|--------|-------|
| Survey discovery on mobile | Done | Responsive web, PWA, Android APK |
| Survey completion on mobile | Done | Same `/surveys/{id}/respond` flow |
| Mobile source repository | Done | https://github.com/manuijaev/simple-survey-mobile |
| Published APK | Done | Signed TWA v1.0.0 |

### 5. Documentation and deployment (optional credit)

| Item | Status |
|------|--------|
| README per component | Done — `backend/`, `frontend/`, `database/`, `mobile/` |
| Meaningful commit history | Done |
| Deployed web app | Done — Vercel |
| Published APK | Done — GitHub Release |
| Public URLs | Done |

---

## Assumptions (beyond the brief)

- Admin authentication is enforced on the web app (`/admin/*`); the REST API is open for demo/testing.
- Dynamic question branching (skill-tree rules) extends the base spec; new surveys still need no code changes.
- Email filter on responses matches answers to the question named `email_address`.
- Certificate uploads are validated as PDF.
- API and web live in one monorepo with clear folder paths; mobile is a separate repository with signed APK.

---

## Mobile APK details

| Item | Value |
|------|-------|
| Download | https://github.com/manuijaev/simple-survey-mobile/releases/download/v1.0.0/app-release-signed.apk |
| Release | https://github.com/manuijaev/simple-survey-mobile/releases/tag/v1.0.0 |
| Package ID | `com.skyworld.survey` |
| Version | 1.0.0 (signed, ~2.7 MB) |

The Android app is a Trusted Web Activity (TWA) packaging the production PWA. It provides the same survey discovery, stepped completion, and multipart submission experience as the web application.
