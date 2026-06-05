package com.skyworld.survey.repository;

import com.skyworld.survey.entity.SkillTreeRule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillTreeRuleRepository extends JpaRepository<SkillTreeRule, Long> {

    @EntityGraph(attributePaths = {"sourceQuestion", "targetQuestion"})
    List<SkillTreeRule> findBySurveyIdOrderByIdAsc(Long surveyId);

    List<SkillTreeRule> findBySurveyIdAndTargetQuestionId(Long surveyId, Long targetQuestionId);

    java.util.Optional<SkillTreeRule> findByIdAndSurveyId(Long id, Long surveyId);
}
