package com.skyworld.survey.repository;

import com.skyworld.survey.entity.ResponseAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResponseAnswerRepository extends JpaRepository<ResponseAnswer, Long> {

    List<ResponseAnswer> findBySurveyResponseId(Long surveyResponseId);
}
