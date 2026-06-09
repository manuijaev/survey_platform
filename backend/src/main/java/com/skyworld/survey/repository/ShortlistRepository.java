package com.skyworld.survey.repository;

import com.skyworld.survey.entity.ResponseShortlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface ShortlistRepository extends JpaRepository<ResponseShortlist, Long> {

    boolean existsBySurveyIdAndSurveyResponseId(Long surveyId, Long surveyResponseId);

    void deleteBySurveyIdAndSurveyResponseId(Long surveyId, Long surveyResponseId);

    long countBySurveyId(Long surveyId);

    @Query("select rs.surveyResponse.id from ResponseShortlist rs where rs.survey.id = :surveyId")
    Set<Long> findShortlistedResponseIdsBySurveyId(@Param("surveyId") Long surveyId);

    @Query(
        value = """
            select rs.surveyResponse
            from ResponseShortlist rs
            where rs.survey.id = :surveyId
            order by rs.shortlistedAt desc
            """,
        countQuery = """
            select count(rs)
            from ResponseShortlist rs
            where rs.survey.id = :surveyId
            """
    )
    Page<com.skyworld.survey.entity.SurveyResponse> findShortlistedResponsesBySurveyId(
        @Param("surveyId") Long surveyId,
        Pageable pageable
    );

    @Query(
        value = """
            select rs.surveyResponse
            from ResponseShortlist rs
            join rs.surveyResponse sr
            join sr.answers a
            where rs.survey.id = :surveyId
              and a.questionName = 'email_address'
              and lower(a.answerValue) like lower(concat(:email, '%'))
            order by rs.shortlistedAt desc
            """,
        countQuery = """
            select count(distinct rs)
            from ResponseShortlist rs
            join rs.surveyResponse sr
            join sr.answers a
            where rs.survey.id = :surveyId
              and a.questionName = 'email_address'
              and lower(a.answerValue) like lower(concat(:email, '%'))
            """
    )
    Page<com.skyworld.survey.entity.SurveyResponse> findShortlistedResponsesBySurveyIdAndEmailPrefix(
        @Param("surveyId") Long surveyId,
        @Param("email") String email,
        Pageable pageable
    );
}
