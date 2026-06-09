package com.skyworld.survey.service;

import com.skyworld.survey.dto.request.SkillTreeRuleRequest;
import com.skyworld.survey.dto.response.NextQuestionResponseDto;
import com.skyworld.survey.dto.response.QuestionResponseDto;
import com.skyworld.survey.dto.response.SkillTreeRuleListResponseDto;
import com.skyworld.survey.dto.response.SkillTreeRuleResponseDto;
import com.skyworld.survey.entity.Question;
import com.skyworld.survey.entity.SkillTreeRule;
import com.skyworld.survey.exception.ResourceNotFoundException;
import com.skyworld.survey.repository.QuestionRepository;
import com.skyworld.survey.repository.SkillTreeRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SkillTreeService {

    private final SkillTreeRuleRepository skillTreeRuleRepository;
    private final QuestionRepository questionRepository;
    private final QuestionService questionService;

    @Cacheable(value = "skill-tree-rules", key = "#surveyId")
    @Transactional(readOnly = true)
    public List<SkillTreeRule> getRulesForSurvey(Long surveyId) {
        return skillTreeRuleRepository.findBySurveyIdOrderByIdAsc(surveyId);
    }

    @Transactional(readOnly = true)
    public SkillTreeRuleListResponseDto getRulesWrapper(Long surveyId) {
        List<SkillTreeRuleResponseDto> dtos = skillTreeRuleRepository
            .findBySurveyIdOrderByIdAsc(surveyId)
            .stream()
            .map(this::toResponseDto)
            .toList();
        return SkillTreeRuleListResponseDto.builder().skillTreeRules(dtos).build();
    }

    @Transactional
    @CacheEvict(value = "skill-tree-rules", key = "#surveyId")
    public SkillTreeRuleResponseDto addRule(Long surveyId, SkillTreeRuleRequest request) {
        Question source = questionRepository.findBySurveyIdAndName(surveyId, request.getSourceQuestionName())
            .orElseThrow(() -> new ResourceNotFoundException("Source question not found"));
        Question target = questionRepository.findBySurveyIdAndName(surveyId, request.getTargetQuestionName())
            .orElseThrow(() -> new ResourceNotFoundException("Target question not found"));

        SkillTreeRule rule = SkillTreeRule.builder()
            .surveyId(surveyId)
            .sourceQuestion(source)
            .targetQuestion(target)
            .triggerValue(request.getTriggerValue())
            .build();
        return toResponseDto(skillTreeRuleRepository.save(rule));
    }

    @Transactional
    @CacheEvict(value = "skill-tree-rules", key = "#surveyId")
    public SkillTreeRuleResponseDto updateRule(Long surveyId, Long ruleId, SkillTreeRuleRequest request) {
        SkillTreeRule rule = skillTreeRuleRepository.findByIdAndSurveyId(ruleId, surveyId)
            .orElseThrow(() -> new ResourceNotFoundException("Rule not found"));
        Question source = questionRepository.findBySurveyIdAndName(surveyId, request.getSourceQuestionName())
            .orElseThrow(() -> new ResourceNotFoundException("Source question not found"));
        Question target = questionRepository.findBySurveyIdAndName(surveyId, request.getTargetQuestionName())
            .orElseThrow(() -> new ResourceNotFoundException("Target question not found"));

        rule.setSourceQuestion(source);
        rule.setTargetQuestion(target);
        rule.setTriggerValue(request.getTriggerValue());
        return toResponseDto(skillTreeRuleRepository.save(rule));
    }

    @Transactional
    @CacheEvict(value = "skill-tree-rules", key = "#surveyId")
    public void deleteRule(Long surveyId, Long ruleId) {
        SkillTreeRule rule = skillTreeRuleRepository.findByIdAndSurveyId(ruleId, surveyId)
            .orElseThrow(() -> new ResourceNotFoundException("Rule not found"));
        skillTreeRuleRepository.delete(rule);
    }

    @Transactional(readOnly = true)
    public NextQuestionResponseDto resolveNextQuestion(Long surveyId, List<String> answeredNames, Map<String, String> lastAnswers) {
        // Fetch questions as DTOs (no lazy loading needed)
        List<QuestionResponseDto> questions = questionService.getQuestions(surveyId);

        // Fetch rules with eager-loaded source/target questions inside this transaction
        List<SkillTreeRule> rules = skillTreeRuleRepository.findBySurveyIdOrderByIdAsc(surveyId);

        // Build map: targetQuestionName -> list of rules that unlock it
        Map<String, List<SkillTreeRule>> inboundRules = new HashMap<>();
        for (SkillTreeRule rule : rules) {
            String targetName = rule.getTargetQuestion().getName();
            inboundRules.computeIfAbsent(targetName, k -> new ArrayList<>()).add(rule);
        }

        Set<String> answeredSet = new HashSet<>(answeredNames == null ? List.of() : answeredNames);
        Map<String, String> safeLastAnswers = lastAnswers == null ? Map.of() : lastAnswers;

        List<QuestionResponseDto> visibleQuestions = new ArrayList<>();
        QuestionResponseDto nextQuestion = null;

        for (QuestionResponseDto question : questions) {
            if (isVisible(question.getName(), inboundRules, safeLastAnswers)) {
                visibleQuestions.add(question);
                if (nextQuestion == null && !answeredSet.contains(question.getName())) {
                    nextQuestion = question;
                }
            }
        }

        int answeredVisibleCount = 0;
        for (QuestionResponseDto q : visibleQuestions) {
            if (answeredSet.contains(q.getName())) {
                answeredVisibleCount++;
            }
        }

        if (nextQuestion == null) {
            return NextQuestionResponseDto.builder()
                .surveyComplete(Boolean.TRUE)
                .progress(NextQuestionResponseDto.Progress.builder()
                    .answered(answeredVisibleCount)
                    .totalVisible(visibleQuestions.size())
                    .build())
                .build();
        }

        return NextQuestionResponseDto.builder()
            .question(nextQuestion)
            .surveyComplete(Boolean.FALSE)
            .progress(NextQuestionResponseDto.Progress.builder()
                .answered(answeredVisibleCount)
                .totalVisible(visibleQuestions.size())
                .build())
            .build();
    }

    private boolean isVisible(String questionName, Map<String, List<SkillTreeRule>> inboundRules, Map<String, String> lastAnswers) {
        List<SkillTreeRule> inbound = inboundRules.get(questionName);
        if (inbound == null || inbound.isEmpty()) {
            return true;
        }
        for (SkillTreeRule rule : inbound) {
            String answer = lastAnswers.get(rule.getSourceQuestion().getName());
            if (answer != null && answer.equals(rule.getTriggerValue())) {
                return true;
            }
        }
        return false;
    }

    private SkillTreeRuleResponseDto toResponseDto(SkillTreeRule rule) {
        return SkillTreeRuleResponseDto.builder()
            .id(rule.getId())
            .sourceQuestionName(rule.getSourceQuestion().getName())
            .triggerValue(rule.getTriggerValue())
            .targetQuestionName(rule.getTargetQuestion().getName())
            .build();
    }
}
