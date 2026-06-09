package com.skyworld.survey.service;

import com.skyworld.survey.dto.request.SurveyRequest;
import com.skyworld.survey.dto.response.SurveyListResponseDto;
import com.skyworld.survey.dto.response.SurveyResponseDto;
import com.skyworld.survey.dto.response.SurveySummaryResponseDto;
import com.skyworld.survey.entity.Survey;
import com.skyworld.survey.exception.ResourceNotFoundException;
import com.skyworld.survey.repository.SurveyRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SurveyRepository surveyRepository;

    @Transactional
    public SurveyResponseDto createSurvey(SurveyRequest request) {
        Survey survey = Survey.builder()
            .name(request.getName())
            .description(request.getDescription())
            .build();
        return mapToDto(surveyRepository.save(survey));
    }

    public SurveyListResponseDto getAllSurveys() {
        List<SurveySummaryResponseDto> surveys = surveyRepository.findAllWithResponseCountOrderByIdAsc().stream()
            .map(row -> {
                Survey survey = (Survey) row[0];
                Long count = (Long) row[1];
                return mapToSummaryDto(survey, count);
            })
            .toList();
        return SurveyListResponseDto.builder().surveys(surveys).build();
    }

    public SurveyResponseDto getSurvey(Long id) {
        return mapToDto(findSurvey(id));
    }

    @Transactional
    public SurveyResponseDto updateSurvey(Long id, SurveyRequest request) {
        Survey survey = findSurvey(id);
        survey.setName(request.getName());
        survey.setDescription(request.getDescription());
        return mapToDto(surveyRepository.save(survey));
    }

    @Transactional
    @CacheEvict(value = {"survey-questions", "skill-tree-rules"}, key = "#id")
    public void deleteSurvey(Long id) {
        if (!surveyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Survey not found");
        }
        surveyRepository.deleteById(id);
    }

    public Survey findSurvey(Long id) {
        return surveyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));
    }

    private SurveyResponseDto mapToDto(Survey survey) {
        return SurveyResponseDto.builder()
            .id(survey.getId())
            .name(survey.getName())
            .description(survey.getDescription())
            .createdAt(survey.getCreatedAt() == null ? null : DATE_TIME_FORMATTER.format(survey.getCreatedAt()))
            .updatedAt(survey.getUpdatedAt() == null ? null : DATE_TIME_FORMATTER.format(survey.getUpdatedAt()))
            .build();
    }

    private SurveySummaryResponseDto mapToSummaryDto(Survey survey, Long responseCount) {
        return SurveySummaryResponseDto.builder()
            .id(survey.getId())
            .name(survey.getName())
            .description(survey.getDescription())
            .responseCount(responseCount != null ? responseCount : 0L)
            .updatedAt(survey.getUpdatedAt() == null ? null : DATE_TIME_FORMATTER.format(survey.getUpdatedAt()))
            .build();
    }
}
