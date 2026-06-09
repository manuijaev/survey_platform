package com.skyworld.survey.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(
    name = "response_shortlist",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_shortlist_survey_response",
        columnNames = {"survey_id", "survey_response_id"}
    ),
    indexes = @Index(name = "idx_shortlist_survey_date", columnList = "survey_id, shortlisted_at")
)
public class ResponseShortlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_id", nullable = false)
    @ToString.Exclude
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_response_id", nullable = false)
    @ToString.Exclude
    private SurveyResponse surveyResponse;

    @CreationTimestamp
    @Column(name = "shortlisted_at", nullable = false, updatable = false)
    private LocalDateTime shortlistedAt;
}
