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
import com.skyworld.survey.repository.QuestionOptionRepository;
import com.skyworld.survey.repository.QuestionRepository;
import com.skyworld.survey.repository.SurveyRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final SurveyRepository surveyRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Cacheable(value = "survey-questions", key = "#surveyId")
    @Transactional(readOnly = true)
    public List<QuestionResponseDto> getQuestions(Long surveyId) {
        // Use questionRepository directly — avoids MultipleBagFetchException that occurs
        // when EntityGraph tries to join-fetch both Survey.questions and Question.options simultaneously.
        // findBySurveyIdOrderByOrderIndexAsc already has @EntityGraph(attributePaths = {"options"}).
        if (!surveyRepository.existsById(surveyId)) {
            throw new ResourceNotFoundException("Survey not found");
        }
        return questionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId)
            .stream()
            .map(this::toResponseDto)
            .toList();
    }

    public QuestionsListResponseDto getQuestionsWrapper(Long surveyId) {
        return getQuestionsWrapper(surveyId, null);
    }

    public QuestionsListResponseDto getQuestionsWrapper(Long surveyId, String type) {
        return QuestionsListResponseDto.builder().questions(getQuestions(surveyId, type)).build();
    }

    @Transactional(readOnly = true)
    public List<QuestionResponseDto> getQuestions(Long surveyId, String type) {
        if (!surveyRepository.existsById(surveyId)) {
            throw new ResourceNotFoundException("Survey not found");
        }
        return questionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId)
            .stream()
            .filter(question -> matchesQuestionType(question, type))
            .map(this::toResponseDto)
            .toList();
    }

    private boolean matchesQuestionType(Question question, String type) {
        if (type == null || type.isBlank()) {
            return true;
        }
        boolean branchOnly = Boolean.TRUE.equals(question.getBranchOnly());
        return switch (type.trim().toLowerCase()) {
            case "branch" -> branchOnly;
            case "survey" -> !branchOnly;
            default -> true;
        };
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
        questionRepository.save(question);
        Question refreshed = questionRepository.findBySurveyIdAndId(surveyId, questionId)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        return toResponseDto(refreshed);
    }

    @Transactional
    @CacheEvict(value = {"survey-questions", "skill-tree-rules"}, key = "#surveyId")
    public QuestionResponseDto setBranchOnly(Long surveyId, Long questionId, boolean branchOnly) {
        Question question = questionRepository.findBySurveyIdAndId(surveyId, questionId)
            .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        question.setBranchOnly(branchOnly);
        return toResponseDto(questionRepository.save(question));
    }

    @Transactional
    @CacheEvict(value = {"survey-questions", "skill-tree-rules"}, key = "#surveyId")
    public List<QuestionResponseDto> reorderQuestions(Long surveyId, List<String> questionIds) {
        if (!surveyRepository.existsById(surveyId)) {
            throw new ResourceNotFoundException("Survey not found");
        }
        if (questionIds == null || questionIds.isEmpty()) {
            throw new IllegalArgumentException("Question order must include at least one question id");
        }

        List<Question> existing = questionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId);
        if (questionIds.size() != existing.size()) {
            throw new IllegalArgumentException("Question order must include every question in the survey");
        }

        Map<Long, Question> byId = new HashMap<>();
        for (Question question : existing) {
            byId.put(question.getId(), question);
        }

        for (int index = 0; index < questionIds.size(); index++) {
            String rawId = questionIds.get(index);
            if (rawId == null || rawId.isBlank()) {
                throw new IllegalArgumentException("Question id cannot be blank");
            }
            long questionId;
            try {
                questionId = Long.parseLong(rawId.trim());
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("Invalid question id: " + rawId);
            }
            Question question = byId.get(questionId);
            if (question == null) {
                throw new IllegalArgumentException("Question not found for survey: " + questionId);
            }
            question.setOrderIndex(index);
        }

        questionRepository.saveAll(existing);
        return getQuestions(surveyId);
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
            .minNumber(request.getMinNumber())
            .maxNumber(request.getMaxNumber())
            .branchOnly(Boolean.TRUE.equals(request.getBranchOnly()))
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
        question.setMinNumber(request.getMinNumber());
        question.setMaxNumber(request.getMaxNumber());
        if (request.getBranchOnly() != null) {
            question.setBranchOnly(Boolean.TRUE.equals(request.getBranchOnly()));
        }
        if (request.getOptions() != null) {
            replaceOptions(question, request.getOptions());
        }
    }

    private void replaceOptions(Question question, List<QuestionOptionRequest> optionRequests) {
        if (question.getId() != null) {
            questionOptionRepository.deleteByQuestionId(question.getId());
            question.getOptions().clear();
            entityManager.flush();
        } else {
            question.getOptions().clear();
        }
        applyOptions(question, optionRequests);
    }

    private void applyOptions(Question question, List<QuestionOptionRequest> optionRequests) {
        if (question.getType() != null && question.getType().isChoice() && (optionRequests == null || optionRequests.isEmpty())) {
            throw new IllegalArgumentException("Choice questions require at least one option");
        }
        // SYSTEM_DESIGN sub-parts are optional — zero sub-parts is valid (open-ended design question)
        if (optionRequests == null) {
            return;
        }
        Set<String> seenValues = new HashSet<>();
        for (QuestionOptionRequest optionRequest : optionRequests) {
            String value = optionRequest.getValue() == null ? "" : optionRequest.getValue().trim();
            if (value.isEmpty() || !seenValues.add(value)) {
                continue;
            }
            QuestionOption option = QuestionOption.builder()
                .question(question)
                .value(value)
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
            .orderIndex(question.getOrderIndex())
            .branchOnly(Boolean.TRUE.equals(question.getBranchOnly()));

        if (question.getType() != null && (question.getType().isChoice() || question.getType().isSystemDesign())) {
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

        if (question.getType() == QuestionType.NUMBER) {
            builder.minNumber(question.getMinNumber())
                   .maxNumber(question.getMaxNumber());
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
            case NUMBER -> "number";
            case SYSTEM_DESIGN -> "system_design";
        };
    }

    private String normalizeDescription(String description) {
        return description == null ? "" : description;
    }
}
