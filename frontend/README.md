# SkyWorld Survey Platform Frontend

Next.js 15 frontend for `simple-survey-web`, built around the "Deep Sea Logic" design system.

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
- The backend may support page and size filters on the responses endpoint; the UI also keeps a client-side fallback for pagination controls.

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
