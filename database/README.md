# Database

Database deliverables for the intern task:

| Deliverable | File |
|---|---|
| ERD diagram (PNG) | [`ERD.png`](ERD.png) — also export fresh from [`ERD.dbml`](ERD.dbml) via [dbdiagram.io](https://dbdiagram.io) |
| ERD (DBML import) | [`ERD.dbml`](ERD.dbml) |
| ERD (detailed PK/FK reference) | [`ERD_DETAILED.md`](ERD_DETAILED.md) |
| ERD overview | [`ERD.md`](ERD.md) |
| Full SQL script | [`sky_survey_db.sql`](sky_survey_db.sql) |
| Incremental migrations | `migration/V1__init_schema.sql` … `V5__add_response_shortlist.sql` |

Database defaults:

- Database name: `sky_survey_db`
- Username: `admin`
- Password: `admin123`

The application points Flyway at `../database/migration` by default when started from `backend/`.

File uploads are stored under the configured `file.upload.path`, which defaults to `media file` inside `backend/`.
