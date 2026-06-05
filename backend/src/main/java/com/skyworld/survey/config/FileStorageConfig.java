package com.skyworld.survey.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.file.Path;
import java.nio.file.Paths;

@Data
@ConfigurationProperties(prefix = "file")
public class FileStorageConfig {

    private String uploadPath;

    public Path uploadDirectory() {
        return Paths.get(uploadPath == null ? "media file" : uploadPath).toAbsolutePath().normalize();
    }
}
