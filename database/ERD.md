# Survey Platform ERD

**Database:** `sky_survey_db` · **PostgreSQL**

| Asset | Purpose |
|-------|---------|
| [`ERD.dbml`](ERD.dbml) | Import into [dbdiagram.io](https://dbdiagram.io) → **Export PNG** |
| [`ERD_DETAILED.md`](ERD_DETAILED.md) | Full column, PK, FK, UK, and index reference |
| [`ERD.png`](ERD.png) | Pre-exported diagram (generate via steps below) |

## Quick export (PNG for submission)

1. Go to [dbdiagram.io](https://dbdiagram.io/d)
2. **Import** the file [`ERD.dbml`](ERD.dbml)
3. Menu → **Export to PNG**
4. Save as `database/ERD.png` in this repo

## DBML (copy-paste)

The canonical schema with all keys and relationships is in [`ERD.dbml`](ERD.dbml).

High-level structure:

```
survey (PK: id)
 ├── question (PK: id, FK: survey_id → survey.id)
 │    ├── question_option (PK: id, FK: question_id → question.id)
 │    └── skill_tree_rule (FK: source_question_id, target_question_id → question.id)
 ├── survey_response (PK: id, FK: survey_id → survey.id)
 │    ├── response_answer (PK: id, FK: survey_response_id → survey_response.id)
 │    └── certificate (PK: id, FK: survey_response_id → survey_response.id)
 └── response_shortlist (PK: id, FK: survey_id, survey_response_id)
```

All foreign keys use **ON DELETE CASCADE**.

See [`ERD_DETAILED.md`](ERD_DETAILED.md) for per-table column definitions and cardinality.
