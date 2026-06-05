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

SELECT setval(pg_get_serial_sequence('survey', 'id'), (SELECT MAX(id) FROM survey));
SELECT setval(pg_get_serial_sequence('question', 'id'), (SELECT MAX(id) FROM question));
SELECT setval(pg_get_serial_sequence('question_option', 'id'), (SELECT MAX(id) FROM question_option));
SELECT setval(pg_get_serial_sequence('skill_tree_rule', 'id'), (SELECT MAX(id) FROM skill_tree_rule));
