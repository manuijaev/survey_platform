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

-- Hot query: filter responses by email answer
CREATE INDEX idx_response_answer_name_value ON response_answer(question_name, answer_value);

-- Hot query: ordered questions per survey
CREATE INDEX idx_question_survey_order ON question(survey_id, order_index);

-- Hot query: certificates per response
CREATE INDEX idx_certificate_response ON certificate(survey_response_id);

-- Hot query: branching rules per survey
CREATE INDEX idx_skill_tree_survey ON skill_tree_rule(survey_id);
CREATE INDEX idx_skill_tree_source ON skill_tree_rule(source_question_id, trigger_value);

CREATE INDEX idx_survey_response_survey_date ON survey_response(survey_id, date_responded DESC);
CREATE INDEX idx_question_option_question_order ON question_option(question_id, order_index);
