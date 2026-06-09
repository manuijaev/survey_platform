package com.skyworld.survey.service;

import com.skyworld.survey.dto.request.QuestionResponseRequest;
import com.skyworld.survey.dto.request.ResponseAnswerRequest;
import com.skyworld.survey.dto.response.CertificateResponseDto;
import com.skyworld.survey.dto.response.PaginatedResponseWrapper;
import com.skyworld.survey.dto.response.QuestionResponseDto;
import com.skyworld.survey.dto.response.QuestionResponseItemDto;
import com.skyworld.survey.entity.ResponseAnswer;
import com.skyworld.survey.entity.Survey;
import com.skyworld.survey.entity.SurveyResponse;
import com.skyworld.survey.exception.InvalidFileException;
import com.skyworld.survey.exception.ResourceNotFoundException;
import com.skyworld.survey.repository.ResponseRepository;
import com.skyworld.survey.repository.ShortlistRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ResponseService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SurveyService surveyService;
    private final QuestionService questionService;
    private final ResponseRepository responseRepository;
    private final ShortlistRepository shortlistRepository;
    private final CertificateService certificateService;

    @Transactional
    public QuestionResponseItemDto submitResponse(Long surveyId, QuestionResponseRequest request, List<MultipartFile> certificates) {
        Survey survey = surveyService.findSurvey(surveyId);
        List<QuestionResponseDto> questionDtos = questionService.getQuestions(surveyId);
        Map<String, QuestionResponseDto> questionLookup = new LinkedHashMap<>();
        for (QuestionResponseDto dto : questionDtos) {
            questionLookup.put(dto.getName(), dto);
        }

        LinkedHashMap<String, String> answersMap = new LinkedHashMap<>();
        if (request != null && request.getAnswers() != null) {
            for (ResponseAnswerRequest answerRequest : request.getAnswers()) {
                String questionName = answerRequest.getQuestionName();
                if (!questionLookup.containsKey(questionName)) {
                    throw new IllegalArgumentException("Unknown question name: " + questionName);
                }
                if (answersMap.containsKey(questionName)) {
                    throw new IllegalArgumentException("Duplicate answer for question: " + questionName);
                }
                answersMap.put(questionName, answerRequest.getAnswerValue());
            }
        }

        SurveyResponse response = SurveyResponse.builder()
            .survey(survey)
            .build();

        for (Map.Entry<String, String> entry : answersMap.entrySet()) {
            response.getAnswers().add(ResponseAnswer.builder()
                .surveyResponse(response)
                .questionName(entry.getKey())
                .answerValue(entry.getValue())
                .build());
        }

        SurveyResponse savedResponse = responseRepository.saveAndFlush(response);

        List<PendingCertificateFile> pendingCertificateFiles = new ArrayList<>();
        if (certificates != null) {
            Tika tika = new Tika();
            for (MultipartFile file : certificates) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                try {
                    byte[] content = file.getBytes();
                    String mimeType = tika.detect(content);
                    if (!"application/pdf".equalsIgnoreCase(mimeType)) {
                        throw new InvalidFileException("Only PDF files are accepted");
                    }
                    pendingCertificateFiles.add(new PendingCertificateFile(
                        file.getOriginalFilename() == null ? "certificate.pdf" : file.getOriginalFilename(),
                        content
                    ));
                } catch (IOException ex) {
                    throw new InvalidFileException("Unable to read uploaded certificate file");
                }
            }
        }

        if (!pendingCertificateFiles.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    certificateService.storeCertificatesAsync(savedResponse.getId(), pendingCertificateFiles);
                }
            });
        }

        Set<Long> shortlistedIds = shortlistRepository.findShortlistedResponseIdsBySurveyId(surveyId);
        return toResponseItem(savedResponse, answersMap, List.of(), shortlistedIds);
    }

    private Page<SurveyResponse> hydrateResponsePage(Page<SurveyResponse> page0) {
        List<Long> ids = page0.getContent().stream().map(SurveyResponse::getId).toList();
        if (ids.isEmpty()) {
            return page0;
        }
        Map<Long, SurveyResponse> loaded = responseRepository.findByIdIn(ids).stream()
            .collect(java.util.stream.Collectors.toMap(SurveyResponse::getId, r -> r));
        List<SurveyResponse> fullContent = ids.stream()
            .map(id -> loaded.getOrDefault(id, page0.getContent().stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .orElseThrow()))
            .toList();
        return new org.springframework.data.domain.PageImpl<>(fullContent, page0.getPageable(), page0.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PaginatedResponseWrapper getResponses(Long surveyId, int page, int pageSize, String email, Boolean shortlistedOnly) {
        int normalizedPage = Math.max(page, 1);
        int normalizedPageSize = Math.min(Math.max(pageSize, 1), 100);
        PageRequest pageable = PageRequest.of(normalizedPage - 1, normalizedPageSize);
        Set<Long> shortlistedIds = shortlistRepository.findShortlistedResponseIdsBySurveyId(surveyId);

        Page<SurveyResponse> results;
        boolean vaultOnly = Boolean.TRUE.equals(shortlistedOnly);

        if (vaultOnly) {
            if (email == null || email.isBlank()) {
                results = hydrateResponsePage(shortlistRepository.findShortlistedResponsesBySurveyId(surveyId, pageable));
            } else {
                results = hydrateResponsePage(
                    shortlistRepository.findShortlistedResponsesBySurveyIdAndEmailPrefix(surveyId, email.trim(), pageable)
                );
            }
        } else if (email == null || email.isBlank()) {
            results = responseRepository.findBySurveyIdOrderByDateRespondedDesc(surveyId, pageable);
        } else {
            Page<SurveyResponse> page0 = responseRepository.findBySurveyIdAndEmailPrefix(surveyId, email.trim(), pageable);
            results = hydrateResponsePage(page0);
        }

        List<QuestionResponseItemDto> items = results.stream()
            .map(response -> toResponseItem(response, null, null, shortlistedIds))
            .toList();

        return PaginatedResponseWrapper.builder()
            .currentPage(normalizedPage)
            .lastPage(Math.max(results.getTotalPages(), 1))
            .pageSize(normalizedPageSize)
            .totalCount(results.getTotalElements())
            .questionResponses(items)
            .build();
    }

    private QuestionResponseItemDto toResponseItem(
        SurveyResponse response,
        Map<String, String> overrideAnswers,
        List<CertificateResponseDto> overrideCertificates,
        Set<Long> shortlistedIds
    ) {
        LinkedHashMap<String, String> answers = new LinkedHashMap<>();
        if (overrideAnswers != null) {
            answers.putAll(overrideAnswers);
        } else if (response.getAnswers() != null) {
            for (ResponseAnswer answer : response.getAnswers()) {
                answers.put(answer.getQuestionName(), answer.getAnswerValue());
            }
        }

        List<CertificateResponseDto> certificates = overrideCertificates;
        if (certificates == null) {
            certificates = response.getCertificates() == null ? List.of() : response.getCertificates().stream()
                .map(certificateService::toResponseDto)
                .toList();
        }

        boolean shortlisted = shortlistedIds != null && shortlistedIds.contains(response.getId());

        return QuestionResponseItemDto.builder()
            .responseId(response.getId())
            .answers(answers)
            .certificates(certificates)
            .dateResponded(response.getDateResponded() == null ? DATE_TIME_FORMATTER.format(LocalDateTime.now()) : DATE_TIME_FORMATTER.format(response.getDateResponded()))
            .shortlisted(shortlisted)
            .build();
    }
}
