package com.skyworld.survey.repository;

import com.skyworld.survey.entity.SurveyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResponseRepository extends JpaRepository<SurveyResponse, Long> {

    // Fetch both collections as Sets — no MultipleBagFetchException with Sets
    @EntityGraph(attributePaths = {"answers", "certificates"})
    Page<SurveyResponse> findBySurveyIdOrderByDateRespondedDesc(Long surveyId, Pageable pageable);

    // Email filter: plain query first (no EntityGraph to avoid conflicts with JOIN),
    // then collections are loaded lazily within the @Transactional(readOnly=true) service method
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

    // Load answers+certificates for a list of response IDs — used after email-filtered page fetch
    @EntityGraph(attributePaths = {"answers", "certificates"})
    List<SurveyResponse> findByIdIn(List<Long> ids);
}
