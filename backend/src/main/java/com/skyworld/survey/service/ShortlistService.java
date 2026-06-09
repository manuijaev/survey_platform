package com.skyworld.survey.service;

import com.skyworld.survey.dto.response.ShortlistStatusDto;
import com.skyworld.survey.entity.ResponseShortlist;
import com.skyworld.survey.entity.Survey;
import com.skyworld.survey.entity.SurveyResponse;
import com.skyworld.survey.exception.ResourceNotFoundException;
import com.skyworld.survey.repository.ResponseRepository;
import com.skyworld.survey.repository.ShortlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShortlistService {

    private final SurveyService surveyService;
    private final ResponseRepository responseRepository;
    private final ShortlistRepository shortlistRepository;

    @Transactional(readOnly = true)
    public Set<Long> getShortlistedResponseIds(Long surveyId) {
        surveyService.findSurvey(surveyId);
        return shortlistRepository.findShortlistedResponseIdsBySurveyId(surveyId);
    }

    @Transactional(readOnly = true)
    public long countShortlisted(Long surveyId) {
        surveyService.findSurvey(surveyId);
        return shortlistRepository.countBySurveyId(surveyId);
    }

    @Transactional
    public ShortlistStatusDto addToShortlist(Long surveyId, Long responseId) {
        Survey survey = surveyService.findSurvey(surveyId);
        SurveyResponse response = findResponseForSurvey(surveyId, responseId);

        if (!shortlistRepository.existsBySurveyIdAndSurveyResponseId(surveyId, responseId)) {
            shortlistRepository.save(ResponseShortlist.builder()
                .survey(survey)
                .surveyResponse(response)
                .build());
        }

        return toStatusDto(responseId, true, shortlistRepository.countBySurveyId(surveyId));
    }

    @Transactional
    public ShortlistStatusDto removeFromShortlist(Long surveyId, Long responseId) {
        surveyService.findSurvey(surveyId);
        findResponseForSurvey(surveyId, responseId);
        shortlistRepository.deleteBySurveyIdAndSurveyResponseId(surveyId, responseId);
        return toStatusDto(responseId, false, shortlistRepository.countBySurveyId(surveyId));
    }

    private SurveyResponse findResponseForSurvey(Long surveyId, Long responseId) {
        SurveyResponse response = responseRepository.findById(responseId)
            .orElseThrow(() -> new ResourceNotFoundException("Response not found: " + responseId));

        if (response.getSurvey() == null || !surveyId.equals(response.getSurvey().getId())) {
            throw new ResourceNotFoundException("Response not found for survey: " + responseId);
        }

        return response;
    }

    private ShortlistStatusDto toStatusDto(Long responseId, boolean shortlisted, long vaultCount) {
        return ShortlistStatusDto.builder()
            .responseId(responseId)
            .shortlisted(shortlisted ? "yes" : "no")
            .vaultCount(vaultCount)
            .build();
    }
}
