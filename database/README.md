# Database

Database-related assets live here or under the main application resources:

- `migration/V1__init_schema.sql`
- `migration/V2__seed_sample_survey.sql`
- `ERD.md`

Database defaults:

- Database name: `sky_survey_db`
- Username: `admin`
- Password: `admin123`

The application points Flyway at `../database/migration` by default when started from `backend/`.

File uploads are stored under the configured `file.upload.path`, which defaults to `media file` inside `backend/`.
