package com.skyworld.survey.service;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PendingCertificateFile {

    private String originalFileName;
    private byte[] content;
}
