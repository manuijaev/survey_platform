package com.skyworld.survey.controller;

import com.skyworld.survey.dto.request.QuestionRequest;
import com.skyworld.survey.dto.response.QuestionResponseDto;
import com.skyworld.survey.dto.response.QuestionsListResponseDto;
import com.skyworld.survey.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/surveys/{surveyId}/questions", produces = MediaType.APPLICATION_XML_VALUE)
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping(consumes = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<QuestionResponseDto> addQuestion(@PathVariable Long surveyId,
                                                           @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.status(201).body(questionService.addQuestion(surveyId, request));
    }

    @GetMapping
    public ResponseEntity<QuestionsListResponseDto> getQuestions(@PathVariable Long surveyId) {
        return ResponseEntity.ok(questionService.getQuestionsWrapper(surveyId));
    }

    @PutMapping(value = "/{questionId}", consumes = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<QuestionResponseDto> updateQuestion(@PathVariable Long surveyId,
                                                              @PathVariable Long questionId,
                                                              @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(surveyId, questionId, request));
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long surveyId, @PathVariable Long questionId) {
        questionService.deleteQuestion(surveyId, questionId);
        return ResponseEntity.noContent().build();
    }
}
