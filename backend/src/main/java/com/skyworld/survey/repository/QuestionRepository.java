package com.skyworld.survey.repository;

import com.skyworld.survey.entity.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @EntityGraph(attributePaths = {"options"})
    List<Question> findBySurveyIdOrderByOrderIndexAsc(Long surveyId);

    Optional<Question> findBySurveyIdAndId(Long surveyId, Long id);

    Optional<Question> findBySurveyIdAndName(Long surveyId, String name);
}
