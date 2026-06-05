package com.skyworld.survey.repository;

import com.skyworld.survey.entity.SurveyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResponseRepository extends JpaRepository<SurveyResponse, Long> {

    @EntityGraph(attributePaths = {"answers", "certificates"})
    Page<SurveyResponse> findBySurveyIdOrderByDateRespondedDesc(Long surveyId, Pageable pageable);

    @EntityGraph(attributePaths = {"answers", "certificates"})
    @Query(
        value = """
            select distinct sr
            from SurveyResponse sr
            join sr.answers a
            where sr.survey.id = :surveyId
              and a.questionName = 'email_address'
              and lower(a.answerValue) like lower(concat(:email, '%'))
            order by sr.dateResponded desc
            """,
        countQuery = """
            select count(distinct sr)
            from SurveyResponse sr
            join sr.answers a
            where sr.survey.id = :surveyId
              and a.questionName = 'email_address'
              and lower(a.answerValue) like lower(concat(:email, '%'))
            """
    )
    Page<SurveyResponse> findBySurveyIdAndEmailPrefix(@Param("surveyId") Long surveyId,
                                                      @Param("email") String email,
                                                      Pageable pageable);
}
