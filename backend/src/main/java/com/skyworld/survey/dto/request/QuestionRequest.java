package com.skyworld.survey.dto.request;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import com.skyworld.survey.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JacksonXmlRootElement(localName = "question")
public class QuestionRequest {

    @JacksonXmlProperty(localName = "name")
    @NotBlank
    @Pattern(regexp = "^[a-z][a-z0-9_]*$")
    private String name;

    @JacksonXmlProperty(localName = "type")
    @NotNull
    private QuestionType type;

    @JacksonXmlProperty(localName = "text")
    @NotBlank
    private String text;

    @JacksonXmlProperty(localName = "description")
    private String description;

    @JacksonXmlProperty(localName = "required")
    @NotNull
    private Boolean required;

    @JacksonXmlProperty(localName = "order_index")
    @NotNull
    private Integer orderIndex;

    @JacksonXmlProperty(localName = "file_format")
    private String fileFormat;

    @JacksonXmlProperty(localName = "max_file_size_mb")
    private Integer maxFileSizeMb;

    @JacksonXmlProperty(localName = "multiple_files")
    private Boolean multipleFiles;

    @Valid
    @Builder.Default
    @JacksonXmlElementWrapper(localName = "options")
    @JacksonXmlProperty(localName = "option")
    private List<QuestionOptionRequest> options = new ArrayList<>();
}
