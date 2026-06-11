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
@Table(name = "response_answer",
       indexes = {
           @Index(name = "idx_response_answer_name_value", columnList = "question_name,answer_value")
       })
public class ResponseAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_response_id", nullable = false)
    @ToString.Exclude
    private SurveyResponse surveyResponse;

    // Include questionName in equals/hashCode so multiple unsaved answers (id=null) are not
    // collapsed into one entry when stored in the parent Set<ResponseAnswer>.
    @EqualsAndHashCode.Include
    @Column(name = "question_name", nullable = false)
    private String questionName;

    @Column(name = "answer_value", columnDefinition = "TEXT")
    private String answerValue;
}
