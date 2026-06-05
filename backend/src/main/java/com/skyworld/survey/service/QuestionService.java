package com.skyworld.survey.service;

import com.skyworld.survey.dto.request.QuestionOptionRequest;
import com.skyworld.survey.dto.request.QuestionRequest;
import com.skyworld.survey.dto.response.QuestionFilePropertiesResponseDto;
import com.skyworld.survey.dto.response.QuestionOptionResponseDto;
import com.skyworld.survey.dto.response.QuestionOptionsResponseDto;
import com.skyworld.survey.dto.response.QuestionResponseDto;
import com.skyworld.survey.dto.response.QuestionsListResponseDto;
import com.skyworld.survey.entity.Question;
import com.skyworld.survey.entity.QuestionOption;
import com.skyworld.survey.entity.QuestionType;
import com.skyworld.survey.entity.Survey;
import com.skyworld.survey.exception.ResourceNotFoundException;
import com.skyworld.survey.repository.QuestionRepository;
import com.skyworld.survey.repository.SurveyRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final SurveyRepository surveyRepository;
    private final QuestionRepository questionRepository;

    @Cacheable(value = "survey-questions", key = "#surveyId")
    public List<QuestionResponseDto> getQuestions(Long surveyId) {
        Survey survey = surveyRepository.findWithQuestionsById(surveyId)
            .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));
        return survey.getQuestions().stream()
            .sorted(Comparator.comparing(Question::getOrderIndex, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(Question::getId, Comparator.nullsLast(Long::compareTo)))
            .map(this::toResponseDto)
            .toList();
    }

    public QuestionsListResponseDto getQuestionsWrapper(Long surveyId) {
        return QuestionsListResponseDto.builder().questions(getQuestions(surveyId)).build();
    }

    @Transactional
    @CacheEvict(value = {"survey-questions", "skill-tree-rules"}, key = "#surveyId")
    public QuestionResponseDto addQuestion(Long surveyId, QuestionRequest request) {
        Survey survey = surveyRepository.findById(surveyId)
            .orElseThrow(() -> new ResourceNotFoundException("Survey not found"));
        validateUniqueQuestionName(surveyId, request.getName(), null);
        Question question = buildQuestionEntity(survey, request);
        return toResponseDto(questionRepository.save(question));
    }

    @Transactional
    @CacheEvict(value = {"survey-questions", "skill-tree-rules"}, key = "#surveyId")
    public QuestionResponseDto updateQuestion(Long surveyId, Long questionId, QuestionRequest request) {
        Question question = questionRepository.findBySurveyIdAndId(surveyId, questionId)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        validateUniqueQuestionName(surveyId, request.getName(), questionId);
        applyRequest(question, request);
        return toResponseDto(questionRepository.save(question));
    }

    @Transactional
    @CacheEvict(value = {"survey-questions", "skill-tree-rules"}, key = "#surveyId")
    public void deleteQuestion(Long surveyId, Long questionId) {
        Question question = questionRepository.findBySurveyIdAndId(surveyId, questionId)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        questionRepository.delete(question);
    }

    public Question findBySurveyAndName(Long surveyId, String name) {
        return questionRepository.findBySurveyIdAndName(surveyId, name)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
    }

    private Question buildQuestionEntity(Survey survey, QuestionRequest request) {
        Question question = Question.builder()
            .survey(survey)
            .name(request.getName())
            .type(request.getType())
            .text(request.getText())
            .description(normalizeDescription(request.getDescription()))
            .required(Boolean.TRUE.equals(request.getRequired()))
            .orderIndex(request.getOrderIndex())
            .fileFormat(request.getFileFormat())
            .maxFileSizeMb(request.getMaxFileSizeMb())
            .multipleFiles(request.getMultipleFiles())
            .build();
        applyOptions(question, request.getOptions());
        return question;
    }

    private void applyRequest(Question question, QuestionRequest request) {
        question.setName(request.getName());
        question.setType(request.getType());
        question.setText(request.getText());
        question.setDescription(normalizeDescription(request.getDescription()));
        question.setRequired(Boolean.TRUE.equals(request.getRequired()));
        question.setOrderIndex(request.getOrderIndex());
        question.setFileFormat(request.getFileFormat());
        question.setMaxFileSizeMb(request.getMaxFileSizeMb());
        question.setMultipleFiles(request.getMultipleFiles());
        question.getOptions().clear();
        applyOptions(question, request.getOptions());
    }

    private void applyOptions(Question question, List<QuestionOptionRequest> optionRequests) {
        if (question.getType() != null && question.getType().isChoice() && (optionRequests == null || optionRequests.isEmpty())) {
            throw new IllegalArgumentException("Choice questions require at least one option");
        }
        if (optionRequests == null) {
            return;
        }
        for (QuestionOptionRequest optionRequest : optionRequests) {
            QuestionOption option = QuestionOption.builder()
                .question(question)
                .value(optionRequest.getValue())
                .label(optionRequest.getLabel())
                .orderIndex(optionRequest.getOrderIndex())
                .build();
            question.getOptions().add(option);
        }
    }

    private void validateUniqueQuestionName(Long surveyId, String name, Long currentQuestionId) {
        questionRepository.findBySurveyIdAndName(surveyId, name).ifPresent(existing -> {
            if (currentQuestionId == null || !existing.getId().equals(currentQuestionId)) {
                throw new IllegalArgumentException("Question name must be unique within a survey");
            }
        });
    }

    private QuestionResponseDto toResponseDto(Question question) {
        QuestionResponseDto.QuestionResponseDtoBuilder builder = QuestionResponseDto.builder()
            .id(question.getId())
            .name(question.getName())
            .type(mapType(question.getType()))
            .required(question.getRequired())
            .text(question.getText())
            .description(question.getDescription() == null ? "" : question.getDescription())
            .orderIndex(question.getOrderIndex());

        if (question.getType() != null && question.getType().isChoice()) {
            builder.options(QuestionOptionsResponseDto.builder()
                .multiple(question.getType().isMultipleChoice() ? "yes" : "no")
                .options(question.getOptions().stream()
                    .sorted(Comparator.comparing(QuestionOption::getOrderIndex, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(QuestionOption::getId, Comparator.nullsLast(Long::compareTo)))
                    .map(option -> QuestionOptionResponseDto.builder()
                        .value(option.getValue())
                        .label(option.getLabel())
                        .build())
                    .toList())
                .build());
        }

        if (question.getType() == QuestionType.FILE_UPLOAD) {
            builder.fileProperties(QuestionFilePropertiesResponseDto.builder()
                .format(question.getFileFormat())
                .maxFileSize(question.getMaxFileSizeMb())
                .maxFileSizeUnit(question.getMaxFileSizeMb() == null ? null : "mb")
                .multiple(question.getMultipleFiles())
                .build());
        }

        return builder.build();
    }

    private String mapType(QuestionType type) {
        if (type == null) {
            return null;
        }
        return switch (type) {
            case SHORT_TEXT -> "short_text";
            case LONG_TEXT -> "long_text";
            case EMAIL -> "email";
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> "choice";
            case FILE_UPLOAD -> "file";
        };
    }

    private String normalizeDescription(String description) {
        return description == null ? "" : description;
    }
}
