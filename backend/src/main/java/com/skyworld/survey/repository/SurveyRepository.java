package com.skyworld.survey.repository;

import com.skyworld.survey.entity.Survey;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SurveyRepository extends JpaRepository<Survey, Long> {

    @EntityGraph(attributePaths = {"questions", "questions.options"})
    Optional<Survey> findWithQuestionsById(Long id);

    List<Survey> findAllByOrderByIdAsc();
}
