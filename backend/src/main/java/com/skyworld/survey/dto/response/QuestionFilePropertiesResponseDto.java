package com.skyworld.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JacksonXmlRootElement(localName = "file_properties")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestionFilePropertiesResponseDto {

    @JacksonXmlProperty(isAttribute = true)
    private String format;

    @JacksonXmlProperty(isAttribute = true, localName = "max_file_size")
    private Integer maxFileSize;

    @JacksonXmlProperty(isAttribute = true, localName = "max_file_size_unit")
    private String maxFileSizeUnit;

    @JsonSerialize(using = BooleanYesNoSerializer.class)
    @JacksonXmlProperty(isAttribute = true)
    private Boolean multiple;
}
