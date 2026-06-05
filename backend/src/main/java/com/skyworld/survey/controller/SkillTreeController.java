package com.skyworld.survey.controller;

import com.skyworld.survey.dto.request.SkillTreeRuleRequest;
import com.skyworld.survey.dto.response.NextQuestionResponseDto;
import com.skyworld.survey.dto.response.SkillTreeRuleListResponseDto;
import com.skyworld.survey.dto.response.SkillTreeRuleResponseDto;
import com.skyworld.survey.service.SkillTreeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/surveys/{surveyId}", produces = MediaType.APPLICATION_XML_VALUE)
public class SkillTreeController {

    private final SkillTreeService skillTreeService;

    @PostMapping(value = "/rules", consumes = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<SkillTreeRuleResponseDto> addRule(@PathVariable Long surveyId,
                                                            @Valid @RequestBody SkillTreeRuleRequest request) {
        return ResponseEntity.status(201).body(skillTreeService.addRule(surveyId, request));
    }

    @GetMapping("/rules")
    public ResponseEntity<SkillTreeRuleListResponseDto> getRules(@PathVariable Long surveyId) {
        return ResponseEntity.ok(skillTreeService.getRulesWrapper(surveyId));
    }

    @DeleteMapping("/rules/{ruleId}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long surveyId, @PathVariable Long ruleId) {
        skillTreeService.deleteRule(surveyId, ruleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/next-question")
    public ResponseEntity<NextQuestionResponseDto> nextQuestion(@PathVariable Long surveyId,
                                                                @RequestParam(required = false) String answeredQuestions,
                                                                @RequestParam(required = false) String lastAnswers) {
        List<String> answered = parseCommaSeparatedList(answeredQuestions);
        Map<String, String> answers = parseAnswerMap(lastAnswers);
        return ResponseEntity.ok(skillTreeService.resolveNextQuestion(surveyId, answered, answers));
    }

    private List<String> parseCommaSeparatedList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(item -> !item.isEmpty())
            .toList();
    }

    private Map<String, String> parseAnswerMap(String value) {
        if (value == null || value.isBlank()) {
            return Map.of();
        }
        Map<String, String> parsed = new LinkedHashMap<>();
        for (String pair : value.split(",")) {
            String trimmed = pair.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            int separator = trimmed.indexOf(':');
            if (separator <= 0 || separator == trimmed.length() - 1) {
                throw new IllegalArgumentException("Invalid lastAnswers entry: " + pair);
            }
            parsed.put(trimmed.substring(0, separator).trim(), trimmed.substring(separator + 1).trim());
        }
        return parsed;
    }
}
