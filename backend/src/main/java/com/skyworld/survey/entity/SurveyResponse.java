package com.skyworld.survey.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "survey_response")
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_id", nullable = false)
    @ToString.Exclude
    private Survey survey;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateResponded;

    // Use Set instead of List — Hibernate can join-fetch multiple Sets simultaneously
    // (List/bag causes MultipleBagFetchException when two collections are fetched together)
    @ToString.Exclude
    @Builder.Default
    @OrderBy("id ASC")
    @OneToMany(mappedBy = "surveyResponse", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ResponseAnswer> answers = new LinkedHashSet<>();

    @ToString.Exclude
    @Builder.Default
    @OrderBy("id ASC")
    @OneToMany(mappedBy = "surveyResponse", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Certificate> certificates = new LinkedHashSet<>();
}
