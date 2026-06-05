package com.skyworld.survey.controller;

import com.skyworld.survey.dto.request.SurveyRequest;
import com.skyworld.survey.dto.response.SurveyListResponseDto;
import com.skyworld.survey.dto.response.SurveyResponseDto;
import com.skyworld.survey.service.SurveyService;
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
@RequestMapping(value = "/api/surveys", produces = MediaType.APPLICATION_XML_VALUE)
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping(consumes = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<SurveyResponseDto> createSurvey(@Valid @RequestBody SurveyRequest request) {
        return ResponseEntity.status(201).body(surveyService.createSurvey(request));
    }

    @GetMapping
    public ResponseEntity<SurveyListResponseDto> getSurveys() {
        return ResponseEntity.ok(surveyService.getAllSurveys());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SurveyResponseDto> getSurvey(@PathVariable Long id) {
        return ResponseEntity.ok(surveyService.getSurvey(id));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<SurveyResponseDto> updateSurvey(@PathVariable Long id, @Valid @RequestBody SurveyRequest request) {
        return ResponseEntity.ok(surveyService.updateSurvey(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSurvey(@PathVariable Long id) {
        surveyService.deleteSurvey(id);
        return ResponseEntity.noContent().build();
    }
}
