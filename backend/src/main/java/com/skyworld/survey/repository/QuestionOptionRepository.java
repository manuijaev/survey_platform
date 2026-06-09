package com.skyworld.survey.repository;

import com.skyworld.survey.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {

    @Modifying(flushAutomatically = true)
    @Query("delete from QuestionOption o where o.question.id = :questionId")
    void deleteByQuestionId(@Param("questionId") Long questionId);
}
