package com.skyworld.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JacksonXmlRootElement(localName = "survey")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SurveyResponseDto {

    @JacksonXmlProperty(isAttribute = true)
    private Long id;

    private String name;

    private String description;

    @JacksonXmlProperty(localName = "created_at")
    private String createdAt;

    @JacksonXmlProperty(localName = "updated_at")
    private String updatedAt;
}
