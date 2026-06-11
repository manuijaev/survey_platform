package com.skyworld.survey.controller;

import com.skyworld.survey.entity.Certificate;
import com.skyworld.survey.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

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
        return streamCertificate(id, false);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<StreamingResponseBody> preview(@PathVariable Long id) {
        return streamCertificate(id, true);
    }

    private ResponseEntity<StreamingResponseBody> streamCertificate(Long id, boolean inline) {
        Certificate certificate = certificateService.findCertificate(id);
        Path path = certificateService.resolvePath(certificate);
        if (!Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.GONE, "Certificate file no longer exists");
        }

        String filename = certificateService.getOriginalFilename(certificate);
        StreamingResponseBody body = outputStream -> {
            try (InputStream in = Files.newInputStream(path)) {
                in.transferTo(outputStream);
            }
        };

        String dispositionType = inline ? "inline" : "attachment";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + filename + "\"")
            .contentType(resolveMediaType(filename))
            .body(body);
    }

    private MediaType resolveMediaType(String filename) {
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
