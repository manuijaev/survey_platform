package com.skyworld.survey.repository;

import com.skyworld.survey.entity.Survey;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SurveyRepository extends JpaRepository<Survey, Long> {

    @EntityGraph(attributePaths = {"questions", "questions.options"})
    Optional<Survey> findWithQuestionsById(Long id);

    @Query("SELECT s, COUNT(r) FROM Survey s LEFT JOIN s.responses r GROUP BY s ORDER BY s.id ASC")
    List<Object[]> findAllWithResponseCountOrderByIdAsc();

    List<Survey> findAllByOrderByIdAsc();
}
