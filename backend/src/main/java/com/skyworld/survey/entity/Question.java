package com.skyworld.survey.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "question",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_question_survey_name", columnNames = {"survey_id", "name"})
       })
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "survey_id", nullable = false)
    @ToString.Exclude
    private Survey survey;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private QuestionType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean required;

    private Integer orderIndex;

    private String fileFormat;

    private Integer maxFileSizeMb;

    private Boolean multipleFiles;

    private Integer minNumber;

    private Integer maxNumber;

    @Column(name = "branch_only", nullable = false)
    @Builder.Default
    private Boolean branchOnly = false;

    @ToString.Exclude
    @Builder.Default
    @OrderBy("orderIndex ASC, id ASC")
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionOption> options = new ArrayList<>();

    @ToString.Exclude
    @Builder.Default
    @OneToMany(mappedBy = "sourceQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SkillTreeRule> sourceRules = new ArrayList<>();

    @ToString.Exclude
    @Builder.Default
    @OneToMany(mappedBy = "targetQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SkillTreeRule> targetRules = new ArrayList<>();
}
