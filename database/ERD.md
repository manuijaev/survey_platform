# Survey Platform ERD

DBML compatible schema for dbdiagram.io.

```dbml
Table survey {
  id bigint [pk, increment]
  name varchar [not null]
  description text
  created_at timestamp [not null]
  updated_at timestamp [not null]

  Note: 'Top-level survey definition.'
}

Table question {
  id bigint [pk, increment]
  survey_id bigint [not null]
  name varchar [not null]
  type varchar [not null]
  text text [not null]
  description text
  required boolean [not null]
  order_index int
  file_format varchar
  max_file_size_mb int
  multiple_files boolean

  Note: 'Survey questions, including branching and file upload metadata.'
}

Table question_option {
  id bigint [pk, increment]
  question_id bigint [not null]
  value varchar [not null]
  label varchar [not null]
  order_index int

  Note: 'Choice values for single-select and multi-select questions.'
}

Table skill_tree_rule {
  id bigint [pk, increment]
  source_question_id bigint [not null]
  trigger_value varchar [not null]
  target_question_id bigint [not null]
  survey_id bigint [not null]

  Note: 'Branching rule that unlocks a target question when a source answer matches.'
}

Table survey_response {
  id bigint [pk, increment]
  survey_id bigint [not null]
  date_responded timestamp [not null]

  Note: 'One completed or in-progress survey submission.'
}

Table response_answer {
  id bigint [pk, increment]
  survey_response_id bigint [not null]
  question_name varchar [not null]
  answer_value text

  Note: 'Answer payload stored as a question-name/value pair.'
}

Table certificate {
  id bigint [pk, increment]
  survey_response_id bigint [not null]
  file_name varchar [not null]
  file_path text [not null]
  uploaded_at timestamp [not null]

  Note: 'Uploaded PDF certificate metadata.'
}

Ref: question.survey_id > survey.id [delete: cascade]
Ref: question_option.question_id > question.id [delete: cascade]
Ref: skill_tree_rule.source_question_id > question.id [delete: cascade]
Ref: skill_tree_rule.target_question_id > question.id [delete: cascade]
Ref: skill_tree_rule.survey_id > survey.id [delete: cascade]
Ref: survey_response.survey_id > survey.id [delete: cascade]
Ref: response_answer.survey_response_id > survey_response.id [delete: cascade]
Ref: certificate.survey_response_id > survey_response.id [delete: cascade]
```

