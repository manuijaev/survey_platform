# simple-survey-api

Spring Boot 3 REST API for XML-first survey collection with dynamic branching, PDF certificate uploads, PostgreSQL, and Flyway-managed schema migrations.

## Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL 14+

## Installation

1. Clone the repository.
2. Change into the backend application directory:
   ```bash
   cd backend
   ```
3. Create the database:
   ```sql
   CREATE DATABASE sky_survey_db;
   ```
4. Create the upload directory referenced by `file.upload.path`, for example:
   ```bash
   mkdir -p "media file"
   ```
5. Configure `src/main/resources/application.properties` or set environment variables for your local database credentials, upload path, and optional Flyway migrations path.
6. Start the application. Flyway will run automatically on startup and apply the SQL files from `../database/migration`.

## Run Locally

```bash
mvn spring-boot:run
```

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `SERVER_PORT` | HTTP port | `8080` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `sky_survey_db` |
| `DB_USERNAME` | PostgreSQL username | `admin` |
| `DB_PASSWORD` | PostgreSQL password | `admin123` |
| `FILE_UPLOAD_PATH` | Directory for uploaded PDFs | `media file` |

## Repository Layout

- `backend/` contains backend navigation notes.
- `database/` contains database navigation notes, the ERD, and the Flyway migration SQL files.
- `media file/` is the default upload directory used by the application when you run from `backend/`.

## Technologies Used

- Spring Boot 3: application bootstrap and REST stack
- Spring Data JPA: persistence and repository abstraction
- PostgreSQL: relational storage for survey, response, and branching data
- Flyway: versioned schema and seed migrations
- Jackson XML: XML request/response serialization
- Caffeine: fast in-memory caching for survey questions and branching rules
- Apache Tika: MIME-type detection for uploaded files
- Commons IO: filename handling during certificate storage
- Lombok: boilerplate reduction across entities, DTOs, and services

## Assumptions

- The application starts with Flyway enabled and `spring.jpa.hibernate.ddl-auto=validate`.
- XML is the only supported payload/response format for JSON-style endpoints.
- `V2__seed_sample_survey.sql` seeds the sample survey and branching rules so the API is immediately demonstrable.
- Branching rules use exact string matching on answer values.
- Uploaded certificates are validated as PDF files before async persistence.

## Dynamic Skill-Tree Branching

The branching engine decides the next visible question by combining:

1. Base questions with no inbound rules, which are always visible.
2. Questions with inbound rules, which become visible when any rule matches the last recorded answer for its source question.
3. Answered questions, which are skipped when selecting the next visible question.

### API Flow

1. Call `GET /api/surveys/{surveyId}/next-question` with:
   - `answeredQuestions=full_name,email_address`
   - `lastAnswers=years_experience:3+,preferred_frontend_framework:REACT`
2. The API resolves the first visible unanswered question.
3. Once all visible questions are answered, the API returns `<survey_complete>true</survey_complete>`.

### Rule Management

Create branching rules through the API:

```xml
<skill_tree_rule>
  <source_question_name>years_experience</source_question_name>
  <trigger_value>3+</trigger_value>
  <target_question_name>system_design_question</target_question_name>
</skill_tree_rule>
```

Multiple rules can unlock the same target question. Any matching rule is enough to reveal it.
