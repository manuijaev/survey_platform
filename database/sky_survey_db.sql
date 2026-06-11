-- SkyWorld Survey Platform — consolidated PostgreSQL script
-- Database name required by the brief: sky_survey_db
--
-- Usage (psql):
--   psql -U postgres -f database/sky_survey_db.sql
--
-- Or create manually then run schema sections:
--   CREATE DATABASE sky_survey_db;
--   \c sky_survey_db

CREATE DATABASE sky_survey_db;

\connect sky_survey_db

-- V1__init_schema.sql
CREATE TABLE survey (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER,
    file_format VARCHAR(64),
    max_file_size_mb INTEGER,
    multiple_files BOOLEAN,
    CONSTRAINT uk_question_survey_name UNIQUE (survey_id, name),
    CONSTRAINT fk_question_survey FOREIGN KEY (survey_id) REFERENCES survey(id) ON DELETE CASCADE
);

CREATE TABLE question_option (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    value VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    order_index INTEGER,
    CONSTRAINT uk_question_option_question_value UNIQUE (question_id, value),
    CONSTRAINT fk_question_option_question FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE
);

CREATE TABLE skill_tree_rule (
    id BIGSERIAL PRIMARY KEY,
    source_question_id BIGINT NOT NULL,
    trigger_value VARCHAR(255) NOT NULL,
    target_question_id BIGINT NOT NULL,
    survey_id BIGINT NOT NULL,
    CONSTRAINT fk_skill_tree_source FOREIGN KEY (source_question_id) REFERENCES question(id) ON DELETE CASCADE,
    CONSTRAINT fk_skill_tree_target FOREIGN KEY (target_question_id) REFERENCES question(id) ON DELETE CASCADE,
    CONSTRAINT fk_skill_tree_survey FOREIGN KEY (survey_id) REFERENCES survey(id) ON DELETE CASCADE
);

CREATE TABLE survey_response (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL,
    date_responded TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_survey_response_survey FOREIGN KEY (survey_id) REFERENCES survey(id) ON DELETE CASCADE
);

CREATE TABLE response_answer (
    id BIGSERIAL PRIMARY KEY,
    survey_response_id BIGINT NOT NULL,
    question_name VARCHAR(255) NOT NULL,
    answer_value TEXT,
    CONSTRAINT fk_response_answer_response FOREIGN KEY (survey_response_id) REFERENCES survey_response(id) ON DELETE CASCADE
);

CREATE TABLE certificate (
    id BIGSERIAL PRIMARY KEY,
    survey_response_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificate_response FOREIGN KEY (survey_response_id) REFERENCES survey_response(id) ON DELETE CASCADE
);

CREATE INDEX idx_response_answer_name_value ON response_answer(question_name, answer_value);
CREATE INDEX idx_question_survey_order ON question(survey_id, order_index);
CREATE INDEX idx_certificate_response ON certificate(survey_response_id);
CREATE INDEX idx_skill_tree_survey ON skill_tree_rule(survey_id);
CREATE INDEX idx_skill_tree_source ON skill_tree_rule(source_question_id, trigger_value);
CREATE INDEX idx_survey_response_survey_date ON survey_response(survey_id, date_responded DESC);
CREATE INDEX idx_question_option_question_order ON question_option(question_id, order_index);

-- V3__add_number_properties.sql
ALTER TABLE question ADD COLUMN min_number INTEGER;
ALTER TABLE question ADD COLUMN max_number INTEGER;

-- V4__add_question_branch_only.sql
ALTER TABLE question ADD COLUMN branch_only BOOLEAN NOT NULL DEFAULT FALSE;

-- V5__add_response_shortlist.sql
CREATE TABLE response_shortlist (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL,
    survey_response_id BIGINT NOT NULL,
    shortlisted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_shortlist_survey_response UNIQUE (survey_id, survey_response_id),
    CONSTRAINT fk_shortlist_survey FOREIGN KEY (survey_id) REFERENCES survey(id) ON DELETE CASCADE,
    CONSTRAINT fk_shortlist_response FOREIGN KEY (survey_response_id) REFERENCES survey_response(id) ON DELETE CASCADE
);

CREATE INDEX idx_shortlist_survey_date ON response_shortlist (survey_id, shortlisted_at DESC);

-- V2__seed_sample_survey.sql (optional demo data)
INSERT INTO survey (id, name, description, created_at, updated_at)
VALUES (1, 'Graduate Developer Application Survey', 'Initial candidate screening survey', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO question (id, survey_id, name, type, text, description, required, order_index, file_format, max_file_size_mb, multiple_files)
VALUES
    (1, 1, 'full_name', 'SHORT_TEXT', 'What is your full name?', '[Surname] [First Name] [Other Names]', TRUE, 1, NULL, NULL, NULL),
    (2, 1, 'email_address', 'EMAIL', 'What is your email address?', 'Use a valid email address', TRUE, 2, NULL, NULL, NULL),
    (3, 1, 'years_experience', 'SINGLE_CHOICE', 'How many years of professional software experience do you have?', 'Select the closest match', TRUE, 3, NULL, NULL, NULL),
    (4, 1, 'preferred_frontend_framework', 'SINGLE_CHOICE', 'Which frontend framework do you prefer?', 'Choose one', TRUE, 4, NULL, NULL, NULL),
    (5, 1, 'primary_backend_stack', 'MULTIPLE_CHOICE', 'Which backend stack have you used?', 'Select all that apply', TRUE, 5, NULL, NULL, NULL),
    (6, 1, 'certificates', 'FILE_UPLOAD', 'Upload any of your certificates?', 'You can upload multiple (.pdf)', TRUE, 6, '.pdf', 10, TRUE),
    (7, 1, 'system_design_question', 'LONG_TEXT', 'Describe how you would design a distributed caching system.', 'Use concrete examples where possible.', TRUE, 7, NULL, NULL, NULL),
    (8, 1, 'frontend_portfolio', 'SHORT_TEXT', 'Share a link to your frontend portfolio or GitHub profile.', 'A public link is fine.', FALSE, 8, NULL, NULL, NULL);

INSERT INTO question_option (id, question_id, value, label, order_index)
VALUES
    (1, 3, '0-1', '0 - 1 years', 1),
    (2, 3, '2-3', '2 - 3 years', 2),
    (3, 3, '3+', '3+ years', 3),
    (4, 3, '5+', '5+ years', 4),
    (5, 4, 'REACT', 'React JS', 1),
    (6, 4, 'VUE', 'Vue JS', 2),
    (7, 4, 'ANGULAR', 'Angular', 3),
    (8, 4, 'NONE', 'No preference', 4),
    (9, 5, 'JAVA', 'Java', 1),
    (10, 5, 'NODE', 'Node.js', 2),
    (11, 5, 'PYTHON', 'Python', 3),
    (12, 5, 'GO', 'Go', 4);

INSERT INTO skill_tree_rule (id, source_question_id, trigger_value, target_question_id, survey_id)
VALUES
    (1, 3, '3+', 7, 1),
    (2, 4, 'REACT', 8, 1);

UPDATE question SET branch_only = TRUE
WHERE id IN (SELECT DISTINCT target_question_id FROM skill_tree_rule);

SELECT setval(pg_get_serial_sequence('survey', 'id'), (SELECT MAX(id) FROM survey));
SELECT setval(pg_get_serial_sequence('question', 'id'), (SELECT MAX(id) FROM question));
SELECT setval(pg_get_serial_sequence('question_option', 'id'), (SELECT MAX(id) FROM question_option));
SELECT setval(pg_get_serial_sequence('skill_tree_rule', 'id'), (SELECT MAX(id) FROM skill_tree_rule));
