package com.skyworld.survey.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "skill_tree_rule",
       indexes = {
           @Index(name = "idx_skill_tree_survey", columnList = "survey_id"),
           @Index(name = "idx_skill_tree_source", columnList = "source_question_id,trigger_value")
       })
public class SkillTreeRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_question_id", nullable = false)
    @ToString.Exclude
    private Question sourceQuestion;

    @Column(nullable = false)
    private String triggerValue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_question_id", nullable = false)
    @ToString.Exclude
    private Question targetQuestion;

    @Column(name = "survey_id", nullable = false)
    private Long surveyId;
}
