package com.skyworld.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
@JacksonXmlRootElement(localName = "question")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestionResponseDto {

    @JacksonXmlProperty(isAttribute = true)
    private Long id;

    @JacksonXmlProperty(isAttribute = true)
    private String name;

    @JacksonXmlProperty(isAttribute = true)
    private String type;

    @JsonSerialize(using = BooleanYesNoSerializer.class)
    @JacksonXmlProperty(isAttribute = true)
    private Boolean required;

    private String text;

    private String description;

    @JsonIgnore
    private Integer orderIndex;

    private QuestionOptionsResponseDto options;

    @JacksonXmlProperty(localName = "file_properties")
    private QuestionFilePropertiesResponseDto fileProperties;
}
