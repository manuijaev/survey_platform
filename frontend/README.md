# simple-survey-web

Next.js 15 frontend for the SkyWorld Survey Platform (`simple-survey-web`), built around the "Deep Sea Logic" design system. Includes an installable **PWA** that satisfies the mobile participation requirements from the intern task brief.

## Prerequisites

- Node.js 20+
- npm 10+
- Running Spring Boot API on port `8080` (see [`../backend/README.md`](../backend/README.md))

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4 for utility styling plus global CSS variables
- Framer Motion for motion and transitions
- Axios for API access
- `fast-xml-parser` for XML request/response handling
- TanStack Query for server state
- React Hook Form and Zod for form validation
- `react-dropzone` for PDF uploads
- `@dnd-kit` for question reordering
- Lucide React for icons

## Backend

- Base URL: `http://localhost:8080`
- Requests and responses use XML where the backend expects it
- Survey submissions use multipart form data with an XML payload part plus optional PDF files

## Routes

- `/surveys` - public survey browser
- `/surveys/[surveyId]` - public survey landing page
- `/surveys/[surveyId]/respond` - survey response flow
- `/admin/surveys` - admin survey management
- `/admin/surveys/[surveyId]/questions` - question management
- `/admin/surveys/[surveyId]/responses` - response table

## Assumptions

- The backend returns XML payloads that can be normalized into arrays or single records.
- Admin and public experiences cannot share the same pathname in Next.js without route collisions, so the admin area is namespaced under `/admin`.
- The backend supports `page`, `pageSize`, and `email` filters on the responses endpoint.
- **Mobile** is delivered as a Progressive Web App (installable, standalone display) rather than a separate native codebase, covering survey discovery, completion, and submission on phones.

## Mobile (PWA)

The brief requires survey participation on mobile. This repo fulfils that via a PWA:

1. Open the deployed site (or `http://localhost:3000` with `NEXT_PUBLIC_ENABLE_PWA=true` in production builds).
2. Use **Install app** / **Add to Home Screen** on Android or iOS Safari.
3. Launch from the home screen — routes `/surveys`, `/surveys/[id]`, and `/surveys/[id]/respond` are mobile-optimised.

For a standalone `simple-survey-mobile` repository or APK submission, you can wrap this PWA with [Bubblewrap/TWA](https://github.com/GoogleChromeLabs/bubblewrap) or document the PWA install path in your submission.

## Deployment

| Environment | URL |
|---|---|
| Production (Vercel) | https://survey-platform-lemon-one.vercel.app |

Set on Vercel:

- `API_URL` — Render (or local) backend base URL
- `NEXT_PUBLIC_API_URL` — same value for client-side discovery
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Ensure the Spring Boot backend is running on `http://localhost:8080`.

## Notes

- Fonts are loaded globally through Google Fonts in `app/globals.css`.
- Toasts, validation errors, loading skeletons, and empty states are implemented locally.
- XML helper utilities live in `lib/xml.ts`.
