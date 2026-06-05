package com.skyworld.survey.service;

import com.skyworld.survey.config.FileStorageConfig;
import com.skyworld.survey.dto.response.CertificateResponseDto;
import com.skyworld.survey.entity.Certificate;
import com.skyworld.survey.entity.SurveyResponse;
import com.skyworld.survey.exception.ResourceNotFoundException;
import com.skyworld.survey.repository.CertificateRepository;
import com.skyworld.survey.repository.ResponseRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final ResponseRepository responseRepository;
    private final FileStorageConfig fileStorageConfig;

    @Async("fileStorageExecutor")
    @Transactional
    public CompletableFuture<Void> storeCertificatesAsync(Long responseId, List<PendingCertificateFile> files) {
        if (files == null || files.isEmpty()) {
            return CompletableFuture.completedFuture(null);
        }

        SurveyResponse response = responseRepository.findById(responseId)
            .orElseThrow(() -> new ResourceNotFoundException("Survey response not found"));

        try {
            Path uploadDir = fileStorageConfig.uploadDirectory();
            Files.createDirectories(uploadDir);

            for (PendingCertificateFile file : files) {
                String originalName = file.getOriginalFileName();
                String extension = FilenameUtils.getExtension(originalName);
                String storedName = UUID.randomUUID() + (extension == null || extension.isBlank() ? "" : "." + extension);
                Path storedPath = uploadDir.resolve(storedName);
                Files.write(storedPath, file.getContent(), StandardOpenOption.CREATE_NEW);

                certificateRepository.save(Certificate.builder()
                    .surveyResponse(response)
                    .fileName(originalName)
                    .filePath(storedPath.toString())
                    .build());
            }
            return CompletableFuture.completedFuture(null);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store certificates", ex);
        }
    }

    public Certificate findCertificate(Long id) {
        return certificateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Certificate not found"));
    }

    public CertificateResponseDto toResponseDto(Certificate certificate) {
        return CertificateResponseDto.builder()
            .id(certificate.getId())
            .fileName(certificate.getFileName())
            .build();
    }

    public Path resolvePath(Certificate certificate) {
        return Path.of(certificate.getFilePath());
    }

    public String getOriginalFilename(Certificate certificate) {
        return certificate.getFileName();
    }
}
