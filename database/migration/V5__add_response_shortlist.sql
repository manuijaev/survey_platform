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
