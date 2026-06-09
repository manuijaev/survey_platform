ALTER TABLE question ADD COLUMN branch_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Questions that are branch targets in the sample survey
UPDATE question SET branch_only = TRUE
WHERE id IN (SELECT DISTINCT target_question_id FROM skill_tree_rule);
