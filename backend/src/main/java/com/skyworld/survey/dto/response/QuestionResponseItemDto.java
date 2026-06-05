package com.skyworld.survey.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JacksonXmlRootElement(localName = "question_response")
@JsonSerialize(using = DynamicResponseSerializer.class)
public class QuestionResponseItemDto {

    private Long responseId;
    private LinkedHashMap<String, String> answers;
    private List<CertificateResponseDto> certificates;
    private String dateResponded;
}
