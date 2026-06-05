package com.skyworld.survey.controller;

import com.skyworld.survey.entity.Certificate;
import com.skyworld.survey.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/{id}")
    public ResponseEntity<StreamingResponseBody> download(@PathVariable Long id) {
        Certificate certificate = certificateService.findCertificate(id);
        Path path = certificateService.resolvePath(certificate);
        if (!Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.GONE, "Certificate file no longer exists");
        }

        StreamingResponseBody body = outputStream -> {
            try (InputStream in = Files.newInputStream(path)) {
                in.transferTo(outputStream);
            }
        };

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + certificateService.getOriginalFilename(certificate) + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(body);
    }
}
