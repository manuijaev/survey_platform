package com.skyworld.survey.controller;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.skyworld.survey.dto.request.QuestionResponseRequest;
import com.skyworld.survey.dto.response.PaginatedResponseWrapper;
import com.skyworld.survey.dto.response.QuestionResponseItemDto;
import com.skyworld.survey.dto.response.ShortlistStatusDto;
import com.skyworld.survey.service.ResponseService;
import com.skyworld.survey.service.ShortlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/surveys/{surveyId}/responses", produces = MediaType.APPLICATION_XML_VALUE)
public class ResponseController {

    private final ResponseService responseService;
    private final ShortlistService shortlistService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionResponseItemDto> submitResponse(@PathVariable Long surveyId,
                                                                  @RequestPart("response") String xmlPayload,
                                                                  @RequestPart(value = "certificates", required = false) List<MultipartFile> certificates) {
        try {
            XmlMapper xmlMapper = new XmlMapper();
            QuestionResponseRequest parsed = xmlMapper.readValue(xmlPayload, QuestionResponseRequest.class);
            return ResponseEntity.status(201).body(responseService.submitResponse(surveyId, parsed, certificates));
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid response XML");
        }
    }

    @GetMapping
    public ResponseEntity<PaginatedResponseWrapper> getResponses(@PathVariable Long surveyId,
                                                                 @RequestParam(defaultValue = "1") int page,
                                                                 @RequestParam(defaultValue = "10") int pageSize,
                                                                 @RequestParam(required = false) String email,
                                                                 @RequestParam(required = false) Boolean shortlisted) {
        return ResponseEntity.ok(responseService.getResponses(surveyId, page, pageSize, email, shortlisted));
    }

    @PutMapping("/{responseId}/shortlist")
    public ResponseEntity<ShortlistStatusDto> addToShortlist(@PathVariable Long surveyId,
                                                             @PathVariable Long responseId) {
        return ResponseEntity.ok(shortlistService.addToShortlist(surveyId, responseId));
    }

    @DeleteMapping("/{responseId}/shortlist")
    public ResponseEntity<ShortlistStatusDto> removeFromShortlist(@PathVariable Long surveyId,
                                                                  @PathVariable Long responseId) {
        return ResponseEntity.ok(shortlistService.removeFromShortlist(surveyId, responseId));
    }
}
